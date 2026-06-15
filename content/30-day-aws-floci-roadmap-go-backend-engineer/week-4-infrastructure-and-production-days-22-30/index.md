---
source: notion
title: "Week 4 — Infrastructure & Production (Days 22–30)"
slug: "week-4-infrastructure-and-production-days-22-30"
notionId: "36bda883-bddd-8163-bab3-fe4708ebbe7a"
notionRootId: "36bda883bddd817a96b3ccec274f3003"
parent: "30-day-aws-floci-roadmap-go-backend-engineer"
children: []
order: 0
icon: "🏗️"
cover: null
---
> **Goal:** Tie everything together with infrastructure-as-code, orchestration, workflow automation, observability, and CI/CD. By Day 30, you will have a complete production-grade AWS stack defined entirely in code, deployed from a single command, running locally on Floci.

---


## 📅 Day 22–23 — CloudFormation: Infrastructure as Code


### Concepts

- CloudFormation = declare your AWS infrastructure in YAML/JSON. AWS creates, updates, and deletes resources.
- Stack: a collection of AWS resources managed as a unit.
- Template sections: `Parameters`, `Resources` (required), `Outputs`, `Mappings`, `Conditions`.
- Change sets: preview what will change before applying. Never apply blind.
- Drift detection: compare current state to the template. Catch manual changes.
- Floci CloudFormation: full stack support — create, update, delete, outputs.
- Why IaC: reproducible environments, version-controlled infrastructure, peer-reviewed changes.

### CloudFormation template for your backend stack


```yaml
# infrastructure/stack.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Go Backend Stack

Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues: [dev, staging, prod]
  AppName:
    Type: String
    Default: my-go-service

Resources:

  # S3 Bucket for uploads
  UploadsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AppName}-uploads-${Environment}'
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: delete-old-tmp
            Status: Enabled
            Prefix: tmp/
            ExpirationInDays: 1

  # SQS Job Queue + DLQ
  JobQueueDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${AppName}-job-dlq-${Environment}'
      MessageRetentionPeriod: 1209600  # 14 days

  JobQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub '${AppName}-job-queue-${Environment}'
      VisibilityTimeout: 180
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt JobQueueDLQ.Arn
        maxReceiveCount: 3

  # SNS Order Events Topic
  OrderEventsTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub '${AppName}-order-events-${Environment}'

  # Subscribe job queue to SNS
  JobQueueSubscription:
    Type: AWS::SNS::Subscription
    Properties:
      TopicArn: !Ref OrderEventsTopic
      Protocol: sqs
      Endpoint: !GetAtt JobQueue.Arn

  # DynamoDB Orders Table
  OrdersTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${AppName}-orders-${Environment}'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
        - AttributeName: orderId
          AttributeType: S
        - AttributeName: createdAt
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH
        - AttributeName: orderId
          KeyType: RANGE
      GlobalSecondaryIndexes:
        - IndexName: createdAt-index
          KeySchema:
            - AttributeName: createdAt
              KeyType: HASH
          Projection:
            ProjectionType: ALL
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES

  # Secrets Manager for DB credentials
  DBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${AppName}/db/postgres/${Environment}'
      SecretString: !Sub |
        {
          "username": "app_user",
          "password": "CHANGE_ME_IN_PROD",
          "host": "localhost",
          "port": 5432,
          "dbname": "appdb"
        }

  # IAM Role for Lambda
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AppName}-lambda-role-${Environment}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: AppPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                Resource: !Sub '${UploadsBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - sqs:SendMessage
                  - sqs:ReceiveMessage
                  - sqs:DeleteMessage
                Resource: !GetAtt JobQueue.Arn
              - Effect: Allow
                Action:
                  - dynamodb:PutItem
                  - dynamodb:GetItem
                  - dynamodb:Query
                  - dynamodb:UpdateItem
                Resource: !GetAtt OrdersTable.Arn
              - Effect: Allow
                Action: secretsmanager:GetSecretValue
                Resource: !Ref DBSecret
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'

Outputs:
  UploadsBucketName:
    Value: !Ref UploadsBucket
    Export:
      Name: !Sub '${AppName}-uploads-bucket-${Environment}'
  JobQueueURL:
    Value: !Ref JobQueue
  OrdersTableName:
    Value: !Ref OrdersTable
  LambdaRoleArn:
    Value: !GetAtt LambdaExecutionRole.Arn
```


