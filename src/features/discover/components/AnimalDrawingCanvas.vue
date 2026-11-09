<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import PixelButton from '@/components/ui/PixelButton.vue'
import CitedImage from '@/components/ui/CitedImage.vue'
import { useDrawingStore, TOOL_OPTIONS, COLOR_PALETTE, SHAPE_OPTIONS, ART_STYLE_OPTIONS } from '@/stores/drawingStore'
import type { DrawingTool, ShapeType, ArtStyleOption } from '@/stores/drawingStore'
import {
  floodFill,
  drawSpray,
  drawChalkSegment,
  drawShapeOnCanvas,
  importStyledReferenceImage,
  loadImageForCanvas,
} from '@/features/discover/utils/canvasDrawingUtils'

const store = useDrawingStore()
const { animal, referenceImageSrc, brushColor, brushSize, canUndo, activeTool, currentToolOption, activeShape, shapeFilled } = storeToRefs(store)

// ── Canvas refs (local — canvas DOM is not store state) ──────────────────────
const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasContainerRef = ref<HTMLDivElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
const isDrawing = ref(false)
let lastPoint: { x: number; y: number } | null = null

// ── Canvas Setup ─────────────────────────────────────────────────────────────
function initCanvas() {
  const canvas = canvasRef.value
  const container = canvasContainerRef.value
  if (!canvas || !container) return

  const rect = container.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  canvas.style.width = `${rect.width}px`
  canvas.style.height = `${rect.height}px`

  ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  store.pushHistory(canvas.toDataURL())
}

onMounted(() => {
  nextTick(() => initCanvas())
})

// Handle resize
let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  const container = canvasContainerRef.value
  if (!container) return
  resizeObserver = new ResizeObserver(() => {
    const canvas = canvasRef.value
    if (!canvas) return
    const currentData = canvas.toDataURL()
    initCanvas()
    if (store.historyStack.length > 0) {
      restoreFromDataURL(currentData)
    }
  })
  resizeObserver.observe(container)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

// ── Tool-specific drawing ────────────────────────────────────────────────────
function applyToolStyle() {
  if (!ctx) return
  const tool = activeTool.value
  const color = brushColor.value
  const size = brushSize.value

  ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = size
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Tool-specific context tweaks
  if (tool === 'pen') {
    ctx.lineCap = 'butt'
    ctx.lineJoin = 'miter'
  } else if (tool === 'chalk') {
    ctx.lineCap = 'square'
  }

  ctx.globalAlpha = tool === 'pencil' ? 0.6 : tool === 'chalk' ? 0.7 : 1.0
}

// ── Drawing Logic ────────────────────────────────────────────────────────────
function getCoordinates(event: MouseEvent | TouchEvent): { x: number; y: number } {
  const canvas = canvasRef.value!
  const rect = canvas.getBoundingClientRect()
  if ('touches' in event && event.touches.length > 0) {
    return {
      x: event.touches[0].clientX - rect.left,
      y: event.touches[0].clientY - rect.top,
    }
  }
  const me = event as MouseEvent
  return { x: me.clientX - rect.left, y: me.clientY - rect.top }
}

function startDrawing(event: MouseEvent | TouchEvent) {
  if (!ctx) return
  const { x, y } = getCoordinates(event)
  const tool = activeTool.value

  // Fill tool: immediate flood fill, no drag
  if (tool === 'fill') {
    const canvas = canvasRef.value
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    floodFill(ctx, canvas.width, canvas.height, Math.round(x), Math.round(y), brushColor.value, dpr)
    store.pushHistory(canvas.toDataURL())
    return
  }

  // Shape tool: drag-to-draw
  if (tool === 'shape') {
    startShapeDrawing(x, y)
    return
  }

  applyToolStyle()
  lastPoint = { x, y }
  isDrawing.value = true

  if (tool === 'spray') {
    drawSpray(ctx, x, y, brushSize.value)
  } else {
    ctx.beginPath()
    ctx.moveTo(x, y)
  }
}

