# 06 — Module Proxy, Cache aur Security
> Go ka download infrastructure — fast, secure, verifiable

---

## Module Proxy Kya Hota Hai?

Module proxy ek **HTTP server** hai jo Go modules serve karta hai. Jab aap `go get` karte hain, Go pehle proxy se module download karta hai.

```
Your Machine                 Proxy                    Original Repo
      │                        │                            │
      │── GET /mod/@v/list ──▶ │                            │
      │◀── v1.9.0, v1.9.1 ──── │                            │
      │                        │                            │
      │── GET /@v/v1.9.1.zip ─▶│ (cache hit!)               │
      │◀── module zip ──────── │                            │
      │                        │                            │
      │                   (if not cached)                   │
      │                        │── download ──────────────▶ │
      │                        │◀── source ──────────────── │
```

---

## GOPROXY — Proxy Configuration

```bash
# Default value:
GOPROXY=https://proxy.golang.org,direct

# Sirf proxy use karo (direct VCS nahi)
GOPROXY=https://proxy.golang.org

# Private corporate proxy + fallback
GOPROXY=https://goproxy.corp.com,https://proxy.golang.org,direct

# Direct VCS se (proxy bypass)
GOPROXY=direct

# Completely disable (offline mode)
GOPROXY=off

# China mein (proxy.golang.org blocked hai)
GOPROXY=https://goproxy.cn,direct
go env -w GOPROXY=https://goproxy.cn,direct
```

### Separator ka Meaning

```
GOPROXY=A,B,C   ← comma: sirf 404/410 pe next try karo
GOPROXY=A|B|C   ← pipe: kisi bhi error pe next try karo
```

```
proxy.corp.com,proxy.golang.org,direct
     │                │              │
     ▼                ▼              ▼
Pehle try karo → 404 pe ye try → 404 pe direct
```

---

## GOPROXY Protocol — API Endpoints

Koi bhi HTTP server jo ye endpoints implement kare, woh proxy ban sakta hai:

```
GET $base/$module/@v/list              → Available versions list
GET $base/$module/@v/$version.info     → Version metadata (JSON)
GET $base/$module/@v/$version.mod      → go.mod file
GET $base/$module/@v/$version.zip      → Module source zip
GET $base/$module/@latest              → Latest version info
```

**Example:**
```bash
# proxy.golang.org se manually fetch karo:
curl https://proxy.golang.org/github.com/gin-gonic/gin/@v/list
# v1.1.0
# v1.2.0
# ...
# v1.9.1

curl https://proxy.golang.org/github.com/gin-gonic/gin/@v/v1.9.1.info
# {"Version":"v1.9.1","Time":"2023-06-11T09:37:15Z"}

curl https://proxy.golang.org/github.com/gin-gonic/gin/@v/v1.9.1.mod
# module github.com/gin-gonic/gin
# go 1.18
# require (...)
```

### Case Encoding
Module paths mein uppercase → `!lowercase` encoding:
```
github.com/Azure/azure-sdk-go
→ github.com/!azure/azure-sdk-go  (proxy URL mein)
```

---

## Module Cache — Local Storage

### Cache Location
```bash
go env GOMODCACHE   # → $GOPATH/pkg/mod (default)
go env GOPATH       # → $HOME/go (default)
```

Matlab default cache: `$HOME/go/pkg/mod`

### Cache Structure
```
$GOMODCACHE/
├── github.com/
│   └── gin-gonic/
│       └── gin@v1.9.1/         ← extracted module (read-only)
│           ├── go.mod
│           ├── gin.go
│           └── ...
└── cache/
    └── download/               ← GOPROXY protocol cache
        └── github.com/
            └── gin-gonic/
                └── gin/
                    └── @v/
                        ├── list
                        ├── v1.9.1.info
                        ├── v1.9.1.mod
                        ├── v1.9.1.zip
                        └── v1.9.1.ziphash  ← integrity hash
```

**Important:** Module files **read-only** hoti hain cache mein (accidental modification se bachao).

### Cache Management
```bash
# Cache clear karo
go clean -modcache         # Poora module cache delete
go clean -cache            # Build cache (alag!)
go clean -testcache        # Test results cache

# Cache verify karo
go mod verify              # Hashes match karo

# Cache read-write permissions (careful!)
go build -modcacherw .
# ya permanently:
go env -w GOFLAGS=-modcacherw
```

---

## Checksum Database — Security Layer

### Kya Hai ye?

**sum.golang.org** — Google ka operated public checksum database.

```
Ye ek global "register" hai sab public module versions ke hashes ka.
Ek baar module version publish hua → hash database mein lock ho jaata hai.
Agar proxy galat code serve kare → immediately detect ho jaata hai.
```

### Kaise Kaam Karta Hai?

```
1. `go get` se module download hua
2. Module ka hash compute kiya gaya
3. sum.golang.org se is version ka expected hash liya
4. Compare karo → match? ✅ Add to go.sum  ❌ Security error!
```

### Transparent Log (Merkle Tree)

sum.golang.org ek **Merkle tree** (append-only log) maintain karta hai:
- Koi entry delete ya modify nahi ho sakti
- Independent auditors verify kar sakte hain
- Tamper karo toh immediately detect ho jaata hai

### GOSUMDB Configuration

```bash
# Default
GOSUMDB=sum.golang.org

# Custom public key ke saath
GOSUMDB="sum.golang.org+<publickey>"

# Custom URL bhi
GOSUMDB="sum.golang.org+<publickey> https://sum.golang.org"

# China alternative (same DB, different URL)
GOSUMDB=sum.golang.google.cn

# Disable (NOT recommended production mein)
GOSUMDB=off
```

