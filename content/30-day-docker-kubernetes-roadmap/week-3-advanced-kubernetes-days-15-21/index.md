---
source: notion
title: "Week 3 — Advanced Kubernetes (Days 15–21)"
slug: "week-3-advanced-kubernetes-days-15-21"
notionId: "36cda883-bddd-81a9-acef-e1dbb3d5cddc"
notionRootId: "36cda883bddd812fb940e5b8d2d2f3a9"
parent: "30-day-docker-kubernetes-roadmap"
children: []
order: 1
icon: "📦"
cover: null
---
> **Core insight:** Week 2 gave you the primitives. Week 3 gives you the patterns that make Kubernetes production-worthy: Helm for packaging, StatefulSets for databases, HPA for autoscaling, PVCs for storage, Network Policies for zero-trust, and Operators for complex lifecycle management.

---


## 📅 Day 15 — Helm: Kubernetes Package Manager


### Why Helm


Raw Kubernetes manifests have no templating, no versioning, no dependency management. A real app has 20+ manifests. Helm packages them into a Chart with values you override per environment.


```bash
# Install Helm
brew install helm

# Essential commands
helm repo add stable https://charts.helm.sh/stable
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Search for charts
helm search repo postgres
helm search hub nginx

# Install a chart
helm install my-postgres bitnami/postgresql \
  --namespace dev \
  --create-namespace \
  --set auth.password=secret123 \
  --set primary.persistence.size=10Gi

# Upgrade a release
helm upgrade my-postgres bitnami/postgresql \
  --namespace dev \
  --set auth.password=newsecret

# Rollback
helm rollback my-postgres 1 --namespace dev

# List releases
helm list --all-namespaces

# Uninstall
helm uninstall my-postgres --namespace dev

# Render templates without installing (great for debugging)
helm template my-app ./charts/my-app -f values.prod.yaml

# Diff before upgrade (plugin)
helm plugin install https://github.com/databus23/helm-diff
helm diff upgrade my-postgres bitnami/postgresql --set auth.password=new
```


### Write your own Helm chart


```bash
# Scaffold a new chart
helm create my-go-service
# Creates:
# my-go-service/
#   Chart.yaml       — chart metadata
#   values.yaml      — default values
#   templates/       — kubernetes manifests with templating
#   charts/          — chart dependencies
```


```yaml
# Chart.yaml
apiVersion: v2
name: my-go-service
description: Production Go backend service
type: application
version: 0.1.0        # chart version
appVersion: "1.0.0"  # app version
dependencies:
  - name: postgresql
    version: "13.x.x"
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled
```


```yaml
# values.yaml — defaults
replicaCount: 2

image:
  repository: myapp
  tag: "1.0.0"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80
  targetPort: 8080

ingress:
  enabled: true
  className: nginx
  host: api.myapp.com
  tls: true

resources:
  requests:
    cpu: 100m
    memory: 64Mi
  limits:
    cpu: 500m
    memory: 256Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

env:
  PORT: "8080"
  LOG_LEVEL: "info"

secrets:
  dbPassword: ""
  jwtKey: ""

postgresql:
  enabled: true
  auth:
    database: appdb
    username: appuser
```


```yaml
# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-go-service.fullname" . }}
  labels:
    {{- include "my-go-service.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "my-go-service.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "my-go-service.selectorLabels" . | nindent 8 }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
        ports:
        - containerPort: {{ .Values.service.targetPort }}
        resources:
          {{- toYaml .Values.resources | nindent 10 }}
        env:
        {{- range $key, $val := .Values.env }}
        - name: {{ $key }}
          value: {{ $val | quote }}
        {{- end }}
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: {{ include "my-go-service.fullname" . }}-secrets
              key: db-password
```


```yaml
# values.prod.yaml — production overrides
replicaCount: 5
image:
  tag: "2.1.0"
resources:
  requests:
    cpu: 500m
    memory: 256Mi
  limits:
    cpu: 2
    memory: 1Gi
env:
  LOG_LEVEL: "warn"
```


```bash
# Install in production with overrides
helm upgrade --install my-go-service ./charts/my-go-service \
  -f values.prod.yaml \
  --set image.tag=2.1.0 \
  --namespace production \
  --create-namespace \
  --atomic              # rollback automatically if hooks fail
  --timeout 5m
```


---


## 📅 Day 16 — StatefulSets & Persistent Volumes


### Why StatefulSets for databases

- Pods in a Deployment are interchangeable (random names, any order)
- StatefulSet pods have: stable names (`db-0`, `db-1`, `db-2`), stable network identity, ordered start/stop
- Each pod gets its own PersistentVolumeClaim (separate storage)

