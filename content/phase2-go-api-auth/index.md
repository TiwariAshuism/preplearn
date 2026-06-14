---
source: manual
title: "Phase 2 — Go, API Design & Auth"
parent: null
order: 21
icon: "🔐"
---

# Phase 2 — Go, API Design & Auth (Detailed Notes in Hinglish)

> **Goal:** Go seekho as primary backend language, professional-level API design karo, aur secure auth systems banao — DPoP tak, jo most senior engineers ko bhi nahi aata.

---

## Day 16–18: Go Language Internals

### Go kyun backend ke liye best hai?

Go specifically **network services** ke liye design hua hai. Iske 4 killer features hain:

1. **Cheap concurrency** — Goroutines (thousands chal sakte hain bina sweat ke)
2. **Fast startup** — Binary compile hota hai, JVM jaisa warmup nahi
3. **Simple deployment** — Single static binary, no dependencies
4. **Explicit error handling** — Koi hidden exception nahi, sab kuch visible

### G-M-P Scheduler Model

Yeh Go ka concurrency ka core hai. Samjho isko:

```
G = Goroutine   (tumhara code, lightweight "thread")
M = Machine     (actual OS thread)
P = Processor   (logical processor, scheduling context)
```

**Kaise kaam karta hai:**

```
        P0                    P1
    ┌─────────┐          ┌─────────┐
    │ Local Q  │          │ Local Q  │
    │ G1 G2 G3 │          │ G4 G5    │
    └────┬─────┘          └────┬─────┘
         │                     │
         M0 (OS Thread)        M1 (OS Thread)
```

- **P** ki quantity `GOMAXPROCS` se set hoti hai (default = CPU cores)
- Har **P** ke paas ek local run queue hai goroutines ki
- **M** (OS thread) ek P se attach hota hai aur uski queue se goroutines uthata hai
- Agar ek P ki queue khaali hai, toh woh dusre P ki queue se **work steal** karta hai

**Kyun important hai yeh jaanna?**

Kyunki production mein jab tumhara server slow ho raha hai, toh tumhe samajhna chahiye:
- Kya goroutines block ho rahe hain? (channel wait, mutex, I/O)
- Kya saare P busy hain? (CPU-bound work)
- Kya koi goroutine ne M ko permanently block kar diya? (cgo call, syscall)

Jab goroutine ek blocking syscall karta hai (file I/O, etc.), Go runtime **naya M spawn** karta hai taaki P idle na rahe. Network I/O ke liye Go apna **netpoller** (epoll/kqueue) use karta hai — isliye network calls M block nahi karte.

### Goroutines — Cheap but Not Free

```go
go func() {
    // yeh ek goroutine hai
    // starts with ~2KB stack
    // stack grows dynamically as needed
}()
```

**2KB initial stack** — compare karo OS thread se jo ~1MB stack leta hai. Isliye 100,000 goroutines chal sakte hain aasani se.

**LEKIN — goroutine leak sabse common Go bug hai:**

```go
// ❌ MEMORY LEAK — goroutine kabhi exit nahi hoga
func bad() {
    ch := make(chan int)
    go func() {
        val := <-ch  // forever blocked, koi bhejega nahi
        fmt.Println(val)
    }()
    // function return ho gaya, channel orphaned, goroutine leaked
}
```

**Rule:** Har goroutine ka ek clear exit path hona chahiye. Typically:
1. Channel close hona
2. Context cancel hona
3. WaitGroup done hona

```go
// ✅ CORRECT — context se cancellation
func good(ctx context.Context) {
    go func() {
        select {
        case <-ctx.Done():
            return  // clean exit
        case data := <-someChannel:
            process(data)
        }
    }()
}
```

**Testing ke liye:** `go.uber.org/goleak` use karo. Test ke end mein check karta hai ki koi goroutine leak toh nahi hua.

### Channels — Communication Between Goroutines

Channels Go ka primary synchronization mechanism hai. "Don't communicate by sharing memory; share memory by communicating."

#### Unbuffered Channel
```go
ch := make(chan int)  // unbuffered

// Sender BLOCKS jab tak receiver ready nahi
go func() { ch <- 42 }()  // blocks here until someone reads
val := <-ch                // receives 42
```

**Mental model:** Unbuffered channel ek **handoff** hai. Dono parties same time pe ready honi chahiye. Ek haath se dusre haath mein directly dena.

#### Buffered Channel
```go
ch := make(chan int, 5)  // buffer size 5

ch <- 1  // doesn't block (buffer has space)
ch <- 2  // doesn't block
// ...
ch <- 5  // doesn't block
ch <- 6  // BLOCKS — buffer full, wait for someone to read
```

**Mental model:** Buffered channel ek **bounded queue** hai. Producer items daal sakta hai jab tak queue full nahi. Consumer nikal sakta hai jab tak queue empty nahi.

**Kab kya use karein:**
- **Unbuffered:** Synchronization chahiye, guarantee ki dono parties participated
- **Buffered:** Decoupling chahiye, producer aur consumer different speeds pe chal sakte hain

#### Directional Channels

```go
func producer(out chan<- int) {  // sirf bhej sakta hai
    out <- 42
}

func consumer(in <-chan int) {  // sirf padh sakta hai
    val := <-in
}
```

Compile-time pe enforce hota hai ki koi galat direction mein use na kare.

### select — Channel Multiplexing

```go
select {
case msg := <-chatCh:
    handleMessage(msg)
case <-ctx.Done():
    log.Println("shutting down")
    return
case <-time.After(5 * time.Second):
    log.Println("timeout, no messages")
}
```

`select` ek goroutine ko **multiple channels pe simultaneously** wait karne deta hai. Jo pehle ready ho, woh case execute hoga. Agar dono ready hain, toh **random** choose hoga (fairness).

**Common pattern — graceful shutdown:**

```go
func server(ctx context.Context) {
    for {
        select {
        case <-ctx.Done():
            // cleanup: close DB connections, flush logs, etc.
            return
        case conn := <-newConnections:
            go handleConn(ctx, conn)
        }
    }
}
```

### context.Context — Cancellation Propagation

Context Go mein **THE** mechanism hai cancellation, deadlines, aur request-scoped values carry karne ke liye.

```go
// Parent context with 5 second timeout
ctx, cancel := context.WithTimeout(parentCtx, 5*time.Second)
defer cancel()  // ALWAYS defer cancel to free resources

// Pass to downstream calls
result, err := db.QueryContext(ctx, "SELECT ...")
// Agar 5 seconds ho gaye, query cancel ho jayegi

// Pass to HTTP calls
req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
resp, err := client.Do(req)
// Agar parent cancel hua, yeh request bhi cancel hogi
```

**Rules:**
1. Context **pehla parameter** hona chahiye har function mein jo I/O kare: `func DoSomething(ctx context.Context, ...)`
2. **Kabhi struct mein store mat karo** — pass it explicitly
3. `context.Value` sparingly use karo — sirf request-scoped data (request ID, auth info), business logic ke liye nahi

**Chain of cancellation:**

```
HTTP Handler (timeout 10s)
  → Service Layer (timeout 8s)
    → DB Query (timeout 5s)
    → External API Call (timeout 3s)
```

Agar top-level handler cancel hota hai, saare downstream operations bhi cancel ho jaate hain. **Yeh automatic propagation hai** — isliye context itna powerful hai.

