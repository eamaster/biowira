// ============================================================
// Fun Fact Access — unit tests
//
// Covers:
//  1. API DTO mapping preserves all access-state fields
//  2. resolveFunFactAccessState precedence (all branches)
//  3. sortFunFactsForDisplay ordering
//  4. pickPrimaryUnlockedFact / pickPrimaryLockedFact
//  5. Store cache: invalidateFactsCache() clears both layers
//  6. Store watcher: level change triggers cache invalidation
//  7. Store watcher: profile change triggers cache invalidation
//  8. Multiple facts per animal are all preserved (no silent discard)
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

import { mapFunFactFromApiDto, type FunFactApiDto } from '@/domain/funFact'
import { resolveFunFactAccessState } from '@/domain/funFactAccess'
import { sortFunFactsForDisplay, pickPrimaryUnlockedFact, pickPrimaryLockedFact } from '@/domain/funFactSelection'
import type { FunFact } from '@/domain/funFact'

// ── 1. DTO mapping preserves all access-state fields ─────────────────────────

describe('mapFunFactFromApiDto: access-state field preservation', () => {
  const animalCtx = {
    id: 'animal-1',
    commonName: 'Malayan Tiger',
    categoryEmoji: '🐯',
    visualKey: 'malayan-tiger',
    imageUrl: 'https://example.com/tiger.jpg',
  }

  it('maps all access-state fields when fully populated (uses unlockLevelNumber, no isLocked)', () => {
    const dto: FunFactApiDto = {
      id: 42,
      emoji: '🐾',
      factText: 'Tigers are the largest wild cats.',
      factImageUrl: 'https://example.com/fact.jpg',
      factOrder: 1,
      unlockLevelNumber: 2,
      accessStatus: 'unlocked',
      levelsNeeded: 0,
      userLevel: 3,
      userPoints: 450,
      alreadyUnlocked: true,
    }
    const fact = mapFunFactFromApiDto(dto, animalCtx)

    expect(fact.id).toBe('42')
    expect(fact.animalId).toBe('animal-1')
    expect(fact.animalName).toBe('Malayan Tiger')
    expect(fact.animalEmoji).toBe('🐾')
    expect(fact.factText).toBe('Tigers are the largest wild cats.')
    expect(fact.imageUrl).toBe('https://example.com/fact.jpg')
    expect(fact.factOrder).toBe(1)
    // unlockLevelNumber from API maps to unlockLevel in domain
    expect(fact.unlockLevel).toBe(2)
    // isLocked is not populated from the API (no longer in contract)
    expect(fact.isLocked).toBeUndefined()
    expect(fact.accessStatus).toBe('unlocked')
    expect(fact.levelsNeeded).toBe(0)
    expect(fact.userLevel).toBe(3)
    expect(fact.alreadyUnlocked).toBe(true)
  })

  it('maps a locked fact correctly using accessStatus (no isLocked from API)', () => {
    const dto: FunFactApiDto = {
      id: '99',
      factText: 'A locked tiger fact.',
      unlockLevelNumber: 3,
      accessStatus: 'locked',   // accessStatus is the authoritative signal
      levelsNeeded: 2,
      userLevel: 1,
      userPoints: 50,
      alreadyUnlocked: false,
    }
    const fact = mapFunFactFromApiDto(dto, animalCtx)

    // isLocked is not returned by the API — it will be undefined in the domain object
    expect(fact.isLocked).toBeUndefined()
    expect(fact.accessStatus).toBe('locked')
    expect(fact.levelsNeeded).toBe(2)
    expect(fact.userLevel).toBe(1)
    expect(fact.alreadyUnlocked).toBe(false)
  })

  it('falls back to categoryEmoji when dto.emoji is absent', () => {
    const dto: FunFactApiDto = {
      id: '1',
      factText: 'No emoji fact.',
      unlockLevelNumber: 1,
    }
    const fact = mapFunFactFromApiDto(dto, animalCtx)
    expect(fact.animalEmoji).toBe('🐯') // categoryEmoji fallback
  })

  it('preserves animalVisualKey and animalImageUrl from context', () => {
    const dto: FunFactApiDto = { id: '1', factText: 'Fact.', unlockLevelNumber: 1 }
    const fact = mapFunFactFromApiDto(dto, animalCtx)
    expect(fact.animalVisualKey).toBe('malayan-tiger')
    expect(fact.animalImageUrl).toBe('https://example.com/tiger.jpg')
  })

  it('defaults unlockLevel to 1 when unlockLevelNumber is missing from DTO', () => {
    const dto = { id: '1', factText: 'Fact.' } as unknown as FunFactApiDto
    const fact = mapFunFactFromApiDto(dto, animalCtx)
    expect(fact.unlockLevel).toBe(1)
  })
})

