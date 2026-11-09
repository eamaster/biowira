<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { HOME_PAGE_ASSETS } from '@/app/branding'
import AnimalIcon from '@/components/ui/AnimalIcon.vue'
import { getExplorerAnimalById, findExplorerAnimalChoice } from '@/features/welcome/data/explorerAnimalCatalog'
import { useAnimalChat } from '@/composables/useAnimalChat'

const props = withDefaults(defineProps<{
  profileId?: string
  animalId?: string
  animalVisualKey?: string
  displayName: string
  animalName?: string
  fallbackEmoji?: string
  mode?: 'home' | 'scene'
  placement?: 'home' | 'sky-left' | 'sky-right' | 'side-left' | 'side-right' | 'auto' | 'detail-safe'
  compact?: boolean
  ariaLabel?: string
}>(), {
  mode: 'scene',
  placement: 'auto',
  compact: false,
})

const emit = defineEmits<{ 'switch-explorer': [] }>()

/**
 * Tail edge for `.animal-chat-guide__chat-overlay--align-*` must match the row flex in scoped CSS:
 * mascot on the visual left of the panel → `'left'`; mascot on the visual right → `'right'`.
 * (Viewport-based flipping broke home + several scene modes.)
 */
type ChatPlacement = NonNullable<(typeof props)['placement']>

const CHAT_OVERLAY_TAIL_ALIGN_BY_PLACEMENT: Record<ChatPlacement, 'left' | 'right'> = {
  home: 'left', // `.animal-chat-guide--home` uses `row-reverse` → mascot left of panel
  auto: 'right', // `BioWiraScenePage` default placement is `sky-right` (`row` → mascot right)
  'sky-left': 'left', // `row-reverse` in scene group → mascot left of panel
  'side-left': 'left',
  'sky-right': 'right',
  'side-right': 'right',
  'detail-safe': 'right',
}

const actualFallbackEmoji = computed(
  () => props.fallbackEmoji ?? getExplorerAnimalById('malayan-tiger')?.fallbackEmoji ?? '🐯',
)

const showExplorerVisual = computed(() => Boolean(props.animalVisualKey))

const computedAnimalName = computed(() => {
  if (props.animalName) return props.animalName
  const identifier = props.animalId || props.animalVisualKey
  if (identifier) {
    const choice = findExplorerAnimalChoice(identifier)
    if (choice) return choice.commonName
  }
  return 'Malayan Tiger'
})

// Extract reactivity for the composable
const profileIdRef = computed(() => props.profileId)
const animalIdRef = computed(() => props.animalId)
const animalVisualKeyRef = computed(() => props.animalVisualKey)

const {
  isExpanded,
  status,
  messages,
  toggleChat,
  closeChat,
  sendMessage,
} = useAnimalChat(profileIdRef, animalIdRef, animalVisualKeyRef)

const inputText = ref('')

async function submitChat() {
  if (!inputText.value.trim() || status.value === 'sending') return
  const msg = inputText.value
  inputText.value = ''
  await sendMessage(msg)
  scrollToBottom()
}

function sendPrompt(text: string) {
  sendMessage(text)
  scrollToBottom()
}

const chatLogRef = ref<HTMLElement | null>(null)
function scrollToBottom() {
  nextTick(() => {
    if (chatLogRef.value) {
      chatLogRef.value.scrollTop = chatLogRef.value.scrollHeight
    }
  })
}

// ── Typewriter ────────────────────────────────────────────────────────────────
const displayedText = ref<string>(HOME_PAGE_ASSETS.heroPhrases[0])
const prefersReduced = ref(false)
const phraseIndex = ref(0)
let charIndex = 0
let typingTimeout: ReturnType<typeof setTimeout>
let isDeleting = false

const scenePhrases = [
  "Tap to talk to me!",
  "I'm your animal guide!",
  "Ask me anything!",
]

