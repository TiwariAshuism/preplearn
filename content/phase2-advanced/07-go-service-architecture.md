# 07 — Go Service Architecture (Production Template)

> **Yeh sabse important file hai.** Theory sab padh li. Ab ek production Go service kaise structure hoti hai — Uber, Google, Stripe jaisi companies mein — woh yahan hai. Ek baar yeh samajh gaye toh koi bhi codebase quickly navigate kar paoge.

---

## Project Structure — Standard Layout

```
my-service/
├── cmd/
│   └── server/
│       └── main.go           ← entry point, wiring only
├── internal/                 ← private code (cannot import externally)
│   ├── domain/               ← business entities, interfaces
│   │   ├── order.go
│   │   ├── user.go
│   │   └── errors.go
│   ├── service/              ← business logic (use cases)
│   │   ├── order_service.go
│   │   └── order_service_test.go
│   ├── repository/           ← data access (DB, cache)
│   │   ├── order_repo.go
│   │   ├── order_repo_test.go (integration tests)
│   │   └── postgres/
│   │       └── queries.sql
│   ├── handler/              ← HTTP/gRPC handlers (thin layer)
│   │   ├── http/
│   │   │   ├── order_handler.go
│   │   │   └── middleware.go
│   │   └── grpc/
│   │       └── order_server.go
│   └── infra/                ← external dependencies setup
│       ├── db.go
│       ├── redis.go
│       └── kafka.go
├── pkg/                      ← reusable code (can be imported by other services)
│   └── errors/
│       └── errors.go
├── api/
│   └── proto/
│       └── order/v1/order.proto
├── migrations/               ← SQL migration files
│   ├── 001_create_orders.sql
│   └── 002_add_status_index.sql
├── config/
│   └── config.go
├── Dockerfile
├── docker-compose.yml        ← local dev
└── go.mod
```

---

## Clean Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│                    Handlers                          │
│     (HTTP/gRPC — parse request, call service)        │
│                        │                             │
│              ┌─────────▼──────────┐                 │
│              │      Services       │                 │
│              │  (Business Logic)   │                 │
│              │                     │                 │
│              │  ← depends on →     │                 │
│              └─────────┬──────────┘                 │
│                        │                             │
│              ┌─────────▼──────────┐                 │
│              │    Repositories     │                 │
│              │  (DB, Cache, APIs)  │                 │
│              └─────────────────────┘                 │
│                                                      │
│              ┌─────────────────────┐                 │
│              │      Domain         │                 │
│              │  (Entities, Errors, │                 │
│              │   Interfaces)       │                 │
│              └─────────────────────┘                 │
└─────────────────────────────────────────────────────┘

Rules:
  - Domain: depends on nothing. Pure Go structs + interfaces.
  - Repository: implements domain interfaces. Knows about DB.
  - Service: depends on domain interfaces (not concrete repos).
  - Handler: depends on service interfaces.
  
  Dependency direction: Handler → Service → Repository
                        All    → Domain (but domain depends on nothing)
```

---

## Domain Layer

```go
// internal/domain/order.go

package domain

import (
    "context"
    "time"
)

// Entity — core business object
type Order struct {
    ID        string
    UserID    string
    Amount    int64       // in paise
    Currency  string
    Status    OrderStatus
    Items     []OrderItem
    CreatedAt time.Time
    UpdatedAt time.Time
}

type OrderStatus string

const (
    StatusPending   OrderStatus = "pending"
    StatusPaid      OrderStatus = "paid"
    StatusCancelled OrderStatus = "cancelled"
    StatusRefunded  OrderStatus = "refunded"
)

// Domain methods — behavior belongs on the entity
func (o *Order) CanBeCancelled() bool {
    return o.Status == StatusPending
}

func (o *Order) Cancel() error {
    if !o.CanBeCancelled() {
        return ErrCannotCancelOrder
    }
    o.Status = StatusCancelled
    return nil
}

// Repository interface — defined in domain, implemented in infra
type OrderRepository interface {
    GetByID(ctx context.Context, id, userID string) (*Order, error)
    GetByUser(ctx context.Context, userID string, filter OrderFilter) ([]*Order, error)
    Create(ctx context.Context, order *Order) error
    Update(ctx context.Context, order *Order) error
}

// Service interface — for handler to depend on
type OrderService interface {
    GetOrder(ctx context.Context, id, userID string) (*Order, error)
    CreateOrder(ctx context.Context, req CreateOrderRequest) (*Order, error)
    CancelOrder(ctx context.Context, id, userID string) error
}
```

```go
// internal/domain/errors.go

