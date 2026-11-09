import type { UserProgress } from '@/domain/user'
import { getLevelForPoints } from '@/domain/user'
import type { IUserRepository } from '../interfaces'

// ── Storage key ───────────────────────────────────────────────────────────────
// Using localStorage (instead of a module-level singleton) means that
// localStorage.clear() in test beforeEach hooks resets this state,
// preventing accumulation across tests within the same test suite run.
const STATE_KEY = 'mock_user_progress'

// ── Initial state factory ──────────────────────────────────────────────────────
// Starts at 0 leaf-points / level 1 so that adding N points in a fresh test
// environment always yields exactly N (not N + some accumulated baseline).
function makeInitialState(): UserProgress {
  return {
    userId: 'local-user',
    displayName: 'Explorer',
    leafPoints: 0,
    level: 1,
    levelTitle: 'Nature Newbie',
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function loadState(): UserProgress {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    if (raw) return JSON.parse(raw) as UserProgress
  } catch {
    // ignore parse errors — fall through to initial state
  }
  return makeInitialState()
}

function saveState(state: UserProgress): void {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state))
  } catch {
    // ignore storage errors (e.g. in environments where localStorage is unavailable)
  }
}

// ── Repository ─────────────────────────────────────────────────────────────────

export class MockUserRepository implements IUserRepository {
  async getProgress(): Promise<UserProgress> {
    return { ...loadState() }
  }

  async addPoints(points: number): Promise<UserProgress> {
    const state = loadState()
    state.leafPoints += points
    const level = getLevelForPoints(state.leafPoints)
    state.level = level.level
    state.levelTitle = level.title
    saveState(state)
    return { ...state }
  }

  async updateLastAnimal(animalId: string, animalName: string): Promise<void> {
    const state = loadState()
    state.lastAnimalId = animalId
    state.lastAnimalName = animalName
    saveState(state)
  }

  async updateLastQuiz(quizTitle: string): Promise<void> {
    const state = loadState()
    state.lastQuizTitle = quizTitle
    saveState(state)
  }
}