### defer, panic, recover

#### defer
```go
func readFile(path string) error {
    f, err := os.Open(path)
    if err != nil {
        return err
    }
    defer f.Close()  // function return hone pe guaranteed call hoga
    
    // file ke saath kaam karo...
    return nil
}
```

**defer LIFO order mein execute hota hai** (last defer = first executed). Resource cleanup ke liye use karo (files, locks, connections).

#### panic aur recover
```go
// panic = program crash (like throwing an uncaught exception)
panic("something went terribly wrong")

// recover = catch a panic (only works inside defer)
func safeOperation() {
    defer func() {
        if r := recover(); r != nil {
            log.Printf("recovered from panic: %v", r)
        }
    }()
    
    riskyCode()  // agar panic hua, recover catch karega
}
```

**IMPORTANT — Kab use karein:**
- **panic:** Almost NEVER in library code. Sirf truly unrecoverable situations (corrupt state, programmer error)
- **recover:** HTTP middleware mein (ek request ka panic poore server ko crash na kare), aur top-level boundaries pe
- **Normal errors ke liye:** `return err` use karo, panic nahi

### Interfaces — Implicit Contracts

Go mein interfaces **implicit** hain. Koi `implements` keyword nahi:

```go
type Writer interface {
    Write(p []byte) (n int, err error)
}

// os.File implements Writer without saying so
// bytes.Buffer implements Writer without saying so
// http.ResponseWriter implements Writer without saying so
```

**Agar tumhare type ke paas woh methods hain, toh woh interface satisfy karta hai. Bas.**

**Best practices:**
- **Chhoti interfaces banao:** `io.Reader` (1 method), `io.Writer` (1 method) — yeh best interfaces hain
- **Consumer ke paas define karo:** Jo function interface use karta hai, woh define kare — not the implementor
- **Accept interfaces, return structs:** Function parameters mein interface lo, return mein concrete type do

```go
// ✅ Good — consumer defines what it needs
type UserRepository interface {
    GetByID(ctx context.Context, id string) (*User, error)
}

func NewUserService(repo UserRepository) *UserService {
    return &UserService{repo: repo}
}

// Testing mein mock inject kar sakte ho easily!
```

### Garbage Collector — Tricolor Mark-and-Sweep

Go ka GC **concurrent** hai — application ke saath simultaneously chalta hai (mostly).

**Tricolor algorithm:**
1. **White:** Not yet visited (potentially garbage)
2. **Grey:** Visited but children not yet scanned
3. **Black:** Visited and all children scanned

```
Start: Everything is WHITE
       ↓
Mark roots (goroutine stacks, globals) as GREY
       ↓
Pick a GREY object → scan its references → mark them GREY → mark original BLACK
       ↓
Repeat until no GREY objects left
       ↓
All WHITE objects are garbage → SWEEP (free memory)
```

**GC tuning:**
- `GOGC=100` (default): GC triggers jab heap current size ka 100% grow ho jaye
- `GOGC=50`: Zyada frequently GC chalega, kam memory use, zyada CPU
- `GOGC=200`: Kam frequently, zyada memory, kam CPU
- **Best optimization:** Kam allocations karo. Object pooling (`sync.Pool`), pre-allocated slices, avoid unnecessary string conversions.

**Production mein:** `GOMEMLIMIT` set karo (Go 1.19+). Yeh soft memory limit hai — GC aggressively chalega limit ke paas pahunchne pe, OOM se bachne ke liye.

---

## Day 19–20: Go vs Node.js vs Java

### Node.js — Event Loop Single Thread

```
     ┌──────────────────────┐
     │    Event Loop          │
     │  (single JS thread)    │
     │                        │
     │  callback1() ──────►   │
     │  callback2() ──────►   │
     │  callback3() ──────►   │
     └──────────┬─────────────┘
                │
     ┌──────────▼─────────────┐
     │   libuv Thread Pool     │
     │   (file I/O, DNS, etc.) │
     │   4 threads default     │
     └────────────────────────┘
```

**Strengths:**
- Non-blocking I/O naturally — `async/await` everywhere
- Huge npm ecosystem
- Full-stack JS — frontend team backend bhi likh sakte hain
- Rapid prototyping

**Weaknesses:**
- **CPU-bound work blocks the event loop.** Agar ek request mein heavy computation hai (image processing, JSON parsing of huge payload), toh saari requests block ho jaati hain
- Runtime overhead: V8 engine, JIT compilation, higher memory (~50MB idle)
- Dynamic typing → runtime errors jo compile-time pe catch hone chahiye the
- `node_modules` size aur dependency chain risks

### Java — JVM Powerhouse

**Strengths:**
- Mature ecosystem (Spring, Hibernate, etc.)
- JIT compilation → long-running services bahut fast ho jaate hain after warmup
- Strong type system
- Excellent profiling aur debugging tools
- Enterprise-grade libraries for everything

**Weaknesses:**
- JVM startup time: 2-5 seconds typical (vs Go ~10ms)
- Memory footprint: ~200MB+ idle (JVM + class loading + metaspace)
- GC pauses: G1 aur ZGC ne improve kiya hai, lekin still a concern for latency-sensitive systems
- Verbose boilerplate (though Kotlin/records help)
- Complex deployment (JRE dependency, classpath issues)

### Go — Simple aur Fast

**Strengths:**
- Compiled to native binary — no runtime dependency
- ~10MB idle memory footprint
- ~10ms startup time
- Built-in concurrency (goroutines + channels)
- Simple language — easy to read, easy to onboard new developers
- Standard library covers most needs (HTTP, JSON, crypto, testing)
- Cross-compilation trivial: `GOOS=linux GOARCH=amd64 go build`

**Weaknesses:**
- Less expressive type system (no generics until 1.18, still limited)
- Error handling verbose (`if err != nil` everywhere)
- No built-in framework — DIY more (lekin yeh strength bhi hai)
- Smaller ecosystem than Java/Node for specific domains

### Comparison Table

| Metric | Go | Node.js | Java |
|--------|-----|---------|------|
| Idle memory | ~10MB | ~50MB | ~200MB+ |
| Startup time | ~10ms | ~200ms | ~2-5s |
| Concurrency model | Goroutines (M:N) | Event loop (single thread) | Threads (1:1) + Virtual Threads (Java 21+) |
| Binary/deploy | Single static binary | Source + node_modules | JAR + JRE |
| Type safety | Compile-time | Runtime (unless TS) | Compile-time |
| CPU-bound work | Great (multi-core by default) | Bad (blocks event loop) | Great (multi-threaded) |
| Ecosystem | Growing | Massive (npm) | Massive (Maven/Gradle) |

### Decision Framework

```
Kya bana rahe ho?
├── API service / proxy / CLI / infra tool → Go
├── Full-stack app with JS frontend team → Node.js
├── Enterprise system with complex business logic → Java
├── Real-time I/O heavy (chat, notifications) → Go or Node.js
├── Data pipeline / ML integration → Java or Python
└── Quick prototype / MVP → Node.js
```

---

## Day 21–22: REST API Design

### Richardson Maturity Model

REST "kaise" karna chahiye — iske levels hain:

**Level 0 — The Swamp of POX (Plain Old XML/JSON)**
```
POST /api
Body: {"action": "getUser", "userId": 123}

POST /api
Body: {"action": "createOrder", "items": [...]}
```
Yeh basically RPC hai ek single endpoint pe. Koi HTTP semantics use nahi ho rahi.

