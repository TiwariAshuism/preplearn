---
source: notion
title: "Week 4 — Production Toolchain (Days 22–30)"
slug: "week-4-production-toolchain-days-22-30"
notionId: "36cda883-bddd-8177-aae4-e4e9b448b9c5"
notionRootId: "36cda883bddd812fb940e5b8d2d2f3a9"
parent: "30-day-docker-kubernetes-roadmap"
children: []
order: 0
icon: "🚀"
cover: null
---
> **Core insight:** A Kubernetes cluster without observability, GitOps, security scanning, and a service mesh is a development environment, not a production system. Week 4 adds every tool that separates a cluster you demo from a cluster you trust with real traffic at 3am.

---


## 📅 Day 22 — ArgoCD: GitOps Continuous Delivery


### Why GitOps

- Git is the single source of truth for cluster state
- Any change to the cluster goes through a PR — reviewed, approved, audited
- ArgoCD continuously syncs what’s in Git with what’s running in the cluster
- Drift detection: if someone `kubectl apply`s manually, ArgoCD detects and corrects it

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
kubectl wait --for=condition=Available deployment/argocd-server -n argocd --timeout=120s

# Get initial admin password
kubectl get secret argocd-initial-admin-secret -n argocd \
  -o jsonpath="{.data.password}" | base64 -d

# Port-forward the UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Open https://localhost:8080 (user: admin, password from above)

# Install ArgoCD CLI
brew install argocd
argocd login localhost:8080 --username admin --insecure

# Change admin password
argocd account update-password
```


### Create an Application


```yaml
# argocd-app.yaml — ArgoCD Application manifest
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-go-service
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/yourusername/my-go-service
    targetRevision: main
    path: k8s/overlays/production
    # For Helm charts:
    # chart: my-go-service
    # helm:
    #   valueFiles:
    #   - values.prod.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true       # delete resources removed from git
      selfHeal: true    # auto-fix manual changes
    syncOptions:
    - CreateNamespace=true
    - ApplyOutOfSyncOnly=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```


```bash
kubectl apply -f argocd-app.yaml

# Check sync status
argocd app get my-go-service
argocd app list

# Manual sync (if automated is off)
argocd app sync my-go-service

# Watch sync in terminal
argocd app wait my-go-service --sync

# Get app diff (what would change)
argocd app diff my-go-service

# Rollback to previous version
argocd app rollback my-go-service

# App of Apps pattern: one ArgoCD app that manages other apps
# bootstrap-app.yaml points to a directory of Application manifests
```


### ArgoCD Image Updater


```yaml
# Automatically update image tags in git when new images are pushed
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-go-service
  annotations:
    argocd-image-updater.argoproj.io/image-list: myapp=docker.io/yourusername/myapp
    argocd-image-updater.argoproj.io/myapp.update-strategy: semver
    argocd-image-updater.argoproj.io/myapp.allow-tags: regexp:^[0-9]+\.[0-9]+\.[0-9]+$
    argocd-image-updater.argoproj.io/write-back-method: git
```


---


## 📅 Day 23 — Prometheus & Grafana: Metrics


```bash
# Install kube-prometheus-stack (Prometheus + Grafana + Alertmanager + node-exporter)
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install kube-prom prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.adminPassword=admin123 \
  --set prometheus.prometheusSpec.retention=15d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi

# Access Grafana
kubectl port-forward svc/kube-prom-grafana -n monitoring 3000:80
# http://localhost:3000  admin / admin123

# Access Prometheus
kubectl port-forward svc/kube-prom-kube-prometheus-prometheus -n monitoring 9090:9090
# http://localhost:9090

# Access Alertmanager
kubectl port-forward svc/kube-prom-kube-prometheus-alertmanager -n monitoring 9093:9093
```


### Instrument your Go service


```go
// pkg/observability/metrics.go
package observability

