---
source: notion
title: "Week 2 — Compute & APIs (Days 8–14)"
slug: "week-2-compute-and-apis-days-8-14"
notionId: "36bda883-bddd-8100-bbda-e5437c8395df"
notionRootId: "36bda883bddd817a96b3ccec274f3003"
parent: "30-day-aws-floci-roadmap-go-backend-engineer"
children: []
order: 2
icon: "⚡"
cover: null
---
> **Goal:** Deploy Go code as Lambda functions, expose APIs via API Gateway, containerise services in ECS, and manage Docker images in ECR — all locally via Floci with real Docker execution.

---


## 📅 Day 8 — Lambda: Serverless Go Functions


### Concepts

- Lambda = run code without managing servers. Triggered by events.
- Runtimes: Go uses the `provided.al2023` runtime with a custom bootstrap binary.
- Execution model: cold start (container initialised) vs warm start (reused container).
- Memory: 128MB to 10GB. CPU scales proportionally with memory.
- Timeout: max 15 minutes. For your Go HTTP backends, use ECS — not Lambda.
- Event sources: API Gateway, SQS, DynamoDB Streams, S3, EventBridge, SNS.
- Floci Lambda: runs in REAL Docker containers using actual AWS Lambda runtimes.

### Build Go Lambda binary


```bash
# Go Lambda for Linux/ARM (AWS Lambda)
GOOS=linux GOARCH=arm64 go build -o bootstrap ./cmd/lambda/
zip function.zip bootstrap
```


### Deploy and invoke via Floci


```bash
# Create execution role
ROLE_ARN=$(aws iam create-role \
  --role-name lambda-role \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}' \
  --query Role.Arn --output text)

# Deploy Lambda function
aws lambda create-function \
  --function-name resize-image \
  --runtime provided.al2023 \
  --role $ROLE_ARN \
  --handler bootstrap \
  --zip-file fileb://function.zip \
  --architectures arm64 \
  --timeout 30 \
  --memory-size 512

# Invoke synchronously
aws lambda invoke \
  --function-name resize-image \
  --payload '{"bucket":"my-app-uploads","key":"users/ashu/photo.jpg"}' \
  --cli-binary-format raw-in-base64-out \
  response.json

cat response.json

# Update function code (after rebuilding)
aws lambda update-function-code \
  --function-name resize-image \
  --zip-file fileb://function.zip

# List functions
aws lambda list-functions --query 'Functions[*].{Name:FunctionName,Runtime:Runtime,Memory:MemorySize}'
```


### Go Lambda handler


```go
// cmd/lambda/main.go
package main

import (
    "context"
    "fmt"
    "log/slog"

    "github.com/aws/aws-lambda-go/lambda"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/s3"
)

type Event struct {
    Bucket string `json:"bucket"`
    Key    string `json:"key"`
}

type Response struct {
    StatusCode int    `json:"statusCode"`
    Message    string `json:"message"`
}

func handler(ctx context.Context, event Event) (Response, error) {
    slog.Info("processing image", "bucket", event.Bucket, "key", event.Key)

    cfg, err := config.LoadDefaultConfig(ctx)
    if err != nil {
        return Response{StatusCode: 500}, err
    }

    s3Client := s3.NewFromConfig(cfg)
    out, err := s3Client.GetObject(ctx, &s3.GetObjectInput{
        Bucket: &event.Bucket,
        Key:    &event.Key,
    })
    if err != nil {
        return Response{StatusCode: 500}, err
    }
    defer out.Body.Close()

    // Process image here...
    slog.Info("image processed", "size", out.ContentLength)

    return Response{
        StatusCode: 200,
        Message:    fmt.Sprintf("processed %s/%s", event.Bucket, event.Key),
    }, nil
}

func main() {
    lambda.Start(handler)
}
```


### SQS → Lambda trigger


```bash
# Get SQS queue ARN
QUEUE_ARN=$(aws sqs get-queue-attributes \
  --queue-url http://localhost:4566/000000000000/job-queue \
  --attribute-names QueueArn --query Attributes.QueueArn --output text)

# Create event source mapping (SQS triggers Lambda)
aws lambda create-event-source-mapping \
  --function-name resize-image \
  --event-source-arn $QUEUE_ARN \
  --batch-size 5 \
  --starting-position LATEST

# Now any SQS message automatically triggers Lambda!
aws sqs send-message \
  --queue-url http://localhost:4566/000000000000/job-queue \
  --message-body '{"bucket":"my-app-uploads","key":"test.jpg"}'
```


---


## 📅 Day 9–10 — API Gateway: HTTP + WebSocket APIs