**Level 1 — Resources**
```
POST /users/123     (get user info)
POST /orders        (create order)
```
Ab individual resources hain, lekin sab POST se ho raha hai. HTTP methods ka proper use nahi.

**Level 2 — HTTP Verbs**
```
GET    /users/123        (read)
POST   /users            (create)
PUT    /users/123        (replace)
PATCH  /users/123        (partial update)
DELETE /users/123        (delete)
```
**Yeh wo level hai jahaan tumhe hona chahiye.** Most production APIs Level 2 hain.

**Level 3 — HATEOAS (Hypermedia)**
```json
{
  "id": 123,
  "name": "Ashutosh",
  "links": [
    {"rel": "orders", "href": "/users/123/orders"},
    {"rel": "profile", "href": "/users/123/profile"},
    {"rel": "delete", "href": "/users/123", "method": "DELETE"}
  ]
}
```
Response mein next possible actions ke links hain. Client ko URLs hardcode nahi karne padte. **Practically rare** — mostly internal APIs mein skip karte hain.

### Idempotency — Retry Safety

**Idempotent** = same request 10 baar bhejo, result same rahega.

| Method | Idempotent? | Kyun? |
|--------|------------|-------|
| GET | ✅ Yes | Sirf read karta hai |
| PUT | ✅ Yes | Replace karta hai — 10 baar replace karo, same result |
| DELETE | ✅ Yes | Pehli baar delete, baaki baar "already deleted" (404 ya 204) |
| PATCH | ⚠️ Depends | `{"name": "new"}` idempotent hai, `{"views": "+1"}` nahi |
| POST | ❌ No | Har baar naya resource create hoga |

**Kyun important hai?**
Network unreliable hai. Client ne request bheji, response nahi mila (timeout), toh retry karega. Agar operation idempotent nahi hai, toh:
- Payment double ho sakta hai
- Order duplicate ban sakta hai
- Email dobara bhi ja sakta hai

**Solution for POST:** Idempotency key.
```
POST /payments
Idempotency-Key: abc-123-unique-id
Body: {"amount": 1000, "currency": "INR"}
```
Server idempotency key store karta hai. Same key dobara aaye toh same response return karta hai, naya payment nahi banata. **Stripe yeh exact approach use karta hai.**

### HTTP Status Codes — Sahi Use Karo

```
2xx = Success
  200 OK              → General success with body
  201 Created          → Resource ban gaya (POST ke baad, Location header do)
  204 No Content       → Success but no body (DELETE ke baad)

4xx = Client ki galti
  400 Bad Request      → Malformed request (invalid JSON, missing field)
  401 Unauthorized     → Authentication chahiye (actually "unauthenticated")
  403 Forbidden        → Authenticated ho but permission nahi hai
  404 Not Found        → Resource exist nahi karta
  409 Conflict         → State conflict (duplicate email, version mismatch)
  422 Unprocessable    → JSON valid hai but semantically galat (age = -5)
  429 Too Many Req     → Rate limit hit. Retry-After header do.

5xx = Server ki galti
  500 Internal Error   → Unexpected crash/bug
  502 Bad Gateway      → Upstream server ne galat response diya
  503 Unavailable      → Server temporarily down (maintenance, overloaded)
  504 Gateway Timeout  → Upstream server ne respond nahi kiya time mein
```

**Common galti:** Sab kuch 200 return karna aur body mein `{"success": false, "error": "..."}`. Yeh REST nahi hai — HTTP status codes USE karo.

### API Versioning

**3 approaches:**

1. **URL path** — `/v1/users`, `/v2/users`
   - Simple, clear, easy to route
   - Breaking change = new URL
   - **Most common approach**

2. **Header** — `Accept: application/vnd.myapi.v2+json`
   - Cleaner URLs
   - Harder to test (browser se nahi test kar sakte easily)
   - Less discoverable

3. **Query param** — `/users?version=2`
   - Easy to use
   - Pollutes query string
   - Caching complications

**Stripe ka approach (best practice):**
- Date-based versions: `Stripe-Version: 2024-06-20`
- Har API key ek default version pe pinned hai
- Purane versions indefinitely supported
- New features sirf new versions mein

### Pagination — Cursor vs Offset

#### Offset Pagination
```
GET /users?limit=20&offset=0    → page 1
GET /users?limit=20&offset=20   → page 2
GET /users?limit=20&offset=40   → page 3
```

**Problems:**
- `OFFSET 10000` = database 10000 rows scan karke skip karega = **SLOW**
- Jab naya data insert ho between pages, toh items skip ya duplicate ho sakte hain
- Counting total pages expensive hai large tables pe

#### Cursor Pagination
```
GET /users?limit=20
Response: {"data": [...], "next_cursor": "user_abc123"}

GET /users?limit=20&cursor=user_abc123
Response: {"data": [...], "next_cursor": "user_def456"}
```

**How it works:** Cursor last item ka identifier hai (ID, timestamp, encoded value). Query becomes: `WHERE id > cursor_id ORDER BY id LIMIT 20`. Yeh **indexed seek** hai, OFFSET scan nahi — constant time regardless of page number.

**Cursor advantages:**
- Consistent results (no duplicates/skips)
- Fast at any "page" (no scanning)
- Works well with real-time data

**Cursor disadvantages:**
- "Jump to page 50" nahi kar sakte directly
- Total count efficiently nahi mil sakta always

**Rule:** Offset for small datasets with admin UIs. Cursor for everything production/public-facing.

### Error Response Format — RFC 7807

```json
{
  "type": "https://api.example.com/errors/insufficient-funds",
  "title": "Insufficient Funds",
  "status": 422,
  "detail": "Account balance is ₹500, but transfer requires ₹1000.",
  "instance": "/transfers/txn_abc123",
  "balance": 500,
  "required": 1000
}
```

**Fields:**
- `type`: URI identifying the error type (can be a doc link)
- `title`: Short human-readable summary
- `status`: HTTP status code (repeated for convenience)
- `detail`: Human-readable explanation specific to this occurrence
- `instance`: URI identifying this specific occurrence
- Additional fields: domain-specific data

**Kyun RFC 7807?** Consistency. Client ko pata hai ki error response ka format kya hoga. Parsing predictable hai. Debugging easy hai.

---

## Day 23–24: gRPC Deep Dive

### Protocol Buffers (Protobuf)

Protobuf Google ka **binary serialization format** hai. JSON se 3-10x chhota aur 20-100x fast parse hota hai.

```protobuf
syntax = "proto3";

package user;

service UserService {
    rpc GetUser(GetUserRequest) returns (User);
    rpc ListUsers(ListUsersRequest) returns (stream User);
    rpc CreateUser(CreateUserRequest) returns (User);
    rpc Chat(stream ChatMessage) returns (stream ChatMessage);
}

message User {
    string id = 1;         // field number 1
    string name = 2;       // field number 2
    string email = 3;      // field number 3
    int32 age = 4;         // field number 4
}

message GetUserRequest {
    string id = 1;
}
```

**Field numbers are the wire contract!**

```
❌ NEVER reuse a deleted field number
❌ NEVER change a field's type
✅ Add new fields with new numbers (backward compatible)
✅ Rename fields (wire format uses numbers, not names)
✅ Mark deprecated fields as reserved
```

