# 05 — API Security Hardening (OWASP API Top 10)

> **Scenario:** OWASP API Security Top 10 — yeh list real production breaches se bani hai. Har point pe ek real company ka data leak hua. 50M users ka data agar leak ho → company ki death.

---

## OWASP API Security Top 10 (2023)

```
API1:  Broken Object Level Authorization (BOLA)
API2:  Broken Authentication
API3:  Broken Object Property Level Authorization
API4:  Unrestricted Resource Consumption
API5:  Broken Function Level Authorization
API6:  Unrestricted Access to Sensitive Business Flows
API7:  Server Side Request Forgery (SSRF)
API8:  Security Misconfiguration
API9:  Improper Inventory Management
API10: Unsafe Consumption of APIs
```

---

## API1: BOLA — Broken Object Level Authorization

### Most Common API Vulnerability

```
GET /api/orders/12345

User A is logged in. They modify request:
GET /api/orders/12346   ← someone else's order

Server returns 12346's data to user A?
→ BOLA. User A can read ANY order.

Real example: First American Financial (2019) — 885 million records exposed.
```

```go
// ❌ VULNERABLE
func GetOrder(ctx context.Context, r *http.Request) {
    orderID := r.URL.Query().Get("order_id")
    order, _ := db.GetOrder(ctx, orderID)  // no ownership check!
    json.NewEncoder(w).Encode(order)
}

// ✅ SECURE — ALWAYS check ownership
func GetOrder(ctx context.Context, r *http.Request) {
    userID := getUserIDFromToken(r)  // from JWT
    orderID := r.URL.Query().Get("order_id")
    
    order, err := db.GetOrder(ctx, orderID)
    if err != nil {
        http.Error(w, "not found", 404)
        return
    }
    
    // Ownership check — EVERY TIME
    if order.UserID != userID {
        // Don't reveal existence: 404, not 403
        http.Error(w, "not found", 404)
        return
    }
    
    json.NewEncoder(w).Encode(order)
}

// Even better: query with user_id in WHERE clause
// DB level ownership check — can't be bypassed
func GetOrder(ctx context.Context, userID, orderID string) (*Order, error) {
    return db.QueryRow(ctx,
        "SELECT * FROM orders WHERE id = $1 AND user_id = $2",
        orderID, userID,  // user_id filter at DB level
    )
}
```

---

## API2: Broken Authentication

```go
// ❌ Common mistakes:
// 1. Weak JWT secrets
jwtSecret := "secret"  // guessable!

// 2. JWT without expiry
claims := jwt.MapClaims{"user_id": "123"}  // no exp claim

// 3. Not validating JWT properly
token, _ := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
    return []byte("secret"), nil  // doesn't check algorithm!
})

// ✅ Secure JWT validation
func ValidateToken(tokenString string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(
        tokenString,
        &Claims{},
        func(t *jwt.Token) (interface{}, error) {
            // MUST check algorithm
            if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
                return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
            }
            return jwtSecret, nil
        },
        jwt.WithExpirationRequired(),    // exp MUST be present
        jwt.WithIssuedAt(),              // iat validation
        jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Name}),
    )
    
    if err != nil {
        return nil, err
    }
    
    claims, ok := token.Claims.(*Claims)
    if !ok || !token.Valid {
        return nil, errors.New("invalid token")
    }
    
    return claims, nil
}
```

---

## API3: Broken Object Property Level Authorization

```go
// ❌ Mass Assignment — user sends extra fields, all get saved
type UpdateUserRequest struct {
    Name  string `json:"name"`
    Email string `json:"email"`
    Role  string `json:"role"`  // user shouldn't be able to set this!
    Plan  string `json:"plan"`  // paid plan override!
}

func UpdateUser(w http.ResponseWriter, r *http.Request) {
    var req UpdateUserRequest
    json.NewDecoder(r.Body).Decode(&req)
    db.UpdateUser(ctx, req)  // updates ALL fields including role!
}

// ✅ Separate input DTO from model
type UpdateUserInput struct {
    Name  *string `json:"name"`   // only allowed fields
    Email *string `json:"email"`  // pointer = optional
}

func UpdateUser(w http.ResponseWriter, r *http.Request) {
    var input UpdateUserInput
    json.NewDecoder(r.Body).Decode(&input)
    
    // Only update allowed fields — never role, plan, is_admin
    update := UserUpdate{}
    if input.Name != nil {
        update.Name = *input.Name
    }
    if input.Email != nil {
        update.Email = *input.Email
    }
    db.UpdateUserFields(ctx, userID, update)
}

// ❌ Over-exposure — returning sensitive fields
type User struct {
    ID           string `json:"id"`
    Email        string `json:"email"`
    PasswordHash string `json:"password_hash"`  // NEVER expose!
    SSN          string `json:"ssn"`             // NEVER expose!
    InternalNotes string `json:"internal_notes"` // NEVER expose!
}

// ✅ Response DTO
type UserResponse struct {
    ID    string `json:"id"`
    Email string `json:"email"`
    Name  string `json:"name"`
    // no sensitive fields
}
```

