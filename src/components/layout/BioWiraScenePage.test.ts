import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import BioWiraScenePage from './BioWiraScenePage.vue'
import { BIOWIRA_SCENE_ASSETS } from '@/app/branding'

function withPinia() {
  return { plugins: [createPinia()] }
}

describe('BioWiraScenePage', () => {
  it('renders title through HomeWoodRibbon', () => {
    const wrapper = mount(BioWiraScenePage, {
      props: { title: 'Games Menu' },
      global: {
        ...withPinia(),
        stubs: {
          HomeWoodRibbon: { props: ['title'], template: '<div class="ribbon-stub">{{ title }}</div>' },
        },
      },
    })
    expect(wrapper.find('.ribbon-stub').text()).toBe('Games Menu')
  })

  it('renders subtitle when provided', () => {
    const wrapper = mount(BioWiraScenePage, {
      props: { title: 'T', subtitle: 'Hello from the rainforest.' },
      global: {
        ...withPinia(),
        stubs: { HomeWoodRibbon: true },
      },
    })
    expect(wrapper.find('.scene-page__subtitle').text()).toContain('Hello from the rainforest.')
  })

  it('renders slot content', () => {
    const wrapper = mount(BioWiraScenePage, {
      props: { title: 'T' },
      slots: { default: '<p class="slot-inner">child</p>' },
      global: {
        ...withPinia(),
        stubs: { HomeWoodRibbon: true },
      },
    })
    expect(wrapper.find('.slot-inner').text()).toBe('child')
  })

  it('applies scene background CSS variable from BIOWIRA_SCENE_ASSETS', () => {
    const wrapper = mount(BioWiraScenePage, {
      props: { title: 'T' },
      global: {
        ...withPinia(),
        stubs: { HomeWoodRibbon: true },
      },
    })
    const el = wrapper.find('.scene-page').element as HTMLElement
    expect(el.style.getPropertyValue('--scene-bg')).toBe(`url(${BIOWIRA_SCENE_ASSETS.rainforestBackground})`)
  })

  it('shows rainforest corner décor images when showDecor is true', () => {
    const arrowSeg = BIOWIRA_SCENE_ASSETS.arrowBoard.split('/').pop()
    const flowerSeg = BIOWIRA_SCENE_ASSETS.flowerPlant.split('/').pop()
    const wrapper = mount(BioWiraScenePage, {
      props: { title: 'T', showDecor: true },
      global: {
        ...withPinia(),
        stubs: { HomeWoodRibbon: true },
      },
    })
    const imgs = wrapper.findAll('img.scene-page__decor')
    expect(imgs).toHaveLength(2)
    expect(imgs[0].attributes('src')).toContain(arrowSeg ?? '')
    expect(imgs[1].attributes('src')).toContain(flowerSeg ?? '')
  })

  it('applies density class from density prop', () => {
    const compact = mount(BioWiraScenePage, {
      props: { title: 'x', density: 'compact', showDecor: false },
      global: { ...withPinia(), stubs: { HomeWoodRibbon: true } },
    })
    expect(compact.classes()).toContain('scene-page--density-compact')
  })

  it('hides decor when showDecor is false', () => {
    const wrapper = mount(BioWiraScenePage, {
      props: { title: 'T', showDecor: false },
      global: {
        ...withPinia(),
        stubs: { HomeWoodRibbon: true },
      },
    })
    expect(wrapper.find('.scene-page__decor-layer').exists()).toBe(false)
  })

  it('hides header ribbon and subtitle stack when hideHeader is true', () => {
    const wrapper = mount(BioWiraScenePage, {
      props: { title: 'Story', showDecor: false, hideHeader: true },
      slots: { default: '<p class="slot-inner">body</p>', subtitle: '<span class="sub">x</span>' },
      global: { ...withPinia(), stubs: { HomeWoodRibbon: true } },
    })
    expect(wrapper.classes()).toContain('scene-page--immersive')
    expect(wrapper.find('.scene-page__header').exists()).toBe(false)
    expect(wrapper.find('.scene-page__content .sr-only').text()).toBe('Story')
    expect(wrapper.find('.slot-inner').text()).toBe('body')
  })
})