```protobuf
message User {
    reserved 5, 6;            // ye field numbers phir se use nahi honge
    reserved "old_field";     // ye name phir se use nahi hoga
    string id = 1;
    string name = 2;
    // field 3 was email, removed. Number 3 is now reserved.
}
```

### 4 Streaming Types

```
1. Unary:              Client ──Request──► Server
                        Client ◄──Response── Server

2. Server Streaming:   Client ──Request──► Server
                        Client ◄──Response── Server
                        Client ◄──Response── Server
                        Client ◄──Response── Server

3. Client Streaming:   Client ──Request──► Server
                        Client ──Request──► Server
                        Client ──Request──► Server
                        Client ◄──Response── Server

4. Bidirectional:      Client ──Request──► Server
                        Client ◄──Response── Server
                        Client ──Request──► Server
                        Client ◄──Response── Server
                        (dono independently bhej sakte hain)
```

**Use cases:**
- **Unary:** Normal request-response (most APIs)
- **Server streaming:** Real-time feed, log tailing, progress updates
- **Client streaming:** File upload in chunks, batch data ingestion
- **Bidirectional:** Chat, collaborative editing, real-time sync

### Interceptors — gRPC ka Middleware

```go
// Unary interceptor (ek request-response ke liye)
func loggingInterceptor(
    ctx context.Context,
    req interface{},
    info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler,
) (interface{}, error) {
    start := time.Now()
    
    // Call the actual handler
    resp, err := handler(ctx, req)
    
    // Log after
    log.Printf("method=%s duration=%s error=%v",
        info.FullMethod, time.Since(start), err)
    
    return resp, err
}

// Chain multiple interceptors
server := grpc.NewServer(
    grpc.ChainUnaryInterceptor(
        loggingInterceptor,    // 1. Log request
        authInterceptor,       // 2. Validate token
        recoveryInterceptor,   // 3. Recover from panics
    ),
)
```

**Common interceptors:**
1. **Logging:** Request/response log with duration
2. **Auth:** Token validate karo, context mein user info daalo
3. **Recovery:** Panic se recover karo, InternalError return karo (server crash na ho)
4. **Retry:** `UNAVAILABLE` pe automatic retry (client-side interceptor)
5. **Tracing:** Distributed trace IDs propagate karo (OpenTelemetry)
6. **Validation:** Request fields validate karo

### Deadlines aur Timeouts

```go
// Client side — 5 second deadline
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

resp, err := client.GetUser(ctx, &pb.GetUserRequest{Id: "123"})
if err != nil {
    st, _ := status.FromError(err)
    if st.Code() == codes.DeadlineExceeded {
        // 5 seconds ho gaye, server ne time pe respond nahi kiya
    }
}
```

**Critical concept:** Deadlines **propagate** across service boundaries. Agar Service A ne Service B ko call kiya with 5s deadline, aur 3s mein B ne Service C ko call kiya, toh C ke paas sirf 2s bache hain.

```
Service A (deadline 5s)
  → 2s processing
  → Call Service B (3s remaining)
    → 1s processing
    → Call Service C (2s remaining)
      → Agar 2s mein response nahi, DEADLINE_EXCEEDED
```

**Rule:** ALWAYS set deadlines. Bina deadline ke request infinitely hang ho sakti hai, resources consume karegi.

### gRPC Status Codes

gRPC ke apne status codes hain (HTTP codes se alag):

| Code | Matlab | Kab use karein |
|------|--------|---------------|
| `OK` | Success | Normal response |
| `INVALID_ARGUMENT` | Client ne galat input diya | Validation failure |
| `NOT_FOUND` | Resource nahi mila | Missing entity |
| `ALREADY_EXISTS` | Duplicate | Create with existing ID |
| `PERMISSION_DENIED` | Auth hai but allowed nahi | Authorization failure |
| `UNAUTHENTICATED` | Auth nahi hai | Missing/invalid token |
| `DEADLINE_EXCEEDED` | Timeout | Request too slow |
| `UNAVAILABLE` | Server temporarily down | Retry karne layak |
| `INTERNAL` | Server error | Bug/crash |
| `UNIMPLEMENTED` | Method nahi hai | Missing implementation |

```go
// Return a proper status
import "google.golang.org/grpc/status"
import "google.golang.org/grpc/codes"

return nil, status.Errorf(codes.NotFound, "user %s not found", id)
```

### Health Checking

```protobuf
// grpc_health_v1 — standard health check protocol
service Health {
    rpc Check(HealthCheckRequest) returns (HealthCheckResponse);
    rpc Watch(HealthCheckRequest) returns (stream HealthCheckResponse);
}
```

Load balancers aur orchestrators (Kubernetes) yeh use karte hain check karne ke liye ki service alive hai ya nahi. **Always implement health checks.**

### Kyun Uber ne REST se gRPC migrate kiya?

1. **Type safety:** Protobuf schemas = generated code = no more "field name typo" bugs
2. **Performance:** Binary serialization 30% faster than JSON
3. **Contract enforcement:** `.proto` files = single source of truth for API contract
4. **Code generation:** Client libraries auto-generated — no manual SDK maintenance
5. **Streaming:** Real-time features easily (driver location updates, trip status)

**Lesson:** 1000+ services REST pe thi. Undocumented field changes production bugs ka #1 source tha. Protobuf ne yeh class of bug eliminate kar diya.

---

## Day 25: GraphQL Internals

### Resolver Tree — Query Execution

```graphql
query {
    user(id: "123") {
        name
        posts {
            title
            comments {
                body
                author {
                    name
                }
            }
        }
    }
}
```

GraphQL engine yeh query ko ek **tree** ki tarah execute karta hai:

```
user(id: "123")          → userResolver(id) → DB query
  ├── name               → field from user object
  └── posts              → postsResolver(userId) → DB query
        ├── title         → field from post object
        └── comments      → commentsResolver(postId) → DB query (per post!)
              ├── body    → field from comment object
              └── author  → authorResolver(authorId) → DB query (per comment!)
                    └── name
```

### N+1 Problem — GraphQL ka Sabse Bada Pitfall

Socho: user ke 10 posts hain, har post pe 5 comments hain:

```
1 query for user
1 query for posts (10 posts)
10 queries for comments (1 per post)    → N+1!
50 queries for authors (1 per comment)  → N+1 again!
─────────────────────────────────
62 SQL queries for 1 GraphQL query! 😱
```

**Yeh N+1 problem hai.** "1" initial query + "N" child queries for each result.

### DataLoader — N+1 ka Solution

DataLoader batching aur caching karta hai within a single request:

```
Without DataLoader:
  commentsResolver(postId=1) → SELECT * FROM comments WHERE post_id = 1
  commentsResolver(postId=2) → SELECT * FROM comments WHERE post_id = 2
  commentsResolver(postId=3) → SELECT * FROM comments WHERE post_id = 3
  ... (10 separate queries)

With DataLoader:
  commentsResolver(postId=1) → add to batch
  commentsResolver(postId=2) → add to batch
  commentsResolver(postId=3) → add to batch
  ... (all 10 collected)
  
  BATCH EXECUTE: SELECT * FROM comments WHERE post_id IN (1,2,3,...,10)
  → 1 query instead of 10!
```