---

## API4: Unrestricted Resource Consumption

```go
// ❌ No limits on expensive operations
func SearchUsers(w http.ResponseWriter, r *http.Request) {
    query := r.URL.Query().Get("q")
    limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
    // limit=1000000? Server fetches 1M rows!
    users := db.Search(ctx, query, limit)
    json.NewEncoder(w).Encode(users)
}

// ✅ Hard limits everywhere
func SearchUsers(w http.ResponseWriter, r *http.Request) {
    query := r.URL.Query().Get("q")
    if len(query) < 2 {
        http.Error(w, "query too short", 422)
        return
    }
    if len(query) > 100 {
        http.Error(w, "query too long", 422)
        return
    }
    
    limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
    if limit <= 0 || limit > 100 {
        limit = 20  // sensible default
    }
    
    // Rate limit expensive search operations
    if !searchRateLimiter.Allow(userID) {
        http.Error(w, "too many requests", 429)
        return
    }
    
    users := db.Search(ctx, query, limit)
    json.NewEncoder(w).Encode(users)
}

// Also:
// - Max file upload size: r.Body = http.MaxBytesReader(w, r.Body, 10<<20) // 10MB
// - Max request body: same
// - Request timeout: always set
// - DB query timeout: always set
```

---

## API7: Server-Side Request Forgery (SSRF)

```
User sends: {"webhook_url": "http://169.254.169.254/latest/meta-data/iam/credentials"}
Your server fetches this URL → gets AWS IAM credentials → attacker steals them!

AWS metadata URL 169.254.169.254 → cloud credentials
Internal services: http://redis:6379, http://db:5432
```

```go
// ❌ VULNERABLE
func RegisterWebhook(r *http.Request) {
    var req struct {
        URL string `json:"url"`
    }
    json.NewDecoder(r.Body).Decode(&req)
    // validate webhook by fetching it
    resp, _ := http.Get(req.URL)  // SSRF!
}

// ✅ SECURE — validate URL before fetching
func validateWebhookURL(rawURL string) error {
    u, err := url.Parse(rawURL)
    if err != nil {
        return fmt.Errorf("invalid URL")
    }
    
    // Only HTTPS
    if u.Scheme != "https" {
        return fmt.Errorf("only HTTPS allowed")
    }
    
    // Resolve hostname to IPs, check each IP
    addrs, err := net.LookupHost(u.Hostname())
    if err != nil {
        return fmt.Errorf("DNS resolution failed")
    }
    
    for _, addr := range addrs {
        ip := net.ParseIP(addr)
        if ip == nil {
            return fmt.Errorf("invalid IP")
        }
        
        // Block private/internal ranges
        if ip.IsLoopback() || ip.IsPrivate() || ip.IsLinkLocalUnicast() {
            return fmt.Errorf("private IP not allowed")
        }
        
        // Block cloud metadata IPs
        blocked := []string{"169.254.169.254", "100.100.100.200"}
        for _, b := range blocked {
            if addr == b {
                return fmt.Errorf("metadata IP not allowed")
            }
        }
    }
    
    return nil
}
```

---

## Secrets Management

### ❌ Never Do This

```go
const DBPassword = "mysecretpassword"    // hardcoded
os.Getenv("DB_PASSWORD")                  // env var (leaks in logs, ps aux)
// also: never in Git, never in Docker files, never in K8s manifests (unencrypted)
```

### ✅ HashiCorp Vault / AWS Secrets Manager

```go
// Vault — dynamic secrets (generated per request, auto-expire)
func getDatabaseCredentials() (string, string, error) {
    secret, err := vaultClient.Logical().Read("database/creds/my-role")
    if err != nil {
        return "", "", err
    }
    username := secret.Data["username"].(string)
    password := secret.Data["password"].(string)
    // These credentials are valid for only the lease duration (e.g., 1 hour)
    // Vault auto-revokes them after expiry
    return username, password, nil
}

// AWS Secrets Manager
func getSecret(secretName string) (string, error) {
    result, err := svc.GetSecretValue(&secretsmanager.GetSecretValueInput{
        SecretId: aws.String(secretName),
    })
    return *result.SecretString, err
}

// Cache secrets with TTL — don't hit Vault on every request
// Rotate before expiry — set renewal goroutine
```

