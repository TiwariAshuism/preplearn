# 02 — API Design at Scale (50M Users)

> **Scenario:** Tum API design kar rahe ho jo 50M users use karenge. 3 saal baad bhi backward compatible rehni chahiye. Mobile apps old version pe run kar rahe hain. Partners integrate kar chuke hain. Ek wrong design decision = years of tech debt.

---

## API Versioning

### Why Versioning Matters

```
v1 API ship kiya. 100 partners integrate kar chuke hain.
v2 mein breaking change:
  - Field rename: userId → user_id
  - Date format change
  - Enum value removed

Bina versioning: ALL partners break simultaneously.
With versioning: v1 chal raha hai, partners gradually migrate.
```

### Versioning Strategies

```
1. URL Path Versioning (most common):
   /api/v1/users/123
   /api/v2/users/123

   ✅ Explicit, easily cacheable, visible in logs
   ✅ Easy to route at API gateway level
   ❌ Verbose URLs

2. Header Versioning:
   GET /api/users/123
   API-Version: 2024-01-15

   ✅ Clean URLs
   ❌ Not cacheable by CDN (Vary header needed)
   ❌ Easy to forget in clients

3. Query Parameter:
   /api/users/123?version=2
   
   ❌ Pollutes query params
   ❌ Often forgotten in SDK wrappers

Recommendation: URL path versioning for public APIs
                Date-based versions (Stripe style) for premium APIs
```

### Stripe-Style Date Versioning

```
API-Version: 2024-01-15

Every breaking change = new date version.
Client locks to a version. Changes never affect them.
Stripe supports versions 5+ years back.

Benefits:
  - No "v1, v2, v3" proliferation
  - Granular changes
  - Old clients never break

Implementation:
  Version adapter layer transforms between current schema and old schemas.
  Complex but worth it for external APIs with many integrators.
```

### Version Sunset Policy

```
1. New version released → announce v_old deprecation
2. 6 month grace period (or 12 for enterprise)
3. Send deprecation warnings in response headers:
   Deprecation: true
   Sunset: Sat, 01 Jan 2025 00:00:00 GMT
4. After sunset: 410 Gone with migration guide URL
```

---

## Idempotency

### Problem

```
User clicks "Pay" button.
Network flaky → no response received.
User clicks again.
Server processes TWICE → double charge.

This is a critical bug at any scale.
```

### Idempotency Keys

```
Client generates unique key per logical operation.
Includes key in request header.
Server: if key seen before → return cached response (don't re-execute).

Idempotency-Key: idem_k7y89_20240115_abc123xyz

First request:
  1. BEGIN TRANSACTION
  2. Check idempotency_keys table: key exists? No.
  3. Process payment.
  4. Store: (key, response, expires_at) in idempotency_keys.
  5. COMMIT.
  Return response.

Duplicate request (same key):
  1. Check idempotency_keys table: key exists? YES.
  2. Return cached response.
  No payment processed. ✅
```

```go
func IdempotencyMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        key := r.Header.Get("Idempotency-Key")
        if key == "" {
            // For write operations, require idempotency key
            if r.Method == http.MethodPost || r.Method == http.MethodPatch {
                http.Error(w, "Idempotency-Key header required", 422)
                return
            }
            next.ServeHTTP(w, r)
            return
        }
        
        // Check if we've seen this key
        cached, err := idempotencyStore.Get(ctx, key)
        if err == nil && cached != nil {
            // Return cached response
            w.Header().Set("Idempotent-Replayed", "true")
            w.WriteHeader(cached.StatusCode)
            w.Write(cached.Body)
            return
        }
        
        // Capture response
        rec := newResponseRecorder(w)
        next.ServeHTTP(rec, r)
        
        // Store response (24 hour TTL)
        idempotencyStore.Set(ctx, key, rec.Result(), 24*time.Hour)
    })
}
```

---

## Pagination at Scale

### ❌ Offset Pagination — Broken at Scale

```go
// GET /api/orders?page=1000&limit=20

// SQL: SELECT * FROM orders ORDER BY created_at DESC LIMIT 20 OFFSET 19980
// DB mein 19980 rows scan karta hai, pehli 19980 throw karta hai, 20 return karta hai.

// Problems at 50M users:
// Page 1:   Fast (offset 0, scan 20 rows)
// Page 100: Slower (offset 1980, scan 2000 rows)
// Page 1000: SLOW (offset 19980, scan 20000 rows)
// Page 10000: VERY SLOW / timeout

// Also: inserts during pagination = items appear/disappear between pages
```

### ✅ Cursor-Based Pagination

```go
// GET /api/orders?limit=20                     ← first page
// GET /api/orders?cursor=eyJpZCI6MTIzfQ&limit=20  ← next page

// cursor = base64({"id": 123, "created_at": "2024-01-15T10:30:00Z"})

// SQL: SELECT * FROM orders 
//      WHERE (created_at, id) < ($cursor_ts, $cursor_id)
//      ORDER BY created_at DESC, id DESC
//      LIMIT 21  ← fetch 21, if 21 returned → has_next_page = true

type PageResult[T any] struct {
    Data       []T    `json:"data"`
    NextCursor string `json:"next_cursor,omitempty"`
    HasMore    bool   `json:"has_more"`
}

func encodeCursor(id int64, createdAt time.Time) string {
    data, _ := json.Marshal(map[string]interface{}{
        "id":         id,
        "created_at": createdAt.Unix(),
    })
    return base64.URLEncoding.EncodeToString(data)
}

// Performance:
// Page 1:     Fast (index seek)
// Page 1000:  SAME speed (always an index seek, never a scan)
// ✅ Consistent performance regardless of page depth
```

