// ============================================================
// Journal Asset Registry — Vitest tests
//
// Verifies that:
// 1. All GAME_JOURNAL_ASSETS paths start with /games/journal-book/
// 2. No path references BIOWIRA_UI_REFERENCES
// 3. Registry-listed WEBP assets exist under public/
// 4. Resolver helpers return correct assets
// 5. getAllJournalAssetUrls() deduplicates correctly
// ============================================================

import { describe, it, expect } from 'vitest'
import { existsSync } from 'fs'
import { join } from 'path'
import {
  GAME_JOURNAL_ASSETS,
  getAllJournalAssetUrls,
  getJournalCategoryCardAsset,
  getEcoComicStampAsset,
  getExplorerRescueJournalAssets,
  getNatureMissionJournalAssets,
} from '@/features/game-journal/data/gameJournalAssetRegistry'

// ── Helpers ───────────────────────────────────────────────────────────────────

function collectPaths(obj: Record<string, unknown>, paths: string[] = []): string[] {
  for (const val of Object.values(obj)) {
    if (typeof val === 'string') {
      paths.push(val)
    } else if (typeof val === 'object' && val !== null) {
      collectPaths(val as Record<string, unknown>, paths)
    }
  }
  return paths
}

const ALL_REGISTRY_PATHS = collectPaths(GAME_JOURNAL_ASSETS as unknown as Record<string, unknown>)

// Resolve a public URL path to absolute FS path for existsSync checks
const PUBLIC_DIR = join(process.cwd(), 'public')
function toFsPath(publicUrl: string): string {
  return join(PUBLIC_DIR, publicUrl)
}

// ── Registry structure tests ──────────────────────────────────────────────────

describe('GAME_JOURNAL_ASSETS registry', () => {
  it('all paths start with /games/journal-book/', () => {
    for (const path of ALL_REGISTRY_PATHS) {
      expect(path, `"${path}" must start with /games/journal-book/`).toMatch(
        /^\/games\/journal-book\//,
      )
    }
  })

  it('no path references BIOWIRA_UI_REFERENCES', () => {
    for (const path of ALL_REGISTRY_PATHS) {
      expect(path, `"${path}" must not contain BIOWIRA_UI_REFERENCES`).not.toContain(
        'BIOWIRA_UI_REFERENCES',
      )
    }
  })

  it('registry contains all 5 shared assets', () => {
    const s = GAME_JOURNAL_ASSETS.shared
    expect(s.bookFrameCompact).toBeTruthy()
    expect(s.bookFrameWide).toBeTruthy()
    expect(s.leftArrow).toBeTruthy()
    expect(s.rightArrow).toBeTruthy()
    expect(s.journalBookSprite).toBeTruthy()
  })

  it('registry contains all 3 menu card assets', () => {
    expect(GAME_JOURNAL_ASSETS.menu.natureMissionCard).toBeTruthy()
    expect(GAME_JOURNAL_ASSETS.menu.ecoComicCard).toBeTruthy()
    expect(GAME_JOURNAL_ASSETS.menu.explorerRescueRunCard).toBeTruthy()
  })

  it('registry contains all 6 eco-comic assets', () => {
    const ec = GAME_JOURNAL_ASSETS.ecoComic
    expect(ec.lockedStamp).toBeTruthy()
    expect(ec.pangolinCard).toBeTruthy()
    expect(ec.descriptionIcon).toBeTruthy()
    expect(ec.stamps.familyTeamHero).toBeTruthy()
    expect(ec.stamps.pangolinGuardian).toBeTruthy()
    expect(ec.stamps.wildlifeSecretAgent).toBeTruthy()
  })

  it('registry contains all 6 explorer rescue assets', () => {
    const er = GAME_JOURNAL_ASSETS.explorerRescueRun
    expect(er.cluePanel).toBeTruthy()
    expect(er.frogCard).toBeTruthy()
    expect(er.frogStamp).toBeTruthy()
    expect(er.sunbearOrangutanCard).toBeTruthy()
    expect(er.sunbearStamp).toBeTruthy()
    expect(er.sunbearStampWithCard).toBeTruthy()
  })

  it('registry contains all 10 nature mission assets', () => {
    const nm = GAME_JOURNAL_ASSETS.natureMission
    expect(nm.orangutanCard).toBeTruthy()
    expect(nm.orangutanDescriptionIcon1).toBeTruthy()
    expect(nm.orangutanDescriptionIcon2).toBeTruthy()
    expect(nm.orangutanStamp).toBeTruthy()
    expect(nm.sunbearCard).toBeTruthy()
    expect(nm.sunbearDescriptionIcon).toBeTruthy()
    expect(nm.sunbearStamp).toBeTruthy()
    expect(nm.tigerCard).toBeTruthy()
    expect(nm.tigerDescriptionIcon).toBeTruthy()
    expect(nm.tigerStamp).toBeTruthy()
  })

  it('total registry has at least 29 distinct WEBP paths', () => {
    const unique = new Set(ALL_REGISTRY_PATHS)
    expect(unique.size).toBeGreaterThanOrEqual(29)
  })
})

// ── File existence tests ──────────────────────────────────────────────────────

describe('GAME_JOURNAL_ASSETS file existence in public/', () => {
  for (const path of ALL_REGISTRY_PATHS) {
    it(`${path} exists in public/`, () => {
      expect(existsSync(toFsPath(path)), `Missing: ${toFsPath(path)}`).toBe(true)
    })
  }
})

// ── getAllJournalAssetUrls ─────────────────────────────────────────────────────