**DataLoader 2 cheezein karta hai:**
1. **Batching:** Same tick mein aane wale requests ko ek batch mein combine karta hai
2. **Caching:** Same request mein agar same key dobara aaye, cached result deta hai

**Implementation idea:**
```go
// Pseudocode
loader := dataloader.New(func(keys []string) []Result {
    // keys = ["post_1", "post_2", "post_3"]
    // Ek SQL query fire karo
    return db.Query("SELECT * FROM comments WHERE post_id IN (?)", keys)
})

// Resolver mein
func (r *postResolver) Comments(ctx context.Context, post *Post) ([]*Comment, error) {
    return loader.Load(ctx, post.ID)  // batched automatically
}
```

### Persisted Queries

**Problem:** GraphQL queries text strings hain jo client bhejta hai. Bade queries = bandwidth waste + parsing overhead + security risk (arbitrary queries).

**Solution:** Build time pe saari queries register karo, hash generate karo:
```
POST /graphql
{
    "id": "abc123hash",        // query ka hash
    "variables": {"id": "123"}
}
```

Server hash se actual query look up karta hai. Client ko full query text bhejne ki zaroorat nahi.

**Benefits:**
- Bandwidth savings
- Server validation at build time
- No arbitrary queries (security)
- Caching easier

### Kab GraphQL Use NA Karein

| Situation | Better Alternative |
|-----------|--------------------|
| Simple CRUD API | REST |
| Public API (third-party devs) | REST (better caching, simpler) |
| Mobile with poor connectivity | REST + HTTP/2 (simpler, less overhead) |
| Real-time only | WebSockets / gRPC streaming |
| Microservice-to-microservice | gRPC (type safety, performance) |

**GraphQL best hai jab:** Multiple frontend clients hain (web, mobile, TV) jo same backend se different data shapes chahte hain. Frontend team independently iterate kar sake bina backend changes ke.

---

## Day 26–27: Auth — Sessions, Cookies, JWT

### Cookie Attributes — Har Ek Important Hai

```
Set-Cookie: session_id=abc123;
    Secure;         → Sirf HTTPS pe bhejega (HTTP pe nahi)
    HttpOnly;       → JavaScript access NAHI kar sakta (XSS protection)
    SameSite=Lax;   → Cross-site requests mein nahi bhejega (CSRF protection)
    Path=/;         → Poore site pe valid
    Max-Age=86400;  → 24 hours baad expire
    Domain=.example.com;  → Subdomains pe bhi valid
```

**SameSite values:**
- `Strict`: Cookie KABHI cross-site request mein nahi jayega. Safe but restrictive — Google se link click karke aaye toh bhi logged out dikhoge initially.
- `Lax` (recommended): Top-level navigation (link click) pe bhejega, but embedded requests (img, iframe, AJAX) pe nahi. Good balance.
- `None`: Har jagah bhejega. **Sirf `Secure` ke saath use karo.** Third-party cookies ke liye.

### Session-Based Auth

```
         ┌──────────┐                    ┌──────────┐
         │  Client  │                    │  Server  │
         └────┬─────┘                    └────┬─────┘
              │                                │
              │── POST /login ────────────────►│
              │   {email, password}            │
              │                                │── Verify credentials
              │                                │── Create session in Redis:
              │                                │   "sess_abc123" → {userId: 42, role: "admin"}
              │                                │
              │◄── Set-Cookie: sid=sess_abc123 ─│
              │                                │
              │── GET /api/profile ────────────►│
              │   Cookie: sid=sess_abc123      │
              │                                │── Lookup "sess_abc123" in Redis
              │                                │── Found! User is 42, role admin
              │◄── 200 {name: "Ashutosh"} ─────│
              │                                │
              │── POST /logout ────────────────►│
              │                                │── Delete "sess_abc123" from Redis
              │◄── Set-Cookie: sid=; Max-Age=0 ─│
```

**Advantages:**
- **Instant revocation:** Redis se delete karo, session khatam. User ko force logout karna trivial hai.
- **Server controls state:** Session mein kuch bhi store kar sakte ho, anytime update kar sakte ho.
- **Opaque token:** Session ID se koi information leak nahi hoti (unlike JWT).

**Disadvantages:**
- **Stateful:** Har request pe Redis/DB lookup. Agar Redis down, sab logout.
- **Horizontal scaling:** Saare servers ko same Redis access chahiye (ya sticky sessions, which is worse).

### JWT — JSON Web Token

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.        ← Header (base64)
eyJzdWIiOiIxMjMiLCJuYW1lIjoiQXNodXRvc2giLCJleH ← Payload (base64)
AiOjE2ODk5MzAwMDB9.                            
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c   ← Signature
```

**Decode karo (base64, NOT encrypted!):**

```json
// Header
{
    "alg": "RS256",    // signing algorithm
    "typ": "JWT"
}

// Payload
{
    "sub": "user_123",         // subject (user ID)
    "name": "Ashutosh",
    "role": "admin",
    "iss": "auth.example.com", // issuer
    "aud": "api.example.com",  // audience
    "iat": 1689840000,         // issued at
    "exp": 1689841800          // expires (30 min)
}

// Signature
RSASHA256(
    base64UrlEncode(header) + "." + base64UrlEncode(payload),
    privateKey
)
```

### JWT Security Pitfalls

#### `alg: none` Attack
```json
// Attacker crafts this JWT:
{"alg": "none", "typ": "JWT"}
.
{"sub": "admin", "role": "superadmin"}
.
(empty signature)
```

Agar server blindly JWT header se algorithm read karta hai, toh `alg: none` matlab koi signature verification nahi! **Attacker admin ban gaya.**

**Fix:** Server pe **hardcode** karo ki kaunsa algorithm accept hai. JWT header se algorithm KABHI mat padho:

```go
// ❌ WRONG — attacker controls the algorithm
token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
    return publicKey, nil  // alg header se algorithm decide hoga
})

