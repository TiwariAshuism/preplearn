# 05 — Failure Handling & Resilience (50M Users)

> **Scenario:** 50M users, 200K req/sec. Dependencies WILL fail. Networks WILL partition. Servers WILL crash. Question yeh nahi ki "fail hoga kya?" — question yeh hai "jab fail hoga tab system kaise behave karega?"

---

## Core Principle: Design for Failure

```
Monolith mindset:  "Make sure nothing fails"
Distributed mindset: "Everything will fail. Limit the blast radius."

Murphy's Law at scale:
  If something can fail at 1% probability per server per day,
  with 500 servers, it WILL fail ~5 times daily.
```

---

## Circuit Breaker Pattern

### Problem

```
Order Service → Payment Service (down)
  
Without circuit breaker:
  Every request tries Payment Service → 5s timeout → fail
  200K req/sec × 5s = 1M requests stuck waiting
  Thread/goroutine pool exhausted → Order Service ALSO dies
  Cascading failure: one service down → everything down
```

### Circuit Breaker States

```
     ┌──────────────────────────────────────┐
     │                                      │
     ▼                                      │
 ┌────────┐    failures > threshold    ┌────────┐
 │ CLOSED  │──────────────────────────►│  OPEN   │
 │(normal) │                           │(reject) │
 └────────┘                           └────┬───┘
     ▲                                      │
     │         success                      │ after timeout
     │                                      │
     │        ┌────────────┐               │
     └────────│ HALF-OPEN  │◄──────────────┘
              │(test 1 req)│
              └────────────┘
                    │
                    │ failure → back to OPEN
```

```go
import "github.com/sony/gobreaker"

cb := gobreaker.NewCircuitBreaker(gobreaker.Settings{
    Name:        "payment-service",
    MaxRequests: 3,                     // half-open mein 3 test requests
    Interval:    30 * time.Second,      // counter reset interval (closed state)
    Timeout:     10 * time.Second,      // open → half-open after 10s
    ReadyToTrip: func(counts gobreaker.Counts) bool {
        failureRatio := float64(counts.TotalFailures) / float64(counts.Requests)
        return counts.Requests >= 10 && failureRatio >= 0.5
        // 50% failure rate with at least 10 requests → OPEN
    },
    OnStateChange: func(name string, from, to gobreaker.State) {
        logger.Warn("circuit breaker state change",
            zap.String("name", name),
            zap.String("from", from.String()),
            zap.String("to", to.String()),
        )
        metrics.CircuitBreakerState.WithLabelValues(name, to.String()).Set(1)
    },
})

// Usage
result, err := cb.Execute(func() (interface{}, error) {
    return paymentClient.Charge(ctx, amount)
})
if err == gobreaker.ErrOpenState {
    // Circuit is open — use fallback
    return queuePaymentForLater(ctx, amount)
}
```

---

## Retry with Exponential Backoff + Jitter

### ❌ Naive Retry = Thundering Herd

```
1000 requests fail at t=0
Retry 1: all 1000 retry at t=1s → server gets 1000 requests → fails again
Retry 2: all 1000 retry at t=2s → same problem
→ Server never recovers because retries keep hammering it
```

### ✅ Exponential Backoff + Jitter

```go
func retryWithBackoff(ctx context.Context, maxRetries int, fn func() error) error {
    for attempt := 0; attempt < maxRetries; attempt++ {
        err := fn()
        if err == nil {
            return nil
        }
        
        // Don't retry non-retriable errors
        if isNonRetriable(err) {
            return err // 400 Bad Request, 404 Not Found → don't retry
        }
        
        // Exponential backoff: 100ms, 200ms, 400ms, 800ms...
        baseDelay := time.Duration(1<<uint(attempt)) * 100 * time.Millisecond
        
        // Cap at 10 seconds
        if baseDelay > 10*time.Second {
            baseDelay = 10 * time.Second
        }
        
        // Full jitter: random delay between 0 and baseDelay
        jitter := time.Duration(rand.Int63n(int64(baseDelay)))
        
        select {
        case <-ctx.Done():
            return ctx.Err()
        case <-time.After(jitter):
        }
    }
    return fmt.Errorf("max retries exceeded")
}

func isNonRetriable(err error) bool {
    // 4xx errors (except 429 Too Many Requests) are NOT retriable
    var httpErr *HTTPError
    if errors.As(err, &httpErr) {
        return httpErr.StatusCode >= 400 && httpErr.StatusCode < 500 && httpErr.StatusCode != 429
    }
    return false
}
```

