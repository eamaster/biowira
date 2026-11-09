import { describe, it, expect } from 'vitest'
import {
  EXPLORER_ANIMAL_CATALOG,
  findExplorerAnimalChoice,
  getExplorerAnimalById,
  assertValidExplorerAnimalId,
} from '@/features/welcome/data/explorerAnimalCatalog'
import { resolveExplorerAnimalIconUrl } from '@/features/welcome/data/explorerAnimalIconResolver'
import {
  migrateChildProfile,
  LEGACY_AVATAR_KEY_TO_ANIMAL_ID,
  DEFAULT_EXPLORER_ANIMAL_ID,
} from '@/domain/profileAnimalMigration'

// ── Catalog structure ─────────────────────────────────────────────────────────

describe('Explorer animal catalog — structure', () => {
  it('has exactly 8 entries', () => {
    expect(EXPLORER_ANIMAL_CATALOG.length).toBe(8)
  })

  it('order is exactly the 8 canonical explorers', () => {
    const ids = EXPLORER_ANIMAL_CATALOG.map((e) => e.backendAnimalId)
    expect(ids).toEqual([
      'malayan-tiger',
      'bornean-orangutan',
      'proboscis-monkey',
      'rhinoceros-hornbill',
      'sun-bear',
      'sunda-pangolin',
      'saltwater-crocodile',
      'leatherback-sea-turtle',
    ])
  })

  it('labels are exactly the 8 canonical display names', () => {
    const labels = EXPLORER_ANIMAL_CATALOG.map((e) => e.label)
    expect(labels).toEqual([
      'Malayan Tiger',
      'Bornean Orangutan',
      'Proboscis Monkey',
      'Rhinoceros Hornbill',
      'Sun Bear',
      'Sunda Pangolin',
      'Saltwater Crocodile',
      'Leatherback Sea Turtle',
    ])
  })

  it('Malayan Tiger is first', () => {
    expect(EXPLORER_ANIMAL_CATALOG[0]!.backendAnimalId).toBe('malayan-tiger')
  })

  it('every catalog entry has required fields', () => {
    for (const row of EXPLORER_ANIMAL_CATALOG) {
      expect(row.backendAnimalId).toBeTruthy()
      expect(row.animalVisualKey).toBeTruthy()
      expect(row.label).toBeTruthy()
      expect(row.commonName).toBeTruthy()
      expect(row.fallbackEmoji).toBeTruthy()
    }
  })

  it('every catalog entry resolves an icon URL (SVG or discovery WEBP)', () => {
    for (const row of EXPLORER_ANIMAL_CATALOG) {
      const url = resolveExplorerAnimalIconUrl({
        visualKey: row.animalVisualKey,
        commonName: row.commonName,
      })
      expect(url, `No icon URL for ${row.label}`).toBeTruthy()
    }
  })
})

// ── Disallowed IDs are absent ─────────────────────────────────────────────────

describe('Explorer animal catalog — disallowed IDs are absent', () => {
  const disallowedIds = [
    'tapir',
    'mousedeer',
    'dugong',
    'sea-turtle',
    'sea-turtle-hawksbill',
    'crocodile',
    'hornbill',
    'orangutan',
    'pangolin',
  ]

  it('disallowed IDs are not backendAnimalIds in the catalog', () => {
    const catalogIds = EXPLORER_ANIMAL_CATALOG.map((e) => e.backendAnimalId)
    for (const id of disallowedIds) {
      expect(catalogIds, `'${id}' must not appear as a catalog backendAnimalId`).not.toContain(id)
    }
  })

  it('disallowed IDs are not display labels in the catalog', () => {
    const labels = EXPLORER_ANIMAL_CATALOG.map((e) => e.label.toLowerCase())
    const disallowedLabels = [
      'malayan tapir',
      'green sea turtle',
      'hawksbill sea turtle',
      'dugong',
      'estuarine crocodile',
      'lesser mousedeer',
      'hornbill',
      'orangutan',
      'pangolin',
    ]
    for (const label of disallowedLabels) {
      expect(labels, `'${label}' must not appear as a catalog label`).not.toContain(label)
    }
  })
})

// ── findExplorerAnimalChoice — canonical and alias resolution ─────────────────

