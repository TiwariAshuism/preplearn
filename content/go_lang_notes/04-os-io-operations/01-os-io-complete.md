# 01 — OS Interaction & I/O Operations
> File system, process management, signals, environment, io interfaces

---

## os Package — File Operations

### File CRUD
```go
import "os"

// Create / Write
f, err := os.Create("output.txt")           // create or truncate
f.WriteString("Hello, Go!\n")
f.Write([]byte("more data"))
f.Close()

// Write entire file at once
os.WriteFile("config.txt", []byte("data"), 0644)

// Read entire file
data, err := os.ReadFile("config.txt")

// Open for reading
f, err := os.Open("config.txt")  // read-only
defer f.Close()

// Open with flags
f, err := os.OpenFile("log.txt",
    os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)

// Delete
os.Remove("file.txt")        // single file
os.RemoveAll("directory/")   // recursive
```

### File Flags

| Flag | Purpose |
|------|---------|
| `os.O_RDONLY` | Read only |
| `os.O_WRONLY` | Write only |
| `os.O_RDWR` | Read+Write |
| `os.O_CREATE` | Create if not exists |
| `os.O_APPEND` | Append to file |
| `os.O_TRUNC` | Truncate file |
| `os.O_EXCL` | Error if file exists |
| `os.O_SYNC` | Synchronous I/O |

### File Info
```go
info, err := os.Stat("file.txt")
if os.IsNotExist(err) {
    fmt.Println("File doesn't exist!")
}

fmt.Println("Name:", info.Name())
fmt.Println("Size:", info.Size())
fmt.Println("Mode:", info.Mode())
fmt.Println("ModTime:", info.ModTime())
fmt.Println("IsDir:", info.IsDir())
```

### Directory Operations
```go
// Create directory
os.Mkdir("dir", 0755)
os.MkdirAll("path/to/nested/dir", 0755)  // recursive

// Read directory
entries, _ := os.ReadDir(".")
for _, entry := range entries {
    info, _ := entry.Info()
    fmt.Printf("%s\t%d\t%s\n", entry.Name(), info.Size(), 
        map[bool]string{true: "DIR", false: "FILE"}[entry.IsDir()])
}

// Change directory
os.Chdir("/tmp")
cwd, _ := os.Getwd()

// Temp file/dir
f, _ := os.CreateTemp("", "prefix-*.txt")  // "" = os temp dir
dir, _ := os.MkdirTemp("", "myapp-*")
```

### File Permissions
```go
// Chmod
os.Chmod("file.txt", 0644)

// Chown (Unix only)
os.Chown("file.txt", uid, gid)

// Permission bits:
// 0644 = rw-r--r--  (owner: rw, group: r, others: r)
// 0755 = rwxr-xr-x  (owner: rwx, group: rx, others: rx)
// 0600 = rw-------  (owner only)
```

### Symlinks & Links
```go
os.Symlink("target.txt", "link.txt")     // symbolic link
os.Link("target.txt", "hardlink.txt")    // hard link
target, _ := os.Readlink("link.txt")     // read symlink target

// Lstat doesn't follow symlinks
info, _ := os.Lstat("link.txt")          // info about the link itself
```

---

## os/exec — External Commands

```go
import "os/exec"

// Simple command
cmd := exec.Command("ls", "-la", "/tmp")
output, err := cmd.Output()  // stdout only
fmt.Println(string(output))

// Combined output (stdout + stderr)
output, err := cmd.CombinedOutput()

// Separate stdout/stderr
var stdout, stderr bytes.Buffer
cmd := exec.Command("git", "status")
cmd.Stdout = &stdout
cmd.Stderr = &stderr
err := cmd.Run()

// Start + Wait (non-blocking)
cmd := exec.Command("sleep", "5")
cmd.Start()  // starts process, doesn't wait
// ... do other stuff ...
cmd.Wait()   // now wait for completion

// With context (timeout/cancellation)
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()
cmd := exec.CommandContext(ctx, "long-running-task")
output, err := cmd.Output()

// Environment
cmd := exec.Command("myapp")
cmd.Env = append(os.Environ(), "MY_VAR=value")
cmd.Dir = "/working/directory"

// Stdin pipe
cmd := exec.Command("wc", "-l")
cmd.Stdin = strings.NewReader("line1\nline2\nline3\n")
output, _ := cmd.Output()
// "3"

// Interactive stdin/stdout pipes
cmd := exec.Command("cat")
stdin, _ := cmd.StdinPipe()
stdout, _ := cmd.StdoutPipe()
cmd.Start()
stdin.Write([]byte("hello\n"))
stdin.Close()
io.Copy(os.Stdout, stdout)
cmd.Wait()
```

