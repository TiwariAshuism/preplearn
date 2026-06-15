---
source: notion
title: "🐳 30-Day Docker + Kubernetes Roadmap"
slug: "30-day-docker-kubernetes-roadmap"
notionId: "36cda883bddd812fb940e5b8d2d2f3a9"
notionRootId: "36cda883bddd812fb940e5b8d2d2f3a9"
parent: null
children: ["week-4-production-toolchain-days-22-30","week-3-advanced-kubernetes-days-15-21","week-2-kubernetes-core-days-8-14","week-1-docker-mastery-days-1-7"]
order: 8
icon: "🐳"
cover: null
---
> 🐳 **From zero to production-grade container orchestration.** Docker internals, Kubernetes architecture, Helm, Istio, ArgoCD, Prometheus, Grafana, and the full cloud-native toolchain. Aligned with your Go backend stack.

---


## 📌 What this roadmap covers


This is not a “run docker run hello-world” tutorial. Every day you build real systems, break them intentionally, fix them, and understand WHY the design decisions were made. By Day 30 you will be able to design, deploy, and operate production container infrastructure at scale.


---


## 🗺️ 30-Day Plan at a glance


| Week                          | Days  | Focus                                                           | Key Output                                        |
| ----------------------------- | ----- | --------------------------------------------------------------- | ------------------------------------------------- |
| Week 1 — Docker Mastery       | 1–7   | Images, containers, networking, volumes, Compose, security      | Production-grade Go app containerised             |
| Week 2 — Kubernetes Core      | 8–14  | Pods, Deployments, Services, ConfigMaps, Ingress, RBAC          | Go app running in k8s with all primitives         |
| Week 3 — Advanced Kubernetes  | 15–21 | Helm, StatefulSets, HPA, PVC, Operators, CRDs, Network Policies | Helm chart + autoscaling + stateful workloads     |
| Week 4 — Production Toolchain | 22–30 | ArgoCD, Istio, Prometheus, Grafana, Loki, Trivy, Falco, Tekton  | Full production observability + GitOps + security |


---


## 🛠️ Full tool stack this roadmap covers


| Category          | Tools                                           |
| ----------------- | ----------------------------------------------- |
| Container runtime | Docker Engine, containerd, OCI spec             |
| Local k8s         | minikube, kind, k3d                             |
| Package manager   | Helm 3                                          |
| GitOps            | ArgoCD, Flux                                    |
| Service mesh      | Istio, Linkerd                                  |
| Observability     | Prometheus, Grafana, Loki, Tempo, OpenTelemetry |
| Security          | Trivy, Falco, OPA/Gatekeeper, kube-bench        |
| CI/CD             | Tekton, GitHub Actions + k8s                    |
| Networking        | Calico, Cilium, CoreDNS                         |
| Storage           | Longhorn, CSI drivers                           |
| CLI tools         | kubectl, kubectx, kubens, k9s, stern, kustomize |


---


## ⚡ Quick start: local Kubernetes


```bash
# Option 1: kind (Kubernetes IN Docker) — recommended for this roadmap
brew install kind
kind create cluster --name dev --config kind-config.yaml

# Option 2: minikube
brew install minikube
minikube start --driver=docker --cpus=4 --memory=8g

# Option 3: k3d (k3s in Docker, fastest)
brew install k3d
k3d cluster create dev --agents 2

# Essential CLI tools
brew install kubectl kubectx stern k9s kustomize helm
```


```yaml
# kind-config.yaml — 3-node cluster for realistic testing
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    kubeAdmConfigPatches:
      - |
        kind: InitConfiguration
        nodeRegistration:
          kubeletExtraArgs:
            node-labels: "ingress-ready=true"
    extraPortMappings:
      - containerPort: 80
        hostPort: 80
      - containerPort: 443
        hostPort: 443
  - role: worker
  - role: worker
```


---


## 📊 My progress

- Current day: **Day 1 of 30**
- Docker images built: **0**
- k8s deployments shipped: **0**
- Helm charts written: **0**
- Production tools configured: **0**

---


## 🔖 Phase pages

- 🐳 Week 1 — Docker Mastery (Days 1–7)
- ⎈️ Week 2 — Kubernetes Core (Days 8–14)
- 📦 Week 3 — Advanced Kubernetes (Days 15–21)
- 🚀 Week 4 — Production Toolchain (Days 22–30)

---


## 📘 Essential kubectl commands reference