// ✅ CORRECT — explicitly specify allowed algorithms
token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
    if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
        return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
    }
    return publicKey, nil
})
```

#### JWT Revocation Problem

JWT stateless hai — ek baar issue hua, toh valid hai jab tak expire nahi hota. **User ko force logout kaise karein?**

**Solutions:**

1. **Short TTL + Refresh Token:**
   - Access token: 15 minutes expiry
   - Refresh token: 7 days, stored in Redis
   - Access token expire hone pe, refresh token se naya lo
   - Revoke karna hai? Refresh token Redis se delete karo. Access token 15 min mein expire ho jayega.

2. **Token blocklist in Redis:**
   - Revoke pe token ID (jti) Redis mein daalo with TTL = token expiry
   - Har request pe check karo blocklist
   - **Tradeoff:** Ab stateless nahi raha — har request pe Redis call. Toh session auth karlo better?

3. **Token versioning:**
   - User table mein `token_version` column rakho
   - JWT mein `ver` claim daalo
   - Version mismatch = token invalid
   - Password change pe version badhao

**Practical approach:** Short-lived access token (15 min) + refresh token rotation in Redis. Best balance of stateless verification and revocation ability.

### JWS vs JWE

- **JWS (JSON Web Signature):** JWT **signed** hai but **not encrypted**. Koi bhi payload padh sakta hai (base64 decode). Signature sirf integrity verify karta hai.
- **JWE (JSON Web Encryption):** JWT ka payload **encrypted** hai. Sirf key holder padh sakta hai.

**Rule:** Sensitive data JWT payload mein mat daalo (passwords, credit cards, PII). Agar daalna hi hai, JWE use karo. Most cases mein JWS + short-lived tokens + HTTPS sufficient hai.

---

## Day 28–30: OAuth 2.0 Full Flows

### OAuth 2.0 kya hai? (Simple explanation)

**Problem:** User Ashutosh chahta hai ki App X uski Google photos access kare. Kya Ashutosh apna Google password App X ko de? **NAHI!**

**Solution:** OAuth 2.0 — delegated authorization. Google user se seedha poochega "App X ko photos access deni hai?", user approve karega, App X ko ek **limited token** milega. Password kabhi share nahi hua.

### Authorization Code + PKCE — The Modern Standard

PKCE (Proof Key for Code Exchange) — "pixy" bolte hain.

```
┌──────┐                    ┌──────────┐                 ┌────────────┐
│Client│                    │Auth Server│                 │Resource Svr│
│(App) │                    │(Google)   │                 │(Google API)│
└──┬───┘                    └────┬──────┘                 └─────┬──────┘
   │                              │                              │
   │ 1. Generate:                 │                              │
   │    code_verifier = random    │                              │
   │    code_challenge = SHA256(  │                              │
   │      code_verifier)          │                              │
   │                              │                              │
   │ 2. Redirect user ──────────►│                              │
   │    /authorize?               │                              │
   │      response_type=code&     │                              │
   │      client_id=xxx&          │                              │
   │      redirect_uri=callback&  │                              │
   │      code_challenge=abc&     │                              │
   │      code_challenge_method=  │                              │
   │        S256&                 │                              │
   │      scope=photos.read       │                              │
   │                              │                              │
   │                   3. User logs in & approves                │
   │                              │                              │
   │◄─── 4. Redirect back ───────│                              │
   │    /callback?code=AUTH_CODE  │                              │
   │                              │                              │
   │ 5. POST /token ─────────────►                              │
   │    grant_type=               │                              │
   │      authorization_code&     │                              │
   │    code=AUTH_CODE&           │                              │
   │    code_verifier=original&   │ ← Server verifies:          │
   │    redirect_uri=callback     │   SHA256(code_verifier)      │
   │                              │   == code_challenge?         │
   │                              │                              │
   │◄─── 6. Access Token ────────│                              │
   │    + Refresh Token           │                              │
   │                              │                              │
   │ 7. GET /photos ──────────────────────────────────────────►  │
   │    Authorization: Bearer     │                              │
   │      ACCESS_TOKEN            │                              │
   │                              │                              │
   │◄─── 8. Photos data ─────────────────────────────────────── │
```

**PKCE kyun zaroori hai?**

Bina PKCE ke, agar koi attacker auth code intercept kar le (mobile app pe possible — custom URL scheme hijacking), toh woh code exchange karke token le sakta hai.

PKCE ke saath: attacker ke paas auth code hai, lekin `code_verifier` nahi hai. `code_verifier` ke bina token nahi milega. **Code useless hai bina verifier ke.**

### Client Credentials Flow — Server-to-Server

```
┌──────────┐                    ┌──────────┐
│Service A │                    │Auth Server│
└────┬─────┘                    └────┬──────┘
     │                                │
     │── POST /token ────────────────►│
     │   grant_type=client_credentials│
     │   client_id=service_a          │
     │   client_secret=xxx            │
     │   scope=read:inventory         │
     │                                │
     │◄── Access Token ──────────────│
     │                                │
     │   (No user involved!)          │
```

**Use case:** Microservice A ko Microservice B ka API call karna hai. Koi user nahi hai. Service ki apni identity hai.

### Device Flow — TV, CLI, IoT

```
Device (TV/CLI)                User's Phone/Laptop        Auth Server
     │                               │                        │
     │── POST /device/code ──────────────────────────────────►│
     │                               │                        │
     │◄── {device_code, user_code,───────────────────────────│
     │     verification_uri}         │                        │
     │                               │                        │
     │ Display: "Go to              │                        │
     │  auth.example.com/device      │                        │
     │  Enter code: WDJB-MJHT"      │                        │
     │                               │                        │
     │                    User visits URL, enters code,       │
     │                    logs in, approves                    │
     │                               │                        │
     │── Poll POST /token ───────────────────────────────────►│
     │   (every 5 seconds)           │                        │
     │                               │                        │
     │◄── "authorization_pending" ───────────────────────────│
     │── Poll again ─────────────────────────────────────────►│
     │◄── Access Token! ─────────────────────────────────────│
```

**Use case:** Smart TV pe Netflix login. TV pe keyboard nahi hai, toh phone/laptop pe code enter karo.

### Refresh Token Rotation

```
Request 1: Use refresh_token_v1 → Get access_token_new + refresh_token_v2
           refresh_token_v1 is now INVALID

Request 2: Use refresh_token_v2 → Get access_token_new + refresh_token_v3
           refresh_token_v2 is now INVALID

If attacker tries: Use refresh_token_v1 (stolen)
  → Server sees: v1 already used!
  → ALERT: Token theft detected!
  → Invalidate ALL refresh tokens for this user
  → User must re-login
```

**Yeh automatic theft detection hai.** Agar purana refresh token reuse hua, matlab kisine chori kiya tha. Sab tokens revoke karo.

### Authentication vs Authorization

```
Authentication: "Tum kaun ho?"
  → Credentials verify karo (password, biometric, token)
  → Result: identity (user_id, roles)

Authorization: "Tumhe kya karne ki ijazat hai?"  
  → Permissions check karo (RBAC, ABAC, policies)
  → Result: allow/deny
```

**OAuth 2.0 is an AUTHORIZATION framework.** Yeh authorization delegate karta hai. User authenticate Google se hota hai, lekin App X ko sirf **limited authorization** (scope) milti hai.

OpenID Connect (OIDC) = OAuth 2.0 + **authentication layer** (ID token with user identity).

---

## Day 31–32: DPoP — RFC 9449

### Bearer Token ka Problem

```
Authorization: Bearer eyJhbGciOiJSUzI1NiI...

Yeh token:
- Agar log mein leak ho gaya → attacker use kar sakta hai
- Agar proxy ne capture kiya → attacker use kar sakta hai  
- Agar MITM attack hua → attacker use kar sakta hai
- Kisi bhi machine se, kisi bhi IP se → WORKS

Bearer token = cash. Jiske paas hai, uska hai.
```

### DPoP Concept — Proof of Possession

**DPoP (Demonstrating Proof of Possession)** token ko client ke private key se **bind** karta hai. Token chori karna useless hai bina private key ke.

```
Bearer Token = Cash      → Koi bhi use kar sakta hai
DPoP Token   = Credit Card + PIN  → Card ke saath PIN bhi chahiye
```

### DPoP Flow — Step by Step

```
Step 1: Client generates a key pair (once)
─────────────────────────────────────────
  privateKey, publicKey = generateKeyPair()
  // Private key client ke paas safe hai
  // Public key share hogi

Step 2: Token request with DPoP proof
──────────────────────────────────────
  POST /token
  DPoP: <signed JWT proof>
  Body: grant_type=authorization_code&code=xxx

  DPoP Proof JWT:
  {
    "typ": "dpop+jwt",
    "alg": "ES256",
    "jwk": {            ← client ka PUBLIC key
      "kty": "EC",
      "crv": "P-256",
      "x": "...",
      "y": "..."
    }
  }
  .
  {
    "jti": "unique-id-12345",     ← unique, replay prevention
    "htm": "POST",                 ← HTTP method
    "htu": "https://auth.example.com/token",  ← URL
    "iat": 1689840000              ← issued at (timestamp)
  }
  .
  <signature with private key>

