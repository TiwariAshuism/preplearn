# 01 — HTML Templating
> html/template — contextual autoescaping, safe content, template management

---

## Basics — html/template

```go
import "html/template"

// Simple template
tmpl := template.Must(template.New("page").Parse(`
<!DOCTYPE html>
<html>
<head><title>{{.Title}}</title></head>
<body>
    <h1>{{.Title}}</h1>
    <p>{{.Content}}</p>
</body>
</html>
`))

data := struct {
    Title   string
    Content string
}{
    Title:   "Hello",
    Content: "Welcome to Go templates!",
}

tmpl.Execute(os.Stdout, data)
```

---

## Contextual Auto-Escaping

html/template ka sabse bada feature — **automatic XSS protection**.

```go
// html/template automatically escapes based on context!

data := struct{ Name string }{ Name: `<script>alert("xss")</script>` }

// In HTML context:
// {{.Name}} → &lt;script&gt;alert(&#34;xss&#34;)&lt;/script&gt;

// In JS context:
// <script>var name = {{.Name}};</script>
// → <script>var name = "\u003cscript\u003ealert(\"xss\")\u003c/script\u003e";</script>

// In URL context:
// <a href="/search?q={{.Name}}">
// → <a href="/search?q=%3cscript%3ealert%28%22xss%22%29%3c%2fscript%3e">

// In CSS context:
// <div style="color: {{.Color}}">
// → escapes dangerous CSS values
```

### html/template vs text/template

| Feature | text/template | html/template |
|---------|--------------|---------------|
| Auto-escaping | ❌ None | ✅ Contextual |
| XSS protection | ❌ | ✅ |
| CSS escaping | ❌ | ✅ |
| JS escaping | ❌ | ✅ |
| URL escaping | ❌ | ✅ |
| Use case | CLI, configs | Web HTML |

---

## Safe Content Types — Bypass Escaping

Jab tumhe pata ho content safe hai, tab use karo:

```go
import "html/template"

// Safe HTML (won't be escaped)
template.HTML(`<strong>Bold text</strong>`)

// Safe CSS
template.CSS(`color: red; font-weight: bold`)

// Safe JavaScript
template.JS(`alert("hello")`)

// Safe JavaScript string
template.JSStr(`hello world`)

// Safe URL
template.URL(`https://example.com/path?q=test`)

// Safe HTML attribute
template.HTMLAttr(`class="highlight" data-id="123"`)

// Safe srcset
template.Srcset(`/img/400.jpg 400w, /img/800.jpg 800w`)
```

### Example
```go
tmpl := template.Must(template.New("").Parse(`
<div>{{.RawHTML}}</div>
<div>{{.SafeHTML}}</div>
`))

data := struct {
    RawHTML  string
    SafeHTML template.HTML
}{
    RawHTML:  "<b>escaped</b>",      // → &lt;b&gt;escaped&lt;/b&gt;
    SafeHTML: template.HTML("<b>not escaped</b>"),  // → <b>not escaped</b>
}
```

> **⚠️ WARNING:** Safe types se XSS protection bypass hoti hai.
> Sirf trusted content ke liye use karo!

---

## Template Actions & Syntax

### Variables & Pipelines
```go
{{.FieldName}}              // access field
{{.Method}}                 // call method (no args)
{{.Method "arg"}}           // call method with args

{{$var := .Name}}           // declare variable
{{$var}}                    // use variable

// Pipeline (Unix pipe style)
{{.Name | printf "%s!"}}
{{.Content | html}}         // NOT needed in html/template (auto-escapes)
```

### Conditionals
```go
{{if .Visible}}
    <p>Visible content</p>
{{else if .Admin}}
    <p>Admin content</p>
{{else}}
    <p>Default content</p>
{{end}}

// with — like if, but also sets dot (.)
{{with .User}}
    <p>Hello, {{.Name}}</p>  // .Name = .User.Name
{{end}}
```

### Loops
```go
{{range .Items}}
    <li>{{.}}</li>
{{end}}

// With index
{{range $i, $item := .Items}}
    <li>{{$i}}: {{$item}}</li>
{{end}}

