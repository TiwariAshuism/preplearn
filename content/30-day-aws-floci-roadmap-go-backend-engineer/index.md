---
source: notion
title: "☁️ 30-Day AWS + Floci Roadmap — Go Backend Engineer"
slug: "30-day-aws-floci-roadmap-go-backend-engineer"
notionId: "36bda883bddd817a96b3ccec274f3003"
notionRootId: "36bda883bddd817a96b3ccec274f3003"
parent: null
children: ["week-4-infrastructure-and-production-days-22-30","week-3-data-and-streams-days-15-21","week-2-compute-and-apis-days-8-14","week-1-storage-and-messaging-days-1-7"]
order: 7
icon: "☁️"
cover: null
---
> ☁️ **Learn every major AWS service hands-on using Floci — a free, zero-auth local AWS emulator.** No cloud bills. No credential setup. Real AWS SDK calls. Aligned with your Go backend stack.

---


## 📌 What is Floci?


**Floci** (`floci.io`) is a drop-in replacement for LocalStack — but MIT licensed, no auth token, starts in 24ms, uses 13 MiB idle memory. Every AWS service call you make in this roadmap runs **locally on your machine** against a real emulator.


```bash
# One command. All 45 AWS services on :4566
docker run --rm -p 4566:4566 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  floci/floci:latest

# Point your AWS CLI + Go SDK at Floci
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_DEFAULT_REGION=us-east-1
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
```


---


## 🗺️ 30-Day Plan at a glance


| Week                                 | Days  | AWS Focus                                                               | Go Backend Integration                          |
| ------------------------------------ | ----- | ----------------------------------------------------------------------- | ----------------------------------------------- |
| Week 1 — Storage & Messaging         | 1–7   | S3, SQS, SNS, DynamoDB, IAM                                             | File uploads, job queues, event fanout          |
| Week 2 — Compute & APIs              | 8–14  | Lambda, API Gateway, ECS, ECR                                           | Serverless Go functions, containerised services |
| Week 3 — Data & Streams              | 15–21 | RDS, ElastiCache, Kinesis, MSK                                          | Postgres + Redis + Kafka on AWS                 |
| Week 4 — Infrastructure & Production | 22–30 | CloudFormation, EKS, Step Functions, EventBridge, CodeBuild, monitoring | Full production-grade AWS stack                 |


---


## ⚙️ Your Go + Floci dev setup


```yaml
# docker-compose.yml — add this to every project
services:
  floci:
    image: floci/floci:latest
    ports:
      - "4566:4566"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      FLOCI_STORAGE_MODE: hybrid

  app:
    build: .
    environment:
      AWS_ENDPOINT_URL: http://floci:4566
      AWS_DEFAULT_REGION: us-east-1
      AWS_ACCESS_KEY_ID: test
      AWS_SECRET_ACCESS_KEY: test
    depends_on:
      - floci
```


```go
// aws.go — Go SDK v2 client configured for Floci
package aws

import (
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/aws"
    "os"
)

func NewConfig(ctx context.Context) (aws.Config, error) {
    customResolver := aws.EndpointResolverWithOptionsFunc(
        func(service, region string, opts ...interface{}) (aws.Endpoint, error) {
            if endpoint := os.Getenv("AWS_ENDPOINT_URL"); endpoint != "" {
                return aws.Endpoint{
                    URL:               endpoint,
                    HostnameImmutable: true,
                }, nil
            }
            return aws.Endpoint{}, &aws.EndpointNotFoundError{}
        },
    )
    return config.LoadDefaultConfig(ctx,
        config.WithEndpointResolverWithOptions(customResolver),
    )
}
```


---


## 📊 My progress

- Current day: **Day 1 of 30**
- Services mastered: **0 / 20**
- Go projects shipped: **0 / 8**
- Floci running locally: **❌ Not started**

---


## 🔖 Phase pages

- 🗃️ Week 1 — Storage & Messaging (Days 1–7)
- ⚡ Week 2 — Compute & APIs (Days 8–14)
- 📊 Week 3 — Data & Streams (Days 15–21)
- 🏗️ Week 4 — Infrastructure & Production (Days 22–30)

---


## 📘 AWS services covered


