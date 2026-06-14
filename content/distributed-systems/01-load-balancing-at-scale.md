# 01 — Load Balancing at Scale (50M Users)

> **Scenario:** 200K req/sec peak. Multi-region. Services horizontally scaled. Ek request galat server pe gayi toh user ko slow response milega ya error.

---

## L4 vs L7 Load Balancing

### L4 — Transport Layer (TCP/UDP)

```
Client ──TCP──► L4 Load Balancer ──TCP──► Backend Server

L4 LB kya karta hai:
  - TCP connection level pe decision leta hai
  - Packet ka IP + port dekh ke forward karta hai
  - HTTP content NAHI dekhta (headers, URL, body — kuch nahi)
  - Bahut FAST — almost wire-speed
  - Less CPU usage (no parsing)
```

**L4 kab use karein:**
- Database connections (PostgreSQL, Redis) balance karna
- gRPC traffic (HTTP/2 multiplexing, L7 se issues aate hain naive LB mein)
- Raw TCP services
- Maximum throughput chahiye, content-based routing nahi

**Tools:** AWS NLB (Network Load Balancer), HAProxy (L4 mode), MetalLB (Kubernetes)

### L7 — Application Layer (HTTP/HTTPS)

```
Client ──HTTPS──► L7 Load Balancer ──HTTP──► Backend Server

L7 LB kya karta hai:
  - HTTP request parse karta hai (URL, headers, cookies, body)
  - Content-based routing possible:
    /api/users → User Service
    /api/orders → Order Service
    Header X-Version: 2 → v2 backends
  - TLS termination (SSL offloading)
  - Request/response modification
  - Rate limiting, WAF integration
  - Slower than L4 (parsing overhead)
```

**L7 kab use karein:**
- Microservice routing (path-based)
- A/B testing, canary deployments (header/cookie based routing)
- TLS termination
- Rate limiting at LB level
- WebSocket upgrade handling

**Tools:** AWS ALB, Nginx, Envoy, Traefik, Caddy

### Production Setup — 50M Users

```
                Internet
                   │
            ┌──────▼──────┐
            │   CDN Edge   │  ← Static assets, cached API responses
            │ (Cloudflare) │
            └──────┬───────┘
                   │
            ┌──────▼──────┐
            │  GeoDNS /    │  ← Route to nearest region
            │  Anycast     │
            └──┬───────┬───┘
               │       │
        ┌──────▼──┐ ┌──▼──────┐
        │Region A │ │Region B │
        │ (US)    │ │ (Asia)  │
        └────┬────┘ └────┬────┘
             │            │
        ┌────▼────┐  ┌────▼────┐
        │  L7 LB  │  │  L7 LB  │  ← Path routing, TLS termination
        │ (ALB)   │  │ (ALB)   │
        └────┬────┘  └────┬────┘
             │            │
     ┌───┬───┼───┐   ┌───┬┼──┐
     │   │   │   │   │   ││  │
    API API API API API API API   ← Horizontally scaled app servers
```

---

## Health Checks — Dead Server Ko Traffic Mat Bhejo

### Active Health Checks

```
LB periodically backends ko check karta hai:

Every 5 seconds:
  LB → GET /health → Backend A → 200 OK ✅ (healthy)
  LB → GET /health → Backend B → 200 OK ✅ (healthy)
  LB → GET /health → Backend C → 503    ❌ (unhealthy, remove from pool)
  LB → GET /health → Backend D → timeout ❌ (unhealthy, remove from pool)
```

**Health check endpoint kya return kare:**

```go
// ❌ WRONG — always returns 200
func healthHandler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(200)
    w.Write([]byte("ok"))
}

// ✅ CORRECT — checks actual dependencies
func healthHandler(w http.ResponseWriter, r *http.Request) {
    // Check DB connection
    if err := db.PingContext(r.Context()); err != nil {
        w.WriteHeader(503)
        json.NewEncoder(w).Encode(map[string]string{
            "status": "unhealthy",
            "reason": "database unreachable",
        })
        return
    }
    
    // Check Redis
    if err := redis.Ping(r.Context()).Err(); err != nil {
        w.WriteHeader(503)
        json.NewEncoder(w).Encode(map[string]string{
            "status": "unhealthy",
            "reason": "redis unreachable",
        })
        return
    }
    
    w.WriteHeader(200)
    json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
}
```

