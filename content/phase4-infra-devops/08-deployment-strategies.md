# 08 — Deployment Strategies (Days 70–71)

> **Core Mental Model:** Zero-downtime deployment = traffic gradually shift karo, monitor karo, aur problem pe automatically rollback karo. Database migrations aur deployment decoupled honi chahiye — schema change aur code change same time pe nahi honi chahiye.

---

## Deployment Strategies Overview

```
Strategy comparison:

                  Risk    Speed   Cost    Rollback   Best For
Rolling Update    Medium  Medium  Low     Slow        Most services
Blue-Green        Low     Fast    High    Instant     High-traffic, DB-heavy
Canary            Low     Slow    Medium  Fast        Major changes, risky releases
Feature Flags     Very Low Slow   Medium  Instant     Business logic changes

Production rule: Canary first, then full rollout.
                 Feature flags for anything affecting user experience.
```

---

## Rolling Update — Default K8s Strategy

```
Current state: 5 pods running v1.0
Deploy v1.1:
  1. Kill pod-1 (v1.0)
  2. Start pod-1-new (v1.1)
  3. Wait for readiness probe pass
  4. Kill pod-2 (v1.0)
  5. Start pod-2-new (v1.1)
  ... repeat for all pods

During deploy: some pods v1.0, some v1.1 — BOTH live at same time!
               API changes must be backward compatible!
```

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 5
  
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1         # 1 extra pod during deploy (6 pods max during rollout)
      maxUnavailable: 0   # 0 pods down at once (full availability maintained)
      # Trade-off: maxUnavailable=0 → slower deploy, but no capacity loss
      # maxUnavailable=1 → faster deploy, brief capacity reduction

  template:
    spec:
      containers:
        - name: user-service
          image: user-service:v1.1
          
          readinessProbe:           # ← CRITICAL for zero-downtime
            httpGet:
              path: /readyz
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 5
            failureThreshold: 3
          
          lifecycle:
            preStop:
              exec:
                command: ["sh", "-c", "sleep 15"]
                # LB/Service ko pod remove karne ka time do
                # Traffic drain hone ke baad SIGTERM
```

---

## Blue-Green Deployment

```
Architecture:
  Load Balancer
       │
       ├── Blue  (v1.0) — LIVE (100% traffic)
       └── Green (v1.1) — IDLE (0% traffic)

Deploy process:
  1. Green environment (v1.1) deploy karo aur test karo
  2. Smoke tests pass? 
  3. LB switch: Blue → Green (instant, seconds)
  4. Blue stands by (immediate rollback possible)
  5. After confidence: Blue teardown (cost saving)
  6. Next deploy: Green (current) → Blue (new)

Rollback: LB switch back to Blue → instant (seconds)
```

```yaml
# Kubernetes Blue-Green with Services
# Two Deployments, one Service points to active

# Blue Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service-blue
  labels:
    app: user-service
    slot: blue
spec:
  replicas: 5
  selector:
    matchLabels:
      app: user-service
      slot: blue
  template:
    metadata:
      labels:
        app: user-service
        slot: blue
        version: v1.0
    spec:
      containers:
        - name: user-service
          image: user-service:v1.0
---
# Green Deployment (new version, deploy quietly)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service-green
spec:
  replicas: 5
  selector:
    matchLabels:
      app: user-service
      slot: green
  template:
    metadata:
      labels:
        app: user-service
        slot: green
        version: v1.1
    spec:
      containers:
        - name: user-service
          image: user-service:v1.1
---
# Service — currently pointing to blue
apiVersion: v1
kind: Service
metadata:
  name: user-service
spec:
  selector:
    app: user-service
    slot: blue              # ← Change this to "green" to switch traffic
  ports:
    - port: 80
      targetPort: 8080
```

```bash
# Traffic switch (blue → green)
kubectl patch service user-service \
  -p '{"spec":{"selector":{"slot":"green"}}}'

# Rollback (green → blue)
kubectl patch service user-service \
  -p '{"spec":{"selector":{"slot":"blue"}}}'
```

**Blue-Green Tradeoffs:**
```
✅ Instant rollback (seconds)
✅ Full testing before traffic switch
✅ No v1.0/v1.1 coexistence issues

