# 09 — Vault & Secret Management (Days 72–73)

> **Core Mental Model:** Secrets infrastructure mein hain, code mein nahi. Dynamic secrets static secrets se better hain — auto-expire hoti hain, per-service hoti hain, compromise hone pe blast radius limited hota hai. Vault = central secret authority.

---

## The Problem With Static Secrets

```
Environment variable approach (❌ BAD):
  DB_PASSWORD=super_secret_password
  
  Problems:
  1. Rotation pain: change karo → redeploy all services
  2. Over-sharing: 50 microservices → all share SAME DB password
     One service compromised → all DBs exposed
  3. Drift: password last rotate kab hua? Unknown.
  4. Audit trail: koi service ne password use kiya → no visibility
  5. Env vars leak: process list, logs, crash dumps mein appear ho sakte hain

Vault dynamic secrets approach (✅ GOOD):
  Service A requests DB credentials → Vault creates unique creds for A
  Service B requests DB credentials → Vault creates unique creds for B
  Creds expire in 1 hour automatically
  Service A compromised → revoke A's creds only → Service B unaffected
  Audit log: Service A ne creds request ki 14:32 pe, use ki 14:33 pe
```

---

## Vault Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         HashiCorp Vault                      │
│                                                             │
│  Auth Methods         Secret Engines          Audit Logs   │
│  ┌──────────┐        ┌─────────────┐         ┌──────────┐  │
│  │ AppRole  │        │ KV v2       │         │ File     │  │
│  │ K8s      │        │ (static)    │         │ Syslog   │  │
│  │ AWS IAM  │        ├─────────────┤         └──────────┘  │
│  │ OIDC     │        │ Database    │                        │
│  └──────────┘        │ (dynamic)   │         Policies       │
│                      ├─────────────┤         ┌──────────┐  │
│  Storage Backend     │ Transit     │         │ HCL ACLs │  │
│  ┌──────────┐        │ (encryption)│         └──────────┘  │
│  │ Raft     │        ├─────────────┤                        │
│  │ (HA)     │        │ PKI         │                        │
│  └──────────┘        │ (certs)     │                        │
│                      └─────────────┘                        │
└─────────────────────────────────────────────────────────────┘

Auth Methods: "Who are you?" Verify karta hai
Secret Engines: "Kya chahiye?" Secret create/retrieve karta hai
Policies: "Kya access hai?" Control karta hai
Audit: "Kya hua?" Log karta hai
```

---

## KV v2 — Static Secrets

```bash
# Simple key-value secret storage
# Version history, soft delete support

# Write
vault kv put secret/user-service/production \
  db_url="postgres://user:pass@rds.amazonaws.com:5432/users" \
  jwt_secret="$(openssl rand -hex 32)"

# Read
vault kv get secret/user-service/production

# Get specific field
vault kv get -field=db_url secret/user-service/production

# Version history
vault kv get -version=2 secret/user-service/production

# Policy (HCL)
path "secret/data/user-service/production" {
  capabilities = ["read"]
}
# user-service sirf apna secret read kar sakti hai, dusre ki nahi
```

---

## Dynamic Secrets — Database Engine

```
How it works:
  1. Vault se pehle karo: DB admin credentials configure
  2. Service → Vault: "Mujhe user-service ke liye DB creds chahiye"
  3. Vault → DB: "CREATE USER vault-user-service-abc123 WITH PASSWORD 'random'"
                 "GRANT SELECT, INSERT, UPDATE ON users_schema TO vault-user-service-abc123"
  4. Vault → Service: username=vault-user-service-abc123, password=..., TTL=1h
  5. Service: DB connection karo with these creds
  6. After 1h: Vault → DB: "DROP USER vault-user-service-abc123"
               (or on service explicit revoke)
```

```bash
# Vault setup (admin karta hai once)
vault secrets enable database

vault write database/config/users-db \
  plugin_name=postgresql-database-plugin \
  allowed_roles="user-service,order-service" \
  connection_url="postgresql://{{username}}:{{password}}@rds.amazonaws.com:5432/users" \
  username="vault-admin" \
  password="admin-password"

# Role define karo (kya creds banaenge)
vault write database/roles/user-service \
  db_name=users-db \
  creation_statements="
    CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}';
    GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";
  " \
  default_ttl="1h" \
  max_ttl="24h"

# Service se dynamic creds request karo
vault read database/creds/user-service
# Output:
# Key                Value
# ---                -----
# lease_id           database/creds/user-service/xyz123
# lease_duration     1h
# username           v-approl-user-ser-RANDOM
# password           A1a-RANDOM-RANDOM

