# 01 — Mathematical Functions
> math, math/big, math/bits, math/cmplx, math/rand

---

## math Package — Standard Functions

### Constants
```go
import "math"

math.Pi          // 3.141592653589793
math.E           // 2.718281828459045
math.Phi         // 1.618033988749895 (golden ratio)
math.Sqrt2       // 1.4142135623730951
math.SqrtE       // 1.6487212707001282
math.SqrtPi      // 1.7724538509055159
math.Ln2         // 0.6931471805599453
math.Ln10        // 2.302585092994046
math.Log2E       // 1.4426950408889634
math.Log10E      // 0.4342944819032518
math.MaxFloat64  // 1.7976931348623157e+308
math.SmallestNonzeroFloat64  // 5e-324
math.MaxInt      // platform max int
math.MinInt      // platform min int
math.MaxInt64    // 9223372036854775807
```

### Basic Functions
```go
// Absolute value
math.Abs(-5.0)         // 5.0

// Power & Roots
math.Pow(2, 10)        // 1024
math.Sqrt(144)         // 12
math.Cbrt(27)          // 3
math.Pow10(3)          // 1000

// Rounding
math.Floor(3.7)        // 3
math.Ceil(3.2)         // 4
math.Round(3.5)        // 4
math.RoundToEven(3.5)  // 4 (banker's rounding)
math.Trunc(3.9)        // 3 (truncate)

// Min/Max
math.Min(a, b)
math.Max(a, b)

// Modulo
math.Mod(10, 3)        // 1
math.Remainder(10, 3)  // 1 (IEEE remainder)

// Sign
math.Copysign(5, -1)   // -5
math.Signbit(-3.0)     // true

// Float manipulation
math.Inf(1)            // +Inf
math.Inf(-1)           // -Inf
math.NaN()             // NaN
math.IsInf(x, 0)       // check for ±Inf
math.IsNaN(x)          // check for NaN
```

### Trigonometric Functions
```go
// Basic trig (radians)
math.Sin(math.Pi / 2)    // 1
math.Cos(0)              // 1
math.Tan(math.Pi / 4)    // 1

// Inverse trig
math.Asin(1)             // Pi/2
math.Acos(0)             // Pi/2
math.Atan(1)             // Pi/4
math.Atan2(y, x)         // atan(y/x) with correct quadrant

// Hyperbolic
math.Sinh(x)
math.Cosh(x)
math.Tanh(x)

// Degree ↔ Radian (no built-in, DIY)
func degToRad(d float64) float64 { return d * math.Pi / 180 }
func radToDeg(r float64) float64 { return r * 180 / math.Pi }
```

### Logarithmic & Exponential
```go
math.Log(math.E)         // 1 (natural log)
math.Log2(8)             // 3
math.Log10(1000)         // 3
math.Log1p(x)            // log(1+x) (accurate for small x)

math.Exp(1)              // e^1 = 2.718...
math.Exp2(10)            // 2^10 = 1024
math.Expm1(x)            // e^x - 1 (accurate for small x)

math.Ldexp(0.5, 3)       // 0.5 * 2^3 = 4
f, exp := math.Frexp(4)  // f=0.5, exp=3
```

### Special Functions
```go
math.Gamma(5)            // 24 (= 4!)
math.Lgamma(5)           // log(Gamma(5))
math.Erf(x)              // error function
math.Erfc(x)             // complementary error function
math.J0(x), math.J1(x)   // Bessel functions
math.Y0(x), math.Y1(x)   // Bessel Y functions
```

---

## math/big — Arbitrary Precision

### big.Int
```go
import "math/big"

// Create
a := big.NewInt(42)
b := new(big.Int).SetString("999999999999999999999999999999", 10)
c := new(big.Int).SetBytes([]byte{0xFF, 0xFF})

// Arithmetic
sum := new(big.Int).Add(a, b)
diff := new(big.Int).Sub(b, a)
prod := new(big.Int).Mul(a, b)
quo, rem := new(big.Int).DivMod(b, a, new(big.Int))

// Power
result := new(big.Int).Exp(big.NewInt(2), big.NewInt(100), nil)
// 2^100 = 1267650600228229401496703205376

// Modular exponentiation (crypto mein use hota hai)
result = new(big.Int).Exp(base, exp, mod)  // base^exp mod m

// GCD
gcd := new(big.Int).GCD(nil, nil, a, b)

// Primality test
prob := big.NewInt(17).ProbablyPrime(20)  // 20 rounds Miller-Rabin

// Comparison
a.Cmp(b)  // -1, 0, 1

// Bit operations
a.And(a, b)
a.Or(a, b)
a.Xor(a, b)
a.Not(a)
a.Lsh(a, 10)   // left shift
a.Rsh(a, 10)   // right shift
a.BitLen()      // number of bits

// String conversion
s := a.String()           // decimal
s = a.Text(16)            // hex
s = fmt.Sprintf("%x", a)  // hex via fmt
```

