# 01 — Go Cryptography
> Symmetric, Asymmetric, Hash, KDF, HPKE, FIPS 140, aur crypto internals

---

## crypto Package Overview

```
crypto/
├── aes          ← AES block cipher
├── cipher       ← Block cipher modes (GCM, CBC, CTR, etc.)
├── des          ← DES/Triple-DES (legacy)
├── rc4          ← RC4 stream cipher (legacy, BROKEN)
├── ecdh         ← Elliptic Curve Diffie-Hellman key exchange
├── ecdsa        ← ECDSA digital signatures
├── ed25519      ← Ed25519 signatures
├── rsa          ← RSA encryption & signatures
├── dsa          ← DSA signatures (legacy)
├── elliptic     ← Low-level elliptic curve ops
├── sha256       ← SHA-256 hash
├── sha512       ← SHA-512 hash
├── sha3         ← SHA-3 (Keccak)
├── md5          ← MD5 hash (BROKEN for security)
├── hmac         ← HMAC message authentication
├── hkdf         ← HKDF key derivation
├── pbkdf2       ← PBKDF2 key derivation
├── argon2       ← Argon2 password hashing
├── bcrypt       ← bcrypt password hashing (in x/crypto)
├── tls          ← TLS 1.2/1.3
├── x509         ← Certificate parsing/validation
├── rand         ← Cryptographic random numbers
├── subtle       ← Constant-time operations
├── hpke         ← Hybrid Public Key Encryption
├── fips140      ← FIPS 140-3 compliance
└── internal/    ← Internal implementations
```

---

## Symmetric Key Cryptography

### AES-GCM (Recommended!)
```go
import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "io"
)

func encrypt(key, plaintext []byte) ([]byte, error) {
    block, err := aes.NewCipher(key) // key must be 16/24/32 bytes
    if err != nil {
        return nil, err
    }
    
    aesGCM, err := cipher.NewGCM(block)
    if err != nil {
        return nil, err
    }
    
    // Nonce = unique per encryption (NEVER reuse with same key!)
    nonce := make([]byte, aesGCM.NonceSize()) // 12 bytes
    if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
        return nil, err
    }
    
    // Encrypt + authenticate
    // Nonce prepend kar rahe hain ciphertext ke saath
    ciphertext := aesGCM.Seal(nonce, nonce, plaintext, nil)
    return ciphertext, nil
}

func decrypt(key, ciphertext []byte) ([]byte, error) {
    block, err := aes.NewCipher(key)
    if err != nil {
        return nil, err
    }
    
    aesGCM, err := cipher.NewGCM(block)
    if err != nil {
        return nil, err
    }
    
    nonceSize := aesGCM.NonceSize()
    nonce, ct := ciphertext[:nonceSize], ciphertext[nonceSize:]
    
    plaintext, err := aesGCM.Open(nil, nonce, ct, nil)
    return plaintext, err
}
```

### Block Cipher Modes

| Mode | Type | Auth? | Recommended? |
|------|------|-------|-------------|
| GCM | AEAD | YES | ✅ Best choice |
| CTR | Stream | NO | ⚠️ Needs HMAC |
| CBC | Block | NO | ⚠️ Padding oracle risk |
| CFB | Stream | NO | ⚠️ Legacy |
| OFB | Stream | NO | ⚠️ Legacy |

### Key Generation
```go
// Always use crypto/rand for key generation!
key := make([]byte, 32)  // AES-256
if _, err := rand.Read(key); err != nil {
    panic(err)
}
```

---

## Asymmetric Key Cryptography

### RSA
```go
import "crypto/rsa"

// Key generation
privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
publicKey := &privateKey.PublicKey

// Encryption (OAEP recommended)
ciphertext, err := rsa.EncryptOAEP(
    sha256.New(), rand.Reader, publicKey, plaintext, nil,
)

// Decryption
plaintext, err := rsa.DecryptOAEP(
    sha256.New(), rand.Reader, privateKey, ciphertext, nil,
)

// Signing (PSS recommended)
hash := sha256.Sum256(message)
signature, err := rsa.SignPSS(
    rand.Reader, privateKey, crypto.SHA256, hash[:], nil,
)

// Verification
err = rsa.VerifyPSS(publicKey, crypto.SHA256, hash[:], signature, nil)
```

