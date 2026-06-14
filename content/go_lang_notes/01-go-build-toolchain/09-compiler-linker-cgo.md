# 09 — Go Compiler: Internal Architecture & Optimization
> Source code se machine code tak ka safar — 7 phases mein

---

## Compiler Pipeline — Big Picture

Go compiler ko `gc` bolte hain (Garbage Collector nahi, Go Compiler!). Ye `src/cmd/compile` mein rehta hai.

```
Go Source Code (.go files)
        │
        ▼
  ┌─────────────────┐
  │  Phase 1: Parse  │  ← Source → AST
  │  (go/parser)     │
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │ Phase 2: Type    │  ← AST → Typed AST
  │  Checking        │
  │  (types2)        │
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │ Phase 3: IR      │  ← Typed AST → IR (Intermediate Representation)
  │  Construction    │
  │  (noder/irgen)   │
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │ Phase 4: Middle  │  ← Optimizations on IR
  │  End (deadcode,  │     (inlining, escape analysis, etc.)
  │  inline, escape) │
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │ Phase 5: Walk    │  ← Complex IR → Simple IR
  │  (desugar)       │     (loops, maps, channels simplified)
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │ Phase 6: SSA     │  ← IR → SSA Form → Machine Code
  │  Generation      │     (register allocation, scheduling)
  │  (ssa package)   │
  └────────┬────────┘
           ▼
  ┌─────────────────┐
  │ Phase 7: Machine │  ← Machine code → .o object file
  │  Code Emission   │
  │  (obj package)   │
  └─────────────────┘
```

---

## Phase 1: Parsing — Source → AST

```go
// Go source:
func add(a, b int) int {
    return a + b
}

// AST (Abstract Syntax Tree):
// FuncDecl
// ├── Name: "add"
// ├── Type: FuncType
// │   ├── Params: [a int, b int]
// │   └── Results: [int]
// └── Body: BlockStmt
//     └── ReturnStmt
//         └── BinaryExpr (a + b)
```

- `go/parser` package se parse hota hai
- Har `.go` file ka ek `ast.File` banta hai
- Comments, positions sab preserve hote hain

---

## Phase 2: Type Checking — Types2

```go
// Compiler check karta hai:
var x int = "hello"  // ERROR: cannot use "hello" (string) as int

// Interface satisfaction:
var _ io.Writer = &MyStruct{}  // MyStruct ne Write implement kiya?
```

- `types2` package (adaptation of `go/types`)
- Type correctness verify karta hai
- Constants evaluate hote hain
- Method sets check hote hain

---

## Phase 3: IR (Intermediate Representation) Construction

AST se IR banta hai — ye compiler ka internal representation hai.

```
IR nodes = simplified Go constructs
- Variables track hoti hain
- Types resolved hote hain
- Function bodies IR mein convert hote hain
```

- `noder` package handles this
- Generics ke instantiation bhi yahan hote hain

---

## Phase 4: Middle End — Optimizations

### Inlining — Small functions inline ho jaati hain

```go
// Before inlining:
func square(x int) int { return x * x }
result := square(5)

// After inlining (compiler internally):
result := 5 * 5
```

```bash
# Inlining decisions dekho:
go build -gcflags="-m" .
# output: ./main.go:5:6: can inline square
# output: ./main.go:10:15: inlining call to square
```

### Escape Analysis — Heap vs Stack

```go
func example() *int {
    x := 42       // x escape karta hai kyunki pointer return ho raha hai
    return &x     // x heap pe allocate hoga
}

func noEscape() int {
    x := 42       // x stack pe rahega (fast!)
    return x
}
```

```bash
# Escape analysis dekho:
go build -gcflags="-m=2" .
# output: ./main.go:3:2: x escapes to heap
```

### Dead Code Elimination

```go
func unused() {  // ye function call nahi ho raha → eliminate
    fmt.Println("nobody calls me")
}
```

- `deadlocals` package: unused local variables hatata hai
- Dead code elimination linker bhi karta hai

---

## Phase 5: Walk — Desugaring

Complex Go constructs ko simple operations mein convert karta hai:

```go
// Before Walk:
for k, v := range myMap { ... }

// After Walk (internally):
// → runtime.mapiterinit()
// → runtime.mapiternext()
// → temporary variables allocate

// Before Walk:
ch <- value

// After Walk:
// → runtime.chansend1()
```

