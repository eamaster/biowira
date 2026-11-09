import { describe, it, expect } from 'vitest'
import { mapBackendQuestionToDomain, type ApiQuizQuestion } from '@/domain/quizApi.dto'

describe('Quiz API Mapping Constraints', () => {
  it('correctly maps valid questions and uses the API explanation field', () => {
    const rawDto: ApiQuizQuestion = {
      questionId: 44,
      animalId: 101, // Mock DB numeric ID
      questionText: 'What is the speed?',
      explanation: 'It is very fast.',
      difficulty: 'medium',
      choices: [
        { choiceLabel: 'A', choiceText: '10kmh', isCorrect: false },
        { choiceLabel: 'B', choiceText: '40kmh', isCorrect: true },
        { choiceLabel: 'C', choiceText: '5kmh', isCorrect: false },
      ]
    }

    const visualMap = {
      '101': { visualKey: 'cheetah-icon', emoji: '🐆' }
    }

    const result = mapBackendQuestionToDomain(rawDto, visualMap)

    expect(result.id).toBe('44')
    expect(result.animalVisualKey).toBe('cheetah-icon')
    expect(result.sourceAnimalId).toBe('101')
    expect(result.animalEmoji).toBe('🐆')
    expect(result.explanation).toBe('It is very fast.')
    expect(result.correctAnswerId).toBe('44:B') // strict ID generation
    
    // Check answer mapping
    expect(result.answers.length).toBe(3)
    expect(result.answers[1]!.id).toBe('44:B')
  })

  it('safely handles missing animal visual mapping with sensible emoji default', () => {
    const rawDto: ApiQuizQuestion = {
      questionId: 55,
      animalId: 999, // Unknown backend ID
      questionText: 'Test',
      explanation: '',
      difficulty: 'hard',
      choices: [{ choiceLabel: 'A', choiceText: 'Yes', isCorrect: true }]
    }

    // Pass empty map deliberately
    const result = mapBackendQuestionToDomain(rawDto, {})
    
    expect(result.animalVisualKey).toBeUndefined()
    expect(result.sourceAnimalId).toBe('999')
    expect(result.animalEmoji).toBe('❓')
  })

  it('fails loudly when missing a strict single correct choice', () => {
    const rawDtoMissing: ApiQuizQuestion = {
      questionId: 66,
      animalId: 102,
      questionText: 'Test',
      explanation: '',
      difficulty: 'easy',
      choices: [
        { choiceLabel: 'A', choiceText: 'No', isCorrect: false },
        { choiceLabel: 'B', choiceText: 'Also No', isCorrect: false }
      ]
    }
    expect(() => mapBackendQuestionToDomain(rawDtoMissing, {})).toThrowError(/exactly one correct choice/)

    const rawDtoMultiple: ApiQuizQuestion = {
      ...rawDtoMissing,
      choices: [
        { choiceLabel: 'A', choiceText: 'Yes', isCorrect: true },
        { choiceLabel: 'B', choiceText: 'Also Yes', isCorrect: true }
      ]
    }
    expect(() => mapBackendQuestionToDomain(rawDtoMultiple, {})).toThrowError(/exactly one correct choice/)
  })

  it('response uses explanation on the wire type', () => {
    const dto: ApiQuizQuestion = {
      questionId: 77,
      animalId: 1,
      questionText: 'What eats what?',
      explanation: 'Food chain logic.',
      difficulty: 'easy',
      choices: [{ choiceLabel: 'A', choiceText: 'Plants', isCorrect: true }],
    }
    // explanation must not fall back to old empty string default
    const result = mapBackendQuestionToDomain(dto, {})
    expect(result.explanation).toBe('Food chain logic.')
  })
})
