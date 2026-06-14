# 01 — Image Processing
> image package, color models, draw, JPEG/PNG/GIF encoding & decoding

---

## Image Core Types

```go
import "image"

// Image interface — fundamental
type Image interface {
    ColorModel() color.Model
    Bounds() Rectangle      // image dimensions
    At(x, y int) color.Color // pixel at (x, y)
}

// Common image types
img := image.NewRGBA(image.Rect(0, 0, 800, 600))
img := image.NewNRGBA(image.Rect(0, 0, 800, 600))  // non-premultiplied
img := image.NewGray(image.Rect(0, 0, 800, 600))
img := image.NewGray16(image.Rect(0, 0, 800, 600))
img := image.NewCMYK(image.Rect(0, 0, 800, 600))
img := image.NewPaletted(image.Rect(0, 0, 800, 600), palette)
```

### Geometry — Point & Rectangle
```go
// Point
p := image.Point{X: 10, Y: 20}
p = image.Pt(10, 20)  // shorthand
p2 := p.Add(image.Pt(5, 5))  // {15, 25}
p3 := p.Sub(image.Pt(3, 3))  // {7, 17}

// Rectangle
r := image.Rectangle{Min: image.Pt(0, 0), Max: image.Pt(100, 100)}
r = image.Rect(0, 0, 100, 100)  // shorthand

// Rectangle operations
r.Dx()                        // width = 100
r.Dy()                        // height = 100
r.Size()                      // Point{100, 100}
r.In(otherRect)               // fully inside?
r.Overlaps(otherRect)         // any overlap?
r.Intersect(otherRect)        // intersection rectangle
r.Union(otherRect)            // bounding rectangle
r.Add(image.Pt(10, 10))       // translate
r.Inset(5)                    // shrink by 5 on each side
pt.In(r)                      // point inside rectangle?
```

---

## image/color — Color Models

```go
import "image/color"

// RGBA color (8-bit per channel)
c := color.RGBA{R: 255, G: 128, B: 0, A: 255}

// Pre-defined colors
color.Black    // {0, 0, 0, 0xFFFF}
color.White    // {0xFFFF, 0xFFFF, 0xFFFF, 0xFFFF}
color.Transparent
color.Opaque

// Color models — convert between them
grayColor := color.GrayModel.Convert(c).(color.Gray)
cmykColor := color.CMYKModel.Convert(c).(color.CMYK)

// Custom color model
type MyColor struct { Value float64 }
func (c MyColor) RGBA() (r, g, b, a uint32) {
    v := uint32(c.Value * 0xFFFF)
    return v, v, v, 0xFFFF
}
```

### Color Types

| Type | Channels | Bits/Channel | Use |
|------|----------|-------------|-----|
| `RGBA` | R,G,B,A | 8 | Standard color |
| `RGBA64` | R,G,B,A | 16 | High precision |
| `NRGBA` | R,G,B,A | 8 | Non-premultiplied |
| `Gray` | Y | 8 | Grayscale |
| `Gray16` | Y | 16 | High-precision gray |
| `CMYK` | C,M,Y,K | 8 | Print colors |
| `Alpha` | A | 8 | Transparency only |
| `YCbCr` | Y,Cb,Cr | 8 | JPEG encoding |

---

## Pixel Manipulation

```go
// Create blank image
img := image.NewRGBA(image.Rect(0, 0, 200, 200))

// Set pixels
for x := 0; x < 200; x++ {
    for y := 0; y < 200; y++ {
        img.Set(x, y, color.RGBA{
            R: uint8(x),
            G: uint8(y),
            B: 128,
            A: 255,
        })
    }
}

// Get pixel
c := img.At(50, 50)
r, g, b, a := c.RGBA()  // returns 16-bit values!
// Divide by 256 for 8-bit values
r8 := uint8(r >> 8)

// Direct pixel access (faster)
img.Pix[y*img.Stride + x*4 + 0] = 255  // R
img.Pix[y*img.Stride + x*4 + 1] = 128  // G
img.Pix[y*img.Stride + x*4 + 2] = 0    // B
img.Pix[y*img.Stride + x*4 + 3] = 255  // A
```

---

## image/draw — Compositing

```go
import "image/draw"

// Copy (source over destination)
draw.Draw(dst, dst.Bounds(), src, image.Point{}, draw.Src)

// Alpha compositing (Over)
draw.Draw(dst, dst.Bounds(), src, image.Point{}, draw.Over)

// Draw onto specific region
draw.Draw(dst, image.Rect(10, 10, 110, 110), src, image.Point{}, draw.Src)

// Fill with solid color
draw.Draw(img, img.Bounds(), &image.Uniform{color.RGBA{0, 0, 255, 255}}, image.Point{}, draw.Src)

// Draw mask (transparency)
draw.DrawMask(dst, dst.Bounds(), src, image.Point{}, mask, image.Point{}, draw.Over)
```

---

## Encoding & Decoding Images

### Decode (Auto-detect format)
```go
import (
    "image"
    _ "image/jpeg"  // register JPEG decoder
    _ "image/png"   // register PNG decoder
    _ "image/gif"   // register GIF decoder
)

f, _ := os.Open("photo.jpg")
defer f.Close()

img, format, err := image.Decode(f)
fmt.Println("Format:", format)  // "jpeg", "png", "gif"
fmt.Println("Bounds:", img.Bounds())

// Decode config only (no pixel data)
f.Seek(0, 0)
config, format, err := image.DecodeConfig(f)
fmt.Printf("Size: %dx%d\n", config.Width, config.Height)
```

### Encode PNG
```go
import "image/png"

f, _ := os.Create("output.png")
defer f.Close()

encoder := &png.Encoder{
    CompressionLevel: png.BestCompression,
}
encoder.Encode(f, img)

// Simple version
png.Encode(f, img)
```

### Encode JPEG
```go
import "image/jpeg"

f, _ := os.Create("output.jpg")
defer f.Close()

jpeg.Encode(f, img, &jpeg.Options{Quality: 85})
```

### Encode GIF (Animated)
```go
import "image/gif"

anim := &gif.GIF{}
for i := 0; i < 10; i++ {
    frame := image.NewPaletted(image.Rect(0, 0, 100, 100), palette.Plan9)
    // draw frame...
    anim.Image = append(anim.Image, frame)
    anim.Delay = append(anim.Delay, 10)  // 100ms per frame
}

f, _ := os.Create("animation.gif")
defer f.Close()
gif.EncodeAll(f, anim)
```

---

## Practical Example: Thumbnail Generator

```go
func createThumbnail(src image.Image, maxWidth, maxHeight int) *image.RGBA {
    bounds := src.Bounds()
    srcW, srcH := bounds.Dx(), bounds.Dy()
    
    // Calculate aspect ratio
    ratio := math.Min(
        float64(maxWidth)/float64(srcW),
        float64(maxHeight)/float64(srcH),
    )
    newW := int(float64(srcW) * ratio)
    newH := int(float64(srcH) * ratio)
    
    dst := image.NewRGBA(image.Rect(0, 0, newW, newH))
    
    // Simple nearest-neighbor resize
    for x := 0; x < newW; x++ {
        for y := 0; y < newH; y++ {
            srcX := x * srcW / newW
            srcY := y * srcH / newH
            dst.Set(x, y, src.At(srcX+bounds.Min.X, srcY+bounds.Min.Y))
        }
    }
    return dst
}
```

> **Note:** For production image resizing, use `golang.org/x/image/draw` which has
> better interpolation algorithms (Bilinear, CatmullRom, etc.)
