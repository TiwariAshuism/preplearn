---
source: manual
title: "Phase 4 — Infrastructure & DevOps"
parent: null
order: 24
icon: "☸️"
---

# Phase 4 — Infrastructure & DevOps at Scale (50M Users)

> **Mental Model:** "Service jo laptop pe kaam karta hai woh product nahi hai. Infrastructure woh bridge hai jo code aur reliability ke beech hota hai. Har decision — L4 vs L7, Vault vs env vars, blue-green vs canary — ka direct cost hai: ya operational complexity, ya latency, ya blast radius jab cheezein tod jaati hain."

---

## System Assumptions

```
Scale:    50M monthly active users
Peak:     ~200K req/sec
Services: 50+ Go microservices
Infra:    AWS multi-region (ap-south-1 primary, us-east-1 DR)
Team:     30-50 engineers, daily deployments
Target:   99.99% uptime = 52 minutes downtime/year max
```

---

## Reading Order

| # | File | Days | Topic |
|---|------|------|-------|
| 01 | `01-load-balancing-l4-l7.md` | 56–57 | L4/L7 LB, NLB/ALB, health checks, connection draining |
| 02 | `02-reverse-proxy-api-gateway.md` | 58–59 | Nginx internals, Envoy xDS, API gateway patterns |
| 03 | `03-vpc-cloud-networking.md` | 60–61 | VPC, subnets, NAT, security groups, PrivateLink |
| 04 | `04-docker-internals.md` | 62–63 | Namespaces, cgroups, layers, multi-stage, distroless |
| 05 | `05-kubernetes-core.md` | 64–65 | Pods, Deployments, Services, Ingress, HPA, probes |
| 06 | `06-terraform-iac.md` | 66–67 | State, plan/apply, modules, drift, workspaces |
| 07 | `07-cicd-pipelines.md` | 68–69 | GitHub Actions, artifact promotion, OIDC, rollback |
| 08 | `08-deployment-strategies.md` | 70–71 | Rolling, blue-green, canary, feature flags, DB migrations |
| 09 | `09-vault-secret-management.md` | 72–73 | Dynamic secrets, transit, PKI, AppRole, Vault Agent |
| 10 | `10-mtls-production.md` | 74–75 | mTLS, SPIFFE/SPIRE, zero-trust, cert rotation |

---

## Phase 4 Key Insight

```
Phase 1-3: Code karna seekha
Phase 4:   Code ko safely production mein lane ki kala

3 rules of production deployments:

1. LIMIT BLAST RADIUS
   "Ek service ka issue poore system ko tod na paaye"
   → Circuit breakers, bulkheads, canary deploys

2. FAST ROLLBACK
   "Kuch bhi ho, 5 minutes mein wapas old version pe aa jao"
   → Immutable artifacts, blue-green, feature flags

3. NO LONG-LIVED SECRETS
   "Har secret ka expiry hai"
   → Vault dynamic secrets, short-lived certs, IRSA

Staff engineer interview mein yeh 3 principles yaad rakho.
```

---

## Common Mistakes (Phase 4)

```
❌ DB Kubernetes mein run karna
   StatefulSets complex hain. Use managed: RDS, ElastiCache, MSK.

❌ Secrets as environment variables
   kubectl describe pod mein dikhte hain. Child process inherit karte hain.
   Use: Vault Agent / AWS IRSA + Secrets Manager, file-mounted.

❌ ALB for gRPC long-lived streams
   ALB HTTP/2 connections terminate karta hai. Long streams cut ho jaate hain.
   Use: NLB (L4) for gRPC, or Istio service mesh.

❌ No circuit breaker on downstream calls
   Ek slow DB → threads pile up → connection pool exhaust → cascade failure.
   Every external call = timeout + circuit breaker.
```

---

## Phase 4 Mastery Checklist

```
Load Balancing:
  ☐ L4 vs L7 choose kar sakte ho for REST, gRPC, WebSocket
  ☐ NLB + ALB combo design kar sakte ho
  ☐ Health check semantics (liveness vs readiness) explain kar sakte ho

Networking:
  ☐2-AZ VPC draw kar sakte ho with public/private/DB subnets
  ☐ Security groups vs NACLs difference explain kar sakte ho
  ☐ Why PrivateLink > VPC Peering for service exposure

Docker:
  ☐ Multi-stage Dockerfile likh sakte ho
  ☐ Layer caching optimize kar sakte ho
  ☐ Distroless vs alpine tradeoffs bata sakte ho

Kubernetes:
  ☐ Readiness/liveness probes correctly configure kar sakte ho
  ☐ HPA setup + custom metrics
  ☐ PodDisruptionBudget explain kar sakte ho

IaC:
  ☐ Terraform state remote setup kar sakte ho
  ☐ terraform plan output read kar sakte ho (specially destroys)
  ☐ Module versioning strategy

CI/CD:
  ☐ Immutable artifact promotion pipeline design
  ☐ OIDC federation (no long-lived cloud keys in CI)
  ☐ Automatic rollback on metric threshold

Secrets:
  ☐ Vault dynamic secrets flow explain kar sakte ho
  ☐ Vault Agent sidecar setup
  ☐ Transit engine use case

Security:
  ☐ mTLS handshake explain kar sakte ho
  ☐ SPIFFE identity format
  ☐ Why "inside VPN = trusted" is wrong
```
