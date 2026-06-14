---
source: notion
title: "Phase 4 — Infrastructure & DevOps (Days 56–75)"
slug: "phase-4-infrastructure-and-devops-days-56-75"
notionId: "358da883-bddd-81c4-983e-da0bb5b61e68"
notionRootId: "358da883bddd81e1b394ca83aa7ed599"
parent: "90-day-backend-engineering-roadmap"
children: []
order: 0
icon: "🏗️"
cover: null
---
> **Goal:** Learn to take a production Go service and deploy it reliably at scale — containers, orchestration, IaC, secret management, and zero-downtime deployments. This is where backend engineering meets systems engineering.

---


## 🧠 Mental model


A service that works on your laptop is not a product. Infrastructure is the bridge between code and reliability. Every decision here — L4 vs L7, Vault vs env vars, blue-green vs canary — has a direct cost in either operational complexity, latency, or blast radius when things go wrong.


---


## 📚 Topics in order


### Day 56–57 — L4 vs L7 load balancing

- L4 (Transport layer): operates on TCP/UDP. Sees IP + port only. Extremely fast, millions of packets/sec.
- L7 (Application layer): understands HTTP. Can route by path, header, host. Can terminate TLS.
- AWS NLB (L4): line-rate TCP forwarding. No TLS termination. Preserves client IP.
- AWS ALB (L7): HTTP routing rules, host-based routing, path-based routing, sticky sessions.
- Sticky sessions: cookie-based affinity. Why they break horizontal scaling guarantees.
- Connection draining: wait for in-flight requests to complete before removing an instance
- Health checks: `/healthz` vs `/readyz` — liveness vs readiness. Different semantics.

### Day 58–59 — Reverse proxies & API gateways

- Nginx internals: master process + worker processes, event-driven, epoll
- Nginx as reverse proxy: `proxy_pass`, `upstream` blocks, connection keepalive
- Envoy: data plane proxy, xDS protocol for dynamic config, used by Istio and Consul Connect
- API gateway responsibilities: auth, rate limiting, request transformation, SSL termination, routing
- Kong: plugin-based API gateway built on Nginx. Lua plugins.
- Circuit breaking at gateway layer: fail fast when downstream service is degraded
- Retries with jitter: `Retry-After`, exponential backoff, why naive retries cause thundering herd

### Day 60–61 — VPC & cloud networking

- VPC: logically isolated network in AWS. Your private data center in the cloud.
- Subnets: public (has internet gateway route) vs private (no direct internet access)
- NAT Gateway: lets private subnet instances initiate outbound connections. One-way.
- Security groups: stateful firewall at instance level. Allow rules only.
- NACLs: stateless firewall at subnet level. Allow and deny rules.
- VPC Peering: connect two VPCs. Non-transitive (A↔B, B↔C does NOT mean A↔C).
- AWS PrivateLink: expose a service to other VPCs without peering. One-directional.
- Route tables: how traffic is directed within and out of a VPC

### Day 62–63 — Docker internals

- Namespaces: PID, network, mount, UTS, IPC — process isolation without a hypervisor
- cgroups: CPU, memory, I/O limits per container
- Overlay filesystem: layers. Each Dockerfile instruction adds a layer. Read-only layers, writable container layer.
- Multi-stage builds: compile in a builder image, copy binary to a scratch/distroless image
- Distroless images: no shell, no package manager. Smallest attack surface.
- Docker networking: bridge (default, NAT), host (no isolation), overlay (multi-host)
- Layer caching: `COPY go.mod go.sum ./` then `RUN go mod download` before `COPY . .`

### Day 64–65 — Kubernetes core concepts

- Pod: smallest deployable unit. One or more containers sharing network namespace.
- Deployment: manages ReplicaSets. Declarative rollout and rollback.
- Service types: ClusterIP (internal), NodePort (node IP + static port), LoadBalancer (cloud LB)
- Ingress: HTTP routing rules into the cluster. Ingress controller (Nginx, Traefik) does the work.
- ConfigMap vs Secret: environment configuration vs sensitive data. Secrets are base64 encoded (not encrypted!) by default.
- HPA (Horizontal Pod Autoscaler): scale based on CPU/memory or custom metrics
- Resource limits and requests: `requests` for scheduling decisions, `limits` for enforcement
- Probes: `livenessProbe` (restart if unhealthy), `readinessProbe` (remove from load balancer if unready)