function draw(event: MouseEvent | TouchEvent) {
  if (!isDrawing.value || !ctx) return
  event.preventDefault()
  const { x, y } = getCoordinates(event)
  const tool = activeTool.value

  // Shape live preview
  if (tool === 'shape') {
    drawShapePreview(x, y)
    return
  }

  if (tool === 'spray') {
    drawSpray(ctx, x, y, brushSize.value)
  } else if (tool === 'chalk') {
    if (lastPoint) drawChalkSegment(ctx, lastPoint.x, lastPoint.y, x, y, brushSize.value)
  } else {
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  lastPoint = { x, y }
}

function stopDrawing(event?: MouseEvent | TouchEvent) {
  if (!isDrawing.value || !ctx) return
  const tool = activeTool.value

  // Shape tool: finalize shape
  if (tool === 'shape' && shapeStartPoint) {
    if (event) {
      const { x, y } = getCoordinates(event)
      finishShapeDrawing(x, y)
    } else {
      // If mouseleave with no event coords, cancel shape
      if (preShapeImageData) ctx.putImageData(preShapeImageData, 0, 0)
      shapeStartPoint = null
      preShapeImageData = null
      isDrawing.value = false
    }
    return
  }

  if (tool !== 'spray' && tool !== 'chalk') {
    ctx.closePath()
  }
  ctx.globalAlpha = 1.0
  ctx.globalCompositeOperation = 'source-over'
  isDrawing.value = false
  lastPoint = null
  const canvas = canvasRef.value
  if (canvas) store.pushHistory(canvas.toDataURL())
}

// ── History ──────────────────────────────────────────────────────────────────
function restoreFromDataURL(dataUrl: string) {
  const canvas = canvasRef.value
  if (!canvas || !ctx) return
  const img = new Image()
  img.src = dataUrl
  img.onload = () => {
    const dpr = window.devicePixelRatio || 1
    ctx!.globalCompositeOperation = 'source-over'
    ctx!.globalAlpha = 1.0
    ctx!.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    ctx!.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr)
  }
}

function undo() {
  const prev = store.popHistory()
  if (prev) restoreFromDataURL(prev)
}

function clearCanvas() {
  const canvas = canvasRef.value
  if (!canvas || !ctx) return
  const dpr = window.devicePixelRatio || 1
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1.0
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
  store.pushHistory(canvas.toDataURL())
}

function downloadDrawing() {
  const canvas = canvasRef.value
  if (!canvas || !animal.value) return

  // Create a temp canvas with white background
  const exportCanvas = document.createElement('canvas')
  exportCanvas.width = canvas.width
  exportCanvas.height = canvas.height
  const exportCtx = exportCanvas.getContext('2d')!
  exportCtx.fillStyle = '#ffffff'
  exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)
  exportCtx.drawImage(canvas, 0, 0)

  const link = document.createElement('a')
  const name = animal.value.commonName.toLowerCase().replace(/\s+/g, '-')
  link.download = `my-${name}-sketch.png`
  link.href = exportCanvas.toDataURL()
  link.click()
}

function onSelectTool(tool: DrawingTool) {
  store.selectTool(tool)
}

// ── Custom color picker ──────────────────────────────────────────────────────
const colorPickerRef = ref<HTMLInputElement | null>(null)

function openColorPicker() {
  colorPickerRef.value?.click()
}

function onCustomColorChange(event: Event) {
  const input = event.target as HTMLInputElement
  brushColor.value = input.value
}

// ── Shape Drawing (drag to create shapes/lines) ──────────────────────────────
let shapeStartPoint: { x: number; y: number } | null = null
let preShapeImageData: ImageData | null = null

function startShapeDrawing(x: number, y: number) {
  if (!ctx || !canvasRef.value) return
  const canvas = canvasRef.value
  preShapeImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  shapeStartPoint = { x, y }
  isDrawing.value = true
}

function drawShapePreview(x: number, y: number) {
  if (!ctx || !shapeStartPoint || !preShapeImageData || !canvasRef.value) return
  // Restore canvas to pre-shape state for live preview
  ctx.putImageData(preShapeImageData, 0, 0)
  drawShapeOnCanvas(ctx, activeShape.value, shapeFilled.value, brushColor.value, brushSize.value || 3, shapeStartPoint.x, shapeStartPoint.y, x, y)
}