**⚠️ Deep health check ka risk:**
Agar DB down hai, toh SAARE servers unhealthy report karenge → LB saare servers hata dega → **total outage** (even though servers themselves are fine).

**Solution — Liveness vs Readiness:**
```
/healthz (liveness):   "Main alive hoon" (process running, not deadlocked)
                       Sirf process-level check. DB down = still alive.
                       Fail → restart the pod

/readyz (readiness):   "Main traffic le sakta hoon" (DB connected, warm cache)
                       Dependency checks included.
                       Fail → remove from LB, but DON'T restart
```

### Passive Health Checks

```
Active check nahi karte — real traffic se judge karte hain:

Backend A: last 100 requests mein 15 failures → mark unhealthy
Backend B: last 100 requests mein 2 failures → healthy

Advantage: Real-world behavior reflect hota hai
Disadvantage: Kuch users ko failures milenge before detection
```

**Production mein dono use karo:** Active (periodic) + Passive (real traffic) = fastest detection.

---

## Connection Draining — Graceful Removal

```
Scenario: Backend C ko remove karna hai (deploy, maintenance, scale-down)

❌ WITHOUT draining:
  LB immediately stops sending traffic + kills existing connections
  → In-flight requests FAIL
  → Users see 502 errors

✅ WITH draining:
  Step 1: LB stops sending NEW requests to Backend C
  Step 2: Existing connections allowed to FINISH (drain period: 30-60 seconds)
  Step 3: After drain period, close remaining connections
  Step 4: Backend C safely removed

  In-flight requests: completed successfully ✅
  New requests: go to A, B, D ✅
```

```go
// Go server — graceful shutdown
func main() {
    srv := &http.Server{Addr: ":8080", Handler: router}
    
    go func() {
        if err := srv.ListenAndServe(); err != http.ErrServerClosed {
            log.Fatal(err)
        }
    }()
    
    // Wait for SIGTERM (Kubernetes sends this before killing pod)
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGTERM, syscall.SIGINT)
    <-quit
    
    log.Println("shutting down, draining connections...")
    
    // Give 30 seconds for in-flight requests to complete
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    
    if err := srv.Shutdown(ctx); err != nil {
        log.Fatal("forced shutdown:", err)
    }
    log.Println("server stopped gracefully")
}
```

---

## Load Balancing Algorithms

### Round Robin
```
Request 1 → Server A
Request 2 → Server B
Request 3 → Server C
Request 4 → Server A  (cycle repeat)

✅ Simple, fair distribution
❌ Ignores server capacity differences
❌ Ignores current load
```

### Weighted Round Robin
```
Server A (weight 3): gets 3 out of 6 requests
Server B (weight 2): gets 2 out of 6 requests
Server C (weight 1): gets 1 out of 6 requests

✅ Handles different server capacities
❌ Still ignores current load
```

### Least Connections
```
Server A: 150 active connections → skip
Server B: 50 active connections  → SEND HERE
Server C: 120 active connections → skip

✅ Load-aware
✅ Handles slow requests well (busy server gets fewer new requests)
❌ Doesn't account for request weight (one expensive query vs many simple GETs)
```

### Consistent Hashing at LB Level
```
hash(user_id) → always same backend server

✅ Session affinity without sticky sessions
✅ Cache locality (user data cached on specific server)
❌ Uneven distribution without virtual nodes
❌ Server addition/removal disrupts some users
```

**50M users ke liye recommendation:**
- **External LB (internet-facing):** Least connections + health checks
- **Internal LB (service-to-service):** Round robin ya least connections (Envoy/Kubernetes service)
- **Stateful workloads (WebSockets):** Consistent hashing

---

## Global Load Balancing