```bash
# Context management
kubectl config get-contexts
kubectl config use-context dev
kubectx dev                          # shortcut with kubectx
kubens kube-system                   # switch namespace

# Get resources
kubectl get pods -n default -o wide
kubectl get all --all-namespaces
kubectl get events --sort-by=.lastTimestamp

# Inspect
kubectl describe pod <name>
kubectl logs <pod> -f --tail=100
kubectl exec -it <pod> -- /bin/sh
kubectl port-forward svc/<name> 8080:80

# Apply / delete
kubectl apply -f manifest.yaml
kubectl delete -f manifest.yaml
kubectl diff -f manifest.yaml        # preview changes

# Debug
kubectl run debug --image=busybox --rm -it -- sh
kubectl top pods
kubectl top nodes

# k9s — terminal UI for kubernetes (use this daily)
k9s
```


📅 Docker + K8s Daily Tracker


## Week 1 — Docker Mastery (Days 1–7)
> **Core insight:** Docker is not just `docker run`. It is a complete system for packaging, distributing, and running applications in isolated environments. Understanding namespaces, cgroups, overlay filesystems, and the OCI spec is what separates engineers who use Docker from engineers who debug Docker at 3am.

---


## 📅 Day 1 — Docker Architecture & Internals


### How Docker actually works

- **Docker daemon (****`dockerd`****):** background process managing images, containers, networks, volumes
- **containerd:** industry-standard container runtime. dockerd delegates to containerd.
- **runc:** OCI-compliant low-level runtime. containerd delegates to runc. Actually creates the container.
- **Docker client:** CLI that talks to dockerd via REST API (`/var/run/docker.sock`)
- **OCI spec:** Open Container Initiative. Defines the image format and runtime interface. Ensures images work across Docker, Podman, containerd.

### The Linux primitives Docker uses


```javascript
Namespaces — isolation
  PID namespace:   container process 1 = PID 1 inside, different PID outside
  Net namespace:   container gets its own network stack (eth0, lo, routing table)
  Mnt namespace:   container gets its own filesystem view
  UTS namespace:   container gets its own hostname
  IPC namespace:   container gets its own inter-process communication
  User namespace:  map container root to unprivileged user on host (rootless Docker)

cgroups — resource limits
  cpu:    limit CPU share and period
  memory: limit RAM + swap. OOM killer kills container, not host.
  blkio:  limit disk I/O
  pids:   limit number of processes (prevent fork bombs)

Overlay filesystem — layers
  Each image layer is read-only
  A writable layer is added on top when container starts
  Copy-on-write: only changed files are copied to the writable layer
  Union mount: all layers appear as one filesystem to the container
```


```bash
# Inspect Docker internals
docker info
docker system df              # disk usage breakdown
docker system prune -a        # clean everything unused

# See the actual cgroup for a running container
docker run -d --name test nginx
CAT=$(docker inspect test --format '{{.Id}}')
cat /sys/fs/cgroup/memory/docker/$CAT/memory.limit_in_bytes

# See namespace isolation
docker exec test ps aux        # only sees its own processes
ps aux | grep nginx            # host sees them with real PIDs

# Docker socket — the API
curl --unix-socket /var/run/docker.sock http://localhost/v1.43/info | jq .ServerVersion
curl --unix-socket /var/run/docker.sock http://localhost/v1.43/containers/json | jq '[.[].Names]'
```


---


## 📅 Day 2 — Dockerfile Mastery


### Every Dockerfile instruction explained


```docker
# FROM: base image. Always pin to a specific digest in production.
FROM golang:1.22.4-alpine3.20@sha256:abc123... AS builder

# ARG: build-time variable. Not available in final image unless re-declared.
ARG APP_VERSION=1.0.0

# ENV: environment variable. Available at build time AND runtime.
ENV GO111MODULE=on CGO_ENABLED=0

# WORKDIR: set working directory. Creates it if it doesn't exist.
WORKDIR /app

# COPY vs ADD:
# COPY: copies files/dirs. Simple, predictable. Use this.
# ADD:  COPY + auto-extracts tar archives + can fetch URLs. Avoid unless you need auto-extract.
COPY go.mod go.sum ./
RUN go mod download                  # cache layer: only re-runs when go.mod changes
COPY . .                            # after mod download so code changes don't bust dep cache

# RUN: execute command during build. Each RUN = one layer.
# Chain commands with && to minimise layers
RUN go build -ldflags='-s -w' -o /app/server ./cmd/server/

# Multi-stage: discard the builder. Ship only the binary.
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=builder /app/server /server

# EXPOSE: documentation only. Does NOT publish ports.
EXPOSE 8080

# USER: run as non-root. Always do this in production.
USER nonroot:nonroot

# HEALTHCHECK: Docker checks container health
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["wget", "-qO-", "http://localhost:8080/health"]

# ENTRYPOINT vs CMD:
# ENTRYPOINT: the executable. Hard to override.
# CMD: default arguments to ENTRYPOINT. Easy to override.
# Together: ENTRYPOINT ["/server"] CMD ["--port=8080"]
ENTRYPOINT ["/server"]
```


