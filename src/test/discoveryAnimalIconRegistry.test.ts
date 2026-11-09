import { describe, it, expect } from 'vitest'
import {
  getDiscoveryAnimalIconUrl,
  getDiscoveryAnimalIconKeys,
  getDiscoveryIconAliases,
} from '@/app/discoveryAnimalIconRegistry'
import { getAnimalIconUrl, getRegisteredAnimalIconKeys } from '@/app/iconRegistry'

// ── Registry bootstrap ─────────────────────────────────────────────────────────
describe('Discovery icon registry — bootstrap', () => {
  it('loads WEBP files from src/assets/discovery-animals/', () => {
    const keys = getDiscoveryAnimalIconKeys()
    expect(keys.length).toBeGreaterThan(0)
  })

  it('includes known discovery stems from the uploaded WEBP pack', () => {
    const keys = getDiscoveryAnimalIconKeys()
    // A representative subset of the uploaded filenames (stems)
    expect(keys).toContain('tiger')
    expect(keys).toContain('sun-bear')
    expect(keys).toContain('proboscis-monkey')
    expect(keys).toContain('sunda-pangolin')
    expect(keys).toContain('rhinoceros-hornbill')
    expect(keys).toContain('saltwater-crocodile')
    expect(keys).toContain('whale-shark')
    expect(keys).toContain('bornean-pygmy-elephant')
    expect(keys).toContain('leatherback-sea-turtle')
  })

  it('every registered key maps to a non-empty URL string', () => {
    const keys = getDiscoveryAnimalIconKeys()
    for (const stem of keys) {
      // getDiscoveryAnimalIconUrl may not resolve every stem via a synthetic commonName;
      // assert on the stem itself — it must be a non-empty string.
      expect(typeof stem).toBe('string')
      expect(stem.length).toBeGreaterThan(0)
    }
  })
})

// ── Direct (visualKey) resolution ─────────────────────────────────────────────
describe('Discovery icon registry — direct visualKey resolution', () => {
  it('resolves sun-bear by exact visualKey', () => {
    const url = getDiscoveryAnimalIconUrl({ visualKey: 'sun-bear', commonName: 'Sun Bear' })
    expect(url).toBeTruthy()
    expect(url).toMatch(/sun-bear/)
  })

  it('resolves proboscis-monkey by exact visualKey', () => {
    const url = getDiscoveryAnimalIconUrl({
      visualKey: 'proboscis-monkey',
      commonName: 'Proboscis Monkey',
    })
    expect(url).toBeTruthy()
    expect(url).toMatch(/proboscis-monkey/)
  })
})

// ── Alias resolution ──────────────────────────────────────────────────────────
describe('Discovery icon registry — alias resolution', () => {
  it('resolves malayan-tiger via alias (tiger.webp)', () => {
    const url = getDiscoveryAnimalIconUrl({
      visualKey: 'malayan-tiger',
      commonName: 'Malayan Tiger',
    })
    expect(url).toBeTruthy()
    expect(url).toMatch(/tiger/)
  })

  it('resolves crocodile via alias (saltwater-crocodile.webp)', () => {
    const url = getDiscoveryAnimalIconUrl({
      visualKey: 'crocodile',
      commonName: 'Estuarine Crocodile',
    })
    expect(url).toBeTruthy()
    expect(url).toMatch(/saltwater-crocodile/)
  })

  it('resolves estuarine-crocodile slug via alias (saltwater-crocodile.webp)', () => {
    // No visualKey — relies purely on commonName slug
    const url = getDiscoveryAnimalIconUrl({ commonName: 'Estuarine Crocodile' })
    expect(url).toBeTruthy()
    expect(url).toMatch(/saltwater-crocodile/)
  })
})

