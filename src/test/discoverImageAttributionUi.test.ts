import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import AnimalListCard from '@/features/discover/components/AnimalListCard.vue'
import AnimalProfileSheet from '@/features/discover/components/AnimalProfileSheet.vue'
import FunFactCard from '@/features/fun-facts/components/FunFactCard.vue'
import FunFactModal from '@/features/fun-facts/components/FunFactModal.vue'
import type { AnimalListItem } from '@/domain/animal'
import type { Animal } from '@/domain/animal'
import { AnimalCategory, ConservationStatus, HabitatZone } from '@/domain/enums'
import type { FunFact } from '@/domain/funFact'

function mountProfileRouter() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', name: 'home', component: { template: '<div />' } }],
  })
  return { pinia, router }
}

describe('Discover list/detail image behavior', () => {
  it('AnimalListCard uses DiscoverAnimalIcon spirit branch, not remote wildlife hero URL', () => {
    const tiger: AnimalListItem = {
      listKey: 'malayan-tiger',
      backendId: 'malayan-tiger',
      commonName: 'Malayan Tiger',
      scientificName: 'Panthera tigris jacksoni',
      category: AnimalCategory.Mammals,
      conservationStatus: ConservationStatus.Endangered,
      imageUrl: 'https://d111111abcdef8.cloudfront.net/media/wildlife-0.webp',
      iconEmoji: '🐯',
      visualKey: 'malayan-tiger',
    }
    const w = mount(AnimalListCard, { props: { animal: tiger } })
    expect(w.find('.discover-animal-icon').exists()).toBe(true)
    expect(w.html()).not.toContain('wildlife-0')
  })

  it('AnimalProfileSheet shows cited wildlife image, caption, common name, spirit badge', () => {
    const { pinia, router } = mountProfileRouter()
    const animal: Animal = {
      id: 'malayan-tiger',
      commonName: 'Malayan Tiger',
      scientificName: 'Panthera tigris jacksoni',
      category: AnimalCategory.Mammals,
      habitat: HabitatZone.Rainforest,
      diet: 'Carnivore',
      lifespan: '15–20 yrs',
      conservationStatus: ConservationStatus.Endangered,
      conservationExplanation: 'Test',
      description: 'Desc',
      funFact: 'Fact',
      iconEmoji: '🐯',
      animalPhotoUrl: 'https://d111111abcdef8.cloudfront.net/media/wildlife-0.webp',
      imageUrl: 'https://d111111abcdef8.cloudfront.net/media/wildlife-0.webp',
      imageAttribution: {
        author: 'PhotoMaster99',
        licenseName: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      },
      visualKey: 'malayan-tiger',
      mapPosition: { desktop: { x: 50, y: 50 } },
      occurrences: [],
    }
    const wrapper = mount(AnimalProfileSheet, {
      props: { animal },
      global: {
        plugins: [pinia, router],
        stubs: {
          PixelButton: true,
          PixelStatusBadge: true,
          NarrationPlayer: true,
          AnimalIcon: true,
          ReadAlongText: true,
          AnimalFunFactsPanel: true,
          DiscoverStatIcon: true,
        },
      },
    })
    expect(wrapper.find('[data-testid="animal-profile-wildlife"]').exists()).toBe(true)
    expect(wrapper.find('img[alt="Photo of Malayan Tiger"]').attributes('src')).toContain('wildlife-0')
    expect(wrapper.text()).toContain('PhotoMaster99')
    expect(wrapper.text()).toContain('CC BY-SA 4.0')
    expect(wrapper.text()).toContain('Malayan Tiger')
    expect(wrapper.text()).toContain('Panthera tigris jacksoni')
    expect(wrapper.findAll('.profile__spirit-badge .discover-animal-icon')).toHaveLength(1)
  })
})

describe('Fun facts cited images', () => {
  const unlockedFact: FunFact = {
    id: 'ff1',
    animalId: 'malayan-tiger',
    animalName: 'Malayan Tiger',
    animalEmoji: '🐯',
    animalVisualKey: 'malayan-tiger',
    factText: 'Tiger fact body text here.',
    unlockLevel: 1,
    imageUrl: 'https://photos.example.org/fact.jpg',
    imageAttribution: {
      creditLine: 'Courtesy of Wildlife Bureau.',
    },
    accessStatus: 'unlocked',
  }

  it('FunFactCard shows compact caption on back face for real image', async () => {
    const w = mount(FunFactCard, { props: { fact: unlockedFact } })
    await w.trigger('click')
    expect(w.find('.back-cited').exists()).toBe(true)
    expect(w.find('.image-attribution-caption--compact').exists()).toBe(true)
    expect(w.text()).toContain('Courtesy of Wildlife Bureau.')
  })

  it('FunFactModal shows cited image and caption when opened', () => {
    const w = mount(FunFactModal, {
      props: { modelValue: true, fact: unlockedFact },
      global: {
        stubs: {
          Teleport: { template: '<div><slot /></div>' },
          Transition: { template: '<div><slot /></div>' },
        },
      },
    })
    expect(w.find('.fact-sheet__cited').exists()).toBe(true)
    expect(w.text()).toContain('Courtesy of Wildlife Bureau.')
  })
})
