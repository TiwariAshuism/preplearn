# 01 — Network & HTTP
> net package, HTTP client/server, HTTP/2, CGI, httptest, tracing

---

## net Package — Low-Level Networking

### TCP Server
```go
import "net"

listener, err := net.Listen("tcp", ":8080")
if err != nil { log.Fatal(err) }
defer listener.Close()

for {
    conn, err := listener.Accept()
    if err != nil { continue }
    
    go handleConn(conn)
}

func handleConn(conn net.Conn) {
    defer conn.Close()
    
    // Set deadlines (IMPORTANT for production!)
    conn.SetReadDeadline(time.Now().Add(30 * time.Second))
    
    buf := make([]byte, 1024)
    n, err := conn.Read(buf)
    conn.Write([]byte("Hello from server!"))
}
```

### TCP Client
```go
conn, err := net.Dial("tcp", "example.com:80")
defer conn.Close()

conn.Write([]byte("GET / HTTP/1.1\r\nHost: example.com\r\n\r\n"))
response := make([]byte, 4096)
n, _ := conn.Read(response)
fmt.Println(string(response[:n]))
```

### UDP
```go
// Server
addr, _ := net.ResolveUDPAddr("udp", ":9090")
conn, _ := net.ListenUDP("udp", addr)
defer conn.Close()

buf := make([]byte, 1024)
n, remoteAddr, _ := conn.ReadFromUDP(buf)
conn.WriteToUDP([]byte("pong"), remoteAddr)

// Client
conn, _ := net.Dial("udp", "localhost:9090")
conn.Write([]byte("ping"))
```

### DNS Lookup
```go
// Simple lookup
addrs, err := net.LookupHost("google.com")

// With custom resolver
resolver := &net.Resolver{
    PreferGo: true,  // Use Go's DNS resolver (not cgo)
    Dial: func(ctx context.Context, network, address string) (net.Conn, error) {
        d := net.Dialer{Timeout: 5 * time.Second}
        return d.DialContext(ctx, "udp", "8.8.8.8:53")
    },
}
addrs, err := resolver.LookupHost(context.Background(), "google.com")
```

### net.Dialer — Advanced Connection
```go
dialer := &net.Dialer{
    Timeout:   30 * time.Second,
    KeepAlive: 30 * time.Second,
    LocalAddr: &net.TCPAddr{IP: net.ParseIP("192.168.1.100")},
}
conn, err := dialer.DialContext(ctx, "tcp", "example.com:443")
```

---

## net/http — HTTP Server

### Basic Server
```go
import "net/http"

func main() {
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello, %s!", r.URL.Path[1:])
    })
    
    http.HandleFunc("/api/users", usersHandler)
    
    log.Fatal(http.ListenAndServe(":8080", nil))
}

func usersHandler(w http.ResponseWriter, r *http.Request) {
    switch r.Method {
    case http.MethodGet:
        // list users
    case http.MethodPost:
        // create user
    default:
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
    }
}
```

### ServeMux (Go 1.22+ Enhanced Routing)
```go
mux := http.NewServeMux()

// Exact match
mux.HandleFunc("GET /api/users", listUsers)
mux.HandleFunc("POST /api/users", createUser)

// Path parameters (Go 1.22+)
mux.HandleFunc("GET /api/users/{id}", func(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    fmt.Fprintf(w, "User: %s", id)
})

// Wildcard
mux.HandleFunc("GET /files/{path...}", func(w http.ResponseWriter, r *http.Request) {
    path := r.PathValue("path")  // matches everything after /files/
})

// Host-specific
mux.HandleFunc("api.example.com/", apiHandler)

server := &http.Server{
    Addr:    ":8080",
    Handler: mux,
}
log.Fatal(server.ListenAndServe())
```

