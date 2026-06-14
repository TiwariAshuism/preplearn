# 03 — VPC & Cloud Networking (Days 60–61)

> **Core Mental Model:** VPC = tumhara private data center cloud mein. Subnets, routes, gateways, security groups — in sab se define hota hai ki traffic kaise move karta hai. Yeh galat configure kiya toh ya DB internet pe expose hoga, ya service internet access nahi kar paayegi.

---

## VPC — Virtual Private Cloud

```
Without VPC:
  AWS mein sab EC2 instances publicly accessible hote the
  Internet pe exposed — terrible security

With VPC:
  Logically isolated network
  Tumhara own IP range (CIDR)
  Traffic control: kya andar aata hai, kya bahar jaata hai
  
VPC CIDR: 10.0.0.0/16 → 65,536 IP addresses
  (private ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x)
```

---

## Subnets — Public vs Private

```
┌─────────────────────────────────────────────────────┐
│                   VPC (10.0.0.0/16)                  │
│                                                       │
│  AZ ap-south-1a              AZ ap-south-1b          │
│  ┌──────────────────┐        ┌──────────────────┐    │
│  │  Public Subnet   │        │  Public Subnet   │    │
│  │  10.0.1.0/24    │        │  10.0.2.0/24    │    │
│  │  (ALB, NAT GW)  │        │  (ALB, NAT GW)  │    │
│  └────────┬─────────┘        └────────┬─────────┘    │
│           │                           │               │
│  ┌────────▼─────────┐        ┌────────▼─────────┐    │
│  │  Private Subnet  │        │  Private Subnet  │    │
│  │  10.0.3.0/24    │        │  10.0.4.0/24    │    │
│  │  (App servers)  │        │  (App servers)  │    │
│  └────────┬─────────┘        └────────┬─────────┘    │
│           │                           │               │
│  ┌────────▼─────────┐        ┌────────▼─────────┐    │
│  │   DB Subnet      │        │   DB Subnet      │    │
│  │  10.0.5.0/24    │        │  10.0.6.0/24    │    │
│  │  (RDS, Redis)   │        │  (RDS, Redis)   │    │
│  └──────────────────┘        └──────────────────┘    │
└─────────────────────────────────────────────────────┘

Public Subnet:  Internet Gateway route hai → direct internet access
Private Subnet: Internet Gateway route NAHI hai → no direct internet
DB Subnet:      Private + even more restricted (only app subnet allowed)

3 layers = defense in depth:
  - Internet → ALB (public subnet only)
  - ALB → App (private subnet only, ALB SG allow karta hai)
  - App → DB (DB subnet only, app SG allow karta hai)
```

---

## Internet Gateway vs NAT Gateway

```
Internet Gateway (IGW):
  VPC ko internet se connect karta hai.
  BIDIRECTIONAL: inbound (internet → VPC) + outbound (VPC → internet).
  Public subnet mein instances ke liye.
  
NAT Gateway:
  Private subnet instances ko outbound internet access deta hai.
  UNIDIRECTIONAL: private instance → internet (for package downloads, API calls).
  Internet → private instance directly NAHI (NAT blocks inbound).
  
  Real life analogy:
  IGW = main gate (dono taraf aana-jaana)
  NAT = one-way valve (sirf bahar jaana, andar nahi aana)

Why private subnets need NAT:
  App server ko external API call karni hai (Stripe, Twilio)
  App server private subnet mein hai (no IGW)
  NAT Gateway (public subnet mein) se request route hoti hai
  Response wapas aata hai NAT se, private server ko
  
Cost: NAT Gateway = $0.045/hr per AZ + $0.045/GB processed
      50M users = lots of API calls = significant cost
      Optimize: keep traffic within AWS (PrivateLink, VPC endpoints)
```

---

## Route Tables

```
Public subnet route table:
  Destination     Target
  10.0.0.0/16     local    ← VPC ke andar sab traffic local
  0.0.0.0/0       igw-xxx  ← baaki sab internet gateway ke through

Private subnet route table:
  Destination     Target
  10.0.0.0/16     local    ← VPC ke andar traffic local
  0.0.0.0/0       nat-xxx  ← baaki sab NAT gateway ke through
  
DB subnet route table:
  Destination     Target
  10.0.0.0/16     local    ← ONLY within VPC, no internet at all
  (no 0.0.0.0/0 entry)
  
Yeh difference hi public/private subnet ka fark hai.
Internet Gateway route = public subnet.
```

---

## Security Groups — Stateful Instance Firewall

```
Security Group = virtual firewall for EC2/RDS/ELB

Rules: ALLOW only. No deny rules.
Stateful: inbound allow kiya → return traffic automatically allowed.

ALB Security Group:
  Inbound:  443 from 0.0.0.0/0 (everyone can hit HTTPS)
            80  from 0.0.0.0/0 (HTTP → redirect to HTTPS)
  Outbound: 8080 to App-SG (forward to app servers)

App Security Group:
  Inbound:  8080 from ALB-SG only (only ALB can call app)
  Outbound: 5432 to DB-SG      (app can call DB)
            6379 to Redis-SG   (app can call Redis)
            443  to 0.0.0.0/0  (outbound HTTPS via NAT)

DB Security Group:
  Inbound:  5432 from App-SG only (ONLY app servers can connect to DB)
  Outbound: (none needed — stateful, return traffic allowed)

Key insight: Security Group REFERENCE (not IP range) use karo.
  "Allow from App-SG" = all instances with App-SG can connect.
  New app server add kiya? Auto-allowed. No manual IP update needed.
```