Step 3: Auth server issues DPoP-bound access token
────────────────────────────────────────────────────
  Access Token Payload:
  {
    "sub": "user_123",
    "cnf": {
      "jkt": "sha256-thumbprint-of-client-public-key"
      // ↑ Token is BOUND to this specific public key
    }
  }

Step 4: API request with DPoP proof
─────────────────────────────────────
  GET /api/balance
  Authorization: DPoP <access_token>      ← "DPoP" scheme, not "Bearer"
  DPoP: <new signed JWT proof>

  New DPoP Proof:
  {
    "jti": "another-unique-id",
    "htm": "GET",
    "htu": "https://api.example.com/api/balance",
    "iat": 1689840100,
    "ath": "sha256-hash-of-access-token"  ← binds proof to token
  }
  .
  <signature with SAME private key>

Step 5: Resource server validates
──────────────────────────────────
  1. Verify DPoP proof signature ✓
  2. Check htm matches actual HTTP method (GET) ✓
  3. Check htu matches actual URL ✓
  4. Check iat is recent (not too old) ✓
  5. Check jti hasn't been seen before (replay check) ✓
  6. Extract public key from proof → compute thumbprint
  7. Compare thumbprint with access token's cnf.jkt ✓
     → MATCH! Caller has the private key. Access granted.
```

### Nonce Binding — Extra Replay Protection

```
Step 1: Client makes request without nonce
  → Server responds: 401 + DPoP-Nonce: server-nonce-xyz

Step 2: Client makes new DPoP proof WITH nonce
  DPoP Proof: {
    "jti": "new-unique-id",
    "htm": "GET",
    "htu": "https://api.example.com/resource",
    "iat": 1689840200,
    "nonce": "server-nonce-xyz"    ← server-issued nonce
  }

Step 3: Server validates nonce matches what it issued ✓
```

**Nonce kyun?** Bina nonce ke, attacker ek valid DPoP proof capture karke immediately replay kar sakta hai (before jti expiry check). Server-issued nonce ensure karta hai ki proof specifically is interaction ke liye bana hai.

### DPoP Implementation Summary

```go
// 1. Generate EC key pair (one-time)
privateKey, _ := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
publicKey := privateKey.PublicKey

// 2. Create DPoP proof for each request
func createDPoPProof(method, url string, privateKey *ecdsa.PrivateKey, ath string) string {
    header := map[string]interface{}{
        "typ": "dpop+jwt",
        "alg": "ES256",
        "jwk": publicKeyToJWK(&privateKey.PublicKey),
    }
    payload := map[string]interface{}{
        "jti": generateUUID(),
        "htm": method,
        "htu": url,
        "iat": time.Now().Unix(),
    }
    if ath != "" {
        payload["ath"] = sha256Hash(ath)  // access token hash
    }
    return signJWT(header, payload, privateKey)
}

// 3. Validate DPoP proof on resource server
func validateDPoP(proof, accessToken string, method, url string) error {
    // Parse and verify signature
    // Check htm == actual method
    // Check htu == actual URL
    // Check iat is recent (within 5 minutes)
    // Check jti not in Redis (replay detection)
    // Store jti in Redis with short TTL
    // Compute JWK thumbprint, compare with token's cnf.jkt
    return nil
}
```

### FAPI 2.0 — Why DPoP Matters

**FAPI = Financial-grade API Security Profile.** Banks, payment processors, fintech companies ke liye mandatory standards.

FAPI 2.0 **requires DPoP** (ya equivalent proof-of-possession). Bearer tokens allowed nahi hain financial APIs ke liye.

**Agar tum fintech mein kaam karte ho, DPoP mandatory hai, optional nahi.**

---

## Day 33–35: API Security Hardening

### Rate Limiting — Different Strategies

Rate limiting ek hi cheez nahi hai — different dimensions pe different limits chahiye:

```
Per IP:        100 req/min     → Brute force protection
Per User:      1000 req/min    → Fair usage
Per Endpoint:  
  POST /login: 5 req/min      → Credential stuffing protection
  GET /search: 30 req/min     → Expensive query protection
  GET /health: unlimited       → Monitoring ko block mat karo
Per API Key:   varies          → Paid tier ke hisaab se
```

**Implementation patterns:**

1. **Fixed Window:** Minute boundary pe counter reset. Simple but bursty at boundaries.
2. **Sliding Window:** Last 60 seconds ka count. Smoother but slightly more memory.
3. **Token Bucket:** Tokens refill at constant rate. Allows bursts up to bucket size. **Best for most APIs.**
4. **Leaky Bucket:** Requests process at constant rate. Queue overflow = reject. Good for smoothing.

**Response when rate limited:**
```
HTTP/1.1 429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1689840060

{
    "type": "https://api.example.com/errors/rate-limited",
    "title": "Rate Limit Exceeded",
    "status": 429,
    "detail": "You have exceeded 100 requests per minute. Try again in 30 seconds."
}
```

### CORS — Cross-Origin Resource Sharing

**CORS browser ka protection hai, server ka nahi.** Curl se CORS bypass ho jaata hai. Yeh sirf browsers enforce karte hain.

**Preflight request:**
```
Browser: "Kya main https://app.com se https://api.com pe POST kar sakta hoon?"

OPTIONS /api/data HTTP/1.1
Origin: https://app.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type, Authorization

Server: "Haan, allowed hai."

Access-Control-Allow-Origin: https://app.com
Access-Control-Allow-Methods: POST, GET
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

**Common mistakes:**

```
❌ Access-Control-Allow-Origin: *
   WITH credentials — yeh WORK NAHI KAREGA (browser block karega)
   AND it's a security risk

❌ Reflecting the Origin header back without validation
   Origin: https://evil.com
   Access-Control-Allow-Origin: https://evil.com  ← OPEN DOOR!

✅ Whitelist specific origins:
   allowedOrigins := map[string]bool{
       "https://app.example.com": true,
       "https://admin.example.com": true,
   }
```

### SSRF — Server-Side Request Forgery

**Problem:** Tumhara API ek URL accept karta hai aur usse fetch karta hai (image preview, webhook, etc.). Attacker internal URLs bhejta hai:

```
POST /api/fetch-preview
{"url": "http://169.254.169.254/latest/meta-data/iam/security-credentials/"}
```

`169.254.169.254` AWS metadata endpoint hai. Agar server ne yeh fetch kiya, toh attacker ko AWS credentials mil jaayenge!

**SSRF Prevention checklist:**

```go
func validateURL(rawURL string) error {
    u, err := url.Parse(rawURL)
    if err != nil {
        return err
    }
    
    // 1. Only allow HTTPS
    if u.Scheme != "https" {
        return errors.New("only HTTPS allowed")
    }
    
    // 2. Resolve hostname to IP and check
    ips, err := net.LookupHost(u.Hostname())
    if err != nil {
        return err
    }
    
    for _, ip := range ips {
        parsed := net.ParseIP(ip)
        // 3. Block private/internal IPs
        if parsed.IsLoopback() ||       // 127.0.0.0/8
           parsed.IsPrivate() ||        // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
           parsed.IsLinkLocalUnicast() { // 169.254.0.0/16 (AWS metadata!)
            return errors.New("internal IPs not allowed")
        }
    }
    
    // 4. Don't follow redirects (or validate redirect targets too)
    // 5. Set timeout on outbound request
    // 6. Limit response size
    
    return nil
}
```