### Production Server Configuration
```go
server := &http.Server{
    Addr:         ":8080",
    Handler:      mux,
    ReadTimeout:  15 * time.Second,
    WriteTimeout: 15 * time.Second,
    IdleTimeout:  60 * time.Second,
    MaxHeaderBytes: 1 << 20, // 1 MB
}

// TLS
server.ListenAndServeTLS("cert.pem", "key.pem")

// Graceful shutdown
go func() {
    sigCh := make(chan os.Signal, 1)
    signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)
    <-sigCh
    
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    server.Shutdown(ctx)
}()
```

### Middleware Pattern
```go
// Middleware = function that wraps a handler
func loggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        next.ServeHTTP(w, r)
        log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
    })
}

func authMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        if !isValid(token) {
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        }
        next.ServeHTTP(w, r)
    })
}

// Chain middlewares
handler := loggingMiddleware(authMiddleware(mux))
```

---

## net/http — HTTP Client

### Basic Requests
```go
// Simple GET
resp, err := http.Get("https://api.example.com/users")
defer resp.Body.Close()
body, _ := io.ReadAll(resp.Body)

// Simple POST
resp, err := http.Post("https://api.example.com/users",
    "application/json",
    strings.NewReader(`{"name":"Ashutosh"}`))

// POST form
resp, err := http.PostForm("https://example.com/login",
    url.Values{"user": {"admin"}, "pass": {"secret"}})
```

### Custom Client (Production)
```go
client := &http.Client{
    Timeout: 30 * time.Second,
    Transport: &http.Transport{
        MaxIdleConns:        100,
        MaxIdleConnsPerHost: 10,
        MaxConnsPerHost:     100,
        IdleConnTimeout:     90 * time.Second,
        TLSHandshakeTimeout: 10 * time.Second,
        DisableCompression:  false,
        
        // Connection pooling configured!
        // Connections reuse hoti hain by default
    },
}

// Custom request
req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
req.Header.Set("Authorization", "Bearer "+token)
req.Header.Set("Content-Type", "application/json")
req.Header.Set("Accept", "application/json")

resp, err := client.Do(req)
defer resp.Body.Close()
```

### Response Handling
```go
resp, err := client.Do(req)
if err != nil {
    log.Fatal(err)
}
defer resp.Body.Close()

// Status check
if resp.StatusCode != http.StatusOK {
    body, _ := io.ReadAll(resp.Body)
    log.Fatalf("Status %d: %s", resp.StatusCode, body)
}

// JSON decode
var result ApiResponse
json.NewDecoder(resp.Body).Decode(&result)

// Headers
contentType := resp.Header.Get("Content-Type")
```

---

## HTTP/2

```go
// HTTP/2 automatically enabled with TLS!
server := &http.Server{
    Addr:    ":443",
    Handler: mux,
}
server.ListenAndServeTLS("cert.pem", "key.pem")
// → Clients automatically negotiate HTTP/2

// HTTP/2 Server Push (deprecated in most browsers)
if pusher, ok := w.(http.Pusher); ok {
    pusher.Push("/style.css", nil)
}

// Force HTTP/2 without TLS (h2c) — for internal services
import "golang.org/x/net/http2"
import "golang.org/x/net/http2/h2c"

h2s := &http2.Server{}
handler := h2c.NewHandler(mux, h2s)
http.ListenAndServe(":8080", handler)
```

---

## net/http/httptest — Testing HTTP

### Test Server
```go
import "net/http/httptest"

func TestAPI(t *testing.T) {
    // Create test server
    ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
    }))
    defer ts.Close()
    
    // Make request to test server
    resp, err := http.Get(ts.URL + "/api/health")
    // assert...
}

// TLS test server
ts := httptest.NewTLSServer(handler)
client := ts.Client()  // pre-configured client
```