| Service             | Week | Floci support     |
| ------------------- | ---- | ----------------- |
| S3                  | 1    | ✅ Full REST XML   |
| SQS                 | 1    | ✅ FIFO + Standard |
| SNS                 | 1    | ✅ Full            |
| DynamoDB + Streams  | 1    | ✅ Full            |
| IAM                 | 1    | ✅ 68+ ops         |
| Lambda              | 2    | ✅ Docker native   |
| API Gateway v1 + v2 | 2    | ✅ WebSocket       |
| ECS                 | 2    | ✅ Real Docker     |
| ECR                 | 2    | ✅ OCI registry    |
| RDS (Postgres)      | 3    | ✅ Real engine     |
| ElastiCache (Redis) | 3    | ✅ Real Redis      |
| Kinesis             | 3    | ✅ Full            |
| MSK (Kafka)         | 3    | ✅ Real Kafka      |
| Secrets Manager     | 3    | ✅ Full            |
| CloudFormation      | 4    | ✅ Stacks          |
| EKS                 | 4    | ✅ Real k3s        |
| Step Functions      | 4    | ✅ ASL             |
| EventBridge         | 4    | ✅ Rules           |
| CodeBuild           | 4    | ✅ Docker native   |
| CloudWatch          | 4    | ✅ Logs + Metrics  |


📅 AWS Daily Tracker


## Week 1 — Storage & Messaging (Days 1–7)
> **Goal:** Master the foundational AWS storage and messaging services using Floci locally. By Day 7, you will have a working Go backend that uploads files to S3, sends jobs to SQS, fans out events via SNS, and stores structured data in DynamoDB — all running locally with zero cloud cost.

---


## 🐳 Start Floci (do this every day)


```bash
docker run -d --name floci \
  -p 4566:4566 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  floci/floci:latest

# Verify it's alive
curl http://localhost:4566/_localstack/health | jq

# Set env vars once per terminal session
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_DEFAULT_REGION=us-east-1
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
```


---


## 📅 Day 1 — S3: Object Storage


### Concepts

- S3 = flat object store. No directories (prefixes simulate them). Infinite scale.
- Buckets: containers for objects. Globally unique names.
- Objects: key + value + metadata. Keys are just strings (can include `/` for path simulation).
- Storage classes: Standard, IA, Glacier. In Floci: all map to local disk.
- Pre-signed URLs: temporary URLs granting access to private objects without credentials.
- Multipart upload: split large files (>100MB) into parts, upload in parallel, combine server-side.
- Events: S3 can trigger SQS/SNS/Lambda on object creation/deletion.

### AWS CLI against Floci


```bash
# Create a bucket
aws s3 mb s3://my-app-uploads

# Upload a file
aws s3 cp ./resume.pdf s3://my-app-uploads/users/ashu/resume.pdf

# List objects
aws s3 ls s3://my-app-uploads/ --recursive

# Download
aws s3 cp s3://my-app-uploads/users/ashu/resume.pdf ./downloaded.pdf

# Delete
aws s3 rm s3://my-app-uploads/users/ashu/resume.pdf

# Set bucket policy (public read)
aws s3api put-bucket-policy --bucket my-app-uploads --policy '{
  "Statement": [{"Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::my-app-uploads/*"}]
}'

# Generate pre-signed URL (expires in 1 hour)
aws s3 presign s3://my-app-uploads/users/ashu/resume.pdf --expires-in 3600
```


### Go implementation


```go
// pkg/storage/s3.go
package storage

import (
    "context"
    "io"
    "time"

    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/service/s3"
    "github.com/aws/aws-sdk-go-v2/service/s3/types"
)

type S3Store struct {
    client *s3.Client
    bucket string
}

func NewS3Store(cfg aws.Config, bucket string) *S3Store {
    return &S3Store{
        client: s3.NewFromConfig(cfg),
        bucket: bucket,
    }
}

func (s *S3Store) Upload(ctx context.Context, key string, body io.Reader, contentType string) error {
    _, err := s.client.PutObject(ctx, &s3.PutObjectInput{
        Bucket:      aws.String(s.bucket),
        Key:         aws.String(key),
        Body:        body,
        ContentType: aws.String(contentType),
    })
    return err
}

func (s *S3Store) Download(ctx context.Context, key string) (io.ReadCloser, error) {
    out, err := s.client.GetObject(ctx, &s3.GetObjectInput{
        Bucket: aws.String(s.bucket),
        Key:    aws.String(key),
    })
    if err != nil {
        return nil, err
    }
    return out.Body, nil
}

func (s *S3Store) PresignedURL(ctx context.Context, key string, ttl time.Duration) (string, error) {
    presigner := s3.NewPresignClient(s.client)
    req, err := presigner.PresignGetObject(ctx, &s3.GetObjectInput{
        Bucket: aws.String(s.bucket),
        Key:    aws.String(key),
    }, s3.WithPresignExpires(ttl))
    if err != nil {
        return "", err
    }
    return req.URL, nil
}

func (s *S3Store) Delete(ctx context.Context, key string) error {
    _, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
        Bucket: aws.String(s.bucket),
        Key:    aws.String(key),
    })
    return err
}
```


