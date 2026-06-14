# 01 — Data Encoding & Decoding
> JSON, Gob, XML, CSV, PEM, Base64, Binary — sab formats ka complete guide

---

## encoding/json — JSON Handling

### Marshal (Go → JSON)
```go
import "encoding/json"

type User struct {
    Name    string    `json:"name"`
    Email   string    `json:"email"`
    Age     int       `json:"age,omitempty"`     // skip if zero
    Secret  string    `json:"-"`                 // always skip
    Score   float64   `json:"score,string"`      // encode as string
    Tags    []string  `json:"tags,omitempty"`
}

user := User{Name: "Ashutosh", Email: "ash@go.dev", Age: 25}

// Marshal (compact)
data, err := json.Marshal(user)
// {"name":"Ashutosh","email":"ash@go.dev","age":25}

// MarshalIndent (pretty)
data, err := json.MarshalIndent(user, "", "  ")
// {
//   "name": "Ashutosh",
//   "email": "ash@go.dev",
//   "age": 25
// }
```

### Unmarshal (JSON → Go)
```go
var user User
err := json.Unmarshal(jsonBytes, &user)

// Unknown structure → map[string]any
var result map[string]any
json.Unmarshal(jsonBytes, &result)
name := result["name"].(string)
```

### Streaming — Encoder/Decoder
```go
// Large files ya network streams ke liye
// Encoder (write JSON to io.Writer)
encoder := json.NewEncoder(os.Stdout)
encoder.SetIndent("", "  ")
encoder.Encode(user)  // writes JSON + newline

// Decoder (read JSON from io.Reader)
decoder := json.NewDecoder(file)
var user User
for decoder.More() {
    err := decoder.Decode(&user)
    // process user...
}
```

### Custom Marshal/Unmarshal
```go
type Timestamp time.Time

func (t Timestamp) MarshalJSON() ([]byte, error) {
    stamp := time.Time(t).Format("2006-01-02")
    return json.Marshal(stamp)
}

func (t *Timestamp) UnmarshalJSON(data []byte) error {
    var s string
    if err := json.Unmarshal(data, &s); err != nil {
        return err
    }
    parsed, err := time.Parse("2006-01-02", s)
    *t = Timestamp(parsed)
    return err
}
```

### JSON Struct Tags Reference

| Tag | Effect | Example |
|-----|--------|---------|
| `json:"name"` | Field name | `Name string \`json:"name"\`` |
| `json:"name,omitempty"` | Skip if zero value | `Age int \`json:"age,omitempty"\`` |
| `json:"-"` | Always skip | `Secret string \`json:"-"\`` |
| `json:",string"` | Encode number as string | `ID int \`json:"id,string"\`` |
| `json:",inline"` | Flatten embedded struct | (Go 1.24+ experimental) |

### json/v2 (Experimental — encoding/json/v2)
```go
// New features in v2:
// - Better performance
// - json.Options for fine control
// - AllowDuplicateNames option
// - EscapeForHTML option  
// - Format options per field
// - Better error messages
```

---

## encoding/gob — Go Binary Serialization

```go
import "encoding/gob"

// Gob is Go-to-Go communication format
// Self-describing, type-safe, efficient

// Encode
var buf bytes.Buffer
encoder := gob.NewEncoder(&buf)
encoder.Encode(user)

// Decode
decoder := gob.NewDecoder(&buf)
var decoded User
decoder.Decode(&decoded)

// Register interface types (REQUIRED for interface values)
gob.Register(MyConcreteType{})
gob.Register(AnotherType{})
```

### Gob vs JSON

| Feature | Gob | JSON |
|---------|-----|------|
| Format | Binary | Text |
| Speed | Fast | Slower |
| Size | Compact | Larger |
| Cross-language | Go only ❌ | Universal ✅ |
| Self-describing | Yes | Yes |
| Schema evolution | Flexible | Flexible |
| Human readable | No | Yes |

---

## encoding/xml

```go
import "encoding/xml"

type Person struct {
    XMLName xml.Name `xml:"person"`
    Name    string   `xml:"name"`
    Age     int      `xml:"age,attr"`      // attribute
    Address string   `xml:"address>street"` // nested element
    Comment string   `xml:",comment"`       // XML comment
    Data    string   `xml:",cdata"`         // CDATA section
}

// Marshal
data, _ := xml.MarshalIndent(person, "", "  ")
// <person age="25">
//   <name>Ashutosh</name>
//   <street>Main St</street>
// </person>

// Unmarshal
var p Person
xml.Unmarshal(xmlData, &p)

// Streaming
decoder := xml.NewDecoder(reader)
for {
    token, err := decoder.Token()
    switch t := token.(type) {
    case xml.StartElement:
        // ...
    case xml.CharData:
        // ...
    }
}
```

---

## encoding/csv

