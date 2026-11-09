import type { Quiz } from './quiz'
import { collectQuizRelatedMatchKeys } from './quiz'

export interface QuizListAnimalContext {
  /** Domain animal id from Discover (e.g. malayan-tiger) */
  domainAnimalId?: string
  commonName?: string
  scientificName?: string
  /** Profile last quiz title — boosts matching quiz in hub order (no quiz id on API) */
  recentQuizTitle?: string
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function tokenSet(s: string): Set<string> {
  return new Set(normalize(s).split(/\s+/).filter((t) => t.length > 0))
}

/**
 * Higher score = more relevant for the given animal context.
 * Uses API-derived topic + question linkage; no per-species hardcoding.
 */
export function scoreQuizForAnimalContext(quiz: Quiz, ctx: QuizListAnimalContext): number {
  let score = 0
  const keys = quiz.relatedMatchKeys?.length
    ? quiz.relatedMatchKeys
    : collectQuizRelatedMatchKeys(quiz.questions)

  if (ctx.domainAnimalId) {
    const wanted = ctx.domainAnimalId.toLowerCase()
    if (keys.some((k) => k.toLowerCase() === wanted)) {
      score += 100
    }
  }

  const hay = normalize([quiz.topic, quiz.title, quiz.description].filter(Boolean).join(' '))
  if (!hay) return score

  if (ctx.commonName) {
    const nameNorm = normalize(ctx.commonName)
    if (nameNorm.length >= 3 && hay.includes(nameNorm)) {
      score += 40
    }
    const hayTokens = tokenSet(hay)
    for (const t of tokenSet(ctx.commonName)) {
      if (t.length >= 3 && hayTokens.has(t)) {
        score += 12
      }
    }
  }

  if (ctx.scientificName) {
    const sp = normalize(ctx.scientificName)
    if (sp.length >= 5 && hay.includes(sp)) {
      score += 35
    }
    const parts = ctx.scientificName.trim().split(/\s+/)
    const species = parts[parts.length - 1]
    if (species && species.length >= 3 && hay.includes(normalize(species))) {
      score += 18
    }
  }

  const recent = ctx.recentQuizTitle?.trim()
  if (recent) {
    const qTitle = normalize(quiz.title)
    const r = normalize(recent)
    if (qTitle.length >= 2 && r.length >= 2) {
      if (qTitle === r || qTitle.includes(r) || r.includes(qTitle)) {
        score += 85
      } else {
        const rt = tokenSet(recent)
        const qt = tokenSet(quiz.title)
        for (const t of rt) {
          if (t.length >= 3 && qt.has(t)) {
            score += 28
          }
        }
      }
    }
  }

  return score
}

/** Stable sort: higher relevance first, then original order. */
export function orderQuizzesByRelevance(quizzes: Quiz[], ctx: QuizListAnimalContext): Quiz[] {
  const indexed = quizzes.map((q, i) => ({ q, i, s: scoreQuizForAnimalContext(q, ctx) }))
  indexed.sort((a, b) => {
    if (b.s !== a.s) return b.s - a.s
    return a.i - b.i
  })
  return indexed.map((x) => x.q)
}