- Maps, channels, slices ke operations → runtime function calls
- String concatenation → runtime calls
- Interface conversions → runtime calls

---

## Phase 6: SSA (Static Single Assignment)

SSA form mein har variable **sirf ek baar** assign hoti hai:

```go
// Normal IR:
x = 5
x = x + 1    // x reassigned!

// SSA form:
x1 = 5
x2 = x1 + 1  // new variable
```

### SSA Optimizations:
- **Constant propagation** — `x = 5; y = x + 3` → `y = 8`
- **Copy propagation** — unnecessary copies remove
- **Common subexpression elimination** — same calculation ek baar karo
- **Dead store elimination** — unused writes remove
- **Register allocation** — variables ko CPU registers mein map karo
- **Instruction scheduling** — CPU pipeline ke liye reorder

```bash
# SSA visualization:
GOSSAFUNC=main go build .
# → ssa.html file generate hogi — browser mein dekho!
```

---

## Phase 7: Machine Code Emission

SSA se platform-specific machine code:
- x86-64: `MOVQ`, `ADDQ`, `CALL`, etc.
- ARM64: `MOV`, `ADD`, `BL`, etc.
- Object file (`.o`) produce hota hai

---

## Compiler Flags — Useful Ones

```bash
# Optimization info (inlining + escape analysis)
go build -gcflags="-m" .

# More detailed
go build -gcflags="-m=2" .

# Disable optimizations (debugging ke liye)
go build -gcflags="-N -l" .
# -N = disable optimizations
# -l = disable inlining

# SSA HTML visualization
GOSSAFUNC=functionName go build .

# Assembly output
go build -gcflags="-S" .

# Sab packages ke liye flags
go build -gcflags="all=-m" .

# Race detector on
go build -race .

# Bounds check disable (DANGEROUS - only benchmarks)
go build -gcflags="-B" .
```

---

## ABI (Application Binary Interface)

Go ke do ABIs hain:

| ABI | Purpose | Details |
|-----|---------|---------|
| **ABI0** | Assembly compatibility | Stack-based arguments (stable) |
| **ABIInternal** | Go-to-Go calls | Register-based arguments (fast) |

### Register-based Calling Convention (Go 1.17+)
```
// ABI0 (old):
// Sab arguments stack pe push hote the
// CALL → stack se arguments read

// ABIInternal (new):
// First few args → registers (RAX, RBX, RCX...)
// Overflow → stack pe
// ~5-10% performance improvement!
```

---

## Common Optimization Patterns

### Bounds Check Elimination (BCE)
```go
// Compiler smart hai:
s := make([]int, 10)
for i := 0; i < len(s); i++ {
    s[i] = i  // bounds check NOT needed (compiler knows i < len(s))
}
```

### Prove Pass
```go
// Compiler "proves" ki index safe hai:
if i >= 0 && i < len(s) {
    _ = s[i]  // bounds check eliminated!
}
```

### String Optimization
```go
// Compiler optimizes:
s := "hello" + " " + "world"
// → compile time pe concatenate → single string constant
```

---

# 10 — Go Linker: Executable Generation
> Object files se final binary banana

---

## Linker Kya Karta Hai?

```
Compiler Output (.o files)
    + Standard Library (.a files)
    + Dependencies (.a files)
        │
        ▼
    Go Linker (cmd/link)
        │
        ├── Symbol Resolution
        ├── Dead Code Elimination
        ├── Relocation
        ├── DWARF Debug Info
        └── Binary Layout
        │
        ▼
    Final Executable Binary
```

---

## Build Modes

```bash
# Default: standalone executable
go build -o app .

# Shared library
go build -buildmode=c-shared -o libapp.so .

# C archive (static library for C programs)
go build -buildmode=c-archive -o libapp.a .

# Plugin (Go 1.8+, Linux only)
go build -buildmode=plugin -o plugin.so .

# Position Independent Executable
go build -buildmode=pie -o app .
```

| Mode | Output | Use Case |
|------|--------|----------|
| `exe` (default) | Standalone binary | Normal Go programs |
| `c-shared` | `.so` / `.dll` / `.dylib` | C programs se call karna |
| `c-archive` | `.a` static lib | C programs mein link karna |
| `plugin` | `.so` plugin | Runtime mein load karna |
| `pie` | PIE binary | Security (ASLR support) |

---

## Linker Flags (`-ldflags`)

