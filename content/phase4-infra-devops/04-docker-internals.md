# 04 — Docker Internals (Days 62–63)

> **Core Mental Model:** Containers = isolated processes. VMs nahi hain. Isolation kernel features se aati hai — namespaces aur cgroups. Yeh samajhna zaroori hai kyunki production mein container escape, resource leaks, aur image vulnerabilities real problems hain.

---

## Container vs VM

```
Virtual Machine:
  ┌─────────────────────────────────┐
  │        Guest OS (Ubuntu)         │
  │  App    Libs    Binaries         │
  ├─────────────────────────────────┤
  │        Hypervisor (VMware/KVM)   │
  ├─────────────────────────────────┤
  │        Host OS                   │
  │        Hardware                  │
  └─────────────────────────────────┘
  
  Startup: minutes (boot full OS)
  Memory: GBs (full OS)
  Isolation: very strong (separate kernel)

Container:
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │  App A   │  │  App B   │  │  App C   │
  │  Libs    │  │  Libs    │  │  Libs    │
  ├──────────┴──┴──────────┴──┴──────────┤
  │           Container Runtime           │
  │           (Docker/containerd)         │
  ├───────────────────────────────────────┤
  │           Host OS Kernel              │
  │           Hardware                    │
  └───────────────────────────────────────┘
  
  Startup: milliseconds (process start only)
  Memory: MBs (shared kernel)
  Isolation: good but shared kernel (same OS)

Interview question: "Container isolated kyun nahi hai VM jaisa?"
Answer: "Same kernel share hota hai. Kernel vulnerability = all containers affected."
```

---

## Linux Namespaces — Process Isolation

```
Namespaces = container ke andar process ko "alag duniya" dikhate hain.

PID Namespace:
  Container inside: PID 1 = your app (naya hierarchy)
  Host outside:     PID 1 = systemd, your app = PID 8457
  App sochta hai "main PID 1 hoon" — baaki kuch nahi dikhta

Network Namespace:
  Container: eth0 → 172.17.0.2 (virtual interface)
  Host:      eth0 → 10.0.1.5 (actual NIC)
  Container ko apna virtual network stack milta hai

Mount Namespace:
  Container: / → overlay filesystem (container's view)
  Host:      / → actual host filesystem
  Container host filesystem nahi dekh sakta

UTS Namespace:
  Container ko apna hostname set karne deta hai
  Container: hostname = "user-service-abc123"
  Host:      hostname = "ip-10-0-1-5.ap-south-1.compute.internal"

IPC Namespace:
  Inter-process communication isolation
  Container ke processes dusre container se IPC nahi kar sakte
```

---

## cgroups — Resource Limits

```
cgroups (control groups) = Linux kernel feature
Limits aur accounts karta hai resource usage per process group.

Container ke cgroups:
  CPU:    "Yeh container max 1 CPU core use kar sakta hai"
  Memory: "Yeh container max 512MB use kar sakta hai. OOM kill otherwise."
  I/O:    "Disk read/write bandwidth limit"
  Network: "Network bandwidth limit (tc qdisc via tools)"

Kubernetes mein:
  resources:
    requests:
      cpu: "250m"      # scheduler ke liye: "mujhe 0.25 CPU chahiye"
      memory: "256Mi"
    limits:
      cpu: "1000m"     # cgroup CPU quota set hoti hai → throttle
      memory: "512Mi"  # cgroup memory limit → OOM kill if exceeded

OOM Kill:
  Container 512Mi se zyada allocate karne ki koshish karta hai
  Kernel: OOM killer triggers
  Container process killed (pod restart in K8s)
  
  Metric: watch OOMKilled events in production!
  kubectl get events --field-selector reason=OOMKilling
```

---

## Docker Image Layers

```
Dockerfile = recipe for image
Each instruction = one layer (read-only)
Container = layers stack + writable layer on top

Dockerfile:
  FROM golang:1.22           ← Layer 1: base Go image (~700MB)
  RUN apt-get install git    ← Layer 2: git installed (~10MB)
  COPY go.mod go.sum ./      ← Layer 3: dependency files
  RUN go mod download        ← Layer 4: dependencies downloaded (~100MB)
  COPY . .                   ← Layer 5: source code
  RUN go build -o app ./cmd  ← Layer 6: compiled binary

Container layer stack:
  [golang:1.22 base]    Read-only
  [git layer]           Read-only
  [go.mod layer]        Read-only
  [dependencies layer]  Read-only
  [source code layer]   Read-only
  [binary layer]        Read-only
  [container layer]     WRITABLE (runtime changes here)

Why layers matter:
  Layer shared ho sakte hain between images (same base image = same layer)
  Layer cache kiya jaata hai (rebuild mein reuse)
  Pull sirf missing layers hoti hai
```

### Layer Caching — Optimize Build Time