---


## 📅 Day 2 — SQS: Message Queues


### Concepts

- SQS = managed message queue. Decouples producers from consumers.
- Standard queue: at-least-once delivery, best-effort ordering, unlimited TPS.
- FIFO queue: exactly-once processing, strict order, 3,000 TPS with batching. Suffix: `.fifo`
- Visibility timeout: when a message is received, it becomes invisible for N seconds. If not deleted, it reappears.
- Dead letter queue (DLQ): messages that fail N times go here for inspection.
- Long polling: `WaitTimeSeconds=20` holds the connection up to 20s waiting for messages. Much more efficient than polling every second.
- Message attributes: metadata attached to messages (string, number, binary).

### AWS CLI against Floci


```bash
# Create standard queue
aws sqs create-queue --queue-name job-queue

# Create FIFO queue
aws sqs create-queue --queue-name order-queue.fifo \
  --attributes FifoQueue=true,ContentBasedDeduplication=true

# Send a message
aws sqs send-message \
  --queue-url http://localhost:4566/000000000000/job-queue \
  --message-body '{"userId":"123","action":"resize-image","key":"uploads/img.jpg"}'

# Receive messages (long poll)
aws sqs receive-message \
  --queue-url http://localhost:4566/000000000000/job-queue \
  --wait-time-seconds 10 \
  --max-number-of-messages 10

# Delete a message after processing
aws sqs delete-message \
  --queue-url http://localhost:4566/000000000000/job-queue \
  --receipt-handle "RECEIPT_HANDLE_FROM_RECEIVE"

# Create DLQ + attach to main queue
DLQ_ARN=$(aws sqs get-queue-attributes \
  --queue-url http://localhost:4566/000000000000/job-dlq \
  --attribute-names QueueArn \
  --query Attributes.QueueArn --output text)

aws sqs set-queue-attributes \
  --queue-url http://localhost:4566/000000000000/job-queue \
  --attributes "{\"RedrivePolicy\":\"{\\\"deadLetterTargetArn\\\":\\\"$DLQ_ARN\\\",\\\"maxReceiveCount\\\":\\\"3\\\"}\"}"
```


### Go worker pattern


```go
// pkg/worker/sqs_worker.go
package worker

import (
    "context"
    "encoding/json"
    "log/slog"

    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/service/sqs"
    "github.com/aws/aws-sdk-go-v2/service/sqs/types"
)

type JobPayload struct {
    UserID string `json:"userId"`
    Action string `json:"action"`
    Key    string `json:"key"`
}

type SQSWorker struct {
    client   *sqs.Client
    queueURL string
    handler  func(ctx context.Context, job JobPayload) error
}

func (w *SQSWorker) Start(ctx context.Context) {
    slog.Info("SQS worker started", "queue", w.queueURL)
    for {
        select {
        case <-ctx.Done():
            return
        default:
            w.poll(ctx)
        }
    }
}

func (w *SQSWorker) poll(ctx context.Context) {
    out, err := w.client.ReceiveMessage(ctx, &sqs.ReceiveMessageInput{
        QueueUrl:            aws.String(w.queueURL),
        WaitTimeSeconds:     20,   // long polling
        MaxNumberOfMessages: 10,
        MessageAttributeNames: []string{"All"},
    })
    if err != nil {
        slog.Error("receive failed", "err", err)
        return
    }

    for _, msg := range out.Messages {
        var job JobPayload
        if err := json.Unmarshal([]byte(aws.ToString(msg.Body)), &job); err != nil {
            slog.Error("unmarshal failed", "err", err)
            continue
        }

        if err := w.handler(ctx, job); err != nil {
            slog.Error("handler failed", "err", err, "job", job)
            continue  // message returns to queue after visibility timeout
        }

        // delete ONLY on success
        w.client.DeleteMessage(ctx, &sqs.DeleteMessageInput{
            QueueUrl:      aws.String(w.queueURL),
            ReceiptHandle: msg.ReceiptHandle,
        })
    }
}
```


