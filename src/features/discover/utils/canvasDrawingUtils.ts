import type { ShapeType, ArtStyleId } from '@/stores/drawingStore'

// ── Color Helpers ────────────────────────────────────────────────────────────
export function hexToRgba(hex: string): [number, number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b, 255]
}

export function colorsMatch(
  a: Uint8ClampedArray,
  offset: number,
  b: [number, number, number, number],
  tolerance = 32,
): boolean {
  return (
    Math.abs(a[offset] - b[0]) <= tolerance
    && Math.abs(a[offset + 1] - b[1]) <= tolerance
    && Math.abs(a[offset + 2] - b[2]) <= tolerance
    && Math.abs(a[offset + 3] - b[3]) <= tolerance
  )
}

// ── Flood Fill ───────────────────────────────────────────────────────────────
export function floodFill(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  startX: number,
  startY: number,
  fillColorHex: string,
  dpr: number,
) {
  const w = canvasWidth
  const h = canvasHeight
  const pixelX = Math.round(startX * dpr)
  const pixelY = Math.round(startY * dpr)

  if (pixelX < 0 || pixelX >= w || pixelY < 0 || pixelY >= h) return

  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data
  const fillColor = hexToRgba(fillColorHex)

  const startOffset = (pixelY * w + pixelX) * 4
  const targetColor: [number, number, number, number] = [
    data[startOffset], data[startOffset + 1], data[startOffset + 2], data[startOffset + 3],
  ]

  // Don't fill if clicking on the same color
  if (colorsMatch(data, startOffset, fillColor, 10)) return

  const stack: number[] = [pixelX, pixelY]
  const visited = new Uint8Array(w * h)

  while (stack.length > 0) {
    const cy = stack.pop()!
    const cx = stack.pop()!
    const idx = cy * w + cx

    if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue
    if (visited[idx]) continue
    visited[idx] = 1

    const offset = idx * 4
    if (!colorsMatch(data, offset, targetColor)) continue

    data[offset] = fillColor[0]
    data[offset + 1] = fillColor[1]
    data[offset + 2] = fillColor[2]
    data[offset + 3] = fillColor[3]

    stack.push(cx + 1, cy)
    stack.push(cx - 1, cy)
    stack.push(cx, cy + 1)
    stack.push(cx, cy - 1)
  }

  ctx.putImageData(imageData, 0, 0)
}

// ── Spray Tool ───────────────────────────────────────────────────────────────
export function drawSpray(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const density = Math.floor(size * 1.5)
  const radius = size
  for (let i = 0; i < density; i++) {
    const angle = Math.random() * Math.PI * 2
    const r = Math.random() * radius
    const dx = x + r * Math.cos(angle)
    const dy = y + r * Math.sin(angle)
    ctx.fillRect(dx, dy, 1, 1)
  }
}

// ── Chalk Tool ───────────────────────────────────────────────────────────────
export function drawChalkSegment(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  size: number,
) {
  const dist = Math.hypot(toX - fromX, toY - fromY)
  const steps = Math.max(1, Math.floor(dist / 2))
  for (let i = 0; i < steps; i++) {
    const t = i / steps
    const x = fromX + (toX - fromX) * t + (Math.random() - 0.5) * 3
    const y = fromY + (toY - fromY) * t + (Math.random() - 0.5) * 3
    ctx.globalAlpha = 0.3 + Math.random() * 0.4
    ctx.fillRect(x, y, size * 0.4, size * 0.4)
  }
  ctx.globalAlpha = 0.7
}

// ── Shape Drawing ────────────────────────────────────────────────────────────
export function drawStarPath(
  context: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  points: number,
  outerR: number,
  innerR: number,
) {
  context.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = (Math.PI / points) * i - Math.PI / 2
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    if (i === 0) context.moveTo(x, y)
    else context.lineTo(x, y)
  }
  context.closePath()
}

