import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CitedImage from '@/components/ui/CitedImage.vue'

describe('CitedImage', () => {
  it('does not render remote http(s) img when captions are enforced and attribution is missing', () => {
    const w = mount(CitedImage, {
      props: { src: 'https://blocked.example/cat.jpg', alt: 'Cat' },
    })
    expect(w.find('img').exists()).toBe(false)
  })

  it('renders remote img when showCaption is false (decorative)', () => {
    const w = mount(CitedImage, {
      props: { src: 'https://blocked.example/cat.jpg', alt: 'Cat', showCaption: false },
    })
    expect(w.find('img').exists()).toBe(true)
  })

  it('renders remote img when attribution is usable', () => {
    const w = mount(CitedImage, {
      props: {
        src: 'https://ok.example/cat.jpg',
        alt: 'Cat',
        attribution: { creditLine: 'Courtesy Zoo.' },
      },
    })
    expect(w.find('img').exists()).toBe(true)
    expect(w.text()).toContain('Courtesy Zoo.')
  })

  it('shows slot fallback when remote src is blocked and fallback=slot', () => {
    const w = mount(CitedImage, {
      props: {
        src: 'https://blocked.example/cat.jpg',
        alt: 'Cat',
        fallback: 'slot',
      },
      slots: { fallback: '<span class="slot-fb">fallback</span>' },
    })
    expect(w.find('.slot-fb').text()).toBe('fallback')
  })
})
