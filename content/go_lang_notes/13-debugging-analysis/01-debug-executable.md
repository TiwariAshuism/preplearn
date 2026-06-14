# 01 — Debugging & Executable Analysis
> debug/gosym, debug/dwarf, debug/elf, debug/macho, debug/pe, debug/plan9obj, debug/buildinfo

---

## Overview — debug Packages

```
Go Binary (.exe / ELF / Mach-O)
       │
       ├── debug/buildinfo   → Go version, module info, settings
       ├── debug/elf         → Linux ELF binaries
       ├── debug/macho       → macOS Mach-O binaries
       ├── debug/pe          → Windows PE binaries
       ├── debug/plan9obj    → Plan 9 binaries
       ├── debug/dwarf       → DWARF debug info (cross-platform)
       └── debug/gosym       → Go symbol table
```

---

## debug/buildinfo — Build Information

```go
import "debug/buildinfo"

// Read build info from binary
info, err := buildinfo.ReadFile("/path/to/binary")
if err != nil { log.Fatal(err) }

fmt.Println("Go version:", info.GoVersion)  // go1.22.0
fmt.Println("Path:", info.Path)             // module path
fmt.Println("Main module:", info.Main.Path, info.Main.Version)

// All dependencies
for _, dep := range info.Deps {
    fmt.Printf("  %s %s\n", dep.Path, dep.Version)
}

// Build settings (ldflags, tags, etc.)
for _, s := range info.Settings {
    fmt.Printf("  %s = %s\n", s.Key, s.Value)
}
// Common settings:
// -compiler = gc
// GOOS = linux
// GOARCH = amd64
// vcs = git
// vcs.revision = abc123...
// vcs.time = 2024-01-15T10:30:00Z
// vcs.modified = false

// From running binary (self-inspection)
import "runtime/debug"
info, ok := debug.ReadBuildInfo()
```

### Use Cases
- **Supply chain security:** Verify dependencies
- **Vulnerability scanning:** Check Go version & deps
- **Asset inventory:** Catalog deployed binaries
- **Debugging:** Know exact build configuration

---

## debug/elf — Linux ELF Binaries

```go
import "debug/elf"

f, err := elf.Open("/usr/bin/ls")
defer f.Close()

// Header info
fmt.Println("Class:", f.Class)    // ELFCLASS64
fmt.Println("Type:", f.Type)      // ET_EXEC / ET_DYN
fmt.Println("Machine:", f.Machine) // EM_X86_64
fmt.Println("OS/ABI:", f.OSABI)    // ELFOSABI_LINUX
fmt.Println("Entry:", f.Entry)     // entry point address

// Sections
for _, section := range f.Sections {
    fmt.Printf("Section: %-20s Type: %-15s Size: %d\n",
        section.Name, section.Type, section.Size)
}
// .text    (code)
// .data    (initialized data)
// .bss     (uninitialized data)
// .rodata  (read-only data)
// .symtab  (symbol table)
// .strtab  (string table)
// .debug_* (DWARF debug info)

// Read section data
textSection := f.Section(".text")
data, _ := textSection.Data()

// Symbols
symbols, _ := f.Symbols()
for _, sym := range symbols {
    fmt.Printf("Symbol: %s Value: 0x%x Size: %d\n",
        sym.Name, sym.Value, sym.Size)
}

// Dynamic symbols (shared libraries)
dynSyms, _ := f.DynamicSymbols()

// Imported libraries
libs, _ := f.ImportedLibraries()
// ["libc.so.6", "libpthread.so.0", ...]

// DWARF debug info
dwarf, _ := f.DWARF()
```

---

## debug/macho — macOS Mach-O Binaries

