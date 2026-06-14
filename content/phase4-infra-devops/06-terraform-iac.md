# 06 — Terraform & IaC (Days 66–67)

> **Core Mental Model:** Infrastructure as Code = repeatability, reviewability, drift detection. Lekin STATE critical infrastructure ban jaata hai. State lose karo toh Terraform ko pata nahi ki real world mein kya hai — dangerous.

---

## Why IaC?

```
Manual AWS console approach (bad):
  - Engineer A creates VPC manually
  - Engineer B doesn't know exactly what was done
  - Can't reproduce in staging (different from prod)
  - Audit trail: "Who changed this security group 3 months ago?" → Unknown
  - Recovery: "Re-create everything from memory" → Impossible
  - Scale: 50 services × 5 AWS resources each = 250 resources to manage

Terraform approach:
  - Every resource described in code (Git tracked)
  - `terraform plan` shows exactly what will change (review before apply)
  - Staging = same code, different variables → identical infra
  - Recovery: re-run terraform apply → everything restored
  - Audit: git log shows who changed what and when
```

---

## Terraform Basics

```hcl
# main.tf

# Provider = AWS plugin
terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"    # version pin: >=5.0, <6.0
    }
  }
  
  # Remote state (REQUIRED for teams)
  backend "s3" {
    bucket         = "company-terraform-state"
    key            = "production/user-service/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"    # concurrent lock prevention
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Team        = "backend"
      ManagedBy   = "terraform"
    }
  }
}

# Variables
variable "aws_region"   { default = "ap-south-1" }
variable "environment"  {}
variable "db_password" {
  sensitive = true   # logs mein print nahi hoga
}

# Resources
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  
  tags = { Name = "${var.environment}-vpc" }
}

resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet("10.0.0.0/16", 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  
  tags = { Name = "${var.environment}-public-${count.index}" }
}

# Outputs
output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}
```

---

## State File — The Critical Piece

```
Terraform state file (terraform.tfstate):
  - JSON file
  - Maps your config resources to real AWS resources
  - "aws_vpc.main" → "vpc-0abc123def456"
  - Contains resource attributes (IDs, ARNs, IPs)
  
  {
    "resources": [{
      "type": "aws_vpc",
      "name": "main",
      "instances": [{
        "attributes": {
          "id": "vpc-0abc123def456",
          "cidr_block": "10.0.0.0/16",
          ...
        }
      }]
    }]
  }

Why remote state (S3) is mandatory for teams:
  Local state: Engineer A runs terraform → state on laptop
               Engineer B runs terraform → no state → tries to create AGAIN → duplicate resources!
               
  Remote state (S3 + DynamoDB):
    - State centrally stored (all engineers read same state)
    - DynamoDB lock: only one engineer can run terraform at a time
    - S3 versioning: state file history (can recover previous state)
    
  ⚠️ State contains SECRETS (DB passwords, private keys)!
     → S3 bucket encryption on, public access blocked, strict IAM
```

### State Locking

```
terraform apply (Engineer A): DynamoDB me lock acquire karta hai
                               State S3 se read karta hai
                               Changes apply karta hai
                               State S3 mein update karta hai
                               Lock release karta hai

terraform apply (Engineer B, concurrent):
  DynamoDB lock already held by A → wait/fail
  Prevents: state corruption from concurrent applies
```

---

## Plan → Apply Cycle

```bash
# NEVER skip terraform plan!

# 1. Initialize (first time, or after provider/backend changes)
terraform init

# 2. Plan — what WILL change?
terraform plan -out=tfplan -var-file=production.tfvars
# Output:
# + aws_subnet.private[0]     (create)
# + aws_subnet.private[1]     (create)
# ~ aws_security_group.app    (modify in-place)
#   ~ ingress {
#       + cidr_blocks = ["10.0.0.0/8"]
#   }
# - aws_instance.old_server   (destroy)  ← REVIEW CAREFULLY!
# 
# Plan: 2 to add, 1 to change, 1 to destroy.

# 3. Review plan output carefully:
#    ~ modify: usually safe
#    + create: usually safe  
#    - destroy: READ CAREFULLY! Production data at risk?
#    -/+ replace: resource destroyed and recreated (downtime!)

# 4. Apply (only after reviewing plan)
terraform apply tfplan

# Emergency: if stuck/corrupted state
terraform force-unlock LOCK_ID  # manual lock release
```

---

## Modules — Reusable Infrastructure

```
Module = reusable infrastructure components.
DRY principle: Don't Repeat Yourself.
```

