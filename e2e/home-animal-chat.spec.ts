import { test, expect } from '@playwright/test'

test.describe('Home Page - Animal Chat', () => {
  test.beforeEach(async ({ page }) => {
    // Seed profile and session data
    await page.addInitScript(() => {
      localStorage.setItem('bw_profiles', JSON.stringify({
        profiles: [{
          profileId: 'test-profile-1',
          displayNickname: 'Brave Panda',
          animalId: 'malayan-tiger',
          animalVisualKey: 'malayan-tiger'
        }]
      }))
      localStorage.setItem('bw_active_session', JSON.stringify({
        profileId: 'test-profile-1',
        isActive: true,
        startedAt: Date.now()
      }))
    })

    await page.route('**/api/Chat/ask**', async (route) => {
      const body = route.request().postDataJSON()
      
      // Verify strict payload requirements for privacy and prompt injection defense
      if (body) {
        expect(Object.keys(body).sort()).toEqual(['animalType', 'userMessage'])
        expect(body.animalType).toBe('tiger')
        expect(body.userMessage).not.toContain('[SYSTEM INSTRUCTION') // Ensure hidden instructions were removed
      }

      if (body && body.userMessage === 'hi') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            sessionId: 'mock-session-123',
            animalType: 'tiger',
            reply: 'Grrr-rowl! Hello there, brave explorer!'
          })
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            sessionId: 'mock-session-123',
            animalType: 'tiger',
            reply: 'I hear you!'
          })
        })
      }
    })
  })

  test('can interact with the talking mascot', async ({ page }) => {
    await page.goto('/')

    // Wait for the hydration and the hero text panel to be visible
    const textPanel = page.locator('.animal-chat-guide__text-panel')
    await expect(textPanel).toBeVisible()

    // It should be in interactive (collapsed) state by default
    await expect(textPanel).toHaveClass(/animal-chat-guide__text-panel--interactive/)
    
    // Tap to chat prompt should be visible
    const tapPrompt = page.locator('.animal-chat-guide__tap-prompt')
    await expect(tapPrompt).toBeVisible()
    await expect(tapPrompt).toContainText('Tap to chat')

    // Click the text panel to open chat
    await textPanel.click()

    // It should transition to expanded state
    await expect(page.locator('.animal-chat-guide')).toHaveClass(/animal-chat-guide--expanded/)

    // The chat UI should be visible
    const chatContainer = page.locator('.animal-chat-guide__chat-overlay')
    await expect(chatContainer).toBeVisible()

    // There should be no full input visible by default before clicking
    // (This is verified because we clicked to expand it)
    
    // Type a message
    const input = page.locator('.animal-chat-guide__chat-input')
    await input.fill('hi')

    // Send
    const sendBtn = page.locator('.animal-chat-guide__chat-send')
    await sendBtn.click()

    // Wait for the reply
    const chatMessages = page.locator('.animal-chat-guide__chat-message')
    await expect(chatMessages).toHaveCount(2)
    
    // Check animal reply
    const animalReply = chatMessages.nth(1)
    await expect(animalReply).toContainText('Grrr-rowl! Hello there, brave explorer!')

    // Close the chat
    const closeBtn = page.locator('.animal-chat-guide__chat-close')
    await closeBtn.click()

    // Should be collapsed again
    await expect(textPanel).toHaveClass(/animal-chat-guide__text-panel--interactive/)
  })
})