```go
import "debug/macho"

f, err := macho.Open("/usr/bin/ls")
defer f.Close()

// Header
fmt.Println("CPU:", f.Cpu)       // CpuAmd64 / CpuArm64
fmt.Println("Type:", f.Type)     // TypeExec / TypeDylib
fmt.Println("Flags:", f.Flags)

// Sections
for _, section := range f.Sections {
    fmt.Printf("%-20s %-10s Size: %d\n",
        section.Seg, section.Name, section.Size)
}

// Segments
// __TEXT  (code + constants)
// __DATA  (mutable data)
// __LINKEDIT (linker info)

// Load commands
for _, load := range f.Loads {
    fmt.Printf("Load: %T\n", load)
}

// Symbols
symtab := f.Symtab
for _, sym := range symtab.Syms {
    fmt.Printf("Symbol: %s Addr: 0x%x\n", sym.Name, sym.Value)
}

// Imported libraries
libs, _ := f.ImportedLibraries()

// DWARF
dwarf, _ := f.DWARF()

// Fat (Universal) binary
fat, err := macho.OpenFat("/path/to/universal")
for _, arch := range fat.Arches {
    fmt.Printf("Arch: %s\n", arch.Cpu)
}
```

---

## debug/pe — Windows PE Binaries

```go
import "debug/pe"

f, err := pe.Open("program.exe")
defer f.Close()

// Machine type
fmt.Println("Machine:", f.Machine)  // IMAGE_FILE_MACHINE_AMD64

// Optional header
switch oh := f.OptionalHeader.(type) {
case *pe.OptionalHeader64:
    fmt.Println("Entry:", oh.AddressOfEntryPoint)
    fmt.Println("Image base:", oh.ImageBase)
    fmt.Println("Subsystem:", oh.Subsystem)
case *pe.OptionalHeader32:
    // 32-bit
}

// Sections
for _, section := range f.Sections {
    fmt.Printf("%-10s VirtAddr: 0x%x Size: %d\n",
        section.Name, section.VirtualAddress, section.Size)
}
// .text   (code)
// .rdata  (read-only data)
// .data   (data)
// .rsrc   (resources)

// Imported symbols
symbols, _ := f.ImportedSymbols()
for _, sym := range symbols {
    fmt.Println(sym)  // "kernel32.dll:CreateFileW"
}

// Imported libraries
libs, _ := f.ImportedLibraries()
// ["kernel32.dll", "user32.dll", ...]

// DWARF
dwarf, _ := f.DWARF()
```

---

## debug/plan9obj — Plan 9 Binaries

```go
import "debug/plan9obj"

f, err := plan9obj.Open("binary")
defer f.Close()

fmt.Println("Magic:", f.Magic)
fmt.Println("Entry:", f.Entry)

// Sections
for _, section := range f.Sections {
    fmt.Println(section.Name)
}

// Symbols
syms, _ := f.Symbols()
```

> Plan 9 support mostly historical — Go was originally developed on Plan 9.

---

## debug/dwarf — DWARF Debug Information

DWARF = Debugging With Arbitrary Record Formats.
Cross-platform debug info standard (used by GDB, LLDB, Delve).

```go
import "debug/dwarf"

// Get DWARF from any binary format
elfFile, _ := elf.Open("binary")
d, _ := elfFile.DWARF()

// Read compilation units
reader := d.Reader()
for {
    entry, err := reader.Next()
    if err != nil || entry == nil { break }
    
    switch entry.Tag {
    case dwarf.TagCompileUnit:
        name, _ := entry.Val(dwarf.AttrName)
        lang, _ := entry.Val(dwarf.AttrLanguage)
        fmt.Printf("Compile Unit: %s (lang: %v)\n", name, lang)
        
    case dwarf.TagSubprogram:
        name, _ := entry.Val(dwarf.AttrName)
        fmt.Printf("  Function: %s\n", name)
        
    case dwarf.TagVariable:
        name, _ := entry.Val(dwarf.AttrName)
        fmt.Printf("  Variable: %s\n", name)
        
    case dwarf.TagStructType:
        name, _ := entry.Val(dwarf.AttrName)
        fmt.Printf("  Struct: %s\n", name)
    }
}

// Line number info
lineReader, _ := d.LineReader(compileUnit)
var lineEntry dwarf.LineEntry
for {
    err := lineReader.Next(&lineEntry)
    if err != nil { break }
    fmt.Printf("  %s:%d → 0x%x\n", 
        lineEntry.File.Name, lineEntry.Line, lineEntry.Address)
}
```

