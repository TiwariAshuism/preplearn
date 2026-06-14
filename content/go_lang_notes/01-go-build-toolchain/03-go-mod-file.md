# 03 — `go.mod` File: Complete Anatomy
> Ye ek file hi poore module ka constitution hai

---

## go.mod File Kya Hai?

`go.mod` file module ki **identity aur dependencies** define karti hai. Ye file human-readable aur machine-writable dono hai.

```
myproject/
├── go.mod      ← module ka "ID card + dependency list"
├── go.sum      ← cryptographic checksums (tamper-proof)
├── main.go
└── internal/
    └── handler.go
```

---

## Ek Real go.mod File ka Example

```go
module github.com/ashutosh/myproject

go 1.22.0

toolchain go1.22.3

require (
    github.com/gin-gonic/gin v1.9.1
    go.uber.org/zap v1.26.0
    github.com/lib/pq v1.10.9
)

require (
    // indirect dependencies
    github.com/bytedance/sonic v1.10.0 // indirect
    github.com/go-playground/validator/v10 v10.16.0 // indirect
    golang.org/x/net v0.17.0 // indirect
)

replace github.com/internal/sdk => ../local-sdk

exclude golang.org/x/net v0.5.0

retract v1.3.0  // Critical bug tha is version mein
```

---

## Har Directive Detail Mein

### `module` — Module ka Path

```go
module github.com/username/projectname
```

- Module ka canonical naam
- Ek go.mod mein **exactly ek** `module` directive
- Import paths ka prefix ban jata hai

**Deprecated module:**
```go
// Deprecated: Please use github.com/username/projectname/v2 instead.
module github.com/username/projectname
```

---

### `go` — Minimum Go Version

```go
go 1.22.0
```

**Ye kya karta hai?**

| Version | Effect |
|---------|--------|
| `go 1.12` | Numeric literals like `1_000_000` use nahi kar sakte |
| `go 1.14` | Automatic vendoring support |
| `go 1.16` | `all` pattern sirf direct imports match karta hai |
| `go 1.17` | Indirect deps bhi explicitly listed hote hain |
| `go 1.21` | **Mandatory** — Go toolchain refuse karega agar version mismatch ho |

**Go 1.21 se pehle:** Advisory only (warning deta tha)
**Go 1.21 ke baad:** Hard requirement — nahi chal sakta

---

### `toolchain` — Suggested Toolchain

```go
toolchain go1.22.3
```

- "Is module ke liye ye toolchain use karo" — suggestion hai
- Tabhi effect karta hai jab current toolchain older ho
- `go env -w GOTOOLCHAIN=auto` se manage hota hai

---

### `require` — Dependencies

```go
require (
    github.com/gin-gonic/gin v1.9.1
    go.uber.org/zap v1.26.0         // direct dependency

    golang.org/x/net v0.17.0 // indirect
    github.com/bytedance/sonic v1.10.0 // indirect
)
```

**Direct vs Indirect:**
- **Direct:** Aapke code mein `import` hai
- **Indirect (`// indirect`):** Kisi dependency ki dependency

**Go 1.17+ mein:** Indirect dependencies bhi explicitly listed hoti hain (alag block mein). Isse **lazy module loading** aur **module graph pruning** possible hota hai.

---

### `replace` — Dependency Override

```go
// Specific version ko replace karo
replace github.com/old/pkg v1.2.3 => github.com/new/pkg v1.4.5

// Sab versions replace karo
replace github.com/old/pkg => github.com/new/pkg v1.4.5

// Local development ke liye (local path)
replace github.com/my/internal-sdk => ../internal-sdk
replace github.com/my/internal-sdk => ./local/sdk

// Sirf v1.2.3 ko local se replace karo
replace github.com/old/pkg v1.2.3 => ./local/fork
```

**Important:**
- `replace` sirf **main module** ke go.mod mein kaam karta hai
- Dependencies ke go.mod mein `replace` **ignore** hota hai
- Local path ke saath version nahi dena hota right side mein

---

### `exclude` — Version Blacklist

```go
exclude golang.org/x/net v1.2.3
exclude (
    github.com/vuln/pkg v1.0.0
    github.com/vuln/pkg v1.0.1
)
```

- Specific versions ko build se **exclude** karo
- Sirf main module ke go.mod mein kaam karta hai
- Excluded version reference hote hain toh next higher version use hoti hai

**Use case:** Kisi version mein security vulnerability hai, use skip karo.

---

### `retract` — Version Wapas Lena

```go
// Single version retract karo
retract v1.3.0  // Critical security bug

// Range retract karo
retract [v1.2.0, v1.2.5]  // In sab mein bug tha

// Multiple
retract (
    v1.0.0  // Accidentally published tha
    v1.0.1  // Sirf retraction hai is version mein
    [v2.0.0, v2.0.3]  // Data corruption bug
)
```

