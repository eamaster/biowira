import { describe, it, expect } from 'vitest'
import { getQuizHubAnimalIconProps } from '@/domain/quiz'
import type { Quiz, QuizQuestion } from '@/domain/quiz'

function q(partial: Partial<QuizQuestion> & Pick<QuizQuestion, 'id'>): QuizQuestion {
  return {
    questionText: '',
    animalEmoji: '❓',
    answers: [],
    explanation: '',
    correctAnswerId: 'x',
    ...partial,
  }
}

describe('getQuizHubAnimalIconProps', () => {
  it('uses the modal animalVisualKey across questions', () => {
    const quiz: Quiz = {
      id: 't1',
      title: 'Malayan Tiger Quiz',
      description: '',
      questions: [
        q({ id: '1', animalEmoji: '❓' }),
        q({ id: '2', animalEmoji: '🐯', animalVisualKey: 'malayan-tiger', sourceAnimalId: 'malayan-tiger' }),
        q({ id: '3', animalEmoji: '🐯', animalVisualKey: 'malayan-tiger', sourceAnimalId: 'malayan-tiger' }),
        q({ id: '4', animalEmoji: '🦧', animalVisualKey: 'orangutan', sourceAnimalId: 'orangutan' }),
      ],
      pointsPerCorrect: 20,
      bonusForPerfect: 20,
    }
    const props = getQuizHubAnimalIconProps(quiz)
    expect(props.iconKey).toBe('malayan-tiger')
    expect(props.fallbackEmoji).toBe('🐯')
  })

  it('picks first tied key when counts are equal (insertion order)', () => {
    const quiz: Quiz = {
      id: 't2',
      title: 'Tie',
      description: '',
      questions: [
        q({ id: '1', animalVisualKey: 'sun-bear', animalEmoji: '🐻', sourceAnimalId: 'sun-bear' }),
        q({ id: '2', animalVisualKey: 'bornean-orangutan', animalEmoji: '🦧', sourceAnimalId: 'bornean-orangutan' }),
      ],
      pointsPerCorrect: 20,
      bonusForPerfect: 20,
    }
    const props = getQuizHubAnimalIconProps(quiz)
    expect(props.iconKey).toBe('sun-bear')
    expect(props.fallbackEmoji).toBe('🐻')
  })

  it('falls back to emoji-only when no visual keys exist', () => {
    const quiz: Quiz = {
      id: 't3',
      title: 'Emoji only',
      description: '',
      questions: [q({ id: '1', animalEmoji: '🦎' })],
      pointsPerCorrect: 20,
      bonusForPerfect: 20,
    }
    expect(getQuizHubAnimalIconProps(quiz)).toEqual({
      fallbackEmoji: '🦎',
    })
  })

  it('uses hub lion when there are no questions', () => {
    const quiz: Quiz = {
      id: 'empty',
      title: 'X',
      description: '',
      questions: [],
      pointsPerCorrect: 20,
      bonusForPerfect: 20,
    }
    expect(getQuizHubAnimalIconProps(quiz)).toEqual({ fallbackEmoji: '🦁' })
  })

  it('uses paw when dominant key exists but emoji is missing', () => {
    const quiz: Quiz = {
      id: 't4',
      title: 'Y',
      description: '',
      questions: [
        q({
          id: '1',
          animalEmoji: '',
          animalVisualKey: 'sun-bear',
          sourceAnimalId: 'sun-bear',
        }),
      ],
      pointsPerCorrect: 20,
      bonusForPerfect: 20,
    }
    const props = getQuizHubAnimalIconProps(quiz)
    expect(props.iconKey).toBe('sun-bear')
    expect(props.fallbackEmoji).toBe('🐾')
  })
})