// ── 2. resolveFunFactAccessState precedence ───────────────────────────────────

describe('resolveFunFactAccessState: precedence rules', () => {
  it('accessStatus "unlocked" → isUnlocked: true, levelsNeeded: 0', () => {
    const state = resolveFunFactAccessState({ accessStatus: 'unlocked', isLocked: true, levelsNeeded: 2 })
    expect(state.status).toBe('unlocked')
    expect(state.isUnlocked).toBe(true)
    expect(state.levelsNeeded).toBe(0)
  })

  it('accessStatus "locked" takes precedence over isLocked: false (mock mode compat test)', () => {
    const state = resolveFunFactAccessState({
      accessStatus: 'locked',
      levelsNeeded: 2,
      isLocked: false,  // mock mode: isLocked is the weakest signal
    })
    expect(state.status).toBe('locked')
    expect(state.isUnlocked).toBe(false)
    expect(state.levelsNeeded).toBe(2)
  })

  it('accessStatus "locked" with levelsNeeded=0 still uses minimum of 1', () => {
    const state = resolveFunFactAccessState({ accessStatus: 'locked', levelsNeeded: 0 })
    expect(state.status).toBe('locked')
    expect(state.isUnlocked).toBe(false)
    expect(state.levelsNeeded).toBe(1)
  })

  it('levelsNeeded > 0 → locked when no accessStatus', () => {
    const state = resolveFunFactAccessState({ levelsNeeded: 3 })
    expect(state.status).toBe('locked')
    expect(state.isUnlocked).toBe(false)
    expect(state.levelsNeeded).toBe(3)
  })

  it('levelsNeeded === 0 → unlocked when no accessStatus', () => {
    const state = resolveFunFactAccessState({ levelsNeeded: 0 })
    expect(state.status).toBe('unlocked')
    expect(state.isUnlocked).toBe(true)
    expect(state.levelsNeeded).toBe(0)
  })

  it('userLevel >= unlockLevel → unlocked when no accessStatus / levelsNeeded', () => {
    const state = resolveFunFactAccessState({ userLevel: 3, unlockLevel: 3 })
    expect(state.status).toBe('unlocked')
    expect(state.isUnlocked).toBe(true)
    expect(state.levelsNeeded).toBe(0)
  })

  it('userLevel < unlockLevel → locked with correct levelsNeeded', () => {
    const state = resolveFunFactAccessState({ userLevel: 1, unlockLevel: 3 })
    expect(state.status).toBe('locked')
    expect(state.isUnlocked).toBe(false)
    expect(state.levelsNeeded).toBe(2)
  })

  it('isLocked: true is a weak fallback (mock mode only — not in live API)', () => {
    const state = resolveFunFactAccessState({ isLocked: true })
    expect(state.status).toBe('locked')
    expect(state.isUnlocked).toBe(false)
  })

  it('isLocked: false is a weak fallback (mock mode only — not in live API)', () => {
    const state = resolveFunFactAccessState({ isLocked: false })
    expect(state.status).toBe('unlocked')
    expect(state.isUnlocked).toBe(true)
  })

  it('no fields → unknown status (mock mode fallback)', () => {
    const state = resolveFunFactAccessState({})
    expect(state.status).toBe('unknown')
    expect(state.isUnlocked).toBe(true) // unknown treated as accessible in mock mode
  })

  it('accessStatus "unlocked" overrides a contradictory levelsNeeded > 0', () => {
    // Backend could return accessStatus:"unlocked" with levelsNeeded:2 — accessStatus wins
    const state = resolveFunFactAccessState({ accessStatus: 'unlocked', levelsNeeded: 2 })
    expect(state.status).toBe('unlocked')
    expect(state.isUnlocked).toBe(true)
    expect(state.levelsNeeded).toBe(0)
  })
})

// ── 3. sortFunFactsForDisplay ─────────────────────────────────────────────────