describe('getAllJournalAssetUrls()', () => {
  it('returns an array of strings', () => {
    const urls = getAllJournalAssetUrls()
    expect(Array.isArray(urls)).toBe(true)
    expect(urls.length).toBeGreaterThan(0)
    for (const url of urls) {
      expect(typeof url).toBe('string')
    }
  })

  it('contains no duplicates', () => {
    const urls = getAllJournalAssetUrls()
    expect(new Set(urls).size).toBe(urls.length)
  })

  it('every url starts with /games/journal-book/', () => {
    const urls = getAllJournalAssetUrls()
    for (const url of urls) {
      expect(url).toMatch(/^\/games\/journal-book\//)
    }
  })

  it('covers all registry-listed paths', () => {
    const urls = getAllJournalAssetUrls()
    expect(urls.length).toBeGreaterThanOrEqual(29)
  })
})

// ── Resolver helpers ──────────────────────────────────────────────────────────

describe('getJournalCategoryCardAsset()', () => {
  it('nature-mission returns nature mission card WEBP', () => {
    const url = getJournalCategoryCardAsset('nature-mission')
    expect(url).toContain('journal_menu_nature_mission_card.webp')
    expect(url).toMatch(/^\/games\/journal-book\//)
  })

  it('eco-comic returns eco comic card WEBP', () => {
    const url = getJournalCategoryCardAsset('eco-comic')
    expect(url).toContain('journal_menu_eco_comic_card.webp')
  })

  it('explorer-rescue-run returns explorer rescue card WEBP', () => {
    const url = getJournalCategoryCardAsset('explorer-rescue-run')
    expect(url).toContain('journal_menu_explorer_rescue_run_card.webp')
  })
})

describe('getEcoComicStampAsset()', () => {
  it('family-team-hero unlocked returns stamp1 WEBP', () => {
    const url = getEcoComicStampAsset('family-team-hero', true)
    expect(url).toContain('eco_comic_stamp1.webp')
  })

  it('pangolin-guardian unlocked returns stamp2 WEBP', () => {
    const url = getEcoComicStampAsset('pangolin-guardian', true)
    expect(url).toContain('eco_comic_stamp2.webp')
  })

  it('wildlife-secret-agent unlocked returns stamp3 WEBP', () => {
    const url = getEcoComicStampAsset('wildlife-secret-agent', true)
    expect(url).toContain('eco_comic_stamp3.webp')
  })

  it('locked stamp returns locked stamp WEBP', () => {
    const url = getEcoComicStampAsset('family-team-hero', false)
    expect(url).toContain('eco_comic_locked_stamp.webp')
  })

  it('unknown stamp id unlocked falls back to locked stamp WEBP', () => {
    const url = getEcoComicStampAsset('unknown-stamp', true)
    expect(url).toContain('eco_comic_locked_stamp.webp')
  })
})

describe('getExplorerRescueJournalAssets()', () => {
  it('frog pairing returns frog card and stamp WEBPs', () => {
    const assets = getExplorerRescueJournalAssets('Larut Torrent Frog', 'Asian Common Toad')
    expect(assets.cardAsset).toContain('explorer_rescue_run_frog_card.webp')
    expect(assets.stampAsset).toContain('explorer_rescue_run_frog_stamp.webp')
  })

  it('sun bear + orangutan pairing returns sunbear/orangutan WEBPs', () => {
    const assets = getExplorerRescueJournalAssets('Sun Bear', 'Bornean Orangutan')
    expect(assets.cardAsset).toContain('explorer_rescue_run_sunbear_orangutan_card.webp')
    expect(assets.stampAsset).toContain('explorer_rescue_run_sunbear_stamp.webp')
  })

  it('unknown pairing returns empty strings (CSS fallback)', () => {
    const assets = getExplorerRescueJournalAssets('Malayan Tiger', 'Proboscis Monkey')
    expect(assets.cardAsset).toBe('')
    expect(assets.stampAsset).toBe('')
  })
})

describe('getNatureMissionJournalAssets()', () => {
  it('tiger territory returns tiger assets', () => {
    const assets = getNatureMissionJournalAssets('mission-tiger-territory')
    expect(assets.animalCardAsset).toContain('nature_mission_tiger_card.webp')
    expect(assets.stampAsset).toContain('nature_mission_tiger_stamp.webp')
    expect(assets.descriptionIconAssets).toHaveLength(1)
    expect(assets.descriptionIconAssets[0]).toContain('nature_mission_tiger_description_icon.webp')
  })

  it('sun bear honey returns sunbear assets', () => {
    const assets = getNatureMissionJournalAssets('mission-sun-bear-honey')
    expect(assets.animalCardAsset).toContain('nature_mission_sunbear_card.webp')
    expect(assets.stampAsset).toContain('nature_mission_sunbear_stamp.webp')
    expect(assets.descriptionIconAssets).toHaveLength(1)
    expect(assets.descriptionIconAssets[0]).toContain('nature_mission_sunbear_description_icon.webp')
  })

  it('orangutan tree returns orangutan assets with two description icons', () => {
    const assets = getNatureMissionJournalAssets('mission-orangutan-tree')
    expect(assets.animalCardAsset).toContain('nature_mission_orangutan_card.webp')
    expect(assets.stampAsset).toContain('nature_mission_orangutan_stamp.webp')
    expect(assets.descriptionIconAssets).toHaveLength(2)
  })

  it('unknown stampArtKey returns empty assets (CSS fallback)', () => {
    const assets = getNatureMissionJournalAssets('mission-unknown')
    expect(assets.animalCardAsset).toBe('')
    expect(assets.stampAsset).toBe('')
    expect(assets.descriptionIconAssets).toHaveLength(0)
  })
})