### Day 66–67 — Terraform & IaC

- Declarative infrastructure: describe what you want, not how to create it
- State file: Terraform's model of the world. Must be stored remotely (S3 + DynamoDB for locking).
- Plan/apply cycle: always `terraform plan` before `apply`. Review every change.
- Modules: reusable infrastructure components. Version pin your module sources.
- Drift detection: when the real world diverges from state. `terraform refresh`.
- Import: bring existing resources under Terraform management
- Provider plugins: AWS, GCP, Kubernetes, Vault, Datadog — all first-class providers
- Workspaces vs separate state files: when to use each

### Day 68–69 — CI/CD pipelines

- GitHub Actions: workflow triggers, job dependencies, matrix builds
- Artifact pinning: use SHA digest (`@sha256:...`), not tags, for security
- Environment promotion: dev → staging → prod with manual approval gates
- Secrets injection: GitHub Actions Secrets → env vars. Never hardcode. Rotate regularly.
- Rollback triggers: monitor error rate after deploy. Auto-rollback if threshold exceeded.
- Build caching: cache Go modules, Docker layers, Terraform plugins between runs
- PR-based deploys: ephemeral preview environments per pull request

### Day 70–71 — Deployment strategies

- Blue-green: two identical environments. Switch DNS/LB in seconds. Easy rollback. Double the cost.
- Canary: gradually shift traffic (1% → 5% → 25% → 100%). Monitor error rate at each step. Automatic rollback.
- Rolling: replace instances one by one. Zero downtime. Rollback is slow (must re-deploy old version).
- Feature flags: decouple deploy from release. Ship dark, enable per user segment.
- Database migrations and deploys: expand-contract pattern. Never break backward compatibility mid-deploy.

### Day 72–73 — Secret management (HashiCorp Vault)

- Dynamic secrets: Vault generates a fresh database credential per service, auto-expired
- Static secrets: versioned, ACL-controlled key-value store
- Transit secrets engine: encrypt/decrypt without exposing the key. Encryption as a service.
- PKI secrets engine: Vault as an internal CA. Issue short-lived TLS certificates.
- AppRole auth: machine-to-machine auth. Role ID + Secret ID = Vault token.
- Vault Agent sidecar: auto-renew tokens and push secrets to a shared volume in Kubernetes
- Secret leasing and renewal: every secret has a TTL. Renewal extends it. Revocation invalidates it.

### Day 74–75 — mTLS in production

- mTLS: both client and server present certificates. Mutual authentication.
- SPIFFE/SPIRE: workload identity. Every service gets a certificate based on its identity (not IP).
- Service mesh: Istio/Linkerd inject a sidecar proxy that handles mTLS transparently
- Certificate rotation: short-lived certs (24h) rotated automatically. No long-lived secrets.
- Zero-trust networking: no implicit trust based on network location. Every call is authenticated.
- Why IP-based security (security groups only) is not sufficient for internal service-to-service auth

---


## 🔨 Projects


### Project 1 — Kubernetes-deployed Go service with full observability


**Stack:** Kubernetes (minikube/kind), Helm, Docker, GitHub Actions


Write a Helm chart for your Phase 2 Go service. Configure resource requests and limits. Add liveness and readiness probes. Configure HPA to scale at 70% CPU. Write a GitHub Actions pipeline: test → build image → push to registry → helm upgrade. Test pod disruption budget: run `kubectl delete pod` during a load test and verify zero dropped requests.


**Deliverable:** Fully automated deploy from `git push`. `kubectl get hpa` shows autoscaling in action during a wrk load test.


### Project 2 — Full AWS stack in Terraform


**Stack:** Terraform, AWS (VPC, ALB, ECS, RDS, ElastiCache, Secrets Manager)


Provision from zero: VPC with public/private subnets across 2 AZs. NAT Gateway for private subnets. ALB in public subnet. ECS Fargate service in private subnet. RDS PostgreSQL in private subnet. ElastiCache Redis in private subnet. Secrets Manager for DB credentials. Zero manual AWS console interactions.


