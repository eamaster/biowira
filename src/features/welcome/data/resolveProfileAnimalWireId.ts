import { appConfig } from '@/app/config'
import { repositories } from '@/repositories'
import type { CreateProfileInput } from '@/domain/session'
import { findExplorerAnimalChoice } from '@/features/welcome/data/explorerAnimalCatalog'

/**
 * Value for POST /profiles `animalId`: when animals → api, match the child's chosen
 * explorer (catalog slug + visual key) to GET /animals rows so numeric backend ids work.
 * When animals → mock, the catalog slug is enough for local profile storage.
 */
export async function resolveProfileAnimalWireId(input: CreateProfileInput): Promise<string> {
  const choice = findExplorerAnimalChoice(input.animalId)
  if (!choice) {
    throw new Error(`Unknown explorer animal: ${input.animalId}`)
  }

  const slug = choice.backendAnimalId
  const visualKey = input.animalVisualKey ?? choice.animalVisualKey

  if (appConfig.repoSources.animals !== 'api') {
    return slug
  }

  const list = await repositories.animals.getAll()
  const withId = list.filter((i) => i.backendId != null && String(i.backendId).trim() !== '')

  const byVisual = withId.find((i) => i.visualKey === visualKey)
  if (byVisual) return String(byVisual.backendId)

  const bySlug = withId.find((i) => String(i.backendId) === slug)
  if (bySlug) return String(bySlug.backendId)

  const byName = withId.find(
    (i) =>
      i.commonName.trim().toLowerCase() === choice.commonName.trim().toLowerCase(),
  )
  if (byName) return String(byName.backendId)

  // Backend may accept the same domain slug as GET /animals/:id
  return slug
}