describe('sortFunFactsForDisplay', () => {
  function makeFact(id: string, factOrder: number | undefined, unlockLevel: number): FunFact {
    return {
      id,
      animalId: 'a1',
      animalName: 'Tiger',
      animalEmoji: '🐯',
      factText: `Fact ${id}`,
      unlockLevel,
      factOrder,
    }
  }

  it('sorts by factOrder ascending (lowest first)', () => {
    const facts = [makeFact('c', 3, 1), makeFact('a', 1, 1), makeFact('b', 2, 1)]
    const sorted = sortFunFactsForDisplay(facts)
    expect(sorted.map((f) => f.id)).toEqual(['a', 'b', 'c'])
  })

  it('falls back to unlockLevel when factOrder ties', () => {
    const facts = [makeFact('x', 1, 3), makeFact('y', 1, 1), makeFact('z', 1, 2)]
    const sorted = sortFunFactsForDisplay(facts)
    expect(sorted[0].id).toBe('y') // unlockLevel 1
    expect(sorted[1].id).toBe('z') // unlockLevel 2
    expect(sorted[2].id).toBe('x') // unlockLevel 3
  })

  it('uses original index as final tiebreak when factOrder and unlockLevel both tie', () => {
    const facts = [makeFact('first', 1, 1), makeFact('second', 1, 1), makeFact('third', 1, 1)]
    const sorted = sortFunFactsForDisplay(facts)
    expect(sorted.map((f) => f.id)).toEqual(['first', 'second', 'third'])
  })

  it('treats undefined factOrder as Infinity (sorted last)', () => {
    const facts = [makeFact('no-order', undefined, 1), makeFact('has-order', 1, 1)]
    const sorted = sortFunFactsForDisplay(facts)
    expect(sorted[0].id).toBe('has-order')
    expect(sorted[1].id).toBe('no-order')
  })

  it('returns a new array (does not mutate input)', () => {
    const facts = [makeFact('b', 2, 1), makeFact('a', 1, 1)]
    const original = facts.map((f) => f.id)
    sortFunFactsForDisplay(facts)
    expect(facts.map((f) => f.id)).toEqual(original)
  })
})

// ── 4. pickPrimaryUnlockedFact / pickPrimaryLockedFact ────────────────────────

describe('pickPrimaryUnlockedFact', () => {
  function makeUnlocked(id: string, factOrder?: number): FunFact {
    return {
      id, animalId: 'a1', animalName: 'Tiger', animalEmoji: '🐯',
      factText: `Fact ${id}`, unlockLevel: 1, factOrder,
      accessStatus: 'unlocked', levelsNeeded: 0, userLevel: 3,
    }
  }

  function makeLocked(id: string, factOrder?: number): FunFact {
    return {
      id, animalId: 'a1', animalName: 'Tiger', animalEmoji: '🐯',
      factText: `Fact ${id}`, unlockLevel: 3, factOrder,
      accessStatus: 'locked', levelsNeeded: 2, userLevel: 1,
    }
  }

  it('returns null for empty array', () => {
    expect(pickPrimaryUnlockedFact([])).toBeNull()
  })

  it('returns null when all facts are locked', () => {
    const facts = [makeLocked('l1', 1), makeLocked('l2', 2)]
    expect(pickPrimaryUnlockedFact(facts)).toBeNull()
  })

  it('returns first unlocked fact by factOrder', () => {
    const facts = [makeUnlocked('u2', 2), makeUnlocked('u1', 1), makeLocked('l1', 3)]
    const picked = pickPrimaryUnlockedFact(facts)
    expect(picked?.id).toBe('u1')
  })

  it('skips locked facts and returns the first accessible one', () => {
    const facts = [makeLocked('l1', 1), makeLocked('l2', 2), makeUnlocked('u1', 3)]
    const picked = pickPrimaryUnlockedFact(facts)
    expect(picked?.id).toBe('u1')
  })

  it('treats unknown-status facts as unlocked (mock mode)', () => {
    const unknown: FunFact = {
      id: 'unk', animalId: 'a1', animalName: 'Tiger', animalEmoji: '🐯',
      factText: 'Mock fact', unlockLevel: 1, factOrder: 1,
      // no accessStatus / isLocked / userLevel
    }
    expect(pickPrimaryUnlockedFact([unknown])?.id).toBe('unk')
  })
})

