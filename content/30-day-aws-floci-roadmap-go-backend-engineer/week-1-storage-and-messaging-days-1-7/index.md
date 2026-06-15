---
source: notion
title: "Week 1 — Storage & Messaging (Days 1–7)"
slug: "week-1-storage-and-messaging-days-1-7"
notionId: "36bda883-bddd-81f1-b2db-d5ffdfafc955"
notionRootId: "36bda883bddd817a96b3ccec274f3003"
parent: "30-day-aws-floci-roadmap-go-backend-engineer"
children: []
order: 3
icon: "🗃️"
cover: null
---
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