### Concepts

- API Gateway = managed HTTP API endpoint. Routes requests to Lambda, HTTP backends, or services.
- v1 (REST API): more features, more expensive, more complex. `execute-api.amazonaws.com`
- v2 (HTTP API): simpler, cheaper, faster. Most new APIs should use v2.
- WebSocket API: bidirectional connections. Routes by `$connect`, `$disconnect`, `$default`, custom routes.
- Integrations: Lambda (proxy), HTTP (forward to any HTTP backend), AWS services directly.
- Stages: `prod`, `staging`, `dev`. Each stage can have different settings.
- Floci supports both v1 and v2 + WebSocket — exclusive to Floci vs LocalStack Community.

### HTTP API (v2) + Lambda integration


```bash
# Create HTTP API
API_ID=$(aws apigatewayv2 create-api \
  --name my-api \
  --protocol-type HTTP \
  --query ApiId --output text)

# Create Lambda integration
INT_ID=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri arn:aws:lambda:us-east-1:000000000000:function:resize-image \
  --payload-format-version 2.0 \
  --query IntegrationId --output text)

# Create route: POST /process
aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key 'POST /process' \
  --target integrations/$INT_ID

# Deploy
aws apigatewayv2 create-stage \
  --api-id $API_ID \
  --stage-name prod \
  --auto-deploy

# Test it!
curl -X POST \
  "http://localhost:4566/_aws/execute-api/$API_ID/prod/process" \
  -H 'Content-Type: application/json' \
  -d '{"bucket":"my-app-uploads","key":"test.jpg"}'
```


### Go Lambda handler for API Gateway v2


```go
// cmd/api-lambda/main.go
package main

import (
    "context"
    "encoding/json"
    "net/http"

    "github.com/aws/aws-lambda-go/events"
    "github.com/aws/aws-lambda-go/lambda"
)

type ProcessRequest struct {
    Bucket string `json:"bucket"`
    Key    string `json:"key"`
}

func handler(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
    var body ProcessRequest
    if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
        return events.APIGatewayV2HTTPResponse{
            StatusCode: http.StatusBadRequest,
            Body:       `{"error":"invalid body"}`,
        }, nil
    }

    // process...

    resp, _ := json.Marshal(map[string]string{
        "status":  "queued",
        "bucket":  body.Bucket,
        "key":     body.Key,
    })

    return events.APIGatewayV2HTTPResponse{
        StatusCode: http.StatusOK,
        Headers:    map[string]string{"Content-Type": "application/json"},
        Body:       string(resp),
    }, nil
}

func main() { lambda.Start(handler) }
```


---


## 📅 Day 11–12 — ECR + ECS: Containerised Services


### Concepts

- ECR (Elastic Container Registry): managed Docker registry. Push images, Lambda + ECS pull them.
- ECS (Elastic Container Service): run Docker containers. Two launch types: Fargate (serverless) and EC2.
- Task definition: blueprint for a container. Image, CPU, memory, env vars, ports, IAM role.
- Service: keeps N tasks running. Auto-replaces failed tasks. Integrates with load balancers.
- Floci ECR: real OCI-compatible registry. Floci ECS: launches real Docker containers.

### ECR + ECS workflow


```bash
# Create ECR repository
aws ecr create-repository --repository-name my-go-service

# Build and tag your Go Docker image
docker build -t my-go-service:latest ./

# Authenticate Docker to Floci ECR
aws ecr get-login-password | docker login \
  --username AWS \
  --password-stdin localhost:4566

# Tag for ECR
docker tag my-go-service:latest \
  localhost:4566/000000000000/my-go-service:latest

# Push to Floci ECR
docker push localhost:4566/000000000000/my-go-service:latest

# Create ECS cluster
aws ecs create-cluster --cluster-name dev

# Register task definition
aws ecs register-task-definition \
  --family my-go-service \
  --cpu 256 --memory 512 \
  --container-definitions '[
    {
      "name": "api",
      "image": "localhost:4566/000000000000/my-go-service:latest",
      "portMappings": [{"containerPort": 8080, "hostPort": 8080}],
      "environment": [
        {"name":"AWS_ENDPOINT_URL","value":"http://floci:4566"},
        {"name":"PORT","value":"8080"}
      ]
    }
  ]'

# Run a task
aws ecs run-task \
  --cluster dev \
  --task-definition my-go-service \
  --count 1

# Create a service (keeps it running)
aws ecs create-service \
  --cluster dev \
  --service-name my-go-service \
  --task-definition my-go-service \
  --desired-count 2

# List running tasks
aws ecs list-tasks --cluster dev
```


