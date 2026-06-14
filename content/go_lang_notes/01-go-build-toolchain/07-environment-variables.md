# 07 — Environment Variables: Go ka Configuration System
> Sab important env vars ek jagah — quick reference

---

## `go env` — Sab Variables Dekho

```bash
go env              # Saare Go environment variables
go env GOPATH       # Specific variable
go env GOPROXY GOMODCACHE  # Multiple variables

# JSON output
go env -json

# Permanently set karo (~/.config/go/env mein)
go env -w GOPROXY=https://goproxy.cn,direct
go env -w GOPRIVATE=*.mycompany.com

# Undo (delete from persistent config)
go env -u GOPROXY
```

---

## Complete Environment Variables Reference

### Module System Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `GO111MODULE` | `on` | Module-aware mode on/off/auto |
| `GOMODCACHE` | `$GOPATH/pkg/mod` | Module cache directory |
| `GOPROXY` | `https://proxy.golang.org,direct` | Module proxy list |
| `GOPRIVATE` | _(empty)_ | Private module prefixes |
| `GONOPROXY` | `$GOPRIVATE` | Proxy bypass patterns |
| `GONOSUMDB` | `$GOPRIVATE` | Checksum skip patterns |
| `GOSUMDB` | `sum.golang.org` | Checksum database |
| `GOINSECURE` | _(empty)_ | HTTP allowed patterns |
| `GOVCS` | _(default rules)_ | VCS tool control |
| `GOWORK` | _(auto-detect)_ | go.work file path |

### Build Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `GOOS` | Current OS | Target OS for compilation |
| `GOARCH` | Current arch | Target architecture |
| `CGO_ENABLED` | `1` | CGO on/off |
| `CC` | `gcc` | C compiler |
| `CXX` | `g++` | C++ compiler |
| `GOFLAGS` | _(empty)_ | Default flags for all commands |
| `GOEXPERIMENT` | _(empty)_ | Experimental features |

### Path Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `GOPATH` | `$HOME/go` | Go workspace root |
| `GOROOT` | Go install dir | Standard library location |
| `GOBIN` | `$GOPATH/bin` | Installed binaries |
| `GOTMPDIR` | System temp | Temp files during build |
| `GOCACHE` | Auto | Build cache directory |
| `GOENV` | Auto | Persistent env config file |
| `GOTOOLCHAIN` | `auto` | Toolchain management |

---

## Detail Mein — Important Variables

### `GOPATH`
```bash
# Default: $HOME/go (Linux/Mac), %USERPROFILE%\go (Windows)
GOPATH=/Users/ashutosh/go

# Structure:
$GOPATH/
├── bin/        ← go install se binaries
├── pkg/
│   └── mod/   ← module cache
└── src/       ← legacy GOPATH mode code
```

### `GOOS` aur `GOARCH` — Cross Compilation

```bash
# Current system
go env GOOS    # darwin / linux / windows
go env GOARCH  # amd64 / arm64 / 386

# Cross compile
GOOS=linux GOARCH=amd64 go build .
GOOS=windows GOARCH=386 go build .

# ARM (Raspberry Pi)
GOOS=linux GOARCH=arm GOARM=7 go build .
```

**GOOS valid values:**
```
aix android darwin dragonfly freebsd hurd illumos ios
js linux nacl netbsd openbsd plan9 solaris wasip1 windows zos
```

**GOARCH valid values:**
```
386 amd64 arm arm64 loong64 mips mips64 mips64le mipsle
ppc64 ppc64le riscv64 s390x sparc64 wasm
```

### `CGO_ENABLED`

```bash
# CGO off karo (pure Go binary, no C dependencies)
CGO_ENABLED=0 go build .

# Kab zaroori hai:
# → Static binary banana (no .so dependencies)
# → Alpine Linux containers
# → Cross compilation
# → Docker mein FROM scratch
```

```dockerfile
# Dockerfile example
FROM golang:1.22 AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o app .

FROM scratch        # minimal base
COPY --from=builder /app/app /app
ENTRYPOINT ["/app"]
```

### `GOFLAGS` — Default Flags

```bash
# Har go command pe -mod=vendor apply karo
GOFLAGS=-mod=vendor

# Multiple flags
GOFLAGS="-mod=vendor -trimpath"

# Read-write cache (testing ke liye)
go env -w GOFLAGS=-modcacherw
```

### `GOTOOLCHAIN` — Toolchain Management

```bash
# Auto (go.mod ki requirements ke anusaar)
GOTOOLCHAIN=auto   # default

# Current toolchain ke saath hi chalao
GOTOOLCHAIN=local

# Specific version force karo
GOTOOLCHAIN=go1.22.3

# Auto but minimum version
GOTOOLCHAIN=auto+go1.21.0
```