### Deploy with CloudFormation via Floci


```bash
# Deploy stack
aws cloudformation create-stack \
  --stack-name my-go-service-dev \
  --template-body file://infrastructure/stack.yaml \
  --parameters ParameterKey=Environment,ParameterValue=dev \
  --capabilities CAPABILITY_NAMED_IAM

# Wait for stack to complete
aws cloudformation wait stack-create-complete \
  --stack-name my-go-service-dev

# Get outputs
aws cloudformation describe-stacks \
  --stack-name my-go-service-dev \
  --query 'Stacks[0].Outputs'

# Update stack (after template changes)
aws cloudformation create-change-set \
  --stack-name my-go-service-dev \
  --change-set-name update-1 \
  --template-body file://infrastructure/stack.yaml

# Review change set
aws cloudformation describe-change-set \
  --stack-name my-go-service-dev \
  --change-set-name update-1

# Execute it
aws cloudformation execute-change-set \
  --stack-name my-go-service-dev \
  --change-set-name update-1

# Delete entire stack (cleans up ALL resources)
aws cloudformation delete-stack \
  --stack-name my-go-service-dev
```


### Makefile for one-command deploy


```makefile
# Makefile
.PHONY: floci deploy destroy

floci:
	docker run -d --name floci \
	  -p 4566:4566 \
	  -v /var/run/docker.sock:/var/run/docker.sock \
	  floci/floci:latest

deploy:
	AWS_ENDPOINT_URL=http://localhost:4566 \
	AWS_DEFAULT_REGION=us-east-1 \
	AWS_ACCESS_KEY_ID=test \
	AWS_SECRET_ACCESS_KEY=test \
	aws cloudformation create-stack \
	  --stack-name my-go-service-dev \
	  --template-body file://infrastructure/stack.yaml \
	  --capabilities CAPABILITY_NAMED_IAM && \
	aws cloudformation wait stack-create-complete \
	  --stack-name my-go-service-dev

destroy:
	AWS_ENDPOINT_URL=http://localhost:4566 \
	aws cloudformation delete-stack \
	  --stack-name my-go-service-dev
```


---


## 📅 Day 24 — Step Functions: Workflow Orchestration


### Concepts

- Step Functions = visual workflow engine. Orchestrate multiple AWS services into a sequence.
- States: Task (call a service), Choice (branching), Wait (delay), Parallel (fork/join), Map (iterate), Pass, Succeed, Fail.
- State machine: JSON/YAML definition using Amazon States Language (ASL).
- Express vs Standard: Standard = long-running (up to 1yr), exactly-once. Express = short-lived, at-least-once.
- Use cases: order processing saga, data pipelines, multi-step approval workflows, ETL jobs.
- Floci: full ASL support.

### Order processing workflow


```json
{
  "Comment": "Order processing saga",
  "StartAt": "ValidateOrder",
  "States": {
    "ValidateOrder": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:000000000000:function:validate-order",
      "Retry": [{"ErrorEquals": ["Lambda.ServiceException"], "MaxAttempts": 2}],
      "Catch": [{
        "ErrorEquals": ["ValidationError"],
        "Next": "OrderFailed",
        "ResultPath": "$.error"
      }],
      "Next": "CheckInventory"
    },
    "CheckInventory": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:000000000000:function:check-inventory",
      "Next": "InventoryAvailable?"
    },
    "InventoryAvailable?": {
      "Type": "Choice",
      "Choices": [{
        "Variable": "$.inventoryStatus",
        "StringEquals": "available",
        "Next": "ProcessPayment"
      }],
      "Default": "WaitForInventory"
    },
    "WaitForInventory": {
      "Type": "Wait",
      "Seconds": 300,
      "Next": "CheckInventory"
    },
    "ProcessPayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:000000000000:function:process-payment",
      "Catch": [{
        "ErrorEquals": ["PaymentFailed"],
        "Next": "CompensateInventory",
        "ResultPath": "$.error"
      }],
      "Next": "FulfillOrder"
    },
    "FulfillOrder": {
      "Type": "Parallel",
      "Branches": [
        {
          "StartAt": "ShipOrder",
          "States": {
            "ShipOrder": {
              "Type": "Task",
              "Resource": "arn:aws:lambda:us-east-1:000000000000:function:ship-order",
              "End": true
            }
          }
        },
        {
          "StartAt": "SendConfirmation",
          "States": {
            "SendConfirmation": {
              "Type": "Task",
              "Resource": "arn:aws:lambda:us-east-1:000000000000:function:send-confirmation",
              "End": true
            }
          }
        }
      ],
      "Next": "OrderComplete"
    },
    "CompensateInventory": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:000000000000:function:release-inventory",
      "Next": "OrderFailed"
    },
    "OrderComplete": {"Type": "Succeed"},
    "OrderFailed": {"Type": "Fail", "Error": "OrderFailed"}
  }
}
```


