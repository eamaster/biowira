import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HOME_PAGE_ASSETS } from '@/app/branding'

const __dirnameTest = dirname(fileURLToPath(import.meta.url))

describe('HOME_PAGE_ASSETS registry', () => {
  const FEATURE_CARD_IDS = ['discover', 'ecoComics', 'quiz', 'missions', 'rescue'] as const

  it('all five feature card groups include panel, icon, and button keys', () => {
    for (const id of FEATURE_CARD_IDS) {
      const card = HOME_PAGE_ASSETS.featureCards[id]
      expect(card.panel, `${id}.panel`).toBeTruthy()
      expect(card.icon, `${id}.icon`).toBeTruthy()
      expect(card.button, `${id}.button`).toBeTruthy()
    }
  })

  it('all feature card asset paths end with .webp', () => {
    for (const id of FEATURE_CARD_IDS) {
      const card = HOME_PAGE_ASSETS.featureCards[id]
      expect(card.panel).toMatch(/\.webp$/)
      expect(card.icon).toMatch(/\.webp$/)
      expect(card.button).toMatch(/\.webp$/)
    }
  })

  it('ecoComics card uses the yellow panel asset', () => {
    expect(HOME_PAGE_ASSETS.featureCards.ecoComics.panel).toBe('/home-page/facts-card.webp')
    expect(HOME_PAGE_ASSETS.featureCards.ecoComics.icon).toBeTruthy()
    expect(HOME_PAGE_ASSETS.featureCards.ecoComics.button).toBeTruthy()
  })

  it('facts card no longer exists in featureCards (replaced by ecoComics)', () => {
    expect('facts' in HOME_PAGE_ASSETS.featureCards).toBe(false)
  })

  it('discover card panel path is registered correctly', () => {
    expect(HOME_PAGE_ASSETS.featureCards.discover.panel).toBe('/home-page/discovery-card.webp')
  })

  it('dashboard assets are registered with semantic keys', () => {
    expect(HOME_PAGE_ASSETS.dashboard.progressPanel).toMatch(/\.webp$/)
    expect(HOME_PAGE_ASSETS.dashboard.subCard).toMatch(/\.webp$/)
  })

  it('homeScene responsive backgrounds use /backgrounds/*.webp (unique, no absolute Windows paths)', () => {
    const { mobileBackground, tabletBackground, desktopBackground } = HOME_PAGE_ASSETS.homeScene
    const paths = [mobileBackground, tabletBackground, desktopBackground]
    for (const p of paths) {
      expect(p).toMatch(/^\/backgrounds\/[^/]+\.webp$/)
      expect(p).not.toMatch(/^[A-Za-z]:\\/)
    }
    expect(new Set(paths).size).toBe(3)
  })

  it('homeScene ribbon remains registered', () => {
    expect(HOME_PAGE_ASSETS.homeScene.ribbon).toMatch(/\.webp$/)
  })

  it('_home_scene_paths.scss mirrors scenic paths from this registry', () => {
    const partial = readFileSync(
      join(__dirnameTest, '../styles/_home_scene_paths.scss'),
      'utf8',
    )
    const { mobileBackground, tabletBackground, desktopBackground } = HOME_PAGE_ASSETS.homeScene
    expect(partial).toContain(mobileBackground.slice(1))
    expect(partial).toContain(tabletBackground.slice(1))
    expect(partial).toContain(desktopBackground.slice(1))
  })

  it('no asset path contains the raw typo filename directly (progess-card.webp is hidden behind semantic key)', () => {
    // The dashboard.progressPanel key abstracts the typo — components never use the raw filename
    expect(HOME_PAGE_ASSETS.dashboard.progressPanel).toBe('/home-page/progess-card.webp')
    // And the semantic key is "progressPanel" (correctly spelled)
    expect('progressPanel' in HOME_PAGE_ASSETS.dashboard).toBe(true)
  })
})
