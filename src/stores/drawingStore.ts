import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useDiscoverStore } from './discoverStore'
import { resolveAnimalPhoto } from '@/domain/mediaUrl'

export type DrawingTool = 'brush' | 'pen' | 'pencil' | 'spray' | 'chalk' | 'eraser' | 'fill' | 'shape'

export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'line' | 'star'

export interface ToolOption {
  id: DrawingTool
  label: string
  emoji: string
  defaultSize: number
}

export interface ShapeOption {
  id: ShapeType
  label: string
  emoji: string
}

export const SHAPE_OPTIONS: ShapeOption[] = [
  { id: 'rectangle', label: 'Rectangle', emoji: '⬜' },
  { id: 'circle',    label: 'Circle',    emoji: '⭕' },
  { id: 'triangle',  label: 'Triangle',  emoji: '🔺' },
  { id: 'line',      label: 'Line',      emoji: '📏' },
  { id: 'star',      label: 'Star',      emoji: '⭐' },
]

export const TOOL_OPTIONS: ToolOption[] = [
  { id: 'brush',   label: 'Brush',   emoji: '🖌️', defaultSize: 8 },
  { id: 'pen',     label: 'Pen',     emoji: '🖊️', defaultSize: 3 },
  { id: 'pencil',  label: 'Pencil',  emoji: '✏️',  defaultSize: 2 },
  { id: 'spray',   label: 'Spray',   emoji: '💨', defaultSize: 20 },
  { id: 'chalk',   label: 'Chalk',   emoji: '🖍️', defaultSize: 12 },
  { id: 'fill',    label: 'Fill',    emoji: '🥛', defaultSize: 0 },
  { id: 'shape',   label: 'Shapes',  emoji: '🔷', defaultSize: 3 },
  { id: 'eraser',  label: 'Eraser',  emoji: '🧽', defaultSize: 20 },
]

export const COLOR_PALETTE = [
  // Row 1 – basics
  '#000000', '#ffffff', '#4a2c2a', '#8B4513',
  // Row 2 – warm
  '#FF0000', '#FF6B35', '#FF9800', '#FFEB3B',
  // Row 3 – cool
  '#4CAF50', '#00BCD4', '#2196F3', '#9C27B0',
  // Row 4 – pastels
  '#FFB6C1', '#FFDAB9', '#98FB98', '#87CEEB',
] as const

// ── Art Style Presets ─────────────────────────────────────────────────────────
// Each style is a CSS filter string applied to the whole canvas as a one-shot.
export type ArtStyleId =
  | 'watercolor'
  | 'oil-paint'
  | 'pencil-sketch'
  | 'cartoon'
  | 'vintage'
  | 'neon'
  | 'dreamy'
  | 'bw'

export interface ArtStyleOption {
  id: ArtStyleId
  label: string
  emoji: string
}

export const ART_STYLE_OPTIONS: ArtStyleOption[] = [
  { id: 'watercolor',    label: 'Watercolor',  emoji: '💧' },
  { id: 'oil-paint',     label: 'Oil Paint',   emoji: '🎨' },
  { id: 'pencil-sketch', label: 'Pencil',      emoji: '✏️' },
  { id: 'cartoon',       label: 'Cartoon',     emoji: '💥' },
  { id: 'vintage',       label: 'Vintage',     emoji: '📷' },
  { id: 'neon',          label: 'Neon',        emoji: '🌈' },
  { id: 'dreamy',        label: 'Dreamy',      emoji: '☁️' },
  { id: 'bw',            label: 'B&W',         emoji: '⚫' },
]


export const useDrawingStore = defineStore('drawing', () => {
  // ── State ──────────────────────────────────────────────────────────────────

  const isActive = ref(false)
  const activeTool = ref<DrawingTool>('brush')
  const brushColor = ref('#4a2c2a')
  const brushSize = ref(8)
  const historyStack = ref<string[]>([])

  // Shape state
  const activeShape = ref<ShapeType>('rectangle')
  const shapeFilled = ref(true)
  // ── Computed ────────────────────────────────────────────────────────────────

  const animal = computed(() => useDiscoverStore().selectedAnimal)

  const referenceImageSrc = computed(() => resolveAnimalPhoto(animal.value).src)

  const canUndo = computed(() => historyStack.value.length > 1)

  const currentToolOption = computed(() =>
    TOOL_OPTIONS.find(t => t.id === activeTool.value) ?? TOOL_OPTIONS[0],
  )

  // ── Actions ─────────────────────────────────────────────────────────────────

  function selectTool(tool: DrawingTool) {
    activeTool.value = tool
    const option = TOOL_OPTIONS.find(t => t.id === tool)
    if (option) brushSize.value = option.defaultSize
  }

  function selectShape(shape: ShapeType) {
    activeShape.value = shape
    activeTool.value = 'shape'
  }

  function toggleShapeFilled() {
    shapeFilled.value = !shapeFilled.value
  }

  function open() {
    isActive.value = true
    historyStack.value = []
    activeTool.value = 'brush'
    brushSize.value = 8
  }

  function close() {
    isActive.value = false
  }

  function pushHistory(dataUrl: string) {
    const stack = [...historyStack.value, dataUrl]
    if (stack.length > 20) stack.shift()
    historyStack.value = stack
  }

  function popHistory(): string | null {
    if (historyStack.value.length <= 1) return null
    const stack = [...historyStack.value]
    stack.pop()
    historyStack.value = stack
    return stack[stack.length - 1]
  }

  function reset() {
    isActive.value = false
    activeTool.value = 'brush'
    brushColor.value = '#4a2c2a'
    brushSize.value = 8
    historyStack.value = []
    activeShape.value = 'rectangle'
    shapeFilled.value = true
  }

  return {
    // State
    isActive,
    activeTool,
    brushColor,
    brushSize,
    historyStack,
    activeShape,
    shapeFilled,
    // Computed
    animal,
    referenceImageSrc,
    canUndo,
    currentToolOption,
    // Actions
    selectTool,
    selectShape,
    toggleShapeFilled,
    open,
    close,
    pushHistory,
    popHistory,
    reset,
  }
})