```bash
# Create state machine
SM_ARN=$(aws stepfunctions create-state-machine \
  --name order-processor \
  --definition file://workflows/order-processing.json \
  --role-arn arn:aws:iam::000000000000:role/sfn-role \
  --query stateMachineArn --output text)

# Start an execution
EXEC_ARN=$(aws stepfunctions start-execution \
  --state-machine-arn $SM_ARN \
  --input '{"orderId":"ord-001","userId":"usr-123","items":[{"sku":"WIDGET-01","qty":2}]}' \
  --query executionArn --output text)

# Check execution status
aws stepfunctions describe-execution \
  --execution-arn $EXEC_ARN \
  --query '{Status:status,StartDate:startDate,StopDate:stopDate}'

# Get execution history (trace every state transition)
aws stepfunctions get-execution-history \
  --execution-arn $EXEC_ARN \
  --query 'events[*].{Type:type,Timestamp:timestamp}'
```


### Trigger Step Functions from Go


```go
// pkg/workflows/order_workflow.go
package workflows

import (
    "context"
    "encoding/json"

    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/service/sfn"
)

type OrderWorkflow struct {
    client         *sfn.Client
    stateMachineARN string
}

type OrderInput struct {
    OrderID string        `json:"orderId"`
    UserID  string        `json:"userId"`
    Items   []OrderItem   `json:"items"`
}

func (w *OrderWorkflow) Start(ctx context.Context, input OrderInput) (string, error) {
    data, err := json.Marshal(input)
    if err != nil {
        return "", err
    }
    out, err := w.client.StartExecution(ctx, &sfn.StartExecutionInput{
        StateMachineArn: aws.String(w.stateMachineARN),
        Input:           aws.String(string(data)),
        Name:            aws.String("order-" + input.OrderID), // idempotent name
    })
    if err != nil {
        return "", err
    }
    return aws.ToString(out.ExecutionArn), nil
}
```


---


## 📅 Day 25 — EventBridge: Event Bus & Scheduling


### Concepts

- EventBridge = serverless event bus. Route events between AWS services, your apps, and SaaS.
- Event bus: default (AWS service events) or custom (your app events).
- Rules: match events by pattern and route to targets (Lambda, SQS, Step Functions, etc.).
- Scheduler: cron or rate-based schedules. Replaces CloudWatch Events for scheduling.
- Schema registry: discover and document event schemas.
- Event-driven integration without direct coupling between services.

```bash
# Create custom event bus
aws events create-event-bus --name my-app-events

# Create rule: route order.placed events to Lambda
aws events put-rule \
  --name route-order-events \
  --event-bus-name my-app-events \
  --event-pattern '{
    "source": ["my-app.orders"],
    "detail-type": ["order.placed", "order.cancelled"]
  }' \
  --state ENABLED

# Add Lambda as target
aws events put-targets \
  --rule route-order-events \
  --event-bus-name my-app-events \
  --targets 'Id=order-processor,Arn=arn:aws:lambda:us-east-1:000000000000:function:process-order'

# Publish an event from Go
aws events put-events \
  --entries '[
    {
      "EventBusName": "my-app-events",
      "Source": "my-app.orders",
      "DetailType": "order.placed",
      "Detail": "{\"orderId\":\"ord-001\",\"userId\":\"usr-123\",\"total\":299.99}"
    }
  ]'

# Create a scheduled rule (cron: every day at 2am UTC)
aws scheduler create-schedule \
  --name nightly-cleanup \
  --schedule-expression 'cron(0 2 * * ? *)' \
  --target '{
    "Arn":"arn:aws:lambda:us-east-1:000000000000:function:cleanup",
    "RoleArn":"arn:aws:iam::000000000000:role/scheduler-role"
  }' \
  --flexible-time-window '{"Mode":"OFF"}'
```


