# 08 — Deployment & Infrastructure at Scale (50M Users)

> **Scenario:** Code ready hai. Ab production mein kaise daalen bina downtime ke? Kubernetes kaise manage karein? Auto-scale kaise karein? Cost kaise optimize karein?

---

## Deployment Strategies

### Rolling Deployment

```
Pods: [v1] [v1] [v1] [v1] [v1]

Step 1: [v2] [v1] [v1] [v1] [v1]   ← 1 pod replaced
Step 2: [v2] [v2] [v1] [v1] [v1]
Step 3: [v2] [v2] [v2] [v1] [v1]
Step 4: [v2] [v2] [v2] [v2] [v1]
Step 5: [v2] [v2] [v2] [v2] [v2]   ← done

✅ Zero downtime (always some pods serving)
✅ Simple (K8s default)
❌ Mixed versions during rollout (compatibility needed)
❌ Slow rollback (roll forward or undo one by one)
```

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2        # 2 extra pods during update
      maxUnavailable: 1  # max 1 pod down at a time
```

### Blue-Green Deployment

```
Blue (current):  [v1] [v1] [v1] [v1] [v1]  ← serving traffic
Green (new):     [v2] [v2] [v2] [v2] [v2]  ← ready, not serving

Test green independently.
Switch traffic: LB points to green.
Instant rollback: switch back to blue.

✅ Instant rollback
✅ Full testing before switch
❌ 2x resources needed temporarily
❌ Database schema must be compatible with both versions
```

### Canary Deployment

```
           ┌──── 95% ────► [v1] [v1] [v1] [v1] [v1]  (stable)
Traffic ───┤
           └──── 5%  ────► [v2]                        (canary)

Monitor canary:
  - Error rate same as stable? ✅
  - Latency same or better? ✅
  - No crash loops? ✅
  → Increase to 25%, then 50%, then 100%

Any metric degrades?
  → Automatic rollback to 0% canary

Tools: Argo Rollouts, Flagger, Istio traffic splitting
```

```yaml
# Argo Rollouts canary
apiVersion: argoproj.io/v1alpha1
kind: Rollout
spec:
  strategy:
    canary:
      steps:
        - setWeight: 5
        - pause: {duration: 5m}      # observe 5 min
        - setWeight: 25
        - pause: {duration: 10m}
        - setWeight: 50
        - pause: {duration: 10m}
        - setWeight: 100
      analysis:
        templates:
          - templateName: error-rate-check
        startingStep: 1
        args:
          - name: service-name
            value: user-service
```

---

## Feature Flags

```
Deploy ≠ Release

Deploy: code production mein hai
Release: feature users ko visible hai

Feature flag se decouple karo.
```

```go
// Feature flag check
func GetUserProfile(ctx context.Context, userID string) (*Profile, error) {
    profile := getBasicProfile(ctx, userID)
    
    if featureflags.IsEnabled("new-recommendation-engine", userID) {
        // New code path — only for flagged users
        profile.Recommendations = newRecoEngine.Get(ctx, userID)
    } else {
        profile.Recommendations = oldRecoEngine.Get(ctx, userID)
    }
    
    return profile, nil
}

// Gradual rollout:
// Day 1: 1% users (internal team)
// Day 3: 10% users
// Day 7: 50% users
// Day 14: 100% users
// Day 21: remove flag, delete old code
```

```
Tools: LaunchDarkly (SaaS), Unleash (open-source), Flipt (open-source)

Rules:
  ✅ Clean up old flags (tech debt grows fast)
  ✅ Use flags for risky features, not every change
  ✅ Flag evaluation should be fast (< 1ms, cached)
  ❌ Don't nest flags (combinatorial explosion)
```

---

## Zero-Downtime Database Migrations

### Problem

```
ALTER TABLE users ADD COLUMN phone VARCHAR(20) NOT NULL;

