# 05 — Kubernetes Core Concepts (Days 64–65)

> **Core Mental Model:** Kubernetes continuously desired state aur actual state ko reconcile karta hai. Tum declare karte ho kya hona chahiye; controllers kaam karte hain isse sach banane ke liye. Yeh "reconciliation loop" poore K8s ka foundation hai.

---

## K8s Architecture

```
                    ┌──────────────────────────┐
                    │       Control Plane       │
                    │                           │
                    │  kube-apiserver           │
                    │  etcd (state storage)     │
                    │  kube-scheduler           │
                    │  kube-controller-manager  │
                    └──────────┬────────────────┘
                               │ API calls
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────▼──────┐ ┌───────▼──────┐ ┌──────▼───────┐
    │   Node 1        │ │   Node 2     │ │   Node 3     │
    │                 │ │              │ │              │
    │  kubelet        │ │  kubelet     │ │  kubelet     │
    │  kube-proxy     │ │  kube-proxy  │ │  kube-proxy  │
    │  container      │ │  container   │ │  container   │
    │  runtime        │ │  runtime     │ │  runtime     │
    │                 │ │              │ │              │
    │  [Pod] [Pod]    │ │  [Pod] [Pod] │ │  [Pod]       │
    └─────────────────┘ └─────────────┘ └──────────────┘

kube-apiserver: single entry point for all K8s operations
etcd:           stores all cluster state (distributed KV store)
kube-scheduler: decides which node a new pod runs on
kubelet:        runs on every node, ensures pods are running
kube-proxy:     manages network rules on nodes (iptables/ipvs)
```

---

## Pod — Smallest Deployable Unit

```
Pod = one or more containers sharing:
  - Network namespace (same IP, ports)
  - Storage (shared volumes)
  - Lifecycle (start/stop together)

Why multiple containers in a pod?
  Main container:    your application (user-service)
  Sidecar container: Envoy proxy (handles mTLS, tracing)
  Init container:    DB migration runner (runs before main, exits)
  
  These need same network (sidecar proxies localhost traffic) →
  must be in same pod.

Pod = ephemeral (temporary). Expect pods to die.
"Pod killed → pod restarted" = normal operations.
State should be in DB/Redis, not pod memory.
```

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: user-service-pod
  labels:
    app: user-service
    version: v2.1.0
spec:
  containers:
    - name: user-service
      image: registry.company.com/user-service:abc1234   # pinned digest better!
      ports:
        - containerPort: 8080
      env:
        - name: DB_URL
          valueFrom:
            secretKeyRef:
              name: user-service-secrets
              key: db-url
      resources:
        requests:
          cpu: "250m"
          memory: "256Mi"
        limits:
          cpu: "1000m"
          memory: "512Mi"
  initContainers:
    - name: db-migration
      image: registry.company.com/user-service:abc1234
      command: ["./server", "migrate"]
      # runs before main container, must exit 0 for main to start
```

---

## Deployment — Managing Pod Replicas

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: production
spec:
  replicas: 5                           # 5 pods always running
  selector:
    matchLabels:
      app: user-service
  
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2              # deploy karte waqt 2 extra pods ok
      maxUnavailable: 1        # max 1 pod down at a time
  
  template:
    metadata:
      labels:
        app: user-service
        version: v2.1.0
    spec:
      # Spread pods across AZs (high availability)
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app: user-service
      
      # Prefer different nodes (avoid all pods on one node)
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: user-service
                topologyKey: kubernetes.io/hostname
      
      containers:
        - name: user-service
          image: registry.company.com/user-service:abc1234
          
          # Probes
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 10    # startup ke liye time do
            periodSeconds: 15
            failureThreshold: 3        # 3 failures → restart
            timeoutSeconds: 3
          
          readinessProbe:
            httpGet:
              path: /readyz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
            failureThreshold: 2        # 2 failures → remove from LB
            successThreshold: 1        # 1 success → back in LB
          
          startupProbe:               # slow-starting apps ke liye
            httpGet:
              path: /healthz
              port: 8080
            failureThreshold: 30      # 30 × 10s = 5 min to start
            periodSeconds: 10
            # Startup probe pass hone ke baad liveness/readiness start
          
          lifecycle:
            preStop:
              exec:
                command: ["sh", "-c", "sleep 15"]
                # LB ko pod remove karne ka time do pehle SIGTERM mile
          
          resources:
            requests:
              cpu: "250m"
              memory: "256Mi"
            limits:
              cpu: "1000m"
              memory: "512Mi"
      
      terminationGracePeriodSeconds: 30
```

---

## Service — Stable Endpoint for Pods

```
Pods come and go (IPs change).
Service = stable virtual IP + DNS name.

Service types:

ClusterIP (default):
  Internal only. kube-proxy iptables rules se traffic route karta hai.
  user-service.default.svc.cluster.local:8080
  
NodePort:
  Node ka ek port expose karta hai (30000-32767 range).
  External access: nodeIP:30001
  Not production-grade (node IP change ho sakti hai).

LoadBalancer:
  Cloud provider se external LB request karta hai (AWS ALB/NLB).
  Production-grade external access.

ExternalName:
  DNS CNAME record. K8s service jo external DNS point kare.
  Useful: managed DB DNS name K8s service ke through expose karna.
```