function typeWriter() {
  const phrases = props.mode === 'home' ? HOME_PAGE_ASSETS.heroPhrases : scenePhrases
  const currentPhrase = phrases[phraseIndex.value] || phrases[0]
  if (isDeleting) {
    displayedText.value = currentPhrase.slice(0, charIndex - 1)
    charIndex--
  } else {
    displayedText.value = currentPhrase.slice(0, charIndex + 1)
    charIndex++
  }

  let typeSpeed = 50 + Math.random() * 50

  if (!isDeleting && displayedText.value === currentPhrase) {
    typeSpeed = 2000 // Pause at end
    isDeleting = true
  } else if (isDeleting && displayedText.value === '') {
    isDeleting = false
    phraseIndex.value = (phraseIndex.value + 1) % phrases.length
    typeSpeed = 500 // Pause before next
  } else if (isDeleting) {
    typeSpeed /= 2 // Delete faster
  }

  typingTimeout = setTimeout(typeWriter, typeSpeed)
}

function formatMessage(text: string) {
  // Escape HTML to prevent XSS
  let formatted = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Bold (**text**)
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

  // Italic (*text*)
  formatted = formatted.replace(/\*(.*?)\*/g, '<i>$1</i>');

  // Newlines
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
}

// Only pause typewriter when expanded
const placementClass = computed(() => {
  if (props.mode === 'home') return 'animal-chat-guide--home'
  return `animal-chat-guide--${props.placement}`
})

const chatBoxAlign = computed<'left' | 'right'>(() =>
  props.mode === 'home'
    ? CHAT_OVERLAY_TAIL_ALIGN_BY_PLACEMENT.home
    : (CHAT_OVERLAY_TAIL_ALIGN_BY_PLACEMENT[props.placement] ??
        CHAT_OVERLAY_TAIL_ALIGN_BY_PLACEMENT.auto),
)

onMounted(() => {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReduced.value = mq.matches
  if (!prefersReduced.value && !isExpanded.value) {
    displayedText.value = ''
    typeWriter()
  } else if (prefersReduced.value) {
    const phrases = props.mode === 'home' ? HOME_PAGE_ASSETS.heroPhrases : scenePhrases
    displayedText.value = phrases[0]
  }
})

onUnmounted(() => {
  if (typingTimeout) clearTimeout(typingTimeout)
})

watch(isExpanded, (expanded) => {
  if (expanded) {
    if (typingTimeout) clearTimeout(typingTimeout)
  } else if (!prefersReduced.value) {
    // Restart where it left off, but wait a bit to give transition time
    typingTimeout = setTimeout(typeWriter, 500)
  }
})
</script>

