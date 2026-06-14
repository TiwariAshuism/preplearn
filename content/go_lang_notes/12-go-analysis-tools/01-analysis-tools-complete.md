# 01 — Go Language Analysis & Tools
> AST, Parser, Printer, Scanner, Type Checker, Build Context, gofmt, Importer

---

## Go Analysis Toolchain — Big Picture

```
Source Code (.go)
      │
      ▼
┌─────────────┐
│ go/scanner   │ ← Lexical analysis (tokens)
│ go/token     │    IDENT, INT, STRING, FUNC, IF, ...
└──────┬──────┘
       ▼
┌─────────────┐
│ go/parser    │ ← Syntax analysis (AST)
│              │    FuncDecl, IfStmt, BinaryExpr, ...
└──────┬──────┘
       ▼
┌─────────────┐
│ go/ast       │ ← AST manipulation & inspection
│              │    Walk, Inspect, Filter, ...
└──────┬──────┘
       ▼
┌─────────────┐
│ go/types     │ ← Type checking & semantic analysis
│              │    Types, Scopes, Objects, ...
└──────┬──────┘
       ▼
┌──────────────────────────────────────┐
│ go/printer  │ go/format  │ go/doc   │
│ AST → Code  │ gofmt      │ Doc gen  │
└──────────────────────────────────────┘
```

---

## go/scanner & go/token — Lexical Analysis

```go
import (
    "go/scanner"
    "go/token"
)

src := []byte(`package main
import "fmt"
func main() { fmt.Println("hello") }
`)

fset := token.NewFileSet()
file := fset.AddFile("example.go", fset.Base(), len(src))

var s scanner.Scanner
s.Init(file, src, nil, scanner.ScanComments)

for {
    pos, tok, lit := s.Scan()
    if tok == token.EOF { break }
    fmt.Printf("%s\t%s\t%q\n", fset.Position(pos), tok, lit)
}

// Output:
// example.go:1:1   PACKAGE   "package"
// example.go:1:9   IDENT     "main"
// example.go:1:13  ;         "\n"
// example.go:2:1   IMPORT    "import"
// example.go:2:8   STRING    "\"fmt\""
// ...
```

### Token Types
```go
// Keywords
token.BREAK, token.CASE, token.CHAN, token.CONST, token.CONTINUE
token.DEFAULT, token.DEFER, token.ELSE, token.FALLTHROUGH, token.FOR
token.FUNC, token.GO, token.GOTO, token.IF, token.IMPORT
token.INTERFACE, token.MAP, token.PACKAGE, token.RANGE, token.RETURN
token.SELECT, token.STRUCT, token.SWITCH, token.TYPE, token.VAR

// Operators
token.ADD      // +
token.SUB      // -
token.MUL      // *
token.QUO      // /
token.ASSIGN   // =
token.DEFINE   // :=
token.ARROW    // <-

// Literals
token.IDENT    // identifier
token.INT      // integer literal
token.FLOAT    // float literal
token.STRING   // string literal

// Delimiters
token.LPAREN   // (
token.RPAREN   // )
token.LBRACE   // {
token.RBRACE   // }
token.LBRACK   // [
token.RBRACK   // ]
```

---

## go/parser — Source → AST

```go
import (
    "go/parser"
    "go/token"
    "go/ast"
)

// Parse single file
fset := token.NewFileSet()
file, err := parser.ParseFile(fset, "main.go", src, parser.ParseComments)

// Parse directory
pkgs, err := parser.ParseDir(fset, "./mypackage", nil, parser.ParseComments)

// Parse expression
expr, err := parser.ParseExpr("a + b * c")

// Parse modes
parser.ParseComments  // preserve comments
parser.Trace          // print parsing trace
parser.DeclarationErrors // report declaration errors
parser.AllErrors      // report ALL errors
parser.SkipObjectResolution // skip identifier resolution
```

---

## go/ast — Abstract Syntax Tree