export function drawShapeOnCanvas(
  ctx: CanvasRenderingContext2D,
  shape: ShapeType,
  filled: boolean,
  color: string,
  lineWidth: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (shape === 'line') {
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  } else if (shape === 'rectangle') {
    const rx = Math.min(x1, x2)
    const ry = Math.min(y1, y2)
    const rw = Math.abs(x2 - x1)
    const rh = Math.abs(y2 - y1)
    if (filled) {
      ctx.fillRect(rx, ry, rw, rh)
    } else {
      ctx.strokeRect(rx, ry, rw, rh)
    }
  } else if (shape === 'circle') {
    const cx = (x1 + x2) / 2
    const cy = (y1 + y2) / 2
    const rx = Math.abs(x2 - x1) / 2
    const ry = Math.abs(y2 - y1) / 2
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    if (filled) {
      ctx.fill()
    } else {
      ctx.stroke()
    }
  } else if (shape === 'triangle') {
    const mx = (x1 + x2) / 2
    ctx.beginPath()
    ctx.moveTo(mx, y1)
    ctx.lineTo(x2, y2)
    ctx.lineTo(x1, y2)
    ctx.closePath()
    if (filled) {
      ctx.fill()
    } else {
      ctx.stroke()
    }
  } else if (shape === 'star') {
    const cx = (x1 + x2) / 2
    const cy = (y1 + y2) / 2
    const outerR = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / 2
    const innerR = outerR * 0.4
    drawStarPath(ctx, cx, cy, 5, outerR, innerR)
    if (filled) {
      ctx.fill()
    } else {
      ctx.stroke()
    }
  }

  ctx.restore()
}

// ── Art Style Filters (pixel manipulation — reliable across all browsers) ────

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function applyGrayscale(data: Uint8ClampedArray, amount: number) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b
    data[i] = clamp(r + (gray - r) * amount)
    data[i + 1] = clamp(g + (gray - g) * amount)
    data[i + 2] = clamp(b + (gray - b) * amount)
  }
}

function applySepia(data: Uint8ClampedArray, amount: number) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const sr = 0.393 * r + 0.769 * g + 0.189 * b
    const sg = 0.349 * r + 0.686 * g + 0.168 * b
    const sb = 0.272 * r + 0.534 * g + 0.131 * b
    data[i] = clamp(r + (sr - r) * amount)
    data[i + 1] = clamp(g + (sg - g) * amount)
    data[i + 2] = clamp(b + (sb - b) * amount)
  }
}

function applyBrightness(data: Uint8ClampedArray, factor: number) {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(data[i] * factor)
    data[i + 1] = clamp(data[i + 1] * factor)
    data[i + 2] = clamp(data[i + 2] * factor)
  }
}

function applyContrast(data: Uint8ClampedArray, factor: number) {
  const intercept = 128 * (1 - factor)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(data[i] * factor + intercept)
    data[i + 1] = clamp(data[i + 1] * factor + intercept)
    data[i + 2] = clamp(data[i + 2] * factor + intercept)
  }
}

function applySaturate(data: Uint8ClampedArray, amount: number) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b
    data[i] = clamp(gray + (r - gray) * amount)
    data[i + 1] = clamp(gray + (g - gray) * amount)
    data[i + 2] = clamp(gray + (b - gray) * amount)
  }
}

function applyHueRotate(data: Uint8ClampedArray, degrees: number) {
  const rad = (degrees * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    data[i] = clamp(
      r * (0.213 + cos * 0.787 - sin * 0.213)
      + g * (0.715 - cos * 0.715 - sin * 0.715)
      + b * (0.072 - cos * 0.072 + sin * 0.928),
    )
    data[i + 1] = clamp(
      r * (0.213 - cos * 0.213 + sin * 0.143)
      + g * (0.715 + cos * 0.285 + sin * 0.140)
      + b * (0.072 - cos * 0.072 - sin * 0.283),
    )
    data[i + 2] = clamp(
      r * (0.213 - cos * 0.213 - sin * 0.787)
      + g * (0.715 - cos * 0.715 + sin * 0.715)
      + b * (0.072 + cos * 0.928 + sin * 0.072),
    )
  }
}

function applyBoxBlur(data: Uint8ClampedArray, width: number, height: number, radius: number) {
  if (radius < 1) return
  const r = Math.round(radius)
  const copy = new Uint8ClampedArray(data)
  const kernelSize = (2 * r + 1) * (2 * r + 1)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rSum = 0, gSum = 0, bSum = 0, aSum = 0
      for (let ky = -r; ky <= r; ky++) {
        for (let kx = -r; kx <= r; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx))
          const py = Math.min(height - 1, Math.max(0, y + ky))
          const idx = (py * width + px) * 4
          rSum += copy[idx]
          gSum += copy[idx + 1]
          bSum += copy[idx + 2]
          aSum += copy[idx + 3]
        }
      }
      const idx = (y * width + x) * 4
      data[idx] = rSum / kernelSize
      data[idx + 1] = gSum / kernelSize
      data[idx + 2] = bSum / kernelSize
      data[idx + 3] = aSum / kernelSize
    }
  }
}