---

## NACLs — Stateless Subnet Firewall

```
NACL = Network Access Control List
Applied at subnet level (before security groups)
STATELESS: inbound aur outbound dono rules separately likhne padte hain

Default NACL: allow all in, allow all out (safe starting point)
Custom NACL: jab subnet level blocking chahiye

NACL Rules (numbered, lower = higher priority):
  Rule 100: ALLOW TCP 443 from 0.0.0.0/0  (HTTPS inbound)
  Rule 200: ALLOW TCP 1024-65535 from 0.0.0.0/0  (ephemeral ports for return)
  Rule *:   DENY all                        (default deny)

Ephemeral ports: 1024-65535
  When client connects, OS assigns random source port (e.g., 54321)
  Response goes to 54321 (ephemeral port)
  NACL stateless = must explicitly allow these ephemeral ports

NACL vs Security Group:
  Use Security Groups: almost always (easier, stateful)
  Use NACLs: when you need subnet-level blocking (e.g., block known bad IP ranges)
```

---

## VPC Peering

```
Two VPCs ko connect karna = VPC Peering

VPC A (10.0.0.0/16) ←→ VPC B (10.1.0.0/16)

Route table A: 10.1.0.0/16 → pcx-xxx (peering connection)
Route table B: 10.0.0.0/16 → pcx-xxx

Uses:
  - Different teams ke VPCs connect karna
  - Dev VPC ↔ Shared Services VPC

IMPORTANT: Non-transitive!
  A ↔ B, B ↔ C does NOT mean A ↔ C
  A to C ke liye alag peering required
  
  A ─── B ─── C
  A cannot reach C via B!
  
  This is by design (security — A shouldn't automatically trust C)
```

---

## AWS PrivateLink — Service Exposure Without Peering

```
Problem: Company A has a payment service. Company B wants to use it.
VPC Peering: Would give B access to ALL of A's VPC — too much.
PrivateLink: Expose ONLY the payment service. B gets private endpoint.

┌─────────────────┐              ┌─────────────────┐
│    VPC A         │              │    VPC B         │
│  (Provider)      │              │  (Consumer)      │
│                  │              │                  │
│  Payment Svc ───►│─PrivateLink─►│ Interface        │
│  (NLB backed)    │              │ Endpoint         │
│                  │              │ (10.1.5.10)      │
└─────────────────┘              └─────────────────┘

B's app calls 10.1.5.10 → PrivateLink routes to A's NLB → payment service
Traffic stays within AWS backbone (never internet)
B can ONLY access what's exposed via PrivateLink — not A's entire VPC

Uses:
  - SaaS services (Stripe, Datadog) private endpoints
  - Cross-account service exposure (platform team → product teams)
  - AWS service endpoints (S3, DynamoDB access without internet — VPC Endpoint)
```

---

## VPC Endpoints — Access AWS Services Privately

```
Without VPC Endpoint:
  Private subnet instance → NAT Gateway → Internet → S3
  Cost: NAT Gateway data processing fees
  Risk: Traffic goes through internet (sort of)

With VPC Endpoint (Gateway type):
  Private subnet instance → VPC Endpoint → S3 (stays in AWS)
  Cost: FREE for S3 and DynamoDB
  Benefit: No internet, no NAT, faster

Types:
  Gateway Endpoint: S3, DynamoDB (free, just route table entry)
  Interface Endpoint: most other AWS services (ENI in your subnet, $0.01/hr)

In production: ALWAYS use VPC endpoints for S3, DynamoDB.
               Also consider: ECR, Secrets Manager, STS, EKS.
```

---

## Production 2-AZ Architecture — Complete Picture

```
                         Internet
                            │
                    ┌───────▼────────┐
                    │  Route 53 DNS   │
                    │  (GeoDNS/ALB)  │
                    └───────┬────────┘
                            │
            ┌───────────────▼────────────────┐
            │           Public Subnets         │
            │   AZ-1a              AZ-1b       │
            │  ┌───────┐        ┌───────┐     │
            │  │  ALB  │        │  ALB  │     │
            │  └───┬───┘        └───┬───┘     │
            │  ┌───┴───┐        ┌───┴───┐     │
            │  │NAT GW │        │NAT GW │     │
            │  └───────┘        └───────┘     │
            └───────────────────────────────────┘
                    │                   │
            ┌───────▼───────────────────▼──────┐
            │          Private Subnets           │
            │   AZ-1a              AZ-1b         │
            │  ┌───────┐        ┌───────┐       │
            │  │ ECS/  │        │ ECS/  │       │
            │  │  K8s  │        │  K8s  │       │
            │  │ Tasks │        │ Tasks │       │
            │  └───┬───┘        └───┬───┘       │
            └──────┼───────────────┼─────────────┘
                   │               │
            ┌──────▼───────────────▼──────────────┐
            │           DB Subnets                  │
            │   AZ-1a                AZ-1b          │
            │  ┌──────────┐      ┌──────────┐      │
            │  │ RDS Pri  │─────►│ RDS Rep  │      │
            │  │(Primary) │      │(Replica) │      │
            │  └──────────┘      └──────────┘      │
            │  ┌──────────┐      ┌──────────┐      │
            │  │ElastiCache│─────►│ElastiCache│     │
            │  │  Primary  │      │  Replica  │     │
            │  └──────────┘      └──────────┘      │
            └──────────────────────────────────────┘
```