### Go EventBridge publisher


```go
// pkg/events/eventbridge.go
package events

import (
    "context"
    "encoding/json"
    "fmt"

    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/service/eventbridge"
    "github.com/aws/aws-sdk-go-v2/service/eventbridge/types"
)

type EventBridgePublisher struct {
    client   *eventbridge.Client
    busName  string
    source   string
}

func (p *EventBridgePublisher) Publish(ctx context.Context, detailType string, detail interface{}) error {
    data, err := json.Marshal(detail)
    if err != nil {
        return err
    }
    out, err := p.client.PutEvents(ctx, &eventbridge.PutEventsInput{
        Entries: []types.PutEventsRequestEntry{
            {
                EventBusName: aws.String(p.busName),
                Source:       aws.String(p.source),
                DetailType:   aws.String(detailType),
                Detail:       aws.String(string(data)),
            },
        },
    })
    if err != nil {
        return err
    }
    if out.FailedEntryCount > 0 {
        return fmt.Errorf("%d events failed to publish", out.FailedEntryCount)
    }
    return nil
}
```


---


## 📅 Day 26 — EKS: Kubernetes on AWS


### Concepts

- EKS = managed Kubernetes. AWS manages the control plane. You manage worker nodes (or use Fargate).
- Floci EKS: spins up a **real k3s cluster** in Docker. Full `kubectl` support.
- Objects: Pod, Deployment, Service, Ingress, ConfigMap, Secret, HorizontalPodAutoscaler.
- Namespaces: isolate environments (dev/staging/prod) within one cluster.
- Helm: Kubernetes package manager. Charts are templated Kubernetes manifests.
- Use EKS when: multiple services, complex networking, need full Kubernetes ecosystem.

```bash
# Create EKS cluster (Floci starts real k3s)
aws eks create-cluster \
  --name dev-cluster \
  --role-arn arn:aws:iam::000000000000:role/eks-role \
  --resources-vpc-config subnetIds=subnet-00000001

# Get kubeconfig
aws eks update-kubeconfig --name dev-cluster

# Verify cluster is running
kubectl get nodes
kubectl get pods --all-namespaces

# Deploy your Go service to Kubernetes
cat > k8s/deployment.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-go-service
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-go-service
  template:
    metadata:
      labels:
        app: my-go-service
    spec:
      containers:
      - name: api
        image: localhost:4566/000000000000/my-go-service:latest
        ports:
        - containerPort: 8080
        env:
        - name: AWS_ENDPOINT_URL
          value: http://floci:4566
        - name: PORT
          value: "8080"
        resources:
          requests:
            cpu: 100m
            memory: 64Mi
          limits:
            cpu: 500m
            memory: 256Mi
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: my-go-service
spec:
  selector:
    app: my-go-service
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-go-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-go-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
EOF

kubectl apply -f k8s/deployment.yaml
kubectl get pods -w
kubectl logs -l app=my-go-service --tail=100
```


### Go health check endpoints (required for k8s probes)


```go
// cmd/server/health.go
package main

import (
    "context"
    "net/http"
    "time"
)

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    w.Write([]byte(`{"status":"ok"}`))
}

func (s *Server) handleReady(w http.ResponseWriter, r *http.Request) {
    ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
    defer cancel()

    // Check DB
    if err := s.db.Ping(ctx); err != nil {
        http.Error(w, `{"status":"not ready","reason":"db"}`, http.StatusServiceUnavailable)
        return
    }
    // Check Redis
    if err := s.cache.Ping(ctx).Err(); err != nil {
        http.Error(w, `{"status":"not ready","reason":"cache"}`, http.StatusServiceUnavailable)
        return
    }
    w.WriteHeader(http.StatusOK)
    w.Write([]byte(`{"status":"ready"}`))
}
```


