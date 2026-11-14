import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CitedImage from '@/components/ui/CitedImage.vue'
import ImageAttributionCaption from '@/components/ui/ImageAttributionCaption.vue'
import AnimalProfileSheet from '@/features/discover/components/AnimalProfileSheet.vue'
import { AnimalCategory, ConservationStatus, HabitatZone } from '@/domain/enums'
import type { Animal } from '@/domain/animal'
import {
  isSafeHttpUrl,
  normalizeLocalAssetUrl,
  resolveAnimalPhoto,
  resolveWildlifeAllAssetUrl,
} from '@/domain/mediaUrl'

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const sampleAttribution = {
  title: 'Panthera tigris sumatran subspecies',
  author: 'Monika Betley',
  authorUrl: 'https://commons.wikimedia.org/wiki/User:Monika_Betley',
  sourceName: 'Wikimedia Commons',
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:Panthera_tigris.jpg',
  licenseName: 'CC BY-SA 3.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
}

describe('mediaUrl helpers', () => {
  it('normalizes legacy and worker hosts only for BioWira asset paths while preserving external URLs', () => {
    expect(normalizeLocalAssetUrl('all_assets/wildlife-0.webp')).toBe('/all_assets/wildlife-0.webp')
    expect(normalizeLocalAssetUrl('https://biowira.dpdns.org/all_assets/wildlife-3.webp')).toBe(
      '/all_assets/wildlife-3.webp',
    )
    expect(normalizeLocalAssetUrl('https://api.biowira.dpdns.org/all_assets/wildlife-5.webp?v=2')).toBe(
      '/all_assets/wildlife-5.webp?v=2',
    )
    expect(normalizeLocalAssetUrl('https://biowira-api.smah0085.workers.dev/all_assets/wildlife-9.webp')).toBe(
      '/all_assets/wildlife-9.webp',
    )
    expect(normalizeLocalAssetUrl('https://d111111abcdef8.cloudfront.net/p.jpg')).toBe(
      'https://d111111abcdef8.cloudfront.net/p.jpg',
    )
  })

  it('resolves all_assets paths from species name, visualKey, or numeric id', () => {
    expect(resolveWildlifeAllAssetUrl({ commonName: 'Larut Torrent Frog' })).toBe(
      '/all_assets/wildlife-3.webp',
    )
    expect(resolveWildlifeAllAssetUrl({ id: '15' })).toBe('/all_assets/wildlife-13.webp')
    expect(resolveWildlifeAllAssetUrl({ commonName: 'Unknown Cryptid' })).toBeUndefined()
  })

  it('advances cleanly from failed primary URL to /all_assets/wildlife-*.webp and returns none once exhausted', () => {
    const failed = new Set<string>(['https://broken.example/tiger.jpg'])
    const step1 = resolveAnimalPhoto(
      {
        id: '1',
        commonName: 'Malayan Tiger',
        animalPhotoUrl: 'https://broken.example/tiger.jpg',
        avatarPath: '/avatars/malayan-tiger.png',
        imageAttribution: sampleAttribution,
      },
      failed,
    )
    expect(step1.kind).toBe('all_assets')
    expect(step1.src).toBe('/all_assets/wildlife-0.webp')
    expect(step1.attribution).toEqual(sampleAttribution)

    failed.add('/all_assets/wildlife-0.webp')
    failed.add('/avatars/malayan-tiger.png')
    const exhausted = resolveAnimalPhoto(
      {
        id: '1',
        commonName: 'Malayan Tiger',
        animalPhotoUrl: 'https://broken.example/tiger.jpg',
        avatarPath: '/avatars/malayan-tiger.png',
        imageAttribution: sampleAttribution,
      },
      failed,
    )
    expect(exhausted).toEqual({ src: null, kind: 'none' })
  })

  it('validates outbound http(s) URLs only', () => {
    expect(isSafeHttpUrl('https://creativecommons.org/licenses/by-sa/4.0/')).toBe(true)
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeHttpUrl('/relative/path')).toBe(false)
  })
})