---


## 📅 Day 3 — SNS: Pub/Sub Fan-out


### Concepts

- SNS = managed pub/sub. One topic → many subscribers.
- Publishers push to a topic. Subscribers receive from the topic.
- Subscriber types: SQS queues, Lambda functions, HTTP/S endpoints, email, SMS.
- Fan-out pattern: one SNS topic → multiple SQS queues (each service gets its own queue).
- Message filtering: subscribers can filter messages by attributes (only receive relevant messages).
- FIFO topics: ordered delivery to FIFO SQS queues.

### Fan-out pattern (critical backend pattern)


```bash
# Create topic
TOPIC_ARN=$(aws sns create-topic --name order-events --query TopicArn --output text)

# Create per-service queues
aws sqs create-queue --queue-name inventory-queue
aws sqs create-queue --queue-name notification-queue
aws sqs create-queue --queue-name analytics-queue

# Subscribe each queue to the topic
INV_ARN=$(aws sqs get-queue-attributes \
  --queue-url http://localhost:4566/000000000000/inventory-queue \
  --attribute-names QueueArn --query Attributes.QueueArn --output text)

aws sns subscribe \
  --topic-arn $TOPIC_ARN \
  --protocol sqs \
  --notification-endpoint $INV_ARN

# Publish an event — ALL queues receive it
aws sns publish \
  --topic-arn $TOPIC_ARN \
  --message '{"orderId":"ORD-001","userId":"usr-123","total":299.99}' \
  --message-attributes '{"eventType":{"DataType":"String","StringValue":"order.placed"}}'
```


### Go SNS publisher


```go
// pkg/events/publisher.go
package events

import (
    "context"
    "encoding/json"

    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/service/sns"
    "github.com/aws/aws-sdk-go-v2/service/sns/types"
)

type Publisher struct {
    client   *sns.Client
    topicARN string
}

func (p *Publisher) Publish(ctx context.Context, eventType string, payload interface{}) error {
    body, err := json.Marshal(payload)
    if err != nil {
        return err
    }
    _, err = p.client.Publish(ctx, &sns.PublishInput{
        TopicArn: aws.String(p.topicARN),
        Message:  aws.String(string(body)),
        MessageAttributes: map[string]types.MessageAttributeValue{
            "eventType": {
                DataType:    aws.String("String"),
                StringValue: aws.String(eventType),
            },
        },
    })
    return err
}
```


---


## 📅 Day 4–5 — DynamoDB: NoSQL at Scale


### Concepts

- DynamoDB = key-value + document NoSQL. Single-digit millisecond at any scale.
- Primary key: partition key (required) + sort key (optional). Together they uniquely identify an item.
- GSI (Global Secondary Index): alternate access pattern. Different PK/SK.
- LSI (Local Secondary Index): same PK, different SK. Must be created at table creation.
- Streams: capture item-level changes (insert/update/delete) in real-time. Used to trigger Lambda.
- Capacity modes: on-demand (pay per request) vs provisioned (set RCU/WCU).
- Single-table design: all entities in one table, distinguished by PK/SK patterns.

### AWS CLI against Floci


```bash
# Create table with composite key
aws dynamodb create-table \
  --table-name orders \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=orderId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=orderId,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes '[
    {
      "IndexName":"createdAt-index",
      "KeySchema":[{"AttributeName":"createdAt","KeyType":"HASH"}],
      "Projection":{"ProjectionType":"ALL"}
    }
  ]'

# Put item
aws dynamodb put-item --table-name orders --item '{
  "userId": {"S": "usr-123"},
  "orderId": {"S": "ord-001"},
  "total": {"N": "299.99"},
  "status": {"S": "pending"},
  "createdAt": {"S": "2026-05-25T10:00:00Z"}
}'

# Get item
aws dynamodb get-item --table-name orders \
  --key '{"userId":{"S":"usr-123"},"orderId":{"S":"ord-001"}}'

# Query all orders for a user
aws dynamodb query --table-name orders \
  --key-condition-expression 'userId = :uid' \
  --expression-attribute-values '{":uid":{"S":"usr-123"}}'

# Update item
aws dynamodb update-item --table-name orders \
  --key '{"userId":{"S":"usr-123"},"orderId":{"S":"ord-001"}}' \
  --update-expression 'SET #s = :status' \
  --expression-attribute-names '{"#s":"status"}' \
  --expression-attribute-values '{":status":{"S":"shipped"}}'
```


