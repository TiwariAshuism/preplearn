# 06 — Testing Strategies (Production-Grade Go)

> **Scenario:** 50 engineers, 50 services, daily deployments. Bina solid tests ke — ek engineer ki change doosre service ko tod deti hai. Production mein customer ka pata chalta hai. Testing = engineer ka airbag.

---

## Testing Pyramid

```
                    ▲
                   /E2E\          Slow, expensive, flaky
                  /─────\         Few tests
                 /  Integ \       
                /──────────\      Medium
               /    Unit    \     
              /──────────────\    Fast, cheap, many
              
60-70%: Unit tests
20-30%: Integration tests
5-10%:  E2E tests

Don't invert the pyramid.
"All E2E" = slow CI, flaky tests, no one fixes them, team ignores them.
```

---

## Unit Testing in Go

### Table-Driven Tests

```go
func TestCalculateDiscount(t *testing.T) {
    tests := []struct {
        name     string
        amount   int64
        userTier string
        want     int64
        wantErr  bool
    }{
        {
            name:     "gold user gets 20% discount",
            amount:   10000,
            userTier: "gold",
            want:     8000,
        },
        {
            name:     "silver user gets 10% discount",
            amount:   10000,
            userTier: "silver",
            want:     9000,
        },
        {
            name:     "unknown tier returns error",
            amount:   10000,
            userTier: "diamond",
            wantErr:  true,
        },
        {
            name:     "zero amount",
            amount:   0,
            userTier: "gold",
            want:     0,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := CalculateDiscount(tt.amount, tt.userTier)
            
            if (err != nil) != tt.wantErr {
                t.Errorf("wantErr %v, got err %v", tt.wantErr, err)
                return
            }
            if got != tt.want {
                t.Errorf("want %d, got %d", tt.want, got)
            }
        })
    }
}
```

### Mocking Interfaces

```go
// ✅ Design with interfaces — testable
type UserRepository interface {
    GetByID(ctx context.Context, id string) (*User, error)
    Create(ctx context.Context, user *User) error
    Update(ctx context.Context, user *User) error
}

type UserService struct {
    repo UserRepository  // depends on interface, not concrete DB
    cache Cache
    events EventPublisher
}

// Production: UserService{repo: &postgresRepo{db: db}}
// Test:       UserService{repo: &mockRepo{}}

// Manual mock
type mockUserRepo struct {
    users map[string]*User
    err   error
}

func (m *mockUserRepo) GetByID(_ context.Context, id string) (*User, error) {
    if m.err != nil {
        return nil, m.err
    }
    return m.users[id], nil
}

// Or use mockery/gomock to generate mocks:
// go:generate mockery --name=UserRepository --output=mocks

func TestUserService_GetUser_NotFound(t *testing.T) {
    repo := &mockUserRepo{users: map[string]*User{}}  // empty
    svc := NewUserService(repo, nil, nil)
    
    _, err := svc.GetUser(context.Background(), "nonexistent")
    
    if !errors.Is(err, ErrUserNotFound) {
        t.Errorf("expected ErrUserNotFound, got %v", err)
    }
}
```

---

## Integration Testing — Testcontainers

```
Problem: Unit tests with mocks test the code but not the DB queries.
"My SQL query was syntactically wrong" — mock never caught this.

Testcontainers: spin up REAL Docker containers in tests.
Real PostgreSQL, real Redis, real Kafka — no mocks.
Isolated, repeatable, auto-cleanup.
```