<template>
  <div class="animal-chat-guide" :class="[placementClass, { 'animal-chat-guide--expanded': isExpanded }]">
    <div class="animal-chat-guide__row">
      <div class="animal-chat-guide__welcome">
        <!-- The panel is positioned relative so the absolute chat overlay can anchor to it -->
        <div class="animal-chat-guide__panel-anchor">
          <!-- The Greeting Bubble (Acts as trigger) -->
          <div
            class="animal-chat-guide__text-panel"
            :class="{
              'animal-chat-guide__text-panel--interactive': !isExpanded,
              'animal-chat-guide__text-panel--hidden': isExpanded
            }"
            @click="!isExpanded && toggleChat()"
            :role="!isExpanded ? 'button' : undefined"
            :tabindex="!isExpanded ? 0 : undefined"
            :aria-expanded="isExpanded"
            @keydown.enter="!isExpanded && toggleChat()"
            @keydown.space.prevent="!isExpanded && toggleChat()"
          >
            <h1 class="animal-chat-guide__greeting" v-if="props.mode === 'home'">
              <span class="animal-chat-guide__greeting-name">Hi {{ displayName }}!</span>
              <span class="animal-chat-guide__greeting-phrase" aria-live="polite">
                {{ displayedText }}<span v-if="!prefersReduced" class="animal-chat-guide__cursor" aria-hidden="true">_</span>
              </span>
            </h1>
            
            <div class="animal-chat-guide__greeting-scene" v-else>
              <span class="animal-chat-guide__greeting-name">Hi {{ displayName }}!</span>
              <span class="animal-chat-guide__greeting-phrase" aria-live="polite">
                {{ displayedText }}<span v-if="!prefersReduced" class="animal-chat-guide__cursor" aria-hidden="true">_</span>
              </span>
            </div>

            <div class="animal-chat-guide__tap-prompt" aria-hidden="true" v-if="props.mode === 'home'">
              <span class="animal-chat-guide__tap-sparkle">✨</span>
              <span class="animal-chat-guide__tap-text">Tap to chat with me!</span>
            </div>

            <!-- Profile Chip is only in home mode -->
            <button
              v-if="props.mode === 'home' && showExplorerVisual"
              class="animal-chat-guide__profile-chip"
              type="button"
              :aria-label="`You are ${displayName}. Tap to switch explorer.`"
              @click.stop="emit('switch-explorer')"
            >
              <span class="animal-chat-guide__chip-avatar" aria-hidden="true">
                <AnimalIcon
                  :icon-key="animalVisualKey!"
                  :fallback-emoji="actualFallbackEmoji"
                  size="26px"
                />
              </span>
              <span class="animal-chat-guide__chip-name">{{ displayName }}</span>
              <span class="animal-chat-guide__chip-switch" aria-hidden="true">⇄</span>
            </button>
          </div>

          <!-- The overlapping Chat Box -->
          <div 
            v-if="isExpanded" 
            class="animal-chat-guide__chat-overlay" 
            :class="`animal-chat-guide__chat-overlay--align-${chatBoxAlign}`"
            role="dialog" 
            aria-label="Animal Chat"
          >
            <div class="animal-chat-guide__chat-header">
              <div class="animal-chat-guide__chat-title-group">
                <span class="animal-chat-guide__chat-title">Chat with your</span>
                <span class="animal-chat-guide__chat-subtitle">{{ computedAnimalName }}</span>
              </div>
              <button class="animal-chat-guide__chat-close" @click="closeChat" aria-label="Close chat">×</button>
            </div>
            
            <div class="animal-chat-guide__chat-log" ref="chatLogRef" aria-live="polite">
              <div v-if="messages.length === 0" class="animal-chat-guide__chat-empty">
                Ask me about my food, home, or super skills!
              </div>
              <div
                v-for="msg in messages"
                :key="msg.id"
                :class="['animal-chat-guide__chat-message', `animal-chat-guide__chat-message--${msg.role}`]"
                v-html="formatMessage(msg.text)"
              ></div>
            </div>
            
            <div v-if="messages.length === 0" class="animal-chat-guide__chat-prompts">
              <button type="button" class="animal-chat-guide__chat-prompt" @click="sendPrompt('What do you eat?')">What do you eat?</button>
              <button type="button" class="animal-chat-guide__chat-prompt" @click="sendPrompt('Where do you live?')">Where do you live?</button>
              <button type="button" class="animal-chat-guide__chat-prompt" @click="sendPrompt('Coolest skill?')">Coolest skill?</button>
            </div>
            
            <form class="animal-chat-guide__chat-form" @submit.prevent="submitChat">
              <input
                v-model="inputText"
                class="animal-chat-guide__chat-input"
                type="text"
                aria-label="Message your explorer animal"
                placeholder="Ask your animal..."
                :disabled="status === 'sending'"
              />
              <button
                class="animal-chat-guide__chat-send"
                type="submit"
                :disabled="status === 'sending' || !inputText.trim()"
              >
                {{ status === 'sending' ? 'Wait...' : 'Ask' }}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div class="animal-chat-guide__mascot-wrapper">
        <button
          class="animal-chat-guide__mascot-button"
          type="button"
          :aria-label="props.ariaLabel || 'Chat with your explorer animal'"
          :aria-expanded="isExpanded"
          @click="toggleChat"
        >
          <div class="animal-chat-guide__mascot-inner">
            <div class="animal-chat-guide__mascot">
              <AnimalIcon
                v-if="showExplorerVisual"
                :icon-key="animalVisualKey!"
                :fallback-emoji="actualFallbackEmoji"
                :size="props.mode === 'home' ? 'clamp(64px, 14vw, 110px)' : 'clamp(56px, 10vw, 88px)'"
              />
              <AnimalIcon
                v-else
                icon-key="malayan-tiger"
                :fallback-emoji="actualFallbackEmoji"
                :size="props.mode === 'home' ? 'clamp(64px, 14vw, 110px)' : 'clamp(56px, 10vw, 88px)'"
              />
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