**Deliverable:** `terraform apply` provisions the entire stack. `terraform destroy` tears it down cleanly. State stored in S3 with DynamoDB locking.


### Project 3 — Canary deploy pipeline with automatic rollback


**Stack:** GitHub Actions, Kubernetes, ArgoCD, Prometheus


Pipeline: build → push → deploy 10% canary with a separate Deployment and weighted Service. Monitor error rate via Prometheus for 10 minutes. If error rate > 1%, automatically roll back by scaling canary to 0. If healthy, promote by scaling canary to 100% and scaling down old version.


**Deliverable:** Introduce a deliberate bug in a new image version. Pipeline deploys canary, detects the error rate spike, and rolls back — fully automated, zero human intervention.


---


## ⚠️ Common mistakes


### Mistake 1


**❌ Running stateful workloads (databases) inside Kubernetes.**


StatefulSets are complex. Persistent volumes are tricky. Storage class behavior varies by cloud. A database crash in a pod means complex recovery. The operational overhead is massive.


**✅ Mental model:** Use managed services for state: RDS for PostgreSQL, ElastiCache for Redis, MSK for Kafka. Keep Kubernetes for stateless application workloads. Let the cloud provider handle storage durability.


### Mistake 2


**❌ Passing secrets as environment variables through CI pipelines.**


Env vars appear in `kubectl describe pod` output, process dumps, crash reports, and CI logs. They're inherited by child processes. A leaked env var is a leaked secret.


**✅ Mental model:** Use Vault Agent sidecar or AWS Secrets Manager + IAM roles for service accounts (IRSA). Secrets are mounted as files in a tmpfs volume, not environment variables. Rotate them automatically with short TTLs.


### Mistake 3


**❌ Using ALB (L7) for gRPC services with long-lived bidirectional streams.**


ALB terminates HTTP/2 connections and enforces its own timeout. Long-lived gRPC streams get cut. ALB also doesn't support gRPC load balancing at the request level — it load balances at the connection level.


**✅ Mental model:** Use NLB (L4) in front of your gRPC services. Or use a service mesh (Istio) which understands gRPC at the application level and can load balance individual streams.


### Mistake 4


**❌ No circuit breaker on downstream service calls.**


One slow database or downstream API causes request threads to pile up. Connection pool exhausts. Memory grows. Your service is now also slow. This cascades until the entire call graph is down.


**✅ Mental model:** Every external call needs a timeout + circuit breaker. When the downstream is degraded, fail fast (return 503) instead of waiting. This preserves your service's capacity for other requests.


---


## 🏢 How real companies solved this


**HashiCorp Vault:** Dynamic secrets are their killer feature — Vault generates a fresh PostgreSQL credential per service instance, auto-expired in 1 hour. No long-lived database passwords anywhere in the fleet. Breaching one service's credentials expires in 60 minutes with no action required.


**AWS:** ALB + NLB in tandem is how AWS internally routes at scale. NLB handles TCP at line rate (millions of packets/sec), forwards to ALB for HTTP/2 routing decisions. This is the architecture behind API Gateway under the hood.


**Netflix:** Invented the canary deploy pattern and Chaos Monkey simultaneously. Their deployment pipeline automatically rolls back if error rate spikes >0.1% in the canary cohort. Every deploy is a chaos experiment.


**Cloudflare:** Zero-trust networking across their entire internal fleet using SPIFFE-based certificates. Every internal service-to-service call is mTLS. Network location (being inside the VPN) grants zero implicit trust.


---


## 📝 Detailed notes by topic


### Day 56–57 — L4 vs L7 load balancing


**Core mental model:** Load balancers distribute traffic, but different layers understand different things. L4 sees connections and packets. L7 understands application protocols such as HTTP.


**L4:** Routes by IP and port. It is fast, protocol-agnostic, and useful for raw TCP, UDP, and some gRPC workloads. It usually preserves more end-to-end behavior but cannot route by HTTP path or header.


**L7:** Terminates or understands HTTP. It can route by host, path, header, method, cookie, or auth context. It can also terminate TLS, inject headers, and apply request-level policies.