function finishShapeDrawing(x: number, y: number) {
  if (!ctx || !shapeStartPoint || !preShapeImageData || !canvasRef.value) return
  // Final draw
  ctx.putImageData(preShapeImageData, 0, 0)
  drawShapeOnCanvas(ctx, activeShape.value, shapeFilled.value, brushColor.value, brushSize.value || 3, shapeStartPoint.x, shapeStartPoint.y, x, y)

  shapeStartPoint = null
  preShapeImageData = null
  isDrawing.value = false

  const canvas = canvasRef.value
  if (canvas) store.pushHistory(canvas.toDataURL())
}

function onSelectShape(shape: ShapeType) {
  store.selectShape(shape)
}

// ── Styled Reference Import ──────────────────────────────────────────────────
const showStylePanel = ref(false)
const isImportingReference = ref(false)
const importStatus = ref<{ type: 'success' | 'error'; message: string } | null>(null)

function toggleStylePanel() {
  showStylePanel.value = !showStylePanel.value
  if (showStylePanel.value) {
    importStatus.value = null
  }
}

async function importStyledReference(style: ArtStyleOption) {
  const canvas = canvasRef.value
  const source = referenceImageSrc.value
  if (!canvas || !ctx || !source) return

  isImportingReference.value = true
  importStatus.value = null

  let previousCanvasState = ''

  try {
    previousCanvasState = canvas.toDataURL()
    const referenceImage = await loadImageForCanvas(source)
    importStyledReferenceImage(ctx, canvas, referenceImage, style.id)
    store.pushHistory(canvas.toDataURL())
    importStatus.value = {
      type: 'success',
      message: `${style.label} reference imported under your drawing. Use Undo to try another style.`,
    }
    showStylePanel.value = false
  } catch {
    if (previousCanvasState) {
      restoreFromDataURL(previousCanvasState)
    }

    importStatus.value = {
      type: 'error',
      message: 'Could not import this reference image into the canvas. The image source may block canvas access.',
    }
  } finally {
    isImportingReference.value = false
  }
}
</script>

