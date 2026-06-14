# 07 — Data Pipelines & Stream Processing (50M Users)

> **Scenario:** 50M users se data aa raha hai — events, clicks, orders, logs. Real-time analytics chahiye, search index sync chahiye, data warehouse mein historical data chahiye. Sab kaise handle karein?

---

## CDC — Change Data Capture

### Problem

```
Order placed → write to PostgreSQL ✅
But yeh data chahiye:
  - Elasticsearch mein (search ke liye)
  - Analytics warehouse mein (reporting ke liye)
  - Cache invalidation (Redis update)
  - Notification service ko (email/push)

Approach 1: Dual writes (application writes to both DB + Kafka)
  ❌ Inconsistent: DB write succeeds, Kafka write fails → data mismatch
  ❌ Distributed transaction needed (2PC = slow + complex)

Approach 2: CDC — database ke changes automatically capture karo
  ✅ Single source of truth: DB
  ✅ No application code changes
  ✅ Guaranteed delivery (reads DB WAL/binlog)
```

### Debezium — CDC Platform

```
┌──────────────┐     WAL/Binlog     ┌───────────┐     Events      ┌─────────┐
│  PostgreSQL  │────────────────────►│ Debezium  │────────────────►│  Kafka  │
│  (source)    │                     │ Connector │                 │         │
└──────────────┘                     └───────────┘                 └────┬────┘
                                                                        │
                    ┌───────────────────────────────────────────────────┘
                    │
         ┌──────────▼─────┐  ┌──────────▼──────┐  ┌──────────▼──────┐
         │ Elasticsearch  │  │  Data Warehouse  │  │  Cache Update   │
         │ (search index) │  │  (analytics)     │  │  (Redis)        │
         └────────────────┘  └─────────────────┘  └─────────────────┘

Debezium reads PostgreSQL WAL (Write-Ahead Log):
  - Every INSERT, UPDATE, DELETE captured
  - Before + After image of row
  - Transaction boundary preserved
  - No polling, no application changes
```

### Debezium Event Format

```json
{
    "before": {"id": 1, "status": "pending", "amount": 5000},
    "after":  {"id": 1, "status": "paid", "amount": 5000},
    "source": {
        "connector": "postgresql",
        "db": "orders",
        "table": "orders",
        "txId": 12345,
        "lsn": 123456789
    },
    "op": "u",      // c=create, u=update, d=delete, r=read(snapshot)
    "ts_ms": 1689840000000
}
```

### Outbox Pattern (Application-level CDC)

```
Problem: Domain events (OrderPlaced, PaymentCompleted) DB mein nahi hote.
CDC sirf row changes capture karta hai, business events nahi.

Solution: Outbox table

  BEGIN TRANSACTION;
    INSERT INTO orders (id, user_id, amount) VALUES (...);
    INSERT INTO outbox (id, aggregate_type, event_type, payload) VALUES (
        uuid, 'Order', 'OrderPlaced', '{"order_id": 123, "amount": 5000}'
    );
  COMMIT;

Debezium reads outbox table → publishes to Kafka → deletes from outbox.
Single transaction = consistency guaranteed.
```

---

## Stream Processing

### Batch vs Stream

```
Batch processing:
  "Raat ko 2 baje saara data process karo"
  Tools: Hadoop MapReduce, Spark batch
  Latency: hours
  Use case: daily reports, ML model training

Stream processing:
  "Data aate hi process karo"
  Tools: Kafka Streams, Apache Flink, Spark Streaming
  Latency: milliseconds to seconds
  Use case: fraud detection, real-time dashboards, alerting
  
50M users pe dono chahiye:
  Stream: real-time fraud detection, live dashboards
  Batch: daily analytics, data warehouse loading, ML training
```

### Kafka Streams — Lightweight Stream Processing

```
Kafka Streams = library (not a cluster). 
Your Go/Java app ke andar chalta hai. No separate infra.

Use cases:
  - Event enrichment (order event + user data merge)
  - Filtering (sirf high-value orders forward karo)
  - Aggregation (orders per minute count)
  - Joins (order stream + payment stream join)
```

### Apache Flink — Heavy Stream Processing

```
Flink = distributed stream processing engine.
Separate cluster. Handles complex event processing.

Features:
  - Exactly-once semantics
  - Event time processing (handle late/out-of-order events)
  - Windowing (tumbling, sliding, session windows)
  - State management (large state, checkpointing)
  - SQL interface for stream queries

Use cases at scale:
  - Real-time fraud detection (pattern matching across events)
  - Real-time recommendations (user activity stream → ML model)
  - ETL: CDC events → transform → load into data warehouse
  - Real-time analytics dashboards
```

### Windowing Concepts

```
Tumbling Window (fixed, non-overlapping):
  |----5min----|----5min----|----5min----|
  Count orders in each 5-minute window.
  
Sliding Window (overlapping):
  |----5min----|
       |----5min----|
            |----5min----|
  "Orders in last 5 minutes" — updates every minute.

Session Window (gap-based):
  User activity: |--click--click--click--|    30min gap    |--click--click--|
                 |------Session 1--------|                  |--Session 2----|
  Dynamic window based on activity gaps.

Late Events:
  Event happened at 10:01 but arrived at 10:05 (network delay).
  Watermark: "I believe all events up to 10:03 have arrived"
  Event at 10:01 arrives at 10:05 → still within allowed lateness → process it.
  Allowed lateness = tradeoff between completeness and latency.
```

