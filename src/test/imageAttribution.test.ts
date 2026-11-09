import { describe, it, expect } from 'vitest'
import {
  normaliseImageAttribution,
  finalizeImageAttribution,
  buildFallbackImageAttributionFromUrl,
  hasUsableAttribution,
} from '@/domain/imageAttribution'

describe('buildFallbackImageAttributionFromUrl', () => {
  it('uses explicit sourceLabel for non-remote paths when no hostname is available', () => {
    const a = buildFallbackImageAttributionFromUrl(
      '/media/relative.webp',
      'BioWira image asset',
    )
    expect(a?.sourceName).toBe('BioWira image asset')
    expect(a?.isFallback).toBe(true)
  })

  it('labels CloudFront CDN as BioWira image asset without inventing author/license', () => {
    const a = buildFallbackImageAttributionFromUrl('https://d111111abcdef8.cloudfront.net/z.png')
    expect(a?.sourceName).toBe('BioWira image asset')
    expect(a?.author).toBeUndefined()
    expect(a?.licenseName).toBeUndefined()
  })

  it('labels Wikimedia uploads as Wikimedia Commons', () => {
    const a = buildFallbackImageAttributionFromUrl(
      'https://upload.wikimedia.org/wikipedia/commons/1/14/Example.jpg',
    )
    expect(a?.sourceName).toBe('Wikimedia Commons')
  })

  it('uses hostname for unknown external URLs', () => {
    const a = buildFallbackImageAttributionFromUrl('https://photos.example.org/cat.jpg')
    expect(a?.sourceName).toBe('photos.example.org')
    expect(a?.creditLine).toBe('Image source: photos.example.org')
  })
})

describe('normaliseImageAttribution', () => {
  it('parses flat backend fields', () => {
    const a = normaliseImageAttribution({
      imageAuthor: 'Alex',
      imageLicense: 'CC BY 4.0',
      imageLicenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      imageSourceUrl: 'https://commons.wikimedia.org/foo',
    })
    expect(a?.author).toBe('Alex')
    expect(a?.licenseName).toBe('CC BY 4.0')
    expect(a?.licenseUrl).toBe('https://creativecommons.org/licenses/by/4.0/')
    expect(a?.sourceUrl).toBe('https://commons.wikimedia.org/foo')
  })

  it('merges nested image.attribution', () => {
    const a = normaliseImageAttribution({
      image: {
        attribution: {
          author: 'River',
          licenseName: 'CC BY-SA 4.0',
        },
      },
    })
    expect(a?.author).toBe('River')
    expect(a?.licenseName).toBe('CC BY-SA 4.0')
  })

  it('returns undefined for empty input', () => {
    expect(normaliseImageAttribution(undefined)).toBeUndefined()
    expect(normaliseImageAttribution(null)).toBeUndefined()
  })
})

describe('finalizeImageAttribution', () => {
  it('keeps explicit attribution when URL-only backend omits author', () => {
    const a = finalizeImageAttribution(undefined, 'https://d111111abcdef8.cloudfront.net/x.jpg', 'BioWira image asset')
    expect(hasUsableAttribution(a)).toBe(true)
    expect(a?.author).toBeUndefined()
    expect(a?.licenseName).toBeUndefined()
    expect(a?.isFallback).toBe(true)
    expect(a?.sourceName).toBe('BioWira image asset')
  })

  it('does not replace explicit attribution with URL fallback', () => {
    const explicit = { author: 'Custodian', licenseName: 'MIT' }
    const a = finalizeImageAttribution(explicit, 'https://d111111abcdef8.cloudfront.net/x.jpg', 'BioWira image asset')
    expect(a?.author).toBe('Custodian')
    expect(a?.licenseName).toBe('MIT')
    expect(a?.isFallback).toBeUndefined()
  })
})
