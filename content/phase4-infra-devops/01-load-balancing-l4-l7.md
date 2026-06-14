# 01 — L4 vs L7 Load Balancing (Days 56–57)

> **Core Mental Model:** Load balancers traffic distribute karte hain, lekin alag layers alag cheezein samajhte hain. L4 connections aur packets dekhta hai. L7 HTTP protocol samajhta hai — path, header, host, cookies.

---

## OSI Model Recap

```
Layer 7: Application  → HTTP, gRPC, WebSocket
Layer 6: Presentation
Layer 5: Session
Layer 4: Transport    → TCP, UDP (port numbers)
Layer 3: Network      → IP addresses
Layer 2: Data Link
Layer 1: Physical

L4 LB: IP + Port dekhta hai. HTTP content nahi.
L7 LB: HTTP request headers, path, cookies sab dekhta hai.
```

---

## L4 Load Balancer

```
                   Internet
                      │
              ┌───────▼────────┐
              │   L4 LB (NLB)  │
              │  Sees: IP+Port  │
              │  Understands:  │
              │  TCP bytes     │
              └───────┬────────┘
         ┌────────────┼────────────┐
         ▼            ▼            ▼
    [Server A]   [Server B]   [Server C]

Routing decision: "Yeh TCP connection 10.0.1.5:8080 pe forward karo"
Nothing more.
```

**Kaise kaam karta hai:**
```
Client: SYN packet bheji (TCP handshake)
L4 LB: SYN packet dekha, backend choose kiya (IP hash ya round-robin)
       SYN packet FORWARD kar diya — apna SYN nahi bheja
Client ka TCP connection DIRECTLY backend se hota hai.
LB transparent passthrough karta hai.

Performance: millions of packets/sec (line-rate)
AWS NLB: 100 million+ connections handle karta hai
```

### AWS NLB (Network Load Balancer) — L4

```
Features:
  ✅ Line-rate TCP/UDP forwarding (millions pps)
  ✅ Client IP preserved (real IP backend ko milta hai)
  ✅ Static IP (Elastic IP) per AZ — firewall rules mein helpful
  ✅ TLS passthrough (terminate nahi karta — backend kare)
  ✅ gRPC friendly (long-lived streams support karta hai)
  ✅ WebSocket friendly (same reason)
  ✅ Ultra-low latency (~100µs)
  
  ❌ No HTTP routing (can't route by path/header)
  ❌ No HTTP health checks (only TCP health check natively)
  ❌ No request-level visibility (can't see HTTP errors)

Use when:
  → gRPC services (don't cut long-lived streams)
  → WebSocket connections
  → Need real client IP at backend
  → Non-HTTP protocols (MQTT, custom TCP)
  → Need static IP for allowlisting
```

---

## L7 Load Balancer

```
                   Internet
                      │
              ┌───────▼────────────┐
              │   L7 LB (ALB)      │
              │  Terminates TLS    │
              │  Parses HTTP       │
              │  Reads headers     │
              │  Inspects path     │
              └───────┬────────────┘
              
  Route /api/users/*  → User Service pods
  Route /api/orders/* → Order Service pods
  Route /static/*     → S3 / CDN
  Header: X-Beta=true → Canary Service
```

**Kaise kaam karta hai:**
```
Client → ALB TCP connection establish karta hai (TLS terminate)
ALB → HTTP request fully read karta hai
ALB → Routing rules apply karta hai
ALB → NEW TCP connection backend se banata hai
ALB → Backend ko request forward karta hai

ALB = PROXY (client ALB se baat karta hai, ALB backend se)
NLB = PASSTHROUGH (client directly backend se)
```

### AWS ALB (Application Load Balancer) — L7

```
Features:
  ✅ Path-based routing: /api/v1 → service-v1, /api/v2 → service-v2
  ✅ Host-based routing: api.company.com vs admin.company.com
  ✅ Header-based routing: X-Canary: true → canary pods
  ✅ TLS termination (certificates managed by ACM)
  ✅ HTTP/2 support (multiplexing)
  ✅ WebSocket support (upgrade aware)
  ✅ HTTP health checks (GET /healthz → 200 = healthy)
  ✅ Access logs (every HTTP request logged)
  ✅ WAF integration (block SQL injection, XSS)
  ✅ Sticky sessions (cookie-based)
  
  ❌ gRPC long streams: ALB enforces idle timeout (60s default)
  ❌ Higher latency than NLB (~1-5ms vs ~100µs)
  ❌ Client IP hidden behind ALB (X-Forwarded-For header se milta hai)

Use when:
  → REST APIs (path + host routing chahiye)
  → Microservices fan-out from one LB
  → SSL termination + HTTP inspection
  → WAF (web application firewall) needed
```

---

## NLB + ALB Combination — Production Pattern

```
                   Internet
                      │
              ┌───────▼────────┐
              │  NLB (Static IP)│   ← Clients allowlist this IP
              │  TLS passthrough│   
              └───────┬────────┘
                      │ TCP
              ┌───────▼────────┐
              │  ALB (L7)       │   ← HTTP routing rules
              │  TLS terminate  │   
              └───────┬────────┘
                      │
         ┌────────────┼──────────────┐
         ▼            ▼              ▼
    User Service  Order Service  Payment Service

Why this pattern?
  NLB: Static IP (enterprise clients need to allowlist IPs)
  ALB: HTTP routing, WAF, access logs
  
  AWS internally uses this for API Gateway.
  "NLB for stable network endpoint, ALB for intelligent routing"
```

---

## Health Checks — Liveness vs Readiness

### The Critical Difference

```
Liveness probe:   "Is this process alive? Ya restart karna chahiye?"
Readiness probe:  "Can this instance serve traffic right now?"

DIFFERENT semantics. DIFFERENT behavior. DO NOT confuse.
```