```go
import (
    "github.com/testcontainers/testcontainers-go"
    "github.com/testcontainers/testcontainers-go/modules/postgres"
)

func TestOrderRepo_Integration(t *testing.T) {
    if testing.Short() {
        t.Skip("skipping integration test")  // go test -short for fast runs
    }
    
    ctx := context.Background()
    
    // Start real PostgreSQL container
    pgContainer, err := postgres.RunContainer(ctx,
        testcontainers.WithImage("postgres:16-alpine"),
        postgres.WithDatabase("testdb"),
        postgres.WithUsername("test"),
        postgres.WithPassword("test"),
        testcontainers.WithWaitStrategy(
            wait.ForLog("database system is ready to accept connections").
                WithOccurrence(2).WithStartupTimeout(60*time.Second),
        ),
    )
    require.NoError(t, err)
    defer pgContainer.Terminate(ctx)
    
    // Run migrations
    connStr, _ := pgContainer.ConnectionString(ctx)
    db, _ := sql.Open("pgx", connStr)
    runMigrations(db)
    
    repo := NewOrderRepository(db)
    
    t.Run("create and retrieve order", func(t *testing.T) {
        order := &Order{
            UserID: "user_123",
            Amount: 5000,
            Status: StatusPending,
        }
        
        created, err := repo.Create(ctx, order)
        require.NoError(t, err)
        assert.NotEmpty(t, created.ID)
        
        retrieved, err := repo.GetByID(ctx, created.ID, "user_123")
        require.NoError(t, err)
        assert.Equal(t, order.Amount, retrieved.Amount)
        assert.Equal(t, order.UserID, retrieved.UserID)
    })
    
    t.Run("get order for wrong user returns not found", func(t *testing.T) {
        // BOLA test — different user can't access
        _, err := repo.GetByID(ctx, createdOrderID, "different_user")
        assert.ErrorIs(t, err, ErrNotFound)
    })
}
```

### TestMain — Shared Container Across Tests

```go
var testDB *sql.DB

func TestMain(m *testing.M) {
    // Setup: start container once for all tests in package
    ctx := context.Background()
    pgContainer, _ := postgres.RunContainer(ctx, ...)
    connStr, _ := pgContainer.ConnectionString(ctx)
    testDB, _ = sql.Open("pgx", connStr)
    runMigrations(testDB)
    
    code := m.Run()  // run all tests
    
    // Teardown
    pgContainer.Terminate(ctx)
    os.Exit(code)
}
```

---

## HTTP Handler Testing

```go
func TestCreateOrderHandler(t *testing.T) {
    // Setup mock service
    mockSvc := &mockOrderService{
        createFn: func(ctx context.Context, req CreateOrderRequest) (*Order, error) {
            return &Order{ID: "order_123", Status: StatusCreated}, nil
        },
    }
    
    handler := NewOrderHandler(mockSvc)
    
    tests := []struct {
        name           string
        body           string
        idempotencyKey string
        wantStatus     int
    }{
        {
            name:           "valid order creation",
            body:           `{"user_id":"user_123","amount":5000,"currency":"INR"}`,
            idempotencyKey: "idem_key_1",
            wantStatus:     201,
        },
        {
            name:       "missing idempotency key",
            body:       `{"user_id":"user_123","amount":5000}`,
            wantStatus: 422,
        },
        {
            name:           "invalid amount",
            body:           `{"user_id":"user_123","amount":-100}`,
            idempotencyKey: "idem_key_2",
            wantStatus:     422,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            req := httptest.NewRequest(http.MethodPost, "/api/v1/orders",
                strings.NewReader(tt.body))
            req.Header.Set("Content-Type", "application/json")
            if tt.idempotencyKey != "" {
                req.Header.Set("Idempotency-Key", tt.idempotencyKey)
            }
            
            // Add auth context
            ctx := context.WithValue(req.Context(), "user_id", "user_123")
            req = req.WithContext(ctx)
            
            w := httptest.NewRecorder()
            handler.CreateOrder(w, req)
            
            assert.Equal(t, tt.wantStatus, w.Code)
        })
    }
}
```

---

## Contract Testing — Pact

```
Problem: Service A calls Service B.
Unit tests: A mocks B (might be wrong).
Integration tests: need B running.

Contract testing: capture how A uses B → verify B fulfills that contract.

Consumer (A): "I call B with X, I expect Y"
Provider (B): "Run tests against my contract file"

Tools: Pact (most popular), Spring Cloud Contract (Java)
```