### AST Node Types
```go
// Expressions
ast.Ident         // identifier: x, myFunc
ast.BasicLit      // literal: 42, "hello", 3.14
ast.BinaryExpr    // binary: a + b
ast.UnaryExpr     // unary: -x, !ok
ast.CallExpr      // function call: f(x)
ast.SelectorExpr  // qualified: pkg.Name
ast.IndexExpr     // index: a[i]
ast.SliceExpr     // slice: a[1:3]
ast.TypeAssertExpr // type assert: x.(T)
ast.FuncLit       // func literal: func() {}
ast.CompositeLit  // composite: &S{x: 1}

// Statements
ast.AssignStmt    // x = 5, x := 5
ast.ReturnStmt    // return x
ast.IfStmt        // if ... { }
ast.ForStmt       // for ... { }
ast.RangeStmt     // for k, v := range ...
ast.SwitchStmt    // switch ...
ast.SelectStmt    // select ...
ast.GoStmt        // go f()
ast.DeferStmt     // defer f()
ast.SendStmt      // ch <- x
ast.BlockStmt     // { ... }
ast.ExprStmt      // expression as statement

// Declarations
ast.FuncDecl      // func f() {}
ast.GenDecl       // var/const/type/import declarations
ast.ValueSpec     // var x int = 5
ast.TypeSpec      // type T struct {}
ast.ImportSpec    // import "fmt"
```

### Walking the AST
```go
// Inspect — simple visitor
ast.Inspect(file, func(n ast.Node) bool {
    if call, ok := n.(*ast.CallExpr); ok {
        if sel, ok := call.Fun.(*ast.SelectorExpr); ok {
            fmt.Printf("Method call: %s.%s\n", sel.X, sel.Sel.Name)
        }
    }
    return true  // continue walking
})

// Walk — full visitor pattern
type visitor struct{}
func (v visitor) Visit(node ast.Node) ast.Visitor {
    if node != nil {
        fmt.Printf("%T\n", node)
    }
    return v
}
ast.Walk(visitor{}, file)
```

### Example: Find All Function Names
```go
fset := token.NewFileSet()
file, _ := parser.ParseFile(fset, "main.go", src, 0)

for _, decl := range file.Decls {
    if fn, ok := decl.(*ast.FuncDecl); ok {
        fmt.Printf("Function: %s at %s\n", 
            fn.Name.Name, fset.Position(fn.Pos()))
    }
}
```

### Example: Find All String Literals
```go
ast.Inspect(file, func(n ast.Node) bool {
    if lit, ok := n.(*ast.BasicLit); ok && lit.Kind == token.STRING {
        fmt.Printf("String: %s\n", lit.Value)
    }
    return true
})
```

---

## go/types — Type Checker

```go
import "go/types"

// Setup
conf := types.Config{
    Importer: importer.Default(),  // import standard library
}

// Type check
info := &types.Info{
    Types: make(map[ast.Expr]types.TypeAndValue),
    Defs:  make(map[*ast.Ident]types.Object),
    Uses:  make(map[*ast.Ident]types.Object),
}

pkg, err := conf.Check("mypackage", fset, []*ast.File{file}, info)

// Query types
for expr, tv := range info.Types {
    fmt.Printf("Expression %s has type %s\n", 
        fset.Position(expr.Pos()), tv.Type)
}

// Query definitions
for ident, obj := range info.Defs {
    if obj != nil {
        fmt.Printf("%s defined as %s\n", ident.Name, obj.Type())
    }
}
```

### Type Representations
```go
// Basic types
types.Typ[types.Int]       // int
types.Typ[types.String]    // string
types.Typ[types.Bool]      // bool

// Check type relationships
types.AssignableTo(src, dst)      // src assignable to dst?
types.ConvertibleTo(src, dst)     // src convertible to dst?
types.Implements(typ, iface)      // typ implements iface?
types.Identical(t1, t2)           // t1 == t2?
types.IdenticalIgnoreTags(t1, t2) // same but ignore struct tags
```

---

## go/printer — AST → Source Code

```go
import "go/printer"

// Print AST back to source
var buf bytes.Buffer
printer.Fprint(&buf, fset, file)
fmt.Println(buf.String())

// With config
cfg := printer.Config{
    Mode:     printer.UseSpaces | printer.TabIndent,
    Tabwidth: 4,
}
cfg.Fprint(&buf, fset, file)
```

---

## go/format — gofmt Programmatically

```go
import "go/format"

// Format source code
formatted, err := format.Source([]byte(uglyCode))

// Format AST node
var buf bytes.Buffer
format.Node(&buf, fset, node)
```

### gofmt Command
```bash
# Format file (print to stdout)
gofmt main.go

# Format in place
gofmt -w main.go

# Format directory
gofmt -w ./...

# Show diff
gofmt -d main.go

# Simplify code
gofmt -s main.go  # e.g., []int{int(1)} → []int{1}
```