### Production Go Dockerfile (full)


```docker
# syntax=docker/dockerfile:1
FROM golang:1.22-alpine AS builder
RUN apk add --no-cache git ca-certificates tzdata
WORKDIR /app

# Dependency layer (cached until go.mod/go.sum change)
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# Build layer
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-s -w -extldflags=-static' \
    -trimpath \
    -o /app/server ./cmd/server/

# Final stage: distroless (no shell, no package manager, minimal attack surface)
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo
COPY --from=builder /app/server /server
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/server"]
```


### Build optimisation


```bash
# BuildKit (default in Docker 23+)
DOCKER_BUILDKIT=1 docker build -t myapp:latest .

# Build with specific target (multi-stage)
docker build --target builder -t myapp:dev .

# Build args
docker build --build-arg APP_VERSION=2.0.0 -t myapp:2.0.0 .

# Inspect layers (see what each layer adds)
docker history myapp:latest
docker image inspect myapp:latest | jq '.[0].RootFS.Layers'

# Analyse image size with dive
brew install dive
dive myapp:latest     # interactive layer explorer

# Multi-platform build (for M1 Mac building Linux AMD64)
docker buildx create --use
docker buildx build --platform linux/amd64,linux/arm64 -t myapp:latest --push .
```


---


## 📅 Day 3 — Docker Networking Deep Dive


### Network drivers


```bash
# bridge (default): containers on same bridge can communicate by IP
# host: container uses host network stack directly (no isolation, max performance)
# none: no networking at all
# overlay: multi-host networking for Swarm/k8s
# macvlan: container gets its own MAC address, appears on LAN directly

# Create networks
docker network create --driver bridge app-network
docker network create --driver bridge --subnet 172.20.0.0/16 db-network

# Run containers on specific networks
docker run -d --name api --network app-network myapp:latest
docker run -d --name postgres --network db-network postgres:16

# Connect a container to multiple networks
docker network connect db-network api      # api can now talk to postgres

# DNS resolution: containers on the same network resolve by NAME
docker exec api ping postgres              # works! Docker DNS resolves 'postgres'
docker exec api curl http://api:8080/health  # self-resolution works too

# Inspect network
docker network inspect app-network | jq '.[0].Containers'

# Port publishing
docker run -p 8080:8080 myapp          # host:container
docker run -p 127.0.0.1:8080:8080 myapp  # bind to localhost only (security!)
docker run -P myapp                    # publish all EXPOSE'd ports to random host ports

# iptables rules Docker creates (understand the plumbing)
sudo iptables -t nat -L DOCKER        # see Docker NAT rules
```


---


## 📅 Day 4 — Docker Volumes & Storage


```bash
# Volume types:
# Named volume: managed by Docker. Persists across container restarts.
# Bind mount: map host directory into container. Great for dev.
# tmpfs: in-memory. No persistence. Good for secrets, temp files.

# Named volumes
docker volume create postgres-data
docker run -d \
  --name db \
  -v postgres-data:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=secret \
  postgres:16

# Inspect where data lives
docker volume inspect postgres-data
# Output: /var/lib/docker/volumes/postgres-data/_data

# Bind mount (dev workflow — live code reload)
docker run -d \
  -v $(pwd):/app \
  -v /app/vendor \ # anonymous volume to prevent vendor from being overwritten
  -w /app \
  golang:1.22 go run ./cmd/server/

# tmpfs (sensitive data never touches disk)
docker run -d \
  --mount type=tmpfs,destination=/tmp,tmpfs-mode=1777 \
  myapp:latest

# Backup a volume
docker run --rm \
  -v postgres-data:/data \
  -v $(pwd):/backup \
  busybox tar czf /backup/postgres-backup.tar.gz -C /data .

# Restore
docker run --rm \
  -v postgres-data:/data \
  -v $(pwd):/backup \
  busybox tar xzf /backup/postgres-backup.tar.gz -C /data
```


---


## 📅 Day 5 — Docker Compose: Multi-Service Orchestration


