---
source: notion
title: "Week 1 — Docker Mastery (Days 1–7)"
slug: "week-1-docker-mastery-days-1-7"
notionId: "36cda883-bddd-818c-841b-e3d19205aff4"
notionRootId: "36cda883bddd812fb940e5b8d2d2f3a9"
parent: "30-day-docker-kubernetes-roadmap"
children: []
order: 3
icon: "🐳"
cover: null
---
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