### Retry Budget

```
Problem: retry from every layer = retry amplification

Client → API GW (retry 3x) → Order Svc (retry 3x) → Payment Svc (retry 3x)

Worst case: 3 × 3 × 3 = 27 attempts for ONE user request!

Solution: Retry budget
  - Track retry ratio per service
  - If > 20% of requests are retries → STOP retrying
  - Only the CLOSEST caller to the failing service should retry
  - Outer layers should NOT retry (or retry only once)
```

---

## Timeout Budgets

```
User expects response in 3 seconds.

API Gateway → User Svc → Order Svc → Payment Svc → DB

Total budget: 3000ms

Split:
  API Gateway overhead:  100ms
  User Service:          500ms  (timeout for calling Order Svc)
  Order Service:         1000ms (timeout for calling Payment Svc)
  Payment Service:       800ms  (timeout for DB + external API)
  Buffer:                600ms
  
  Total: 3000ms ✅
```

```go
func OrderHandler(ctx context.Context) {
    // Deadline propagation via context
    ctx, cancel := context.WithTimeout(ctx, 1*time.Second)
    defer cancel()
    
    // This timeout is RESPECTED by downstream calls
    // If upstream already used 2s of a 3s budget,
    // we only have 1s left — context carries this info
    
    result, err := paymentClient.Charge(ctx, amount)
    if ctx.Err() == context.DeadlineExceeded {
        // Timed out — don't retry, return degraded response
        return fallbackResponse()
    }
}
```

---

## Bulkhead Pattern

### Problem

```
Order Service calls:
  - Payment Service (connection pool: shared)
  - Inventory Service (connection pool: shared)
  - Notification Service (connection pool: shared)

Payment Service goes slow → all connections stuck waiting for Payment
→ No connections left for Inventory or Notification
→ EVERYTHING fails even though Inventory and Notification are fine
```

### Solution: Isolate Resources

```
┌─────────────────────────────────────────────┐
│              Order Service                   │
│                                              │
│  ┌──────────────┐  ┌──────────────┐         │
│  │ Payment Pool  │  │ Inventory    │         │
│  │ (50 conns)    │  │ Pool (50)    │         │
│  │               │  │              │         │
│  │ FULL/SLOW ⚠️  │  │ HEALTHY ✅   │         │
│  └──────────────┘  └──────────────┘         │
│                                              │
│  Payment failing doesn't affect Inventory!   │
└──────────────────────────────────────────────┘
```

```go
// Semaphore-based bulkhead
type Bulkhead struct {
    sem chan struct{}
}

func NewBulkhead(maxConcurrent int) *Bulkhead {
    return &Bulkhead{sem: make(chan struct{}, maxConcurrent)}
}

func (b *Bulkhead) Execute(ctx context.Context, fn func() error) error {
    select {
    case b.sem <- struct{}{}:
        defer func() { <-b.sem }()
        return fn()
    case <-ctx.Done():
        return ctx.Err()
    default:
        return ErrBulkheadFull // fast fail, don't wait
    }
}

// Per-dependency bulkheads
paymentBulkhead := NewBulkhead(50)
inventoryBulkhead := NewBulkhead(50)
```

---

## Graceful Degradation

```
"Poora feature band karo vs partial/degraded response do"

Examples:

1. Recommendation Service down:
   ❌ Show error page
   ✅ Show "Popular Items" (static/cached list)

2. Search Service slow:
   ❌ Wait 10 seconds
   ✅ After 2s timeout, show cached/trending results

3. Payment gateway down:
   ❌ "Payment failed, try again"
   ✅ Queue the payment, confirm later (async processing)

4. Profile picture service down:
   ❌ Show broken image
   ✅ Show default avatar
```