### ECDSA (Elliptic Curve DSA)
```go
import (
    "crypto/ecdsa"
    "crypto/elliptic"
)

// Key generation
privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
publicKey := &privateKey.PublicKey

// Signing
hash := sha256.Sum256(message)
signature, err := ecdsa.SignASN1(rand.Reader, privateKey, hash[:])

// Verification
valid := ecdsa.VerifyASN1(publicKey, hash[:], signature)
```

### Ed25519 (Edwards Curve — fastest signatures!)
```go
import "crypto/ed25519"

// Key generation
publicKey, privateKey, err := ed25519.GenerateKey(rand.Reader)

// Signing (no hashing needed — built in!)
signature := ed25519.Sign(privateKey, message)

// Verification
valid := ed25519.Verify(publicKey, message, signature)
```

### ECDH (Key Exchange)
```go
import "crypto/ecdh"

// Both parties:
curve := ecdh.P256()

// Alice
alicePriv, _ := curve.GenerateKey(rand.Reader)
alicePub := alicePriv.PublicKey()

// Bob
bobPriv, _ := curve.GenerateKey(rand.Reader)
bobPub := bobPriv.PublicKey()

// Shared secret (same on both sides!)
aliceSecret, _ := alicePriv.ECDH(bobPub)
bobSecret, _ := bobPriv.ECDH(alicePub)
// aliceSecret == bobSecret ✓
```

### Algorithm Comparison

| Algorithm | Speed | Key Size | Signature Size | Use Case |
|-----------|-------|----------|---------------|----------|
| RSA-2048 | Slow | 2048 bit | 256 bytes | Legacy, TLS |
| ECDSA P-256 | Fast | 256 bit | ~72 bytes | TLS, JWT |
| Ed25519 | Fastest | 256 bit | 64 bytes | SSH, modern apps |

---

## Hash Functions

```go
import (
    "crypto/sha256"
    "crypto/sha512"
    "crypto/sha3"
    "crypto/md5"
)

// SHA-256 (most common)
hash := sha256.Sum256(data)
fmt.Printf("%x\n", hash)

// SHA-256 streaming (large files)
h := sha256.New()
h.Write(chunk1)
h.Write(chunk2)
sum := h.Sum(nil)

// SHA-512
hash512 := sha512.Sum512(data)

// SHA-3 (Keccak)
hash3 := sha3.Sum256(data)

// MD5 (BROKEN! Only for checksums, NEVER for security)
hashMD5 := md5.Sum(data)
```

### HMAC (Message Authentication)
```go
import "crypto/hmac"

// Create HMAC
mac := hmac.New(sha256.New, secretKey)
mac.Write(message)
tag := mac.Sum(nil)

// Verify HMAC (constant-time comparison!)
mac2 := hmac.New(sha256.New, secretKey)
mac2.Write(message)
expectedTag := mac2.Sum(nil)
valid := hmac.Equal(tag, expectedTag)  // timing-safe!
```

---

## Key Derivation Functions (KDF)

### HKDF — Derive keys from shared secret
```go
import "crypto/hkdf"

// Extract + Expand
reader := hkdf.New(sha256.New, sharedSecret, salt, info)
derivedKey := make([]byte, 32)
io.ReadFull(reader, derivedKey)
```

### PBKDF2 — Password-based key derivation
```go
import "crypto/pbkdf2"

// Derive key from password
key := pbkdf2.Key(
    []byte("password"),
    salt,        // random salt
    100000,      // iterations (higher = slower = safer)
    32,          // key length
    sha256.New,
)
```

### Argon2 — Modern password hashing (in x/crypto)
```go
import "golang.org/x/crypto/argon2"

// Argon2id (recommended)
hash := argon2.IDKey(
    []byte("password"),
    salt,
    1,         // time cost
    64*1024,   // memory cost (64 MB)
    4,         // parallelism
    32,        // key length
)
```

---

## HPKE — Hybrid Public Key Encryption (Go 1.24+)