---

## Data Lake vs Data Warehouse

```
Data Warehouse:
  - Structured data only (schema-on-write)
  - Optimized for SQL queries and analytics
  - Cleaned, transformed data
  - Tools: Snowflake, BigQuery, Redshift
  - Use: Business reporting, dashboards
  - Cost: $$$ (compute + storage coupled)

Data Lake:
  - Any data format (schema-on-read)
  - Raw, unprocessed data stored cheaply
  - JSON, Parquet, Avro, logs, images
  - Tools: S3 + Athena, Delta Lake, Iceberg
  - Use: ML training, ad-hoc exploration
  - Cost: $ (cheap object storage)

Modern: Lakehouse (Delta Lake, Apache Iceberg)
  - Data Lake storage (S3, cheap)
  - Warehouse features (ACID, schema evolution, time travel)
  - Best of both worlds
  - Tools: Databricks, Apache Iceberg + Trino
```

---

## ETL vs ELT

```
ETL (Extract → Transform → Load):
  Source DB → Transform (clean, aggregate) → Load into Warehouse
  Transform BEFORE loading.
  Traditional approach. Transform logic in ETL tool (Informatica, Talend).
  
ELT (Extract → Load → Transform):
  Source DB → Load raw into Warehouse → Transform inside Warehouse
  Transform AFTER loading.
  Modern approach. Warehouse handles compute (BigQuery, Snowflake are powerful).
  Tools: dbt (transforms in SQL inside warehouse)

50M users:
  Use ELT with dbt:
    1. CDC → Kafka → raw data into warehouse (EL)
    2. dbt transforms raw → clean → aggregated tables (T)
    3. BI tools (Metabase, Looker) query clean tables
```

---

## Schema Registry — Schema Evolution

### Problem

```
Producer publishes Kafka event: {"user_id": "123", "name": "Ashutosh"}
Consumer expects: {"userId": "123", "name": "Ashutosh", "email": "..."}

Schema mismatch! Consumer crashes or processes garbage data.
50 services, all evolving → schema chaos.
```

### Confluent Schema Registry

```
┌──────────┐    Register schema v1    ┌─────────────────┐
│ Producer │─────────────────────────►│ Schema Registry  │
│          │    Serialize with v1     │                  │
│          │────────────────────────►│  Stores:          │
└──────────┘    Kafka                │  v1: {user_id,   │
                                      │       name}      │
                                      │  v2: {user_id,   │
┌──────────┐    Get schema v1        │       name,      │
│ Consumer │◄────────────────────────│       email}     │
│          │    Deserialize with v1  └─────────────────┘
└──────────┘

Compatibility modes:
  BACKWARD:  New schema can read old data (add optional fields)
  FORWARD:   Old schema can read new data (remove optional fields)
  FULL:      Both directions (safest)
  
  Production recommendation: BACKWARD compatible
  → Always ADD optional fields, never remove or rename required fields
```

### Avro for Schema Evolution

```json
// Schema v1
{
    "type": "record",
    "name": "UserEvent",
    "fields": [
        {"name": "user_id", "type": "string"},
        {"name": "name", "type": "string"}
    ]
}

// Schema v2 (backward compatible — new field has default)
{
    "type": "record",
    "name": "UserEvent",
    "fields": [
        {"name": "user_id", "type": "string"},
        {"name": "name", "type": "string"},
        {"name": "email", "type": ["null", "string"], "default": null}
    ]
}
// v2 consumer reading v1 data → email = null (default). No crash.
```

---

## Materialized Views (CQRS Read Models)

```
Problem: Complex queries on normalized DB = slow joins at 50M users.

Solution: Pre-compute read-optimized views from event stream.

Event Stream (Kafka):
  OrderPlaced → OrderPaid → OrderShipped → OrderDelivered

Materialized View (read-optimized):
  ┌──────────────────────────────────────────────┐
  │ user_orders_view                              │
  │ user_id | total_orders | total_spent | status │
  │ u123    | 45           | ₹125000    | active  │
  └──────────────────────────────────────────────┘

Consumer reads events → updates materialized view (in Redis/Elasticsearch/dedicated DB).
API reads from materialized view → fast, no joins.

Consistency: Eventually consistent (events take ms-seconds to propagate).
Rebuild: Replay ALL events from Kafka → rebuild view from scratch.
```

---

## Production Data Pipeline — 50M Users

```
Real-time path:
  App → Kafka → Flink/Kafka Streams → Actions
  Latency: < 5 seconds
  Use: fraud detection, notifications, cache invalidation, search index

Analytics path:
  PostgreSQL → Debezium → Kafka → S3 (raw) → dbt → Snowflake → Dashboards
  Latency: minutes to hours
  Use: business reports, ML features, compliance

Volume:
  Events: ~50K events/sec peak
  Kafka: 3 brokers, 100+ partitions, 7 days retention
  S3: ~500GB/day raw data
  Warehouse: ~5TB queryable (after compression)

Schema management:
  Confluent Schema Registry
  Avro serialization
  Backward compatibility enforced

Monitoring:
  Consumer lag (Kafka consumer group lag)
  Processing latency (event time vs processing time)
  Dead letter queue size (failed events)
  Schema compatibility check in CI/CD
```