### LookPath
```go
// Find executable in PATH
path, err := exec.LookPath("python3")
fmt.Println(path)  // /usr/bin/python3
```

---

## os/signal — Signal Handling

```go
import (
    "os"
    "os/signal"
    "syscall"
)

// Catch signals
sigCh := make(chan os.Signal, 1)
signal.Notify(sigCh, 
    os.Interrupt,      // Ctrl+C (SIGINT)
    syscall.SIGTERM,   // kill command
    syscall.SIGHUP,    // terminal hangup
)

go func() {
    sig := <-sigCh
    fmt.Println("Received signal:", sig)
    // cleanup...
    os.Exit(0)
}()

// Stop receiving signals
signal.Stop(sigCh)

// Reset signal to default behavior
signal.Reset(os.Interrupt)

// Context-based (Go 1.16+)
ctx, stop := signal.NotifyContext(context.Background(), 
    os.Interrupt, syscall.SIGTERM)
defer stop()

// ctx.Done() will be closed on signal
<-ctx.Done()
fmt.Println("Shutting down...")
```

### Common Signals

| Signal | Number | Default | Use |
|--------|--------|---------|-----|
| SIGINT | 2 | Terminate | Ctrl+C |
| SIGTERM | 15 | Terminate | `kill` command |
| SIGHUP | 1 | Terminate | Config reload |
| SIGUSR1 | 10 | Terminate | Custom |
| SIGUSR2 | 12 | Terminate | Custom |
| SIGKILL | 9 | Kill | Cannot catch! |
| SIGSTOP | 19 | Stop | Cannot catch! |

---

## Environment Variables

```go
// Get
value := os.Getenv("HOME")
value, exists := os.LookupEnv("MY_VAR")

// Set
os.Setenv("MY_VAR", "hello")

// Unset
os.Unsetenv("MY_VAR")

// All environment
for _, env := range os.Environ() {
    parts := strings.SplitN(env, "=", 2)
    fmt.Printf("%s = %s\n", parts[0], parts[1])
}

// Clear all
os.Clearenv()

// Expand variables in string
path := os.ExpandEnv("$HOME/.config/${APP_NAME}")
```

---

## os/user — User Information

```go
import "os/user"

// Current user
u, _ := user.Current()
fmt.Println(u.Username)  // "ashutosh"
fmt.Println(u.HomeDir)   // "/home/ashutosh"
fmt.Println(u.Uid)       // "1000"
fmt.Println(u.Gid)       // "1000"

// Lookup by name
u, _ = user.Lookup("root")

// Lookup by ID
u, _ = user.LookupId("0")

// Group lookup
g, _ := user.LookupGroup("sudo")
fmt.Println(g.Gid, g.Name)
```

---

## io Package — Core Interfaces

### Fundamental Interfaces
```go
// Reader — read bytes from a source
type Reader interface {
    Read(p []byte) (n int, err error)
}

// Writer — write bytes to a destination
type Writer interface {
    Write(p []byte) (n int, err error)
}

// Closer — release resources
type Closer interface {
    Close() error
}

// Seeker — random access
type Seeker interface {
    Seek(offset int64, whence int) (int64, error)
}

// Combined interfaces
type ReadWriter interface { Reader; Writer }
type ReadCloser interface { Reader; Closer }
type WriteCloser interface { Writer; Closer }
type ReadWriteCloser interface { Reader; Writer; Closer }
type ReadSeeker interface { Reader; Seeker }
type ReadWriteSeeker interface { Reader; Writer; Seeker }
```

### io Utility Functions
```go
import "io"

// Copy all data
n, err := io.Copy(dst, src)           // reads until EOF
n, err := io.CopyN(dst, src, 1024)    // copy exactly N bytes
n, err := io.CopyBuffer(dst, src, buf) // with custom buffer

// Read all
data, err := io.ReadAll(reader)

// Read exactly N bytes
buf := make([]byte, 100)
_, err := io.ReadFull(reader, buf)  // error if < 100 bytes

// ReadAtLeast
_, err := io.ReadAtLeast(reader, buf, 50) // at least 50 bytes

// Write string
io.WriteString(writer, "hello")

// Discard reader output
io.Copy(io.Discard, reader)

// Pipe — in-memory io.Reader ↔ io.Writer
pr, pw := io.Pipe()
go func() {
    pw.Write([]byte("hello from writer"))
    pw.Close()
}()
data, _ := io.ReadAll(pr)

// MultiReader — concatenate readers
r := io.MultiReader(reader1, reader2, reader3)

// MultiWriter — tee (write to multiple writers)
w := io.MultiWriter(file, os.Stdout, &buf)

// TeeReader — read and copy simultaneously
tee := io.TeeReader(reader, &logBuf)
io.Copy(destination, tee)  // data goes to both destination AND logBuf

// LimitReader — limit how much can be read
limited := io.LimitReader(reader, 1024)  // max 1024 bytes

// SectionReader — read a section of ReadAt
section := io.NewSectionReader(readerAt, offset, length)

// NopCloser — add Close() to a Reader
rc := io.NopCloser(reader)  // returns ReadCloser
```