import (
    "net/http"
    "time"

    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promauto"
    "github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
    httpRequestsTotal = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "myapp",
            Name:      "http_requests_total",
            Help:      "Total HTTP requests",
        },
        []string{"method", "path", "status"},
    )

    httpRequestDuration = promauto.NewHistogramVec(
        prometheus.HistogramOpts{
            Namespace: "myapp",
            Name:      "http_request_duration_seconds",
            Help:      "HTTP request duration",
            Buckets:   []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5},
        },
        []string{"method", "path"},
    )

    activeConnections = promauto.NewGauge(
        prometheus.GaugeOpts{
            Namespace: "myapp",
            Name:      "active_connections",
            Help:      "Current active connections",
        },
    )

    ordersProcessed = promauto.NewCounterVec(
        prometheus.CounterOpts{
            Namespace: "myapp",
            Name:      "orders_processed_total",
            Help:      "Total orders processed by status",
        },
        []string{"status"},
    )
)

// Middleware records every HTTP request
func MetricsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        rw := &responseWriter{ResponseWriter: w, status: 200}
        activeConnections.Inc()
        next.ServeHTTP(rw, r)
        activeConnections.Dec()

        duration := time.Since(start).Seconds()
        status := http.StatusText(rw.status)

        httpRequestsTotal.WithLabelValues(r.Method, r.URL.Path, status).Inc()
        httpRequestDuration.WithLabelValues(r.Method, r.URL.Path).Observe(duration)
    })
}

// Expose /metrics endpoint
func MetricsHandler() http.Handler {
    return promhttp.Handler()
}
```


### ServiceMonitor: tell Prometheus to scrape your app


```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: my-go-api
  namespace: production
  labels:
    release: kube-prom   # must match kube-prom-stack's serviceMonitorSelector
spec:
  selector:
    matchLabels:
      app: my-go-api
  endpoints:
  - port: http
    path: /metrics
    interval: 15s
    scrapeTimeout: 10s
  namespaceSelector:
    matchNames:
    - production
```


### PrometheusRule: define alerts


```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: my-go-api-alerts
  namespace: production
  labels:
    release: kube-prom
spec:
  groups:
  - name: my-go-api
    interval: 30s
    rules:
    - alert: HighErrorRate
      expr: |
        sum(rate(myapp_http_requests_total{status="Internal Server Error"}[5m]))
        /
        sum(rate(myapp_http_requests_total[5m])) > 0.01
      for: 2m
      labels:
        severity: critical
        team: backend
      annotations:
        summary: "High error rate on {{ $labels.pod }}"
        description: "Error rate is {{ $value | humanizePercentage }} (threshold: 1%)"

    - alert: SlowRequests
      expr: |
        histogram_quantile(0.99, sum(rate(myapp_http_request_duration_seconds_bucket[5m])) by (le, path))
        > 2.0
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "P99 latency above 2s for {{ $labels.path }}"

    - alert: PodCrashLooping
      expr: rate(kube_pod_container_status_restarts_total{namespace="production"}[15m]) * 60 * 15 > 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "Pod {{ $labels.pod }} is crash looping"

    - alert: PodNotReady
      expr: kube_pod_status_ready{namespace="production", condition="true"} == 0
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "Pod {{ $labels.pod }} not ready for 5 minutes"
```


### Useful PromQL queries


```javascript
# Request rate (req/sec)
sum(rate(myapp_http_requests_total[5m])) by (path)

# Error rate %
sum(rate(myapp_http_requests_total{status=~"5.."}[5m])) / sum(rate(myapp_http_requests_total[5m])) * 100

# P50 / P95 / P99 latency
histogram_quantile(0.50, sum(rate(myapp_http_request_duration_seconds_bucket[5m])) by (le))
histogram_quantile(0.95, sum(rate(myapp_http_request_duration_seconds_bucket[5m])) by (le))
histogram_quantile(0.99, sum(rate(myapp_http_request_duration_seconds_bucket[5m])) by (le))

# Pod CPU usage
sum(rate(container_cpu_usage_seconds_total{namespace="production"}[5m])) by (pod)