```yaml
# docker-compose.yml — production-grade example for Go backend
services:

  api:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
      args:
        APP_VERSION: "${APP_VERSION:-dev}"
    image: myapp:${APP_VERSION:-dev}
    container_name: myapp-api
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:8080"
    environment:
      PORT: "8080"
      DB_HOST: postgres
      DB_PORT: "5432"
      DB_NAME: appdb
      DB_USER: appuser
      REDIS_ADDR: redis:6379
    env_file:
      - .env.local
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - backend
    volumes:
      - ./config:/app/config:ro
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 128M

  worker:
    image: myapp:${APP_VERSION:-dev}
    command: ["/server", "--mode=worker"]
    restart: unless-stopped
    depends_on:
      - api
    networks:
      - backend
    deploy:
      replicas: 2

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d:ro
    networks:
      - backend
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U appuser -d appdb"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - backend
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - api
    networks:
      - backend
      - frontend

networks:
  backend:
    driver: bridge
    internal: true     # no internet access from backend network
  frontend:
    driver: bridge

volumes:
  postgres-data:
  redis-data:

secrets:
  db_password:
    file: ./secrets/db_password.txt
```


```bash
# Compose commands
docker compose up -d              # start all services detached
docker compose up --build         # rebuild images before starting
docker compose logs -f api        # follow logs for api service
docker compose ps                 # show service status
docker compose exec api sh        # shell into running api container
docker compose scale worker=3     # scale worker to 3 replicas
docker compose down -v            # stop and remove containers + volumes
docker compose diff               # show config diff

# Multiple compose files (override pattern)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
docker compose -f docker-compose.yml -f docker-compose.prod.yml up
```


---


## 📅 Day 6 — Docker Security


```bash
# 1. Never run as root
docker run --user 1000:1000 myapp
# Or in Dockerfile: USER nonroot:nonroot

# 2. Read-only filesystem
docker run --read-only \
  --tmpfs /tmp \
  --tmpfs /var/run \
  myapp

# 3. Drop ALL capabilities, add only what's needed
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE myapp

# 4. No new privileges (prevent privilege escalation)
docker run --security-opt no-new-privileges myapp

# 5. Seccomp profile (restrict syscalls)
docker run --security-opt seccomp=default.json myapp

# 6. Scan images for vulnerabilities
brew install trivy
trivy image myapp:latest
trivy image --severity HIGH,CRITICAL myapp:latest
trivy image --exit-code 1 --severity CRITICAL myapp:latest  # fail on critical

# 7. Docker secrets (never use ENV for passwords)
echo "supersecret" | docker secret create db_password -
docker service create --secret db_password myapp

# 8. Resource limits (prevent DoS)
docker run \
  --memory=512m \
  --memory-swap=512m \
  --cpus=1.0 \
  --pids-limit=100 \
  myapp

# 9. Network isolation
docker network create --internal backend-only
# Containers on --internal network cannot reach the internet

# 10. Rootless Docker (no root required at all)
dockerd-rootless-setuptool.sh install
export DOCKER_HOST=unix:///run/user/1000/docker.sock
```


---


## 📅 Day 7 — Week 1 Project: Production Go App Stack


### Build and ship: Complete containerised Go backend


**What you build:**


```javascript
docker compose up -d
  ├── nginx (reverse proxy + SSL termination)
  ├── api (Go HTTP server, 2 replicas)
  ├── worker (Go SQS worker, 2 replicas)
  ├── postgres (with health check + migrations auto-run)
  ├── redis (with persistence + password)
  └── adminer (DB GUI, dev only)
```


**Deliverables:**

- Distroless multi-stage Dockerfile. Image size < 20MB.
- `trivy image myapp:latest` → zero critical vulnerabilities
- `docker compose up -d` starts full stack in < 30 seconds
- Nginx reverse proxies to api with upstream health checks
- Secrets via Docker secrets (no passwords in env vars)
- `docker compose -f docker-compose.yml -f docker-compose.prod.yml` for prod overrides
- `.dockerignore` excludes: .git, vendor, *.test, testdata

---


## ⚠️ Common mistakes Week 1


### Mistake 1


**❌** **`COPY . .`** **before** **`go mod download`** — every code change re-downloads all dependencies.


**✅** Copy `go.mod go.sum` first, run `go mod download`, THEN copy source code.


### Mistake 2


**❌ Storing secrets in ENV instructions** — `ENV DB_PASSWORD=secret123` is visible in `docker history` and `docker inspect`. It bakes into every image layer.


**✅** Use Docker secrets, bind mounts for secret files, or pass at runtime via `--env-file`.


### Mistake 3


**❌ Not pinning base image versions** — `FROM golang:latest` breaks your build when Go releases a new version with breaking changes.


**✅** Pin to digest: `FROM golang:1.22.4-alpine@sha256:abc...`. Renovate/Dependabot can auto-update these.


## Week 2 — Kubernetes Core (Days 8–14)
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


## Week 3 — Advanced Kubernetes (Days 15–21)
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


## Week 4 — Production Toolchain (Days 22–30)
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