$hero-chip-visible-max: $bp-md - 1px;
$hero-stack-max: $bp-md;

@mixin speech-tail($bg-color, $border-color, $direction: 'left', $y-pos: 50%, $y-transform: -50%) {
  content: '';
  position: absolute;
  top: $y-pos;
  transform: translateY($y-transform);
  border-style: solid;
  pointer-events: none;
  transition: border-color var(--transition-normal);

  @if $direction == 'left' {
    left: -13px;
    right: auto;
    border-width: 9px 13px 9px 0;
    border-color: transparent $bg-color transparent transparent;
    filter: drop-shadow(-1px 0 0 $border-color);
  } @else {
    left: auto;
    right: -13px;
    border-width: 9px 0 9px 13px;
    border-color: transparent transparent transparent $bg-color;
    filter: drop-shadow(1px 0 0 $border-color);
  }
}

.animal-chat-guide {
  position: relative;
  z-index: 50;

  &--home {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;

    .animal-chat-guide__row {
      display: inline-flex;
      flex-direction: row-reverse;
      align-items: flex-start;
      justify-content: center;
      gap: var(--space-4);
      width: auto;
      max-width: min(
        var(--home-content-width, var(--max-content-width, 1200px)),
        100%
      );

      @media (min-width: #{$bp-md + 1px}) {
        transform: translateY(clamp(10px, 1.75vh, 26px));
        @media (prefers-reduced-motion: reduce) {
          transform: none;
          margin-block-start: clamp(10px, 1.75vh, 26px);
        }
      }

      @media (max-width: #{$hero-stack-max}) {
        flex-direction: column;
        align-items: center;
        gap: var(--space-4);
      }
    }
  }

  // --- SCENE MODES ---
  &--sky-left, &--sky-right, &--side-left, &--side-right, &--detail-safe {
    position: absolute;
    // ensure pointer events only happen on the children
    pointer-events: none;
    z-index: var(--z-scene-surface, 10); // place above content somewhat, below modals
    
    .animal-chat-guide__row {
      display: flex;
      flex-direction: row-reverse; // default bubble on left of mascot
      align-items: start;
      gap: var(--space-2);
      pointer-events: auto;
    }
  }

  &--sky-left {
    top: var(--scene-animal-chat-sky-inset-block-start);
    left: var(--scene-animal-chat-sky-inset-inline-edge);
  }

  &--sky-right {
    top: var(--scene-animal-chat-sky-inset-block-start);
    right: var(--scene-animal-chat-sky-inset-inline-edge);
    .animal-chat-guide__row {
      flex-direction: row; // bubble on right of mascot
    }
    // Mirror the tail for right-aligned text panel
    .animal-chat-guide__text-panel::after {
      @include speech-tail(rgba(255, 248, 231, 0.65), rgba(200, 168, 112, 0.5), 'right');
    }
    .animal-chat-guide__chat-overlay::after {
      @include speech-tail(rgba(255, 248, 231, 0.98), rgba(200, 168, 112, 0.9), 'right', 40px, 0);
    }
  }

  &--detail-safe {
    top: clamp(120px, 15vh, 160px); // Below the ribbon
    right: max(10px, calc((100% - 1180px) / 2 - 120px)); // Try to sit outside the detail card
    @media (max-width: 1400px) {
      right: clamp(10px, 2vw, 40px); // Fallback to edge if screen is too narrow
    }
    .animal-chat-guide__row {
      flex-direction: row; // mascot on the right
    }
    .animal-chat-guide__text-panel::after {
      @include speech-tail(rgba(255, 248, 231, 0.65), rgba(200, 168, 112, 0.5), 'right');
    }
    .animal-chat-guide__chat-overlay::after {
      @include speech-tail(rgba(255, 248, 231, 0.98), rgba(200, 168, 112, 0.9), 'right', 40px, 0);
    }
  }

  &--side-left {
    top: 50%;
    left: clamp(10px, 2vw, 40px);
    transform: translateY(-50%);
  }

  &--side-right {
    top: 50%;
    right: clamp(10px, 2vw, 40px);
    transform: translateY(-50%);
    .animal-chat-guide__row {
      flex-direction: row;
    }
    .animal-chat-guide__text-panel::after {
      @include speech-tail(rgba(255, 248, 231, 0.65), rgba(200, 168, 112, 0.5), 'right');
    }
    .animal-chat-guide__chat-overlay::after {
      @include speech-tail(rgba(255, 248, 231, 0.98), rgba(200, 168, 112, 0.9), 'right', 40px, 0);
    }
  }

  // Handle responsive for scene modes
  @media (max-width: $bp-sm) {
    &--sky-left, &--sky-right, &--side-left, &--side-right, &--detail-safe {
      position: fixed; // Fixed at bottom right on mobile like a standard chat widget
      top: auto;
      left: auto;
      right: var(--space-3);
      bottom: calc(var(--nav-height-bottom, 60px) + var(--space-3));
      transform: none;
      margin-bottom: 0;
      width: auto;
      display: flex;
      justify-content: flex-end;
      z-index: 80;

      .animal-chat-guide__row {
        flex-direction: row-reverse; // Mascot on right, greeting bubble on left
        align-items: flex-end;
      }

      .animal-chat-guide__text-panel::after, .animal-chat-guide__chat-overlay::after {
        display: none; // hide tail when on mobile
      }
    }
  }
}