### GeoDNS
```
DNS query: "api.example.com" kahan hai?

User in India:   → DNS responds: 13.235.x.x (Mumbai region)
User in US:      → DNS responds: 54.165.x.x (Virginia region)
User in Europe:  → DNS responds: 52.47.x.x  (Frankfurt region)

DNS resolver ki location se decide hota hai.

✅ Simple, no extra infra
❌ DNS caching means slow failover (TTL dependent)
❌ DNS resolver location ≠ user location always
```

### Anycast
```
Same IP address announced from multiple locations via BGP

api.example.com → 1.2.3.4

But 1.2.3.4 exists in:
  - Mumbai datacenter
  - Virginia datacenter
  - Frankfurt datacenter

BGP routing automatically sends packet to NEAREST location.

✅ Instant failover (BGP re-routes in seconds)
✅ True geographic proximity
✅ Cloudflare, Google, AWS CloudFront use this
❌ TCP connections break on BGP route change
   (mitigated with QUIC/HTTP3 connection migration)
```

### Production Pattern — Multi-Region Active-Active

```
                    ┌─────────────────────┐
                    │    Global LB         │
                    │ (GeoDNS + Anycast)   │
                    └──────┬──────┬────────┘
                           │      │
                 ┌─────────▼──┐ ┌─▼──────────┐
                 │  Region A   │ │  Region B   │
                 │  (Primary)  │ │  (Active)   │
                 │             │ │             │
                 │ App Servers │ │ App Servers │
                 │ Redis       │ │ Redis       │
                 │ PG Primary  │ │ PG Replica  │
                 │ Kafka       │ │ Kafka       │
                 └─────────────┘ └─────────────┘
                        │              ▲
                        │   Async      │
                        └──Replication─┘

Writes: Region A (primary) only
Reads:  Both regions (local reads fast)
Failover: Region A down → promote Region B's PG replica to primary
          DNS TTL low (60s) → traffic shifts in ~1-2 minutes
```

---

## Hot Partition Handling at LB Level

```
Problem: Ek backend server pe disproportionate traffic aa raha hai
  (celebrity user, viral content, popular API endpoint)

Detection:
  - Monitor per-server RPS, latency P99, CPU
  - Alert: "Server X RPS 3x average"

Solutions:

1. Request-level rate limiting at LB:
   Per-path: /api/users/{viral_user_id} → 1000 req/min max
   → Return 429 for excess

2. Request coalescing:
   100 identical requests for same resource → LB sends 1 to backend
   → Cache response, serve to all 100
   (Nginx: proxy_cache_lock on)

3. Auto-scaling trigger:
   CPU > 70% for 2 minutes → add 2 more servers
   RPS > threshold → scale out

4. Shard-aware routing:
   LB knows which shard handles which key range
   Hot shard → split into 2 shards (with LB routing update)
```

---

## gRPC Load Balancing — Special Handling Needed

```
Problem: gRPC uses HTTP/2 → multiplexed streams over ONE TCP connection
         L7 LB sees ONE connection, not individual requests
         → All requests go to same backend → NO load balancing!

Solutions:

1. Client-side LB (recommended for internal):
   gRPC client itself balances across backends
   
   conn, _ := grpc.Dial(
       "dns:///my-service:50051",  // DNS resolves to multiple IPs
       grpc.WithDefaultServiceConfig(`{"loadBalancingPolicy":"round_robin"}`),
   )

2. L7-aware proxy (Envoy):
   Envoy understands HTTP/2 frames
   → Balances at request level, not connection level
   → Kubernetes + Istio does this automatically

3. Lookaside LB:
   Client asks a LB service "which backend?" → gets server address → connects directly
   → Google's approach internally
```

---

## Benchmarks & Numbers to Know

```
At 50M users scale:

CDN cache hit ratio:          > 90% for static, > 60% for API (cacheable)
LB health check interval:    5-10 seconds
LB drain timeout:            30-60 seconds
LB to backend latency:       < 1ms (same AZ)
Cross-AZ latency:            1-2ms
Cross-region latency:        50-200ms
Max connections per LB:       100K+ (NLB can handle millions)
Auto-scale cooldown:         3-5 minutes
Target server CPU:           60-70% (headroom for spikes)
Target P99 latency:          < 200ms at LB level
```