// Empty fallback
{{range .Items}}
    <li>{{.}}</li>
{{else}}
    <li>No items found</li>
{{end}}
```

### Built-in Functions
```go
{{len .Items}}                      // length
{{index .Slice 0}}                  // index access
{{printf "%d items" (len .Items)}}  // formatted print
{{not .Done}}                       // boolean NOT
{{and .A .B}}                       // boolean AND
{{or .A .B}}                        // boolean OR
{{eq .A .B}}                        // ==
{{ne .A .B}}                        // !=
{{lt .A .B}}                        // <
{{le .A .B}}                        // <=
{{gt .A .B}}                        // >
{{ge .A .B}}                        // >=
{{call .Func .Arg1 .Arg2}}          // call function value
```

### Custom Functions
```go
funcMap := template.FuncMap{
    "upper":   strings.ToUpper,
    "lower":   strings.ToLower,
    "add":     func(a, b int) int { return a + b },
    "safe":    func(s string) template.HTML { return template.HTML(s) },
    "formatDate": func(t time.Time) string { 
        return t.Format("Jan 02, 2006") 
    },
}

tmpl := template.Must(
    template.New("page").Funcs(funcMap).Parse(`
        <h1>{{.Name | upper}}</h1>
        <p>Created: {{.Created | formatDate}}</p>
        <p>Total: {{add .A .B}}</p>
    `))
```

---

## Template Management

### Named Templates & Blocks
```go
// Define named template
{{define "header"}}
<header>
    <nav>{{.SiteName}}</nav>
</header>
{{end}}

// Use named template
{{template "header" .}}

// Block (define + use, with default)
{{block "content" .}}
    <p>Default content</p>
{{end}}
```

### Template Inheritance (Layout Pattern)
```go
// base.html
{{define "base"}}
<!DOCTYPE html>
<html>
<head><title>{{block "title" .}}Default Title{{end}}</title></head>
<body>
    {{block "content" .}}{{end}}
    {{block "footer" .}}<footer>© 2024</footer>{{end}}
</body>
</html>
{{end}}

// page.html
{{define "title"}}My Page{{end}}
{{define "content"}}
    <h1>Hello!</h1>
    <p>Page content here</p>
{{end}}
```

```go
// Parse all templates
tmpl := template.Must(template.ParseFiles("base.html", "page.html"))
tmpl.ExecuteTemplate(w, "base", data)
```

### Parse Glob
```go
// Parse all templates from directory
tmpl := template.Must(template.ParseGlob("templates/*.html"))

// Parse with custom functions
tmpl := template.Must(
    template.New("").Funcs(funcMap).ParseGlob("templates/*.html"))

// List all defined templates
for _, t := range tmpl.Templates() {
    fmt.Println(t.Name())
}
```

### Template Cloning
```go
// Clone for safe concurrent modification
clone, _ := tmpl.Clone()
clone.Parse(`{{define "extra"}}new template{{end}}`)
```

---

## Whitespace Control

```go
// Trim whitespace before
{{- .Name}}

// Trim whitespace after
{{.Name -}}

// Trim both sides
{{- .Name -}}

// Example:
// "  {{- .Name -}}  " → "John" (no spaces)
// "  {{ .Name }}  "   → "  John  " (spaces preserved)
```

---

## Error Handling

```go
// Parse errors
tmpl, err := template.New("test").Parse("{{.Invalid")
// err: template: test:1: unexpected "}" in operand

// Execute errors
err = tmpl.Execute(w, data)
// err: template: test:1:2: executing "test" at <.Missing>: 
//      can't evaluate field Missing in type main.Data

// Option: missing key handling
tmpl = tmpl.Option("missingkey=error")    // error on missing key
tmpl = tmpl.Option("missingkey=zero")     // use zero value
tmpl = tmpl.Option("missingkey=invalid")  // default (error for maps)
```

---

## Production Pattern: Template Renderer

```go
type TemplateRenderer struct {
    templates *template.Template
}

func NewRenderer(dir string) *TemplateRenderer {
    funcMap := template.FuncMap{
        "upper": strings.ToUpper,
        "formatDate": func(t time.Time) string { 
            return t.Format("2006-01-02") 
        },
    }
    
    tmpl := template.Must(
        template.New("").Funcs(funcMap).ParseGlob(dir + "/*.html"))
    
    return &TemplateRenderer{templates: tmpl}
}

func (tr *TemplateRenderer) Render(w http.ResponseWriter, name string, data any) {
    w.Header().Set("Content-Type", "text/html; charset=utf-8")
    
    if err := tr.templates.ExecuteTemplate(w, name, data); err != nil {
        http.Error(w, "Template error", http.StatusInternalServerError)
        log.Printf("template error: %v", err)
    }
}
```
