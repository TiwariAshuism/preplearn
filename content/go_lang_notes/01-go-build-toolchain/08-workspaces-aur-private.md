# 08 — Workspaces aur Private Modules
> Multi-module development aur internal code manage karna

---

## Go Workspaces (go.work) — Kya Hai?

Workspace mode Go 1.18 mein aaya. Ye feature ek saath **multiple local modules** pe kaam karne ke liye hai — bina `replace` directives ke.

### Problem jo Workspaces Solve Karte Hain

**Pehle (bina workspace ke):**
```go
// go.mod mein likhna padta tha:
replace github.com/mycompany/shared-lib => ../shared-lib
replace github.com/mycompany/utils => ../utils
```

Problem: Ye `replace` directives **commit nahi karne chahiye** kyunki ye sirf locally kaam karti hain.

**Ab (workspace ke saath):**
```go
// go.work (project root mein)
go 1.22.0

use ./app
use ./shared-lib
use ./utils
```

Sab local modules ek saath behave karte hain! `go.mod` unchanged rahta hai.

---

## `go.work` File Structure

```go
go 1.22.0

toolchain go1.22.3

use (
    ./app          // module 1
    ./api          // module 2
    ../shared-lib  // module 3 (parent directory mein)
)

replace github.com/external/pkg v1.0.0 => ./local-fork
```

---

## Workspace Commands

### `go work init` — Workspace Banao
```bash
# Khali workspace
go work init

# Modules ke saath
go work init ./app ./api ./shared-lib

# Result: go.work file ban jaati hai current dir mein
```

### `go work use` — Modules Add Karo
```bash
# Single module add
go work use ./new-module

# Recursive search (sab go.mod dhundo)
go work use -r .
go work use -r ./services

# Module hatao (agar directory exist nahi karti)
# Automatically hota hai go work use se
```

### `go work edit` — go.work Edit Karo
```bash
# Use directive add karo
go work edit -use=./module

# Use directive hatao
go work edit -dropuse=./module

# Replace add karo
go work edit -replace=github.com/a/b@v1.0.0=./local/b

# Format karo
go work edit -fmt

# JSON print karo
go work edit -json

# Go version update karo
go work edit -go=1.22.0
```

### `go work sync` — Versions Sync Karo
```bash
go work sync
```

Workspace build list ko calculate karta hai (MVS use karke) aur har module ke go.mod ko update karta hai matching versions ke saath.

---

## Workspace ka `go.work` vs Module ka `go.mod`

| Aspect | go.work | go.mod |
|--------|---------|--------|
| Scope | Workspace (all modules) | Single module |
| VCS commit | Usually NOT commit | YES commit |
| `replace` | Sab modules pe apply | Sirf current module |
| `use` | Local modules declare | N/A |
| `require` | N/A (implicit from modules) | Dependencies |

---

## Workspace Mode ON/OFF

```bash
# Workspace mode check karo
go env GOWORK

# Workspace mode off karo (single module)
GOWORK=off go build ./...

# Specific go.work file use karo
GOWORK=/path/to/go.work go build ./...

# go.work find karna:
# Current dir → parent dirs → root tak
```

---

## Real-world Workspace Setup

### Scenario: Microservices Monorepo

```
company-repo/
├── go.work
├── services/
│   ├── user-service/
│   │   └── go.mod  (module github.com/company/user-service)
│   ├── order-service/
│   │   └── go.mod  (module github.com/company/order-service)
│   └── payment-service/
│       └── go.mod  (module github.com/company/payment-service)
└── shared/
    ├── models/
    │   └── go.mod  (module github.com/company/shared/models)
    └── utils/
        └── go.mod  (module github.com/company/shared/utils)
```

```go
// go.work
go 1.22.0

use (
    ./services/user-service
    ./services/order-service
    ./services/payment-service
    ./shared/models
    ./shared/utils
)
```

Ab sab services automatically local `shared/models` use karenge — without any `replace` directives!

### Local Development + Remote Library

```
my-app/
├── go.work
├── app/
│   └── go.mod  → requires github.com/company/sdk
└── sdk/        ← local checkout of github.com/company/sdk
    └── go.mod
```

```go
// go.work
go 1.22.0

use (
    ./app
    ./sdk  // local SDK override karo
)
```

---

## Private Modules — Company ke Internal Code

### Setup Strategies

#### Strategy 1: Corporate Proxy (Best for Teams)
```bash
# Saare modules is proxy se (public + private)
GOPROXY=https://goproxy.corp.com
GONOSUMDB=corp.example.com  # private ke liye checksum skip
```

Private proxy kya karta hai:
- Public modules cache karta hai
- Private modules serve karta hai
- Network control admins ke haath

**Tools:** Athens, Artifactory, Nexus, JFrog