# Pod memory usage
sum(container_memory_working_set_bytes{namespace="production"}) by (pod)

# Cluster CPU utilisation
sum(rate(node_cpu_seconds_total{mode!="idle"}[5m])) / sum(rate(node_cpu_seconds_total[5m])) * 100
```


---


## 📅 Day 24 — Loki + Grafana: Log Aggregation


```bash
# Install Loki stack (Loki + Promtail)
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

helm install loki grafana/loki-stack \
  --namespace monitoring \
  --set grafana.enabled=false \
  --set loki.persistence.enabled=true \
  --set loki.persistence.size=20Gi \
  --set promtail.enabled=true

# Promtail runs as DaemonSet on every node
# It automatically ships logs from every pod to Loki
kubectl get daemonset -n monitoring
kubectl get pods -n monitoring -l app=promtail
```


### Add Loki as data source in Grafana


```bash
# In Grafana UI:
# Configuration > Data Sources > Add data source > Loki
# URL: http://loki:3100

# Or via Helm values:
helm upgrade kube-prom prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set grafana.additionalDataSources[0].name=Loki \
  --set grafana.additionalDataSources[0].type=loki \
  --set grafana.additionalDataSources[0].url=http://loki:3100
```


### LogQL queries (Loki query language)


```javascript
# All logs from production namespace
{namespace="production"}

# Logs from specific app
{namespace="production", app="my-go-api"}

# Filter for errors
{namespace="production", app="my-go-api"} |= "level=error"

# JSON log parsing + filter
{namespace="production"} | json | level="error"

# Count error rate over time
sum(rate({namespace="production"} |= "error" [5m]))

# Latency from structured logs
{namespace="production"} | json | latency_ms > 1000

# Pattern match
{namespace="production"} |~ "(ERROR|WARN|FATAL)"

# Top paths by request count
topk(10,
  sum by (path) (
    rate({namespace="production"} | json | __error__="" [5m])
  )
)
```


### Add structured logging labels for better Loki queries


```go
// Your Go structured logs become Loki-queryable fields
slog.InfoContext(ctx, "request completed",
    "level",      "info",
    "method",     r.Method,
    "path",       r.URL.Path,
    "status",     status,
    "latency_ms", latency,
    "request_id", requestID,
    "user_id",    userID,
    "trace_id",   traceID,
)
// In Loki: {app="my-go-api"} | json | status > 400
```


---


## 📅 Day 25 — Istio: Service Mesh


### What Istio adds

- mTLS between all services (automatic, transparent)
- Traffic management: canary, weighted routing, circuit breaking, retries
- Observability: traces, metrics, access logs for every service call
- Security policies: authorisation between services

```bash
# Install Istio
curl -L https://istio.io/downloadIstio | sh -
export PATH=$PWD/istio-1.21.0/bin:$PATH

istioctl install --set profile=demo -y

# Enable sidecar injection for your namespace
kubectl label namespace production istio-injection=enabled

# After labelling, redeploy your app
# Istio injects an Envoy sidecar proxy into every pod automatically
kubectl rollout restart deployment/my-go-api -n production

# Verify sidecars injected (2/2 containers per pod)
kubectl get pods -n production
# NAME                           READY   STATUS    RESTARTS
# my-go-api-7d4b8c9f6-abc12      2/2     Running   0
# (your container + istio-proxy)

# Install Istio addons (Kiali, Jaeger, Prometheus, Grafana)
kubectl apply -f istio-1.21.0/samples/addons/
istioctl dashboard kiali    # service map
istioctl dashboard jaeger   # distributed traces
```


### Traffic management


```yaml
# VirtualService: intelligent routing rules
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-go-api
  namespace: production