### Go Dockerfile (production-grade)


```docker
# Dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server ./cmd/server/

FROM gcr.io/distroless/static:nonroot
COPY --from=builder /app/server /server
EXPOSE 8080
ENTRYPOINT ["/server"]
```


---


## 📅 Day 13 — Secrets Manager


### Concepts

- Never hardcode DB passwords, API keys, or tokens in env vars or code.
- Secrets Manager: store, rotate, and audit access to secrets.
- Rotation: automatic rotation with Lambda. DB passwords rotated without code changes.
- SDK integration: services call Secrets Manager at startup to fetch credentials.

```bash
# Store a secret
aws secretsmanager create-secret \
  --name prod/db/postgres \
  --secret-string '{"username":"app_user","password":"super-secret-123","host":"localhost","port":5432}'

# Retrieve in Go:
out, _ := smClient.GetSecretValue(ctx, &secretsmanager.GetSecretValueInput{
    SecretId: aws.String("prod/db/postgres"),
})
// parse JSON into your config struct
```


### Go secret fetching with caching


```go
// pkg/secrets/manager.go
package secrets

import (
    "context"
    "encoding/json"
    "sync"
    "time"

    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

type DBConfig struct {
    Username string `json:"username"`
    Password string `json:"password"`
    Host     string `json:"host"`
    Port     int    `json:"port"`
}

type Manager struct {
    client *secretsmanager.Client
    mu     sync.RWMutex
    cache  map[string]cachedSecret
}

type cachedSecret struct {
    value     string
    expiresAt time.Time
}

func (m *Manager) GetDBConfig(ctx context.Context, secretName string) (*DBConfig, error) {
    m.mu.RLock()
    if cached, ok := m.cache[secretName]; ok && time.Now().Before(cached.expiresAt) {
        m.mu.RUnlock()
        var cfg DBConfig
        json.Unmarshal([]byte(cached.value), &cfg)
        return &cfg, nil
    }
    m.mu.RUnlock()

    out, err := m.client.GetSecretValue(ctx, &secretsmanager.GetSecretValueInput{
        SecretId: aws.String(secretName),
    })
    if err != nil {
        return nil, err
    }

    m.mu.Lock()
    m.cache[secretName] = cachedSecret{
        value:     aws.ToString(out.SecretString),
        expiresAt: time.Now().Add(5 * time.Minute),
    }
    m.mu.Unlock()

    var cfg DBConfig
    return &cfg, json.Unmarshal([]byte(aws.ToString(out.SecretString)), &cfg)
}
```


---


## 📅 Day 14 — Week 2 Project: Serverless Go API


### Project: Order Processing API with Lambda + API Gateway + ECS


**Architecture:**


```javascript
HTTP Client
  └── POST /orders → API Gateway v2 → Lambda (Go)
                                          ├── Write order → DynamoDB
                                          └── Publish event → SNS → SQS

ECS Service (Go worker)
  └── Poll SQS → Process order
                ├── Fetch config → Secrets Manager
                └── Update DynamoDB status
```


**Deliverable:**

- Lambda: `POST /orders` → creates order in DynamoDB, publishes to SNS
- Lambda: `GET /orders/{userId}` → queries DynamoDB
- ECS task: Go worker polling SQS, processing orders, updating status
- All secrets loaded from Secrets Manager (not env vars)
- ECR image pushed, ECS task running via Floci
- One `make deploy` command sets up all AWS resources

---


## ⚠️ Common mistakes this week


### Mistake 1


**❌ Initialising AWS SDK clients inside the Lambda handler function.**


Every invocation re-initialises the client, making an HTTP call to the credentials endpoint. Adds 20-50ms per request.


**✅ Correct:** Initialise the AWS SDK client once in `main()` (outside the handler function). Lambda keeps the container warm between invocations, so the client is reused.


### Mistake 2


**❌ Using ECS Fargate for every service including CPU-intensive workloads.**


Fargate allocates CPU proportionally. A CPU-intensive Go service doing image processing will be throttled at low CPU settings.


**✅ Correct:** Measure CPU usage first. Set task CPU/memory based on profiling data. For burst workloads, use Lambda (scales instantly). For sustained workloads, use ECS with appropriate CPU.


### Mistake 3


**❌ Not setting a Lambda timeout that matches your SQS visibility timeout.**


If Lambda timeout is 30s and SQS visibility timeout is 30s, a slow Lambda invocation causes the message to reappear in the queue and be processed again.


**✅ Correct:** SQS visibility timeout should be at least 6x the Lambda timeout. If Lambda timeout is 30s, set SQS visibility timeout to 180s.