```go
import "crypto/hpke"

// Receiver generates keypair
suite := hpke.Suite{
    KEM:  hpke.KEM_P256_HKDF_SHA256,
    KDF:  hpke.KDF_HKDF_SHA256,
    AEAD: hpke.AEAD_AES_128_GCM,
}

// Sender encrypts
enc, sealer, err := suite.NewSender(recipientPubKey, info)
ciphertext, err := sealer.Seal(plaintext, aad)

// Receiver decrypts
opener, err := suite.NewReceiver(recipientPrivKey, enc, info)
plaintext, err := opener.Open(ciphertext, aad)
```

---

## FIPS 140-3 Compliance

```go
import "crypto/fips140"

// Check if FIPS mode is enabled
if fips140.Enabled() {
    // Only FIPS-approved algorithms used
}

// Bypass FIPS enforcement temporarily
fips140.Do(func() {
    // FIPS enforcement suspended in this block
    // Use for legacy code integration
})
```

### FIPS Approved vs Not Approved

| Approved ✅ | Not Approved ❌ |
|------------|----------------|
| AES-GCM, AES-CBC | RC4, DES |
| SHA-256, SHA-512 | MD5 |
| RSA (≥2048) | RSA (1024) |
| ECDSA P-256/P-384 | Custom curves |
| HMAC-SHA256 | - |
| HKDF, PBKDF2 | - |
| Ed25519 (with caveats) | - |

---

## crypto/rand — Secure Random Numbers

```go
import "crypto/rand"

// Random bytes
b := make([]byte, 32)
rand.Read(b)

// Random integer
n, err := rand.Int(rand.Reader, big.NewInt(100))
// n is in [0, 100)

// Random prime
prime, err := rand.Prime(rand.Reader, 256)
```

> **NEVER use `math/rand` for security!** Always use `crypto/rand`.

---

## crypto/subtle — Constant-Time Operations

```go
import "crypto/subtle"

// Constant-time comparison (prevents timing attacks)
result := subtle.ConstantTimeCompare(a, b) // 1 if equal, 0 if not

// Constant-time select
val := subtle.ConstantTimeSelect(condition, a, b) // if condition==1: a, else: b

// Byte-level equality
result := subtle.ConstantTimeByteEq(x, y) // 1 if equal, 0 if not

// Constant-time copy
subtle.ConstantTimeCopy(condition, dst, src) // copy only if condition==1
```

---

## TLS — crypto/tls

```go
import "crypto/tls"

// TLS server
cert, _ := tls.LoadX509KeyPair("cert.pem", "key.pem")
config := &tls.Config{
    Certificates: []tls.Certificate{cert},
    MinVersion:   tls.VersionTLS12,
}
listener, _ := tls.Listen("tcp", ":443", config)

// TLS client
config := &tls.Config{
    MinVersion: tls.VersionTLS12,
}
conn, _ := tls.Dial("tcp", "example.com:443", config)
```

---

## X.509 Certificates

```go
import "crypto/x509"

// Parse PEM certificate
block, _ := pem.Decode(pemData)
cert, err := x509.ParseCertificate(block.Bytes)

// Verify certificate chain
roots := x509.NewCertPool()
roots.AppendCertsFromPEM(rootCAPEM)
opts := x509.VerifyOptions{Roots: roots}
chains, err := cert.Verify(opts)

// Create self-signed certificate (testing only!)
template := &x509.Certificate{
    SerialNumber: big.NewInt(1),
    Subject:      pkix.Name{Organization: []string{"Test"}},
    NotBefore:    time.Now(),
    NotAfter:     time.Now().Add(365 * 24 * time.Hour),
    KeyUsage:     x509.KeyUsageDigitalSignature,
}
certDER, err := x509.CreateCertificate(
    rand.Reader, template, template, &privKey.PublicKey, privKey,
)
```

---

## Best Practices Summary

```
1. Encryption    → AES-256-GCM (symmetric), HPKE/ECDH+AES (asymmetric)
2. Signing       → Ed25519 (modern) or ECDSA P-256 (compatibility)
3. Hashing       → SHA-256 or SHA-3
4. HMAC          → HMAC-SHA-256
5. Passwords     → Argon2id (best) or bcrypt (compatibility)
6. Key Derivation→ HKDF
7. Random        → crypto/rand ONLY
8. TLS           → MinVersion: TLS 1.2, prefer TLS 1.3
9. Key sizes     → RSA ≥ 2048, ECC ≥ P-256
10. Comparison   → subtle.ConstantTimeCompare for secrets
```