# Revoke before expiry (service stop/compromise)
vault lease revoke database/creds/user-service/xyz123
```

---

## Transit Engine — Encryption as a Service

```
App ko encryption keys manage nahi karni padtein.
App Vault ko plaintext bhejta hai, ciphertext wapas milta hai.
Keys kabhi app ke paas nahi aatein.

Use cases:
  - PII encryption (Aadhaar, phone numbers, email IDs)
  - Payment card data encryption before DB store
  - Sensitive config fields encryption

Mental model:
  App → Vault: "Encrypt this: 9876543210"
  Vault: AES-256-GCM se encrypt karta hai (key app ko nahi pata)
  Vault → App: "vault:v1:ENCRYPTED_BASE64_DATA"
  App: stores in DB: users.phone = "vault:v1:ENCRYPTED_BASE64_DATA"
  
  Decrypt:
  App → Vault: "Decrypt: vault:v1:ENCRYPTED_BASE64_DATA"
  Vault → App: "9876543210"
  
  Key rotation:
  Vault admin: vault write transit/keys/user-phone/rotate
  New ciphertext uses new key version (v2)
  Old data (v1) still decryptable until re-encrypted
  
  Vault admin: vault write transit/keys/user-phone/rewrap_minimum_version=2
  App: re-encrypt old v1 data (gradually)
```

```go
// Go Transit engine usage
package encryption

import (
    "encoding/base64"
    vault "github.com/hashicorp/vault/api"
)

type VaultEncryptor struct {
    client  *vault.Client
    keyName string
}

func (e *VaultEncryptor) Encrypt(plaintext string) (string, error) {
    encoded := base64.StdEncoding.EncodeToString([]byte(plaintext))
    
    secret, err := e.client.Logical().Write(
        "transit/encrypt/"+e.keyName,
        map[string]interface{}{
            "plaintext": encoded,
        },
    )
    if err != nil {
        return "", fmt.Errorf("vault encrypt: %w", err)
    }
    
    ciphertext, ok := secret.Data["ciphertext"].(string)
    if !ok {
        return "", errors.New("vault: invalid ciphertext response")
    }
    return ciphertext, nil   // "vault:v1:ABC123..."
}