### big.Rat — Rational Numbers
```go
// Exact fractions — no floating point errors!
a := new(big.Rat).SetFrac64(1, 3)   // 1/3
b := new(big.Rat).SetFrac64(2, 7)   // 2/7

sum := new(big.Rat).Add(a, b)       // 13/21
fmt.Println(sum.RatString())        // "13/21"

// From string
r, _ := new(big.Rat).SetString("355/113")

// To float
f, _ := r.Float64()
```

### big.Float — Arbitrary Precision Float
```go
// Set precision
a := new(big.Float).SetPrec(256).SetFloat64(1.0)
b := new(big.Float).SetPrec(256).SetFloat64(3.0)
result := new(big.Float).Quo(a, b)
fmt.Println(result.Text('f', 50))
// 0.33333333333333333333333333333333333333333333333333

// Pi to 100 digits (using Chudnovsky or similar)
pi := new(big.Float).SetPrec(512)
// ... computation ...

// Sqrt
sqrt2 := new(big.Float).SetPrec(256).Sqrt(
    new(big.Float).SetFloat64(2))

// Comparison
a.Cmp(b)  // -1, 0, 1
a.Acc()   // accuracy: Below, Exact, Above
```

---

## math/bits — Bit Manipulation

```go
import "math/bits"

// Counting
bits.OnesCount(0b10110101)     // 5 (popcount)
bits.OnesCount64(n)            // 64-bit version
bits.LeadingZeros64(n)         // leading zeros
bits.TrailingZeros64(n)        // trailing zeros
bits.Len64(n)                  // bit length (= floor(log2(n)) + 1)

// Rotation
bits.RotateLeft64(0xFF, 4)     // rotate left by 4
bits.RotateLeft64(0xFF, -4)    // rotate right by 4 (negative = right)

// Reverse
bits.Reverse64(n)              // reverse all bits
bits.ReverseBytes64(n)         // reverse bytes (endian swap)

// Arithmetic with overflow detection
sum, carry := bits.Add64(a, b, 0)       // a + b
diff, borrow := bits.Sub64(a, b, 0)     // a - b
hi, lo := bits.Mul64(a, b)               // a * b (128-bit result)
quo, rem := bits.Div64(hi, lo, d)        // 128÷64 division

// Power of 2
func isPowerOf2(n uint64) bool {
    return n > 0 && bits.OnesCount64(n) == 1
}

// Next power of 2
func nextPowerOf2(n uint64) uint64 {
    return 1 << bits.Len64(n-1)
}
```

---

## math/cmplx — Complex Numbers

```go
import "math/cmplx"

// Create complex numbers
z1 := complex(3, 4)     // 3 + 4i
z2 := 2 + 3i            // literal syntax

// Parts
real(z1)                 // 3
imag(z1)                 // 4

// Operations
cmplx.Abs(z1)            // |z| = 5 (magnitude)
cmplx.Phase(z1)          // angle in radians
cmplx.Conj(z1)           // conjugate (3 - 4i)

// Polar ↔ Rectangular
r, θ := cmplx.Polar(z1)
z := cmplx.Rect(r, θ)

// Math functions
cmplx.Sqrt(z1)
cmplx.Exp(z1)
cmplx.Log(z1)
cmplx.Pow(z1, z2)
cmplx.Sin(z1)
cmplx.Cos(z1)

// Special checks
cmplx.IsNaN(z1)
cmplx.IsInf(z1)
```

---

## math/rand — Pseudo-Random Numbers

### math/rand/v2 (Go 1.22+ — recommended)
```go
import "math/rand/v2"

// Global functions (auto-seeded!)
rand.IntN(100)          // [0, 100)
rand.Int64()            // random int64
rand.Float64()          // [0.0, 1.0)
rand.Float32()          // [0.0, 1.0)
rand.Uint64()           // random uint64
rand.Uint32()           // random uint32
rand.N(10*time.Second)  // random duration [0, 10s)

// With explicit source
rng := rand.New(rand.NewPCG(seed1, seed2))
rng.IntN(100)

// Sources
rand.NewPCG(seed1, seed2)    // PCG — fast, small state
rand.NewChaCha8([32]byte{})  // ChaCha8 — crypto-quality PRNG

// Shuffle
items := []int{1, 2, 3, 4, 5}
rand.Shuffle(len(items), func(i, j int) {
    items[i], items[j] = items[j], items[i]
})

// Perm
perm := rand.Perm(10)  // [0,10) shuffled
```

### math/rand (legacy — v1)
```go
import "math/rand"

// Auto-seeded since Go 1.20
rand.Intn(100)          // [0, 100)
rand.Int63()
rand.Float64()

// Explicit seed (for reproducibility)
src := rand.NewSource(42)
rng := rand.New(src)
rng.Intn(100)
```

### Comparison

| Feature | math/rand (v1) | math/rand/v2 | crypto/rand |
|---------|---------------|-------------|-------------|
| Speed | Fast | Fast | Slower |
| Security | ❌ | ❌ (PCG) / ✅ (ChaCha8) | ✅ |
| Auto-seed | Go 1.20+ | Always | N/A |
| Generic N | `Intn(n)` | `N[T](n)` | N/A |
| Use case | Games, sims | General purpose | Security, tokens |

> **Rule:** crypto/rand use karo jab security matter kare (tokens, keys, passwords).
> math/rand use karo games, simulations, testing ke liye.