This locks the table. 50M rows. Lock duration: minutes.
All queries blocked → downtime.
```

### Expand-Contract Pattern

```
Phase 1: EXPAND (backward compatible)
  ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL;   -- nullable, no lock on PG
  Deploy v2: writes to both old + new columns
  Backfill: UPDATE users SET phone = 'unknown' WHERE phone IS NULL;  -- in batches

Phase 2: MIGRATE  
  All code reads from new column
  Old column still exists (safety net)
  
Phase 3: CONTRACT (cleanup)
  ALTER TABLE users DROP COLUMN old_column;
  Remove old code paths

Each phase = separate deployment. Weeks apart. Always rollback-safe.
```

### Large Table Migrations

```
50M rows mein ALTER TABLE = long lock.

Tools:
  - pg_repack: rebuild table without lock
  - gh-ost (MySQL): online schema migration
  - pt-online-schema-change (MySQL)

PostgreSQL tips:
  - ADD COLUMN with DEFAULT: PG 11+ instant (no rewrite)
  - ADD COLUMN NULL: always instant
  - CREATE INDEX CONCURRENTLY: no lock
  - Never: ADD COLUMN NOT NULL without DEFAULT on large table
```

---

## Kubernetes Fundamentals for Backend Engineers

### Core Concepts

```
Pod:         Smallest deployable unit. 1+ containers. Ephemeral.
Deployment:  Manages ReplicaSet → manages Pods. Handles rolling updates.
Service:     Stable network endpoint for pods. ClusterIP, NodePort, LoadBalancer.
ConfigMap:   Non-sensitive config (env vars, config files).
Secret:      Sensitive data (passwords, API keys). Base64 encoded (not encrypted by default!).
Ingress:     HTTP routing from outside cluster to services.
HPA:         Horizontal Pod Autoscaler. Scale pods based on metrics.
PDB:         Pod Disruption Budget. "Always keep at least 3 pods running."
```

### Production K8s Config

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 5
  selector:
    matchLabels:
      app: user-service
  template:
    spec:
      containers:
        - name: user-service
          image: registry.example.com/user-service:v2.1.0  # pinned version, never :latest
          
          resources:
            requests:              # scheduler uses this for placement
              cpu: "250m"          # 0.25 CPU
              memory: "256Mi"
            limits:                # hard cap
              cpu: "1000m"         # 1 CPU
              memory: "512Mi"      # OOMKilled if exceeded
          
          livenessProbe:           # "Is the process alive?"
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 15
            failureThreshold: 3   # 3 failures → restart pod
          
          readinessProbe:          # "Can it serve traffic?"
            httpGet:
              path: /readyz
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
            failureThreshold: 2   # 2 failures → remove from service
          
          lifecycle:
            preStop:
              exec:
                command: ["sh", "-c", "sleep 10"]  # drain connections before SIGTERM
      
      topologySpreadConstraints:   # spread across AZs
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app: user-service
```

### Liveness vs Readiness

```
Liveness:  "Process zinda hai?" 
           Fail → K8s RESTARTS the pod
           Check: basic health, not stuck in deadlock
           ❌ Don't check dependencies here (DB down → all pods restart → worse)

Readiness: "Traffic le sakta hai?"
           Fail → K8s REMOVES pod from Service (no traffic)
           Check: DB connection ready, cache warm, ready to serve
           ✅ Check dependencies here
```

---

## Auto-Scaling

### Horizontal Pod Autoscaler (HPA)

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
  minReplicas: 3
  maxReplicas: 50
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70     # scale up when CPU > 70%
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "1000"       # scale up when > 1000 req/sec per pod
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60   # wait 60s before scaling up more
      policies:
        - type: Percent
          value: 50                     # max 50% increase at once
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300  # wait 5 min before scaling down
      policies:
        - type: Pods
          value: 2                      # remove max 2 pods at a time
          periodSeconds: 60
```

### KEDA — Event-Driven Autoscaling

```
HPA: CPU/memory based (reactive)
KEDA: Scale based on Kafka lag, queue depth, custom metrics (proactive)