func (e *VaultEncryptor) Decrypt(ciphertext string) (string, error) {
    secret, err := e.client.Logical().Write(
        "transit/decrypt/"+e.keyName,
        map[string]interface{}{
            "ciphertext": ciphertext,
        },
    )
    if err != nil {
        return "", fmt.Errorf("vault decrypt: %w", err)
    }
    
    encoded := secret.Data["plaintext"].(string)
    decoded, err := base64.StdEncoding.DecodeString(encoded)
    if err != nil {
        return "", fmt.Errorf("base64 decode: %w", err)
    }
    return string(decoded), nil
}
```

---

## PKI Engine — Internal Certificate Authority

```
Problem: Internal services mein TLS certificates kaise manage karein?
         Public CA (Let's Encrypt) = internet-facing only
         Manual cert management = painful, error-prone, rotation forgotten

Vault PKI = Internal CA
  Vault → issues certs for internal services
  Short-lived (24h TTL) → auto-rotation → no "forgot to renew" incidents
  SPIFFE-compatible → workload identity (next file mein)

Benefits:
  - On-demand cert issuance (no waiting, no tickets)
  - Short TTL → compromise window small
  - Automatic rotation via Vault Agent
  - Audit log: kab koi cert issue hua
```

```bash
# PKI engine setup
vault secrets enable pki
vault secrets tune -max-lease-ttl=87600h pki

# Root CA generate karo
vault write pki/root/generate/internal \
  common_name="company.internal" \
  ttl=87600h   # 10 years (root CA)

# Intermediate CA (better practice)
vault secrets enable -path=pki_int pki
vault write pki_int/intermediate/generate/internal \
  common_name="company Intermediate CA"

# Certificate role
vault write pki_int/roles/user-service \
  allowed_domains="user-service.default.svc.cluster.local" \
  allow_subdomains=true \
  max_ttl="24h"   # certificates valid for 24 hours only

# Issue certificate (service karta hai)
vault write pki_int/issue/user-service \
  common_name="user-service.default.svc.cluster.local" \
  ttl=24h
# Returns: certificate, private_key, issuing_ca
```

---

## AppRole — Service Authentication

```
Question: Service Vault se authenticate kaise kare?
          "Chicken and egg: secret access ke liye secret chahiye"

AppRole:
  Two components:
  1. RoleID:   public (like username), static, per-application
  2. SecretID: private (like password), short-lived, rotate frequently
  
  Both together → Vault Token → Secret access
  
  SecretID delivery (secure):
    CI/CD pipeline: deploy karte waqt SecretID inject karo (one-time use)
    Vault Agent: handle karta hai automatically in K8s
    Trusted orchestrator (K8s SA): K8s auth better option
```

```bash
# Setup AppRole for user-service
vault auth enable approle

vault write auth/approle/role/user-service \
  token_policies="user-service-policy" \
  token_ttl=1h \
  token_max_ttl=4h \
  secret_id_ttl=24h \        # SecretID expires in 24h
  secret_id_num_uses=0        # Unlimited uses within TTL

# Get RoleID (permanent, non-secret)
vault read auth/approle/role/user-service/role-id
# role_id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Generate SecretID (per deployment)
vault write -f auth/approle/role/user-service/secret-id
# secret_id:        yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
# secret_id_ttl:    24h

# Login
vault write auth/approle/login \
  role_id="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" \
  secret_id="yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy"
# Returns: token (1h valid)
```

---

## Vault Agent — K8s Sidecar Pattern

```
Problem: App code mein Vault logic nahi hona chahiye.
         Vault token renewal, secret rotation, file updates = boilerplate.

Vault Agent:
  - Sidecar container in K8s Pod
  - App se pehle start hota hai (init container style)
  - Vault se authenticate karta hai (K8s Service Account se)
  - Secrets tmpfs volume pe write karta hai (memory-only, no disk)
  - Token auto-renewal karta hai
  - Secrets change hone pe template re-render karta hai

App: simply file read karta hai /vault/secrets/config.env
     Vault logic zero in app code!
```

```yaml
# K8s Pod with Vault Agent sidecar
apiVersion: v1
kind: ServiceAccount
metadata:
  name: user-service
  annotations:
    vault.hashicorp.com/role: "user-service"    # Vault role name
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  template:
    metadata:
      annotations:
        # Vault Agent Injector automatically injects sidecar
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/role: "user-service"
        
        # Which secret, as what file
        vault.hashicorp.com/agent-inject-secret-config.env: "secret/data/user-service/production"
        
        # Template: secret ko env file format mein
        vault.hashicorp.com/agent-inject-template-config.env: |
          {{- with secret "secret/data/user-service/production" -}}
          export DB_URL="{{ .Data.data.db_url }}"
          export JWT_SECRET="{{ .Data.data.jwt_secret }}"
          export REDIS_URL="{{ .Data.data.redis_url }}"
          {{- end }}
    
    spec:
      serviceAccountName: user-service
      containers:
        - name: user-service
          image: user-service:abc1234
          command: ["sh", "-c", "source /vault/secrets/config.env && exec /server"]
          # OR: read file programmatically in Go
```

```go
// Go: read secrets from Vault Agent rendered file
func loadSecrets() (*Config, error) {
    // Vault Agent ne /vault/secrets/db-creds.json write kiya hai
    data, err := os.ReadFile("/vault/secrets/db-creds.json")
    if err != nil {
        return nil, fmt.Errorf("read vault secrets: %w", err)
    }
    
    var creds struct {
        Username string `json:"username"`
        Password string `json:"password"`
    }
    if err := json.Unmarshal(data, &creds); err != nil {
        return nil, fmt.Errorf("parse vault secrets: %w", err)
    }
    
    return &Config{
        DBUser:     creds.Username,
        DBPassword: creds.Password,
    }, nil
}
```

---

## Why Environment Variables for Secrets Are Wrong

```
❌ Never do this:
  DB_PASSWORD=super_secret
  JWT_KEY=another_secret
  
Reasons:
  1. Process listing:
     ps aux → shows env vars in old Linux kernels / some debugging tools
     /proc/<pid>/environ → readable by root (and some exploits)
  
  2. Logging libraries: accidentally log request context (which contains env vars)
     structuredlog.Info("request", "env", os.Environ()) → oops
  
  3. Core dumps: crash dump contains env vars
  
  4. Child processes: env vars inherited by all child processes
     One child logs env → leaked
  
  5. Container inspection:
     docker inspect container_name → shows env vars!
     kubectl describe pod user-service → env vars visible to K8s admins
  
✅ Correct approach:
  - Vault Agent: secrets as files in tmpfs (/vault/secrets/)
  - External Secrets Operator: K8s Secret (with etcd encryption)
  - AWS SDK: IAM role → Secrets Manager direct API call at startup
  
  Application reads from file or API, not env vars for sensitive data.
```