### When to Use What

```
Cursor pagination:
  ✅ Real-time feeds (Twitter timeline, activity feed)
  ✅ Large datasets (> 10K rows)
  ✅ Append-only data
  ❌ Can't jump to "page 50" directly

Offset pagination:
  ✅ Admin panels (small datasets, jump to page)
  ✅ Reports with known total count
  ❌ Large datasets (slow)
  ❌ Real-time data (items shift between pages)
```

---

## Filtering and Sorting API Design

```
GET /api/orders?status=paid&amount_gte=1000&amount_lte=50000
              &created_after=2024-01-01&sort=-created_at,amount

Field selection (sparse fieldsets):
GET /api/users/123?fields=id,name,email
  → Only return requested fields
  → Reduces payload size (mobile bandwidth)
  → Fewer DB columns fetched

Compound filters:
GET /api/users?filter[status]=active&filter[role]=admin
  → Structured to avoid collision with other query params
```

```go
type OrderFilter struct {
    Status     []string  `query:"status"`
    AmountGte  *int64    `query:"amount_gte"`
    AmountLte  *int64    `query:"amount_lte"`
    CreatedAfter *time.Time `query:"created_after"`
}

// Always whitelist allowed filter fields and sort fields
// Never pass user input directly to SQL ORDER BY
var allowedSortFields = map[string]string{
    "created_at": "orders.created_at",
    "amount":     "orders.amount",
    "status":     "orders.status",
}

func validateSort(field string) (string, error) {
    col, ok := allowedSortFields[strings.TrimPrefix(field, "-")]
    if !ok {
        return "", fmt.Errorf("invalid sort field: %s", field)
    }
    if strings.HasPrefix(field, "-") {
        return col + " DESC", nil
    }
    return col + " ASC", nil
}
```

---

## Rate Limiting Design

```
Granularity levels:

1. Global: "Max 1M req/min from all clients"
   → DDoS protection, infra cost control

2. Per API key/tenant: "Free tier: 100 req/min, Pro: 10K req/min"
   → Business model enforcement

3. Per user: "User can't spam actions"

4. Per endpoint: "POST /orders: 10 req/min (expensive), GET /users: 1000 req/min"

Response headers (RFC 6585 + RateLimit-* draft):
  RateLimit-Limit: 1000
  RateLimit-Remaining: 847
  RateLimit-Reset: 1689840060        (Unix timestamp when limit resets)
  Retry-After: 3600                  (if 429, seconds to wait)
```

---

## OpenAPI / API Contract Design

```yaml
# openapi: 3.1.0 — document BEFORE implementing

paths:
  /api/v1/orders:
    post:
      summary: Create Order
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateOrderRequest'
      responses:
        '201':
          description: Order created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Order'
        '422':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ValidationError'
      parameters:
        - name: Idempotency-Key
          in: header
          required: true
          schema:
            type: string

components:
  schemas:
    CreateOrderRequest:
      type: object
      required: [user_id, items, payment_method_id]
      properties:
        user_id:
          type: string
          format: uuid
        items:
          type: array
          minItems: 1
          maxItems: 100
          items:
            $ref: '#/components/schemas/OrderItem'
```

```
Workflow:
  1. OpenAPI spec likhte hain (design-first)
  2. Review (frontend, mobile, partners) — no code written yet!
  3. Mock server generate (Prism/Mockoon) — frontend bina backend ke develop kare
  4. Server stubs generate (oapi-codegen for Go)
  5. Client SDKs generate (OpenAPI Generator)
  6. Tests against spec (Schemathesis fuzz testing)
```

---

## Error Response Design

```json
// Consistent error format (RFC 7807 Problem Details)
{
    "type": "https://api.example.com/errors/validation-failed",
    "title": "Validation Failed",
    "status": 422,
    "detail": "Request body contains invalid fields",
    "instance": "/api/v1/orders/req_abc123",
    "errors": [
        {
            "field": "items[0].quantity",
            "code": "QUANTITY_TOO_LOW",
            "message": "Quantity must be at least 1",
            "minimum": 1,
            "actual": 0
        }
    ],
    "request_id": "req_abc123",
    "docs_url": "https://docs.example.com/errors/QUANTITY_TOO_LOW"
}
```

```
Error codes taxonomy:
  AUTH_*:       Authentication/authorization errors
  VALIDATION_*: Input validation failures
  NOT_FOUND_*:  Resource not found
  CONFLICT_*:   Duplicate, already exists, race condition
  RATE_LIMIT_*: Rate limiting
  PAYMENT_*:    Payment-specific errors
  INTERNAL_*:   Server errors (never expose internals to client)
```

---

## API Design Checklist

```
Before shipping any API endpoint:
  ☐ Idempotency: POST/PATCH endpoints ke liye idempotency key required?
  ☐ Versioning: Breaking changes? Version bumped?
  ☐ Pagination: List endpoints cursor-based? Default limit set? Max limit enforced?
  ☐ Filtering: SQL injection safe? Whitelist applied?
  ☐ Rate limits: Per-user limits defined?
  ☐ Auth: Endpoint protected? Correct scope/permission?
  ☐ Input validation: Required fields? Type validation? Length limits?
  ☐ Error format: RFC 7807 followed? No stack traces in response?
  ☐ Documentation: OpenAPI spec updated?
  ☐ Backward compatibility: Existing clients break?
```
