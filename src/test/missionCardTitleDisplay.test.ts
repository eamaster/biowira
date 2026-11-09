import { describe, it, expect } from 'vitest'
import { resolveMissionCardTitleDisplay } from '@/features/game-journal/data/journalMissionMapping'

describe('resolveMissionCardTitleDisplay', () => {
  it('strips flair emoji and maps tiger missions to explorer spirit key', () => {
    const r = resolveMissionCardTitleDisplay('Tiger Territory Walk 🐯')
    expect(r.titleText).toBe('Tiger Territory Walk')
    expect(r.animalIconKey).toBe('malayan-tiger')
    expect(r.animalFallbackEmoji).toBe('🐯')
  })

  it('maps honey / sun bear wording via journal keyword rules', () => {
    const r = resolveMissionCardTitleDisplay('Honey Hunt ☀️')
    expect(r.animalIconKey).toBe('sun-bear')
    expect(r.titleText).toBe('Honey Hunt')
  })

  it('maps orangutan wording', () => {
    const r = resolveMissionCardTitleDisplay('Nest Builder Sprint 🦧')
    expect(r.animalIconKey).toBe('bornean-orangutan')
    expect(r.titleText).toContain('Nest Builder')
    expect(r.titleText).not.toContain('🦧')
  })

  it('treats whitespace-only titles as unspecified (generic explorer mapping)', () => {
    const r = resolveMissionCardTitleDisplay('   ')
    expect(r.titleText).toBe('')
    expect(r.animalIconKey).toBe('malayan-tiger')
  })
})
