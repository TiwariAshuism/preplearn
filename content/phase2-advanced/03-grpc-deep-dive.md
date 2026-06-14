# 03 — gRPC Deep Dive (Production)

> **Scenario:** Internal service-to-service communication. REST too verbose, JSON too slow. gRPC se 10x faster, type-safe, bidirectional streaming support. Par production mein gRPC ke saath kya traps hain?

---

## Why gRPC Over REST Internally

```
JSON REST:
  "userId": "user_123"       → 20 bytes for a string field
  Serialization: 500ns
  Parse: 1.2µs
  
Protobuf (gRPC):
  field 1: bytes "user_123"  → 10 bytes (50% smaller)
  Serialization: 50ns
  Parse: 100ns
  
At 200K req/sec:
  JSON: 200K × 1.7µs = 340ms CPU/sec on serialization alone
  Proto: 200K × 0.15µs = 30ms CPU/sec
  
  11x less CPU on serialization.
  50% less bandwidth (lower network cost, lower latency).
```

---

## Protobuf Design — Getting It Right First Time

```protobuf
syntax = "proto3";
package user.v1;
option go_package = "github.com/company/proto/user/v1;userv1";

// Import well-known types
import "google/protobuf/timestamp.proto";
import "google/protobuf/field_mask.proto";

message User {
    string id = 1;                                    // never change field numbers!
    string email = 2;
    string name = 3;
    UserStatus status = 4;
    google.protobuf.Timestamp created_at = 5;
    google.protobuf.Timestamp updated_at = 6;
    
    // Nested types for grouping
    Address address = 7;
    
    // oneof — only one can be set
    oneof auth_method {
        EmailAuth email_auth = 8;
        OAuthInfo oauth_info = 9;
    }
}

enum UserStatus {
    USER_STATUS_UNSPECIFIED = 0;  // ALWAYS start with 0 = unspecified
    USER_STATUS_ACTIVE = 1;
    USER_STATUS_SUSPENDED = 2;
    USER_STATUS_DELETED = 3;
}
```

### Field Numbers — NEVER CHANGE

```
Field number = wire format identity.
Protobuf does NOT use field names over the wire, only numbers.

Field 1 ← binary encoding ← always means "id"

If you change field 1 from "id" to "user_id":
  - Old client sends field 1 = "user_123"
  - New server reads field 1 = "user_id" = "user_123" ✅ Compatible

If you change field number (CATASTROPHIC):
  - Old: field 1 = "id", field 2 = "email"
  - New: field 1 = "email", field 2 = "id"
  - Old client sends field 1 = "user_123"
  - New server reads field 1 = "email" = "user_123" ← WRONG!

Rules:
  ✅ Add new fields with new numbers (safe)
  ✅ Remove fields (mark reserved, not reuse number)
  ✅ Rename fields (safe, only number matters on wire)
  ❌ NEVER reuse field numbers
  ❌ NEVER change field types incompatibly
  
  reserved 10, 11;        // reserved field numbers (can't be reused)
  reserved "old_field";   // reserved field names
```

---

## gRPC Streaming

### Four Types of RPCs

```protobuf
service OrderService {
    // 1. Unary: request → response (like REST)
    rpc GetOrder(GetOrderRequest) returns (Order);
    
    // 2. Server streaming: request → stream of responses
    rpc StreamOrderUpdates(StreamOrderRequest) returns (stream OrderUpdate);
    
    // 3. Client streaming: stream of requests → one response
    rpc BatchCreateOrders(stream CreateOrderRequest) returns (BatchResult);
    
    // 4. Bidirectional streaming: stream ↔ stream
    rpc TradeStream(stream TradeRequest) returns (stream TradeResponse);
}
```

### Server Streaming — Live Order Updates