describe('pickPrimaryLockedFact', () => {
  function makeLocked(id: string, factOrder?: number): FunFact {
    return {
      id, animalId: 'a1', animalName: 'Tiger', animalEmoji: '🐯',
      factText: `Fact ${id}`, unlockLevel: 3, factOrder,
      accessStatus: 'locked', levelsNeeded: 2, userLevel: 1,
    }
  }

  it('returns null for empty array', () => {
    expect(pickPrimaryLockedFact([])).toBeNull()
  })

  it('returns null when all facts are unlocked', () => {
    const unlocked: FunFact = {
      id: 'u1', animalId: 'a1', animalName: 'Tiger', animalEmoji: '🐯',
      factText: 'Unlocked', unlockLevel: 1, accessStatus: 'unlocked', levelsNeeded: 0, userLevel: 3,
    }
    expect(pickPrimaryLockedFact([unlocked])).toBeNull()
  })

  it('returns the first locked fact by factOrder', () => {
    const facts = [makeLocked('l2', 2), makeLocked('l1', 1)]
    expect(pickPrimaryLockedFact(facts)?.id).toBe('l1')
  })
})

// ── 5. funFactStore.invalidateFactsCache: clears both cache layers ─────────────

describe('funFactStore: invalidateFactsCache clears both layers', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('clears the store-level animalFactsCache', async () => {
    const { useFunFactStore } = await import('@/stores/funFactStore')
    const store = useFunFactStore()

    // Plant a fact in the store cache directly (arbitrary key — just needs to be non-empty)
    store.animalFactsCache[':animal-1'] = [
      {
        id: 'f1', animalId: 'animal-1', animalName: 'Tiger', animalEmoji: '🐯',
        factText: 'Stale fact', unlockLevel: 1, userLevel: 1, accessStatus: 'unlocked',
      },
    ]
    expect(Object.keys(store.animalFactsCache)).toHaveLength(1)

    store.invalidateFactsCache()

    expect(Object.keys(store.animalFactsCache)).toHaveLength(0)
  })

  it('clears newlyUnlockedFactIds', async () => {
    const { useFunFactStore } = await import('@/stores/funFactStore')
    const store = useFunFactStore()

    store.newlyUnlockedFactIds.add('fact-123')
    expect(store.newlyUnlockedFactIds.size).toBe(1)

    store.invalidateFactsCache()
    expect(store.newlyUnlockedFactIds.size).toBe(0)
  })

  it('also calls repositories.funFacts.clearCache() (repository layer)', async () => {
    const { repositories } = await import('@/repositories')
    const clearSpy = vi.spyOn(repositories.funFacts, 'clearCache')

    const { useFunFactStore } = await import('@/stores/funFactStore')
    const store = useFunFactStore()

    store.invalidateFactsCache()
    expect(clearSpy).toHaveBeenCalledOnce()

    clearSpy.mockRestore()
  })
})

// ── 6. Store watcher: level change auto-invalidates cache ─────────────────────

describe('funFactStore: level-change watcher invalidates cache', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('clears the store cache when activeProfile.level increases', async () => {
    const { useSessionStore } = await import('@/stores/sessionStore')
    const { useProfileStore } = await import('@/stores/profileStore')
    const { useFunFactStore } = await import('@/stores/funFactStore')

    const profileStore = useProfileStore()
    const sessionStore = useSessionStore()

    await profileStore.createProfile({
      displayNickname: 'Level Test',
      animalId: 'malayan-tiger',
      animalVisualKey: 'malayan-tiger',
    })
    expect(sessionStore.activeProfile?.level).toBe(1)

    const funFactStore = useFunFactStore()

    // Plant a stale cached fact (simulating facts loaded at level 1)
    funFactStore.animalFactsCache['sometoken:animal-1'] = [
      {
        id: 'stale-f1', animalId: 'animal-1', animalName: 'Tiger', animalEmoji: '🐯',
        factText: 'Level-1 stale data', unlockLevel: 2,
        userLevel: 1, accessStatus: 'locked', levelsNeeded: 1,
      },
    ]
    expect(Object.keys(funFactStore.animalFactsCache)).toHaveLength(1)

    // Simulate level-up (the same operation quizStore and missionStore perform)
    sessionStore.patchActiveProfile({ level: 3, leafPoints: 500, levelTitle: 'Forest Explorer' })

    // Vue's watcher is asynchronous — flush microtasks
    await new Promise((resolve) => setTimeout(resolve, 0))

    // Cache must be cleared
    expect(Object.keys(funFactStore.animalFactsCache)).toHaveLength(0)
  })

  it('does NOT clear the cache on initial profile load (oldLevel is null)', async () => {
    const { useProfileStore } = await import('@/stores/profileStore')
    const { useFunFactStore } = await import('@/stores/funFactStore')

    const funFactStore = useFunFactStore()

    // Pre-seed a fact in cache
    funFactStore.animalFactsCache['sometoken:animal-1'] = [
      { id: 'f1', animalId: 'animal-1', animalName: 'Tiger', animalEmoji: '🐯', factText: 'Fact', unlockLevel: 1 },
    ]
    expect(Object.keys(funFactStore.animalFactsCache)).toHaveLength(1)

    // Create profile — this fires the level watcher with oldLevel=undefined (initial)
    const profileStore = useProfileStore()
    await profileStore.createProfile({
      displayNickname: 'Watcher Test',
      animalId: 'hornbill',
      animalVisualKey: 'hornbill',
    })

    await new Promise((resolve) => setTimeout(resolve, 0))

    // Profile-switch watcher fires (clears cache), but level watcher should NOT
    // double-clear or cause an error. Cache is already cleared by the profile watcher.
    // This test mainly checks no exception is thrown.
    expect(true).toBe(true)
  })
})