// ── Components ───────────────────────────────────────────────────────────────

.animal-chat-guide__welcome {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  max-width: 100%;
  align-self: start;

  .animal-chat-guide--home & {
    flex: 0 0 clamp(260px, 38vw, 420px);
    width: clamp(260px, 38vw, 420px);

    @media (max-width: #{$hero-stack-max}) {
      flex: 1 1 auto;
      align-self: center;
      align-items: center;
      width: 100%;
      max-width: min(400px, 100%);
      text-align: center;
    }
  }

  // Scene modes default to tighter width
  &:not(.animal-chat-guide--home .animal-chat-guide__welcome) {
    width: max-content;
    max-width: min(280px, 60vw);
  }
}

.animal-chat-guide__panel-anchor {
  position: relative;
  width: fit-content;
  max-width: 100%;

  .animal-chat-guide--home & {
    @media (max-width: #{$hero-stack-max}) {
      align-self: center;
      display: flex;
      justify-content: center;
    }
  }
}

.animal-chat-guide__text-panel {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: fit-content;
  max-width: 100%;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-xl);
  border: var(--pixel-border) solid rgba(200, 168, 112, 0.55);
  background: rgba(255, 248, 231, 0.42);
  box-shadow: 4px 4px 0 rgba(61, 43, 31, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(12px) saturate(1.05);
  -webkit-backdrop-filter: blur(12px) saturate(1.05);
  transition: opacity var(--transition-fast), transform var(--transition-normal);

  @supports not ((backdrop-filter: blur(2px)) or (-webkit-backdrop-filter: blur(2px))) {
    background: rgba(255, 248, 231, 0.92);
    box-shadow: var(--pixel-shadow);
  }

  // smaller padding for scene modes
  &:not(.animal-chat-guide--home .animal-chat-guide__text-panel) {
    padding: var(--space-2) var(--space-3);
  }

  &--interactive {
    cursor: pointer;
    
    &:hover, &:focus-visible {
      background: rgba(255, 248, 231, 0.7);
      border-color: rgba(200, 168, 112, 0.8);
      transform: translateY(-2px);
      box-shadow: 4px 6px 0 rgba(61, 43, 31, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6);
      outline: none;
    }

    &:focus-visible {
      outline: 4px solid var(--color-secondary);
      outline-offset: 4px;
    }
  }

  &--hidden {
    opacity: 0;
    pointer-events: none;
  }

  /** Tail */
  @media (min-width: #{$bp-md + 1px}) {
    &::after {
      @include speech-tail(rgba(255, 248, 231, 0.65), rgba(200, 168, 112, 0.5), 'left');
    }
  }

  .animal-chat-guide--home & {
    @media (max-width: #{$hero-stack-max}) {
      align-items: center;
    }
  }
}