/**
 * Apply an art style to raw image data using pixel manipulation.
 * This is guaranteed to work across all browsers without ctx.filter support.
 */
export function applyArtStyle(imageData: ImageData, styleId: ArtStyleId) {
  const { data, width, height } = imageData

  switch (styleId) {
    case 'watercolor':
      applyBoxBlur(data, width, height, 2)
      applySaturate(data, 1.6)
      applyBrightness(data, 1.05)
      applyContrast(data, 0.9)
      break
    case 'oil-paint':
      applyContrast(data, 1.5)
      applySaturate(data, 1.7)
      applyBoxBlur(data, width, height, 1)
      break
    case 'pencil-sketch':
      applyGrayscale(data, 1)
      applyContrast(data, 1.8)
      applyBrightness(data, 1.1)
      break
    case 'cartoon':
      applyContrast(data, 1.8)
      applySaturate(data, 2.2)
      applyBrightness(data, 1.05)
      break
    case 'vintage':
      applySepia(data, 0.8)
      applyContrast(data, 1.15)
      applySaturate(data, 0.8)
      applyBrightness(data, 1.05)
      break
    case 'neon':
      applySaturate(data, 2.8)
      applyBrightness(data, 1.2)
      applyHueRotate(data, 20)
      applyContrast(data, 1.3)
      break
    case 'dreamy':
      applyBoxBlur(data, width, height, 3)
      applyBrightness(data, 1.2)
      applySaturate(data, 1.2)
      break
    case 'bw':
      applyGrayscale(data, 1)
      applyContrast(data, 1.4)
      break
  }
}

function getContainRect(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  padding: number,
) {
  const availableWidth = Math.max(targetWidth - padding * 2, 1)
  const availableHeight = Math.max(targetHeight - padding * 2, 1)
  const scale = Math.min(availableWidth / sourceWidth, availableHeight / sourceHeight)
  const width = sourceWidth * scale
  const height = sourceHeight * scale

  return {
    x: (targetWidth - width) / 2,
    y: (targetHeight - height) / 2,
    width,
    height,
  }
}

/**
 * Loads an image for use in a canvas context without tainting it.
 * Fetches remote images as blobs to avoid CORS canvas-taint issues.
 */
export async function loadImageForCanvas(src: string): Promise<HTMLImageElement> {
  let objectUrl: string | null = null

  try {
    // For remote http(s) URLs: fetch as blob → object URL (always same-origin)
    if (/^https?:\/\//i.test(src)) {
      const response = await fetch(src)
      if (!response.ok) throw new Error(`Image fetch failed: ${response.status}`)
      const blob = await response.blob()
      objectUrl = URL.createObjectURL(blob)
    }

    const imageSrc = objectUrl ?? src
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Unable to load reference image for canvas import.'))
      img.src = imageSrc
    })

    return image
  } catch (err) {
    // Clean up blob URL on failure
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    throw err
  }
}

export function importStyledReferenceImage(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  styleId: ArtStyleId,
) {
  const width = canvas.width
  const height = canvas.height
  const padding = Math.round(Math.min(width, height) * 0.04)

  // Save existing drawing
  const drawingLayer = document.createElement('canvas')
  drawingLayer.width = width
  drawingLayer.height = height
  const drawingLayerCtx = drawingLayer.getContext('2d')
  if (!drawingLayerCtx) return
  drawingLayerCtx.drawImage(canvas, 0, 0)

  // Draw reference image on a temp canvas at the right size
  const styledLayer = document.createElement('canvas')
  styledLayer.width = width
  styledLayer.height = height
  const styledLayerCtx = styledLayer.getContext('2d')
  if (!styledLayerCtx) return

  const { x, y, width: drawWidth, height: drawHeight } = getContainRect(
    image.naturalWidth || image.width,
    image.naturalHeight || image.height,
    width,
    height,
    padding,
  )

  styledLayerCtx.drawImage(image, x, y, drawWidth, drawHeight)

  // Apply style via pixel manipulation (works everywhere)
  const imageData = styledLayerCtx.getImageData(0, 0, width, height)
  applyArtStyle(imageData, styleId)
  styledLayerCtx.putImageData(imageData, 0, 0)

  // Composite: styled reference on bottom, existing drawing on top
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(styledLayer, 0, 0)
  ctx.drawImage(drawingLayer, 0, 0)
  ctx.restore()
}