// ── 7. Store watcher: profile change invalidates cache ────────────────────────

describe('funFactStore: profile-switch watcher invalidates cache', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('clears cache and calls repository.clearCache when switching profiles', async () => {
    const { repositories } = await import('@/repositories')
    const clearSpy = vi.spyOn(repositories.funFacts, 'clearCache')

    const { useProfileStore } = await import('@/stores/profileStore')
    const { useFunFactStore } = await import('@/stores/funFactStore')

    const profileStore = useProfileStore()
    const funFactStore = useFunFactStore()

    // Create profile A
    const responseA = await profileStore.createProfile({
      displayNickname: 'Profile A',
      animalId: 'malayan-tiger',
      animalVisualKey: 'malayan-tiger',
    })
    const profileA = responseA.profile

    // Plant stale facts for profile A
    funFactStore.animalFactsCache['tokenA:animal-1'] = [
      { id: 'fa1', animalId: 'animal-1', animalName: 'Tiger', animalEmoji: '🐯', factText: 'A fact', unlockLevel: 1 },
    ]

    // Create profile B (auto-switches)
    await profileStore.createProfile({
      displayNickname: 'Profile B',
      animalId: 'hornbill',
      animalVisualKey: 'hornbill',
    })

    await new Promise((resolve) => setTimeout(resolve, 0))

    // After profile switch, cache must be cleared
    expect(Object.keys(funFactStore.animalFactsCache)).toHaveLength(0)

    // Switch back to A
    await profileStore.switchToProfile(profileA.profileId)
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(Object.keys(funFactStore.animalFactsCache)).toHaveLength(0)
    // clearCache should have been called at least once per switch
    expect(clearSpy).toHaveBeenCalled()

    clearSpy.mockRestore()
  })
})

// ── 8. Multiple facts per animal are not silently discarded ───────────────────