**How it works:**
1. `go.mod` mein `go 1.22` dekha
2. Current Go = 1.21
3. `GOTOOLCHAIN=auto` → Go 1.22 download karo
4. Build karo

### `GOWORK` — Workspace Control

```bash
# Workspace off karo (single module mode)
GOWORK=off go build .

# Specific go.work file
GOWORK=/path/to/go.work go build .

# Auto-detect (default)
GOWORK=""  # parent directories mein dhundo
```

### `GONOSUMDB` aur `GOPRIVATE`

```bash
# Glob patterns (path.Match syntax)
GOPRIVATE=*.corp.example.com,github.com/mycompany/*

# Ek baar set karo
go env -w GOPRIVATE=*.mycompany.com

# Multiple patterns
go env -w GOPRIVATE="*.corp.example.com,github.com/internal/*"
```

### `GOINSECURE`

```bash
# Specific modules ke liye HTTP allow karo
GOINSECURE=*.internal.company.org,10.0.0.*

# Note: Checksum validation still hota hai
# Checksum skip ke liye GONOSUMDB use karo
```

---

## Practical Setups

### Local Development
```bash
# ~/.config/go/env (ya go env -w se set)
GOPRIVATE=*.mycompany.com
GOPROXY=https://goproxy.corp.com,https://proxy.golang.org,direct
GONOSUMDB=*.mycompany.com
```

### CI/CD Environment
```bash
# .env ya CI variables mein:
GOPROXY=https://proxy.golang.org,direct
GONOSUMDB=*.internal.com
GOFLAGS=-mod=readonly    # go.mod change nahi hona chahiye CI mein
CGO_ENABLED=0
GOOS=linux
GOARCH=amd64
```

### China mein Development
```bash
go env -w GOPROXY=https://goproxy.cn,https://goproxy.io,direct
go env -w GOSUMDB=sum.golang.google.cn
```

### Air-gapped/Offline
```bash
GOPROXY=file:///path/to/module/cache,off
GONOSUMDB=*
GOFLAGS=-mod=vendor
```

### Docker Build Optimization
```bash
# Dockerfile ARG se pass karo
ARG GOPROXY=https://proxy.golang.org,direct
ARG GONOSUMDB=*.internal.corp

RUN --mount=type=cache,target=/go/pkg/mod \
    GOPROXY=${GOPROXY} \
    GONOSUMDB=${GONOSUMDB} \
    CGO_ENABLED=0 \
    go build -o /app ./cmd/server
```

---

## Build Information — `go version -m`

```bash
# Binary mein embed build info dekho
go version -m ./bin/myapp

# Output:
./bin/myapp: go1.22.0
        path    github.com/user/myapp/cmd/server
        mod     github.com/user/myapp  v1.2.3  h1:abc...
        dep     github.com/gin-gonic/gin  v1.9.1  h1:xyz...
        dep     go.uber.org/zap  v1.26.0  h1:def...
        build   -buildmode=exe
        build   -compiler=gc
        build   CGO_ENABLED=0
        build   GOARCH=amd64
        build   GOOS=linux
```

**Runtime se access karo:**
```go
import "runtime/debug"

func getBuildInfo() string {
    info, ok := debug.ReadBuildInfo()
    if !ok {
        return "unknown"
    }
    return info.Main.Version
}
```

---

## `go env` Output Sample

```bash
$ go env
GO111MODULE="on"
GOARCH="amd64"
GOBIN=""
GOCACHE="/Users/ashutosh/Library/Caches/go-build"
GOENV="/Users/ashutosh/Library/Application Support/go/env"
GOFLAGS=""
GOINSECURE=""
GOMODCACHE="/Users/ashutosh/go/pkg/mod"
GONOPROXY=""
GONOSUMDB=""
GOOS="darwin"
GOPATH="/Users/ashutosh/go"
GOPRIVATE=""
GOPROXY="https://proxy.golang.org,direct"
GOROOT="/usr/local/go"
GOSUMDB="sum.golang.org"
GOTOOLCHAIN="auto"
GOTMPDIR=""
GOWORK=""
```

---

## Quick Reference Card

```bash
# ====== Setup ======
go env -w GOPROXY=https://proxy.golang.org,direct
go env -w GOPRIVATE=*.mycompany.com
go env -w GOPATH=$HOME/go

# ====== Cross Compile ======
GOOS=linux GOARCH=amd64 go build -o app-linux .
GOOS=darwin GOARCH=arm64 go build -o app-mac .
GOOS=windows go build -o app.exe .

# ====== Static Binary ======
CGO_ENABLED=0 go build -o app .

# ====== Debug ======
go env GOPROXY
go env GOMODCACHE
go env GOROOT

# ====== Reset ======
go env -u GOPROXY  # Specific variable reset
```