```dockerfile
# ❌ WRONG — every code change = full rebuild (dependencies re-download)
FROM golang:1.22-alpine
WORKDIR /app
COPY . .                          # source code pehle copy
RUN go mod download               # dependencies baad mein
RUN go build -o app ./cmd/server

# Every time koi bhi file change = cache miss = go mod download again
# 50 engineers × 10 builds/day × 2 min download = 1000 min/day wasted
```

```dockerfile
# ✅ CORRECT — dependencies separately cache karo
FROM golang:1.22-alpine AS builder
WORKDIR /app

# Step 1: ONLY dependency files copy karo (rarely change)
COPY go.mod go.sum ./
RUN go mod download && go mod verify   # cached jab tak go.mod nahi badalti

# Step 2: Source code copy karo (often changes)
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server ./cmd/server

# If only source code changes: Layer 1 (go mod) cached ✅, only steps after COPY . . rebuild
```

---

## Multi-Stage Builds

```
Problem: Go binary compile karne ke liye Go SDK chahiye (~700MB).
         Compiled binary run karne ke liye Go SDK NOT chahiye.
         Production image = 700MB? Unacceptable.

Solution: Multi-stage build.
```

```dockerfile
# Stage 1: Build (heavy image with all tools)
FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build static binary (no dynamic linking)
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-w -s" -o /app/server ./cmd/server
    # -w: strip debug info
    # -s: strip symbol table
    # Result: ~10MB binary instead of ~15MB

# Stage 2: Runtime (minimal image)
FROM gcr.io/distroless/static-debian11

# Copy ONLY the binary from builder stage
COPY --from=builder /app/server /server

# Non-root user (distroless has nonroot user built-in)
USER nonroot:nonroot

EXPOSE 8080
ENTRYPOINT ["/server"]

# Final image size comparison:
# golang:1.22 based: ~700MB
# alpine based:      ~15MB
# distroless:        ~5MB ← production winner
```

---

## Distroless Images

```
Normal alpine image:
  ✅ Small (~5MB base)
  ✅ sh shell available (debugging)
  ❌ Shell = attack surface (container escape easier)
  ❌ Package manager = can install tools in compromised container
  ❌ More CVEs (packages have vulnerabilities)

Distroless (Google):
  ✅ EXTREMELY small (~2MB base)
  ✅ No shell (container escape harder)
  ✅ No package manager
  ✅ Minimal CVEs
  ❌ No debugging tools (exec into container → no shell!)
  
Debugging distroless in production:
  kubectl debug -it <pod> --image=ubuntu:22.04 --target=<container>
  # Adds ephemeral debug container with tools, shares process namespace
  
Available distroless images:
  gcr.io/distroless/static:nonroot   ← Go static binaries (best)
  gcr.io/distroless/base:nonroot     ← Go with some C runtime
  gcr.io/distroless/java17:nonroot   ← Java apps
  
Always use :nonroot tag → runs as non-root user by default.
```

---

## Docker Networking Modes

```
Bridge (default):
  Container gets virtual eth0 on docker0 bridge
  NAT for outbound: container IP → host IP
  Port mapping: -p 8080:8080 (host:container)
  Containers in same network can talk to each other

Host:
  Container shares host network stack directly
  No virtual eth0, no NAT
  Performance: best (no virtual network overhead)
  Security: worst (no network isolation)
  Use: network-intensive tools, not applications

Overlay (multi-host):
  VXLAN-based overlay spans multiple hosts
  Containers on different machines talk to each other
  Used by: Docker Swarm, Kubernetes (CNI plugins)
  Kubernetes CNI: Flannel, Calico, Cilium — all implement overlay networking

None:
  No network at all
  Use: batch jobs that don't need network, security-sensitive processes
```

---

## Production Dockerfile — Complete Example

```dockerfile
# syntax=docker/dockerfile:1.6
FROM golang:1.22-alpine AS builder

# Install CA certificates (for HTTPS calls to external APIs)
RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# Layer cache: dependencies
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# Build
COPY . .
ARG VERSION=dev
ARG COMMIT=unknown
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build \
    -ldflags="-w -s -X main.version=${VERSION} -X main.commit=${COMMIT}" \
    -o /app/server \
    ./cmd/server

# Security scan on dependencies
RUN go install golang.org/x/vuln/cmd/govulncheck@latest && \
    govulncheck ./...

# --- Runtime image ---
FROM gcr.io/distroless/static-debian11:nonroot

# Copy CA certificates and timezone data
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Copy binary
COPY --from=builder /app/server /server

USER nonroot:nonroot

EXPOSE 8080

# Health check (K8s probes override this, but useful for docker run)
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD ["/server", "-health"]

ENTRYPOINT ["/server"]
```

```bash
# Build with version info
docker build \
  --build-arg VERSION=$(git describe --tags --always) \
  --build-arg COMMIT=$(git rev-parse --short HEAD) \
  -t myapp:$(git rev-parse --short HEAD) .

# Image size check
docker images myapp
# REPOSITORY  TAG       SIZE
# myapp       abc1234   8.2MB ← distroless Go binary

# Security scan
docker scout cves myapp:abc1234
trivy image myapp:abc1234
```
