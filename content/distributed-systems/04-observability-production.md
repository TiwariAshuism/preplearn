# 04 — Observability in Production (50M Users)

> **Scenario:** Production mein incident hua. 50M users mein se kuch ko errors mil rahe hain. Tum on-call ho. Tumhe 5 minutes mein root cause dhundna hai. Observability ke bina andhe ho.

---

## Three Pillars of Observability

```
1. LOGS:    "Kya hua" — discrete events with context
2. METRICS: "Kitna hua" — aggregated numbers over time  
3. TRACES:  "Kahan hua" — request path across services

Teeno chahiye. Koi ek se kaam nahi chalega.
```

---

## Structured Logging at Scale

### ❌ Wrong Way

```
log.Println("user login failed")
log.Println("error processing order: " + err.Error())
log.Printf("request took %dms", duration)
```

Problem: 50 servers × 10K req/sec = 500K log lines/sec. Grep se kaise dhundhoge? Format inconsistent. No correlation.

### ✅ Production Logging

```go
import "go.uber.org/zap"

logger, _ := zap.NewProduction()

// Every log line = structured JSON
logger.Info("user login",
    zap.String("user_id", "user_123"),
    zap.String("method", "POST"),
    zap.String("path", "/api/login"),
    zap.String("ip", clientIP),
    zap.Duration("latency", time.Since(start)),
    zap.String("request_id", requestID),      // ← correlation ID
    zap.String("trace_id", traceID),           // ← distributed trace
)

// Output:
// {"level":"info","ts":1689840000,"msg":"user login",
//  "user_id":"user_123","method":"POST","path":"/api/login",
//  "ip":"203.0.113.5","latency":"23.5ms",
//  "request_id":"req_abc123","trace_id":"4bf92f3577b34da6"}
```

### Request ID — Ek Request Ko Track Karo

```go
// Middleware: har incoming request ko unique ID do
func RequestIDMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        requestID := r.Header.Get("X-Request-ID")
        if requestID == "" {
            requestID = uuid.New().String()
        }
        ctx := context.WithValue(r.Context(), "request_id", requestID)
        w.Header().Set("X-Request-ID", requestID)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// Ab SAARE logs mein yeh request_id hoga
// User complains: "mera order fail ho gaya"
// Support team: "request ID de do" → req_abc123
// Engineer: search logs for request_id=req_abc123
// → POORA request lifecycle dikh jaata hai across all services
```

### Log Levels — Kab Kya Use Karein

```
DEBUG:  Development mein details. Production mein OFF (bahut zyada volume).
INFO:   Normal operations — request processed, user logged in, cache hit.
WARN:   Something unexpected but handled — retry succeeded, fallback used.
ERROR:  Something failed — DB error, external API timeout, validation failure.
FATAL:  Cannot continue — missing config, corrupt state. Process exits.

Production mein: INFO and above.
Debugging specific issue? Temporarily enable DEBUG for one service.
```

### Log Aggregation Pipeline

```
App Pods (50+ services)
     │ stdout/stderr
     ▼
Fluentd/Fluent Bit (DaemonSet on every node)
     │ collects, parses, enriches
     ▼
Kafka (buffer)
     │
     ▼
Elasticsearch / Loki / ClickHouse
     │
     ▼
Kibana / Grafana (search + dashboards)

Volume at 50M users:
  ~500K log lines/sec
  ~50GB logs/day (after compression)
  Retention: 30 days hot, 90 days cold (S3)
```

---

## Metrics — Prometheus + Grafana

### Four Golden Signals (Google SRE)

```
1. LATENCY:      Request serve karne mein kitna time laga
2. TRAFFIC:      Kitne requests aa rahe hain (throughput)
3. ERRORS:       Kitne requests fail ho rahe hain
4. SATURATION:   Resources kitne full hain (CPU, memory, connections)

In 4 signals se 90% production issues diagnose ho jaati hain.
```

### Metric Types

```go
import "github.com/prometheus/client_golang/prometheus"

// COUNTER — sirf badhta hai (total requests, total errors)
httpRequestsTotal := prometheus.NewCounterVec(
    prometheus.CounterOpts{
        Name: "http_requests_total",
        Help: "Total HTTP requests",
    },
    []string{"method", "path", "status"},
)
// Usage: httpRequestsTotal.WithLabelValues("GET", "/api/users", "200").Inc()

// HISTOGRAM — distribution dekhne ke liye (latency percentiles)
httpRequestDuration := prometheus.NewHistogramVec(
    prometheus.HistogramOpts{
        Name:    "http_request_duration_seconds",
        Help:    "HTTP request latency",
        Buckets: []float64{0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10},
    },
    []string{"method", "path"},
)
// Usage: httpRequestDuration.WithLabelValues("GET", "/api/users").Observe(0.123)

// GAUGE — upar-neeche hota hai (current connections, queue depth)
activeConnections := prometheus.NewGauge(prometheus.GaugeOpts{
    Name: "active_connections",
    Help: "Currently active connections",
})
// Usage: activeConnections.Inc() / activeConnections.Dec()
```