// Home mode large greeting
.animal-chat-guide__greeting {
  .animal-chat-guide__greeting-name {
    overflow-wrap: anywhere;
    font-size: var(--home-font-hero-lead, clamp(18px, 2vw + 12px, 26px));
    margin-bottom: var(--space-2);
    font-weight: 800;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
  }
  .animal-chat-guide__greeting-phrase {
    display: block;
    margin: 0;
    line-height: 1.45;
    min-height: 1.45em;
    font-size: var(--home-font-hero-phrase, clamp(15px, 1.35vw + 11px, 20px));
    font-weight: 700;
    color: var(--color-text-light);
  }
}

// Scene mode compact greeting
.animal-chat-guide__greeting-scene {
  .animal-chat-guide__greeting-name {
    font-size: 15px;
    font-weight: 800;
    line-height: 1.3;
    display: block;
    margin-bottom: 2px;
  }
  .animal-chat-guide__greeting-phrase {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-light);
    line-height: 1.3;
    min-height: 1.3em;
  }
}

.animal-chat-guide__cursor {
  animation: blink 1s step-start infinite;
  opacity: 1;
  color: var(--color-text-muted);
}

.animal-chat-guide__tap-prompt {
  margin-top: var(--space-2);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.6);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  border: 1px dashed rgba(200, 168, 112, 0.6);
  font-family: var(--font-readable);
  font-size: 15px;
  font-weight: 700;
  color: var(--color-primary);

  .animal-chat-guide__text-panel--interactive:hover & {
    background: #fff;
    border-color: var(--color-primary);
    border-style: solid;
  }
}