describe('CitedImage and ImageAttributionCaption', () => {
  it('renders clean single-spaced caption copy and strips unsafe URLs', () => {
    const wrapper = mount(ImageAttributionCaption, {
      props: {
        attribution: {
          ...sampleAttribution,
          authorUrl: 'javascript:alert(1)',
        },
      },
    })
    expect(wrapper.text()).toBe(
      '"Panthera tigris sumatran subspecies" by Monika Betley, Wikimedia Commons, licensed under CC BY-SA 3.0.',
    )
    expect(wrapper.findAll('a')).toHaveLength(2)
  })

  it('hides broken <img> and bottom caption on error, then shows fallback slot', async () => {
    const wrapper = mount(CitedImage, {
      props: {
        src: '/all_assets/missing.webp',
        alt: 'Missing photo',
        attribution: sampleAttribution,
        fallback: 'slot',
      },
      slots: {
        fallback: '<span class="slot-spirit">Spirit fallback</span>',
      },
    })
    expect(wrapper.find('img').exists()).toBe(true)
    expect(wrapper.find('figcaption').exists()).toBe(true)

    await wrapper.find('img').trigger('error')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('figcaption').exists()).toBe(false)
    expect(wrapper.find('.slot-spirit').exists()).toBe(true)

    await wrapper.setProps({ src: '/all_assets/wildlife-0.webp' })
    expect(wrapper.find('img').exists()).toBe(true)
    expect(wrapper.find('figcaption').exists()).toBe(true)
  })

  it('switches AnimalProfileSheet from failed photo candidates to /all_assets then spirit hero with no leaked caption', async () => {
    setActivePinia(createPinia())
    const animal: Animal = {
      id: 'unknown-animal-999',
      visualKey: 'sun-bear',
      commonName: 'Mystery Sun Bear',
      scientificName: 'Helarctos malayanus',
      category: AnimalCategory.Mammals,
      habitat: HabitatZone.Rainforest,
      diet: 'Omnivore',
      lifespan: '25 yrs',
      conservationStatus: ConservationStatus.Vulnerable,
      conservationReason: 'Loss of forest',
      conservationExplanation: 'Needs intact forest.',
      description: 'Sun bear description.',
      funFact: 'Long tongue.',
      iconEmoji: '🐻',
      mapPosition: { desktop: { x: 50, y: 50 } },
      occurrences: [],
      animalPhotoUrl: 'https://broken.example/sun-bear.jpg',
      avatarPath: '/avatars/missing-bear.png',
      imageAttribution: sampleAttribution,
    }

    const wrapper = mount(AnimalProfileSheet, {
      props: { animal },
    })

    expect(wrapper.find('[data-testid="animal-profile-wildlife"] img').attributes('src')).toBe(
      'https://broken.example/sun-bear.jpg',
    )

    await wrapper.find('[data-testid="animal-profile-wildlife"] img').trigger('error')
    expect(wrapper.find('[data-testid="animal-profile-wildlife"] img').attributes('src')).toBe(
      '/all_assets/wildlife-1.webp',
    )
    expect(wrapper.find('figcaption').exists()).toBe(true)

    await wrapper.find('[data-testid="animal-profile-wildlife"] img').trigger('error')
    expect(wrapper.find('[data-testid="animal-profile-wildlife"] img').attributes('src')).toBe(
      '/avatars/missing-bear.png',
    )

    await wrapper.find('[data-testid="animal-profile-wildlife"] img').trigger('error')
    expect(wrapper.find('[data-testid="animal-profile-wildlife"]').exists()).toBe(false)
    expect(wrapper.find('.profile__spirit-hero').exists()).toBe(true)
    expect(wrapper.find('figcaption').exists()).toBe(false)
  })
})