### Kubernetes Secrets — Not Encrypted by Default

```
K8s Secret = base64 encoded (not encrypted!)
Anyone with cluster access can read them.

Secure approach:
  1. External Secrets Operator: sync from Vault/AWS SM → K8s Secret
  2. etcd encryption at rest (K8s config)
  3. Sealed Secrets (Bitnami): encrypt secrets, store in Git safely
  
Never:
  ❌ K8s secrets in Git (even base64 encoded)
  ❌ Print environment variables in logs
  ❌ Include secrets in Docker image (check with docker history)
```

---

## Input Validation Best Practices

```go
import "github.com/go-playground/validator/v10"

type CreateOrderRequest struct {
    UserID    string  `json:"user_id"   validate:"required,uuid4"`
    Amount    int64   `json:"amount"    validate:"required,min=100,max=1000000"` // paise
    Currency  string  `json:"currency"  validate:"required,oneof=INR USD EUR"`
    Items     []Item  `json:"items"     validate:"required,min=1,max=100,dive"`
}

type Item struct {
    ProductID string `json:"product_id" validate:"required,uuid4"`
    Quantity  int    `json:"quantity"   validate:"required,min=1,max=999"`
}

var validate = validator.New()

func ParseAndValidate[T any](r *http.Request) (T, error) {
    var req T
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        return req, fmt.Errorf("invalid JSON")
    }
    if err := validate.Struct(req); err != nil {
        return req, err  // returns field-level errors
    }
    return req, nil
}

// Additional: sanitize strings (HTML escape for any user content that gets rendered)
// Never trust client-side validation alone
// Validate at API boundary, not deep in business logic
```

---

## SQL Injection Prevention

```go
// ❌ String concatenation = SQL injection
query := "SELECT * FROM users WHERE email = '" + email + "'"
// email = "'; DROP TABLE users; --" → bye bye data

// ✅ Parameterized queries (ALWAYS)
user, err := db.QueryRowContext(ctx,
    "SELECT * FROM users WHERE email = $1",
    email,  // safely escaped by driver
)

// ❌ Dynamic ORDER BY (common mistake)
sortField := r.URL.Query().Get("sort")
query := "SELECT * FROM orders ORDER BY " + sortField  // injection!

// ✅ Whitelist
allowedSorts := map[string]string{
    "created_at": "created_at",
    "amount":     "amount",
}
col, ok := allowedSorts[sortField]
if !ok {
    col = "created_at"  // default
}
query := fmt.Sprintf("SELECT * FROM orders ORDER BY %s", col)
```

---

## Security Headers

```go
func SecurityHeadersMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Prevent MIME sniffing
        w.Header().Set("X-Content-Type-Options", "nosniff")
        
        // Prevent clickjacking
        w.Header().Set("X-Frame-Options", "DENY")
        
        // Force HTTPS
        w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        
        // Content Security Policy (strict for APIs)
        w.Header().Set("Content-Security-Policy", "default-src 'none'")
        
        // Don't expose server version
        w.Header().Del("Server")
        w.Header().Del("X-Powered-By")
        
        next.ServeHTTP(w, r)
    })
}
```

---

## Security Checklist — 50M Users

```
Authentication:
  ☐ JWT: proper algorithm check, expiry required, strong secret
  ☐ Refresh tokens: rotated on use, stored securely (httpOnly cookie)
  ☐ Session fixation prevention
  ☐ Brute force protection (account lockout after N failures)

Authorization:
  ☐ BOLA check on every resource (ownership verified)
  ☐ RBAC/ABAC for admin operations
  ☐ Mass assignment protection (input DTOs)
  ☐ Sensitive fields not in response

Input/Output:
  ☐ Input validation on ALL fields (type, length, format, range)
  ☐ SQL parameterized queries everywhere
  ☐ HTML escape user content (XSS)
  ☐ SSRF validation for any user-provided URLs

Infrastructure:
  ☐ Secrets in Vault/AWS SM (never env vars, never Git)
  ☐ HTTPS only (HSTS header)
  ☐ Security headers set
  ☐ Dependency scanning in CI (govulncheck, Snyk)
  ☐ Container image scanning (Trivy)

Rate limiting:
  ☐ Per-user rate limits on all endpoints
  ☐ Especially on: login, forgot password, OTP verification
  ☐ CAPTCHA on high-abuse endpoints
```
