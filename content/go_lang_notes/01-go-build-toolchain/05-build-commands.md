# 05 — Build Commands: go build, test, install, generate
> Code se binary tak ka safar

---

## `go build` — Compilation

### Basic Usage
```bash
go build             # current package build karo
go build .           # current directory
go build ./...       # sab packages recursively
go build ./cmd/app   # specific package
go build main.go     # single file (temporary)
```

### Output Control
```bash
# Output file naam do
go build -o myapp .
go build -o ./dist/app ./cmd/server

# Specific directory mein
go build -o ./bin/ ./cmd/...  # sab binaries bin/ mein
```

### Cross-Compilation — Ek OS ke liye doosre OS ki binary

```bash
# Linux binary (macOS se)
GOOS=linux GOARCH=amd64 go build -o app-linux ./cmd/server

# Windows binary
GOOS=windows GOARCH=amd64 go build -o app.exe ./cmd/server

# macOS M1/M2 (Apple Silicon)
GOOS=darwin GOARCH=arm64 go build -o app-mac-arm ./cmd/server

# macOS Intel
GOOS=darwin GOARCH=amd64 go build -o app-mac-intel ./cmd/server
```

**Supported GOOS values:**
`linux`, `darwin`, `windows`, `freebsd`, `openbsd`, `netbsd`, `android`, `ios`, `wasm`

**Supported GOARCH values:**
`amd64`, `arm64`, `386`, `arm`, `wasm`, `mips`, `mips64`, `ppc64`, `s390x`, `riscv64`

---

## Build Flags — Advanced Options

### `-ldflags` — Linker Flags
```bash
# Version inject karo
go build -ldflags="-X main.version=v1.2.3" .

# Multiple variables
go build -ldflags="-X main.version=v1.2.3 -X main.buildTime=$(date +%s)" .

# Debug symbols hatao (binary chhoti hogi ~30%)
go build -ldflags="-s -w" .

# Sab combine karo (production build)
go build \
  -ldflags="-s -w -X main.version=$(git describe --tags --always)" \
  -trimpath \
  -o ./dist/app \
  ./cmd/server
```

**main.go mein:**
```go
package main

var (
    version   = "dev"   // -ldflags se inject hoga
    buildTime = "unknown"
)

func main() {
    fmt.Printf("Version: %s, Built: %s\n", version, buildTime)
}
```

### `-trimpath` — Paths Remove Karo
```bash
go build -trimpath .
```
Build artifacts se local filesystem paths remove karo. Production ke liye zaroori — security aur reproducibility ke liye.

### `-race` — Race Condition Detector
```bash
go build -race .      # Slower binary, runtime race detection ON
go test -race ./...   # Testing mein bhi use karo
```

Race conditions detect karne ke liye **development/testing** mein use karo. Production mein nahi (20x slower).

### `-tags` — Build Tags
```bash
# Custom tags ke saath build
go build -tags "production" .
go build -tags "integration_test,netgo" .
```

```go
//go:build production
package main

// Ye code sirf 'production' tag ke saath compile hoga
```

### `-gcflags` — Compiler Flags
```bash
# Inlining disable karo (debugging ke liye)
go build -gcflags="-N -l" .

# Optimization details dekho
go build -gcflags="-m" .

# Escape analysis
go build -gcflags="-m=2" ./...
```

### `-a` — Force Rebuild All
```bash
go build -a ./...   # Cache ignore karo, sab recompile karo
```

Normally build cache use hota hai — `-a` force rebuild karta hai.

### `-v` — Verbose
```bash
go build -v ./...   # Kaun se packages compile ho rahe hain?
```

---

## `go test` — Testing

### Basic Testing
```bash
go test ./...          # Sab tests chalao
go test .              # Current package
go test -v ./...       # Verbose (har test ka output)
go test -run TestFoo   # Specific test
go test -run "TestFoo|TestBar"  # Multiple tests (regex)

# Specific file test
go test -run TestSomething ./pkg/mypackage
```

### Test Flags

```bash
# Coverage
go test -cover ./...                  # Coverage percentage
go test -coverprofile=c.out ./...     # Detailed coverage file
go tool cover -html=c.out             # Browser mein dekho
go tool cover -func=c.out             # Function-wise breakdown

# Race detection (important!)
go test -race ./...

# Benchmarks
go test -bench=. ./...                 # Sab benchmarks
go test -bench=BenchmarkFoo ./...      # Specific benchmark
go test -bench=. -benchmem ./...       # Memory allocation bhi
go test -bench=. -count=5 ./...        # 5 baar chalao (stable results)

# Timeout
go test -timeout 30s ./...

# Parallel tests
go test -parallel 4 ./...

# Short mode (slow tests skip karo)
go test -short ./...

# Keep test binaries (debugging ke liye)
go test -c -o test.bin ./...
./test.bin -test.run TestFoo -test.v
```

### Test Output Formats
```bash
# JSON output (CI/CD ke liye)
go test -json ./... | tee results.json

# gotestsum (better output)
go install gotest.tools/gotestsum@latest
gotestsum --format dots ./...
gotestsum --format standard-verbose ./...
```

### Subtests
```go
func TestMath(t *testing.T) {
    t.Run("addition", func(t *testing.T) {
        if add(1, 2) != 3 {
            t.Error("wrong result")
        }
    })
    t.Run("subtraction", func(t *testing.T) {
        // ...
    })
}
```

