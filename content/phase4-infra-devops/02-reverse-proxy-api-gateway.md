# 02 — Reverse Proxies & API Gateways (Days 58–59)

> **Core Mental Model:** Reverse proxy traffic forward karta hai backends ko. API gateway policy add karta hai — auth, rate limiting, transformation, routing, observability. Dono alag cheezein hain lekin overlap karte hain.

---

## Nginx Internals

### Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Nginx Process                      │
│                                                       │
│  Master Process (PID 1)                               │
│    - Reads config                                     │
│    - Manages worker processes                         │
│    - Handles signals (reload, stop)                   │
│                                                       │
│  Worker Process 1 ──── Worker Process 2 ──── N       │
│  (single-threaded,      (single-threaded,             │
│   event-driven,          non-blocking I/O)            │
│   1 per CPU core)                                     │
│                                                       │
│  Each worker: epoll/kqueue event loop                 │
│  One worker can handle THOUSANDS of connections       │
└──────────────────────────────────────────────────────┘

vs Apache (old model):
  Apache: 1 thread per connection → 1000 connections = 1000 threads = RAM exhaustion
  Nginx: 1 worker handles 10,000 connections via event loop → C10K problem solved
```

### Nginx as Reverse Proxy

```nginx
# /etc/nginx/nginx.conf

# Upstream = backend servers group
upstream user_service {
    least_conn;                          # algorithm: least connections
    server user-svc-1:8080 weight=3;    # 3x more traffic
    server user-svc-2:8080 weight=1;
    server user-svc-3:8080 backup;      # only used if others fail
    
    keepalive 32;                        # idle keepalive connections to backend
    keepalive_requests 1000;            # max requests per keepalive conn
    keepalive_timeout 60s;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;
    
    # TLS termination
    ssl_certificate     /etc/ssl/api.crt;
    ssl_certificate_key /etc/ssl/api.key;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options nosniff;
    
    location /api/v1/users {
        proxy_pass http://user_service;     # forward to upstream
        proxy_http_version 1.1;            # HTTP/1.1 for keepalive
        proxy_set_header Connection "";    # clear Connection header (keepalive)
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Timeouts
        proxy_connect_timeout 5s;
        proxy_send_timeout    30s;
        proxy_read_timeout    30s;
        
        # Buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
    }
    
    location /healthz {
        return 200 "ok";
        add_header Content-Type text/plain;
    }
}
```

### Nginx — Key Performance Config

```nginx
worker_processes auto;              # CPU cores ke equal workers
worker_rlimit_nofile 65535;        # max open files per worker

events {
    worker_connections 4096;        # per worker max connections
    use epoll;                      # Linux epoll (fastest)
    multi_accept on;                # ek bar mein multiple connections accept
}

# Total capacity: worker_processes × worker_connections
# 4 CPUs × 4096 = 16,384 concurrent connections per Nginx instance
```

---

## Envoy — Modern Data Plane Proxy

### Why Envoy Over Nginx

```
Nginx:  Static config file. Reload for changes (brief interruption).
        Good for: simple reverse proxy, static files, basic routing.

Envoy:  Dynamic config via xDS API. Changes apply live, zero interruption.
        Built for: microservices, service mesh, dynamic environments.
        Used by: Istio, Consul Connect, AWS App Mesh.
```

### xDS Protocol — Dynamic Configuration

```
xDS = "x Discovery Service" — family of APIs for dynamic config

  LDS: Listener Discovery Service  (ports Envoy listens on)
  RDS: Route Discovery Service     (HTTP routing rules)
  CDS: Cluster Discovery Service   (upstream service groups)
  EDS: Endpoint Discovery Service  (individual pod IPs)
  SDS: Secret Discovery Service    (TLS certificates)

Control plane (Istiod) ──xDS API──► Envoy sidecar

When new pod starts:
  1. Kubernetes updates endpoints
  2. Istio control plane detects change
  3. Istiod pushes updated EDS to all Envoy sidecars
  4. Traffic routes to new pod — ZERO manual config, ZERO restart
```

```yaml
# Envoy static config example (for understanding, production uses xDS)
static_resources:
  listeners:
    - name: listener_0
      address:
        socket_address:
          address: 0.0.0.0
          port_value: 8080
      filter_chains:
        - filters:
            - name: envoy.filters.network.http_connection_manager
              typed_config:
                route_config:
                  virtual_hosts:
                    - name: user_service
                      domains: ["*"]
                      routes:
                        - match: { prefix: "/api/users" }
                          route:
                            cluster: user_service_cluster
                            timeout: 5s
                            retry_policy:
                              retry_on: "5xx,reset"
                              num_retries: 3

  clusters:
    - name: user_service_cluster
      connect_timeout: 0.25s
      type: STRICT_DNS
      load_assignment:
        cluster_name: user_service_cluster
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: user-service
                      port_value: 8080