#### Strategy 2: Fallback Proxy
```bash
# Private proxy pehle, fir public
GOPROXY=https://goproxy.corp.com,https://proxy.golang.org,direct
GONOSUMDB=corp.example.com
```

#### Strategy 3: Direct VCS Access
```bash
# Proxy bypass karo, direct repo se fetch karo
GOPRIVATE=*.corp.example.com,github.com/mycompany/*
# Ya:
GONOPROXY=*.corp.example.com
GONOSUMDB=*.corp.example.com
```

---

## Private Module Authentication

### `.netrc` File (Recommended)
```
machine github.com
login my-username
password ghp_token123

machine gitlab.corp.com
login service-account
password secret-token
```

```bash
# Location:
# Linux/Mac: ~/.netrc
# Windows: %USERPROFILE%\_netrc

# Custom location:
NETRC=/path/to/.netrc go get private/module
```

### GOPROXY URL mein Credentials (Careful!)
```bash
# Directly URL mein (shell history mein visible!)
GOPROXY=https://user:password@goproxy.corp.com

# Better: .netrc use karo
```

### SSH ke liye Git Config
```bash
# ~/.gitconfig
[url "git@github.com:"]
    insteadOf = https://github.com/

# Ya specific org ke liye
[url "git@github.com:mycompany/"]
    insteadOf = https://github.com/mycompany/
```

```bash
# ya globally:
git config --global url."git@github.com:".insteadOf "https://github.com/"
```

---

## Private Module Path Setup

### Repository Root mein
```go
// go.mod
module github.com/mycompany/internal-sdk

go 1.22.0
```

```bash
# Clone + use
go get github.com/mycompany/internal-sdk@v1.0.0
```

### VCS Qualifier wala Path
```bash
# .git suffix specify karo → no HTTP discovery needed
go get github.com/mycompany/repo.git/subpkg@v1.0.0
```

### Custom Domain
```
corp.example.com/internal/sdk
```

```bash
# corp.example.com server pe HTML response chahiye:
# <meta name="go-import" content="corp.example.com/internal/sdk git https://git.corp.example.com/sdk">
```

---

## Module Privacy Settings

```bash
# Complete private setup
go env -w GOPRIVATE=*.mycompany.com,gitlab.corp.com/internal/*
go env -w GOPROXY=https://goproxy.corp.com,https://proxy.golang.org,direct

# Verify
go env | grep -E "GOPRIVATE|GOPROXY|GONOSUMDB|GONOPROXY"
```

---

## `go.work.sum` — Workspace Checksums

```
workspace/
├── go.work
├── go.work.sum  ← workspace-specific checksums
├── app/
│   ├── go.mod
│   └── go.sum
└── lib/
    ├── go.mod
    └── go.sum
```

`go.work.sum`:
- Workspace ke modules ki extra checksums (jo individual go.sum mein nahi)
- Automatically maintain hoti hai
- Commit karo VCS mein

---

## Common Patterns aur Tips

### Pattern 1: Library Development
```bash
# Library develop kar rahe ho + example app

lib/          ← library module
example-app/  ← uses the library

# go.work:
use ./lib
use ./example-app

# example-app/go.mod mein:
require github.com/you/lib v0.0.0  # placeholder version (go.work override karega)
```

### Pattern 2: Forked Dependencies
```go
// go.work mein (commit mat karo):
replace github.com/some/library v1.2.3 => ./forked-library
```

Better than go.mod mein replace kyunki go.work is typically gitignored.

### Pattern 3: CI mein Workspace Disable karo
```bash
# CI mein test karo ki module standalone kaam karta hai
GOWORK=off go test ./...
```

### Tip: go.work ko gitignore karo (usually)
```gitignore
# .gitignore
go.work
go.work.sum
```

**Exception:** Agar sab developers same workspace setup use karein (monorepo).

---

## Workspace vs Replace Comparison

| | `replace` in go.mod | `use` in go.work |
|--|--|--|
| Commit to VCS? | ❌ Usually no | Usually no (team dependent) |
| Team share? | ❌ Manual | ✅ Automatic with go.work |
| Affects dependencies? | ✅ Yes (they see replace) | ❌ No (only local effect) |
| Production-safe? | ❌ Remove before release | ✅ go.work doesn't affect modules |
| Multiple modules? | One go.mod per module | One go.work for all |

---

## Debugging Workspace Issues

```bash
# Workspace mode check karo
go env GOWORK
# /path/to/go.work  ← workspace mode ON
# ""                ← workspace mode OFF

# Kaun se modules workspace mein hain?
go work edit -json | jq '.Use'

# Build list verify karo
go list -m all

# Specific module kahan resolve ho raha hai?
go list -m -json github.com/some/pkg
# "Dir": "/local/path" → local workspace module
# "Dir": "/go/pkg/mod/..." → cached remote module
```