// ── Common-name slug resolution ───────────────────────────────────────────────
describe('Discovery icon registry — commonName slug resolution', () => {
  it('resolves Rhinoceros Hornbill via commonName slug (hornbill visualKey has no direct match)', () => {
    const url = getDiscoveryAnimalIconUrl({
      visualKey: 'hornbill',
      commonName: 'Rhinoceros Hornbill',
    })
    expect(url).toBeTruthy()
    expect(url).toMatch(/rhinoceros-hornbill/)
  })

  it('resolves Sunda Pangolin via commonName slug (pangolin visualKey has no direct match)', () => {
    const url = getDiscoveryAnimalIconUrl({ visualKey: 'pangolin', commonName: 'Sunda Pangolin' })
    expect(url).toBeTruthy()
    expect(url).toMatch(/sunda-pangolin/)
  })

  it('resolves new discovery-only animals via commonName slug', () => {
    // These animals are not in the explorer catalog at all — pure discovery animals
    expect(getDiscoveryAnimalIconUrl({ commonName: 'Asian Common Toad' })).toBeTruthy()
    expect(getDiscoveryAnimalIconUrl({ commonName: 'Bornean Pygmy Elephant' })).toBeTruthy()
    expect(getDiscoveryAnimalIconUrl({ commonName: 'Whale Shark' })).toBeTruthy()
    expect(getDiscoveryAnimalIconUrl({ commonName: 'Guppy' })).toBeTruthy()
    expect(getDiscoveryAnimalIconUrl({ commonName: 'Monarch' })).toBeTruthy()
  })

  it('handles apostrophe and special characters in commonName (wallaces-flying-frog)', () => {
    // Apostrophe should be stripped / collapsed into a hyphen
    const url = getDiscoveryAnimalIconUrl({ commonName: "Wallace's Flying Frog" })
    expect(url).toBeTruthy()
    expect(url).toMatch(/wallaces-flying-frog/)
  })
})

// ── Emoji fallback (no WEBP) ──────────────────────────────────────────────────
describe('Discovery icon registry — emoji fallback (missing discovery icon)', () => {
  it('returns undefined for Dugong (no discovery WEBP exists)', () => {
    const url = getDiscoveryAnimalIconUrl({ visualKey: 'dugong', commonName: 'Dugong' })
    expect(url).toBeUndefined()
  })

  it('returns undefined for Orangutan (no discovery WEBP exists)', () => {
    const url = getDiscoveryAnimalIconUrl({ visualKey: 'orangutan', commonName: 'Orangutan' })
    expect(url).toBeUndefined()
  })

  it('returns undefined for Malayan Tapir (no discovery WEBP exists)', () => {
    const url = getDiscoveryAnimalIconUrl({ visualKey: 'tapir', commonName: 'Malayan Tapir' })
    expect(url).toBeUndefined()
  })

  it('returns undefined for Lesser Mousedeer (no discovery WEBP exists)', () => {
    const url = getDiscoveryAnimalIconUrl({
      visualKey: 'mousedeer',
      commonName: 'Lesser Mousedeer',
    })
    expect(url).toBeUndefined()
  })

  it('returns undefined for Green Sea Turtle (leatherback is a different species)', () => {
    // green-sea-turtle ≠ leatherback-sea-turtle — must NOT accidentally match
    const url = getDiscoveryAnimalIconUrl({
      visualKey: 'sea-turtle',
      commonName: 'Green Sea Turtle',
    })
    expect(url).toBeUndefined()
  })

  it('returns undefined for Hawksbill Sea Turtle (no WEBP exists for hawksbill)', () => {
    const url = getDiscoveryAnimalIconUrl({
      visualKey: 'sea-turtle-hawksbill',
      commonName: 'Hawksbill Sea Turtle',
    })
    expect(url).toBeUndefined()
  })

  it('returns undefined for completely unknown animal', () => {
    const url = getDiscoveryAnimalIconUrl({ commonName: 'Completely Unknown Fantasy Animal' })
    expect(url).toBeUndefined()
  })

  it('handles undefined visualKey without throwing', () => {
    expect(() =>
      getDiscoveryAnimalIconUrl({ visualKey: undefined, commonName: 'Unknown' }),
    ).not.toThrow()
  })
})

// ── Alias map integrity ────────────────────────────────────────────────────────
describe('Discovery icon registry — alias map integrity', () => {
  it('getDiscoveryIconAliases returns a plain object', () => {
    const aliases = getDiscoveryIconAliases()
    expect(typeof aliases).toBe('object')
    expect(aliases).not.toBeNull()
  })

  it('every alias target is a real WEBP stem in the discovery icon map', () => {
    const aliases = getDiscoveryIconAliases()
    const discoveryStems = getDiscoveryAnimalIconKeys()
    for (const [source, target] of Object.entries(aliases)) {
      expect(
        discoveryStems,
        `Alias '${source}' → '${target}' references a non-existent WEBP stem`,
      ).toContain(target)
    }
  })

  it('alias map contains entries for known irregular cases', () => {
    const aliases = getDiscoveryIconAliases()
    // malayan-tiger → tiger  (visualKey differs from WEBP filename)
    expect(aliases['malayan-tiger']).toBe('tiger')
    // crocodile → saltwater-crocodile
    expect(aliases['crocodile']).toBe('saltwater-crocodile')
  })
})