spec:
  hosts:
  - my-go-api
  http:
  - match:
    - headers:
        x-user-group:
          exact: beta-testers
    route:
    - destination:
        host: my-go-api
        subset: v2       # beta testers get v2
      weight: 100
  - route:               # everyone else gets v1
    - destination:
        host: my-go-api
        subset: v1
      weight: 90
    - destination:
        host: my-go-api
        subset: v2
      weight: 10         # 10% canary
  retries:
    attempts: 3
    perTryTimeout: 2s
    retryOn: 5xx,reset,connect-failure
  timeout: 10s
  fault:
    delay:               # inject delay for testing
      percentage:
        value: 1.0       # 1% of requests delayed
      fixedDelay: 5s
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: my-go-api
  namespace: production
spec:
  host: my-go-api
  trafficPolicy:
    connectionPool:
      http:
        h2UpgradePolicy: UPGRADE
        http1MaxPendingRequests: 100
    outlierDetection:        # circuit breaker
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
  subsets:
  - name: v1
    labels:
      version: "1.0.0"
  - name: v2
    labels:
      version: "2.0.0"
---
# PeerAuthentication: enforce mTLS
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT    # all traffic must use mTLS, no plaintext
---
# AuthorizationPolicy: service-to-service access control
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-api-to-postgres
  namespace: production
spec:
  selector:
    matchLabels:
      app: postgres
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/production/sa/my-go-api"]
    to:
    - operation:
        ports: ["5432"]
```


---


## 📅 Day 26 — Trivy + Falco: Security Scanning


### Trivy: vulnerability scanner


```bash
# Scan container images
trivy image myapp:latest
trivy image --severity HIGH,CRITICAL myapp:latest
trivy image --exit-code 1 --severity CRITICAL myapp:latest  # fail CI on critical

# Scan Kubernetes manifests for misconfigurations
trivy config ./k8s/
trivy config --severity HIGH,CRITICAL ./k8s/

# Scan a running cluster
trivy k8s --report summary cluster
trivy k8s --namespace production --report all cluster

# Scan Helm charts
trivy config ./charts/my-go-service/

# Scan filesystem (SBOM)
trivy fs .
trivy sbom --format cyclonedx ./

# Trivy as Kubernetes Operator (continuous scanning)
helm repo add aqua https://aquasecurity.github.io/helm-charts/
helm install trivy-operator aqua/trivy-operator \
  --namespace trivy-system \
  --create-namespace \
  --set trivy.ignoreUnfixed=true

# View scan results as Kubernetes objects
kubectl get vulnerabilityreports -A
kubectl get configauditreports -A
kubectl describe vulnerabilityreport -n production <report-name>
```


### Falco: runtime security


```bash
# Falco watches kernel syscalls and alerts on suspicious behaviour:
# - shell opened inside a container
# - file written to /etc or /bin
# - network connection from unexpected process
# - privilege escalation attempt

helm repo add falcosecurity https://falcosecurity.github.io/charts
helm install falco falcosecurity/falco \
  --namespace falco --create-namespace \
  --set tty=true

# Watch Falco alerts in real time
kubectl logs -n falco -l app=falco -f

# Trigger a Falco alert (test it works)
kubectl exec -it <any-pod> -- sh
# Falco will immediately log: "A shell was spawned in a container"
```


```yaml
# Custom Falco rule: alert when Go binary is replaced
- rule: Binary Modified in Container
  desc: A binary in a running container was modified
  condition: >
    open_write and container and
    (fd.name startswith /bin or fd.name startswith /usr/bin or fd.name startswith /sbin)
  output: >
    Binary modified in container
    (user=%user.name container=%container.name image=%container.image.repository
     file=%fd.name)
  priority: CRITICAL
  tags: [container, integrity]
```


### OPA Gatekeeper: policy enforcement


```bash
# Install Gatekeeper
helm repo add gatekeeper https://open-policy-agent.github.io/gatekeeper/charts
helm install gatekeeper gatekeeper/gatekeeper --namespace gatekeeper-system --create-namespace
```


```yaml
# Constraint: all containers must have resource limits
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredResources
metadata:
  name: require-resource-limits