**Health checks:** Liveness means the process should be restarted if broken. Readiness means the instance should receive traffic. Mixing these causes bad deploy behavior.


**Connection draining:** Before removing an instance, the load balancer should stop sending new requests and allow in-flight requests to finish.


**Practice:** Design routing for REST, gRPC unary, and long-lived gRPC streams. Decide when ALB, NLB, or service mesh is appropriate.


### Day 58–59 — Reverse proxies & API gateways


**Core mental model:** A reverse proxy forwards traffic to backends. An API gateway adds policy: auth, rate limiting, transformation, routing, and observability.


**Nginx:** Event-driven workers handle many connections efficiently. Common uses include TLS termination, static assets, reverse proxying, buffering, and simple routing.


**Envoy:** A modern data-plane proxy built for dynamic configuration. xDS lets control planes update clusters, routes, listeners, and endpoints without restarts.


**Gateway responsibilities:** Validate identity, enforce quotas, route traffic, normalize headers, add trace IDs, transform requests/responses, and protect downstream services.


**Retries:** Use bounded retries with jitter and respect `Retry-After`. Never retry unsafe non-idempotent operations blindly.


**Circuit breaking:** Fail fast when downstreams are unhealthy to preserve capacity and prevent cascading failure.


### Day 60–61 — VPC & cloud networking


**Core mental model:** A VPC is your private cloud network boundary. Subnets, routes, gateways, security groups, and NACLs define how traffic moves.


**Public vs private subnets:** Public subnets have a route to an internet gateway. Private subnets do not accept direct inbound internet traffic and usually use NAT for outbound connections.


**Security groups:** Stateful instance-level firewall rules. If inbound is allowed, return traffic is automatically allowed.


**NACLs:** Stateless subnet-level rules. You must handle inbound and outbound explicitly.


**NAT Gateway:** Allows private resources to initiate outbound internet connections, such as package downloads or external API calls.


**PrivateLink:** Exposes a service privately across VPC boundaries without full network peering.


**Practice:** Draw a two-AZ VPC with public ALB, private app subnets, private database subnets, NAT gateways, and route tables.


### Day 62–63 — Docker internals


**Core mental model:** Containers are isolated processes, not lightweight virtual machines. Isolation comes from kernel features.


**Namespaces:** Separate views of process IDs, mounts, networking, hostnames, and IPC.


**cgroups:** Limit and account for CPU, memory, and I/O usage. Kubernetes resource limits eventually map to cgroups.


**Images and layers:** Images are layered filesystems. Each Dockerfile instruction can add a layer. Good Dockerfiles maximize cache reuse and minimize final image size.


**Multi-stage builds:** Compile in a builder image, then copy only the final binary into a smaller runtime image.


**Distroless:** Reduces attack surface by excluding shells and package managers. Debugging requires good logs and external tools.


**Practice:** Build a Go service image with a multi-stage Dockerfile and compare image sizes between full, alpine, and distroless variants.


### Day 64–65 — Kubernetes core concepts


**Core mental model:** Kubernetes continuously reconciles desired state against actual state. You declare what should exist; controllers work to make it true.