```yaml
# statefulset.yaml — PostgreSQL in Kubernetes
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: dev
spec:
  serviceName: postgres-headless   # must match headless service
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        env:
        - name: POSTGRES_DB
          value: appdb
        - name: POSTGRES_USER
          value: appuser
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: db-password
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        ports:
        - containerPort: 5432
        resources:
          requests:
            cpu: 250m
            memory: 256Mi
          limits:
            cpu: 1
            memory: 1Gi
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        readinessProbe:
          exec:
            command: ["pg_isready", "-U", "appuser", "-d", "appdb"]
          initialDelaySeconds: 15
          periodSeconds: 10
  volumeClaimTemplates:              # each pod gets its own PVC
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: standard     # use cloud storage class in production
      resources:
        requests:
          storage: 10Gi
---
# Headless service: stable DNS for each pod
apiVersion: v1
kind: Service
metadata:
  name: postgres-headless
  namespace: dev
spec:
  clusterIP: None     # headless: no VIP, returns pod IPs
  selector:
    app: postgres
  ports:
  - port: 5432
---
# Regular service for client access
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: dev
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
```


```bash
# DNS for StatefulSet pods:
# pod-0: postgres-0.postgres-headless.dev.svc.cluster.local
# pod-1: postgres-1.postgres-headless.dev.svc.cluster.local

# Scale StatefulSet (ordered: 0 then 1 then 2)
kubectl scale statefulset postgres --replicas=3

# Watch ordered startup
kubectl get pods -l app=postgres -w

# PVC is NOT deleted when StatefulSet is deleted
kubectl delete statefulset postgres
kubectl get pvc   # still exists! Data is safe.
```


### PersistentVolume, PVC, StorageClass


```yaml
# storageclass.yaml (production: AWS EBS)
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
volumeBindingMode: WaitForFirstConsumer   # provision in same AZ as pod
reclaimPolicy: Retain   # NEVER delete data automatically in production
allowVolumeExpansion: true
```


---


## 📅 Day 17 — HPA, VPA & Karpenter


### Horizontal Pod Autoscaler (HPA)


```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-go-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-go-api
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: AverageValue
        averageValue: 200Mi
  - type: Pods                       # custom metric from Prometheus
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Pods
        value: 4
        periodSeconds: 60           # max 4 pods added per minute
    scaleDown:
      stabilizationWindowSeconds: 300  # wait 5 min before scaling down
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60           # max 10% removed per minute
```


```bash
# Enable metrics-server (required for CPU/memory HPA)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# For kind: add --kubelet-insecure-tls flag
kubectl patch deployment metrics-server -n kube-system \
  --type='json' \
  -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'

# Watch HPA in action
kubectl get hpa my-go-api-hpa -w
kubectl top pods

# Generate load to trigger scaling
kubectl run load-gen --image=busybox --rm -it -- \
  sh -c "while true; do wget -q -O- http://my-go-api/; done"
```


### Vertical Pod Autoscaler (VPA)


```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: my-go-api-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-go-api
  updatePolicy:
    updateMode: "Off"   # Recommendation only (Off), or Auto (restarts pods)
  resourcePolicy:
    containerPolicies:
    - containerName: api
      minAllowed:
        cpu: 50m
        memory: 32Mi
      maxAllowed:
        cpu: 2
        memory: 2Gi
```


---


## 📅 Day 18 — Network Policies


```yaml
# Default deny all ingress + egress (zero-trust baseline)
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}    # applies to ALL pods
  policyTypes:
  - Ingress
  - Egress
---
# Allow: api pods can receive from ingress controller
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-ingress-to-api
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: my-go-api
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: ingress-nginx
    ports:
    - port: 8080
---
# Allow: api can reach postgres
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-api-to-postgres
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: postgres
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: my-go-api
    ports:
    - port: 5432
---
# Allow: api egress to kube-dns and external APIs
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-api-egress
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: my-go-api
  policyTypes:
  - Egress
  egress:
  - to:                        # kube-dns
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: kube-system
    ports:
    - port: 53
      protocol: UDP
  - to:                        # postgres
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - port: 5432
  - to:                        # external HTTPS
    - ipBlock:
        cidr: 0.0.0.0/0
        except:
        - 10.0.0.0/8
        - 172.16.0.0/12
        - 192.168.0.0/16
    ports:
    - port: 443
```


---


## 📅 Day 19 — Kustomize