---


## 📅 Day 27 — CloudWatch: Observability


### Concepts

- CloudWatch Logs: centralised log aggregation. Log groups → log streams → log events.
- CloudWatch Metrics: numeric time-series data. Namespace → metric → dimensions.
- CloudWatch Alarms: trigger on metric thresholds. Notify via SNS or trigger auto scaling.
- Structured logging: JSON logs with consistent fields (requestId, userId, duration, error).
- Custom metrics: push your own metrics (order count, payment latency, cache hit rate).

```bash
# Create log group
aws logs create-log-group --log-group-name /my-go-service/api
aws logs create-log-group --log-group-name /my-go-service/worker

# Put a log event
TOKEN=$(aws logs create-log-stream \
  --log-group-name /my-go-service/api \
  --log-stream-name app-$(date +%Y%m%d) 2>&1)

aws logs put-log-events \
  --log-group-name /my-go-service/api \
  --log-stream-name app-$(date +%Y%m%d) \
  --log-events "timestamp=$(date +%s000),message='{\"level\":\"info\",\"msg\":\"request processed\",\"latency_ms\":45}'"

# Query logs with CloudWatch Insights
aws logs start-query \
  --log-group-name /my-go-service/api \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @timestamp, msg, latency_ms | filter level = "error" | sort @timestamp desc | limit 20'

# Put custom metric (e.g., orders per minute)
aws cloudwatch put-metric-data \
  --namespace MyGoService \
  --metric-name OrdersProcessed \
  --value 42 \
  --unit Count \
  --dimensions Environment=dev

# Create alarm: alert if error rate > 1%
aws cloudwatch put-metric-alarm \
  --alarm-name high-error-rate \
  --namespace MyGoService \
  --metric-name ErrorRate \
  --threshold 1.0 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 3 \
  --period 60 \
  --statistic Average \
  --alarm-actions arn:aws:sns:us-east-1:000000000000:alerts-topic
```


### Go structured logging + CloudWatch integration


```go
// pkg/observability/logger.go
package observability

import (
    "context"
    "log/slog"
    "os"
    "time"
)

type RequestLogger struct {
    logger *slog.Logger
}

func NewLogger(service, environment string) *slog.Logger {
    return slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
        Level: slog.LevelInfo,
    })).With(
        "service", service,
        "env", environment,
    )
}

// Middleware for HTTP request logging
func LoggingMiddleware(logger *slog.Logger) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            start := time.Now()
            rw := &responseWriter{ResponseWriter: w}
            next.ServeHTTP(rw, r)
            logger.InfoContext(r.Context(), "request",
                "method",      r.Method,
                "path",        r.URL.Path,
                "status",      rw.status,
                "latency_ms",  time.Since(start).Milliseconds(),
                "request_id",  r.Header.Get("X-Request-Id"),
            )
        })
    }
}

// pkg/observability/metrics.go
func PublishMetric(ctx context.Context, cw *cloudwatch.Client, namespace, name string, value float64, unit types.StandardUnit) {
    cw.PutMetricData(ctx, &cloudwatch.PutMetricDataInput{
        Namespace: aws.String(namespace),
        MetricData: []types.MetricDatum{
            {
                MetricName: aws.String(name),
                Value:      aws.Float64(value),
                Unit:       unit,
                Timestamp:  aws.Time(time.Now()),
            },
        },
    })
}
```


---


## 📅 Day 28 — CodeBuild: CI/CD Pipelines


### Concepts

- CodeBuild = managed build service. Runs your build in a Docker container.
- Buildspec: YAML file defining phases (install, pre_build, build, post_build).
- Floci CodeBuild: launches **real Docker containers** using the build image you specify.
- Integration with GitHub/GitLab via webhooks.
- Artifacts: built outputs uploaded to S3. Cache: dependency cache in S3 between builds.