"Kafka consumer lag badh raha hai → scale up consumers"
"SQS queue depth > 1000 → scale up workers"
"Cron schedule → scale to 10 at 9am, scale to 2 at midnight"
```

### Cluster Autoscaler

```
Pod pending (no node has capacity) → Cluster Autoscaler adds node
Nodes underutilized (< 50% for 10 min) → Cluster Autoscaler removes node

Chain: Traffic → HPA scales pods → Pods pending → CA scales nodes

Cloud-specific:
  AWS: Karpenter (faster, smarter than Cluster Autoscaler)
  GCP: GKE Autopilot (fully managed)
```

---

## Cost Optimization at Scale

```
50M users infra cost: $50-200K/month typical

Top cost areas:
  1. Compute (K8s nodes):     40-50%
  2. Database (RDS/managed):  20-30%
  3. Data transfer:           10-15%
  4. Storage (S3, EBS):       5-10%
  5. Observability:           5-10%

Optimization strategies:

Compute:
  ✅ Right-size pods (requests/limits based on actual usage)
  ✅ Spot/preemptible instances for stateless workloads (60-90% cheaper)
  ✅ Reserved instances for baseline (1-3 year commit = 40-60% off)
  ✅ Arm instances (Graviton) = 20% cheaper, better perf
  ✅ Aggressive scale-down (dev/staging off at night)

Database:
  ✅ Read replicas instead of scaling primary
  ✅ Connection pooling (PgBouncer) — fewer, larger instances
  ✅ Archive old data to cheap storage
  ✅ Reserved instances for production DBs

Data transfer:
  ✅ Keep services in same AZ when possible
  ✅ Compress inter-service payloads (gRPC + protobuf)
  ✅ CDN for static assets (reduce origin egress)

Storage:
  ✅ S3 lifecycle policies (Standard → IA → Glacier)
  ✅ Log retention policies (don't keep forever)
  ✅ Compress before storing
```

---

## GitOps — Declarative Infrastructure

```
Traditional: SSH into server, run commands, hope it works
GitOps: Everything in Git. Git = source of truth. Automated sync.

┌──────┐    push     ┌──────┐    sync      ┌────────────┐
│ Dev  │────────────►│ Git  │◄─────────────│ ArgoCD /   │
│      │             │ Repo │──────────────►│ Flux       │
└──────┘             └──────┘               └─────┬──────┘
                                                   │ apply
                                                   ▼
                                            ┌────────────┐
                                            │ Kubernetes  │
                                            │ Cluster     │
                                            └────────────┘

ArgoCD: 
  - Watches Git repo for changes
  - Compares desired state (Git) vs actual state (cluster)
  - Auto-syncs or manual approval
  - Drift detection (someone kubectl edited? ArgoCD reverts)
  
Benefits:
  ✅ Audit trail (Git history = deployment history)
  ✅ Rollback = git revert
  ✅ PR-based deployments (review before deploy)
  ✅ Multi-cluster management
```

---

## Production Infra Summary — 50M Users

```
Deployment:
  Strategy: Canary (Argo Rollouts) with automated analysis
  Feature flags: LaunchDarkly/Unleash for risky features
  DB migrations: Expand-contract, never locking ALTERs
  GitOps: ArgoCD syncing from Git

Kubernetes:
  Nodes: 50-100 nodes across 3 AZs
  Pod config: resource requests/limits, liveness/readiness probes, PDB
  Autoscaling: HPA (CPU + custom metrics) + KEDA (event-driven) + Karpenter (nodes)

CI/CD Pipeline:
  Push → Lint + Test → Build image → Security scan → Push to registry
  → Update Git manifests → ArgoCD syncs → Canary deploy → Monitor → Full rollout

Cost:
  ~$100-150K/month (AWS/GCP)
  Spot instances for 40% of compute
  Reserved for databases + baseline nodes
  Monthly cost review + right-sizing
```