### Go DynamoDB repository


```go
// pkg/repository/order_dynamo.go
package repository

import (
    "context"
    
    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
    "github.com/aws/aws-sdk-go-v2/service/dynamodb"
    "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type Order struct {
    UserID    string  `dynamodbav:"userId"`
    OrderID   string  `dynamodbav:"orderId"`
    Total     float64 `dynamodbav:"total"`
    Status    string  `dynamodbav:"status"`
    CreatedAt string  `dynamodbav:"createdAt"`
}

type DynamoOrderRepo struct {
    client *dynamodb.Client
    table  string
}

func (r *DynamoOrderRepo) Save(ctx context.Context, order Order) error {
    item, err := attributevalue.MarshalMap(order)
    if err != nil {
        return err
    }
    _, err = r.client.PutItem(ctx, &dynamodb.PutItemInput{
        TableName: aws.String(r.table),
        Item:      item,
    })
    return err
}

func (r *DynamoOrderRepo) GetByUser(ctx context.Context, userID string) ([]Order, error) {
    out, err := r.client.Query(ctx, &dynamodb.QueryInput{
        TableName:              aws.String(r.table),
        KeyConditionExpression: aws.String("userId = :uid"),
        ExpressionAttributeValues: map[string]types.AttributeValue{
            ":uid": &types.AttributeValueMemberS{Value: userID},
        },
    })
    if err != nil {
        return nil, err
    }
    var orders []Order
    return orders, attributevalue.UnmarshalListOfMaps(out.Items, &orders)
}
```


---


## 📅 Day 6 — IAM: Identity and Access Management


### Concepts

- IAM = who can do what to which resource.
- Principals: users, roles, service accounts (in AWS: roles are the standard for services)
- Policies: JSON documents defining Allow/Deny on Actions for Resources.
- Roles: assumed by services (EC2, Lambda, ECS) or users from other accounts. No long-lived keys.
- Policy types: identity-based (attached to principal), resource-based (attached to resource, e.g., S3 bucket policy).
- Least privilege: grant only the permissions required. Nothing more.

### AWS CLI against Floci


```bash
# Create a role for a Lambda function
aws iam create-role \
  --role-name lambda-execution-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach a policy to the role
aws iam put-role-policy \
  --role-name lambda-execution-role \
  --policy-name s3-read-orders \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::my-app-uploads",
        "arn:aws:s3:::my-app-uploads/*"
      ]
    }]
  }'

# Get caller identity (see who you are)
aws sts get-caller-identity
```


---


## 📅 Day 7 — Week 1 Project: File Upload Service


### Project: Production-grade file upload API in Go


**What you’ll build:** A complete Go HTTP service that handles file uploads to S3, queues processing jobs via SQS, and publishes events via SNS.


**Architecture:**


```javascript
Client → POST /upload → Go HTTP server
                           ├── Upload file → S3 (Floci)
                           ├── Queue job → SQS (Floci)
                           └── Publish event → SNS → [SQS queues]

SQS Worker → Poll SQS → Process job (resize/validate)
                        └── Update metadata → DynamoDB
```


**Deliverable:**

- `POST /upload` — multipart file upload, stores in S3, queues SQS job, returns pre-signed URL
- `GET /files/{userId}` — queries DynamoDB for all files
- `GET /files/{userId}/{fileId}/url` — generates pre-signed S3 URL
- SQS worker that processes jobs and updates DynamoDB status
- `docker-compose.yml` with Floci + the Go service
- All AWS calls go through Floci, zero real AWS credentials needed

**Key patterns demonstrated:**

- Hexagonal architecture: `storage.FileStore` interface, `S3FileStore` implementation
- Graceful shutdown with `context.WithCancel`
- Worker goroutine with bounded concurrency (`semaphore`)
- Structured logging with `log/slog`

---


## ⚠️ Common mistakes this week


### Mistake 1


**❌ Deleting SQS messages before processing succeeds.**


If you delete the message immediately on receive and your handler panics, the message is lost permanently.