package domain

import "errors"

var (
    ErrOrderNotFound      = errors.New("order not found")
    ErrCannotCancelOrder  = errors.New("order cannot be cancelled in current state")
    ErrInsufficientFunds  = errors.New("insufficient funds")
    ErrUserNotFound       = errors.New("user not found")
)

// Typed error with context
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation error: %s — %s", e.Field, e.Message)
}
```

---

## Service Layer

```go
// internal/service/order_service.go

package service

type orderService struct {
    repo      domain.OrderRepository
    userRepo  domain.UserRepository
    payments  PaymentGateway     // external dependency interface
    events    EventPublisher
    cache     Cache
    logger    *zap.Logger
}

func NewOrderService(
    repo domain.OrderRepository,
    userRepo domain.UserRepository,
    payments PaymentGateway,
    events EventPublisher,
    cache Cache,
    logger *zap.Logger,
) domain.OrderService {
    return &orderService{repo, userRepo, payments, events, cache, logger}
}

func (s *orderService) CreateOrder(ctx context.Context, req CreateOrderRequest) (*domain.Order, error) {
    // 1. Validate input
    if err := req.Validate(); err != nil {
        return nil, err
    }
    
    // 2. Check user exists
    user, err := s.userRepo.GetByID(ctx, req.UserID)
    if err != nil {
        return nil, fmt.Errorf("get user: %w", err)
    }
    
    // 3. Build domain entity
    order := &domain.Order{
        ID:       uuid.New().String(),
        UserID:   user.ID,
        Amount:   req.Amount,
        Currency: req.Currency,
        Status:   domain.StatusPending,
        Items:    req.Items,
    }
    
    // 4. Persist
    if err := s.repo.Create(ctx, order); err != nil {
        return nil, fmt.Errorf("create order: %w", err)
    }
    
    // 5. Publish event (async, don't fail order creation if this fails)
    go func() {
        if err := s.events.Publish(ctx, "orders", OrderCreatedEvent{Order: order}); err != nil {
            s.logger.Error("failed to publish order created event",
                zap.String("order_id", order.ID),
                zap.Error(err),
            )
        }
    }()
    
    return order, nil
}
```

---

## Handler Layer — Thin, No Business Logic

```go
// internal/handler/http/order_handler.go

package httphandler

type OrderHandler struct {
    svc    domain.OrderService
    logger *zap.Logger
}

func (h *OrderHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
    // 1. Parse request
    var req CreateOrderHTTPRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeError(w, http.StatusBadRequest, "invalid JSON")
        return
    }
    
    // 2. Validate (HTTP layer validation — required fields, format)
    if err := validate.Struct(req); err != nil {
        writeValidationError(w, err)
        return
    }
    
    // 3. Extract auth context
    userID := getUserID(r.Context())
    
    // 4. Call service (no business logic here!)
    order, err := h.svc.CreateOrder(r.Context(), domain.CreateOrderRequest{
        UserID:   userID,
        Amount:   req.Amount,
        Currency: req.Currency,
        Items:    req.Items.ToDomain(),
    })
    
    // 5. Handle errors (map domain errors to HTTP codes)
    if err != nil {
        h.handleError(w, err)
        return
    }
    
    // 6. Write response
    writeJSON(w, http.StatusCreated, orderToResponse(order))
}

func (h *OrderHandler) handleError(w http.ResponseWriter, err error) {
    switch {
    case errors.Is(err, domain.ErrOrderNotFound):
        writeError(w, 404, "order not found")
    case errors.Is(err, domain.ErrCannotCancelOrder):
        writeError(w, 409, "order cannot be cancelled")
    default:
        var valErr *domain.ValidationError
        if errors.As(err, &valErr) {
            writeError(w, 422, valErr.Message)
            return
        }
        h.logger.Error("unexpected error", zap.Error(err))
        writeError(w, 500, "internal error")
    }
}
```

---

## Dependency Injection — main.go Wiring

```go
// cmd/server/main.go