spec:
  match:
    kinds:
    - apiGroups: [""]
      kinds: ["Pod"]
    excludedNamespaces: ["kube-system"]
  parameters:
    limits: ["cpu", "memory"]
    requests: ["cpu", "memory"]
```


---


## 📅 Day 27 — Tekton: Cloud-Native CI/CD


```bash
# Install Tekton
kubectl apply -f https://storage.googleapis.com/tekton-releases/pipeline/latest/release.yaml
kubectl apply -f https://storage.googleapis.com/tekton-releases/triggers/latest/release.yaml

# Install tkn CLI
brew install tektoncd-cli
```


```yaml
# pipeline.yaml — full CI/CD pipeline
apiVersion: tekton.dev/v1
kind: Pipeline
metadata:
  name: go-build-deploy
spec:
  params:
  - name: image
    type: string
  - name: git-url
    type: string
  - name: git-revision
    type: string
    default: main
  workspaces:
  - name: source
  tasks:
  - name: clone
    taskRef:
      name: git-clone
      kind: ClusterTask
    workspaces:
    - name: output
      workspace: source
    params:
    - name: url
      value: $(params.git-url)
    - name: revision
      value: $(params.git-revision)

  - name: test
    runAfter: [clone]
    taskRef:
      name: golang-test
      kind: ClusterTask
    workspaces:
    - name: source
      workspace: source
    params:
    - name: package
      value: ./...
    - name: flags
      value: -race -coverprofile=coverage.out

  - name: scan
    runAfter: [clone]
    taskSpec:
      steps:
      - name: trivy-scan
        image: aquasec/trivy:latest
        script: |
          trivy fs --exit-code 1 --severity CRITICAL /workspace/source
    workspaces:
    - name: source
      workspace: source

  - name: build-push
    runAfter: [test, scan]
    taskRef:
      name: kaniko
      kind: ClusterTask
    workspaces:
    - name: source
      workspace: source
    params:
    - name: IMAGE
      value: $(params.image)
    - name: DOCKERFILE
      value: ./Dockerfile
    - name: EXTRA_ARGS
      value:
      - --cache=true
      - --cache-repo=$(params.image)-cache

  - name: deploy
    runAfter: [build-push]
    taskSpec:
      steps:
      - name: argocd-sync
        image: argoproj/argocd:latest
        script: |
          argocd app set my-go-service --helm-set image.tag=$(params.git-revision)
          argocd app sync my-go-service --wait
    params: []
```


```bash
# Run the pipeline
tkn pipeline start go-build-deploy \
  --param image=docker.io/yourusername/myapp \
  --param git-url=https://github.com/yourusername/my-go-service \
  --workspace name=source,claimName=pipeline-pvc \
  --showlog

# List pipeline runs
tkn pipelinerun list

# Get logs
tkn pipelinerun logs go-build-deploy-run-xyz -f
```


---


## 📅 Day 28 — Distributed Tracing: OpenTelemetry + Tempo


```bash
# Install Grafana Tempo
helm install tempo grafana/tempo \
  --namespace monitoring \
  --set tempo.storage.trace.backend=local \
  --set tempo.storage.trace.local.path=/var/tempo

# Install OpenTelemetry Collector
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
helm install otel-collector open-telemetry/opentelemetry-collector \
  --namespace monitoring \
  --values otel-collector-values.yaml
```


```yaml
# otel-collector-values.yaml
config:
  receivers:
    otlp:
      protocols:
        grpc:
          endpoint: 0.0.0.0:4317
        http:
          endpoint: 0.0.0.0:4318
  processors:
    batch:
      timeout: 1s
    memory_limiter:
      limit_mib: 400
  exporters:
    otlp:
      endpoint: tempo:4317
      tls:
        insecure: true
    prometheus:
      endpoint: 0.0.0.0:8889
  service:
    pipelines:
      traces:
        receivers: [otlp]
        processors: [memory_limiter, batch]
        exporters: [otlp]
      metrics:
        receivers: [otlp]
        processors: [batch]
        exporters: [prometheus]
