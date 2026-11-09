import type { Quiz } from '@/domain/quiz'

export const MOCK_QUIZZES: Quiz[] = [
  {
    id: 'quiz-rainforest-01',
    topic: 'Rainforest Animals',
    title: 'Rainforest Animals Quiz',
    description: "Test your knowledge about Malaysia's amazing rainforest animals!",
    pointsPerCorrect: 20,
    bonusForPerfect: 20,
    questions: [
      {
        id: 'q1',
        questionText: 'Which animal is famous for its very long nose?',
        animalEmoji: '❓',
        correctAnswerId: 'q1-a',
        explanation:
          'The Proboscis Monkey has the longest nose in the animal kingdom!',
        answers: [
          { id: 'q1-a', label: 'A', text: 'Proboscis Monkey', isCorrect: true },
          { id: 'q1-b', label: 'B', text: 'Malayan Tiger', isCorrect: false },
          { id: 'q1-c', label: 'C', text: 'Hornbill', isCorrect: false },
          { id: 'q1-d', label: 'D', text: 'Sun Bear', isCorrect: false },
        ],
      },
      {
        id: 'q2',
        questionText: "What is Malaysia's national animal?",
        animalEmoji: '🐯',
        animalVisualKey: 'malayan-tiger',
        sourceAnimalId: 'malayan-tiger',
        correctAnswerId: 'q2-b',
        explanation:
          "The Malayan Tiger is Malaysia's national symbol and appears on the country's coat of arms!",
        answers: [
          { id: 'q2-a', label: 'A', text: 'Orangutan', isCorrect: false },
          { id: 'q2-b', label: 'B', text: 'Malayan Tiger', isCorrect: true },
          { id: 'q2-c', label: 'C', text: 'Sun Bear', isCorrect: false },
          { id: 'q2-d', label: 'D', text: 'Tapir', isCorrect: false },
        ],
      },
      {
        id: 'q3',
        questionText: 'Which animal builds a new nest every day?',
        animalEmoji: '🦧',
        animalVisualKey: 'orangutan',
        sourceAnimalId: 'orangutan',
        correctAnswerId: 'q3-c',
        explanation:
          'Orangutans are master builders! They construct a fresh leafy nest high in the trees every single night.',
        answers: [
          { id: 'q3-a', label: 'A', text: 'Sun Bear', isCorrect: false },
          { id: 'q3-b', label: 'B', text: 'Sea Turtle', isCorrect: false },
          { id: 'q3-c', label: 'C', text: 'Orangutan', isCorrect: true },
          { id: 'q3-d', label: 'D', text: 'Pangolin', isCorrect: false },
        ],
      },
      {
        id: 'q4',
        questionText: 'Which animal is covered in scales like a pinecone?',
        animalEmoji: '🦔',
        animalVisualKey: 'pangolin',
        sourceAnimalId: 'pangolin',
        correctAnswerId: 'q4-d',
        explanation:
          'The Pangolin is the only mammal in the world with a body covered in hard keratin scales!',
        answers: [
          { id: 'q4-a', label: 'A', text: 'Crocodile', isCorrect: false },
          { id: 'q4-b', label: 'B', text: 'Mousedeer', isCorrect: false },
          { id: 'q4-c', label: 'C', text: 'Sea Turtle', isCorrect: false },
          { id: 'q4-d', label: 'D', text: 'Pangolin', isCorrect: true },
        ],
      },
      {
        id: 'q5',
        questionText: "How far away can a tiger's roar be heard?",
        animalEmoji: '🐯',
        animalVisualKey: 'malayan-tiger',
        sourceAnimalId: 'malayan-tiger',
        correctAnswerId: 'q5-b',
        explanation:
          "A Malayan Tiger's roar is so powerful it can travel 3 kilometres through the forest!",
        answers: [
          { id: 'q5-a', label: 'A', text: '1 kilometre', isCorrect: false },
          { id: 'q5-b', label: 'B', text: '3 kilometres', isCorrect: true },
          { id: 'q5-c', label: 'C', text: '5 kilometres', isCorrect: false },
          { id: 'q5-d', label: 'D', text: '10 kilometres', isCorrect: false },
        ],
      },
    ],
  },
  {
    id: 'quiz-marine-01',
    topic: 'Marine Life',
    title: 'Ocean Friends Quiz',
    description: 'Splash into questions about sea animals around Malaysia!',
    pointsPerCorrect: 20,
    bonusForPerfect: 20,
    questions: [
      {
        id: 'm1',
        questionText: 'Which gentle sea animal is sometimes called a sea cow?',
        animalEmoji: '🐋',
        animalVisualKey: 'dugong',
        sourceAnimalId: 'dugong',
        correctAnswerId: 'm1-b',
        explanation:
          'The dugong is a peaceful plant-eater related to manatees — kids often call it a sea cow!',
        answers: [
          { id: 'm1-a', label: 'A', text: 'Shark', isCorrect: false },
          { id: 'm1-b', label: 'B', text: 'Dugong', isCorrect: true },
          { id: 'm1-c', label: 'C', text: 'Octopus', isCorrect: false },
          { id: 'm1-d', label: 'D', text: 'Ray', isCorrect: false },
        ],
      },
      {
        id: 'm2',
        questionText: 'Sea turtles travel a long way to nest on sandy beaches. What do they lay?',
        animalEmoji: '🐢',
        animalVisualKey: 'sea-turtle',
        sourceAnimalId: 'sea-turtle',
        correctAnswerId: 'm2-b',
        explanation: 'Mother sea turtles lay soft eggs in a nest they dig above the high tide line.',
        answers: [
          { id: 'm2-a', label: 'A', text: 'Coral pieces', isCorrect: false },
          { id: 'm2-b', label: 'B', text: 'Eggs', isCorrect: true },
          { id: 'm2-c', label: 'C', text: 'Seaweed bundles', isCorrect: false },
          { id: 'm2-d', label: 'D', text: 'Messages in bottles', isCorrect: false },
        ],
      },
    ],
  },
]