<template>
  <div v-if="animal" class="drawing">
    <!-- Top Bar -->
    <div class="drawing__top-bar">
      <PixelButton variant="gray" class="drawing__back-btn" @click="store.close()">⬅ Back to Info</PixelButton>
      <h3 class="drawing__title">🎨 Sketch: {{ animal.commonName }}</h3>
    </div>

    <div class="drawing__layout">
      <!-- Sidebar: reference + tools -->
      <aside class="drawing__sidebar">
        <!-- Reference Image (fixed at top, doesn't scroll) -->
        <div class="drawing__reference">
          <h4 class="drawing__section-title">📷 Reference</h4>
          <CitedImage
            v-if="referenceImageSrc"
            class="drawing__reference-img"
            :src="referenceImageSrc"
            :alt="`Reference photo of ${animal.commonName}`"
            :attribution="animal.imageAttribution"
            object-fit="cover"
            loading="eager"
            attribution-align="center"
            attribution-entity="drawing-reference"
          />
          <div v-else class="drawing__reference-placeholder">
            <span class="drawing__reference-emoji">{{ animal.iconEmoji || '🐾' }}</span>
          </div>
        </div>

        <!-- Scrollable area for tools/colors/shapes/size/actions -->
        <div class="drawing__sidebar-scroll">

          <!-- Tool Selector -->
          <div class="drawing__tool-picker">
            <h4 class="drawing__section-title">🖌️ Pick a Tool</h4>
            <div class="drawing__tools">
              <button
                v-for="tool in TOOL_OPTIONS"
                :key="tool.id"
                class="drawing__tool-btn"
                :class="{ 'drawing__tool-btn--active': activeTool === tool.id }"
                :aria-label="`Use ${tool.label}`"
                :title="tool.label"
                @click="onSelectTool(tool.id)"
              >
                <span class="drawing__tool-emoji">{{ tool.emoji }}</span>
                <span class="drawing__tool-name">{{ tool.label }}</span>
              </button>
            </div>
          </div>

          <!-- Color Palette -->
          <div class="drawing__palette">
            <h4 class="drawing__section-title">🎨 Colors</h4>
            <div class="drawing__colors">
              <button
                v-for="color in COLOR_PALETTE"
                :key="color"
                class="drawing__color-btn"
                :class="{ 'drawing__color-btn--active': brushColor === color }"
                :style="{ backgroundColor: color }"
                :aria-label="`Select color ${color}`"
                @click="brushColor = color"
              ></button>
              <!-- Custom color picker button -->
              <button
                class="drawing__color-btn drawing__color-btn--custom"
                aria-label="Pick a custom color"
                title="Pick your own color!"
                @click="openColorPicker"
              >
                <span class="drawing__color-custom-icon">🌈</span>
              </button>
            </div>
            <input
              ref="colorPickerRef"
              type="color"
              :value="brushColor"
              class="drawing__color-hidden-input"
              @input="onCustomColorChange"
            >
          </div>

          <!-- Shape Selector (visible when shape tool is active) -->
          <div v-if="activeTool === 'shape'" class="drawing__shape-panel">
            <h4 class="drawing__section-title">🔷 Pick a Shape</h4>
            <div class="drawing__shapes">
              <button
                v-for="shape in SHAPE_OPTIONS"
                :key="shape.id"
                class="drawing__shape-btn"
                :class="{ 'drawing__shape-btn--active': activeShape === shape.id }"
                :aria-label="`Draw ${shape.label}`"
                :title="shape.label"
                @click="onSelectShape(shape.id)"
              >
                <span class="drawing__shape-emoji">{{ shape.emoji }}</span>
                <span class="drawing__shape-name">{{ shape.label }}</span>
              </button>
            </div>
            <div class="drawing__shape-fill-toggle">
              <button
                class="drawing__fill-toggle-btn"
                :class="{ 'drawing__fill-toggle-btn--active': shapeFilled }"
                @click="store.toggleShapeFilled()"
              >
                {{ shapeFilled ? '🎨 Filled' : '🖼️ Outline Only' }}
              </button>
              <span class="drawing__fill-toggle-hint">
                {{ shapeFilled ? 'Shapes will be filled with color' : 'Shapes will be outline only' }}
              </span>
            </div>
          </div>

          <!-- Brush Size (hidden for fill tool) -->
          <div v-if="activeTool !== 'fill'" class="drawing__size-panel">
            <h4 class="drawing__section-title">📏 {{ activeTool === 'shape' ? 'Line Width' : 'Size' }}: {{ brushSize }}px</h4>
            <input
              v-model.number="brushSize"
              type="range"
              min="1"
              max="50"
              class="drawing__size-slider"
            >
            <div class="drawing__size-preview">
              <span
                class="drawing__size-dot"
                :style="{
                  width: Math.min(brushSize, 40) + 'px',
                  height: Math.min(brushSize, 40) + 'px',
                  backgroundColor: activeTool === 'eraser' ? '#ccc' : brushColor,
                }"
              ></span>
            </div>
          </div>

          <!-- Actions -->
          <div class="drawing__actions">
            <PixelButton variant="gray" size="sm" :disabled="!canUndo" @click="undo">↩ Undo</PixelButton>
            <PixelButton variant="red" size="sm" @click="clearCanvas">🗑 Clear</PixelButton>
            <PixelButton variant="blue" size="sm" full-width @click="downloadDrawing">💾 Save</PixelButton>
          </div>
        </div><!-- /.drawing__sidebar-scroll -->
      </aside>

      <!-- Canvas Area -->
      <div ref="canvasContainerRef" class="drawing__canvas-wrap">
        <div class="drawing__canvas-label">
          {{ currentToolOption?.emoji }} {{ currentToolOption?.label }} Mode
        </div>

        <!-- Import Styled Reference Button (top-right) -->
        <div class="drawing__styles-control">
          <button
            class="drawing__styles-toggle"
            :class="{ 'drawing__styles-toggle--active': showStylePanel }"
            :disabled="!referenceImageSrc || isImportingReference"
            aria-label="Import styled reference image"
            title="Import the animal reference into the canvas with a selected style"
            @click="toggleStylePanel"
          >
            {{ isImportingReference ? 'Importing...' : '🖼 Import' }}
          </button>
          <div v-if="showStylePanel" class="drawing__styles-popover">
            <h4 class="drawing__styles-title">🖼 Import Styled Reference</h4>
            <p class="drawing__styles-hint">
              Choose a style to place the animal photo inside the canvas under your drawing.
              Use Undo to try a different style.
            </p>
            <div class="drawing__styles-grid">
              <button
                v-for="style in ART_STYLE_OPTIONS"
                :key="style.id"
                class="drawing__style-btn"
                :disabled="isImportingReference"
                :title="`Import ${style.label} reference`"
                @click="importStyledReference(style)"
              >
                <span class="drawing__style-emoji">{{ style.emoji }}</span>
                <span class="drawing__style-name">{{ style.label }}</span>
              </button>
            </div>
            <p
              v-if="importStatus"
              class="drawing__styles-status"
              :class="`drawing__styles-status--${importStatus.type}`"
            >
              {{ importStatus.message }}
            </p>
            <button class="drawing__styles-close" @click="showStylePanel = false">Close</button>
          </div>
        </div>

        <canvas
          ref="canvasRef"
          class="drawing__canvas"
          @mousedown="startDrawing"
          @mousemove="draw"
          @mouseup="stopDrawing($event)"
          @mouseleave="stopDrawing($event)"
          @touchstart.prevent="startDrawing"
          @touchmove.prevent="draw"
          @touchend="stopDrawing($event)"
        ></canvas>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.drawing {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  // ── Top Bar ─────────────────────────────────────────────────────────────
  &__top-bar {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  &__back-btn {
    font-size: var(--text-sm);
  }

  &__title {
    font-family: var(--font-readable);
    font-size: clamp(16px, 2.5vw, 20px);
    font-weight: 800;
    color: var(--color-text);
  }

  // ── Layout ──────────────────────────────────────────────────────────────
  &__layout {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);

    @media (min-width: 768px) {
      flex-direction: row;
      height: 700px;
    }
  }

  // ── Sidebar ─────────────────────────────────────────────────────────────
  &__sidebar {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    width: 100%;

    @media (min-width: 768px) {
      width: 280px;
      flex-shrink: 0;
      height: 100%;
      overflow: hidden;
    }
  }

  &__sidebar-scroll {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    @media (min-width: 768px) {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding-right: 4px;
    }
  }

  &__section-title {
    font-family: var(--font-readable);
    font-size: 13px;
    font-weight: 800;
    color: var(--color-text);
    margin-bottom: var(--space-2);
  }

  // ── Reference ───────────────────────────────────────────────────────────
  &__reference {
    background: var(--color-bg-card);
    border: 2px solid var(--color-border-light);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    flex-shrink: 0;
  }

  &__reference-img {
    width: 100%;
    border-radius: var(--radius-sm);

    :deep(.cited-image__img) {
      max-height: 160px;
      width: 100%;
      object-fit: cover;
    }
  }

  &__reference-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100px;
    background: var(--color-bg);
    border-radius: var(--radius-sm);
  }

  &__reference-emoji {
    font-size: 40px;
  }

  // ── Tool Picker ─────────────────────────────────────────────────────────
  &__tool-picker {
    background: var(--color-bg-card);
    border: 2px solid var(--color-border-light);
    border-radius: var(--radius-md);
    padding: var(--space-3);
  }

  &__tools {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-2);
  }

  &__tool-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: var(--space-2) var(--space-1);
    border-radius: var(--radius-md);
    border: 2px solid var(--color-border-light);
    background: var(--color-bg);
    cursor: pointer;
    transition: transform 0.15s, border-color 0.15s, background 0.15s;

    &:hover {
      transform: scale(1.05);
      background: rgba(255, 255, 255, 0.8);
    }

    &--active {
      border-color: var(--btn-green-border);
      background: rgba(76, 175, 80, 0.12);
      transform: scale(1.05);
      box-shadow: 0 2px 6px rgba(76, 175, 80, 0.25);
    }
  }

  &__tool-emoji {
    font-size: 20px;
    line-height: 1;
  }

  &__tool-name {
    font-family: var(--font-readable);
    font-size: 10px;
    font-weight: 700;
    color: var(--color-text-muted);
  }

  // ── Color Palette ───────────────────────────────────────────────────────
  &__palette {
    background: var(--color-bg-card);
    border: 2px solid var(--color-border-light);
    border-radius: var(--radius-md);
    padding: var(--space-3);
  }

  &__colors {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    justify-items: center;
  }

  &__color-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid var(--color-border-light);
    cursor: pointer;
    transition: transform 0.15s, border-color 0.15s;

    &:hover {
      transform: scale(1.15);
    }

    &--active {
      transform: scale(1.2);
      border-color: var(--color-text);
      box-shadow: 0 0 0 3px rgba(61, 43, 31, 0.2);
    }

    &--custom {
      background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red) !important;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
  }

  &__color-custom-icon {
    font-size: 14px;
    line-height: 1;
  }

  &__color-hidden-input {
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;
    pointer-events: none;
  }

  // ── Shape Panel ─────────────────────────────────────────────────────────
  &__shape-panel {
    background: var(--color-bg-card);
    border: 2px solid var(--color-border-light);
    border-radius: var(--radius-md);
    padding: var(--space-3);
  }

  &__shapes {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }

  &__shape-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: var(--space-2) var(--space-1);
    border-radius: var(--radius-md);
    border: 2px solid var(--color-border-light);
    background: var(--color-bg);
    cursor: pointer;
    transition: transform 0.15s, border-color 0.15s, background 0.15s;

    &:hover {
      transform: scale(1.05);
      background: rgba(255, 255, 255, 0.8);
    }

    &--active {
      border-color: var(--btn-blue-border, #1976d2);
      background: rgba(33, 150, 243, 0.1);
      transform: scale(1.05);
      box-shadow: 0 2px 6px rgba(33, 150, 243, 0.25);
    }
  }

  &__shape-emoji {
    font-size: 20px;
    line-height: 1;
  }

  &__shape-name {
    font-family: var(--font-readable);
    font-size: 10px;
    font-weight: 700;
    color: var(--color-text-muted);
  }

  &__shape-fill-toggle {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  &__fill-toggle-btn {
    width: 100%;
    padding: 8px 12px;
    border-radius: var(--radius-md);
    border: 2px solid var(--color-border-light);
    background: var(--color-bg);
    font-family: var(--font-readable);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;

    &:hover {
      background: rgba(255, 255, 255, 0.8);
    }

    &--active {
      border-color: var(--btn-orange-border);
      background: rgba(255, 152, 0, 0.12);
    }
  }

  &__fill-toggle-hint {
    font-family: var(--font-readable);
    font-size: 10px;
    color: var(--color-text-muted);
    text-align: center;
  }

  // ── Size Panel ──────────────────────────────────────────────────────────
  &__size-panel {
    background: var(--color-bg-card);
    border: 2px solid var(--color-border-light);
    border-radius: var(--radius-md);
    padding: var(--space-3);
  }

  &__size-slider {
    width: 100%;
    height: 6px;
    appearance: none;
    background: var(--color-border-light);
    border-radius: 3px;
    outline: none;
    cursor: pointer;
    margin-bottom: var(--space-2);

    &::-webkit-slider-thumb {
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--btn-orange-bg);
      border: 2px solid var(--btn-orange-border);
      cursor: pointer;
    }

    &::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--btn-orange-bg);
      border: 2px solid var(--btn-orange-border);
      cursor: pointer;
    }
  }

  &__size-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 44px;
  }

  &__size-dot {
    border-radius: 50%;
    transition: width 0.15s, height 0.15s, background-color 0.15s;
  }

  // ── Actions ─────────────────────────────────────────────────────────────
  &__actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-2);

    > :last-child {
      grid-column: 1 / -1;
    }
  }

  // ── Canvas ──────────────────────────────────────────────────────────────
  &__canvas-wrap {
    position: relative;
    background: #ffffff;
    border: 2px solid var(--color-border-light);
    border-radius: var(--radius-lg);
    overflow: hidden;
    height: 400px;

    @media (min-width: 768px) {
      flex: 1;
      height: 100%;
    }
  }

  &__canvas-label {
    position: absolute;
    top: var(--space-3);
    left: var(--space-3);
    z-index: 2;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(4px);
    padding: 4px 12px;
    border-radius: var(--radius-full);
    border: 1px solid var(--color-border-light);
    font-family: var(--font-readable);
    font-size: 12px;
    font-weight: 700;
    color: var(--color-text-muted);
    pointer-events: none;
  }

  &__canvas {
    display: block;
    width: 100%;
    height: 100%;
    cursor: crosshair;
    touch-action: none;
  }

  // ── Styles Control (inside canvas, top-right) ───────────────────────────
  &__styles-control {
    position: absolute;
    top: var(--space-3);
    right: var(--space-3);
    z-index: 3;
  }

  &__styles-toggle {
    padding: 6px 14px;
    border-radius: var(--radius-full);
    border: 2px solid var(--btn-orange-border, #e65100);
    background: rgba(255, 248, 230, 0.95);
    backdrop-filter: blur(4px);
    font-family: var(--font-readable);
    font-size: 13px;
    font-weight: 800;
    color: var(--color-text);
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
    transition: transform 0.15s, background 0.15s;

    &:hover {
      transform: scale(1.05);
      background: rgba(255, 240, 200, 1);
    }

    &--active {
      background: var(--btn-orange-bg, #ff9800);
      color: #fff;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.65;
      transform: none;
    }
  }

  &__styles-popover {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 260px;
    background: var(--color-bg-card);
    border: 2px solid var(--color-border-light);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
  }

  &__styles-title {
    font-family: var(--font-readable);
    font-size: 13px;
    font-weight: 800;
    color: var(--color-text);
    margin: 0 0 4px;
  }

  &__styles-hint {
    font-family: var(--font-readable);
    font-size: 11px;
    color: var(--color-text-muted);
    margin: 0 0 var(--space-2);
  }

  &__styles-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-2);
    margin-bottom: var(--space-2);
  }

  &__style-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: var(--space-2);
    border-radius: var(--radius-md);
    border: 2px solid var(--color-border-light);
    background: var(--color-bg);
    cursor: pointer;
    transition: transform 0.15s, border-color 0.15s, background 0.15s;

    &:hover {
      transform: scale(1.04);
      background: rgba(255, 255, 255, 0.85);
      border-color: var(--btn-orange-border, #e65100);
    }

    &:disabled {
      cursor: wait;
      opacity: 0.6;
      transform: none;
    }
  }

  &__style-emoji {
    font-size: 22px;
    line-height: 1;
  }

  &__style-name {
    font-family: var(--font-readable);
    font-size: 11px;
    font-weight: 700;
    color: var(--color-text);
  }

  &__styles-status {
    margin: 0 0 var(--space-2);
    padding: 8px 10px;
    border-radius: var(--radius-md);
    font-family: var(--font-readable);
    font-size: 11px;
    font-weight: 700;
    line-height: 1.35;

    &--success {
      background: rgba(76, 175, 80, 0.12);
      color: #2f6f36;
      border: 1px solid rgba(76, 175, 80, 0.28);
    }

    &--error {
      background: rgba(229, 57, 53, 0.12);
      color: #a12720;
      border: 1px solid rgba(229, 57, 53, 0.24);
    }
  }

  &__styles-close {
    width: 100%;
    padding: 6px;
    border-radius: var(--radius-md);
    border: 2px solid var(--color-border-light);
    background: var(--color-bg);
    font-family: var(--font-readable);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;

    &:hover {
      background: rgba(0, 0, 0, 0.04);
    }
  }
}
</style>