**✅ Correct:** Delete the message ONLY after your handler returns `nil`. If the handler errors, let the message expire from the visibility timeout — it will reappear for retry. After `maxReceiveCount` failures, it moves to the DLQ.


### Mistake 2


**❌ Using DynamoDB scan instead of query.**


`Scan` reads every item in the table. On a table with 10M items, this costs millions of read units and takes minutes. Use `Query` with your partition key.


**✅ Correct:** Design your access patterns first. Every query must be satisfiable via a partition key + optional sort key condition. If you need a new access pattern, add a GSI.


### Mistake 3


**❌ Not setting S3 bucket policies and assuming the bucket is private.**


By default Floci (and AWS) buckets are private. But if you ever accidentally set `--acl public-read` on a bucket, all objects become public. In production, Block Public Access settings should be enabled at account level.


**✅ Correct:** Use pre-signed URLs for private object access. Never make buckets public unless you specifically need a CDN pattern.


## Week 2 — Compute & APIs (Days 8–14)
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


## Week 3 — Data & Streams (Days 15–21)
> **Goal:** Connect your Go backend to managed PostgreSQL (RDS), Redis (ElastiCache), real Kafka (MSK), and Kinesis data streams — all locally via Floci with real database engines running in Docker.

---


## 📅 Day 15–16 — RDS: Managed PostgreSQL


### Concepts

- RDS = managed relational database. AWS handles: backups, patching, failover, replication.
- Floci RDS: spins up a **real PostgreSQL container** in Docker. 100% JDBC wire fidelity. 50/50 SDK tests pass.
- Parameter groups: database configuration (max_connections, shared_buffers, etc.)
- Subnet groups: which VPC subnets RDS can use (in Floci, this is abstracted away)
- IAM database authentication: auth via IAM token instead of password (no long-lived DB credentials)
- Automated backups: point-in-time recovery up to 35 days.
- Read replicas: horizontal read scaling.

### Create RDS PostgreSQL via Floci


```bash
# Create a DB subnet group (required by API, Floci accepts any value)
aws rds create-db-subnet-group \
  --db-subnet-group-name default \
  --db-subnet-group-description "default" \
  --subnet-ids subnet-00000001

# Create a PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier my-postgres \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username admin \
  --master-user-password secret123 \
  --db-name appdb \
  --allocated-storage 20 \
  --no-multi-az

# Wait for it to be available
aws rds wait db-instance-available \
  --db-instance-identifier my-postgres

# Get the endpoint
ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier my-postgres \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

PORT=$(aws rds describe-db-instances \
  --db-instance-identifier my-postgres \
  --query 'DBInstances[0].Endpoint.Port' \
  --output text)

echo "Connect to: $ENDPOINT:$PORT"

# Connect directly with psql
psql -h $ENDPOINT -p $PORT -U admin -d appdb
```


### Go + PostgreSQL (pgx driver)


```go
// pkg/database/postgres.go
package database

import (
    "context"
    "fmt"

    "github.com/jackc/pgx/v5/pgxpool"
)

type PostgresConfig struct {
    Host     string
    Port     int
    User     string
    Password string
    DBName   string
    MaxConns int32
}

func NewPostgresPool(ctx context.Context, cfg PostgresConfig) (*pgxpool.Pool, error) {
    dsn := fmt.Sprintf(
        "postgresql://%s:%s@%s:%d/%s?sslmode=disable&pool_max_conns=%d",
        cfg.User, cfg.Password, cfg.Host, cfg.Port, cfg.DBName, cfg.MaxConns,
    )
    config, err := pgxpool.ParseConfig(dsn)
    if err != nil {
        return nil, err
    }
    config.MaxConns = cfg.MaxConns
    return pgxpool.NewWithConfig(ctx, config)
}
```


### Database migrations with golang-migrate


```go
// migrations/000001_create_orders.up.sql
CREATE TABLE orders (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     TEXT NOT NULL,
    total       DECIMAL(12,2) NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
```


```bash
# Run migrations
migrate -path ./migrations \
  -database "postgresql://admin:secret123@$ENDPOINT:$PORT/appdb?sslmode=disable" \
  up
```


### RDS Snapshots and restore


```bash
# Create a manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier my-postgres \
  --db-snapshot-identifier my-postgres-snap-1

# Restore from snapshot to a new instance
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier my-postgres-restored \
  --db-snapshot-identifier my-postgres-snap-1
```


