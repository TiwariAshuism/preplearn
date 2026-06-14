# 02 — Modules, Packages aur Versions
> Go ke dependency system ki neev

---

## Package vs Module — Difference Kya Hai?

| Concept | Definition | Example |
|---------|-----------|---------|
| **Package** | Ek directory ke `.go` files ka collection | `net/http`, `fmt`, `encoding/json` |
| **Module** | Packages ka collection jo ek saath release hota hai | `golang.org/x/net` (kai packages contain karta hai) |

```
module: github.com/gin-gonic/gin     ← ye ek module hai
  └── package: github.com/gin-gonic/gin          (root)
  └── package: github.com/gin-gonic/gin/binding
  └── package: github.com/gin-gonic/gin/render
  └── package: github.com/gin-gonic/gin/testdata
```

---

## Module Path Kya Hota Hai?

Module path = module ka unique **canonical naam**.

```
github.com/gin-gonic/gin
│           │       │
│           │       └── repo name
│           └── username/org
└── domain (repository host)
```

### Rules for Module Path:
1. Domain name se start karna chahiye (jo internet pe exist kare)
2. `/v2`, `/v3` suffix major version 2+ ke liye **mandatory** hai
3. Standard library packages mein dot nahi hota (`fmt`, `net/http`)

```go
// import karne ka tarika:
import "github.com/gin-gonic/gin"           // v1.x
import "github.com/user/repo/v2"            // v2.x
import "github.com/user/repo/v2/subpkg"    // v2 ka subpackage
```

---

## Versions ka System — Semantic Versioning

Go **SemVer** (Semantic Versioning) follow karta hai:

```
v1.2.3
│ │ │
│ │ └── Patch: bug fix, backward compatible
│ └──── Minor: new features, backward compatible
└────── Major: breaking changes
```

### Version Types:

#### 1. Release Version (Stable)
```
v1.2.3       ← normal release
v2.0.0       ← major version (breaking changes)
v0.5.1       ← pre-stable (v0 = no stability guarantee)
```

#### 2. Pre-release Version
```
v1.2.3-beta.1        ← beta release
v1.2.3-rc.2          ← release candidate
v2.0.0-alpha         ← alpha
```
Pre-release versions release se **pehle** sort hote hain:
`v1.2.3-pre` < `v1.2.3`

#### 3. Pseudo-version (VCS se direct)
```
v0.0.0-20191109021931-daa7c04131f5
│      │              │
│      └── timestamp  └── commit hash (12 chars)
└── base version
```
Jab koi tag nahi hota (branch/commit use karna ho toh):
```bash
go get github.com/some/pkg@main          # latest commit on main
go get github.com/some/pkg@abc123def    # specific commit
# → automatically pseudo-version mein convert hoga
```

#### 4. Incompatible Version (`+incompatible`)
```
v2.0.0+incompatible
```
Jab koi module v2+ tag kare **bina** `go.mod` aur major version suffix ke, toh Go `+incompatible` lagata hai.
```go
require github.com/old/pkg v4.1.2+incompatible
```

---

## Package ko Module se Resolve Karna

Go kaise decide karta hai ki koi package kahan se aaya?

```
Step 1: Import path dekho
        "github.com/gin-gonic/gin/binding"

Step 2: Build list mein matching module dhundo
        → "github.com/gin-gonic/gin" match karta hai

Step 3: Us module ke under "binding" directory check karo
        → .go files hain? → yes → package found!

Step 4: Agar nahi mila → GOPROXY se new module dhundo
```

**Longest path wins:** Agar do modules same package provide karein:
- `github.com/foo/bar` → bar/ mein `baz` package
- `github.com/foo/bar/baz` → alag module

Toh `github.com/foo/bar/baz` use hoga (longer path).

---

## Major Version Suffix — Kyun Zaroori Hai?

**Import Compatibility Rule:**
> Agar old aur new package ka same import path hai, toh new wala old ke saath backward compatible HONA CHAHIYE.

Kyunki v2 breaking changes karta hai, naya import path chahiye:

```go
// v1 use karo:
import "github.com/some/lib"

// v2 use karo (alag path!):
import "github.com/some/lib/v2"
```

**go.mod mein:**
```
require github.com/some/lib v1.5.0      // v1
require github.com/some/lib/v2 v2.1.0  // v2 — separate module
```

Dono ek hi build mein use ho sakte hain (different paths = different modules)!

---

## `gopkg.in` — Special Case

```
gopkg.in/yaml.v2   ← dot ke baad major version
gopkg.in/yaml.v3   ← v0/v1 pe bhi suffix mandatory
```
Ye `gopkg.in` service ka convention hai, normal rules se alag hai.

---

## Module Graph — Dependencies ka Diagram

```
Main Module (your project)
    ├── requires: gin v1.9.0
    │       ├── requires: httprouter v1.3.0
    │       └── requires: bytebufferpool v1.0.0
    └── requires: zap v1.24.0
            ├── requires: atomic v1.10.0
            └── requires: multierr v1.9.0
```

MVS (Minimal Version Selection) is graph ko traverse karke **minimum satisfying versions** select karta hai.

---

## Build Tags — Conditional Compilation

Kuch files sirf specific conditions mein include hoti hain:

### File Name Convention
```
// Sirf Linux pe:
server_linux.go

// Sirf Windows pe:
server_windows.go

// Linux aur amd64:
handler_linux_amd64.go
```

### Build Constraint Comments
```go
//go:build linux && amd64
// +build linux,amd64  ← old syntax (Go 1.16 se pehle)

package main
```

```bash
# Build tags ke saath compile:
go build -tags "production debug" .
```

### Ignore Tag
```go
//go:build ignore
// Ye file kabhi compile nahi hogi automatically
```
`go mod tidy` bhi ignored files skip karta hai.

---

## Standard Library vs Third-party

```go
// Standard library (no download needed, Go ke saath aata hai):
import (
    "fmt"           // no dot in first element
    "net/http"
    "encoding/json"
    "database/sql"
)

// Third-party (module system se manage hota hai):
import (
    "github.com/gin-gonic/gin"
    "go.uber.org/zap"
    "github.com/lib/pq"
)
```

Standard library packages:
- Kabhi module path pe resolve nahi hote
- `$GOROOT/src` mein hote hain
- Example: `test`, `example` — reserved names for users

---

## Module aur VCS (Version Control Systems)

Go supported VCS tools:

| Tool | Schemes | Notes |
|------|---------|-------|
| **Git** | `https`, `git+ssh`, `ssh` | Most common, public + private |
| **Mercurial** | `https`, `ssh` | Public + private |
| **Bazaar** | `https`, `bzr+ssh` | Private only |
| **Subversion** | `https`, `svn+ssh` | Private only |
| **Fossil** | `https` | Private only |

Security ke liye by default sirf **Git aur Mercurial** public modules ke liye allowed hain. `GOVCS` se change kar sakte hain.

---

## Practical Example: Module Explore Karna

```bash
# Available versions dekho
go list -m -versions github.com/gin-gonic/gin

# Specific version ki info
go list -m -json github.com/gin-gonic/gin@v1.9.0

# Saari dependencies list karo
go list -m all

# Koi package kis module se aaya?
go list -m github.com/gin-gonic/gin/binding

# Module graph print karo
go mod graph | head -20
```