```bash
# Subtest run karo
go test -run "TestMath/addition" ./...
```

---

## `go install` — Binary Install

```bash
# Current module ka binary install karo
go install ./cmd/server

# External tool install karo (go.mod se independent)
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
go install golang.org/x/tools/gopls@v0.14.0

# Specific binary ko install karo
go install github.com/user/repo/cmd/tool@v1.2.3
```

**Binary kahan jaati hai?**
```bash
go env GOBIN    # agar set hai
go env GOPATH   # $GOPATH/bin (default)
# ya $HOME/go/bin agar GOPATH nahi set
```

**Go 1.16+ se:** `go install` with version = recommended way tools install karne ka (go get use mat karo for tools).

---

## `go run` — Quick Execution

```bash
# Single file
go run main.go

# Multiple files
go run main.go utils.go config.go

# Current package
go run .

# Arguments
go run . --port=8080 --config=./config.yaml

# Package path
go run github.com/some/tool@latest  # direct execution
```

**Internally kya hota hai:**
1. Temp directory mein binary compile karo
2. Binary chalao
3. Exit ke baad delete karo

---

## `go generate` — Code Generation

```go
// source file mein comment likhte hain:
//go:generate stringer -type=Color
//go:generate protoc --go_out=. types.proto
//go:generate mockgen -source=interface.go -destination=mock.go

type Color int

const (
    Red Color = iota
    Green
    Blue
)
```

```bash
# Generate chalao
go generate ./...           # Sab packages
go generate ./pkg/models/...  # Specific directory

# Verbose
go generate -v ./...

# Dry run (kya run hoga sirf print karo)
go generate -n ./...
```

**Common generators:**
- `stringer` — enum ke liye String() method
- `mockgen` — interfaces ke mock
- `protoc` — protobuf code
- `wire` — dependency injection
- `sqlc` — SQL se Go code

---

## `go vet` — Code Quality Check

```bash
go vet ./...       # Suspicious code dhundo
go vet -v ./...    # Verbose
```

**Kya check karta hai:**
- `Printf` format string mismatches
- Unreachable code
- Struct tag syntax errors
- Copying sync.Mutex
- Wrong use of `testing.T`
- aur bahut kuch...

```bash
# Specific analyzer
go vet -printf=false ./...  # printf check disable

# Staticcheck (more comprehensive)
go install honnef.co/go/tools/cmd/staticcheck@latest
staticcheck ./...
```

---

## `go fmt` — Code Formatting

```bash
go fmt ./...      # Format karo (files modify karo)

# Check (modify mat karo, sirf diff dikhao)
gofmt -l .       # Modified files list karo
gofmt -d .       # Diff show karo

# gofmt directly
gofmt -w main.go  # Single file format
```

**goimports** (recommended — imports bhi fix karta hai):
```bash
go install golang.org/x/tools/cmd/goimports@latest
goimports -w ./...
```

---

## Build Constraints — Platform-Specific Code

### File Name Convention
```
server.go          ← sab platforms pe
server_linux.go    ← sirf Linux
server_windows.go  ← sirf Windows
server_darwin.go   ← sirf macOS
server_linux_amd64.go  ← sirf Linux + AMD64
```

### Build Tag Syntax (Go 1.17+)
```go
//go:build linux && (amd64 || arm64)

package server
```

**Old syntax (Go 1.16-):**
```go
// +build linux,amd64
// blank line required!

package server
```

**Common build constraints:**
```go
//go:build integration  // custom tag
//go:build !windows     // NOT windows
//go:build go1.18       // Go 1.18+
//go:build ignore       // Never compile (standalone tools)
//go:build cgo          // CGO enabled
```

---

## Build Cache — Speed Optimization

Go ek smart build cache maintain karta hai:

```bash
# Cache kahan hai?
go env GOCACHE

# Cache size dekho
go clean -cache -n  # dry run
du -sh $(go env GOCACHE)

# Cache clear karo
go clean -cache       # build cache
go clean -testcache   # test results cache
go clean -modcache    # module cache (different!)

# Cache stats
go build -x ./... 2>&1 | grep "cache hit"
```

**Cache hit kab nahi hota:**
- Source code change hua
- Dependencies change hui
- Build flags alag hain
- Go version change hua
- Environment variables change hue (GOOS, GOARCH, etc.)

---

## Production Build Checklist

```bash
#!/bin/bash
# Complete production build script

VERSION=$(git describe --tags --always --dirty)
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
COMMIT=$(git rev-parse --short HEAD)

# Clean previous build
rm -rf ./dist
mkdir -p ./dist

# Lint check
go vet ./...
staticcheck ./...  # agar installed hai

# Tests
go test -race -cover ./...

# Build for multiple platforms
for GOOS in linux darwin windows; do
  for GOARCH in amd64 arm64; do
    EXT=""
    if [ "$GOOS" = "windows" ]; then EXT=".exe"; fi
    
    OUTPUT="./dist/app-${GOOS}-${GOARCH}${EXT}"
    
    CGO_ENABLED=0 \
    GOOS=$GOOS \
    GOARCH=$GOARCH \
    go build \
      -trimpath \
      -ldflags="-s -w -X main.version=${VERSION} -X main.buildTime=${BUILD_TIME} -X main.commit=${COMMIT}" \
      -o "$OUTPUT" \
      ./cmd/server
    
    echo "Built: $OUTPUT"
  done
done
```