.animal-chat-guide__tap-sparkle {
  animation: float 3s ease-in-out infinite;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

.animal-chat-guide__profile-chip {
  display: none;
  flex-shrink: 0;
  margin-top: var(--space-3);

  @media (max-width: #{$hero-chip-visible-max}) {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    align-self: center;
    background: rgba(255, 255, 255, 0.45);
    border: var(--pixel-border) solid var(--color-border);
    border-radius: var(--radius-full);
    padding: 8px 16px 8px 10px;
    cursor: pointer;
    transition: background var(--transition-fast), border-color var(--transition-fast);
    font: inherit;
    color: inherit;

    &:hover,
    &:focus-visible {
      background: rgba(255, 255, 255, 0.65);
      border-color: var(--color-primary);
      outline: none;
    }

    &:focus-visible {
      outline: 3px solid var(--color-secondary);
      outline-offset: 2px;
    }
  }
}

.animal-chat-guide__chip-avatar {
  line-height: 0;
}

.animal-chat-guide__chip-name {
  font-family: var(--font-readable);
  font-size: var(--home-font-chip, var(--text-sm));
  font-weight: 700;
  color: var(--color-text);
  white-space: nowrap;
  max-width: min(160px, 40vw);
  overflow: hidden;
  text-overflow: ellipsis;
}

.animal-chat-guide__chip-switch {
  font-size: 14px;
  color: var(--color-text-muted);
  margin-left: 2px;
}

.animal-chat-guide__mascot-wrapper {
  position: relative;
  display: flex;
  flex-shrink: 0;
  align-self: start;
  align-items: flex-start;

  .animal-chat-guide--home & {
    @media (max-width: #{$hero-stack-max}) {
      align-self: center;
      justify-content: center;
      z-index: 10;
    }
  }
}

.animal-chat-guide__mascot-button {
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  outline: none;
  border-radius: var(--radius-full);
  transition: transform var(--transition-fast);

  &:hover .animal-chat-guide__mascot {
    transform: scale(1.05) translateY(-4px);
  }
  
  &:focus-visible {
    outline: 4px solid var(--color-secondary);
    outline-offset: 4px;
  }
}

.animal-chat-guide__mascot-inner {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.animal-chat-guide__mascot {
  filter: drop-shadow(3px 3px 0 rgba(0, 0, 0, 0.2));
  line-height: 0;
  transition: transform var(--transition-normal);

  .animal-chat-guide--home & {
    @media (max-width: #{$hero-stack-max}) {
      transform: scale(0.94);
      transform-origin: center top;

      @media (prefers-reduced-motion: reduce) {
        transform: none;
      }
    }
  }
}

// -- Chat overlay styles --

.animal-chat-guide__chat-overlay {
  position: absolute;
  top: 0;
  width: clamp(340px, 45vw, 520px);
  max-width: 90vw;
  background: rgba(255, 248, 231, 0.98);
  border: var(--pixel-border) solid rgba(200, 168, 112, 0.9);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  box-shadow: 4px 12px 24px rgba(61, 43, 31, 0.25);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  z-index: 30; // overlaps feature cards
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  animation: pop-in 0.2s ease-out forwards;

  &:not(.animal-chat-guide--home .animal-chat-guide__chat-overlay) {
    width: clamp(300px, 28vw, 430px);
    max-width: 85vw;
    padding: var(--space-3);
  }

  @media (max-width: #{$hero-stack-max}) {
    position: fixed;
    top: auto;
    bottom: calc(var(--nav-height-bottom, 60px) + var(--space-4));
    left: 50% !important;
    right: auto !important;
    transform: translateX(-50%);
    width: calc(100vw - var(--space-4));
    max-width: 480px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    animation: slide-up 0.2s ease-out forwards;
    z-index: 90; // higher than page content on mobile
  }
  
  @media (min-width: #{$bp-md + 1px}) {
    &::after {
      @include speech-tail(rgba(255, 248, 231, 0.98), rgba(200, 168, 112, 0.9), 'left', 40px, 0);
    }
  }
}

.animal-chat-guide__chat-overlay--align-left {
  left: 0;
  right: auto;
}

.animal-chat-guide__chat-overlay--align-right {
  left: auto;
  right: 0;
  &::after {
    @include speech-tail(rgba(255, 248, 231, 0.98), rgba(200, 168, 112, 0.9), 'right', 40px, 0);
  }
}

.animal-chat-guide__chat-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 2px dashed rgba(200, 168, 112, 0.4);
  padding-bottom: var(--space-2);
}

.animal-chat-guide__chat-title-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.animal-chat-guide__chat-title {
  font-family: var(--font-readable);
  font-size: 15px;
  color: var(--color-text-muted);
  font-weight: 700;
  
  &:not(.animal-chat-guide--home .animal-chat-guide__chat-title) {
    font-size: 13px;
  }
}

.animal-chat-guide__chat-subtitle {
  font-family: var(--font-readable);
  font-size: 18px;
  font-weight: 800;
  color: var(--color-text);

  &:not(.animal-chat-guide--home .animal-chat-guide__chat-subtitle) {
    font-size: 16px;
  }
}

.animal-chat-guide__chat-close {
  background: transparent;
  border: none;
  font-size: 28px;
  line-height: 1;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0 4px;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  
  &:hover {
    color: var(--color-danger);
    background: rgba(0,0,0,0.05);
  }
}

.animal-chat-guide__chat-log {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  max-height: clamp(220px, 40vh, 320px);
  overflow-y: auto;
  padding-right: var(--space-2);

  &:not(.animal-chat-guide--home .animal-chat-guide__chat-log) {
    max-height: clamp(180px, 34vh, 260px);
    gap: var(--space-2);
  }
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(0,0,0,0.05);
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(200, 168, 112, 0.6);
    border-radius: 4px;
  }
}