---

## io/fs — File System Interface (Go 1.16+)

```go
import "io/fs"

// Walk directory tree
fs.WalkDir(os.DirFS("."), ".", func(path string, d fs.DirEntry, err error) error {
    if err != nil { return err }
    fmt.Println(path)
    return nil
})

// Glob pattern matching
matches, _ := fs.Glob(os.DirFS("."), "*.go")

// Read file from FS
data, _ := fs.ReadFile(myFS, "config.json")

// Sub filesystem
sub, _ := fs.Sub(myFS, "templates")

// Embedded files
//go:embed templates/*
var templateFS embed.FS

// Use with http
http.Handle("/", http.FileServer(http.FS(templateFS)))
```

---

## bufio — Buffered I/O

```go
import "bufio"

// Buffered Reader
reader := bufio.NewReader(file)
reader = bufio.NewReaderSize(file, 64*1024) // 64KB buffer

// Read line
line, err := reader.ReadString('\n')

// Scanner (line by line — most common)
scanner := bufio.NewScanner(file)
scanner.Buffer(make([]byte, 1024*1024), 1024*1024) // max 1MB lines
for scanner.Scan() {
    fmt.Println(scanner.Text())
}
if err := scanner.Err(); err != nil {
    log.Fatal(err)
}

// Custom split function
scanner.Split(bufio.ScanWords)  // word by word
scanner.Split(bufio.ScanRunes)  // rune by rune
scanner.Split(bufio.ScanBytes)  // byte by byte

// Custom splitter
scanner.Split(func(data []byte, atEOF bool) (advance int, token []byte, err error) {
    // split on double newline
    if i := bytes.Index(data, []byte("\n\n")); i >= 0 {
        return i + 2, data[:i], nil
    }
    if atEOF && len(data) > 0 {
        return len(data), data, nil
    }
    return 0, nil, nil
})

// Buffered Writer
writer := bufio.NewWriter(file)
writer.WriteString("hello\n")
writer.Flush()  // MUST flush before closing!
```

---

## path/filepath — Path Manipulation

```go
import "path/filepath"

// Join paths (OS-aware separators)
p := filepath.Join("home", "user", "docs", "file.txt")
// Linux: "home/user/docs/file.txt"
// Windows: "home\\user\\docs\\file.txt"

// Split
dir, file := filepath.Split("/home/user/file.txt")
// dir = "/home/user/", file = "file.txt"

// Extension
ext := filepath.Ext("photo.jpg")  // ".jpg"

// Base name
base := filepath.Base("/path/to/file.txt")  // "file.txt"

// Directory
dir := filepath.Dir("/path/to/file.txt")  // "/path/to"

// Absolute path
abs, _ := filepath.Abs("relative/path")

// Clean path (resolve . and ..)
clean := filepath.Clean("/a/b/../c/./d")  // "/a/c/d"

// Relative path
rel, _ := filepath.Rel("/a/b", "/a/b/c/d")  // "c/d"

// Match glob
matched, _ := filepath.Match("*.go", "main.go")  // true

// Walk directory
filepath.WalkDir(".", func(path string, d fs.DirEntry, err error) error {
    if err != nil { return err }
    if filepath.Ext(path) == ".go" {
        fmt.Println(path)
    }
    return nil
})

// Glob
files, _ := filepath.Glob("/tmp/*.log")
```

---

## Process Info & Control

```go
// Current process
pid := os.Getpid()
ppid := os.Getppid()

// Exit
os.Exit(0)  // success
os.Exit(1)  // failure

// Command line args
args := os.Args  // [program, arg1, arg2, ...]

// Hostname
host, _ := os.Hostname()

// Page size
pageSize := os.Getpagesize()

// Process state
proc, _ := os.FindProcess(pid)
proc.Signal(syscall.SIGTERM)  // send signal
state, _ := proc.Wait()       // wait for process
```

---

## Error Types

```go
// Sentinel errors
os.ErrNotExist     // file doesn't exist
os.ErrExist        // file already exists
os.ErrPermission   // permission denied
os.ErrClosed       // file already closed

// Check error type
if errors.Is(err, os.ErrNotExist) {
    fmt.Println("File not found!")
}

// PathError — detailed error
var pathErr *os.PathError
if errors.As(err, &pathErr) {
    fmt.Printf("Op: %s, Path: %s, Err: %v\n", 
        pathErr.Op, pathErr.Path, pathErr.Err)
}
```
