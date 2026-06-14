# 03 — Service Discovery & Service Mesh (50M Users)

> **Scenario:** 50+ microservices. Services auto-scale (pods aate-jaate rehte hain). IPs dynamic hain. Ek service ko dusri service kaise dhoondhe? Service-to-service communication secure kaise ho?

---

## Service Discovery — Services Ko Kaise Dhundhein

### Problem

```
Order Service ko User Service call karna hai.

Monolith mein:  userService.GetUser(id)  → function call, same process

Microservices:  User Service kahan hai?
                - IP kya hai? (pod restart = naya IP)
                - Port kya hai?
                - Kitne instances hain?
                - Kaunsa healthy hai?
```

### DNS-Based Discovery (Simple)

```
Kubernetes default:
  Service name = DNS name

  Order Service → http://user-service.default.svc.cluster.local:8080/users/123
  
  Kubernetes DNS resolves "user-service" → ClusterIP → kube-proxy routes to healthy pod

✅ Simple, built-in, no extra infra
✅ Every language supports DNS
❌ DNS caching = stale endpoints (pod died, DNS still resolves to old IP)
❌ No health check at DNS level (relies on kube-proxy)
❌ No metadata (version, region, canary tags)
```

### Registry-Based Discovery (Production-Grade)

```
┌────────────┐     Register: "I'm user-service at 10.0.1.5:8080"
│ User Svc   │────────────────────────────►┌──────────────┐
│ Instance 1 │                              │   Service    │
└────────────┘                              │   Registry   │
┌────────────┐     Register: "I'm user-svc │  (Consul /   │
│ User Svc   │──────at 10.0.1.6:8080" ────►│   etcd)      │
│ Instance 2 │                              └──────┬───────┘
└────────────┘                                     │
                                                   │ Query: "Where is
┌────────────┐     "user-service is at             │  user-service?"
│ Order Svc  │◄────10.0.1.5 and 10.0.1.6" ────────┘
└────────────┘     + health status, metadata
```

**Consul example:**
```json
// Service registration
{
    "service": {
        "name": "user-service",
        "port": 8080,
        "tags": ["v2", "canary"],
        "meta": {"version": "2.1.0", "region": "ap-south-1"},
        "check": {
            "http": "http://localhost:8080/healthz",
            "interval": "10s",
            "timeout": "3s"
        }
    }
}
```

```go
// Client-side discovery
func getUserServiceAddr(consulClient *consul.Client) (string, error) {
    entries, _, err := consulClient.Health().Service("user-service", "v2", true, nil)
    // true = only passing health checks
    if err != nil {
        return "", err
    }
    
    // Client-side load balancing
    entry := entries[rand.Intn(len(entries))]
    return fmt.Sprintf("%s:%d", entry.Service.Address, entry.Service.Port), nil
}
```

### Client-Side vs Server-Side Discovery

```
Client-Side Discovery:
  Client → Registry (get addresses) → Client picks one → Direct call to service
  
  ✅ No extra proxy hop
  ✅ Client controls LB strategy
  ❌ Every client needs discovery logic
  ❌ Language-specific SDK needed

Server-Side Discovery:
  Client → Load Balancer/Proxy → Proxy queries registry → Routes to service
  
  ✅ Client is simple (just call the LB)
  ✅ Language agnostic
  ❌ Extra network hop
  ❌ LB is potential bottleneck
```

**Kubernetes approach:** Server-side via kube-proxy + ClusterIP. Client calls service name, kube-proxy routes.

---

## Service Mesh — Infrastructure Layer for Service Communication

### Problem Service Mesh Solve Karta Hai

```
Bina service mesh ke, har service mein yeh logic likhna padta hai:
  - Service discovery
  - Load balancing
  - Retry logic
  - Circuit breaking
  - Timeout management
  - mTLS (mutual TLS)
  - Tracing headers propagation
  - Rate limiting
  - Canary routing

50 services × 8 cross-cutting concerns = 400 implementations
Different languages (Go, Java, Node) = 3x more work
Bug in retry logic? Fix in ALL 50 services.
```

### Sidecar Proxy Pattern

```
┌─────────────────────────────────────────────┐
│                   Pod                        │
│  ┌──────────────┐    ┌───────────────────┐  │
│  │  User Service │    │   Envoy Sidecar   │  │
│  │  (your code)  │◄──►│   (proxy)         │  │
│  │               │    │                   │  │
│  │  Speaks plain │    │  Handles:         │  │
│  │  HTTP to      │    │  - mTLS           │  │
│  │  localhost     │    │  - retry          │  │
│  └──────────────┘    │  - circuit break   │  │
│                       │  - tracing        │  │
│                       │  - load balancing  │  │
│                       └────────┬──────────┘  │
└────────────────────────────────┼──────────────┘
                                 │
                        Encrypted mTLS traffic
                                 │
┌────────────────────────────────┼──────────────┐
│                   Pod          │               │
│  ┌──────────────┐    ┌────────▼──────────┐   │
│  │ Order Service │◄──►│  Envoy Sidecar    │   │
│  └──────────────┘    └───────────────────┘   │
└───────────────────────────────────────────────┘
```