```bash
# Create CodeBuild project
aws codebuild create-project \
  --name my-go-service-build \
  --source '{
    "type": "NO_SOURCE",
    "buildspec": "version: 0.2\nphases:\n  install:\n    runtime-versions:\n      golang: 1.22\n  build:\n    commands:\n      - go test ./...\n      - CGO_ENABLED=0 GOOS=linux go build -o bootstrap ./cmd/lambda/\n      - zip function.zip bootstrap\nartifacts:\n  files:\n    - function.zip"
  }' \
  --artifacts '{"type":"S3","location":"my-app-uploads-dev","name":"builds"}' \
  --environment '{
    "type": "LINUX_CONTAINER",
    "image": "aws/codebuild/standard:7.0",
    "computeType": "BUILD_GENERAL1_SMALL"
  }' \
  --service-role arn:aws:iam::000000000000:role/codebuild-role

# Start a build
BUILD_ID=$(aws codebuild start-build \
  --project-name my-go-service-build \
  --query 'build.id' --output text)

# Watch build status
aws codebuild batch-get-builds --ids $BUILD_ID \
  --query 'builds[0].{Status:buildStatus,Phase:currentPhase}'
```


### buildspec.yml for Go Lambda


```yaml
# buildspec.yml
version: 0.2

env:
  variables:
    GOPROXY: https://proxy.golang.org
    CGO_ENABLED: "0"
    GOOS: linux
    GOARCH: arm64

phases:
  install:
    runtime-versions:
      golang: 1.22
    commands:
      - go install gotest.tools/gotestsum@latest

  pre_build:
    commands:
      - go mod download
      - go vet ./...
      - staticcheck ./...

  build:
    commands:
      - gotestsum --format testname -- -race -coverprofile=coverage.out ./...
      - go tool cover -func=coverage.out
      - go build -ldflags='-s -w' -o bootstrap ./cmd/lambda/

  post_build:
    commands:
      - zip function.zip bootstrap
      - |
        aws lambda update-function-code \
          --function-name resize-image \
          --zip-file fileb://function.zip \
          --endpoint-url $AWS_ENDPOINT_URL

artifacts:
  files:
    - function.zip
    - coverage.out
  discard-paths: yes

cache:
  paths:
    - /root/go/pkg/mod/**/*
```


---


## 📅 Day 29 — Auto Scaling & ELB


### Concepts

- Application Load Balancer (ALB): L7. Routes by path/host/header. SSL termination. Health checks.
- Network Load Balancer (NLB): L4. TCP/UDP. Preserves client IP. Ultra-low latency.
- Auto Scaling Groups: maintain N healthy instances. Scale out on high CPU, scale in on low.
- Target tracking policy: keep CPU at 70%. ASG adjusts capacity automatically.
- Floci ELB v2: ALB + NLB fully supported — exclusive to Floci.

```bash
# Create ALB target group
TG_ARN=$(aws elbv2 create-target-group \
  --name my-go-service-tg \
  --protocol HTTP \
  --port 8080 \
  --vpc-id vpc-00000001 \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --query 'TargetGroups[0].TargetGroupArn' --output text)

# Create ALB
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name my-go-service-alb \
  --subnets subnet-00000001 subnet-00000002 \
  --query 'LoadBalancers[0].LoadBalancerArn' --output text)

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN

# Create Auto Scaling policy (target tracking: CPU 70%)
aws autoscaling put-scaling-policy \
  --auto-scaling-group-name my-asg \
  --policy-name cpu-target-tracking \
  --policy-type TargetTrackingScaling \
  --target-tracking-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ASGAverageCPUUtilization"
    }
  }'
```


---


## 📅 Day 30 — Capstone: Production AWS Stack


### The 30-day capstone project


Build and deploy a **complete production-grade Go backend** using everything from this roadmap. All infrastructure defined in CloudFormation. All services run locally via Floci. One `make deploy` command stands up the entire stack.


**Full architecture:**


