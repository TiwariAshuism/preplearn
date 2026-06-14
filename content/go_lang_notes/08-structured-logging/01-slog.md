# 01 — Structured Logging (log/slog)
> Go 1.21+ structured logging — handlers, levels, groups, performance

---

## slog Basics

```go
import "log/slog"

// Default logger (text output to stderr)
slog.Info("server started", "port", 8080)
// 2024/01/15 10:30:00 INFO server started port=8080

slog.Debug("debug info", "key", "value")
slog.Warn("disk usage high", "percent", 92.5)
slog.Error("failed to connect", "err", err, "host", "db.example.com")

// With context
slog.InfoContext(ctx, "request handled", "path", r.URL.Path)
```

---

## Handlers

### TextHandler (human-readable)
```go
logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
    Level: slog.LevelDebug,
}))
logger.Info("user login", "user", "ashutosh", "ip", "192.168.1.1")
// time=2024-01-15T10:30:00.000+05:30 level=INFO msg="user login" user=ashutosh ip=192.168.1.1
```

### JSONHandler (machine-readable / production)
```go
logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
    Level: slog.LevelInfo,
}))
logger.Info("user login", "user", "ashutosh", "ip", "192.168.1.1")
// {"time":"2024-01-15T10:30:00.000+05:30","level":"INFO","msg":"user login","user":"ashutosh","ip":"192.168.1.1"}
```

### Set as Default
```go
slog.SetDefault(logger)
// Now slog.Info() etc. use this logger
// Also redirects old log.Println() calls!
```

---

## Log Levels

```go
// Built-in levels (increasing severity)
slog.LevelDebug  // -4
slog.LevelInfo   //  0  (default)
slog.LevelWarn   //  4
slog.LevelError  //  8

// Custom levels
const LevelTrace = slog.Level(-8)
const LevelFatal = slog.Level(12)

// Dynamic level (change at runtime)
var level slog.LevelVar
level.Set(slog.LevelDebug)

logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
    Level: &level,  // pointer! dynamic level
}))

// Later, in runtime:
level.Set(slog.LevelWarn)  // now only WARN and above
```

---

## Handler Options

```go
opts := &slog.HandlerOptions{
    Level: slog.LevelDebug,
    
    // Add source file info
    AddSource: true,
    // → "source":{"function":"main.main","file":"main.go","line":25}
    
    // Replace attributes
    ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
        // Remove time from output
        if a.Key == slog.TimeKey {
            return slog.Attr{}
        }
        // Rename level to severity
        if a.Key == slog.LevelKey {
            a.Key = "severity"
        }
        // Custom level names
        if a.Key == slog.LevelKey {
            level := a.Value.Any().(slog.Level)
            switch {
            case level < slog.LevelInfo:
                a.Value = slog.StringValue("TRACE")
            case level >= slog.Level(12):
                a.Value = slog.StringValue("FATAL")
            }
        }
        return a
    },
}
```

---

## Structured Attributes

### slog.Attr (Type-Safe)
```go
// Key-value pairs (alternating)
slog.Info("request", "method", "GET", "path", "/api", "status", 200)

// Typed attributes (slightly more efficient)
slog.Info("request",
    slog.String("method", "GET"),
    slog.String("path", "/api"),
    slog.Int("status", 200),
    slog.Duration("latency", 42*time.Millisecond),
    slog.Time("timestamp", time.Now()),
    slog.Bool("cached", true),
    slog.Float64("score", 0.95),
    slog.Any("headers", headers),
)
```

### Groups
```go
// Group related attributes
slog.Info("request",
    slog.Group("http",
        slog.String("method", "GET"),
        slog.Int("status", 200),
    ),
    slog.Group("user",
        slog.String("id", "u123"),
        slog.String("role", "admin"),
    ),
)
// JSON: {"msg":"request","http":{"method":"GET","status":200},"user":{"id":"u123","role":"admin"}}
// Text: msg=request http.method=GET http.status=200 user.id=u123 user.role=admin
```

---

## Logger With — Reusable Context

