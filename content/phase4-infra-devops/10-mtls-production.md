# 10 — mTLS & Production Security (Days 74–75)

> **Core Mental Model:** Zero-trust networking = "Network location pe trust mat karo." Koi bhi internal service bhi compromise ho sakti hai. Har service-to-service communication authenticated aur encrypted hona chahiye. Identity network address pe based nahi, cryptographic certificate pe based.

---

## TLS vs mTLS

```
Regular TLS (one-way):
  Client → Server: "Tum kaun ho? Certificate dikhao."
  Server → Client: Certificate present karta hai
  Client: Certificate verify karta hai (trusted CA se signed?)
  Client: Server authenticated ✅
  Server: Client authenticated ❌ (server ko pata nahi kaun connect kar raha)
  
  Use case: Browser → HTTPS Website (server identity verify, client unknown)

mTLS (mutual TLS / two-way):
  Client → Server: "Tum kaun ho? Certificate dikhao."
  Server → Client: Certificate present karta hai
  Client: Server certificate verify karta hai ✅
  Server → Client: "Tum kaun ho? Certificate dikhao."
  Client → Server: Certificate present karta hai
  Server: Client certificate verify karta hai ✅
  
  BOTH sides authenticated!
  Use case: Service-to-service (order-service → user-service both identify themselves)
```

---

## mTLS Handshake Diagram

```
order-service (client)          user-service (server)
       │                               │
       │── ClientHello ──────────────→ │  (TLS version, cipher suites)
       │                               │
       │ ←──── ServerHello ────────── │  (chosen cipher, server cert)
       │ ←──── Certificate ────────── │  (server's cert: user-service.company.internal)
       │ ←──── CertificateRequest ─── │  ← mTLS only! "Client cert bhi chahiye"
       │ ←──── ServerHelloDone ─────  │
       │                               │
       │ Verify server cert:           │
       │   Signed by trusted CA? ✅    │
       │   CN matches user-service? ✅ │
       │   Not expired? ✅             │
       │                               │
       │── Certificate ──────────────→ │  (client's cert: order-service.company.internal)
       │── ClientKeyExchange ────────→ │
       │── CertificateVerify ────────→ │
       │── ChangeCipherSpec ─────────→ │
       │── Finished ─────────────────→ │
       │                               │
       │                               │ Verify client cert:
       │                               │   Signed by trusted CA? ✅
       │                               │   CN = order-service? ✅
       │                               │   Allowed to call me? (policy check)
       │ ←── ChangeCipherSpec ──────── │
       │ ←── Finished ─────────────── │
       │                               │
       │═══════ Encrypted + Authenticated Connection ═════│
       │                               │
       │── POST /api/v1/users/profile→ │  (encrypted, both sides verified)
       │ ←── 200 OK ────────────────── │
```

---

## Why Security Groups Are Not Enough

```
Traditional approach (network perimeter security):
  "order-service ka IP 10.0.1.5 hai, user-service ka 10.0.2.3 hai"
  Security group: "10.0.1.5 se 10.0.2.3:8080 allow"
  
  Problems:
  1. IP-based identity weak:
     - IP reassigned ho sakta hai (pod restart → new IP → same SG rule applies to attacker)
     - ARP spoofing (IP spoofing attacks)
     - IP share hota hai (multiple pods same node)
  
  2. Blast radius:
     - order-service compromised → attacker gets 10.0.1.5 IP
     - Still allowed to call user-service (SG says IP allowed)
     - Zero detection that caller is malicious
  
  3. East-West traffic:
     - SGs protect North-South (internet-to-service)
     - East-West (service-to-service) = same VPC → often open!
     - Internal attacker can call any service

mTLS approach:
  Every service has cryptographic identity (certificate)
  Order-service → user-service: presents certificate
  User-service verifies: "Is this actually order-service's cert, signed by our CA?"
  Even if attacker has order-service's IP → doesn't have order-service's private key
  Certificate = unforgeable identity
```

---

## SPIFFE/SPIRE — Workload Identity

