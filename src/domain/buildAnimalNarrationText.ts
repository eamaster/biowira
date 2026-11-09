import type { Animal } from '@/domain/animal'

/**
 * Text used for TTS and read-along on the animal detail sheet.
 * Uses only {@link Animal.description}, which maps to the API `description` field.
 * `conservationDescription` / {@link Animal.conservationExplanation} is shown separately
 * in the "Why it matters" callout — it must not be merged here (would duplicate the API).
 */
export function buildAnimalNarrationText(animal: Pick<Animal, 'description'>): string {
  return (animal.description ?? '').trim()
}
