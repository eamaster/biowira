import { describe, it, expect } from 'vitest'
import { ApiError } from '@/services/apiClient'
import { messageForExplorerCreateFailure } from '@/utils/apiErrors'

describe('messageForExplorerCreateFailure', () => {
  it('returns friendly copy for ApiError instead of raw JSON', () => {
    const msg = messageForExplorerCreateFailure(
      new ApiError(
        400,
        '{"errorCode":"INVALID_REQUEST","details":{"message":"bad"}}',
        '{"errorCode":"INVALID_REQUEST"}',
        'INVALID_REQUEST',
        {},
      ),
    )
    expect(msg).not.toContain('errorCode')
    expect(msg).not.toContain('INVALID_REQUEST')
    expect(msg.length).toBeGreaterThan(10)
  })

  it('returns friendly copy for ApiError 500', () => {
    expect(messageForExplorerCreateFailure(new ApiError(500, 'err'))).toContain('server')
  })
})