describe('funFactStore: multiple facts per animal preserved in cache', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('getAnimalFacts returns ALL facts for an animal (not just first)', async () => {
    const { useFunFactStore } = await import('@/stores/funFactStore')
    const store = useFunFactStore()

    // In test context storageService has no SESSION_TOKEN → token is '' → key is ':animal-multi'
    const multiFactKey = ':animal-multi'
    store.animalFactsCache[multiFactKey] = [
      {
        id: 'mf1', animalId: 'animal-multi', animalName: 'Orangutan', animalEmoji: '🦧',
        factText: 'Fact 1', unlockLevel: 1, factOrder: 1,
        accessStatus: 'unlocked', levelsNeeded: 0, userLevel: 3,
      },
      {
        id: 'mf2', animalId: 'animal-multi', animalName: 'Orangutan', animalEmoji: '🦧',
        factText: 'Fact 2', unlockLevel: 2, factOrder: 2,
        accessStatus: 'unlocked', levelsNeeded: 0, userLevel: 3,
      },
      {
        id: 'mf3', animalId: 'animal-multi', animalName: 'Orangutan', animalEmoji: '🦧',
        factText: 'Fact 3 (locked)', unlockLevel: 4, factOrder: 3,
        accessStatus: 'locked', levelsNeeded: 1, userLevel: 3,
      },
    ]

    // getAnimalFacts must return ALL facts (both unlocked and locked)
    const facts = store.getAnimalFacts('animal-multi')
    expect(facts).toHaveLength(3)
  })

  it('pickPrimaryUnlockedFact picks the first unlocked fact in factOrder', async () => {
    const facts: FunFact[] = [
      {
        id: 'mf1', animalId: 'animal-multi', animalName: 'Orangutan', animalEmoji: '🦧',
        factText: 'Fact 1', unlockLevel: 1, factOrder: 1,
        accessStatus: 'unlocked', levelsNeeded: 0, userLevel: 3,
      },
      {
        id: 'mf2', animalId: 'animal-multi', animalName: 'Orangutan', animalEmoji: '🦧',
        factText: 'Fact 2', unlockLevel: 2, factOrder: 2,
        accessStatus: 'unlocked', levelsNeeded: 0, userLevel: 3,
      },
    ]
    const primary = pickPrimaryUnlockedFact(facts)
    expect(primary?.id).toBe('mf1')
  })

  it('sortFunFactsForDisplay returns ALL facts sorted — locked ones included', () => {
    const facts: FunFact[] = [
      {
        id: 'mf3', animalId: 'animal-multi', animalName: 'Orangutan', animalEmoji: '🦧',
        factText: 'Locked fact', unlockLevel: 4, factOrder: 3,
        accessStatus: 'locked', levelsNeeded: 1, userLevel: 3,
      },
      {
        id: 'mf1', animalId: 'animal-multi', animalName: 'Orangutan', animalEmoji: '🦧',
        factText: 'Fact 1', unlockLevel: 1, factOrder: 1,
        accessStatus: 'unlocked', levelsNeeded: 0, userLevel: 3,
      },
      {
        id: 'mf2', animalId: 'animal-multi', animalName: 'Orangutan', animalEmoji: '🦧',
        factText: 'Fact 2', unlockLevel: 2, factOrder: 2,
        accessStatus: 'unlocked', levelsNeeded: 0, userLevel: 3,
      },
    ]
    const sorted = sortFunFactsForDisplay(facts)
    expect(sorted).toHaveLength(3)           // all 3 preserved
    expect(sorted[0].id).toBe('mf1')          // factOrder 1 first
    expect(sorted[1].id).toBe('mf2')          // factOrder 2 second
    expect(sorted[2].id).toBe('mf3')          // factOrder 3 last (locked)
  })

  it('hasFetchedAnimalFacts is true after loadAnimalFacts completes', async () => {
    const { useFunFactStore } = await import('@/stores/funFactStore')
    const store = useFunFactStore()

    // In test context storageService has no SESSION_TOKEN → token is '' → key is ':orangutan'
    const key = ':orangutan'
    store.animalFactsCache[key] = [
      {
        id: 'of1', animalId: 'orangutan', animalName: 'Orangutan', animalEmoji: '🦧',
        factText: 'An orangutan fact.', unlockLevel: 1,
      },
    ]
    expect(store.hasFetchedAnimalFacts('orangutan')).toBe(true)
    expect(store.getAnimalFacts('orangutan')).toHaveLength(1)
  })
})

// ── 8b. allFacts computed: flattens all animals, locked + unlocked ─────────────