```go
// Consumer test — generates pact file
func TestUserServiceConsumer(t *testing.T) {
    mockProvider, _ := dsl.NewMockService(dsl.MockHTTPProviderConfig{
        Consumer: "order-service",
        Provider: "user-service",
    })
    
    mockProvider.
        AddInteraction().
        Given("user 123 exists").
        UponReceiving("a request to get user 123").
        WithRequest(dsl.Request{
            Method: "GET",
            Path:   dsl.String("/api/v1/users/123"),
            Headers: dsl.MapMatcher{"Authorization": dsl.Regex("Bearer .+", "Bearer token123")},
        }).
        WillRespondWith(dsl.Response{
            Status: 200,
            Body: dsl.Match(&UserResponse{
                ID:    "123",
                Email: "user@example.com",
                Name:  "Test User",
            }),
        })
    
    err := mockProvider.ExecuteTest(t, func(config MockConfig) error {
        client := NewUserClient(config.MockServerURL)
        user, err := client.GetUser(context.Background(), "123")
        assert.NoError(t, err)
        assert.Equal(t, "123", user.ID)
        return err
    })
    assert.NoError(t, err)
    
    // Publishes pact file to Pact Broker
    mockProvider.WritePact()
}
```

---

## Load Testing — k6

```javascript
// k6 load test script
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
    stages: [
        { duration: '30s', target: 100 },   // ramp up to 100 users
        { duration: '1m',  target: 1000 },  // ramp to 1000
        { duration: '5m',  target: 1000 },  // stay at 1000 (steady state)
        { duration: '30s', target: 0 },     // ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<200', 'p(99)<500'],  // SLO: P99 < 500ms
        errors: ['rate<0.01'],                           // < 1% errors
    },
};

export default function () {
    const res = http.get(`${__ENV.API_URL}/api/v1/products`, {
        headers: { Authorization: `Bearer ${__ENV.TOKEN}` },
    });
    
    check(res, {
        'status 200': (r) => r.status === 200,
        'latency < 200ms': (r) => r.timings.duration < 200,
    });
    
    errorRate.add(res.status !== 200);
    sleep(1);
}
```

```bash
# Run
k6 run --env API_URL=https://staging.api.com --env TOKEN=xxx load_test.js

# Output:
# http_req_duration p(95)=145ms p(99)=312ms ← within SLO ✅
# errors rate=0.002 (0.2%) ← within SLO ✅
# http_reqs 125000 (400/s)
```

---

## Benchmarks

```go
func BenchmarkUserCache_Get(b *testing.B) {
    cache := NewUserCache(1000)
    
    // Setup
    for i := 0; i < 1000; i++ {
        cache.Set(fmt.Sprintf("user_%d", i), &User{ID: fmt.Sprintf("user_%d", i)})
    }
    
    b.ResetTimer()           // don't count setup time
    b.RunParallel(func(pb *testing.PB) {
        i := 0
        for pb.Next() {
            cache.Get(fmt.Sprintf("user_%d", i%1000))
            i++
        }
    })
}

// Run: go test -bench=BenchmarkUserCache_Get -benchmem -count=5
// Output:
// BenchmarkUserCache_Get-8   50000000   28.5 ns/op   0 B/op   0 allocs/op
//                                        ^ throughput  ^ allocs (0 is ideal)
```

---

## Race Condition Detection

```bash
# Go race detector — ALWAYS use in CI
go test -race ./...
go run -race main.go

# Finds:
# - Concurrent map read/write
# - Concurrent variable access without synchronization
# 
# Overhead: 5-10x slower, 5-10x more memory
# Use in CI, not production binary
```

---

## Testing CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Unit Tests (fast, no docker needed)
        run: go test -short -race -count=1 ./...
        
      - name: Integration Tests (needs docker)
        run: go test -run Integration -count=1 -timeout 5m ./...
        
      - name: Race Detector
        run: go test -race -count=1 ./...
        
      - name: Security Scan
        run: govulncheck ./...
        
      - name: Load Test (on staging after deploy)
        run: k6 run load_test.js --env API_URL=$STAGING_URL
        if: github.ref == 'refs/heads/main'

# Fast feedback loop:
# Unit tests: < 30 seconds (block PR merge)
# Integration: < 5 minutes (block deploy)
# Load test: < 10 minutes (after staging deploy)
```
