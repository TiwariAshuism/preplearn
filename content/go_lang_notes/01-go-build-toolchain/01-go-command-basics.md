# 01 — `go` Command: Basics aur Ecosystem Management
> Go ka Swiss Army Knife — ek hi command se sab kuch

---

## `go` Command Kya Hai?

`go` ek **meta-command** hai jo Go ke saare tools ko manage karta hai. Directly koi binary compile nahi hoti — `go` internally `compile`, `link`, `vet`, `fmt` jaisi tools ko invoke karta hai.

```bash
# ye command internally bohot kuch karta hai:
go build ./...
# 1. go.mod padha
# 2. dependencies resolve kiye
# 3. module cache check kiya
# 4. compiler chalaya
# 5. linker chalaya
```

---

## Command Categories

### Build & Run Commands
```bash
go build [packages]    # Compile karo, binary banao
go run [files]         # Compile + run (temp binary)
go install [packages]  # Compile + binary ko GOBIN mein daalo
go generate            # Code generators chalao
```

### Testing
```bash
go test [packages]           # Tests chalao
go test -v ./...             # Verbose output
go test -cover ./...         # Coverage dekho
go test -bench=. ./...       # Benchmarks chalao
go test -race ./...          # Race condition detect karo
```

### Module Management
```bash
go mod init [path]    # Naya module banao
go mod tidy           # go.mod clean karo
go mod download       # Dependencies pre-download karo
go mod vendor         # vendor/ folder banao
go mod graph          # Dependency graph print karo
go mod verify         # Module cache integrity check
go mod why [pkg]      # Koi package kyun include hai?
go mod edit [flags]   # go.mod programmatically edit karo
```

### Code Quality Tools
```bash
go fmt ./...     # Code format karo (gofmt wrap)
go vet ./...     # Suspicious code detect karo
go fix ./...     # Old API → new API migrate karo
go doc [symbol]  # Documentation dekho
```

### Environment & Info
```bash
go env              # Saare Go environment variables
go env GOPATH       # Specific variable
go env -w KEY=val   # Permanently set karo
go version          # Go version
go version -m ./bin/app  # Binary kaise build hua?
```

---

## `go build` ke Flags (Important Ones)

```bash
# Output file ka naam do
go build -o myapp ./cmd/server

# Build info embed karo (debugging ke liye)
go build -ldflags="-X main.version=v1.2.3" .

# Race condition detector on
go build -race .

# Specific OS/Arch ke liye cross-compile
GOOS=linux GOARCH=amd64 go build -o app-linux .
GOOS=windows GOARCH=amd64 go build -o app.exe .
GOOS=darwin GOARCH=arm64 go build -o app-mac .  # Apple Silicon

# Verbose output (kaun se files compile ho rahe hain)
go build -v ./...

# Build cache use mat karo
go build -a ./...

# Trimpath — build artifacts se local paths hatao
go build -trimpath .

# Build tags ke saath
go build -tags "production,linux" .
```

---

## Module-Aware Mode vs GOPATH Mode

| Mode | Kab? | Behavior |
|------|------|----------|
| **Module-aware** | Go 1.16+ (default) | `go.mod` se dependencies |
| **GOPATH mode** | Legacy / `GO111MODULE=off` | `$GOPATH/src` se packages |

```bash
# Module-aware mode force karo
GO111MODULE=on go build .

# GOPATH mode force karo (legacy)
GO111MODULE=off go build .

# Auto (module-aware if go.mod present)
GO111MODULE=auto go build .
```

> **Note:** Go 1.16 se `GO111MODULE=on` default hai. Agar `go.mod` na bhi ho toh module-aware mode chalega.

---

## `-mod` Flag — go.mod ko kaise handle karo?

```bash
# go.mod automatically update karo (missing packages add karo)
go build -mod=mod .

# go.mod change mat karo, agar change chahiye toh error do
go build -mod=readonly .   # default since Go 1.16

# vendor/ directory use karo (network mat use karo)
go build -mod=vendor .
```

**Automatic vendor detection:** Agar `vendor/` directory exist kare aur `go.mod` mein `go 1.14+` ho toh `-mod=vendor` automatically apply hota hai.

---

## `go install` — Binary Install Karna

```bash
# Latest version install karo (go.mod ko affect nahi karta)
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Specific version
go install golang.org/x/tools/gopls@v0.14.0

# Current module ka tool install karo
go install ./cmd/myapp
```

**Binary kahan jati hai?**
```
$GOBIN         → agar set hai
$GOPATH/bin    → default
$HOME/go/bin   → agar GOPATH bhi set nahi
```

---

## `go run` — Quick Execution

```bash
# Single file
go run main.go

# Multiple files (same package)
go run main.go helper.go

# Current package
go run .

# Arguments pass karo
go run . --port=8080 --debug
```

> `go run` ek **temporary binary** banata hai aur chalata hai. Production ke liye use mat karo.

---

## `go tool` — Internal Tools

```bash
# go.mod mein declare kiye tools run karo
go tool stringer -type=Color

# pprof profiler
go tool pprof cpu.prof

# Compiled package ka assembly dekho
go tool objdump -s main.main ./myapp

# Test coverage HTML
go test -coverprofile=c.out ./...
go tool cover -html=c.out
```

---

## `go env -w` — Permanent Settings

```bash
# Proxy set karo (private network ke liye)
go env -w GOPROXY=https://goproxy.cn,direct

# Private modules
go env -w GOPRIVATE=*.company.com

# GOPATH change karo
go env -w GOPATH=/custom/gopath

# Undo karo
go env -u GOPROXY
```

Ye settings `$GOENV` file mein store hoti hain:
- Linux/Mac: `~/.config/go/env`
- Windows: `%APPDATA%\go\env`

---

## Commonly Used Workflows

### Naya Project Start Karna
```bash
mkdir myproject && cd myproject
go mod init github.com/username/myproject
# main.go banao...
go run .
```

### Existing Project Mein Kaam Karna
```bash
git clone https://github.com/someone/project
cd project
go mod download  # sabhi dependencies download karo
go build ./...   # sab kuch compile karo
go test ./...    # sab tests chalao
```

### Production Binary Banana
```bash
CGO_ENABLED=0 \
  GOOS=linux \
  GOARCH=amd64 \
  go build -ldflags="-s -w -X main.version=$(git describe --tags)" \
  -trimpath \
  -o dist/app \
  ./cmd/server
```
- `-s -w` → debug symbols hatao (binary chhoti hogi)
- `-trimpath` → local paths remove karo
- `CGO_ENABLED=0` → static binary (no C deps)