### RED Method (Request-focused)

```
Rate:     requests per second
Errors:   failed requests per second  
Duration: latency distribution (P50, P95, P99)

PromQL examples:

# Request rate (per second, 5 min average):
rate(http_requests_total[5m])

# Error rate (%):
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100

# P99 latency:
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
```

### USE Method (Resource-focused)

```
Utilization: resource kitna busy hai (CPU %, memory %)
Saturation:  queue depth, waiting threads
Errors:      resource errors (disk full, OOM kills)

Useful for: DB connections, Kafka consumers, goroutine pools
```

---

## Distributed Tracing — Request Ka Poora Path

### Problem

```
User: "My API call is slow"

API Gateway → User Service → Order Service → Payment Service → DB
                                    ↓
                              Inventory Service → Redis

Kaunsi service slow hai? Logs mein dhundhoge toh 6 services ke logs correlate karne padenge.
```

### OpenTelemetry + Jaeger

```go
import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/trace"
)

func GetUserOrders(ctx context.Context, userID string) ([]Order, error) {
    // Start a span for this operation
    ctx, span := otel.Tracer("order-service").Start(ctx, "GetUserOrders")
    defer span.End()
    
    // Add attributes for debugging
    span.SetAttributes(
        attribute.String("user.id", userID),
    )
    
    // Call User Service (child span automatically created)
    user, err := userClient.GetUser(ctx, userID)
    if err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, "user fetch failed")
        return nil, err
    }
    
    // Query DB (another child span)
    orders, err := db.GetOrders(ctx, userID)
    span.SetAttributes(attribute.Int("orders.count", len(orders)))
    
    return orders, nil
}
```

### Trace Visualization

```
Trace ID: 4bf92f3577b34da6a3ce929d0e0e4736

├─ API Gateway          [===============]                    200ms total
│  ├─ Auth middleware    [==]                                 15ms
│  └─ Route to service  [=]                                  2ms
│
├─ User Service         [    =========]                      120ms
│  ├─ Redis cache miss  [    =]                              5ms
│  └─ PostgreSQL query  [     ========]                      110ms ← BOTTLENECK!
│
├─ Order Service        [         ====]                       50ms
│  └─ PostgreSQL query  [         ===]                        35ms
│
└─ Payment Service      [            ==]                      20ms
   └─ Redis lookup      [            =]                        8ms

Diagnosis: User Service ka PostgreSQL query 110ms le raha hai.
Action: EXPLAIN ANALYZE run karo, missing index add karo.
```

### Sampling — Sab Kuch Trace Mat Karo

```
200K req/sec × full trace = EXPENSIVE (storage + processing)

Sampling strategies:

1. Probabilistic: 1% traces capture karo
   99% requests ka trace lost, but statistical picture milta hai

2. Rate-limiting: max 100 traces/sec
   Predictable cost

3. Tail-based: sab trace shuru karo, but sirf "interesting" ones keep karo
   - Latency > P99 → keep
   - Error response → keep  
   - Normal fast request → drop
   
   ✅ Best approach for production
   ❌ Needs a collector that buffers before deciding

Production recommendation:
  - Always trace errors (100%)
  - Always trace slow requests (> P95 latency)
  - Sample normal requests (1-5%)
  - Critical paths (payments, auth) → 100% tracing
```

---

## SLOs / SLIs / SLAs / Error Budgets

### Definitions

```
SLI (Service Level Indicator):
  Measurable metric. "Kitne percent requests 200ms se kam mein respond hue."
  Example: P99 latency < 200ms, Error rate < 0.1%

SLO (Service Level Objective):
  Internal target. "99.9% requests 200ms se kam mein respond honge, monthly."
  
  99.9% uptime = 43 minutes downtime per month allowed
  99.95% = 22 minutes
  99.99% = 4.3 minutes
  
SLA (Service Level Agreement):
  External contract with customers. SLO se LOWER set karo.
  "Agar 99.5% se neeche jaaye, toh customer ko credit milega."
  
  SLO: 99.9%  (internal target, stricter)
  SLA: 99.5%  (customer contract, more lenient)
```

### Error Budget

