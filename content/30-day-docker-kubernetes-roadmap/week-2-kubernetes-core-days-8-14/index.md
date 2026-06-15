---
source: notion
title: "Week 2 — Kubernetes Core (Days 8–14)"
slug: "week-2-kubernetes-core-days-8-14"
notionId: "36cda883-bddd-8152-9a7d-ca18a1b3344a"
notionRootId: "36cda883bddd812fb940e5b8d2d2f3a9"
parent: "30-day-docker-kubernetes-roadmap"
children: []
order: 2
icon: "📦"
cover: null
---
> **Core insight:** Kubernetes is not a container orchestrator. It is a declarative state machine. You declare desired state. The control plane works continuously to make actual state match desired state. Understanding this reconciliation loop is understanding Kubernetes.

---


## 📅 Day 8 — Kubernetes Architecture


### Control plane components


```javascript
kube-apiserver    — the front door. All kubectl commands hit this. REST API.
etcd              — distributed key-value store. The only source of truth.
kube-scheduler    — picks which node a pod runs on.
kube-controller-manager — reconciliation loops (ReplicaSet, Deployment, Node controllers)
cloud-controller-manager — creates LoadBalancers, PVs from cloud APIs
```


### Worker node components


```javascript
kubelet       — agent on every node. Creates containers via CRI.
kube-proxy    — manages iptables rules for Service routing.
containerd    — container runtime. kubelet talks to it via CRI.
```


```bash
# Create a 3-node kind cluster
cat > kind-config.yaml << 'EOF'
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    extraPortMappings:
      - containerPort: 80
        hostPort: 80
      - containerPort: 443
        hostPort: 443
  - role: worker
  - role: worker
EOF

kind create cluster --name dev --config kind-config.yaml
kubectl cluster-info --context kind-dev
kubectl get nodes -o wide
kubectl get pods -n kube-system

# Watch the reconciliation loop in action
kubectl run test --image=nginx
kubectl get pod test -w           # Pending → ContainerCreating → Running
kubectl delete pod test           # no ReplicaSet = not rescheduled
```


---


## 📅 Day 9 — Pods & Deployments


```yaml
# deployment.yaml — production-grade
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-go-api
  namespace: default
  labels:
    app: my-go-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-go-api
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0     # zero-downtime: never kill before new pod is ready
  template:
    metadata:
      labels:
        app: my-go-api
        version: "1.0.0"
    spec:
      serviceAccountName: my-go-api
      terminationGracePeriodSeconds: 30
      containers:
      - name: api
        image: myapp:1.0.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: 100m
            memory: 64Mi
          limits:
            cpu: 500m
            memory: 256Mi
        env:
        - name: PORT
          value: "8080"
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: db-password
        startupProbe:
          httpGet: { path: /health, port: 8080 }
          failureThreshold: 30
          periodSeconds: 10
        readinessProbe:
          httpGet: { path: /ready, port: 8080 }
          initialDelaySeconds: 5
          periodSeconds: 10
          failureThreshold: 3
        livenessProbe:
          httpGet: { path: /health, port: 8080 }
          initialDelaySeconds: 15
          periodSeconds: 30
          failureThreshold: 3
```


```bash
kubectl apply -f deployment.yaml
kubectl rollout status deployment/my-go-api
kubectl set image deployment/my-go-api api=myapp:2.0.0
kubectl rollout undo deployment/my-go-api
kubectl scale deployment/my-go-api --replicas=5
```


---


## 📅 Day 10 — Services & DNS


```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-go-api
spec:
  type: ClusterIP
  selector:
    app: my-go-api
  ports:
  - port: 80
    targetPort: 8080
```


```bash
# DNS: <service>.<namespace>.svc.cluster.local
kubectl run dns-test --image=busybox --rm -it -- sh
# Inside: nslookup my-go-api
#         curl http://my-go-api/health

# Port forward for local testing
kubectl port-forward svc/my-go-api 8080:80
```


---


## 📅 Day 11 — ConfigMaps & Secrets


```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  PORT: "8080"
  LOG_LEVEL: "info"
  DB_HOST: "postgres-service"
---
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  db-password: "supersecret"
  jwt-key: "256-bit-secret"
```


```bash
# Sealed Secrets: encrypt secrets in git
brew install kubeseal
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.26.0/controller.yaml
kubectl create secret generic app-secrets --dry-run=client -o yaml | \
  kubeseal --format yaml > sealed-secret.yaml
# sealed-secret.yaml is safe to commit to git!
```


---


## 📅 Day 12 — Namespaces & RBAC


```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: development
  labels:
    environment: dev
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: development
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ashu-pod-reader
  namespace: development
subjects:
- kind: ServiceAccount
  name: my-go-api
  namespace: development
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: dev-quota
  namespace: development
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    pods: "20"
```


---


## 📅 Day 13 — Ingress + cert-manager


```bash
# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s

# Install cert-manager
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --set installCRDs=true
```


```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
  - hosts: [api.myapp.com]
    secretName: api-tls-cert
  rules:
  - host: api.myapp.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: my-go-api
            port:
              number: 80
```


---


## 📅 Day 14 — Week 2 Project: Full Go App on k8s


**Write and apply all manifests:**


```javascript
k8s/
  namespace.yaml, configmap.yaml, secret.yaml
  serviceaccount.yaml, rbac.yaml, resourcequota.yaml
  deployment-api.yaml, deployment-worker.yaml
  service-api.yaml, ingress.yaml
  postgres/, redis/
```


**Deliverables:**

- `kubectl apply -k k8s/` deploys everything
- `curl http://localhost/api/v1/health` returns 200
- Zero-downtime rolling update demonstrated
- k9s: browse pods, logs, events interactively

---


## ⚠️ Common mistakes Week 2


**No resource requests** — scheduler blind, OOM kills cascade. Every container needs requests + limits.


**No readiness probe** — traffic hits pods still connecting to DB. Users get 502s during startup.


**Secrets in ConfigMaps** — ConfigMaps are not encrypted. Use Secrets + Sealed Secrets for anything sensitive.

