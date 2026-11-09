import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ImageAttributionCaption from '@/components/ui/ImageAttributionCaption.vue'

describe('ImageAttributionCaption', () => {
  it('renders nothing when attribution is undefined', () => {
    const w = mount(ImageAttributionCaption)
    expect(w.find('figure').exists()).toBe(false)
  })

  it('renders "Image by Author, licensed under …" with links when URLs exist', () => {
    const w = mount(ImageAttributionCaption, {
      props: {
        attribution: {
          author: 'PhotoMaster99',
          authorUrl: 'https://author.example',
          licenseName: 'CC BY-SA 4.0',
          licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        },
      },
    })
    const text = w.find('figcaption').text()
    expect(text).toContain('Image by')
    expect(text).toContain('PhotoMaster99')
    expect(text).toContain('licensed under')
    expect(text).toContain('CC BY-SA 4.0')
    expect(w.find('a[href="https://author.example"]').exists()).toBe(true)
    expect(w.find('a[href="https://creativecommons.org/licenses/by-sa/4.0/"]').exists()).toBe(true)
    const ext = w.findAll('a')
    for (const el of ext) {
      expect(el.attributes('rel')).toBe('noopener noreferrer')
      expect(el.attributes('target')).toBe('_blank')
    }
  })

  it('falls back to Image source when only sourceName/sourceUrl exist', () => {
    const w = mount(ImageAttributionCaption, {
      props: {
        attribution: {
          sourceName: 'Wildlife Agency',
          sourceUrl: 'https://wildlife.example/',
        },
      },
    })
    expect(w.text()).toContain('Image source:')
    expect(w.find('a[href="https://wildlife.example/"]').text()).toContain('Wildlife Agency')
  })

  it('prefers creditLine verbatim when set', () => {
    const w = mount(ImageAttributionCaption, {
      props: {
        attribution: { creditLine: 'Courtesy of National Park Service.' },
      },
    })
    expect(w.text()).toContain('Courtesy of National Park Service.')
  })
})