```hcl
# modules/vpc/main.tf (reusable VPC module)
variable "environment" {}
variable "cidr_block" { default = "10.0.0.0/16" }
variable "az_count"   { default = 2 }

resource "aws_vpc" "this" {
  cidr_block = var.cidr_block
  # ... full VPC config
}

output "vpc_id"            { value = aws_vpc.this.id }
output "public_subnet_ids" { value = aws_subnet.public[*].id }
output "private_subnet_ids"{ value = aws_subnet.private[*].id }
```

```hcl
# environments/production/main.tf
module "vpc" {
  source = "../../modules/vpc"
  # OR: source = "git::https://github.com/company/infra-modules.git//vpc?ref=v2.1.0"
  
  environment = "production"
  cidr_block  = "10.0.0.0/16"
  az_count    = 3            # production: 3 AZs
}

# environments/staging/main.tf
module "vpc" {
  source = "../../modules/vpc"
  
  environment = "staging"
  cidr_block  = "10.1.0.0/16"
  az_count    = 2            # staging: 2 AZs (cheaper)
}
```

**Module versioning — critical for teams:**
```hcl
# ❌ Mutable reference — any team member's push breaks everyone
source = "git::https://github.com/company/infra.git//vpc"

# ✅ Pinned version — explicit, reviewed changes only
source = "git::https://github.com/company/infra.git//vpc?ref=v2.1.0"
# OR for public registry:
source  = "terraform-aws-modules/vpc/aws"
version = "5.2.0"   # pinned to exact version
```

---

## Drift Detection

```
Drift = real world ≠ Terraform state

How it happens:
  1. Someone manually changed a security group in AWS console (emergency)
  2. AWS itself changed something (e.g., deprecated resource type)
  3. Another tool/automation modified resources
  
Detect drift:
  terraform plan   # shows what terraform wants to change to match desired state
  
  If plan shows changes but you made no config changes → DRIFT DETECTED!
  
  terraform refresh  # refresh state from real world (updates state file)
                     # CAREFUL: this accepts drift as "correct"
                     
  terraform plan -refresh=false  # detect drift without accepting it

Prevent drift:
  - IAM permissions: restrict manual console access
  - Mandatory: all infra changes via PR → terraform apply
  - Drift monitoring: run terraform plan in CI daily, alert if drift found
```

---

## Terraform Import — Existing Resources

```bash
# Kisi existing resource ko Terraform ke under laana

# Step 1: Config mein resource define karo (empty or best guess)
# main.tf:
resource "aws_security_group" "app" {
  name = "app-sg"
  # ... will be filled by import
}

# Step 2: Real AWS resource ka ID dhoondho
# AWS console ya aws cli se: aws ec2 describe-security-groups

# Step 3: Import
terraform import aws_security_group.app sg-0abc123def456

# Step 4: State refresh karo, config update karo
terraform show  # imported state dekho
# Manual: state ke anusaar config update karo
terraform plan  # verify: "No changes" hona chahiye
```

---

## Workspaces — Environment Isolation

```
Option 1: Workspaces (simple projects)
  terraform workspace new staging
  terraform workspace new production
  
  Same code, different state per workspace.
  terraform.workspace variable available:
    cidr = "10.${terraform.workspace == "production" ? 0 : 1}.0.0/16"
  
  ⚠️ All environments in same repo/state bucket — risky for large teams

Option 2: Separate state files (recommended for production)
  environments/
    dev/
      main.tf → backend "s3" key = "dev/terraform.tfstate"
    staging/
      main.tf → backend "s3" key = "staging/terraform.tfstate"
    production/
      main.tf → backend "s3" key = "production/terraform.tfstate"
  
  ✅ Complete isolation (production aur dev completely separate)
  ✅ Different AWS accounts per environment (best practice)
  ✅ IAM: dev engineers can apply dev, only senior engineers can apply prod
```

---

## Production Terraform — Best Practices

```
Repository structure:
  infra/
    modules/               ← reusable modules (vpc, eks, rds)
      vpc/
      eks-cluster/
      rds-postgres/
    environments/
      dev/
      staging/
      production/
    .github/workflows/
      terraform-plan.yml   ← PR pe plan run karo, output comment mein
      terraform-apply.yml  ← main branch merge pe apply (with approval gate)

Security:
  ☐ State S3 bucket: encryption on, public access off, versioning on
  ☐ DynamoDB lock table: always
  ☐ State file: never in Git
  ☐ Sensitive variables: -var-file=secrets.tfvars (gitignored)
                          OR HashiCorp Vault provider
                          OR AWS Secrets Manager data source
  ☐ Provider credentials: OIDC federation from CI (no long-lived keys)

Operations:
  ☐ Always terraform plan before apply
  ☐ Review all destroys and replacements extra carefully
  ☐ Run plan in CI on every PR
  ☐ Manual approval required for production apply
  ☐ State lock awareness: notify team before long applies
```
