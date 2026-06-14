# 07 — CI/CD Pipelines (Days 68–69)

> **Core Mental Model:** CI/CD ka goal hai: code commit se production deployment tak automated, repeatable, safe pipeline. Key insight — artifact ek baar build hota hai, same artifact promote hota hai dev → staging → production. Different environments ke liye rebuild mat karo.

---

## CI/CD Mental Model

```
Developer → Code Push → GitHub
                              ↓
                    CI (Continuous Integration)
                    ├── Tests run (unit, integration)
                    ├── Security scan (SAST, dependency check)
                    ├── Build Docker image
                    ├── Push to registry (immutable tag: git sha)
                    └── ARTIFACT FROZEN here
                              ↓
                    CD (Continuous Delivery)
                    ├── Dev:        auto-deploy (every merge)
                    ├── Staging:    auto-deploy (daily/every merge)
                    └── Production: manual approval + deploy
                    
                    SAME IMAGE: registry/user-service:abc1234
                    Dev:        run this image ✓
                    Staging:    run this image ✓ (same!)
                    Production: run this image ✓ (same!)
                    
KEY RULE: Never rebuild. Same artifact through all envs.
Why? Rebuild = potentially different output (new dependency, compile difference)
     Promote = guaranteed same binary in prod as tested in staging
```

---

## GitHub Actions — Complete Workflow

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4        # ← SHA pinned (not @main!)
      
      - uses: actions/setup-go@v5
        with:
          go-version: '1.22'
          cache: true                    # go module cache
      
      - name: Run tests
        run: |
          go test ./... -race -count=1 -timeout=120s -coverprofile=coverage.out
          go tool cover -func=coverage.out | tail -1  # print coverage %
      
      - name: Lint
        uses: golangci/golangci-lint-action@v4   # SHA pinned in real config
        with:
          version: v1.58
      
      - name: Security scan (SAST)
        uses: securego/gosec@v2           # static analysis
        with:
          args: '-no-fail -fmt sarif -out gosec.sarif ./...'
      
      - name: Vulnerability check
        run: |
          go install golang.org/x/vuln/cmd/govulncheck@latest
          govulncheck ./...
  
  build:
    needs: test
    runs-on: ubuntu-latest
    # Only on main branch merges (not PRs)
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    outputs:
      image-digest: ${{ steps.build.outputs.digest }}
      image-tag: ${{ steps.meta.outputs.tags }}
    
    permissions:
      contents: read
      packages: write
      id-token: write    # OIDC ke liye (next section)
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Docker meta (tags aur labels)
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=,suffix=,format=short   # e.g., abc1234
            type=ref,event=branch                   # e.g., main
      
      - name: Set up Docker Buildx (layer caching ke liye)
        uses: docker/setup-buildx-action@v3
      
      - name: Login to registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}   # auto-provided
      
      - name: Build and push
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha          # GitHub Actions cache se
          cache-to: type=gha,mode=max   # GitHub Actions cache mein
          build-args: |
            VERSION=${{ github.sha }}
            COMMIT=${{ github.sha }}
      
      # Container image scan
      - name: Scan image for CVEs
        uses: aquasecurity/trivy-action@v0.18.0
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.build.outputs.digest }}
          severity: 'CRITICAL,HIGH'
          exit-code: '1'                # CRITICAL/HIGH CVE → fail build
```

---

## OIDC Federation — No Long-Lived Cloud Keys

```
❌ Old way (insecure):
  AWS_ACCESS_KEY_ID: AKIAIOSFODNN7EXAMPLE
  AWS_SECRET_ACCESS_KEY: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
  
  Stored in GitHub Secrets as long-lived keys.
  Risk: Leaked key = AWS access until manually rotated.
  Key rotation: pain, often forgotten, sometimes never done.

✅ OIDC way (secure):
  GitHub Actions → OIDC token request → GitHub OIDC provider
  GitHub OIDC provider → Token issued (JWT, short-lived, repo-scoped)
  Token → AWS STS AssumeRoleWithWebIdentity → Temporary credentials (15 min)
  
  No static keys stored anywhere!
  Keys auto-expire after 15 minutes.
  Trust based on: specific GitHub repo + branch + workflow
```

```yaml
# GitHub Actions OIDC → AWS setup

# AWS mein pehle karo (Terraform/console):
# 1. OIDC provider add karo: token.actions.githubusercontent.com
# 2. IAM role banaao with trust policy:
#    {
#      "Effect": "Allow",
#      "Principal": {"Federated": "arn:aws:iam::ACCOUNT:oidc-provider/token.actions.githubusercontent.com"},
#      "Action": "sts:AssumeRoleWithWebIdentity",
#      "Condition": {
#        "StringLike": {
#          "token.actions.githubusercontent.com:sub": "repo:company/user-service:*"
#        }
#      }
#    }

# GitHub Actions workflow mein:
jobs:
  deploy:
    permissions:
      id-token: write    # OIDC token request allow
      contents: read
    steps:
      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789:role/github-actions-deploy
          aws-region: ap-south-1
          # No access keys! OIDC se temp credentials milti hain
      
      - name: Deploy to EKS
        run: |
          aws eks update-kubeconfig --name production-cluster --region ap-south-1
          kubectl set image deployment/user-service user-service=$IMAGE_DIGEST
