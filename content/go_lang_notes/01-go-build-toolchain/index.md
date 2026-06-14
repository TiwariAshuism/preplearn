# Go Build System & Toolchain — Complete Overview
> Source: golang/go · go-build-system-and-toolchain  
> Language: Hinglish 🇮🇳

---

## Ye Folder Kya Cover Karta Hai?

Ye poora folder Go ke **Build System aur Toolchain** ke baare mein hai — matlab Go code ko compile karne se lekar dependencies manage karne tak sab kuch.

```
go-build-toolchain/
├── 00-overview.md              ← Ye file (roadmap)
├── 01-go-command-basics.md     ← `go` command ka introduction
├── 02-modules-aur-packages.md  ← Modules, packages, versions ka concept
├── 03-go-mod-file.md           ← go.mod file ka anatomy
├── 04-dependency-management.md ← MVS, go get, go mod tidy
├── 05-build-commands.md        ← go build, test, install, run
├── 06-proxy-aur-cache.md       ← GOPROXY, Module Cache
├── 07-environment-variables.md ← Sab env vars ek jagah
└── 08-workspaces-aur-private.md← go.work, private modules
```

---

## Go Toolchain Kya Hai? (Big Picture)

```
Aapka Code (.go files)
        │
        ▼
   go command ──── go.mod (dependencies ka map)
        │
        ├── go build    → binary banao
        ├── go test     → tests chalao
        ├── go get      → dependency add/update karo
        ├── go mod tidy → go.mod clean karo
        ├── go install  → binary install karo
        └── go tool     → internal tools use karo
        │
        ▼
  Module Cache ($GOPATH/pkg/mod)
        │
        ▼
  Module Proxy (proxy.golang.org) ← internet se modules download
        │
        ▼
  Checksum DB (sum.golang.org) ← security verification
```

---

## Teen Bade Concepts Yaad Rakho

### 1. Module System
- Go 1.11 mein aaya, Go 1.16 se **default** hai
- Ek **module** = ek `go.mod` file wala folder (project)
- Har module ka ek unique **path** hota hai (jaise `github.com/gin-gonic/gin`)

### 2. Minimal Version Selection (MVS)
- Go **lock file nahi rakhta** (unlike npm ka package-lock.json)
- MVS algorithm se har build mein **deterministic** versions select hote hain
- "Minimum version jo sab ki requirements satisfy kare" — woh select hota hai

### 3. Module Proxy
- By default: `GOPROXY=https://proxy.golang.org,direct`
- Pehle proxy se try karta hai (fast, cached)
- Agar nahi mila toh `direct` (VCS se)

---

## Go Version aur Toolchain

Go ke versions do cheezein control karte hain:

| Concept | Matlab |
|---------|--------|
| `go 1.21` in go.mod | Module ko minimum Go 1.21 chahiye |
| `toolchain go1.21.0` | Suggested toolchain version |
| `GOTOOLCHAIN` env var | Kaun sa toolchain use ho |

Go 1.21 ke baad toolchain **mandatory** requirement hai — agar `go.mod` mein `go 1.22` likha hai aur aap Go 1.21 se run karo toh **error** aayegi.

---

## Quick Reference: Sabse Common Commands

```bash
# Naya project start karo
go mod init github.com/username/myproject

# Dependency add karo
go get github.com/gin-gonic/gin@v1.9.0

# Unused deps hatao, missing add karo
go mod tidy

# Code compile karo
go build ./...

# Tests chalao
go test ./...

# Binary install karo (GOBIN mein)
go install ./cmd/myapp

# Dependencies ka tree dekho
go mod graph

# Koi dep kyun hai?
go mod why github.com/some/package
```

---

## Files ki Reading Order (Recommended)

1. **01** → Go command basics samjho
2. **02** → Modules aur packages ka concept
3. **03** → go.mod file ka deep dive
4. **04** → Dependency management (MVS, go get)
5. **05** → Build commands
6. **06** → Proxy aur Cache
7. **07** → Environment variables
8. **08** → Workspaces aur Private modules