describe('findExplorerAnimalChoice — canonical resolution', () => {
  it('resolves malayan-tiger by backendAnimalId', () => {
    expect(findExplorerAnimalChoice('malayan-tiger')?.label).toBe('Malayan Tiger')
  })

  it('resolves bornean-orangutan by backendAnimalId', () => {
    expect(findExplorerAnimalChoice('bornean-orangutan')?.label).toBe('Bornean Orangutan')
  })

  it('resolves rhinoceros-hornbill by backendAnimalId', () => {
    expect(findExplorerAnimalChoice('rhinoceros-hornbill')?.label).toBe('Rhinoceros Hornbill')
  })

  it('resolves sunda-pangolin by backendAnimalId', () => {
    expect(findExplorerAnimalChoice('sunda-pangolin')?.label).toBe('Sunda Pangolin')
  })

  it('resolves saltwater-crocodile by backendAnimalId', () => {
    expect(findExplorerAnimalChoice('saltwater-crocodile')?.label).toBe('Saltwater Crocodile')
  })

  it('resolves leatherback-sea-turtle by backendAnimalId', () => {
    expect(findExplorerAnimalChoice('leatherback-sea-turtle')?.label).toBe('Leatherback Sea Turtle')
  })
})

describe('findExplorerAnimalChoice — legacy alias resolution', () => {
  it("orangutan alias resolves to Bornean Orangutan (not generic 'Orangutan')", () => {
    const entry = findExplorerAnimalChoice('orangutan')
    expect(entry).toBeDefined()
    expect(entry!.label).toBe('Bornean Orangutan')
    expect(entry!.backendAnimalId).toBe('bornean-orangutan')
  })

  it("hornbill alias resolves to Rhinoceros Hornbill (not generic 'Hornbill')", () => {
    const entry = findExplorerAnimalChoice('hornbill')
    expect(entry).toBeDefined()
    expect(entry!.label).toBe('Rhinoceros Hornbill')
    expect(entry!.backendAnimalId).toBe('rhinoceros-hornbill')
  })

  it("pangolin alias resolves to Sunda Pangolin (not generic 'Pangolin')", () => {
    const entry = findExplorerAnimalChoice('pangolin')
    expect(entry).toBeDefined()
    expect(entry!.label).toBe('Sunda Pangolin')
    expect(entry!.backendAnimalId).toBe('sunda-pangolin')
  })

  it("crocodile alias resolves to Saltwater Crocodile (not 'Estuarine Crocodile')", () => {
    const entry = findExplorerAnimalChoice('crocodile')
    expect(entry).toBeDefined()
    expect(entry!.label).toBe('Saltwater Crocodile')
    expect(entry!.backendAnimalId).toBe('saltwater-crocodile')
  })
})

describe('findExplorerAnimalChoice — disallowed IDs return undefined', () => {
  it('sea-turtle returns undefined (not Green Sea Turtle)', () => {
    expect(findExplorerAnimalChoice('sea-turtle')).toBeUndefined()
  })

  it('sea-turtle-hawksbill returns undefined (not Hawksbill Sea Turtle)', () => {
    expect(findExplorerAnimalChoice('sea-turtle-hawksbill')).toBeUndefined()
  })

  it('tapir returns undefined', () => {
    expect(findExplorerAnimalChoice('tapir')).toBeUndefined()
  })

  it('mousedeer returns undefined', () => {
    expect(findExplorerAnimalChoice('mousedeer')).toBeUndefined()
  })

  it('dugong returns undefined', () => {
    expect(findExplorerAnimalChoice('dugong')).toBeUndefined()
  })
})

// ── assertValidExplorerAnimalId ────────────────────────────────────────────────

describe('assertValidExplorerAnimalId', () => {
  it('accepts canonical IDs', () => {
    expect(() => assertValidExplorerAnimalId('malayan-tiger')).not.toThrow()
    expect(() => assertValidExplorerAnimalId('bornean-orangutan')).not.toThrow()
    expect(() => assertValidExplorerAnimalId('leatherback-sea-turtle')).not.toThrow()
  })

  it('accepts approved aliases', () => {
    expect(() => assertValidExplorerAnimalId('orangutan')).not.toThrow()
    expect(() => assertValidExplorerAnimalId('hornbill')).not.toThrow()
    expect(() => assertValidExplorerAnimalId('pangolin')).not.toThrow()
    expect(() => assertValidExplorerAnimalId('crocodile')).not.toThrow()
  })

  it('throws for tapir', () => {
    expect(() => assertValidExplorerAnimalId('tapir')).toThrow()
  })

  it('throws for dugong', () => {
    expect(() => assertValidExplorerAnimalId('dugong')).toThrow()
  })

  it('throws for sea-turtle', () => {
    expect(() => assertValidExplorerAnimalId('sea-turtle')).toThrow()
  })

  it('throws for sea-turtle-hawksbill', () => {
    expect(() => assertValidExplorerAnimalId('sea-turtle-hawksbill')).toThrow()
  })

  it('throws for mousedeer', () => {
    expect(() => assertValidExplorerAnimalId('mousedeer')).toThrow()
  })

  it('throws for unknown id', () => {
    expect(() => assertValidExplorerAnimalId('not-a-real-biowira-animal')).toThrow()
  })
})