**Application ka traffic localhost:port pe jaata hai → Envoy intercept karta hai → encryption, routing, retry sab handle karta hai → destination service ke Envoy pe pahunchta hai → decrypt → local service ko deliver.**

Application ko kuch nahi pata — plain HTTP bol rahi hai localhost se. Security, reliability sab mesh handle karta hai.

### Istio Architecture

```
                    ┌──────────────────────┐
                    │    Control Plane      │
                    │       (istiod)        │
                    │                       │
                    │  - Config distribution│
                    │  - Certificate mgmt  │
                    │  - Service discovery  │
                    │  - Policy enforcement │
                    └──────────┬────────────┘
                               │ pushes config
                    ┌──────────▼────────────┐
                    │     Data Plane         │
                    │  (Envoy Sidecars)      │
                    │                        │
                    │  Pod A ←─► Envoy      │
                    │  Pod B ←─► Envoy      │
                    │  Pod C ←─► Envoy      │
                    └────────────────────────┘

Control Plane: "Rules kya hain" (config, certs, policies)
Data Plane: "Traffic actually handle karo" (Envoy proxies)
```

### mTLS — Mutual TLS Between Services

```
Normal TLS (HTTPS):
  Client verifies server identity (server certificate)
  Server doesn't verify client
  
Mutual TLS:
  Client verifies server ✅
  Server verifies client ✅
  Both have certificates
  
Why?
  Kubernetes cluster mein koi bhi pod kisi bhi service ko call kar sakta hai.
  mTLS ensures: "Sirf authorized services hi communicate kar sakti hain"
  
  Order Service → User Service: 
    Order Service proves "main Order Service hoon" (client cert)
    User Service proves "main User Service hoon" (server cert)
    Encrypted channel established ✅
    
Istio mein automatic:
  - Certificates auto-generated per service
  - Auto-rotated (24 hours default)
  - No code changes needed
  - Zero-trust networking achieved
```

### Traffic Management

```yaml
# Istio VirtualService — canary routing
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: user-service
spec:
  hosts:
    - user-service
  http:
    - match:
        - headers:
            x-canary:
              exact: "true"
      route:
        - destination:
            host: user-service
            subset: v2      # canary version
    - route:
        - destination:
            host: user-service
            subset: v1      # stable version
          weight: 95
        - destination:
            host: user-service
            subset: v2
          weight: 5         # 5% canary traffic
```

```yaml
# Retry policy
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
spec:
  http:
    - retries:
        attempts: 3
        perTryTimeout: 2s
        retryOn: "5xx,reset,connect-failure,retriable-4xx"
      timeout: 10s
```

### Istio vs Linkerd

```
Istio:
  ✅ Feature-rich (traffic mgmt, security, observability)
  ✅ Envoy-based (mature, extensible)
  ❌ Complex (steep learning curve)
  ❌ Resource overhead (~100MB per sidecar)
  ❌ Debugging hard (many moving parts)

Linkerd:
  ✅ Simple, lightweight (~20MB per proxy)
  ✅ Easy to install and understand
  ✅ Rust-based proxy (linkerd2-proxy) — fast, small
  ❌ Fewer features than Istio
  ❌ Less extensible
  
Recommendation:
  Start with Linkerd (simpler)
  Move to Istio only if you need advanced traffic mgmt
  Many teams go meshless with good HTTP client libraries
```

### Kab Service Mesh NAHI Chahiye

```
❌ Don't use mesh if:
  - < 10 services
  - Single language (Go) with good HTTP client libraries
  - Team doesn't have infra expertise to debug mesh issues
  - Latency sensitivity (sidecar adds ~1-3ms per hop)

✅ Use mesh if:
  - 50+ services, multiple languages
  - Need zero-trust networking (mTLS everywhere)
  - Complex traffic routing (canary, A/B, fault injection)
  - Compliance requires encrypted service-to-service traffic
  - Need uniform observability without code changes
```

---

## Production Setup — 50M Users

```
Service Communication:
  Internal (cluster): Kubernetes DNS + kube-proxy (simple services)
                      OR Istio/Linkerd (complex, high-security)
  
  External (cross-region): gRPC with client-side LB
                           OR Envoy as edge proxy with health checks
  
  Service registry: Kubernetes built-in (for K8s services)
                    Consul (for hybrid/multi-cloud)

mTLS: 
  Within cluster: Istio auto-mTLS or cert-manager + manual
  Cross-cluster: Manual cert management or Consul Connect

Discovery latency budget:
  DNS resolution:      < 1ms (cached)
  Registry lookup:     < 5ms
  Sidecar proxy hop:   1-3ms added per hop
  
  Total acceptable overhead: < 10ms per service-to-service call
```
