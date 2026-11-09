import { describe, it, expect } from 'vitest'
import { orderQuizzesByRelevance, scoreQuizForAnimalContext } from '@/domain/quizRelevance'
import { MOCK_QUIZZES } from '@/mocks/quizzes'

describe('quizRelevance', () => {
  it('ranks the marine quiz first when the child picked a sea turtle', () => {
    const ordered = orderQuizzesByRelevance(MOCK_QUIZZES, { domainAnimalId: 'sea-turtle' })
    expect(ordered[0]!.id).toBe('quiz-marine-01')
  })

  it('ranks the rainforest quiz first for Malayan Tiger explorers', () => {
    const ordered = orderQuizzesByRelevance(MOCK_QUIZZES, { domainAnimalId: 'malayan-tiger' })
    expect(ordered[0]!.id).toBe('quiz-rainforest-01')
  })

  it('uses topic/title text as a fallback signal', () => {
    const marine = MOCK_QUIZZES.find((q) => q.id === 'quiz-marine-01')!
    const score = scoreQuizForAnimalContext(marine, {
      commonName: 'Green Sea Turtle',
      scientificName: 'Chelonia mydas',
    })
    expect(score).toBeGreaterThan(0)
  })

  it('preserves API order when nothing matches', () => {
    const ordered = orderQuizzesByRelevance(MOCK_QUIZZES, {})
    expect(ordered.map((q) => q.id)).toEqual(MOCK_QUIZZES.map((q) => q.id))
  })

  it('prioritizes quiz matching recent quiz title from profile', () => {
    const rainforest = MOCK_QUIZZES.find((q) => q.id === 'quiz-rainforest-01')!
    const score = scoreQuizForAnimalContext(rainforest, {
      recentQuizTitle: rainforest.title,
    })
    const marine = MOCK_QUIZZES.find((q) => q.id === 'quiz-marine-01')!
    const marineScore = scoreQuizForAnimalContext(marine, {
      recentQuizTitle: rainforest.title,
    })
    expect(score).toBeGreaterThan(marineScore)
  })
})