```go
func GetProductPage(ctx context.Context, productID string) (*Page, error) {
    // Core data — MUST succeed
    product, err := productService.Get(ctx, productID)
    if err != nil {
        return nil, err // actual error, can't degrade
    }
    
    page := &Page{Product: product}
    
    // Non-critical — degrade gracefully
    reviews, err := reviewService.Get(ctx, productID)
    if err != nil {
        logger.Warn("reviews unavailable, using cached", zap.Error(err))
        reviews = cachedReviews.Get(productID)  // stale but okay
    }
    page.Reviews = reviews
    
    // Non-critical — degrade gracefully
    recommendations, err := recoService.Get(ctx, productID)
    if err != nil {
        logger.Warn("recommendations unavailable", zap.Error(err))
        recommendations = defaultRecommendations()
    }
    page.Recommendations = recommendations
    
    return page, nil
}
```

---

## Rate Limiting & Load Shedding

### Rate Limiting — Inbound Traffic Control

```go
// Token bucket rate limiter
import "golang.org/x/time/rate"

// Per-user rate limiter: 100 req/sec, burst of 200
limiter := rate.NewLimiter(rate.Limit(100), 200)

func RateLimitMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        userID := extractUserID(r)
        limiter := getUserLimiter(userID) // per-user limiter from sync.Map
        
        if !limiter.Allow() {
            w.Header().Set("Retry-After", "1")
            http.Error(w, "Too Many Requests", 429)
            return
        }
        next.ServeHTTP(w, r)
    })
}
```

### Load Shedding — Jab Server Overloaded Ho

```
Rate limiting: "Har user ko max X req/sec allow karo"
Load shedding: "Server overloaded hai, kuch requests DROP karo"

Strategy: Priority-based shedding
  1. Health checks → NEVER drop
  2. Payment processing → HIGH priority
  3. User-facing reads → MEDIUM priority  
  4. Analytics/logging → LOW priority (drop first)
```

---

## Chaos Engineering

### Principle

```
"Don't wait for production to surprise you. Break things intentionally."

1. Define steady state (normal metrics)
2. Hypothesize: "If X fails, Y should handle it"
3. Inject failure
4. Observe: Did the system handle it as expected?
5. Fix weaknesses found
```

### Chaos Experiments

```
Network:
  - Add 200ms latency to DB calls
  - Drop 5% of packets between services
  - DNS resolution failure

Infrastructure:
  - Kill random pods (chaos monkey)
  - Fill disk to 95%
  - CPU stress on random nodes

Application:
  - Force circuit breaker open
  - Inject 500 errors from dependency
  - Slow down one instance

Tools:
  - Chaos Monkey (Netflix) — random instance termination
  - Litmus Chaos (K8s native)
  - Gremlin (commercial, comprehensive)
  - toxiproxy (inject network issues)
```

### Blast Radius Control

```
Start small → increase scope

Day 1: Kill 1 pod in staging
Day 7: Kill 1 pod in production (off-peak)
Day 30: Kill entire AZ in staging
Day 60: Kill entire AZ in production (off-peak, with rollback ready)

Rules:
  ✅ Always have abort button
  ✅ Run during business hours (not at 3am)
  ✅ Inform the team
  ✅ Have monitoring dashboards open
  ❌ Never in production without approval
  ❌ Never target stateful services first (DBs)
```

---

## Production Resilience Checklist — 50M Users

```
Every service MUST have:
  ☐ Circuit breaker on all external calls
  ☐ Timeouts on every network call (no infinite waits)
  ☐ Retry with exponential backoff + jitter (only for retriable errors)
  ☐ Bulkhead isolation for independent dependencies
  ☐ Graceful degradation for non-critical features
  ☐ Rate limiting per user/API key
  ☐ Load shedding when overloaded
  ☐ Health check endpoints (liveness + readiness)
  ☐ Graceful shutdown (drain connections before exit)

Testing:
  ☐ Chaos experiments in staging monthly
  ☐ Gamedays (simulated incidents) quarterly
  ☐ Dependency failure tests in CI/CD pipeline
  ☐ Load tests at 2x expected peak before major releases
```