// ── getExplorerAnimalById backward compat ─────────────────────────────────────

describe('getExplorerAnimalById (compat alias)', () => {
  it('matches map entries via canonical id', () => {
    const first = EXPLORER_ANIMAL_CATALOG[0]!
    expect(getExplorerAnimalById(first.backendAnimalId)?.animalVisualKey).toBe(first.animalVisualKey)
  })
})

// ── profileAnimalMigration ────────────────────────────────────────────────────

describe('profileAnimalMigration', () => {
  const base = {
    profileId: 'p1',
    displayNickname: 'Kid',
    leafPoints: 0,
    level: 1,
    levelTitle: 'Nature Newbie',
    createdAt: '2020-01-01T00:00:00.000Z',
    lastActiveAt: '2020-01-01T00:00:00.000Z',
    guardianBackupLinked: false,
  }

  it('maps legacy avatarKey tiger to malayan-tiger', () => {
    const m = migrateChildProfile({ ...base, avatarKey: 'tiger' })
    expect(m.animalId).toBe('malayan-tiger')
    expect(m.animalVisualKey).toBe('malayan-tiger')
  })

  it('maps legacy avatarKey turtle to leatherback-sea-turtle', () => {
    const m = migrateChildProfile({ ...base, avatarKey: 'turtle' })
    expect(m.animalId).toBe('leatherback-sea-turtle')
  })

  it('maps every LEGACY_AVATAR_KEY_TO_ANIMAL_ID entry to a catalog animal', () => {
    for (const id of Object.values(LEGACY_AVATAR_KEY_TO_ANIMAL_ID)) {
      expect(
        getExplorerAnimalById(id),
        `LEGACY_AVATAR_KEY_TO_ANIMAL_ID value '${id}' must resolve in catalog`,
      ).toBeDefined()
    }
  })

  it('unknown legacy avatarKey falls back to default explorer animal', () => {
    const m = migrateChildProfile({ ...base, avatarKey: 'totally-unknown-preset' })
    expect(m.animalId).toBe(DEFAULT_EXPLORER_ANIMAL_ID)
  })

  it('preserves unknown backend numeric animalId when animalVisualKey is registered', () => {
    const m = migrateChildProfile({
      ...base,
      animalId: '42',
      animalVisualKey: 'sun-bear',
    })
    expect(m.animalId).toBe('42')
    expect(m.animalVisualKey).toBe('sun-bear')
  })

  it('disallowed profile animalId tapir migrates to default (malayan-tiger)', () => {
    const m = migrateChildProfile({ ...base, animalId: 'tapir', animalVisualKey: 'tapir' })
    expect(m.animalId).toBe('malayan-tiger')
    expect(m.animalVisualKey).toBe('malayan-tiger')
    expect(m.displayNickname).toBe('Kid')
    expect(m.leafPoints).toBe(0)
  })

  it('disallowed profile animalId dugong migrates away from Dugong', () => {
    const m = migrateChildProfile({ ...base, animalId: 'dugong', animalVisualKey: 'dugong' })
    expect(m.animalId).not.toBe('dugong')
    expect(m.animalVisualKey).not.toBe('dugong')
    expect(findExplorerAnimalChoice(m.animalId)).toBeDefined()
  })

  it('disallowed profile animalId mousedeer migrates away from Mousedeer', () => {
    const m = migrateChildProfile({ ...base, animalId: 'mousedeer', animalVisualKey: 'mousedeer' })
    expect(m.animalId).not.toBe('mousedeer')
    expect(findExplorerAnimalChoice(m.animalId)).toBeDefined()
  })

  it('disallowed profile animalId sea-turtle migrates away from Green Sea Turtle', () => {
    const m = migrateChildProfile({ ...base, animalId: 'sea-turtle', animalVisualKey: 'sea-turtle' })
    expect(m.animalId).not.toBe('sea-turtle')
    expect(m.animalId).not.toBe('sea-turtle-hawksbill')
    expect(findExplorerAnimalChoice(m.animalId)).toBeDefined()
  })

  it('disallowed animalId migration preserves nickname and leaf points', () => {
    const m = migrateChildProfile({ ...base, animalId: 'tapir', leafPoints: 250, level: 3 })
    expect(m.displayNickname).toBe('Kid')
    expect(m.leafPoints).toBe(250)
    expect(m.level).toBe(3)
  })

  it('alias animalId orangutan resolves to bornean-orangutan entry', () => {
    const m = migrateChildProfile({ ...base, animalId: 'orangutan', animalVisualKey: 'orangutan' })
    // animalId stays as 'orangutan' (it resolves via alias), visualKey stays from registry
    const entry = findExplorerAnimalChoice(m.animalId)
    expect(entry?.backendAnimalId).toBe('bornean-orangutan')
  })
})
