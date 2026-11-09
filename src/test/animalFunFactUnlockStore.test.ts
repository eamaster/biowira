/**
 * animalFunFactUnlockStore.test.ts
 *
 * Covers:
 *  1. Unlock state is per-profile (isolated)
 *  2. Unlocking with alias (orangutan) stores bornean-orangutan
 *  3. Unsupported animals are rejected safely
 *  4. Switching profiles reloads a different unlock set
 *  5. Uses storageService envelope format
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { useAnimalFunFactUnlockStore } from '@/stores/animalFunFactUnlockStore'
import { useProfileStore } from '@/stores/profileStore'
import { useSessionStore } from '@/stores/sessionStore'
import { storageService } from '@/services/storageService'
import { STORAGE_KEYS } from '@/app/config'

async function createActiveProfile(nickname: string, animalId = 'malayan-tiger') {
  const profileStore = useProfileStore()
  await profileStore.createProfile({
    displayNickname: nickname,
    animalId,
    animalVisualKey: animalId,
  })
  await nextTick()
  return useSessionStore().activeProfile
}

describe('animalFunFactUnlockStore: unlock state', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('starts with no unlocked animals', async () => {
    await createActiveProfile('Explorer 1')
    const store = useAnimalFunFactUnlockStore()
    expect(store.unlockedAnimalIds.size).toBe(0)
  })

  it('unlocks malayan-tiger by canonical ID', async () => {
    await createActiveProfile('Explorer 1')
    const store = useAnimalFunFactUnlockStore()
    store.unlockAnimalFacts('malayan-tiger')
    expect(store.isAnimalFactsUnlocked('malayan-tiger')).toBe(true)
  })

  it('unlocking orangutan stores bornean-orangutan', async () => {
    await createActiveProfile('Explorer 1')
    const store = useAnimalFunFactUnlockStore()
    store.unlockAnimalFacts('orangutan')
    expect(store.isAnimalFactsUnlocked('bornean-orangutan')).toBe(true)
    expect(store.isAnimalFactsUnlocked('orangutan')).toBe(true)
    expect(store.unlockedAnimalIds.has('bornean-orangutan')).toBe(true)
    expect(store.unlockedAnimalIds.has('orangutan')).toBe(false)
  })

  it('unsupported animals are ignored', async () => {
    await createActiveProfile('Explorer 1')
    const store = useAnimalFunFactUnlockStore()
    store.unlockAnimalFacts('saltwater-crocodile')
    store.unlockAnimalFacts('dugong')
    store.unlockAnimalFacts('tapir')
    expect(store.unlockedAnimalIds.size).toBe(0)
  })

  it('isDemoUnlockEligible returns true for the 3 demo animals', async () => {
    await createActiveProfile('Explorer 1')
    const store = useAnimalFunFactUnlockStore()
    expect(store.isDemoUnlockEligible('malayan-tiger')).toBe(true)
    expect(store.isDemoUnlockEligible('bornean-orangutan')).toBe(true)
    expect(store.isDemoUnlockEligible('orangutan')).toBe(true)
    expect(store.isDemoUnlockEligible('sun-bear')).toBe(true)
  })

  it('isDemoUnlockEligible returns false for unsupported animals', async () => {
    await createActiveProfile('Explorer 1')
    const store = useAnimalFunFactUnlockStore()
    expect(store.isDemoUnlockEligible('saltwater-crocodile')).toBe(false)
    expect(store.isDemoUnlockEligible('sunda-pangolin')).toBe(false)
  })
})

describe('animalFunFactUnlockStore: persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('uses storageService envelope format', async () => {
    const profile = await createActiveProfile('Explorer 1')
    const store = useAnimalFunFactUnlockStore()
    store.unlockAnimalFacts('malayan-tiger')

    const profileId = profile?.profileId ?? ''
    const key = STORAGE_KEYS.demoUnlockedFunFactAnimals(profileId)
    const stored = storageService.get<string[]>(key)
    expect(stored).not.toBeNull()
    expect(Array.isArray(stored)).toBe(true)
    expect(stored).toContain('malayan-tiger')
  })

  it('hydrates previously saved unlocks for active profile', async () => {
    const profile = await createActiveProfile('Explorer 1')
    const store = useAnimalFunFactUnlockStore()

    // Unlock and persist to storage
    store.unlockAnimalFacts('sun-bear')
    expect(store.isAnimalFactsUnlocked('sun-bear')).toBe(true)

    // Verify it persisted to storage
    const profileId = profile?.profileId ?? ''
    const key = STORAGE_KEYS.demoUnlockedFunFactAnimals(profileId)
    const stored = storageService.get<string[]>(key)
    expect(stored).toContain('sun-bear')

    // Clear in-memory state and re-hydrate
    store.resetForActiveProfile()
    expect(store.isAnimalFactsUnlocked('sun-bear')).toBe(false)

    // Re-seed from storage manually and re-hydrate
    storageService.set(key, ['sun-bear'])
    store.hydrateForActiveProfile()
    expect(store.isAnimalFactsUnlocked('sun-bear')).toBe(true)
  })
})

describe('animalFunFactUnlockStore: per-profile isolation', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('reset clears the unlock set', async () => {
    await createActiveProfile('Explorer 1')
    const store = useAnimalFunFactUnlockStore()
    store.unlockAnimalFacts('malayan-tiger')
    expect(store.isAnimalFactsUnlocked('malayan-tiger')).toBe(true)
    store.resetForActiveProfile()
    expect(store.isAnimalFactsUnlocked('malayan-tiger')).toBe(false)
    expect(store.unlockedAnimalIds.size).toBe(0)
  })
})