```go
// Server side
func (s *OrderServer) StreamOrderUpdates(
    req *pb.StreamOrderRequest, 
    stream pb.OrderService_StreamOrderUpdatesServer,
) error {
    ctx := stream.Context()
    
    // Subscribe to order updates for this user
    updateCh := s.pubsub.Subscribe(ctx, "orders:"+req.UserId)
    defer s.pubsub.Unsubscribe("orders:"+req.UserId)
    
    for {
        select {
        case update := <-updateCh:
            if err := stream.Send(update); err != nil {
                // Client disconnected
                return err
            }
        case <-ctx.Done():
            return ctx.Err() // Client cancelled or deadline exceeded
        }
    }
}

// Client side
stream, err := client.StreamOrderUpdates(ctx, &pb.StreamOrderRequest{UserId: "user_123"})
for {
    update, err := stream.Recv()
    if err == io.EOF {
        break // stream ended
    }
    if err != nil {
        log.Println("stream error:", err)
        break
    }
    fmt.Println("Order update:", update)
}
```

### Bidirectional Streaming — Chat/Trading

```go
// Server
func (s *ChatServer) Chat(stream pb.ChatService_ChatServer) error {
    ctx := stream.Context()
    for {
        msg, err := stream.Recv()
        if err == io.EOF {
            return nil
        }
        if err != nil {
            return err
        }
        
        // Echo back (real impl: broadcast to room)
        if err := stream.Send(&pb.ChatMessage{
            Content:   "Echo: " + msg.Content,
            Timestamp: timestamppb.Now(),
        }); err != nil {
            return err
        }
    }
}
```

---

## Interceptors — gRPC Middleware

```
gRPC ka middleware = interceptors
HTTP middleware jaisa but typed aur per-RPC.
```

### Unary Interceptor

```go
// Logging interceptor
func LoggingInterceptor(
    ctx context.Context,
    req interface{},
    info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler,
) (interface{}, error) {
    start := time.Now()
    
    resp, err := handler(ctx, req)
    
    logger.Info("grpc request",
        zap.String("method", info.FullMethod),
        zap.Duration("latency", time.Since(start)),
        zap.String("status", status.Code(err).String()),
    )
    return resp, err
}

// Metrics interceptor
func MetricsInterceptor(
    ctx context.Context,
    req interface{},
    info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler,
) (interface{}, error) {
    start := time.Now()
    resp, err := handler(ctx, req)
    
    grpcRequestsTotal.WithLabelValues(
        info.FullMethod,
        status.Code(err).String(),
    ).Inc()
    
    grpcLatency.WithLabelValues(info.FullMethod).Observe(
        time.Since(start).Seconds(),
    )
    return resp, err
}

// Chain multiple interceptors
server := grpc.NewServer(
    grpc.ChainUnaryInterceptor(
        RecoveryInterceptor,    // panic recovery (first, outermost)
        LoggingInterceptor,
        MetricsInterceptor,
        AuthInterceptor,
        RateLimitInterceptor,   // (last, closest to handler)
    ),
)
```

### Auth Interceptor with JWT

```go
func AuthInterceptor(
    ctx context.Context,
    req interface{},
    info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler,
) (interface{}, error) {
    // Skip auth for health check
    if info.FullMethod == "/grpc.health.v1.Health/Check" {
        return handler(ctx, req)
    }
    
    // Extract token from metadata
    md, ok := metadata.FromIncomingContext(ctx)
    if !ok {
        return nil, status.Error(codes.Unauthenticated, "metadata missing")
    }
    
    tokens := md.Get("authorization")
    if len(tokens) == 0 {
        return nil, status.Error(codes.Unauthenticated, "token missing")
    }
    
    token := strings.TrimPrefix(tokens[0], "Bearer ")
    claims, err := jwtValidator.Validate(token)
    if err != nil {
        return nil, status.Error(codes.Unauthenticated, "invalid token")
    }
    
    // Add claims to context for handler to use
    ctx = context.WithValue(ctx, "claims", claims)
    return handler(ctx, req)
}
```

---

## gRPC Error Handling

### Status Codes