❌ Double cost during deploy (two full environments)
   50 pods × 2 = 100 pods simultaneously
   For 50M users setup: significant cost
❌ DB migrations tricky (both versions must share same DB schema)
❌ Stateful services harder (cache warmup, connection pools)
```

---

## Canary Deployment — Production Best Practice

```
Send small % of traffic to new version first.
Monitor metrics. Gradually increase if healthy.

Traffic split:
  0%  → v1.1 (initial — deploy but no traffic)
  5%  → v1.1 (5% real users, 95% v1.0)
  20% → v1.1 (monitoring good)
  50% → v1.1 (half and half)
  100%→ v1.1 (full rollout, v1.0 removed)

Each stage: wait N minutes, check error rate + latency.
Automatic rollback if thresholds breached.
```

```yaml
# Argo Rollouts (recommended for canary in K8s)
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: user-service
spec:
  replicas: 10
  strategy:
    canary:
      steps:
        - setWeight: 5        # 5% traffic to canary
        - pause: {duration: 5m}   # 5 min observe karo
        - setWeight: 20       # 20% traffic
        - pause: {duration: 10m}
        - setWeight: 50
        - pause: {duration: 10m}
        - setWeight: 100      # full rollout
      
      # Automatic rollback conditions (Argo Analysis)
      analysis:
        templates:
          - templateName: success-rate-analysis
        startingStep: 1       # analysis starts after first setWeight
        args:
          - name: service-name
            value: user-service
      
      # Traffic management (needs Istio or Nginx)
      trafficRouting:
        istio:
          virtualService:
            name: user-service-vsvc
            routes:
              - primary
  
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
        - name: user-service
          image: user-service:v1.1
          resources:
            requests: {cpu: "250m", memory: "256Mi"}
            limits:   {cpu: "1000m", memory: "512Mi"}
---
# Analysis Template — what to check during canary
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: success-rate-analysis
spec:
  args:
    - name: service-name
  metrics:
    - name: success-rate
      interval: 1m
      count: 10              # 10 measurements lao (10 minutes)
      successCondition: result[0] >= 0.99   # 99%+ success rate required
      failureLimit: 2        # 2 failures → rollback trigger
      provider:
        prometheus:
          address: http://prometheus.monitoring:9090
          query: |
            sum(rate(http_requests_total{
              service="{{args.service-name}}",
              status!~"5.."
            }[1m])) /
            sum(rate(http_requests_total{
              service="{{args.service-name}}"
            }[1m]))
    
    - name: p99-latency
      interval: 1m
      successCondition: result[0] <= 0.5    # P99 <= 500ms
      failureLimit: 2
      provider:
        prometheus:
          address: http://prometheus.monitoring:9090
          query: |
            histogram_quantile(0.99, 
              sum(rate(http_request_duration_seconds_bucket{
                service="{{args.service-name}}"
              }[1m])) by (le)
            )
```

---

## Feature Flags — Decouple Deploy from Release

```
Problem without feature flags:
  New feature → deploy → immediately live to all users
  Bug found → rollback entire deployment (not just feature)
  50M users affected, can't test in production with real traffic

With feature flags:
  New feature → deploy (flag OFF) → 0% users see it
  Gradually enable:
    Internal → 1% → 5% → 20% → 100%
  Bug found → turn flag OFF → immediate (no deployment needed)
  
Feature flag lifecycle:
  1. DARK DEPLOY: code deployed, flag OFF (0% exposure)
  2. INTERNAL: company employees only
  3. BETA: opt-in users / canary %
  4. GRADUAL ROLLOUT: 1% → 5% → 20% → 100%
  5. FULL: all users
  6. CLEANUP: remove flag code (tech debt prevention)
```

```go
// Feature flag evaluation in Go (using LaunchDarkly/Unleash/custom)
package feature

import (
    "context"
    ld "gopkg.in/launchdarkly/go-server-sdk.v6"
)

type Flags struct {
    client *ld.LDClient
}

// Evaluate flag for specific user context
func (f *Flags) NewCheckoutEnabled(ctx context.Context, userID string) bool {
    user := ld.NewUser(userID)
    
    result, err := f.client.BoolVariation("new-checkout-flow", user, false)
    if err != nil {
        // Flag evaluation fail → safe default (false = old behavior)
        return false
    }
    return result
}