---


## 📅 Day 17–18 — ElastiCache: Managed Redis


### Concepts

- ElastiCache = managed Redis (or Memcached). Floci uses a **real Redis container**.
- Use cases: session storage, rate limiting, caching DB results, pub/sub, leaderboards.
- Cluster mode: shard data across multiple nodes. More memory, more throughput.
- IAM authentication: Floci supports SigV4 auth for ElastiCache — exclusive to Floci vs LocalStack Community.
- Eviction policies: LRU for caches, noeviction for session stores.

### Create ElastiCache Redis via Floci


```bash
# Create a replication group (this starts a real Redis container)
aws elasticache create-replication-group \
  --replication-group-id my-redis \
  --description "dev redis" \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-clusters 1

# Wait for it
aws elasticache wait replication-group-available \
  --replication-group-id my-redis

# Get the endpoint
aws elasticache describe-replication-groups \
  --replication-group-id my-redis \
  --query 'ReplicationGroups[0].NodeGroups[0].PrimaryEndpoint'
```


### Go Redis client patterns


```go
// pkg/cache/redis.go
package cache

import (
    "context"
    "encoding/json"
    "time"

    "github.com/redis/go-redis/v9"
)

type RedisCache struct {
    client *redis.Client
}

func NewRedisCache(addr string) *RedisCache {
    return &RedisCache{
        client: redis.NewClient(&redis.Options{
            Addr:     addr,
            Password: "",
            DB:       0,
        }),
    }
}

// Generic typed cache methods
func Set[T any](ctx context.Context, c *RedisCache, key string, value T, ttl time.Duration) error {
    data, err := json.Marshal(value)
    if err != nil {
        return err
    }
    return c.client.Set(ctx, key, data, ttl).Err()
}

func Get[T any](ctx context.Context, c *RedisCache, key string) (T, bool, error) {
    var zero T
    data, err := c.client.Get(ctx, key).Bytes()
    if err == redis.Nil {
        return zero, false, nil
    }
    if err != nil {
        return zero, false, err
    }
    var value T
    return value, true, json.Unmarshal(data, &value)
}

// Rate limiter using Redis INCR + EXPIRE
func (c *RedisCache) RateLimit(ctx context.Context, key string, limit int, window time.Duration) (bool, error) {
    pipe := c.client.Pipeline()
    incr := pipe.Incr(ctx, key)
    pipe.Expire(ctx, key, window)
    _, err := pipe.Exec(ctx)
    if err != nil {
        return false, err
    }
    return incr.Val() <= int64(limit), nil
}

// Session storage
func (c *RedisCache) SetSession(ctx context.Context, sessionID string, data map[string]interface{}, ttl time.Duration) error {
    return c.client.HSet(ctx, "session:"+sessionID, data).Err()
}
```


### Cache-aside pattern with PostgreSQL


```go
// pkg/service/order_service.go — cache-aside
func (s *OrderService) GetOrder(ctx context.Context, orderID string) (*Order, error) {
    cacheKey := "order:" + orderID

    // 1. Try cache first
    if order, found, _ := cache.Get[Order](ctx, s.cache, cacheKey); found {
        return &order, nil
    }

    // 2. Cache miss — fetch from DB
    order, err := s.repo.GetByID(ctx, orderID)
    if err != nil {
        return nil, err
    }

    // 3. Populate cache
    cache.Set(ctx, s.cache, cacheKey, order, 5*time.Minute)

    return order, nil
}
```


---


## 📅 Day 19–20 — MSK: Managed Kafka


### Concepts

- MSK = Managed Streaming for Kafka. Floci uses **real Kafka via Redpanda** container.
- Topics: append-only logs. Partitioned for parallelism. Retained by time or size.
- Consumer groups: each group reads a topic independently. Load-balanced across partitions.
- Offsets: position in the log. Consumers commit offsets to track progress.
- Exactly-once: transactional producer + idempotent consumer.

### MSK cluster via Floci