### GONOSUMDB — Private Modules ke liye Skip

```bash
# Private modules ke liye checksum skip karo
GONOSUMDB=*.corp.example.com,*.internal.company.org

# GOPRIVATE set karne se automatically GONOSUMDB set ho jaata hai
GOPRIVATE=*.corp.example.com
# → GONOSUMDB=*.corp.example.com (default)
```

---

## `go.sum` File — Local Checksums

```
github.com/gin-gonic/gin v1.9.1 h1:4idEAncQnU5cB7BerypkHKIK0F6TiPkSG/YEuRGKPpyg=
github.com/gin-gonic/gin v1.9.1/go.mod h1:hPrL7YrpYKXt5YId3A/Tnip5kqbEAP+KLuI3SUcPTeU=
```

**Format:** `<module> <version>[/go.mod] h1:<base64-sha256>`

- `h1:` → SHA-256 algorithm (future-proof: h2, h3 bhi aa sakte hain)
- `/go.mod` wali entry → sirf go.mod ka hash (full download se pehle verify hota hai)
- Dono hote hain ek module ke liye

**Rules:**
- ✅ Commit karo git mein
- ❌ Manually edit mat karo
- `go mod tidy` automatically maintain karta hai

---

## GOPRIVATE — Private Modules

```bash
# Private module prefix
GOPRIVATE=github.com/mycompany,*.internal.corp.com

# Kya karta hai:
# → GOPROXY bypass karo (direct VCS se fetch)
# → GONOSUMDB set karo (checksum skip)
# → GONOPROXY set karo
```

### GONOPROXY vs GOPRIVATE

```bash
# GONOPROXY: sirf proxy bypass, but checksum DB use karo
GONOPROXY=*.corp.example.com

# GONOSUMDB: sirf checksum skip, proxy still use karo
GONOSUMDB=*.corp.example.com

# GOPRIVATE: dono karo (GONOPROXY + GONOSUMDB)
GOPRIVATE=*.corp.example.com
```

### GOINSECURE — HTTP Allow Karo

```bash
# Specific modules ke liye HTTP allow karo (insecure!)
GOINSECURE=*.internal.company.org
```

---

## GOVCS — VCS Tool Control

```bash
# Default behavior:
# public modules: git|hg only
# private modules: any VCS
GOVCS=public:git|hg,private:all

# Custom config:
GOVCS=github.com:git,evil.com:off,*:git|hg

# Sab allow karo (dangerous)
GOVCS=*:all

# Sab disable karo (proxy only)
GOVCS=*:off
```

---

## File Proxy — Local/Air-gapped Environments

```bash
# Local cache ko proxy ki tarah use karo
GOPROXY=file://$(go env GOMODCACHE)/cache/download

# Custom local directory
GOPROXY=file:///path/to/my/module/cache

# Specific modules local se, rest from internet
GOPROXY=file:///local/cache,https://proxy.golang.org,direct
```

### Air-gapped Setup

```bash
# Step 1: Internet wali machine pe download karo
GOFLAGS="-mod=mod" go mod download
# ya specific modules:
go mod download -json ./...

# Step 2: Cache ko air-gapped machine pe copy karo
rsync -av $(go env GOMODCACHE)/cache/download/ /mnt/offline-cache/

# Step 3: Air-gapped machine pe set karo
GOPROXY=file:///mnt/offline-cache
GONOSUMDB=*      # ya GONOSUMDB=* agar internal
```

---

## Module Zip Files — Under the Hood

Modules `.zip` format mein distribute hote hain.

**Zip file structure:**
```
github.com/gin-gonic/gin@v1.9.1/
├── go.mod
├── gin.go
├── context.go
└── ...
```

**Constraints:**
- Max zip size: **500 MB**
- Max go.mod size: **16 MB**
- Max LICENSE file: **16 MB**
- `vendor/` directories included **nahi** hote
- Nested modules (submodules) included **nahi** hote
- Symbolic links **ignore** hote hain
- Case-insensitive collision nahi honi chahiye

**LICENSE special case:**
- Agar submodule ka apna LICENSE nahi hai
- Toh repository root ka LICENSE copy hota hai automatically

---

## Security Best Practices

```bash
# 1. Always go.sum commit karo
git add go.sum && git commit -m "update go.sum"

# 2. GONOSUMDB responsibly use karo
GONOSUMDB=*.internal.corp.com  # Sirf genuine private modules

# 3. Module integrity verify karo
go mod verify

# 4. Dependencies audit karo
go list -m -u all                    # Outdated deps
govulncheck ./...                    # Security vulnerabilities

# 5. Vendor directory use karo (high-security environments)
go mod vendor
go build -mod=vendor ./...

# 6. GOPROXY=off for critical builds (neta network nahi)
GOPROXY=off go build ./...           # Sirf cached modules use karo
```

---

## Proxy Comparison Table

| Proxy | Public/Private | Self-hosted | Notes |
|-------|---------------|-------------|-------|
| **proxy.golang.org** | Public only | ❌ | Google operated, default |
| **goproxy.cn** | Public | ❌ | China ke liye |
| **Athens** | Both | ✅ | Open source |
| **Nexus** | Both | ✅ | Enterprise |
| **Artifactory** | Both | ✅ | Enterprise |
| **GOPROXY=direct** | Both | N/A | No proxy |