```go
// Add common fields to all messages
logger := slog.Default()

// With adds key-value pairs
reqLogger := logger.With("request_id", requestID, "user_id", userID)
reqLogger.Info("processing request")
reqLogger.Info("request complete", "status", 200)
// Both messages will include request_id and user_id

// WithGroup adds a group prefix
httpLogger := logger.WithGroup("http")
httpLogger.Info("request", "method", "GET", "path", "/api")
// JSON: {"msg":"request","http":{"method":"GET","path":"/api"}}
```

---

## LogValuer Interface — Lazy Evaluation

```go
// Expensive values computed only if level is enabled
type User struct {
    ID    string
    Name  string
    Email string
}

// Implement LogValuer
func (u User) LogValue() slog.Value {
    return slog.GroupValue(
        slog.String("id", u.ID),
        slog.String("name", u.Name),
        // Email excluded from logs (PII!)
    )
}

slog.Info("user action", "user", user)
// {"msg":"user action","user":{"id":"u123","name":"Ashutosh"}}
```

### Lazy/Expensive Values
```go
// Only computed if log level is enabled
type LazyStats struct{}
func (s LazyStats) LogValue() slog.Value {
    // Expensive computation
    stats := computeExpensiveStats()
    return slog.GroupValue(
        slog.Int("goroutines", stats.Goroutines),
        slog.Int64("memory_mb", stats.MemoryMB),
    )
}

slog.Debug("system stats", "stats", LazyStats{})
// If level > Debug, computeExpensiveStats() is NEVER called!
```

---

## Custom Handler

```go
type ColorHandler struct {
    slog.Handler
    w io.Writer
}

func (h *ColorHandler) Handle(ctx context.Context, r slog.Record) error {
    var color string
    switch {
    case r.Level >= slog.LevelError:
        color = "\033[31m"  // red
    case r.Level >= slog.LevelWarn:
        color = "\033[33m"  // yellow
    case r.Level >= slog.LevelInfo:
        color = "\033[32m"  // green
    default:
        color = "\033[36m"  // cyan
    }
    
    fmt.Fprintf(h.w, "%s%s\033[0m %s", color, r.Level, r.Message)
    r.Attrs(func(a slog.Attr) bool {
        fmt.Fprintf(h.w, " %s=%v", a.Key, a.Value)
        return true
    })
    fmt.Fprintln(h.w)
    return nil
}

func (h *ColorHandler) Enabled(_ context.Context, level slog.Level) bool {
    return level >= slog.LevelDebug
}
```

---

## Performance Tips

```go
// 1. Check level before expensive work
if logger.Enabled(ctx, slog.LevelDebug) {
    logger.Debug("detailed info", "data", expensiveSerialize(obj))
}

// 2. Use typed attrs instead of any
slog.Int("count", n)     // ✅ faster
slog.Any("count", n)     // ❌ slower (boxing)

// 3. Pre-allocate logger with common fields
logger = logger.With("service", "api", "version", "v2")

// 4. Use LogValuer for lazy evaluation
// 5. Use JSONHandler for production (faster parsing downstream)
```

---

## Production Setup Example

```go
func setupLogger(env string) *slog.Logger {
    var handler slog.Handler
    
    opts := &slog.HandlerOptions{
        AddSource: env != "production",
    }
    
    switch env {
    case "production":
        opts.Level = slog.LevelInfo
        handler = slog.NewJSONHandler(os.Stdout, opts)
    case "development":
        opts.Level = slog.LevelDebug
        handler = slog.NewTextHandler(os.Stdout, opts)
    default:
        opts.Level = slog.LevelDebug
        handler = slog.NewTextHandler(os.Stdout, opts)
    }
    
    logger := slog.New(handler)
    slog.SetDefault(logger)
    return logger
}
```

---

## Old log Package (Quick Reference)

```go
import "log"

log.Println("message")
log.Printf("user %s logged in", name)
log.Fatal("critical error")  // Println + os.Exit(1)
log.Panic("panic!")           // Println + panic()

// Custom logger
logger := log.New(os.Stderr, "[APP] ", log.Ldate|log.Ltime|log.Lshortfile)
logger.Println("custom prefix")
// [APP] 2024/01/15 10:30:00 main.go:42: custom prefix

// Flags
log.Ldate         // date
log.Ltime         // time
log.Lmicroseconds // microseconds
log.Llongfile     // full file path
log.Lshortfile    // short file name
log.LUTC          // UTC time
log.Lmsgprefix    // prefix before message (not before date)
```