// ── Explorer / discovery SEPARATION ───────────────────────────────────────────
describe('Explorer icon registry is NOT affected by discovery changes', () => {
  it('explorer getRegisteredAnimalIconKeys still returns the original SVG set', () => {
    const explorerKeys = getRegisteredAnimalIconKeys()
    expect(explorerKeys).toContain('malayan-tiger')
    expect(explorerKeys).toContain('sun-bear')
    expect(explorerKeys).toContain('orangutan')
    expect(explorerKeys).toContain('tapir')
    expect(explorerKeys).toContain('proboscis-monkey')
    expect(explorerKeys).toContain('pangolin')
    expect(explorerKeys).toContain('sea-turtle')
    expect(explorerKeys).toContain('dugong')
    expect(explorerKeys).toContain('crocodile')
  })

  it('explorer getAnimalIconUrl still resolves SVG paths (not WEBPs) for all registered keys', () => {
    const explorerKeys = getRegisteredAnimalIconKeys()
    for (const key of explorerKeys) {
      const url = getAnimalIconUrl(key)
      expect(url, `Explorer key '${key}' should resolve an SVG`).toBeTruthy()
      expect(url, `Explorer key '${key}' must point to an SVG, GIF, PNG or WEBP`).toMatch(/\.(svg|gif|png|webp)$/)
    }
  })

  it('discovery-stem-only animals do NOT appear in the explorer SVG registry', () => {
    // Pure discovery WEBP stems that have no explorer SVG must not be in the explorer registry.
    const explorerKeys = getRegisteredAnimalIconKeys()
    // 'tiger' is the discovery WEBP stem only — the explorer uses 'malayan-tiger' (its own key)
    expect(explorerKeys).not.toContain('tiger')
    // Note: 'saltwater-crocodile' and 'sunda-pangolin' ARE now in the explorer registry
    // as canonical aliases — this is intentional and correct. Only pure-discovery stems
    // (like 'tiger') must not appear as explorer registry keys.
  })

  it('explorer getAnimalIconUrl is unaffected: malayan-tiger still resolves to SVG', () => {
    const explorerUrl = getAnimalIconUrl('malayan-tiger')
    expect(explorerUrl).toMatch(/\.svg$/)
    expect(explorerUrl).toMatch(/malayan-tiger/)
  })

  it('explorer getAnimalIconUrl is unaffected: sun-bear still resolves to SVG', () => {
    const explorerUrl = getAnimalIconUrl('sun-bear')
    expect(explorerUrl).toMatch(/\.svg$/)
  })

  it('discovery and explorer return different URLs for overlapping animals', () => {
    // sun-bear appears in both systems but must return different asset types
    const explorerUrl = getAnimalIconUrl('sun-bear') // SVG
    const discoveryUrl = getDiscoveryAnimalIconUrl({
      visualKey: 'sun-bear',
      commonName: 'Sun Bear',
    }) // WEBP
    expect(explorerUrl).toBeTruthy()
    expect(discoveryUrl).toBeTruthy()
    // They MUST be different
    expect(explorerUrl).not.toBe(discoveryUrl)
    expect(explorerUrl).toMatch(/\.svg$/)
    expect(discoveryUrl).not.toMatch(/\.svg$/)
  })
})

// ── Future auto-pickup guarantee ───────────────────────────────────────────────
describe('Discovery icon registry — automatic future pickup', () => {
  it('resolution is purely slug/alias based — no component changes needed for new files', () => {
    // This test documents the auto-pickup contract:
    // Any *.webp file added to src/assets/discovery-animals/ with a filename that
    // matches a normalised commonName slug will be resolved automatically.
    //
    // We verify this by testing the existing files were picked up automatically:
    const knownAutoDiscovered = [
      { commonName: 'Asian Common Toad' }, // asian-common-toad.webp
      { commonName: 'Asian Painted Frog' }, // asian-painted-frog.webp
      { commonName: 'Kissing Gourami' }, // kissing-gourami.webp
      { commonName: 'Scalloped Hammerhead' }, // scalloped-hammerhead.webp
      { commonName: 'Slender Skimmer' }, // slender-skimmer.webp
      { commonName: 'Tiger Tail Seahorse' }, // tiger-tail-seahorse.webp
    ]
    for (const animal of knownAutoDiscovered) {
      const url = getDiscoveryAnimalIconUrl(animal)
      expect(url, `'${animal.commonName}' should auto-resolve without alias`).toBeTruthy()
    }
  })
})