```javascript
┌─────────────────────────────────────────────────────────────────┐
│  Client                                                          │
│    └── ALB :80 → API Gateway v2 → Lambda (Go)                   │
│                                    ├── RDS PostgreSQL            │
│                                    ├── ElastiCache Redis         │
│                                    └── EventBridge (events out)  │
│                                                                    │
│  EventBridge → Step Functions (order saga)                        │
│    ├── Lambda: validate-order                                     │
│    ├── Lambda: check-inventory → DynamoDB                        │
│    ├── Lambda: process-payment                                    │
│    └── Lambda: send-confirmation → SES                            │
│                                                                    │
│  SQS Worker (ECS/EKS Go service)                                  │
│    └── Process jobs → S3 (file processing)                        │
│                                                                    │
│  MSK Kafka → Analytics consumer (ECS)                            │
│                                                                    │
│  CloudWatch: logs + metrics + alarms → SNS alerts                │
│  Secrets Manager: all credentials                                 │
│  CloudFormation: entire stack as code                             │
│  CodeBuild: CI pipeline                                           │
└─────────────────────────────────────────────────────────────────┘
```


**Deliverables:**

1. **CloudFormation template** — entire infrastructure as code (S3, SQS, SNS, DynamoDB, RDS, ElastiCache, Lambda functions, ECS services, EventBridge rules, Step Functions, IAM roles, CloudWatch alarms, Secrets Manager)
2. **Go Lambda functions** — validate-order, check-inventory, process-payment, send-confirmation. Each with tests.
3. **Go ECS service** — REST API + SQS worker in one binary with graceful shutdown
4. **Go MSK consumer** — streams order events to analytics pipeline
5. **Buildspec.yml** — runs tests, builds binary, deploys Lambda via CodeBuild
6. **docker-compose.yml** — Floci + all services. `docker compose up` starts the entire environment
7. **Makefile** — `make floci`, `make deploy`, `make test`, `make destroy`
8. [**README.md**](http://readme.md/) — architecture diagram, service list, how to run, environment variables

**Go project structure:**


```javascript
my-go-service/
├── cmd/
│   ├── api/           # ECS REST API server
│   ├── worker/        # SQS worker
│   └── lambda/        # Lambda functions
│       ├── validate-order/
│       ├── check-inventory/
│       ├── process-payment/
│       └── send-confirmation/
├── pkg/
│   ├── aws/           # shared AWS config (Floci-aware)
│   ├── cache/         # Redis client
│   ├── database/      # PostgreSQL pool
│   ├── events/        # SNS + EventBridge publishers
│   ├── repository/    # DynamoDB + RDS repos
│   ├── secrets/       # Secrets Manager
│   ├── storage/       # S3 client
│   ├── streaming/     # Kafka producer/consumer
│   ├── worker/        # SQS worker
│   ├── workflows/     # Step Functions client
│   └── observability/ # logging + metrics
├── migrations/        # PostgreSQL migrations
├── infrastructure/    # CloudFormation templates
├── k8s/               # Kubernetes manifests
├── workflows/         # Step Functions ASL definitions
├── buildspec.yml
├── docker-compose.yml
├── Makefile
└── README.md
```


---


## ⚠️ Common mistakes this week


### Mistake 1


**❌ Hardcoding resource ARNs and names in application code.**


You hardcode `my-app-uploads-dev` in Go. Deploying to staging means changing 15 places.


**✅ Correct:** Export CloudFormation stack outputs. At startup, call `cloudformation:DescribeStacks` and load all resource ARNs/names into a config struct. Zero hardcoded AWS resource identifiers in application code.


### Mistake 2


**❌ No CloudWatch alarms for DLQ depth.**


Messages silently pile up in the dead letter queue. You discover it 3 days later when a customer calls.


**✅ Correct:** Create a CloudWatch alarm on `ApproximateNumberOfMessagesVisible` for every DLQ. Threshold: 1 (any message in the DLQ is an alert). Route to SNS → email/Slack.


### Mistake 3


**❌ Deploying CloudFormation stacks without change sets.**


`aws cloudformation update-stack` applies changes immediately with no review. A typo in a resource name could delete your DynamoDB table.


**✅ Correct:** Always use `create-change-set` → `describe-change-set` (review) → `execute-change-set`. In CI, fail the pipeline if the change set includes replacement of stateful resources (DynamoDB, RDS).


### Mistake 4


**❌ Not testing AWS integration in the Go test suite.**


Unit tests mock everything. You discover the SQS message format is wrong when you deploy to staging.


**✅ Correct:** Write integration tests that start Floci in Docker, deploy the real resources, and run end-to-end flows. Use `testcontainers-go` to manage Floci in tests. These tests run in CI via CodeBuild on the Floci container.