```bash
# Kustomize: overlay system built into kubectl
# Base manifests + environment-specific patches

k8s/
  base/
    deployment.yaml
    service.yaml
    kustomization.yaml
  overlays/
    dev/
      kustomization.yaml
      patch-replicas.yaml
    production/
      kustomization.yaml
      patch-replicas.yaml
      patch-resources.yaml
```


```yaml
# base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- deployment.yaml
- service.yaml
commonLabels:
  managed-by: kustomize
```


```yaml
# overlays/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../base
namePrefix: prod-
namespace: production
images:
- name: myapp
  newTag: "2.1.0"
patchesStrategicMerge:
- patch-replicas.yaml
- patch-resources.yaml
configMapGenerator:
- name: app-config
  literals:
  - LOG_LEVEL=warn
  - ENVIRONMENT=production
```


```yaml
# overlays/production/patch-replicas.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-go-api
spec:
  replicas: 5
```


```bash
# Apply production overlay
kubectl apply -k k8s/overlays/production

# Preview rendered output
kubectl kustomize k8s/overlays/production

# Diff before applying
kubectl diff -k k8s/overlays/production
```


---


## 📅 Day 20 — Custom Resource Definitions (CRDs) & Operators


```yaml
# CRD: extend the Kubernetes API with your own resource types
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: databases.mycompany.io
spec:
  group: mycompany.io
  versions:
  - name: v1
    served: true
    storage: true
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            required: [engine, version, storage]
            properties:
              engine:
                type: string
                enum: [postgres, mysql]
              version:
                type: string
              storage:
                type: string
              replicas:
                type: integer
                minimum: 1
                maximum: 5
                default: 1
  scope: Namespaced
  names:
    plural: databases
    singular: database
    kind: Database
    shortNames: [db]
```


```yaml
# Using the custom resource
apiVersion: mycompany.io/v1
kind: Database
metadata:
  name: orders-db
  namespace: production
spec:
  engine: postgres
  version: "16"
  storage: 50Gi
  replicas: 2
```


```bash
# Real-world Operators to install and study
# Postgres Operator (Crunchy Data)
helm repo add crunchy https://charts.crunchydata.com/charts
helm install pgo crunchy/pgo -n postgres-operator --create-namespace

# Redis Operator
helm repo add redis-operator https://spotahome.github.io/redis-operator
helm install redis-operator redis-operator/redis-operator -n redis-operator --create-namespace

# Cert-Manager (manages TLS certificates)
helm install cert-manager jetstack/cert-manager --namespace cert-manager --create-namespace --set installCRDs=true

# Watch an operator manage lifecycle
kubectl apply -f postgres-cluster.yaml
kubectl get pods -w   # watch operator create primary + replicas automatically
```


---


## 📅 Day 21 — Week 3 Project: Production Helm Chart


**Build a complete Helm chart for your Go service:**


```javascript
charts/my-go-service/
  Chart.yaml
  values.yaml
  values.dev.yaml
  values.prod.yaml
  templates/
    _helpers.tpl
    deployment.yaml
    service.yaml
    ingress.yaml
    hpa.yaml
    vpa.yaml
    configmap.yaml
    secret.yaml
    serviceaccount.yaml
    rbac.yaml
    networkpolicy.yaml
    pdb.yaml             # PodDisruptionBudget
    NOTES.txt
```


```yaml
# templates/pdb.yaml — ensure at least 1 pod survives disruptions
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ include "my-go-service.fullname" . }}-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      {{- include "my-go-service.selectorLabels" . | nindent 6 }}
```


**Deliverables:**

- `helm install dev ./charts/my-go-service -f values.dev.yaml` works
- `helm install prod ./charts/my-go-service -f values.prod.yaml` works
- HPA scales from 2 to 8 replicas under load test
- Network policies isolate each tier
- StatefulSet PostgreSQL with data persisting across pod restarts
- `helm test my-go-service` runs connectivity tests

---


## ⚠️ Common mistakes Week 3


### Mistake 1


**❌ No PodDisruptionBudget.** Node drain (maintenance, upgrades) kills ALL replicas simultaneously. Service down for minutes.


**✅** PDB with `minAvailable: 1` guarantees at least one pod always running during voluntary disruptions.


### Mistake 2


**❌ HPA without stabilization window.** Rapid scale-down causes flapping: 10 pods → 2 pods → 10 pods every few minutes under variable load.


**✅** Set `scaleDown.stabilizationWindowSeconds: 300`. Kubernetes waits 5 minutes of consistently low usage before scaling down.


### Mistake 3


**❌ No NetworkPolicy.** A compromised pod can freely talk to every other service in the cluster.


**✅** Start with `default-deny-all`, then explicitly allow required paths. Treat the cluster network like a firewall.