```go
// gRPC mein HTTP status codes nahi hote, gRPC status codes hote hain

import "google.golang.org/grpc/status"
import "google.golang.org/grpc/codes"

// Return typed errors
func (s *UserServer) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.User, error) {
    if req.UserId == "" {
        return nil, status.Error(codes.InvalidArgument, "user_id is required")
    }
    
    user, err := s.db.GetUser(ctx, req.UserId)
    if errors.Is(err, sql.ErrNoRows) {
        return nil, status.Errorf(codes.NotFound, "user %s not found", req.UserId)
    }
    if err != nil {
        // Never expose internal details to client
        log.Error("db error", zap.Error(err))
        return nil, status.Error(codes.Internal, "internal error")
    }
    
    return user.ToProto(), nil
}

// Codes mapping:
// codes.OK              → Success
// codes.InvalidArgument → 400 (client bug)
// codes.NotFound        → 404
// codes.AlreadyExists   → 409
// codes.PermissionDenied → 403
// codes.Unauthenticated → 401
// codes.ResourceExhausted → 429 (rate limited)
// codes.Unavailable     → 503 (retry)
// codes.DeadlineExceeded → 504
// codes.Internal        → 500 (don't retry, client can't fix)
```

### Rich Error Details

```go
import "google.golang.org/genproto/googleapis/rpc/errdetails"

// Rich validation errors
st := status.New(codes.InvalidArgument, "request validation failed")
br := &errdetails.BadRequest{}
br.FieldViolations = append(br.FieldViolations, &errdetails.BadRequest_FieldViolation{
    Field:       "email",
    Description: "email format invalid",
})
st, _ = st.WithDetails(br)
return nil, st.Err()

// Client side: extract details
if st, ok := status.FromError(err); ok {
    for _, detail := range st.Details() {
        switch v := detail.(type) {
        case *errdetails.BadRequest:
            for _, violation := range v.FieldViolations {
                fmt.Printf("Field: %s, Error: %s\n", violation.Field, violation.Description)
            }
        }
    }
}
```

---

## Deadlines and Timeouts

```go
// ALWAYS set deadline on outgoing calls
ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
defer cancel()

// Deadline propagates automatically via gRPC metadata.
// Server can check remaining time:
if deadline, ok := ctx.Deadline(); ok {
    remaining := time.Until(deadline)
    if remaining < 100*time.Millisecond {
        // Not enough time to do meaningful work
        return nil, status.Error(codes.DeadlineExceeded, "deadline too short")
    }
}

// Retry only codes.Unavailable and codes.DeadlineExceeded
// Never retry codes.Internal (server-side bug — retrying won't help)
retryOpts := []grpc_retry.CallOption{
    grpc_retry.WithCodes(codes.Unavailable, codes.DeadlineExceeded),
    grpc_retry.WithMax(3),
    grpc_retry.WithBackoff(grpc_retry.BackoffExponential(100 * time.Millisecond)),
}
```

---

## gRPC Reflection + gRPCurl

```bash
# Server-side reflection enable karo (development/internal only)
import "google.golang.org/grpc/reflection"
reflection.Register(server)

# gRPCurl — curl for gRPC
grpcurl -plaintext localhost:9090 list
grpcurl -plaintext localhost:9090 describe user.v1.UserService
grpcurl -plaintext -d '{"user_id": "123"}' localhost:9090 user.v1.UserService/GetUser

# Never enable reflection in production! Exposes all method names and proto definitions.
```

---

## gRPC vs REST — When to Use What

```
gRPC:
  ✅ Internal service-to-service (microservices)
  ✅ High throughput (10K+ req/sec per connection)
  ✅ Bidirectional streaming
  ✅ Strongly typed contracts (protobuf)
  ❌ Browser clients (gRPC-Web needed, extra complexity)
  ❌ Public APIs (REST easier for external developers)
  ❌ Simple CRUD with few services (overhead not worth it)

REST:
  ✅ Public/external APIs
  ✅ Browser clients
  ✅ Simple CRUD
  ✅ Team unfamiliar with protobuf
  ❌ High-frequency inter-service calls (JSON overhead)
  ❌ Streaming (SSE/WS needed separately)

50M users architecture:
  External API (mobile, web, partners): REST + JSON
  Internal service-to-service: gRPC + protobuf
  Real-time updates: WebSockets / gRPC streaming
```