---

## go/doc — Documentation Extraction

```go
import "go/doc"

// Extract documentation from AST
pkg := doc.New(astPkg, "mypackage", doc.AllDecls)

fmt.Println("Package:", pkg.Name)
fmt.Println("Doc:", pkg.Doc)

for _, f := range pkg.Funcs {
    fmt.Printf("func %s: %s\n", f.Name, f.Doc)
}

for _, t := range pkg.Types {
    fmt.Printf("type %s: %s\n", t.Name, t.Doc)
    for _, m := range t.Methods {
        fmt.Printf("  method %s: %s\n", m.Name, m.Doc)
    }
}

// Synopsis (first sentence)
synopsis := doc.Synopsis("Package fmt implements formatted I/O.")
// "Package fmt implements formatted I/O."
```

---

## go/build — Build Context

```go
import "go/build"

// Default build context
ctx := build.Default
fmt.Println("GOPATH:", ctx.GOPATH)
fmt.Println("GOROOT:", ctx.GOROOT)
fmt.Println("GOOS:", ctx.GOOS)
fmt.Println("GOARCH:", ctx.GOARCH)
fmt.Println("CGO:", ctx.CgoEnabled)

// Import a package
pkg, err := ctx.Import("fmt", "", build.FindOnly)
fmt.Println("Dir:", pkg.Dir)
fmt.Println("GoFiles:", pkg.GoFiles)
fmt.Println("Imports:", pkg.Imports)

// Import from directory
pkg, err = ctx.ImportDir("/path/to/package", 0)

// Build tags / constraints
ctx.BuildTags = []string{"integration", "linux"}
```

---

## go/importer — Package Importer

```go
import "go/importer"

// Default importer (for standard library)
imp := importer.Default()

// Import a package for type checking
pkg, err := imp.Import("fmt")
scope := pkg.Scope()

for _, name := range scope.Names() {
    obj := scope.Lookup(name)
    fmt.Printf("%s: %s\n", name, obj.Type())
}

// For source → use importer.ForCompiler with "source" lookup
```

---

## go/constant — Constant Evaluation

```go
import "go/constant"

// Create constants
a := constant.MakeInt64(42)
b := constant.MakeInt64(8)

// Arithmetic
sum := constant.BinaryOp(a, token.ADD, b)   // 50
product := constant.BinaryOp(a, token.MUL, b) // 336

// String constants
s := constant.MakeString("hello")
length := constant.MakeInt64(int64(len(constant.StringVal(s))))

// Boolean
t := constant.MakeBool(true)

// Extract values
val, _ := constant.Int64Val(sum)  // 50
str := constant.StringVal(s)       // "hello"

// Comparisons
result := constant.Compare(a, token.GTR, b)  // true (42 > 8)

// Arbitrary precision!
big := constant.MakeFromLiteral("999999999999999999999999999999", token.INT, 0)
```

---

## go/version — Version Comparison

```go
import "go/version"

// Compare Go versions
result := version.Compare("go1.21", "go1.22")
// -1 (1.21 < 1.22)

// Check validity
version.IsValid("go1.21")    // true
version.IsValid("go1.21.5")  // true
version.IsValid("1.21")      // false (needs "go" prefix)

// Language version
version.Lang("go1.21.5")  // "go1.21"
version.Lang("go1.22rc1") // "go1.22"
```

---

## Practical Example: Custom Linter

```go
func checkNoFmt(filename string, src []byte) []string {
    fset := token.NewFileSet()
    file, err := parser.ParseFile(fset, filename, src, parser.ImportsOnly)
    if err != nil { return nil }
    
    var issues []string
    for _, imp := range file.Imports {
        if imp.Path.Value == `"fmt"` {
            issues = append(issues, fmt.Sprintf(
                "%s: avoid using fmt package, use log/slog instead",
                fset.Position(imp.Pos())))
        }
    }
    return issues
}
```

### Example: Rename All Variables
```go
func renameVar(file *ast.File, oldName, newName string) {
    ast.Inspect(file, func(n ast.Node) bool {
        if ident, ok := n.(*ast.Ident); ok {
            if ident.Name == oldName {
                ident.Name = newName
            }
        }
        return true
    })
}
```