```
SPIFFE (Secure Production Identity Framework For Everyone):
  Standard for service identity in dynamic environments
  K8s pods come and go, IPs change — need stable identity
  
SPIFFE Identity format:
  spiffe://trust-domain/path
  
  Example:
  spiffe://company.internal/ns/production/sa/order-service
  
  trust-domain: company.internal (your org's domain)
  ns:           Kubernetes namespace
  sa:           Kubernetes Service Account name
  
  Identity = "This workload is running as 'order-service' service account 
              in 'production' namespace of 'company.internal'"
  
  Same identity regardless of:
    - Pod IP (changes on restart)
    - Node hostname
    - Deployment name
```

```
SPIRE Architecture (SPIFFE implementation):

┌─────────────────────────────────────────────┐
│           SPIRE Server                       │
│   - Manages signing keys                    │
│   - Issues SVIDs (SPIFFE Verifiable ID Docs)│
│   - Validates node attestation              │
│   - Runs in K8s (StatefulSet, HA)           │
└──────────────┬──────────────────────────────┘
               │ mTLS
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌───────┐  ┌───────┐  ┌───────┐
│SPIRE  │  │SPIRE  │  │SPIRE  │
│Agent  │  │Agent  │  │Agent  │
│Node 1 │  │Node 2 │  │Node 3 │
│       │  │       │  │       │
│[Pod A]│  │[Pod B]│  │[Pod C]│
└───────┘  └───────┘  └───────┘

SPIRE Agent (DaemonSet — one per node):
  - Verifies workloads on its node
  - Issues short-lived certs (SVIDs) to pods via Unix socket
  - Pods: /run/spire/sockets/agent.sock se SVID request karo

SVID (SPIFFE Verifiable Identity Document):
  = X.509 certificate with SPIFFE URI in SAN field
  Subject Alternative Name: spiffe://company.internal/ns/prod/sa/order-service
  TTL: typically 1 hour (auto-rotated)
```

---

## Service Mesh — Transparent mTLS

```
Problem: Every microservice mein mTLS code likhna? No.
         Go, Python, Java, Node — har language mein TLS implementation?
         Too much work, easy to mess up.

Service Mesh solution (Istio/Linkerd):
  sidecar proxy (Envoy) automatically handle karta hai mTLS
  Application code ZERO changes
  
  Without mesh:
    order-service code → HTTP → user-service code
    (no encryption, no authentication)
  
  With mesh:
    order-service code → HTTP (localhost) → Envoy sidecar (order-service pod)
                → mTLS encrypted tunnel → Envoy sidecar (user-service pod)
                → HTTP (localhost) → user-service code
    
    App code sirf localhost HTTP karta hai.
    Sidecar transparently karta hai: cert management, mTLS, retries, circuit breaking.
```

```yaml
# Istio — enable mTLS for entire namespace
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT     # STRICT = mTLS required, plain HTTP reject
                     # PERMISSIVE = both mTLS and plain allowed (migration)
---
# Authorization Policy: order-service user-service ko hi call kar sake
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: user-service-authz
  namespace: production
spec:
  selector:
    matchLabels:
      app: user-service
  rules:
    - from:
        - source:
            # SPIFFE identity check!
            principals:
              - "cluster.local/ns/production/sa/order-service"
              - "cluster.local/ns/production/sa/api-gateway"
      to:
        - operation:
            methods: ["GET", "POST"]
            paths: ["/api/v1/users/*"]
  # Any other caller (even internal) → 403 Forbidden
```

---

## Cert Rotation — Automated Short-Lived Certs

```
Static certs (❌ bad):
  - 1 year expiry
  - Rotation: manual process, calendar reminder, often missed
  - Incident: "cert expires at midnight Friday!" emergency
  - Compromise window: 1 year if private key leaked

Short-lived certs with auto-rotation (✅ good):
  - 24h expiry (SPIRE default: 1 hour)
  - Rotation: automatic (SPIRE Agent handles it)
  - No manual expiry management
  - Compromise window: 1 hour max
  
Rotation flow (SPIRE):
  11:00 AM: Cert issued (spiffe://company.internal/ns/prod/sa/order-service, expires 12:00)
  11:45 AM: SPIRE Agent: "15 min remaining, rotate karo"
  11:45 AM: New cert issued (expires 12:45)
  12:00 AM: Old cert expires (but new cert already in use since 11:45)
  App: new cert se connections use karta hai (connection pool refresh)
  
  Zero manual intervention required!
```