// Usage in handler
func (h *Handler) HandleCheckout(w http.ResponseWriter, r *http.Request) {
    userID := getUserID(r.Context())
    
    if h.flags.NewCheckoutEnabled(r.Context(), userID) {
        h.newCheckoutHandler(w, r)    // new code path
    } else {
        h.oldCheckoutHandler(w, r)   // safe, proven old path
    }
}
```

```
⚠️ Feature flag cleanup CRITICAL:
  Uncleaned flags = dead code + confusion + tech debt
  Rule: Flag must be removed within 2 sprints of 100% rollout
  Process: JIRA ticket auto-created when flag hits 100%
           Code reviewed to remove flag check + dead code branch
```

---

## DB Migrations — Expand-Contract Pattern

```
Problem: Monolithic migration approach
  Step 1: Rename column users.name → users.full_name
  Step 2: Deploy new code using full_name
  
  During deploy: old pods use "name", new pods use "full_name"
  BOTH alive simultaneously during rolling update!
  → Old pods: SELECT name → column doesn't exist → 500 error
  → DOWNTIME
```

### Expand-Contract (Zero-Downtime Column Rename)

```
Goal: Rename users.name → users.full_name without downtime

Phase 1 — EXPAND (backward compatible):
  Migration: ADD COLUMN full_name VARCHAR(255)
             Copy data: UPDATE users SET full_name = name
             Add trigger: keep both columns in sync
  Deploy: Code still uses old column "name"
  Result: Both columns exist, both have data
          Old pods: use "name" ✅
          (No new deployment yet)

Phase 2 — MIGRATE CODE:
  Deploy: Code switched to use "full_name" column
  Old pods (rolling): use "name" (still works, trigger keeps in sync)
  New pods (rolling): use "full_name" ✅
  Result: All pods eventually use "full_name"

Phase 3 — CONTRACT (cleanup):
  Verify: All pods using "full_name", no "name" usage in code
  Migration: DROP COLUMN name
  Remove trigger
  
  Timeline: Phase 1 → few days → Phase 2 → few days → Phase 3
  Downtime: ZERO throughout
```

```sql
-- Phase 1: Expand migration
ALTER TABLE users ADD COLUMN full_name VARCHAR(255);

-- Copy existing data
UPDATE users SET full_name = name WHERE full_name IS NULL;

-- Keep in sync during transition (PostgreSQL trigger)
CREATE OR REPLACE FUNCTION sync_name_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.name IS NOT NULL AND NEW.full_name IS NULL THEN
      NEW.full_name := NEW.name;
    END IF;
    IF NEW.full_name IS NOT NULL AND NEW.name IS NULL THEN
      NEW.name := NEW.full_name;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_name_full_name
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION sync_name_columns();

-- Phase 3: Contract migration (after code cleanup)
DROP TRIGGER sync_name_full_name ON users;
DROP FUNCTION sync_name_columns();
ALTER TABLE users DROP COLUMN name;
```

---

## Production Deployment Rules

```
Checklist before every production deploy:

1. DATABASE MIGRATIONS:
   ☐ Migration backward compatible? (Expand phase only)
   ☐ No column drops alongside code deploy?
   ☐ Index created CONCURRENTLY? (not blocking)
   
   # PostgreSQL index creation without locking:
   CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
   # vs: CREATE INDEX idx_users_email ON users(email);
   # CONCURRENTLY = reads/writes continue during index build

2. API COMPATIBILITY:
   ☐ New endpoints additive? (old endpoints still work)
   ☐ Request/response fields additive? (no field renames in same deploy)
   ☐ Breaking changes behind feature flag?

3. MONITORING:
   ☐ Error rate dashboard open
   ☐ Latency P99 dashboard open
   ☐ Auto-rollback configured?
   ☐ On-call engineer notified

4. TIMING:
   ☐ Not Friday afternoon (weekend incident risk)
   ☐ Not peak traffic hours (lower blast radius off-peak)
   ☐ Feature freeze windows respected
   
5. ROLLBACK PLAN:
   ☐ kubectl rollout undo ready?
   ☐ Database migration reversible? (or contract delayed?)
   ☐ Previous artifact tag known?
```
