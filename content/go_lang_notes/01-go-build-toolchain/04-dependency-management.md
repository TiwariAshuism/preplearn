# 04 — Dependency Management: MVS, go get, go mod tidy
> Go ka dependency resolution system — npm se alag kyun hai?

---

## Minimal Version Selection (MVS) — Go ka Secret Weapon

### Problem jo MVS Solve Karta Hai

Maan lo aapka project:
```
Your App
  ├── needs: moduleA v1.2.0
  │     └── needs: moduleC v1.3.0
  └── needs: moduleB v1.2.0
        └── needs: moduleC v1.4.0
```

**moduleC** dono ki dependency hai — kaun sa version use hoga?

### MVS ka Answer
> **Highest minimum required version** use karo

```
Your App        → moduleC minimum v1.3.0 chahiye
moduleB v1.2.0  → moduleC minimum v1.4.0 chahiye

→ MVS selects: moduleC v1.4.0
```

**Kyunki:** v1.4.0 ≥ v1.3.0 (satisfies moduleA's need) AND = v1.4.0 (satisfies moduleB's need)

---

## MVS vs Other Package Managers

| Feature | Go MVS | npm | pip | cargo |
|---------|--------|-----|-----|-------|
| Lock file | ❌ (deterministic without it) | ✅ package-lock.json | ✅ requirements.txt | ✅ Cargo.lock |
| Latest auto-upgrade | ❌ Never automatic | ✅ (ranges) | ✅ (ranges) | Sometimes |
| Reproducibility | ✅ Always | ✅ with lock | Partial | ✅ with lock |
| Diamond problem | ✅ Solved | ❌ Complex | ❌ Complex | ✅ |

**Go ke saath lock file kyun nahi:**
- MVS **deterministic** hai — same go.mod = same result, hamesha
- No random resolution → no "works on my machine" problem

---

## MVS Algorithm — Step by Step

```
1. Main module se start karo
2. Sab requires traverse karo (graph)
3. Har module ke liye: highest required version note karo
4. Result = sab modules ke saath unke highest required version

BUILD LIST = ye final set of modules + versions
```

**Visual:**
```
Main Module  ──require──▶  A v1.2  ──require──▶  C v1.3
     │                                                │
     └──require──▶  B v1.2  ──require──▶  C v1.4 ◀──┘

MVS Result:
  A v1.2   ✓ (only version required)
  B v1.2   ✓ (only version required)  
  C v1.4   ✓ (max of v1.3 and v1.4)
```

---

## `go get` — Dependency Add/Update/Remove

### Basic Usage
```bash
# Add/upgrade latest version
go get github.com/gin-gonic/gin

# Specific version
go get github.com/gin-gonic/gin@v1.9.1

# Latest minor version
go get github.com/gin-gonic/gin@v1

# Specific commit/branch
go get github.com/gin-gonic/gin@main
go get github.com/gin-gonic/gin@abc1234

# Remove dependency
go get github.com/gin-gonic/gin@none

# Upgrade all direct dependencies
go get -u ./...

# Upgrade only patch versions (safe upgrades)
go get -u=patch ./...

# Add as tool (Go 1.24+)
go get -tool golang.org/x/tools/cmd/stringer@latest
```

### Version Query Syntax

```bash
# Exact version
@v1.2.3

# Version prefix (highest matching)
@v1          # → v1.x.x mein sabse high
@v1.2        # → v1.2.x mein sabse high

# Comparison
@>=v1.2.3    # v1.2.3 ya usse upar
@<v2.0.0     # v2 se neeche

# Special keywords
@latest      # Highest release version (default)
@upgrade     # Latest ya current (jo bhi higher)
@patch       # Latest patch (same major.minor)
@none        # Remove karo

# Branch/tag/commit
@main
@feature-branch
@v1.2.3-beta.1
@abc123def456  # commit hash
```

### go get ka Cascading Effect

```bash
go get github.com/A@v1.5.0
```

**Kya hoga:**
1. A v1.5.0 ka go.mod load hoga
2. A v1.5.0 ki requires list dekhi jayegi
3. Agar koi dep upgrade chahiye → woh bhi upgrade hoga
4. Main module ka go.mod update hoga

```
A v1.5.0  requires  B >=v1.2.0
Agar current B = v1.1.0 → upgrade to v1.2.0
```

---

## `go mod tidy` — go.mod Cleanup

### Ye Kya Karta Hai?

```bash
go mod tidy
```

**Actions:**
1. ✅ Missing requires add karta hai
2. ❌ Unused requires hatata hai
3. ✅ Missing `go.sum` entries add karta hai
4. ❌ Unnecessary `go.sum` entries hatata hai
5. ✅ `// indirect` comments fix karta hai

### Kab Chalao?

```bash
# Dependency add karne ke baad
go get something && go mod tidy

# Code delete karne ke baad (imports remove hue)
# delete some files...
go mod tidy

# CI mein verify karo (diff nahi hona chahiye)
go mod tidy && git diff --exit-code go.mod go.sum

# Different Go version ke liye tidy
go mod tidy -go=1.21

# Compat check (one version behind)
go mod tidy -compat=1.20
```

### `-compat` Flag kya karta hai?

```bash
go mod tidy -compat=1.20
```

Ye ensure karta hai ki go.sum mein wo checksums bhi hain jo Go 1.20 ko chahiye honge (previous version compatibility).

---

## `go mod download` — Pre-download Dependencies

```bash
# Sab dependencies download karo (module cache mein)
go mod download

# Specific module download karo
go mod download github.com/gin-gonic/gin@v1.9.1

# JSON output (scripting ke liye useful)
go mod download -json github.com/gin-gonic/gin@v1.9.1
```