.animal-chat-guide__chat-empty {
  font-family: var(--font-readable);
  font-size: 16px;
  color: var(--color-text-muted);
  text-align: center;
  padding: var(--space-3) 0;
  font-style: italic;

  &:not(.animal-chat-guide--home .animal-chat-guide__chat-empty) {
    font-size: 14px;
    padding: var(--space-2) 0;
  }
}

.animal-chat-guide__chat-message {
  padding: 10px 14px;
  border-radius: var(--radius-xl);
  font-family: var(--font-readable);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.45;
  max-width: 92%;
  word-wrap: break-word;

  &:not(.animal-chat-guide--home .animal-chat-guide__chat-message) {
    font-size: 14px;
    padding: 8px 12px;
  }
  
  &--user {
    align-self: flex-end;
    background: var(--color-secondary);
    color: #fff;
    border-bottom-right-radius: 4px;
  }
  
  &--animal, &--system {
    align-self: flex-start;
    background: rgba(255, 255, 255, 0.9);
    color: var(--color-text);
    border: 2px solid rgba(200, 168, 112, 0.4);
    border-bottom-left-radius: 4px;
  }

  &--system {
    color: var(--color-danger);
    font-style: italic;
  }
}

.animal-chat-guide__chat-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;
}

.animal-chat-guide__chat-prompt {
  background: rgba(255,255,255,0.7);
  border: 2px solid rgba(200, 168, 112, 0.5);
  border-radius: var(--radius-full);
  padding: 6px 14px;
  font-family: var(--font-readable);
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
  cursor: pointer;
  transition: all var(--transition-fast);
  
  &:hover {
    background: #fff;
    border-color: var(--color-primary);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  &:not(.animal-chat-guide--home .animal-chat-guide__chat-prompt) {
    font-size: 13px;
    padding: 4px 10px;
    gap: 6px;
  }
}

.animal-chat-guide__chat-form {
  display: flex;
  gap: var(--space-2);
  margin-top: 4px;
}

.animal-chat-guide__chat-input {
  flex: 1;
  border: 2px solid rgba(200, 168, 112, 0.5);
  border-radius: var(--radius-lg);
  padding: 10px 14px;
  font-family: var(--font-readable);
  font-size: 16px;
  font-weight: 600;
  outline: none;
  min-width: 0;
  
  &:focus {
    border-color: var(--color-secondary);
  }
  
  &:disabled {
    opacity: 0.7;
    background: rgba(0,0,0,0.05);
  }

  &:not(.animal-chat-guide--home .animal-chat-guide__chat-input) {
    font-size: 14px;
    padding: 8px 10px;
  }
}

.animal-chat-guide__chat-send {
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-lg);
  padding: 0 20px;
  font-family: var(--font-readable);
  font-weight: 800;
  font-size: 16px;
  cursor: pointer;
  transition: all var(--transition-fast);
  
  &:hover:not(:disabled) {
    background: var(--color-primary-dark, #2b7040);
    transform: translateY(-1px);
  }

  &:not(.animal-chat-guide--home .animal-chat-guide__chat-send) {
    font-size: 14px;
    padding: 0 16px;
  }
}

@keyframes slide-up {
  from {
    transform: translate(-50%, 20px);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}

@keyframes pop-in {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