```go
import "encoding/csv"

// Read CSV
reader := csv.NewReader(file)
reader.Comma = ','          // default
reader.Comment = '#'        // comment lines
reader.LazyQuotes = true    // lenient parsing
reader.TrimLeadingSpace = true

// Read all at once
records, _ := reader.ReadAll()

// Read one by one
for {
    record, err := reader.Read()
    if err == io.EOF { break }
    fmt.Println(record[0], record[1])
}

// Write CSV
writer := csv.NewWriter(file)
writer.Write([]string{"name", "age", "email"})
writer.Write([]string{"Ashutosh", "25", "ash@go.dev"})
writer.Flush()
```

---

## encoding/pem — PEM Format

```go
import "encoding/pem"

// PEM = Privacy Enhanced Mail format
// Used for certificates, keys, etc.

// Encode
block := &pem.Block{
    Type:  "RSA PRIVATE KEY",
    Bytes: derBytes,
}
pem.Encode(file, block)
// -----BEGIN RSA PRIVATE KEY-----
// MIIEpAIBAAKCAQ...
// -----END RSA PRIVATE KEY-----

// Decode
block, rest := pem.Decode(pemData)
if block == nil {
    log.Fatal("no PEM data found")
}
fmt.Println(block.Type)   // "RSA PRIVATE KEY"
fmt.Println(block.Bytes)  // DER-encoded data
// rest = remaining data (for multiple PEM blocks)
```

---

## encoding/base64

```go
import "encoding/base64"

// Standard encoding
encoded := base64.StdEncoding.EncodeToString(data)
decoded, _ := base64.StdEncoding.DecodeString(encoded)

// URL-safe encoding (- and _ instead of + and /)
encoded := base64.URLEncoding.EncodeToString(data)

// Raw (no padding =)
encoded := base64.RawStdEncoding.EncodeToString(data)
encoded := base64.RawURLEncoding.EncodeToString(data)

// Streaming
encoder := base64.NewEncoder(base64.StdEncoding, writer)
encoder.Write(data)
encoder.Close()  // MUST close to flush!
```

---

## encoding/hex

```go
import "encoding/hex"

// Encode
hexStr := hex.EncodeToString(data)  // "48656c6c6f"

// Decode
data, _ := hex.DecodeString("48656c6c6f")

// Dump (like hexdump utility)
fmt.Println(hex.Dump(data))
// 00000000  48 65 6c 6c 6f  |Hello|
```

---

## encoding/binary — Binary Protocols

```go
import "encoding/binary"

// Write binary data
buf := new(bytes.Buffer)
binary.Write(buf, binary.BigEndian, uint32(42))
binary.Write(buf, binary.BigEndian, float64(3.14))

// Read binary data
var num uint32
binary.Read(buf, binary.BigEndian, &num)

// Direct byte manipulation
b := make([]byte, 4)
binary.BigEndian.PutUint32(b, 42)
val := binary.BigEndian.Uint32(b)

// Varint encoding (variable length integers)
buf := make([]byte, binary.MaxVarintLen64)
n := binary.PutVarint(buf, -42)
val, bytesRead := binary.Varint(buf)

// Uvarint
n = binary.PutUvarint(buf, 300)
val2, bytesRead := binary.Uvarint(buf)
```

### Byte Order

| Order | Name | Use Case |
|-------|------|----------|
| Big Endian | Network byte order | Network protocols |
| Little Endian | Most CPUs | File formats, memory |
| Native Endian | Host byte order | Performance-critical |

---

## encoding/asn1 — ASN.1 (Certificates)

```go
import "encoding/asn1"

// Used internally by crypto/x509
// Marshal
data, _ := asn1.Marshal(myStruct)

// Unmarshal
var result MyStruct
rest, err := asn1.Unmarshal(data, &result)
```

---

## encoding Interface

```go
// Standard interfaces — implement these for custom encoding

type BinaryMarshaler interface {
    MarshalBinary() ([]byte, error)
}

type BinaryUnmarshaler interface {
    UnmarshalBinary(data []byte) error
}

type TextMarshaler interface {
    MarshalText() ([]byte, error)
}

type TextUnmarshaler interface {
    UnmarshalText(text []byte) error
}

// Example: custom type
type IP [4]byte

func (ip IP) MarshalText() ([]byte, error) {
    return []byte(fmt.Sprintf("%d.%d.%d.%d", ip[0], ip[1], ip[2], ip[3])), nil
}

func (ip *IP) UnmarshalText(text []byte) error {
    fmt.Sscanf(string(text), "%d.%d.%d.%d", &ip[0], &ip[1], &ip[2], &ip[3])
    return nil
}
```

---

## Format Selection Guide

```
┌─────────────────────────────────────────────────────────┐
│                 Which Format to Use?                     │
├───────────────────┬─────────────────────────────────────┤
│ API communication │ JSON                                │
│ Config files      │ JSON / YAML (third-party)           │
│ Go-to-Go RPC      │ Gob (or protobuf for cross-lang)   │
│ Binary protocols  │ encoding/binary                     │
│ Certificates      │ PEM + ASN.1                         │
│ Data interchange  │ CSV (tabular) / JSON (structured)   │
│ SOAP/Enterprise   │ XML                                 │
│ Compact + fast    │ Protobuf / MsgPack (third-party)    │
│ Human readable    │ JSON / YAML                         │
└───────────────────┴─────────────────────────────────────┘
```