### Common DWARF Tags
| Tag | Description |
|-----|------------|
| `TagCompileUnit` | Source file |
| `TagSubprogram` | Function/method |
| `TagVariable` | Variable |
| `TagFormalParameter` | Function parameter |
| `TagStructType` | Struct definition |
| `TagMember` | Struct field |
| `TagPointerType` | Pointer type |
| `TagArrayType` | Array type |
| `TagTypedef` | Type alias |
| `TagEnumerationType` | Enum type |

---

## debug/gosym — Go Symbol Table

```go
import "debug/gosym"

// Read Go symbol table from binary
elfFile, _ := elf.Open("go-binary")

// Get symtab and pclntab sections
symtabData, _ := elfFile.Section(".gosymtab").Data()
pclntabData, _ := elfFile.Section(".gopclntab").Data()

// Parse
lineTable := gosym.NewLineTable(pclntabData, elfFile.Section(".text").Addr)
table, err := gosym.NewTable(symtabData, lineTable)

// Lookup function by PC (program counter)
file, line, fn := table.PCToLine(0x4a1234)
fmt.Printf("0x4a1234 → %s:%d in %s\n", file, line, fn.Name)

// Lookup PC by file:line
pc, fn, _ := table.LineToPC("/path/to/main.go", 42)
fmt.Printf("main.go:42 → 0x%x (%s)\n", pc, fn.Name)

// Lookup function by name
fn := table.LookupFunc("main.main")
fmt.Printf("main.main at 0x%x\n", fn.Entry)

// List all functions
for _, fn := range table.Funcs {
    fmt.Printf("%-50s 0x%x - 0x%x\n", fn.Name, fn.Entry, fn.End)
}
```

---

## Practical Examples

### Binary Inspector Tool
```go
func inspectBinary(path string) {
    // Try build info first
    if info, err := buildinfo.ReadFile(path); err == nil {
        fmt.Printf("Go %s | Module: %s %s\n", 
            info.GoVersion, info.Main.Path, info.Main.Version)
        fmt.Printf("Dependencies: %d\n", len(info.Deps))
        return
    }
    
    // Try ELF
    if f, err := elf.Open(path); err == nil {
        defer f.Close()
        fmt.Printf("ELF %s %s\n", f.Class, f.Machine)
        return
    }
    
    // Try Mach-O
    if f, err := macho.Open(path); err == nil {
        defer f.Close()
        fmt.Printf("Mach-O %s\n", f.Cpu)
        return
    }
    
    // Try PE
    if f, err := pe.Open(path); err == nil {
        defer f.Close()
        fmt.Printf("PE Machine: 0x%x\n", f.Machine)
        return
    }
    
    fmt.Println("Unknown binary format")
}
```

### List All Go Functions in Binary
```go
func listGoFunctions(path string) {
    f, _ := elf.Open(path)
    defer f.Close()
    
    symtabData, _ := f.Section(".gosymtab").Data()
    pclntabData, _ := f.Section(".gopclntab").Data()
    lineTable := gosym.NewLineTable(pclntabData, f.Section(".text").Addr)
    table, _ := gosym.NewTable(symtabData, lineTable)
    
    for _, fn := range table.Funcs {
        if strings.HasPrefix(fn.Name, "main.") {
            fmt.Printf("%-40s %s:%d\n", fn.Name, fn.File, fn.LineTable.Line)
        }
    }
}
```

---

## DWARF Stripping & Binary Size

```bash
# Full debug info (default)
go build -o app main.go
# → includes DWARF, symbol table

# Strip debug info (smaller binary)
go build -ldflags="-s -w" -o app main.go
# -s = strip symbol table
# -w = strip DWARF debug info
# ~30% smaller binary!

# Check binary sections
go tool nm app | head
objdump -h app
```

### Binary Size Comparison
| Build | Typical Size |
|-------|-------------|
| Default | 10 MB |
| `-ldflags="-s -w"` | 7 MB |
| + UPX compression | 3 MB |