```


```go
// pkg/observability/tracing.go
package observability

import (
    "context"
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
    "go.opentelemetry.io/otel/sdk/resource"
    sdktrace "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
    "go.opentelemetry.io/otel/trace"
)

func InitTracer(ctx context.Context, serviceName, otelEndpoint string) (func(), error) {
    exporter, err := otlptracegrpc.New(ctx,
        otlptracegrpc.WithEndpoint(otelEndpoint),
        otlptracegrpc.WithInsecure(),
    )
    if err != nil {
        return nil, err
    }

    res := resource.NewWithAttributes(
        semconv.SchemaURL,
        semconv.ServiceName(serviceName),
        semconv.ServiceVersion("1.0.0"),
    )

    tp := sdktrace.NewTracerProvider(
        sdktrace.WithBatcher(exporter),
        sdktrace.WithResource(res),
        sdktrace.WithSampler(sdktrace.AlwaysSample()),
    )
    otel.SetTracerProvider(tp)

    return func() { tp.Shutdown(ctx) }, nil
}

// Use in handlers:
var tracer = otel.Tracer("my-go-api")

func (h *Handler) GetOrder(w http.ResponseWriter, r *http.Request) {
    ctx, span := tracer.Start(r.Context(), "GetOrder")
    defer span.End()

    orderID := r.PathValue("id")
    span.SetAttributes(
        attribute.String("order.id", orderID),
        attribute.String("user.id", getUserID(r)),
    )

    order, err := h.repo.GetByID(ctx, orderID)  // span propagates through ctx
    if err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, err.Error())
        http.Error(w, "not found", 404)
        return
    }
    // ...
}
```


---


## 📅 Day 29 — Production Best Practices & kube-bench


```bash
# kube-bench: CIS Kubernetes benchmark
docker run --rm --pid=host \
  -v /etc:/etc:ro \
  -v /var:/var:ro \
  -v /usr/bin/kubectl:/usr/bin/kubectl:ro \
  aquasec/kube-bench:latest

# Shows: [PASS] [FAIL] [WARN] [INFO] for 200+ security checks
# Fix every FAIL before calling production-ready
```


### Production readiness checklist


```yaml
# For every production workload, verify:

Security:
  - [ ] distroless or minimal base image
  - [ ] Trivy scan: zero critical CVEs
  - [ ] USER nonroot in Dockerfile
  - [ ] readOnlyRootFilesystem: true
  - [ ] allowPrivilegeEscalation: false
  - [ ] capabilities: drop: [ALL]
  - [ ] Secrets managed by Sealed Secrets or External Secrets
  - [ ] NetworkPolicy: default-deny + explicit allows
  - [ ] mTLS enforced via Istio PeerAuthentication: STRICT
  - [ ] Falco deployed on all nodes
  - [ ] OPA Gatekeeper: require resource limits

Reliability:
  - [ ] resources.requests AND resources.limits on all containers
  - [ ] readinessProbe on all containers
  - [ ] livenessProbe on all containers
  - [ ] startupProbe for slow-starting containers
  - [ ] PodDisruptionBudget: minAvailable >= 1
  - [ ] Anti-affinity: spread pods across nodes
  - [ ] HPA: minReplicas >= 2, maxReplicas defined
  - [ ] Rolling update: maxUnavailable: 0
  - [ ] terminationGracePeriodSeconds >= 30

Observability:
  - [ ] Prometheus metrics on /metrics
  - [ ] ServiceMonitor deployed
  - [ ] PrometheusRule: error rate + latency + pod health alerts
  - [ ] Loki: structured JSON logs with request_id, user_id, trace_id
  - [ ] OpenTelemetry: spans on all external calls
  - [ ] Grafana dashboard: RPS, error rate, p99 latency, pod count

GitOps:
  - [ ] All manifests in git
  - [ ] ArgoCD Application with automated sync + selfHeal
  - [ ] Image tag updated via CI, not manual kubectl
  - [ ] Sealed Secrets committed to git