### Test ResponseRecorder
```go
func TestHandler(t *testing.T) {
    req := httptest.NewRequest("GET", "/users/123", nil)
    w := httptest.NewRecorder()
    
    usersHandler(w, req)
    
    resp := w.Result()
    body, _ := io.ReadAll(resp.Body)
    
    if resp.StatusCode != 200 {
        t.Errorf("expected 200, got %d", resp.StatusCode)
    }
    if !strings.Contains(string(body), "Ashutosh") {
        t.Errorf("unexpected body: %s", body)
    }
}
```

---

## net/http/httptrace — Request Tracing

```go
import "net/http/httptrace"

trace := &httptrace.ClientTrace{
    DNSStart: func(info httptrace.DNSStartInfo) {
        fmt.Printf("DNS start: %s\n", info.Host)
    },
    DNSDone: func(info httptrace.DNSDoneInfo) {
        fmt.Printf("DNS done: %v\n", info.Addrs)
    },
    ConnectStart: func(network, addr string) {
        fmt.Printf("Connect start: %s %s\n", network, addr)
    },
    ConnectDone: func(network, addr string, err error) {
        fmt.Printf("Connect done: %s %s (err: %v)\n", network, addr, err)
    },
    GotConn: func(info httptrace.GotConnInfo) {
        fmt.Printf("Got conn: reused=%v idle=%v\n", info.Reused, info.WasIdle)
    },
    TLSHandshakeStart: func() {
        fmt.Println("TLS handshake start")
    },
    TLSHandshakeDone: func(state tls.ConnectionState, err error) {
        fmt.Printf("TLS done: %s\n", state.NegotiatedProtocol)
    },
    GotFirstResponseByte: func() {
        fmt.Println("Got first response byte (TTFB)")
    },
}

req, _ := http.NewRequest("GET", "https://api.example.com", nil)
req = req.WithContext(httptrace.WithClientTrace(req.Context(), trace))
http.DefaultClient.Do(req)
```

---

## net/http/pprof — HTTP Profiling

```go
import _ "net/http/pprof"

// Just import the package!
// Automatically registers:
// /debug/pprof/
// /debug/pprof/cmdline
// /debug/pprof/profile
// /debug/pprof/symbol
// /debug/pprof/trace
// /debug/pprof/goroutine
// /debug/pprof/heap
// /debug/pprof/block
// /debug/pprof/mutex

go http.ListenAndServe("localhost:6060", nil)
```

```bash
# Analyze
go tool pprof http://localhost:6060/debug/pprof/heap
go tool pprof http://localhost:6060/debug/pprof/profile?seconds=30
curl http://localhost:6060/debug/pprof/goroutine?debug=1
```

---

## CGI / FastCGI

```go
// CGI (legacy)
import "net/http/cgi"
handler := &cgi.Handler{
    Path: "/usr/bin/php",
    Dir:  "/var/www",
}

// FastCGI (for PHP-FPM, etc.)
import "net/http/fcgi"
fcgi.Serve(listener, http.DefaultServeMux)
```

---

## Common HTTP Patterns

### File Server
```go
// Serve static files
fs := http.FileServer(http.Dir("./static"))
http.Handle("/static/", http.StripPrefix("/static/", fs))

// Embedded files (Go 1.16+)
//go:embed static/*
var staticFiles embed.FS
http.Handle("/", http.FileServer(http.FS(staticFiles)))
```

### Reverse Proxy
```go
import "net/http/httputil"

target, _ := url.Parse("http://backend:3000")
proxy := httputil.NewSingleHostReverseProxy(target)
http.Handle("/api/", proxy)
```

### JSON API Helper
```go
func writeJSON(w http.ResponseWriter, status int, data any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(data)
}

func readJSON(r *http.Request, dst any) error {
    dec := json.NewDecoder(r.Body)
    dec.DisallowUnknownFields()
    return dec.Decode(dst)
}
```

### Context in Handlers
```go
func handler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    
    // Check if client disconnected
    select {
    case <-ctx.Done():
        return // client gone
    case result := <-doWork(ctx):
        writeJSON(w, 200, result)
    }
}
```