**Output:**
```json
{
    "Path": "github.com/gin-gonic/gin",
    "Version": "v1.9.1",
    "Info": "/Users/user/go/pkg/mod/cache/download/github.com/gin-gonic/gin/@v/v1.9.1.info",
    "GoMod": "/Users/user/go/pkg/mod/cache/download/github.com/gin-gonic/gin/@v/v1.9.1.mod",
    "Zip": "/Users/user/go/pkg/mod/cache/download/github.com/gin-gonic/gin/@v/v1.9.1.zip",
    "Dir": "/Users/user/go/pkg/mod/github.com/gin-gonic/gin@v1.9.1",
    "Sum": "h1:4idEAncQnU5cB7BerypkHKIK0F6TiPkSG/YEuRGKPpyg=",
    "GoModSum": "h1:hPrL7YrpYKXt5YId3A/Tnip5kqbEAP+KLuI3SUcPTeU="
}
```

**Use cases:**
- Docker build mein pehle download karo, fir code build karo (layer caching)
- Air-gapped environments ke liye pre-populate cache

---

## `go mod vendor` — Vendoring

### Vendor Kya Hota Hai?

Dependencies ko **project ke andar** copy karna taaki:
- Network dependency khatam ho
- Older Go versions ke saath compatibility
- Reproducible builds without proxy

```bash
# vendor/ directory banao
go mod vendor

# vendor ke saath build karo
go build -mod=vendor ./...
```

**Structure:**
```
myproject/
├── go.mod
├── go.sum
├── vendor/
│   ├── modules.txt          ← manifest
│   ├── github.com/
│   │   └── gin-gonic/
│   │       └── gin/
│   │           ├── gin.go
│   │           └── ...
│   └── go.uber.org/
│       └── zap/
└── main.go
```

**Go 1.14+:** `vendor/` exist kare aur `go 1.14+` go.mod mein ho toh **automatically** `-mod=vendor` use hota hai.

**Notes:**
- Vendor directory mein changes mat karo manually
- `go mod vendor` dubara run karo to rebuild
- VCS mein commit karo ya nahi — team decision
- `tests/` ke liye packages included hain

---

## `go mod graph` — Dependency Graph

```bash
# Full graph print karo
go mod graph

# Sample output:
example.com/main example.com/a@v1.1.0
example.com/main example.com/b@v1.2.0
example.com/a@v1.1.0 example.com/b@v1.1.1
example.com/a@v1.1.0 example.com/c@v1.3.0
```

```bash
# Go version specify karo (pruned graph)
go mod graph -go=1.17

# Visualization (external tool)
go mod graph | dot -Tsvg > graph.svg
```

---

## `go mod why` — Dependency Explain Karo

```bash
# Koi package kyun include hai?
go mod why golang.org/x/text/language

# Output:
# golang.org/x/text/language
rsc.io/quote
rsc.io/sampler
golang.org/x/text/language

# Agar include nahi:
# golang.org/x/text/encoding
(main module does not need package golang.org/x/text/encoding)
```

```bash
# Module level (package nahi)
go mod why -m golang.org/x/text
```

---

## `go mod verify` — Integrity Check

```bash
go mod verify
# all modules verified   ← sab theek hai

# Agar kuch tamper hua:
# github.com/gin-gonic/gin v1.9.1: zip has been modified
```

**Kya check karta hai:**
- Module cache mein downloaded `.zip` files
- Extracted directories
- Hashes ko `go.sum` se compare karta hai

---

## `go list -m` — Module Info

```bash
# Saare modules list karo
go list -m all

# Updates available check karo
go list -m -u all

# JSON output
go list -m -json github.com/gin-gonic/gin@latest

# Available versions
go list -m -versions github.com/gin-gonic/gin

# Retracted versions bhi dikhao
go list -m -versions -retracted github.com/some/pkg
```

**JSON Output:**
```json
{
    "Path": "github.com/gin-gonic/gin",
    "Version": "v1.9.1",
    "Update": {
        "Path": "github.com/gin-gonic/gin",
        "Version": "v1.9.2"
    },
    "Main": false,
    "Indirect": false,
    "Dir": "/home/user/go/pkg/mod/github.com/gin-gonic/gin@v1.9.1"
}
```

---

## Upgrade Strategy — Best Practices

### Safe Upgrade
```bash
# 1. Sirf patch versions (safest)
go get -u=patch ./...

# 2. Check what changed
go list -m -u all

# 3. Update specific package
go get github.com/some/pkg@v1.2.3

# 4. Test karo
go test ./...

# 5. Tidy karo
go mod tidy
```

### Full Upgrade (Risky)
```bash
# Sab direct deps latest pe
go get -u ./...
go mod tidy
go test ./...
```

### Downgrade
```bash
# Specific version pe jaao
go get github.com/some/pkg@v1.1.0

# Transitively dependent modules bhi downgrade ho sakte hain
```

---

## Dependency Ke Saath Common Problems

### Problem 1: Diamond Dependency
```
App → A v1.2.0 → C v1.3
App → B v1.0.0 → C v2.0.0  ← incompatible!
```

**Solution:** C ne major version bump kiya hoga `/v2` ke saath — alag modules hain toh conflict nahi.

### Problem 2: `+incompatible` Warning
```
require github.com/old/pkg v4.1.2+incompatible
```

**Fix:** Ya toh naya fork dhundo jo proper module support karta ho, ya accept karo.

### Problem 3: Circular Dependencies
Go **disallows** circular module dependencies. Package level circular imports bhi disallowed hain.

### Problem 4: Replace Sirf Locally Kaam Karta Hai
```go
// go.mod mein:
replace github.com/internal/sdk => ../local-sdk
```

Ye sirf aapke system pe kaam karega. Team ko bhi local-sdk setup karna hoga.

**Better approach:** Private module registry use karo.