**Pod:** Smallest deployable unit. Containers in a pod share network namespace and can communicate over [localhost](http://localhost/).


**Deployment:** Manages ReplicaSets and rolling updates for stateless workloads.


**Service:** Stable virtual endpoint for pods. ClusterIP is internal, NodePort exposes a node port, LoadBalancer asks the cloud for an external load balancer.


**Ingress:** HTTP routing layer implemented by an ingress controller.


**ConfigMap vs Secret:** ConfigMaps hold non-sensitive config. Kubernetes Secrets are base64 by default and need encryption-at-rest plus careful access controls.


**Requests and limits:** Requests influence scheduling. Limits enforce maximum usage and can cause throttling or OOM kills.


**Practice:** Deploy a service with readiness/liveness probes, resource requests, and HPA. Break readiness and observe traffic removal.


### Day 66–67 — Terraform & IaC


**Core mental model:** Infrastructure as Code gives repeatability, reviewability, and drift detection, but state becomes critical infrastructure.


**State:** Terraform state maps config to real resources. Store it remotely with locking. Treat it as sensitive because it can contain secrets.


**Plan/apply:** `plan` shows intended changes. Read it carefully, especially destroys, replacements, IAM changes, and networking changes.


**Modules:** Reusable building blocks. Version modules and providers so changes are intentional.


**Drift:** Manual console edits create drift. Terraform may undo them or fail unexpectedly.


**Import:** Existing resources can be brought under Terraform, but imported state still needs matching configuration.


**Practice:** Create a VPC module and consume it from dev/staging/prod with separate state.


### Day 68–69 — CI/CD pipelines


**Core mental model:** CI proves a change is safe enough to merge. CD moves a verified artifact through environments with controlled risk.


**Pipeline stages:** Test, lint, build, scan, publish artifact, deploy to dev, promote to staging, approve/progress to prod.


**Artifact immutability:** Promote the same image digest through environments. Do not rebuild separately for prod.


**Secrets:** Avoid long-lived cloud keys in CI. Prefer OIDC federation to cloud IAM where possible.


**Caching:** Cache dependencies and Docker layers to reduce build time, but invalidate safely.


**Rollback:** A rollback plan should be part of the pipeline, not an emergency improvisation.


### Day 70–71 — Deployment strategies


**Core mental model:** Deploy strategy controls blast radius. Releasing safely is about progressive exposure and fast rollback.


**Rolling:** Replaces instances gradually. Efficient and common, but rollback may take time.


**Blue-green:** Two full environments. Switch traffic quickly. Easier rollback, higher cost.


**Canary:** Send a small percentage of traffic to the new version, measure health, then increase traffic gradually.


**Feature flags:** Separate deploy from release. They also need ownership, cleanup, and auditability.


**Database migrations:** Use expand-contract: add backward-compatible schema first, deploy code that uses it, then remove old schema later.


**Practice:** Write a deploy plan for a breaking database column rename without downtime.


### Day 72–73 — Secret management with Vault


**Core mental model:** Secrets should be short-lived, auditable, access-controlled, and rotated. Static secrets copied into environments create long-lived blast radius.


**Dynamic secrets:** Vault can create database credentials on demand with TTLs. Leaked credentials expire automatically.


**Transit engine:** Applications send plaintext to Vault and receive ciphertext, without ever owning encryption keys directly.


**PKI engine:** Vault can issue short-lived certificates for internal TLS and mTLS.


**Auth methods:** AppRole, Kubernetes auth, and cloud IAM auth let workloads authenticate without embedding human credentials.


**Vault Agent:** Sidecar or daemon that renews tokens and writes secrets to files for the app.


**Practice:** Design secret flow for a Kubernetes Go service accessing PostgreSQL with rotating credentials.


### Day 74–75 — mTLS in production


**Core mental model:** mTLS authenticates both ends of a connection. It changes internal networking from location-based trust to identity-based trust.


**Certificates:** Each workload presents a client certificate and validates the server certificate. Trust depends on CA roots and certificate identity fields.


**SPIFFE/SPIRE:** Provides workload identity in a standard format such as `spiffe://trust-domain/ns/default/sa/api`.


**Service mesh:** Sidecar proxies can handle mTLS transparently, but add operational complexity and latency.


**Rotation:** Short-lived certs reduce compromise window but require automated issuance and renewal.


**Practice:** Explain why security groups alone do not prove which workload made a request.


## Phase 4 mastery checklist

- Choose L4 vs L7 load balancing for a real service.
- Design VPC routing for public, private, and database subnets.
- Build small, cache-friendly Docker images.
- Deploy Kubernetes workloads with probes, requests, limits, and HPA.
- Manage Terraform state safely.
- Promote immutable artifacts through CI/CD.
- Use expand-contract database migrations.
- Explain Vault dynamic secrets and production mTLS.

## 📖 Resources

- HashiCorp Vault documentation — read the Architecture section
- Kubernetes: Up and Running — Burns, Beda, Hightower
- _Terraform: Up and Running_ — Yevgeniy Brikman
- AWS Well-Architected Framework — Security Pillar
- SPIFFE/SPIRE docs: [spiffe.io](http://spiffe.io/)