```

---

## API Gateway — Responsibilities

```
API Gateway = smart entry point for ALL external traffic

┌─────────────────────────────────────────────────────────┐
│                     API Gateway                          │
│                                                          │
│  1. Auth:           JWT validate, OAuth token check     │
│  2. Rate Limiting:  100 req/min per user, 10K global    │
│  3. Routing:        /v1/users → user-service            │
│  4. TLS Termination: HTTPS → HTTP internally            │
│  5. Request Transform: add/remove headers               │
│  6. Response Transform: strip internal fields           │
│  7. Observability:  trace IDs, access logs, metrics     │
│  8. Circuit Breaking: fail fast if downstream down      │
│  9. Caching:        cache GET responses                 │
│  10. Versioning:    /v1 → old, /v2 → new               │
└─────────────────────────────────────────────────────────┘
```

### Kong — Plugin-Based Gateway

```
Kong = API gateway built on Nginx + OpenResty (Lua scripting)

Architecture:
  Traffic → Kong proxy → plugins apply → upstream service

Plugins (each = one responsibility):
  rate-limiting:  per consumer/IP/service limits
  jwt:            validate JWT tokens
  key-auth:       API key authentication
  cors:           CORS headers
  request-transformer: add/modify headers
  response-transformer: modify response
  prometheus:     expose /metrics
  zipkin:         distributed tracing
  
Declarative config (deck sync):
  services:
    - name: user-service
      url: http://user-service:8080
      routes:
        - name: user-routes
          paths: ["/api/v1/users"]
      plugins:
        - name: rate-limiting
          config:
            minute: 1000
            policy: redis
        - name: jwt
          config:
            claims_to_verify: [exp]
```

### When Gateway vs Service Mesh

```
API Gateway:
  North-South traffic (external → internal)
  Single entry point
  Auth, rate limiting, routing for external clients
  
Service Mesh (Istio/Linkerd):
  East-West traffic (service → service internally)
  mTLS, observability, traffic management between services
  
Both in production:
  Internet → API Gateway → [cluster] → Service Mesh → Services
  
  Gateway: "Who is this user? What are they allowed to do?"
  Mesh:    "Is this service-to-service call authenticated?"
```

---

## Retries — Getting It Right

### Thundering Herd Problem

```
10,000 requests hit downstream at t=0.
Downstream slow → all 10,000 timeout at t=5s.
Retry 1: 10,000 retry at t=5s → same server → same problem.
Retry 2: 10,000 retry at t=10s → server barely recovering → slammed again.
Server never recovers.

This is the "retry storm" or "thundering herd" problem.
```

### Correct Retry Strategy

```
1. Exponential Backoff: wait time doubles each retry
   Retry 1: wait 100ms
   Retry 2: wait 200ms
   Retry 3: wait 400ms

2. + Jitter: add random delay
   Retry 1: wait 50-150ms (random)
   Retry 2: wait 100-300ms (random)
   → 10,000 clients spread out their retries over time
   → Server can recover

3. Max attempts: 3-5 max (not infinite)

4. Respect Retry-After header:
   Server: "Too many requests, retry after 30 seconds"
   Client: actually wait 30 seconds

5. Only retry SAFE operations:
   GET, HEAD → safe to retry
   POST /payment → NOT safe to retry (idempotency key required)
   
Envoy retry config:
  retry_policy:
    retry_on: "5xx,reset,connect-failure"  # not 4xx!
    num_retries: 3
    per_try_timeout: 2s
    retry_back_off:
      base_interval: 100ms
      max_interval: 1s
```

---

## Circuit Breaking at Gateway Layer

```
Circuit breaker at gateway:
  Downstream service health monitor karta hai.
  50%+ failures → circuit OPEN → fast fail (503) → no load on downstream.
  
vs Application-level circuit breaker:
  Same logic but inside each service.
  
Gateway-level:
  ✅ Single place to configure for all clients
  ✅ Downstream gets full protection
  ❌ No per-client granularity

Both good, use both for defense in depth.
```

```yaml
# Envoy circuit breaker
circuit_breakers:
  thresholds:
    - priority: DEFAULT
      max_connections: 100
      max_pending_requests: 50
      max_requests: 200
      max_retries: 3
      
# When thresholds exceeded → circuit open → 503 returned
# protects downstream from being overwhelmed
```