---

## Zero-Trust in Practice

```
Zero-Trust Principles:
  1. "Never trust, always verify" — no implicit trust based on network location
  2. Least privilege — minimum access needed
  3. Assume breach — design as if network already compromised
  4. Verify explicitly — every request, every time

Implementation checklist:
  
  Network Level:
  ☐ mTLS for all service-to-service communication
  ☐ Authorization policies (who can call whom)
  ☐ No default-allow rules in security groups for east-west traffic
  
  Identity Level:
  ☐ Workload identity (SPIFFE/SPIRE) not IP-based identity
  ☐ Short-lived credentials (1h max) not long-lived
  ☐ Certificate rotation automated
  
  Access Level:
  ☐ Vault dynamic secrets (per-service DB credentials)
  ☐ IAM roles least privilege (no wildcard *)
  ☐ K8s RBAC (service accounts minimum permissions)
  
  Observability:
  ☐ All service-to-service calls logged (auth success/failure)
  ☐ Certificate expiry monitoring
  ☐ Unusual access patterns → alert
  
  Incident Response:
  ☐ Workload identity revocation (SPIRE: delete entry → no new certs)
  ☐ Vault lease revocation (dynamic secrets invalidated immediately)
  ☐ K8s: pod delete → new pod gets new identity
```

---

## Production Setup: Istio + SPIRE + Vault

```
Complete secure service-to-service communication:

1. SPIRE: workload identity
   → order-service pod gets SVID: spiffe://company.internal/ns/prod/sa/order-service
   → user-service pod gets SVID: spiffe://company.internal/ns/prod/sa/user-service

2. Istio: transparent mTLS using SPIRE-issued SVIDs
   → order-service → user-service: mTLS with SPIFFE identity
   → AuthorizationPolicy: only order-service can call user-service /users/* endpoints
   → Mutual authentication: both services verify each other

3. Vault: dynamic secrets for DB
   → user-service authenticates to Vault via K8s Service Account
   → Gets dynamic PostgreSQL creds (expire in 1h)
   → Vault Agent sidecar auto-renews credentials

4. Vault PKI: internal CA for non-mesh services
   → Admin dashboard (no sidecar): gets cert from Vault PKI
   → mTLS to internal APIs

Result:
  - Every connection encrypted
  - Every caller authenticated (cryptographic proof)
  - Credentials short-lived (auto-rotate)
  - Compromise blast radius: single workload, 1h window max
  - Audit trail: every secret access, every cert issuance logged
```

---

## Interview: mTLS vs TLS vs API Keys

```
Q: "Service-to-service authentication ke liye API keys vs mTLS?"

API Keys:
  ✅ Simple to implement
  ✅ Works with any HTTP client
  ❌ Long-lived (rotation painful, often skipped)
  ❌ Shared secrets (if leaked, hard to identify which service leaked)
  ❌ Not cryptographically bound to service identity
  ❌ Revocation: change key → update all consumers

mTLS:
  ✅ Cryptographic identity (certificate = unforgeable)
  ✅ Short-lived (1h auto-rotate)
  ✅ Both sides verified
  ✅ Revocation: certificate expires automatically
  ❌ More complex setup (CA, cert management, rotation automation)
  ❌ Debugging harder (TLS errors opaque)

For 50M users / 50+ microservices:
  mTLS + service mesh (Istio) = correct answer
  API keys = acceptable for external partners only (not internal services)
  
Q: "Zero-trust network kya hota hai?"

Answer: Network pe trust mat karo. Security group "allow all internal" approach wrong hai.
Har request explicitly verified honi chahiye — caller ki identity, permission check, encryption.
SPIFFE + mTLS = cryptographic identity. Vault = no static secrets. Least privilege IAM = minimum access.
```