```bash
# Debug symbols remove (smaller binary)
go build -ldflags="-s -w" .
# -s → symbol table hatao
# -w → DWARF debug info hatao

# Version inject
go build -ldflags="-X main.version=v1.2.3" .

# External linker use karo
go build -ldflags="-linkmode=external" .

# Static linking (CGO ke saath bhi)
go build -ldflags="-linkmode=external -extldflags=-static" .
```

---

## Dead Code Elimination

Linker **flood-fill algorithm** use karta hai:

```
1. Entry point (main.main) se start karo
2. Reachable functions/variables mark karo
3. Unreachable code → DELETE from binary

Result: Binary chhoti hoti hai (~30-50% less)
```

---

## DWARF Debug Information

```bash
# Debug info ke saath build (default)
go build -o app .

# Debug info hatao
go build -ldflags="-w" -o app .

# Debug info inspect karo
go tool objdump -s main.main app
go tool nm app | head -20

# Delve debugger use karo
dlv debug ./cmd/server
```

---

# 11 — Cgo: Go aur C Interoperability
> Go se C call karo, C se Go call karo

---

## Cgo Kya Hai?

```go
package main

/*
#include <stdio.h>
#include <stdlib.h>

void say_hello(const char* name) {
    printf("Hello from C, %s!\n", name);
}
*/
import "C"

import (
    "fmt"
    "unsafe"
)

func main() {
    name := C.CString("Gopher")
    defer C.free(unsafe.Pointer(name))

    C.say_hello(name)
    fmt.Println("Back in Go!")
}
```

---

## C Types → Go Types Mapping

| C Type | Go Equivalent | Notes |
|--------|--------------|-------|
| `int` | `C.int` | |
| `long` | `C.long` | |
| `char` | `C.char` | |
| `float` | `C.float` | |
| `double` | `C.double` | |
| `void*` | `unsafe.Pointer` | |
| `char*` | `*C.char` | String conversion zaroori |
| `size_t` | `C.size_t` | |

---

## String Conversion (Important!)

```go
// Go string → C string (MEMORY ALLOCATE hoti hai!)
cStr := C.CString("hello")
defer C.free(unsafe.Pointer(cStr))  // FREE KARNA ZAROORI HAI!

// C string → Go string
goStr := C.GoString(cStr)

// C string with length → Go string
goStr2 := C.GoStringN(cStr, C.int(5))

// Go []byte → C bytes
goBytes := []byte{1, 2, 3}
cBytes := C.CBytes(goBytes)
defer C.free(cBytes)

// C bytes → Go []byte
goBytes2 := C.GoBytes(unsafe.Pointer(cBytes), C.int(3))
```

> **WARNING:** `C.CString` aur `C.CBytes` memory allocate karte hain — `C.free()` se free karna ZAROORI hai, nahi toh memory leak!

---

## Go Functions Export Karna (C se callable)

```go
//export Add
func Add(a, b C.int) C.int {
    return a + b
}

//export Greet
func Greet(name *C.char) {
    fmt.Printf("Hello, %s!\n", C.GoString(name))
}
```

`//export` comment se Go functions C se callable ban jaate hain. Header file `_cgo_export.h` automatically generate hoti hai.

---

## CGO_ENABLED Control

```bash
# CGO enable karo (default on most platforms)
CGO_ENABLED=1 go build .

# CGO disable karo (pure Go, static binary)
CGO_ENABLED=0 go build .

# Cross-compile ke saath CGO (complex!)
CC=x86_64-linux-musl-gcc \
CGO_ENABLED=1 \
GOOS=linux \
GOARCH=amd64 \
go build .
```

---

## Cgo Performance Warning

```
Go function call:        ~2ns
Cgo function call:       ~100-200ns  (50-100x slower!)
```

**Kyun slow?**
- Goroutine stack → OS thread stack switch
- Register save/restore
- GC coordination

**Best practice:** Batched calls karo — ek baar C mein jaao, bahut kaam karo, wapas aao.

---

## Cgo ke Saath Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `gcc not found` | C compiler nahi hai | `apt install gcc` / `xcode-select --install` |
| Cross-compile fail | CGO needs target C compiler | `CC=target-gcc` set karo |
| Memory leak | `C.CString` free nahi kiya | `defer C.free()` add karo |
| Slow performance | Frequent Go↔C switches | Batch calls |
| Binary size bada | C runtime linked | CGO_ENABLED=0 for pure Go |