```bash
# Create MSK cluster (Floci starts real Redpanda/Kafka)
CLUSTER_ARN=$(aws kafka create-cluster \
  --cluster-name dev-kafka \
  --kafka-version "3.5.1" \
  --number-of-broker-nodes 1 \
  --broker-node-group-info '{
    "instanceType":"kafka.t3.small",
    "clientSubnets":["subnet-00000001"]
  }' \
  --query ClusterArn --output text)

# Wait for cluster to be active
aws kafka wait cluster-active --cluster-arn $CLUSTER_ARN

# Get bootstrap brokers
BROKERS=$(aws kafka get-bootstrap-brokers \
  --cluster-arn $CLUSTER_ARN \
  --query BootstrapBrokerString --output text)

echo "Kafka brokers: $BROKERS"
```


### Go Kafka producer + consumer (sarama library)


```go
// pkg/streaming/kafka_producer.go
package streaming

import (
    "context"
    "encoding/json"

    "github.com/IBM/sarama"
)

type KafkaProducer struct {
    producer sarama.SyncProducer
    topic    string
}

func NewKafkaProducer(brokers []string, topic string) (*KafkaProducer, error) {
    cfg := sarama.NewConfig()
    cfg.Producer.RequiredAcks = sarama.WaitForAll  // all replicas must ack
    cfg.Producer.Retry.Max = 5
    cfg.Producer.Return.Successes = true
    cfg.Producer.Idempotent = true
    cfg.Net.MaxOpenRequests = 1

    producer, err := sarama.NewSyncProducer(brokers, cfg)
    return &KafkaProducer{producer: producer, topic: topic}, err
}

func (p *KafkaProducer) Publish(ctx context.Context, key string, payload interface{}) error {
    data, err := json.Marshal(payload)
    if err != nil {
        return err
    }
    _, _, err = p.producer.SendMessage(&sarama.ProducerMessage{
        Topic: p.topic,
        Key:   sarama.StringEncoder(key),
        Value: sarama.ByteEncoder(data),
    })
    return err
}

// pkg/streaming/kafka_consumer.go
type KafkaConsumer struct {
    group   sarama.ConsumerGroup
    topics  []string
    handler sarama.ConsumerGroupHandler
}

func (c *KafkaConsumer) Start(ctx context.Context) error {
    for {
        if err := c.group.Consume(ctx, c.topics, c.handler); err != nil {
            return err
        }
        if ctx.Err() != nil {
            return nil
        }
    }
}

// Implement ConsumerGroupHandler:
type OrderEventHandler struct{}

func (h *OrderEventHandler) ConsumeClaim(sess sarama.ConsumerGroupSession, claim sarama.ConsumerGroupClaim) error {
    for msg := range claim.Messages() {
        var event OrderEvent
        json.Unmarshal(msg.Value, &event)
        // process...
        sess.MarkMessage(msg, "")  // commit offset
    }
    return nil
}
```


---


## 📅 Day 21 — Week 3 Project: Event-Driven Order System


### Project: Full event-driven backend with real databases


**Architecture:**


```javascript
API (Go/ECS)
  └── POST /orders → Write to RDS PostgreSQL
                    └── Publish to MSK (Kafka topic: orders)

Inventory Service (Go/Lambda)
  └── Kafka consumer: orders topic
       └── Update inventory in DynamoDB

Notification Service (Go/Lambda)
  └── SQS consumer (SNS fan-out)
       └── Template → SES email

Cache Layer
  └── ElastiCache Redis — session store + order cache

Secrets
  └── All DB credentials via Secrets Manager
```


**Deliverable:**

- Full docker-compose with: Floci, Go API, Go workers
- RDS PostgreSQL for order storage with migrations
- MSK Kafka for event streaming between services
- ElastiCache Redis for session storage and rate limiting
- Secrets Manager for all credentials
- Health check endpoint showing all dependency status

---


## ⚠️ Common mistakes this week


### Mistake 1


**❌ Opening a new DB connection for every request.**


Every `pgx.Connect()` call makes a TCP handshake + TLS + authentication round-trip. At 100 RPS, this creates 100 connections per second.


**✅ Correct:** Use `pgxpool.Pool` with appropriate `MaxConns` (typically `(CPU cores * 2) + disk spindles`). Create the pool once at startup. All request handlers share the pool.


### Mistake 2


**❌ Caching everything without a TTL.**


A Redis key with no expiry accumulates indefinitely. User data that changes (profile, balance) returns stale values forever.


**✅ Correct:** Every cache entry must have a TTL appropriate to its staleness tolerance. User sessions: 24h. Order status: 30s. Frequently changing data: 5-10s or skip caching.


## Week 4 — Infrastructure & Production (Days 22–30)
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