func main() {
    // 1. Load config
    cfg, err := config.Load()
    if err != nil {
        log.Fatal("load config:", err)
    }
    
    // 2. Initialize infrastructure
    logger, _ := zap.NewProduction()
    defer logger.Sync()
    
    db, err := infra.NewPostgres(cfg.DatabaseURL)
    if err != nil {
        logger.Fatal("connect to db", zap.Error(err))
    }
    defer db.Close()
    
    rdb := infra.NewRedis(cfg.RedisURL)
    defer rdb.Close()
    
    kafkaProducer := infra.NewKafkaProducer(cfg.KafkaBrokers)
    defer kafkaProducer.Close()
    
    // 3. Build dependency graph (outermost to innermost)
    // Repos (depend on DB/cache)
    orderRepo := repository.NewOrderRepository(db, rdb)
    userRepo := repository.NewUserRepository(db, rdb)
    
    // External adapters
    paymentGw := payment.NewStripeGateway(cfg.StripeKey)
    eventPub := events.NewKafkaPublisher(kafkaProducer)
    
    // Services (depend on repos and adapters)
    orderSvc := service.NewOrderService(orderRepo, userRepo, paymentGw, eventPub, rdb, logger)
    
    // Handlers (depend on services)
    orderHandler := httphandler.NewOrderHandler(orderSvc, logger)
    
    // 4. Setup router
    router := setupRouter(orderHandler)
    
    // 5. Start server with graceful shutdown
    srv := &http.Server{Addr: cfg.Addr, Handler: router}
    
    go func() {
        logger.Info("starting server", zap.String("addr", cfg.Addr))
        if err := srv.ListenAndServe(); err != http.ErrServerClosed {
            logger.Fatal("server error", zap.Error(err))
        }
    }()
    
    // Wait for shutdown signal
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    
    logger.Info("shutting down...")
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    srv.Shutdown(ctx)  // finish in-flight requests
    logger.Info("server stopped")
}
```

---

## Config Pattern

```go
// config/config.go — 12-factor app config from environment

type Config struct {
    Addr         string        `env:"ADDR"          envDefault:":8080"`
    DatabaseURL  string        `env:"DATABASE_URL"  envRequired:"true"`
    RedisURL     string        `env:"REDIS_URL"     envRequired:"true"`
    KafkaBrokers []string      `env:"KAFKA_BROKERS" envSeparator:","`
    JWTSecret    string        `env:"JWT_SECRET"    envRequired:"true"`
    LogLevel     string        `env:"LOG_LEVEL"     envDefault:"info"`
    MaxConns     int           `env:"DB_MAX_CONNS"  envDefault:"25"`
    ReadTimeout  time.Duration `env:"READ_TIMEOUT"  envDefault:"30s"`
}

func Load() (*Config, error) {
    var cfg Config
    if err := env.Parse(&cfg); err != nil {
        return nil, err
    }
    return &cfg, nil
}

// Using: github.com/caarlos0/env
// Never: flag package for production services (hard to containerize)
// Never: config files in /etc/ (12-factor says env vars)
```

---

## Graceful Shutdown Pattern

```go
// In main.go

// Drain: stop accepting new requests, finish current ones
srv.Shutdown(ctx)   // HTTP server: waits for in-flight requests
kafkaConsumer.Stop() // Kafka: commit offsets, stop polling
db.Close()           // DB: close connections cleanly
rdb.Close()          // Redis: close connections

// Why 30s timeout?
// 99th percentile request should complete within 30s.
// SIGTERM → 30s → SIGKILL (K8s default is 30s grace period).

// Kubernetes preStop hook to handle SIGTERM timing:
// preStop: exec: command: ["sh", "-c", "sleep 10"]
// This 10s sleep ensures LB removes pod before SIGTERM arrives.
```

---

## Architecture Decision Record (ADR)

```markdown
# ADR-001: Use gRPC for internal service communication

## Status: Accepted

## Context
Services need to communicate. Need type safety, performance, streaming.

## Decision
Use gRPC + protobuf for all internal service-to-service communication.
REST for external/public APIs only.

## Consequences
+ Strong typing catches interface mismatches at compile time
+ 10x better serialization performance vs JSON REST
+ Native streaming support
- Team needs to learn protobuf
- gRPC tooling less familiar than HTTP debugging
- Browser clients need gRPC-Web gateway
```

---

## Staff Engineer — What to Document

```
Not everything needs ADRs. Document when:
  - Decision affects multiple teams
  - Decision is hard to reverse
  - Future engineers will wonder "why did they do this?"

Keep decisions in:
  docs/adr/001-grpc-internal.md
  docs/adr/002-postgres-not-mongo.md
  docs/runbooks/high-error-rate.md
  docs/architecture/service-map.md
  README.md: how to run, test, deploy

What NOT to document:
  - Implementation details (code is the doc)
  - Things that change frequently (docs go stale)
```