```
Liveness failure:
  K8s: Pod restart karta hai (SIGTERM → SIGKILL)
  ALB: Instance unhealthy mark karta hai, traffic band karta hai
  
Readiness failure:
  K8s: Pod ko Service se remove karta hai (no traffic)
       Pod restart NAHI karta
  ALB: Target deregister karta hai

When to fail liveness:
  - Deadlock (process hung, HTTP requests queue ho rahe hain)
  - Panic recovery ke baad stable state possible nahi
  - Self-healing impossible

When to fail readiness:
  - DB connection nahi bana (app ready nahi)
  - Warm-up caches load ho rahi hain (app loading)
  - Circuit breaker open hai (downstream unavailable)
  - Graceful shutdown shuru ho gaya (in-flight finish karo)

❌ WRONG: Liveness probe mein DB check karo
  DB slow ho → liveness fail → pod restart → DB pe aur load
  → Cascading restart storm → ALL pods restart
  
✅ RIGHT:
  Liveness:  GET /healthz → only checks if Go process is healthy
  Readiness: GET /readyz  → checks DB, Redis, required connections
```

```go
// Correct health endpoints
func healthzHandler(w http.ResponseWriter, r *http.Request) {
    // Liveness: sirf process alive hai? Nothing else.
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("ok"))
}

func readyzHandler(w http.ResponseWriter, r *http.Request) {
    // Readiness: can we serve traffic?
    checks := []struct {
        name string
        fn   func() error
    }{
        {"postgres", checkPostgres},
        {"redis", checkRedis},
    }
    
    for _, c := range checks {
        if err := c.fn(); err != nil {
            w.WriteHeader(http.StatusServiceUnavailable)
            json.NewEncoder(w).Encode(map[string]string{
                "status": "not ready",
                "failed": c.name,
                "error":  err.Error(),
            })
            return
        }
    }
    
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"status": "ready"})
}
```

---

## Connection Draining

```
Problem:
  Pod shutdown ho raha hai (deploy/scale-down).
  50 requests in-flight hain (abhi process ho rahi hain).
  Pod abruptly kill → 50 requests fail → user ko error.

Connection Draining:
  LB: "Yeh instance remove ho raha hai"
  LB: New requests is instance ko NAHI bhejta
  LB: Existing (in-flight) requests complete hone deta hai
  LB: Grace period ke baad forcefully close karta hai

AWS ALB: 300 seconds deregistration delay (default)
K8s:    30 seconds grace period (terminationGracePeriodSeconds)
```

```yaml
# Kubernetes graceful shutdown config
spec:
  terminationGracePeriodSeconds: 30   # SIGTERM ke baad 30s wait, phir SIGKILL
  containers:
    - lifecycle:
        preStop:
          exec:
            command: ["sh", "-c", "sleep 10"]
            # LB ko time dena pods remove karne ka pehle SIGTERM mile

# Go server graceful shutdown
srv.Shutdown(ctx)  # in-flight requests finish hone do
```

---

## Sticky Sessions — Kab Use Karein, Kab Nahi

```
Sticky Session: User A always same backend pe jaata hai.
Implementation: ALB ek cookie set karta hai (AWSALB=...)
               Subsequent requests same target pe route hote hain.

✅ Use when:
  - Stateful session data server pe stored hai (NOT in DB/Redis)
  - WebSocket connections (already sticky by nature — same TCP conn)
  - Short-lived stateful operations

❌ Avoid when:
  - Horizontal scaling chahiye (all traffic one server pe pile up)
  - Server crashes → user session lost (no failover)
  - True stateless microservices
  
Staff engineer rule:
  Application STATE should be in Redis/DB, not server memory.
  Then sticky sessions unnecessary hain.
  Stateless > Sticky.
```

---

## Load Balancing Algorithms

```
Round Robin:     Request 1 → S1, Request 2 → S2, Request 3 → S3, repeat
                 Simple. Assumes all requests equal duration.

Least Connections: Fewest active connections wale server pe send karo.
                   Good when requests have varying latency.

IP Hash:         client_ip → consistent hash → same server always
                 De-facto sticky (no cookie needed)
                 Problem: one hot IP (corp NAT) → one server overloaded

Weighted Round Robin: S1 gets 60%, S2 gets 30%, S3 gets 10%
                       Different capacity servers ke liye
                       Canary deployments ke liye (5% weight)

Random (Power of Two Choices): 
  2 random servers choose karo, fewest connections wale pe send karo.
  Surprisingly good performance. Used by Nginx, Envoy, AWS.

50M users ke liye:
  ALB: default (AWS manages, roughly round-robin with health awareness)
  Internal LB (Envoy/Istio): Least Request preferred
  gRPC: Per-RPC LB (not per-connection)
```

---

## gRPC Load Balancing — Special Case

```
HTTP/1.1: Har request = new connection (or keep-alive pool)
          LB easily distributes: each connection = one request mostly
          
HTTP/2 (gRPC): One connection = MANY multiplexed streams
               If LB routes at connection level:
               Client 1 opens connection to Server A → ALL its requests go to A
               Server B: idle
               NOT load balanced!

Solutions:
  1. Client-side LB: Client gets all server IPs, round-robin itself
     (gRPC's built-in load balancing)
  
  2. L7 proxy per-RPC LB: Envoy/Istio understand gRPC, balance at stream level
     (service mesh handles this transparently)
  
  3. NLB: At least distributes new connections, not perfect but acceptable
  
  ❌ ALB: Terminates HTTP/2, opens new HTTP/2 to backend
          gRPC streams may get cut by idle timeout (60s default)
          
Production: Istio sidecar handles gRPC LB per-request. Best choice.
```
