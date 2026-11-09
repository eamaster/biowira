import { describe, it, expect } from 'vitest'
import {
  buildCreateProfileRequestBody,
  mapWireProfileToChildProfile,
  parseSessionTokenFromResponse,
} from '@/domain/profileApi.dto'
import { generatePin } from '@/utils/security'

describe('profileApi.dto', () => {
  it('generatePin returns exactly 4 digits', () => {
    for (let i = 0; i < 30; i++) {
      expect(generatePin()).toMatch(/^\d{4}$/)
    }
  })

  it('buildCreateProfileRequestBody does NOT include animalId (removed from API contract)', () => {
    const body = buildCreateProfileRequestBody({
      displayName: 'Brave Panda',
      pin: '0402',
      deviceInfo: 'Chrome on Windows',
    })
    expect(Object.keys(body).sort()).toEqual(
      ['deviceInfo', 'displayName', 'pin'].sort(),
    )
    expect(body.displayName).toBe('Brave Panda')
    expect(body.pin).toBe('0402')
    expect(body.deviceInfo).toBe('Chrome on Windows')
    // animalId must NOT be in the request body
    expect('animalId' in body).toBe(false)
  })

  it('parseSessionTokenFromResponse reads camelCase and snake_case', () => {
    expect(parseSessionTokenFromResponse({ sessionToken: 'a' })).toBe('a')
    expect(parseSessionTokenFromResponse({ session_token: 'b' })).toBe('b')
  })

  it('mapWireProfileToChildProfile maps flat camelCase create payload (no animalId from server)', () => {
    // POST /profiles response no longer includes animalId — fallback is used
    const profile = mapWireProfileToChildProfile(
      {
        profileId: 'p1',
        displayName: 'Happy Fern',
        leafPoints: 0,
        level: 1,
        levelTitle: 'Nature Newbie',
        createdAt: '2025-01-01T00:00:00.000Z',
        lastActiveAt: '2025-01-01T00:00:00.000Z',
        guardianBackupLinked: false,
      },
      { animalVisualKey: 'sun-bear', animalIdHint: 'sun-bear' },
    )
    expect(profile.profileId).toBe('p1')
    expect(profile.displayNickname).toBe('Happy Fern')
    // animalVisualKey comes from fallback (not server response)
    expect(profile.animalVisualKey).toBe('sun-bear')
    // animalId falls back to the hint since server no longer sends it
    expect(profile.animalId).toBeTruthy()
  })

  // ── GET /profiles response shape (totalPoints + currentLevel) ──────────────
  // The backend uses `totalPoints` (not `leafPoints`) and `currentLevel` (not `level`).
  // These must map correctly so leafPoints/level survive a hard refresh.

  it('mapWireProfileToChildProfile reads totalPoints → leafPoints from GET /profiles shape', () => {
    const profile = mapWireProfileToChildProfile(
      {
        profileId: 'p2',
        displayName: 'Bold Tiger',
        profileCode: 'TIGER123',
        currentLevel: 3,
        totalPoints: 450,
        totalQuizzes: 4,
        totalMissions: 2,
        streakDays: 3,
      },
      { animalVisualKey: 'malayan-tiger', animalIdHint: 'malayan-tiger' },
    )
    expect(profile.profileId).toBe('p2')
    expect(profile.leafPoints).toBe(450)
    expect(profile.level).toBe(3)
    expect(profile.totalQuizzes).toBe(4)
    expect(profile.totalMissions).toBe(2)
    expect(profile.streakDays).toBe(3)
  })

  it('mapWireProfileToChildProfile prefers leafPoints over totalPoints when both present', () => {
    const profile = mapWireProfileToChildProfile(
      {
        profileId: 'p3',
        displayName: 'Swift Hawk',
        leafPoints: 200,
        totalPoints: 999,
        level: 2,
        currentLevel: 5,
      },
      { animalVisualKey: 'hornbill', animalIdHint: 'hornbill' },
    )
    // leafPoints takes priority over totalPoints
    expect(profile.leafPoints).toBe(200)
    // level takes priority over currentLevel
    expect(profile.level).toBe(2)
  })

  it('mapWireProfileToChildProfile falls back to level from totalPoints when neither level field present', () => {
    const profile = mapWireProfileToChildProfile(
      {
        profileId: 'p4',
        displayName: 'Calm River',
        totalPoints: 250,
        // no level or currentLevel
      },
      { animalVisualKey: 'tapir', animalIdHint: 'tapir' },
    )
    expect(profile.leafPoints).toBe(250)
    // Level must be computed from 250 pts → level 2
    expect(profile.level).toBe(2)
  })

  it('mapWireProfileToChildProfile passes through animalVisualKey from fallback when server omits it', () => {
    const profile = mapWireProfileToChildProfile(
      {
        profileId: 'p5',
        displayName: 'Noble Pangolin',
        totalPoints: 100,
        currentLevel: 1,
        // no animalVisualKey in GET /profiles response
      },
      { animalVisualKey: 'pangolin', animalIdHint: 'pangolin' },
    )
    expect(profile.animalVisualKey).toBe('pangolin')
  })

  it('mapWireProfileToChildProfile: restore response without animalId still resolves visual key', () => {
    // POST /profiles/restore response no longer includes animalId
    const profile = mapWireProfileToChildProfile(
      {
        profileId: 'p6',
        displayName: 'Restored Explorer',
        totalPoints: 150,
        currentLevel: 2,
        sessionToken: 'tok123',
        // no animalId, no animalVisualKey
      },
      { animalVisualKey: 'hornbill', animalIdHint: '' },
    )
    expect(profile.profileId).toBe('p6')
    // Visual key comes from fallback
    expect(profile.animalVisualKey).toBe('hornbill')
  })

  it('mapWireProfileToChildProfile: auto-login response without animalId resolves correctly', () => {
    // GET /profiles/auto-login response no longer includes animalId
    const profile = mapWireProfileToChildProfile(
      {
        profileId: 'p7',
        displayName: 'Auto Tiger',
        currentLevel: 1,
        totalPoints: 50,
        // no animalId
      },
      { animalVisualKey: 'malayan-tiger', animalIdHint: 'malayan-tiger' },
    )
    expect(profile.animalVisualKey).toBe('malayan-tiger')
    // animalId resolves from hint
    expect(profile.animalId).toBeTruthy()
  })
})