```yaml
apiVersion: v1
kind: Service
metadata:
  name: user-service
spec:
  selector:
    app: user-service          # in labels wale pods ko traffic bhejo
  ports:
    - protocol: TCP
      port: 80                 # service port (other services isse call karein)
      targetPort: 8080         # pod port
  type: ClusterIP
```

---

## Ingress — HTTP Routing into Cluster

```
Internet → Ingress Controller (Nginx/Traefik/AWS ALB) → Services

Ingress = routing rules
Ingress Controller = actual proxy that implements rules
```

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
    - hosts:
        - api.company.com
      secretName: api-tls-cert      # cert-manager auto-manages
  rules:
    - host: api.company.com
      http:
        paths:
          - path: /api/v1/users
            pathType: Prefix
            backend:
              service:
                name: user-service
                port:
                  number: 80
          - path: /api/v1/orders
            pathType: Prefix
            backend:
              service:
                name: order-service
                port:
                  number: 80
```

---

## ConfigMap vs Secret

```
ConfigMap: non-sensitive config
  - Environment variables (LOG_LEVEL=debug, FEATURE_FLAG=true)
  - Config files (nginx.conf, app.yaml)
  - Stored in etcd as plain text

Secret: sensitive data
  - DB passwords, API keys, TLS certificates
  - Stored in etcd as base64 (NOT encrypted by default!)
  
⚠️ Base64 ≠ Encryption!
  echo "password" | base64 → cGFzc3dvcmQ=
  echo "cGFzc3dvcmQ=" | base64 -d → password
  Base64 is encoding, not encryption. Anyone with etcd access can read.

Production Secret security:
  1. etcd encryption at rest (K8s config: EncryptionConfiguration)
  2. External Secrets Operator (ESO): sync from Vault/AWS SM → K8s Secret
  3. Sealed Secrets: encrypt Secret, store in Git safely
  4. NEVER store K8s secrets in Git (even base64)
```

```yaml
# External Secrets Operator example (ESO)
# Vault ya AWS Secrets Manager se auto-sync karta hai
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: user-service-db-secret
spec:
  refreshInterval: 1h            # har ghante sync karo
  secretStoreRef:
    name: vault-backend
    kind: ClusterSecretStore
  target:
    name: user-service-db-secret  # K8s Secret ka naam
    creationPolicy: Owner
  data:
    - secretKey: db-url
      remoteRef:
        key: secret/user-service/production
        property: db-url
```

---

## HPA — Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  minReplicas: 3          # Always 3 (HA minimum)
  maxReplicas: 50         # max burst capacity
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70    # scale up jab avg CPU > 70%
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
    # Custom metric: Prometheus se (KEDA se better)
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "1000"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60    # 1 min wait before scaling up more
      policies:
        - type: Percent
          value: 100                     # double pods max in one step
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300   # 5 min wait before scaling down
      policies:
        - type: Pods
          value: 2                       # remove max 2 pods at a time
          periodSeconds: 60
```

---

## PodDisruptionBudget — Safe Voluntary Disruptions

```
Voluntary disruptions:
  - kubectl delete pod (manual)
  - Node drain (maintenance, rolling node upgrade)
  - Cluster autoscaler scale-down

PDB: "Even during voluntary disruptions, minimum X pods must be available"
```

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: user-service-pdb
spec:
  minAvailable: 2            # minimum 2 pods available during disruption
  # OR: maxUnavailable: 1   # max 1 pod unavailable at a time
  selector:
    matchLabels:
      app: user-service

# Node drain karo (maintenance ke liye):
# kubectl drain node-1 --ignore-daemonsets
# PDB ensure karta hai: user-service ke 2+ pods hamesha available
# Agar 3 pods hain (sab ek node pe) aur drain karo →
# PDB block karega drain until pods reschedule hoon
```

---

## Resource Requests & Limits — Production Guide

```
requests: Scheduler ke liye hint. "Iss pod ko node pe schedule karne ke liye
          yeh resources available hone chahiye"
          
limits:   Hard cap. CPU → throttle (pod doesn't die). Memory → OOM kill.

Under-provisioning (requests too low):
  Many pods fit on one node (scheduler doesn't know real needs)
  Node overloaded → all pods slow → cascading slowness

Over-provisioning (requests too high):
  Few pods per node → wasteful, expensive
  
Right-sizing process:
  1. Deploy with generous limits (limits = 2× requests)
  2. Run load test, monitor actual usage (kubectl top pods)
  3. Set requests = P90 usage, limits = P99 usage × 1.5
  4. Monitor OOMKilled events, adjust if needed

Practical starting points for Go services:
  Small:   cpu 100m/500m,  memory 64Mi/256Mi
  Medium:  cpu 250m/1000m, memory 256Mi/512Mi
  Large:   cpu 500m/2000m, memory 512Mi/2048Mi
```