### Input Validation — Trust Nothing

```go
// ❌ WRONG — trusting client data deep inside the app
func CreateOrder(ctx context.Context, req CreateOrderRequest) error {
    // No validation, directly using req.Price
    order := Order{Price: req.Price}  // Client ne price 0 bhej diya? 
    return db.Insert(order)
}

// ✅ CORRECT — validate at the boundary
func CreateOrderHandler(w http.ResponseWriter, r *http.Request) {
    var req CreateOrderRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        respondError(w, 400, "invalid JSON")
        return
    }
    
    // Validate at the boundary
    if req.Price <= 0 {
        respondError(w, 422, "price must be positive")
        return
    }
    if req.Quantity < 1 || req.Quantity > 100 {
        respondError(w, 422, "quantity must be between 1 and 100")
        return
    }
    if len(req.Notes) > 500 {
        respondError(w, 422, "notes too long")
        return
    }
    
    // Now safe to pass to service layer
    svc.CreateOrder(ctx, req)
}
```

**Rule:** Validate at system boundaries (HTTP handlers, message consumers, CLI input). Inner layers assume valid data.

### SQL Injection — Parameterized Queries Only

```go
// ❌ CATASTROPHICALLY WRONG
query := fmt.Sprintf("SELECT * FROM users WHERE email = '%s'", userInput)
// userInput = "'; DROP TABLE users; --"
// Query becomes: SELECT * FROM users WHERE email = ''; DROP TABLE users; --'

// ✅ CORRECT — parameterized query
row := db.QueryRow("SELECT * FROM users WHERE email = $1", userInput)
// Database treats userInput as DATA, not SQL code
// Even if input contains SQL, it's treated as a string value
```

**Yeh non-negotiable hai. Koi bhi situation mein string concatenation se SQL mat banao.**

### Secrets Management

```
❌ WRONG ways to handle secrets:

1. Code mein hardcode:
   const API_KEY = "sk_live_abc123"  // git mein commit ho jayega

2. .env file committed:
   API_KEY=sk_live_abc123           // git history mein rahega forever

3. Environment variable (slightly better but still risky):
   - Process dumps mein visible
   - CI/CD logs mein leak ho sakta hai
   - Child processes inherit karte hain
   - /proc/PID/environ se readable

✅ CORRECT ways:

1. Secret Manager (HashiCorp Vault, AWS Secrets Manager):
   - Secrets encrypted at rest
   - Access control + audit log
   - Automatic rotation
   - Short-lived credentials (dynamic secrets)

2. If env vars are necessary:
   - Never log env vars
   - Use .env files ONLY locally, never commit
   - Rotate regularly
   - Restrict access to production env
```

**Secrets in logs — silent killer:**
```go
// ❌ Accidentally logging auth header
log.Printf("Request: %+v", request)  // prints ALL headers including Authorization!

// ✅ Sanitize before logging
log.Printf("Request: method=%s path=%s", r.Method, r.URL.Path)
```

---

## Projects Quick Reference

### Project 1: Production-grade REST API in Go

**Architecture:** Hexagonal (Ports & Adapters)
```
cmd/
  server/main.go          → Entry point, wire everything
internal/
  domain/                 → Business logic (NO framework imports)
    user.go               → User entity
    user_repository.go    → Interface (port)
    user_service.go       → Business rules
  adapter/
    http/                 → Gin handlers (adapter)
    postgres/             → DB implementation (adapter)
    redis/                → Cache/session implementation
pkg/
  middleware/             → Auth, rate limit, logging, error handling
```

**Key features:**
- JWT auth: 15-min access + 7-day refresh (Redis)
- Rate limiting: 100 req/min per user ID
- Structured JSON logging (zap) with request IDs
- Graceful shutdown: `signal.NotifyContext`
- RFC 7807 error responses
- Dockerfile for deployment

### Project 2: gRPC Service with TLS + Interceptors

**4 endpoints:** CreateUser, GetUser, ListUsers (server streaming), DeleteUser
**3 interceptors chained:** Logging → Auth → Recovery
**Self-signed TLS** for encrypted transport
**Test with:** `grpcurl -plaintext localhost:50051 describe`

### Project 3: OAuth 2.0 + DPoP Authorization Server

**Flow:** Auth Code + PKCE → DPoP-bound access token
**Validation:** Every request pe DPoP proof verify (method, URL, timestamp, jti uniqueness in Redis)
**Demo:** Bearer token rejected, DPoP token with matching key accepted

---

## Real-World Company Examples (Summary)

| Company | Kya kiya | Lesson |
|---------|----------|--------|
| **Stripe** | Date-based API versioning per API key | Breaking changes kabhi existing clients ko nahi todte. Engineering investment = product moat. |
| **Uber** | 1000+ services REST → gRPC migrate kiye | Protobuf contracts ne undocumented API change bugs eliminate kiye. 30% serialization overhead kam hua. |
| **Auth0/Okta** | DPoP support ship kiya for FAPI 2.0 | Financial APIs ke liye bearer tokens ab acceptable nahi. DPoP mandatory hai. |
| **GitHub** | REST → GraphQL (API v4) | N+1 DataLoader se solve kiya. Introspection expensive thi → query complexity limits + persisted queries add kiye. |

---

## Phase 2 Mastery Checklist

- [ ] G-M-P scheduler explain kar sako — goroutine scheduling, work stealing
- [ ] Goroutine leaks detect aur prevent kar sako — context cancellation, goleak
- [ ] Channels aur select ka proper use — unbuffered vs buffered, graceful shutdown
- [ ] REST endpoints design karo — correct methods, status codes, pagination, errors
- [ ] Idempotency keys samjho — POST retries safe kaise banayein
- [ ] gRPC service build karo — protobuf, streaming, interceptors, deadlines
- [ ] GraphQL N+1 problem aur DataLoader explain karo
- [ ] JWT security pitfalls — `alg: none`, revocation, JWS vs JWE
- [ ] OAuth 2.0 Authorization Code + PKCE flow implement kar sako
- [ ] Refresh token rotation aur theft detection samjho
- [ ] DPoP — RFC 9449 end-to-end: key generation, proof signing, validation
- [ ] SSRF prevention — URL validation, IP blocking, redirect handling
- [ ] SQL injection prevention — parameterized queries only
- [ ] Secrets management — Vault vs env vars, log sanitization
- [ ] Rate limiting strategies — per IP, per user, per endpoint
- [ ] CORS properly configure karo — no wildcard with credentials

---

## Resources

- *The Go Programming Language* — Donovan & Kernighan
- *Learning Go* — Jon Bodner (covers generics, modern Go)
- RFC 6749 — OAuth 2.0 (full spec padho)
- RFC 9449 — DPoP (20 pages, poora padho)
- RFC 7807 — Problem Details for HTTP APIs
- Stripe API docs — REST API design ka gold standard
- `grpc-go` examples on GitHub
- OAuth.com — interactive OAuth tutorials
- `man 7 tcp` — TCP internals