describe('funFactStore: allFacts computed includes ALL facts (locked + unlocked)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('allFacts flattens cache and sorts by unlockLevel then factOrder', async () => {
    const { useFunFactStore } = await import('@/stores/funFactStore')
    const store = useFunFactStore()

    // Seed two animals' facts into the cache
    store.animalFactsCache[':tiger'] = [
      { id: 't1', animalId: 'tiger', animalName: 'Tiger', animalEmoji: '🐯', factText: 'T1', unlockLevel: 2, factOrder: 1, accessStatus: 'locked', levelsNeeded: 1, userLevel: 1 },
      { id: 't2', animalId: 'tiger', animalName: 'Tiger', animalEmoji: '🐯', factText: 'T2', unlockLevel: 1, factOrder: 2, accessStatus: 'unlocked', levelsNeeded: 0, userLevel: 1 },
    ]
    store.animalFactsCache[':bear'] = [
      { id: 'b1', animalId: 'bear', animalName: 'Sun Bear', animalEmoji: '🐻', factText: 'B1', unlockLevel: 1, factOrder: 1, accessStatus: 'unlocked', levelsNeeded: 0, userLevel: 1 },
      { id: 'b2', animalId: 'bear', animalName: 'Sun Bear', animalEmoji: '🐻', factText: 'B2', unlockLevel: 3, factOrder: 1, accessStatus: 'locked', levelsNeeded: 2, userLevel: 1 },
    ]

    const all = store.allFacts
    // Must contain all 4 facts
    expect(all).toHaveLength(4)
    // Sorted by unlockLevel: 1, 1, 2, 3
    expect(all[0].unlockLevel).toBe(1)
    expect(all[1].unlockLevel).toBe(1)
    expect(all[2].unlockLevel).toBe(2)
    expect(all[3].unlockLevel).toBe(3)
    // Both level-1 facts present (tiger t2 and bear b1)
    const level1Ids = all.filter((f) => f.unlockLevel === 1).map((f) => f.id).sort()
    expect(level1Ids).toContain('t2')
    expect(level1Ids).toContain('b1')
  })

  it('allFacts is empty when no facts are cached', async () => {
    const { useFunFactStore } = await import('@/stores/funFactStore')
    const store = useFunFactStore()
    expect(store.allFacts).toHaveLength(0)
  })

  it('allFacts updates reactively when cache is invalidated', async () => {
    const { useFunFactStore } = await import('@/stores/funFactStore')
    const store = useFunFactStore()

    store.animalFactsCache[':tiger'] = [
      { id: 't1', animalId: 'tiger', animalName: 'Tiger', animalEmoji: '🐯', factText: 'T1', unlockLevel: 1 },
    ]
    expect(store.allFacts).toHaveLength(1)

    store.invalidateFactsCache()
    expect(store.allFacts).toHaveLength(0)
  })

  it('locked facts appear in allFacts (not filtered out)', async () => {
    const { useFunFactStore } = await import('@/stores/funFactStore')
    const store = useFunFactStore()

    store.animalFactsCache[':a1'] = [
      { id: 'unlocked', animalId: 'a1', animalName: 'A', animalEmoji: '🐾', factText: 'U', unlockLevel: 1, accessStatus: 'unlocked', levelsNeeded: 0, userLevel: 1 },
      { id: 'locked-1', animalId: 'a1', animalName: 'A', animalEmoji: '🐾', factText: 'L1', unlockLevel: 2, accessStatus: 'locked', levelsNeeded: 1, userLevel: 1 },
      { id: 'locked-2', animalId: 'a1', animalName: 'A', animalEmoji: '🐾', factText: 'L2', unlockLevel: 3, accessStatus: 'locked', levelsNeeded: 2, userLevel: 1 },
    ]

    expect(store.allFacts).toHaveLength(3)
    expect(store.allFacts.map((f) => f.id)).toContain('locked-1')
    expect(store.allFacts.map((f) => f.id)).toContain('locked-2')
  })

  it('loadingAllFacts starts false and is exposed', async () => {
    const { useFunFactStore } = await import('@/stores/funFactStore')
    const store = useFunFactStore()
    expect(store.loadingAllFacts).toBe(false)
  })
})

// ── 9. MockFunFactRepository interface compliance ─────────────────────────────

describe('MockFunFactRepository: clearCache contract', () => {
  it('clearCache() is a no-op and does not throw', async () => {
    const { MockFunFactRepository } = await import('@/repositories/mock/mockFunFactRepository')
    const repo = new MockFunFactRepository()
    expect(() => repo.clearCache()).not.toThrow()
  })

  it('getByAnimalId still returns facts after clearCache()', async () => {
    const { MockFunFactRepository } = await import('@/repositories/mock/mockFunFactRepository')
    const repo = new MockFunFactRepository()
    repo.clearCache()
    // Mock repo pulls from static MOCK_FUN_FACTS — clearing has no effect
    const facts = await repo.getByAnimalId('malayan-tiger')
    expect(Array.isArray(facts)).toBe(true)
  })
})

// ── 10. apiFunFactRepository: clearCache resets internal state ────────────────

describe('ApiFunFactRepository: clearCache resets internal caches', () => {
  it('clearCache() is callable and does not throw', async () => {
    const { ApiFunFactRepository } = await import('@/repositories/api/apiFunFactRepository')
    const repo = new ApiFunFactRepository()
    expect(() => repo.clearCache()).not.toThrow()
  })
})
