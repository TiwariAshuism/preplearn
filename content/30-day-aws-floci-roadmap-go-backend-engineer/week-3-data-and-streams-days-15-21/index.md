---
source: notion
title: "Week 3 — Data & Streams (Days 15–21)"
slug: "week-3-data-and-streams-days-15-21"
notionId: "36bda883-bddd-8198-b214-c6bfeff9f629"
notionRootId: "36bda883bddd817a96b3ccec274f3003"
parent: "30-day-aws-floci-roadmap-go-backend-engineer"
children: []
order: 1
icon: "📊"
cover: null
---
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