```


```yaml
# Pod security context template (add to every production Deployment)
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 65534
    runAsGroup: 65534
    fsGroup: 65534
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: app
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop: [ALL]
```


---


## 📅 Day 30 — Capstone: Full Production Platform


### Build the complete production Kubernetes platform


**What you deploy in one** **`make bootstrap`** **command:**


```javascript
Platform Layer (cluster infrastructure)
  ├── cert-manager          — automatic TLS
  ├── ingress-nginx         — L7 routing
  ├── ArgoCD                — GitOps delivery
  ├── Sealed Secrets        — encrypted secrets in git
  └── Tekton                — CI pipelines

Observability Layer
  ├── Prometheus + Alertmanager
  ├── Grafana (dashboards)
  ├── Loki + Promtail
  └── Tempo + OTel Collector

Security Layer
  ├── Falco               — runtime threat detection
  ├── Trivy Operator      — continuous image scanning
  └── OPA Gatekeeper      — policy enforcement

Service Mesh Layer
  └── Istio + Kiali       — mTLS + traffic management

Application Layer (GitOps managed via ArgoCD)
  ├── my-go-api           — Helm chart, 3 replicas, HPA
  ├── my-go-worker        — Helm chart, 2 replicas
  ├── postgres            — StatefulSet via Crunchy Operator
  └── redis               — StatefulSet via Redis Operator
```


**Makefile for the full platform:**


```makefile
.PHONY: cluster bootstrap app clean

cluster:
	kind create cluster --name prod --config kind-config.yaml

platform:
	# Platform tools via Helm
	helm install cert-manager jetstack/cert-manager -n cert-manager --create-namespace --set installCRDs=true
	helm install ingress-nginx ingress-nginx/ingress-nginx -n ingress-nginx --create-namespace
	helm install argocd argo/argo-cd -n argocd --create-namespace
	helm install sealed-secrets sealed-secrets/sealed-secrets -n kube-system
	helm install kube-prom prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
	helm install loki grafana/loki-stack -n monitoring
	helm install tempo grafana/tempo -n monitoring
	helm install falco falcosecurity/falco -n falco --create-namespace
	helm install trivy-operator aqua/trivy-operator -n trivy-system --create-namespace
	istioctl install --set profile=demo -y

app:
	# ArgoCD manages everything from git
	kubectl apply -f argocd/bootstrap-app.yaml

clean:
	kind delete cluster --name prod
```


**Final deliverables:**

- `make cluster && make platform && make app` — full stack from zero
- Grafana dashboard: RPS, error rate, p99 latency, pod count, node resource usage
- Loki: query error logs across all pods in one query
- Tempo: click a slow request in Grafana → see the full distributed trace
- ArgoCD: deploy a new image tag via git push (zero kubectl commands)
- Trivy: zero critical CVEs on all running containers
- Falco: exec into a pod and watch the alert fire in < 1 second
- kube-bench: document every FAIL and your remediation plan

---


## ⚠️ Common mistakes Week 4


### Mistake 1


**❌ ArgoCD automated sync without** **`prune: true`****.** Deleted manifests from git still run in the cluster. Your cluster diverges from git silently.


**✅** Set `automated.prune: true`. Resources removed from git are automatically deleted from the cluster.


### Mistake 2


**❌ High cardinality Prometheus labels.** Using `user_id` or `request_id` as a metric label creates millions of time series. Prometheus OOMs and crashes.


**✅** Labels must be low-cardinality (few distinct values): `method`, `path`, `status_code`. Never use IDs, emails, or dynamic strings as labels. Log those with Loki instead.


### Mistake 3


**❌ Istio sidecar injection without updating resource requests.** The Envoy sidecar uses ~50mb memory and 100m CPU. Pods without enough room get evicted or OOM-killed.


**✅** After enabling Istio injection, add 50Mi memory and 100m CPU to your resource requests. Check `kubectl top pods` after rollout.