```

---

## Action Pinning — Security Requirement

```yaml
# ❌ DANGEROUS — tag mutable hai
uses: actions/checkout@v4
# Tag v4 kal badal sakta hai → malicious code inject ho sakta hai

# ✅ SAFE — SHA immutable hai
uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11

# Tool: pin-github-action (auto-pin karta hai)
# npm install -g pin-github-actions
# pin-github-actions .github/workflows/ci.yml

# Ya actions-update tool se update karo:
# Dependabot bhi kar sakta hai automatically
```

---

## Environment Promotion Pipeline

```yaml
# .github/workflows/cd.yml
name: CD Pipeline

on:
  workflow_run:
    workflows: ["CI Pipeline"]
    types: [completed]
    branches: [main]

jobs:
  deploy-dev:
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    environment: dev               # GitHub Environment (approval settings)
    steps:
      - name: Deploy to dev
        run: |
          kubectl set image deployment/user-service \
            user-service=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ env.DIGEST }}
          kubectl rollout status deployment/user-service --timeout=5m
  
  deploy-staging:
    needs: deploy-dev
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging
        run: |
          # Same image digest as dev!
          kubectl set image deployment/user-service \
            user-service=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ env.DIGEST }}
          kubectl rollout status deployment/user-service --timeout=5m
      
      - name: Run smoke tests against staging
        run: |
          ./scripts/smoke-test.sh https://staging-api.company.com
  
  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production         # ← Required reviewers set here (manual approval)
    steps:
      - name: Notify Slack (deploy starting)
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -d '{"text": "Deploying user-service ${{ env.COMMIT_SHA }} to production"}'
      
      - name: Deploy to production
        run: |
          # Same image digest all the way from dev!
          kubectl set image deployment/user-service \
            user-service=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ env.DIGEST }}
          kubectl rollout status deployment/user-service --timeout=10m
      
      - name: Post-deploy checks
        run: |
          sleep 60   # wait for metrics
          # Check error rate (Prometheus query)
          ERROR_RATE=$(curl -s "https://prometheus.company.com/api/v1/query?query=rate(http_requests_total{status=~'5.*',service='user-service'}[5m])/rate(http_requests_total{service='user-service'}[5m])" | jq '.data.result[0].value[1]')
          if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
            echo "Error rate $ERROR_RATE > 1% threshold — rolling back!"
            kubectl rollout undo deployment/user-service
            exit 1
          fi
```

---

## Build Caching Strategy

```
Go build cache layers (fastest to slowest):
  1. Go module cache (go.sum → cached download)
  2. Go build cache (incremental compilation)
  3. Docker layer cache (Dockerfile steps)
  4. GitHub Actions cache (cross-run persistence)

Practical caching in GitHub Actions:
```

```yaml
- uses: actions/setup-go@v5
  with:
    go-version: '1.22'
    cache: true           # Automatically caches ~/go/pkg/mod
                          # Key: go.sum hash (cache miss if deps change)

- name: Docker build with cache
  uses: docker/build-push-action@v5
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
    # First build: 5 minutes
    # Subsequent builds (no dep change): 45 seconds
    # Source-only change: 90 seconds
```

---

## Ephemeral Preview Environments

```
PR environment = per-PR temporary environment
Every PR gets its own running instance for testing/review
Auto-deleted when PR merged/closed

Use cases:
  - Manual testing by QA/designer without touching staging
  - Integration test against real services
  - PM preview before merge

Implementation:
```

```yaml
# .github/workflows/preview.yml
name: PR Preview Environment

on:
  pull_request:
    types: [opened, synchronize, closed]

jobs:
  deploy-preview:
    if: github.event.action != 'closed'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy preview
        run: |
          PR_NUM=${{ github.event.pull_request.number }}
          NAMESPACE="preview-pr-${PR_NUM}"
          
          # Create isolated namespace
          kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
          
          # Deploy app to this namespace
          helm upgrade --install user-service-preview ./helm/user-service \
            --namespace $NAMESPACE \
            --set image.tag=${{ github.sha }} \
            --set ingress.host="pr-${PR_NUM}.preview.company.com"
          
          echo "Preview URL: https://pr-${PR_NUM}.preview.company.com" >> $GITHUB_STEP_SUMMARY
      
      - name: Comment PR with preview URL
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview deployed at https://pr-${{ github.event.pull_request.number }}.preview.company.com'
            })
  
  cleanup-preview:
    if: github.event.action == 'closed'
    runs-on: ubuntu-latest
    steps:
      - name: Delete preview namespace
        run: |
          kubectl delete namespace preview-pr-${{ github.event.pull_request.number }} --ignore-not-found
```

---

## Rollback Strategy

```
Automatic rollback triggers:
  - Error rate > threshold (e.g., > 1% 5xx responses)
  - Latency P99 > threshold (e.g., > 2s)
  - Health check failures post-deploy

kubectl rollout undo deployment/user-service
  → Rolls back to previous Deployment revision
  → Previous image digest restore
  → ~30 seconds to rollback (faster than new deploy)

Kubernetes Deployment revision history:
  kubectl rollout history deployment/user-service
  REVISION  CHANGE-CAUSE
  1         Initial deploy
  2         Release v2.0.0
  3         Release v2.1.0 ← current
  
  kubectl rollout undo deployment/user-service --to-revision=2
  # Specific revision pe rollback

revisionHistoryLimit: 10   # Keep last 10 revisions (Deployment spec mein)
```