**Retract kya karta hai:**
- Users automatically upgrade nahi hote in versions pe
- `go get`, `go mod tidy` ye versions skip karte hain
- Warning show hoti hai: `go list -m -u all`
- Versions delete nahi hote, sirf marked hote hain

**Retract kaise karo:**
1. `go.mod` mein `retract` directive add karo
2. **Higher version tag karo** (yahi version retraction publish karega)
3. `@latest` query automatically new version pe point karegi

---

### `tool` — Go 1.24+ Tools

```go
tool (
    golang.org/x/tools/cmd/stringer
    github.com/golangci/golangci-lint/cmd/golangci-lint
)
```

- Tools ko module dependency ki tarah manage karo
- `go tool stringer ...` se run karo
- `go get -tool pkg@version` se add karo

---

### `ignore` — Directories Ignore Karna

```go
ignore ./node_modules   // relative path

ignore (
    static              // koi bhi "static" directory
    content/html
    ./third_party/javascript
)
```

- Package patterns match karte waqt ye directories skip hoti hain
- `./` se start = module root relative
- Bina `./` = kisi bhi depth pe match

---

### `godebug` — Runtime Debug Settings

```go
godebug default=go1.21

godebug (
    panicnil=1        // nil panic behavior
    asynctimerchan=0  // timer channel behavior
)
```

- `GODEBUG` environment variable ke equivalent
- Main package mein `//go:debug key=value` jaisa effect

---

## `go.sum` File — Integrity Guard

```
github.com/gin-gonic/gin v1.9.1 h1:4idEAncQnU5cB7BerypkHKIK0F6TiPkSG/YEuRGKPpyg=
github.com/gin-gonic/gin v1.9.1/go.mod h1:hPrL7YrpYKXt5YId3A/Tnip5kqbEAP+KLuI3SUcPTeU=
```

**Format:** `module version hash`

- `h1:...` → SHA-256 hash of the module zip
- `/go.mod` wali line → sirf go.mod file ka hash
- Ye file **commit karo** version control mein
- Automatically manage hoti hai `go mod tidy` aur build commands se

---

## Automatic Updates — go.mod Ko Auto-Fix

```bash
# go.mod mein non-canonical versions fix karo
go build -mod=mod .
go mod tidy
```

**Kya fix hota hai:**
1. `v1` → `v1.0.0` (canonical semver)
2. `dev` branch → pseudo-version
3. Excluded versions → next higher version
4. Redundant requires → remove
5. Missing indirect requires → add

---

## go.mod ka Grammar (EBNF simplified)

```
GoMod = { Directive }

Directive = ModuleDirective
          | GoDirective
          | ToolchainDirective
          | RequireDirective
          | ReplaceDirective
          | ExcludeDirective
          | RetractDirective
          | ToolDirective
          | IgnoreDirective
          | GodebugDirective
```

---

## Practical Commands go.mod ke Saath

```bash
# go.mod banao
go mod init github.com/user/project

# go directive update karo
go mod edit -go=1.22.0

# Requirement add karo
go mod edit -require=github.com/gin-gonic/gin@v1.9.1

# Requirement hatao
go mod edit -droprequire=github.com/old/pkg

# Replace add karo
go mod edit -replace=github.com/a/b@v1.0.0=./local/b

# JSON mein print karo (tools ke liye useful)
go mod edit -json | jq '.Require[]'

# Format karo (sort, align)
go mod edit -fmt

# Tidy karo (most common)
go mod tidy

# Specific Go version pe tidy
go mod tidy -go=1.21
```

---

## Module Graph Pruning (Go 1.17+)

**Problem:** v1.16 mein saari transitive dependencies ka full graph load hota tha — slow aur memory-intensive.

**Solution (Go 1.17+):** Module graph **pruning**:
- Sirf direct dependencies ka full graph load karo
- Indirect deps jo `go 1.17+` specify karte hain → unke dependencies skip karo

```go
// go.mod mein ye hona chahiye:
go 1.17  // ya higher
```

**Iska benefit:** Build faster hota hai kyunki unnecessary module metadata load nahi hoti.

**Tradeoff:** go.mod ab **zyada verbose** hogi — saari indirect deps listed hongi.

---

## Common Mistakes aur Fix

| Mistake | Symptom | Fix |
|---------|---------|-----|
| `replace` in dep's go.mod | Kaam nahi karta | Replace sirf main module mein kaam karta hai |
| Version `v2` without path suffix | `+incompatible` warning | Module path mein `/v2` add karo |
| `go.sum` missing from git | CI fail hota hai | `go.sum` commit karo |
| Manual go.mod edit | Format broken | `go mod edit -fmt` chalao |
| Unused dependency in go.mod | Build warning | `go mod tidy` chalao |
