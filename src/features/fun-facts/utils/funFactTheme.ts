import type { FunFact } from '@/domain/funFact'

/** One row per visual theme — single source of truth for fun-fact card + modal styling. */
export const FUN_FACT_THEME_PALETTE = [
  { bg: '#FFF9C4', border: '#FBC02D', accent: '#F9A825', soft: '#FFFDE7' }, // yellow
  { bg: '#E1F5FE', border: '#29B6F6', accent: '#0288D1', soft: '#E3F2FD' }, // blue
  { bg: '#E8F5E9', border: '#66BB6A', accent: '#388E3C', soft: '#F1F8E9' }, // green
  { bg: '#FCE4EC', border: '#F06292', accent: '#C2185B', soft: '#FCE4EC' }, // pink
  { bg: '#E0F2F1', border: '#26A69A', accent: '#00796B', soft: '#E0F7FA' }, // teal
  { bg: '#FFF3E0', border: '#FFA726', accent: '#F57C00', soft: '#FFF8E1' }, // orange
] as const

export type FunFactThemeColors = (typeof FUN_FACT_THEME_PALETTE)[number]

export type FunFactThemeKey = Pick<FunFact, 'id' | 'animalId' | 'factOrder'>

/** Stable string from id, animalId, and factOrder so the same fact always maps to the same theme. */
export function funFactThemeSeed(fact: FunFactThemeKey): string {
  return `${String(fact.id)}|${String(fact.animalId)}|${Number(fact.factOrder ?? 0)}`
}

/** Deterministic theme index from fact identity (same inputs ⇒ same theme). */
export function selectFunFactThemeIndex(fact: FunFactThemeKey): number {
  const seed = funFactThemeSeed(fact)
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return hash % FUN_FACT_THEME_PALETTE.length
}

export function selectFunFactTheme(fact: FunFactThemeKey): FunFactThemeColors {
  return FUN_FACT_THEME_PALETTE[selectFunFactThemeIndex(fact)]
}

/** Inline style object with CSS custom properties for card/modal roots (works with Teleport). */
export function getFunFactThemeCssVars(fact: FunFactThemeKey): Record<string, string> {
  const t = selectFunFactTheme(fact)
  return {
    '--fact-theme-bg': t.bg,
    '--fact-theme-border': t.border,
    '--fact-theme-accent': t.accent,
    '--fact-theme-soft': t.soft,
  }
}