```
SLO: 99.9% availability per month

Total minutes in month: 43,200
Allowed downtime: 43.2 minutes (error budget)

Week 1: 0 minutes downtime     → Budget remaining: 43.2 min
Week 2: 5 minutes incident     → Budget remaining: 38.2 min  
Week 3: 20 minutes deployment  → Budget remaining: 18.2 min ⚠️
Week 4: Budget low             → FREEZE deployments, focus on reliability

Error budget exhausted?
  → No new feature deployments
  → Only reliability improvements
  → Incident review mandatory
  
Error budget healthy?
  → Ship features faster
  → Take more risks with deployments
  → Innovation encouraged
```

### SLO-Based Alerts

```yaml
# ❌ WRONG — alert on every error
alert: ErrorRateAboveZero
expr: http_errors_total > 0
# Result: constant noise, alert fatigue, everyone ignores

# ✅ CORRECT — alert on SLO burn rate
alert: HighErrorBudgetBurn
expr: |
  (
    # Short window: burning 14x faster than allowed (1h window)
    (1 - (rate(http_requests_total{status="200"}[1h]) / rate(http_requests_total[1h])))
    > (14 * (1 - 0.999))
  )
  AND
  (
    # Long window: burning 3x faster than allowed (6h window)  
    (1 - (rate(http_requests_total{status="200"}[6h]) / rate(http_requests_total[6h])))
    > (3 * (1 - 0.999))
  )
for: 5m
labels:
  severity: critical
# Result: alert sirf jab SLO genuinely at risk hai
```

---

## Alerting That Doesn't Suck

### Alert Principles

```
1. Actionable:   Alert mila → kuch kar sakte ho. "Disk 90% full" → expand.
                  "CPU spike for 2 seconds" → NOT actionable.

2. Urgent:       Alert mila → ABHI action chahiye. 
                  "Error rate > 5%" → urgent.
                  "Disk 60% full" → weekly report mein daalo.

3. Novel:        Pehli baar ho raha hai ya worsening hai.
                  Same alert baar baar → fix it or silence it.

4. Real:         False positives kam. Agar 50% alerts false → team ignores ALL.
```

### Alert Tiers

```
P1 (Page immediately — wake up at 3am):
  - SLO burn rate critical
  - Service completely down
  - Data loss detected
  - Security breach
  
P2 (Page during business hours):
  - Error rate elevated but not critical
  - Replication lag > 5 seconds
  - Disk > 80%
  - Certificate expiring in < 7 days

P3 (Ticket, fix this week):
  - Disk > 60%
  - Dependency deprecation warning
  - Non-critical service degraded

P4 (Dashboard only):
  - Performance trend changes
  - Capacity planning signals
```

### On-Call Runbook Template

```markdown
## Alert: High Error Rate on Payment Service

### Severity: P1

### What it means
Payment API returning > 5% 5xx errors for > 5 minutes.

### Impact
Users cannot complete purchases. Revenue impact ~₹50K/minute.

### Diagnosis Steps
1. Check Grafana dashboard: [link]
2. Check recent deployments: `kubectl rollout history deployment/payment-svc`
3. Check downstream dependencies:
   - Payment gateway (Razorpay) status: [status page link]
   - PostgreSQL: `SELECT * FROM pg_stat_activity WHERE state = 'active';`
   - Redis: `redis-cli ping`
4. Check logs: `kubectl logs -l app=payment-svc --tail=100 | grep ERROR`

### Common Fixes
- Bad deployment: `kubectl rollout undo deployment/payment-svc`
- DB connection pool exhausted: restart pods (temporary) + investigate leak
- Payment gateway down: enable fallback/queue mode

### Escalation
If not resolved in 15 min → page @backend-lead
If revenue impact confirmed → page @engineering-manager + @cto
```

---

## Production Observability Stack — 50M Users

```
Logs:
  Collection:  Fluent Bit (DaemonSet)
  Transport:   Kafka (buffer)
  Storage:     Loki (Grafana ecosystem) or Elasticsearch
  Search:      Grafana or Kibana
  Retention:   30 days hot, 90 days S3
  Volume:      ~50GB/day compressed

Metrics:
  Collection:  Prometheus (pull-based, per cluster)
  Federation:  Thanos or Cortex (multi-cluster, long-term)
  Dashboards:  Grafana
  Retention:   90 days high-res, 1 year downsampled
  Cardinality: Watch out! High-cardinality labels kill Prometheus.

Traces:
  SDK:         OpenTelemetry (Go, Java, Node SDKs)
  Collector:   OpenTelemetry Collector (sampling, enrichment)
  Backend:     Jaeger or Tempo (Grafana ecosystem)
  Sampling:    1% normal, 100% errors + slow requests
  Retention:   14 days

Alerting:
  Engine:      Prometheus Alertmanager
  Routing:     PagerDuty (P1/P2) → Slack (P3/P4)
  Runbooks:    Confluence/Notion, linked from every alert
  
Cost at 50M users: ~$5-15K/month for observability infrastructure
```
