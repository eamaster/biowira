<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProfileStore } from '@/stores/profileStore'
import { useSessionStore } from '@/stores/sessionStore'
import type { CreateProfileInput } from '@/domain/session'
import { ROUTE_NAMES } from '@/app/config'
import ExplorerProfileCard from './components/ExplorerProfileCard.vue'
import CreateExplorerCard from './components/CreateExplorerCard.vue'
import AvatarPicker from './components/AvatarPicker.vue'
import AnimalIcon from '@/components/ui/AnimalIcon.vue'
import { getExplorerAnimalById } from '@/features/welcome/data/explorerAnimalCatalog'
import type { ExplorerAnimalChoice } from '@/features/welcome/data/explorerAnimalCatalog'
import { loadExplorerAnimalChoices } from '@/features/welcome/data/loadExplorerAnimalChoices'
import { messageForExplorerCreateFailure } from '@/utils/apiErrors'
import SafeNicknamePicker from './components/SafeNicknamePicker.vue'
import PixelButton from '@/components/ui/PixelButton.vue'
import GameplayIcon from '@/components/ui/GameplayIcon.vue'
import { LEAF_POINTS_GAMEPLAY_ICON_KEY } from '@/domain/pointsCurrency'

type Step = 'loading' | 'choose' | 'create-avatar' | 'create-nickname' | 'creating' | 'create-success'

const router = useRouter()
const profileStore = useProfileStore()
const sessionStore = useSessionStore()

const step = ref<Step>('loading')
const selectedAnimal = ref<{ animalId: string; animalVisualKey: string } | null>(null)
const selectedNickname = ref('')
const createError = ref('')
const backupCode = ref('')
const backupPin = ref('')
const explorerChoices = ref<ExplorerAnimalChoice[]>([])
const explorerChoicesLoading = ref(true)
const explorerChoicesError = ref('')

onMounted(async () => {
  // If session is already active (edge case), go directly home
  if (sessionStore.hasActiveSession) {
    await router.replace({ name: ROUTE_NAMES.home })
    return
  }
  await profileStore.loadProfiles()
  try {
    explorerChoices.value = await loadExplorerAnimalChoices()
    if (explorerChoices.value.length === 0) {
      explorerChoicesError.value =
        'No animals could be loaded. Please check your connection and try again.'
    }
  } catch (e) {
    explorerChoicesError.value = 'Could not load animals. Please try again.'
    console.error(e)
  } finally {
    explorerChoicesLoading.value = false
  }
  step.value = 'choose'
})

function startCreate() {
  selectedAnimal.value = null
  selectedNickname.value = ''
  createError.value = ''
  step.value = 'create-avatar'
}

function onAnimalSelected(payload: { animalId: string; animalVisualKey: string }) {
  selectedAnimal.value = payload
  step.value = 'create-nickname'
}

function backToAvatarPicker() {
  step.value = 'create-avatar'
}

function backToChoose() {
  step.value = 'choose'
}

function onNicknameConfirmed(nickname: string) {
  selectedNickname.value = nickname
}

async function finishCreate() {
  if (!selectedAnimal.value || !selectedNickname.value) return
  step.value = 'creating'
  createError.value = ''
  try {
    const input: CreateProfileInput = {
      displayNickname: selectedNickname.value,
      animalId: selectedAnimal.value.animalId,
      animalVisualKey: selectedAnimal.value.animalVisualKey,
    }
    const response = await profileStore.createProfile(input)
    
    // Safety check: Only show backup screen if the backend actually provided a profileCode
    if (response.profileCode && response.pin) {
      backupCode.value = response.profileCode
      backupPin.value = response.pin
      step.value = 'create-success'
    } else {
      await router.push({ name: ROUTE_NAMES.home })
    }
  } catch (e: unknown) {
    console.error(e)
    createError.value = messageForExplorerCreateFailure(e)
    step.value = 'create-nickname'
  }
}

async function onContinueAs(profileId: string) {
  try {
    await profileStore.switchToProfile(profileId)
    await router.push({ name: ROUTE_NAMES.home })
  } catch {
    // Profile may not exist — reload list
    await profileStore.loadProfiles()
  }
}

async function proceedToHome() {
  await router.push({ name: ROUTE_NAMES.home })
}
</script>

<template>
  <div class="welcome-page" role="main">
    <!-- ── Loading ─────────────────────────────────────────────────────── -->
    <div v-if="step === 'loading'" class="welcome-page__loading" aria-live="polite">
      <div class="welcome-page__spinner" aria-hidden="true">🌿</div>
      <p class="welcome-page__loading-text">Waking up your explorer…</p>
    </div>

    <!-- ── Creating profile ─────────────────────────────────────────────── -->
    <div v-else-if="step === 'creating'" class="welcome-page__loading" aria-live="polite">
      <div class="welcome-page__spinner" aria-hidden="true">✨</div>
      <p class="welcome-page__loading-text">Creating your explorer…</p>
    </div>

    <!-- ── Choose explorer (profiles exist) ─────────────────────────────── -->
    <div v-else-if="step === 'choose'" class="welcome-page__content">
      <div class="welcome-page__header">
        <div class="welcome-page__mascot" aria-hidden="true">
          <AnimalIcon
            icon-key="malayan-tiger"
            :fallback-emoji="getExplorerAnimalById('malayan-tiger')?.fallbackEmoji ?? '🐯'"
            size="72px"
          />
        </div>
        <h1 class="welcome-page__title">Choose Your Explorer!(Latest)</h1>
        <p class="welcome-page__subtitle">Pick your explorer to start your adventure</p>
      </div>

      <div class="welcome-page__profiles" aria-label="Explorer profiles">
        <ExplorerProfileCard
          v-for="profile in profileStore.profiles"
          :key="profile.profileId"
          :profile="profile"
          @continue="onContinueAs(profile.profileId)"
        />
        <CreateExplorerCard
          v-if="profileStore.profiles.length < 5"
          @create="startCreate"
        />
      </div>
    </div>

    <!-- ── Create: pick avatar ───────────────────────────────────────────── -->
    <div v-else-if="step === 'create-avatar'" class="welcome-page__content">
      <div class="welcome-page__header">
        <h1 class="welcome-page__title">Pick Your Animal!</h1>
        <p class="welcome-page__subtitle">Choose the animal that feels most like you</p>
      </div>
      <p
        v-if="explorerChoicesError"
        class="welcome-page__explorer-error"
        role="alert"
      >
        {{ explorerChoicesError }}
      </p>
      <AvatarPicker
        :animals="explorerChoices"
        :loading="explorerChoicesLoading"
        @select="onAnimalSelected"
      />
      <div class="welcome-page__back">
        <PixelButton v-if="profileStore.profiles.length > 0" variant="gray" size="sm" @click="backToChoose">
          ← Back
        </PixelButton>
      </div>
    </div>

    <!-- ── Create: pick nickname ─────────────────────────────────────────── -->
    <div v-else-if="step === 'create-nickname'" class="welcome-page__content">
      <div class="welcome-page__header">
        <h1 class="welcome-page__title">What's Your Name?</h1>
        <p class="welcome-page__subtitle">We made a special name, or you can shuffle for a new one!</p>
      </div>
      <SafeNicknamePicker @update="onNicknameConfirmed" />

      <div
        v-if="createError"
        class="welcome-page__error"
        role="alert"
      >
        {{ createError }}
      </div>

      <div class="welcome-page__actions">
        <PixelButton variant="gray" size="sm" @click="backToAvatarPicker">← Pick Different Animal</PixelButton>
        <PixelButton
          variant="green"
          size="lg"
          :disabled="!selectedNickname"
          @click="finishCreate"
        >
          <GameplayIcon :type="LEAF_POINTS_GAMEPLAY_ICON_KEY" size="18px" />
          Create Explorer!
        </PixelButton>
      </div>
    </div>

    <!-- ── Create: success & backup ────────────────────────────────────────── -->
    <div v-else-if="step === 'create-success'" class="welcome-page__content">
      <div class="welcome-page__header">
        <h1 class="welcome-page__title">Explorer Created! 🎉</h1>
        <p class="welcome-page__subtitle">
          If you play on another device, use this code and PIN to bring your explorer with you. <br>
          <strong>Parents: Please save this!</strong>
        </p>
      </div>

      <div class="welcome-page__backup-card">
        <div class="backup-row">
          <span class="backup-label">Profile Code:</span>
          <span class="backup-value">{{ backupCode }}</span>
        </div>
        <div class="backup-row">
          <span class="backup-label">PIN:</span>
          <span class="backup-value">{{ backupPin }}</span>
        </div>
      </div>

      <div class="welcome-page__actions">
        <PixelButton variant="green" size="lg" @click="proceedToHome">
          <GameplayIcon :type="LEAF_POINTS_GAMEPLAY_ICON_KEY" size="18px" />
          Let's Explore!
        </PixelButton>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.welcome-page {
  min-height: 100dvh;
  background: linear-gradient(160deg, #1e4d12 0%, #2d6a1e 40%, #4a8c2a 75%, #7dbb50 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: var(--space-8) var(--space-4) var(--space-12);

  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: var(--space-4);
  }

  &__spinner {
    font-size: 64px;
    animation: spin 1.5s ease-in-out infinite;
  }

  &__loading-text {
    font-family: var(--font-readable);
    font-size: var(--text-md);
    font-weight: 800;
    color: #fff;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.4);
  }

  &__content {
    width: 100%;
    max-width: 700px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-6);
  }

  &__header {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
  }

  &__mascot {
    line-height: 0;
    filter: drop-shadow(4px 4px 0 rgba(0,0,0,0.3));
    animation: float 3s ease-in-out infinite;
  }

  &__title {
    font-family: var(--font-readable);
    font-size: clamp(24px, 4vw, 32px);
    font-weight: 900;
    color: #fff;
    text-shadow: 2px 2px 0 rgba(0,0,0,0.4);
    line-height: 1.2;
  }

  &__subtitle {
    font-family: var(--font-body);
    font-size: var(--text-base);
    color: rgba(255,255,255,0.85);
    max-width: 380px;
  }

  &__explorer-error {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    color: #ffecb3;
    text-align: center;
    max-width: 420px;
    margin: 0;
  }

  &__profiles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: var(--space-4);
    width: 100%;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    justify-content: center;
    margin-top: var(--space-4);
  }

  &__back {
    margin-top: var(--space-2);
  }

  &__error {
    background: rgba(244, 67, 54, 0.15);
    border: 2px solid #F44336;
    border-radius: var(--radius-md);
    color: #fff;
    font-family: var(--font-body);
    font-size: var(--text-base);
    padding: var(--space-3) var(--space-4);
    text-align: center;
    width: 100%;
    max-width: 400px;
  }

  &__backup-card {
    background: rgba(0, 0, 0, 0.4);
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    width: 100%;
    max-width: 400px;
    
    .backup-row {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-1);
    }
    
    .backup-label {
      color: rgba(255, 255, 255, 0.8);
      font-size: var(--text-sm);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    
    .backup-value {
      font-family: var(--font-readable);
      font-weight: 900;
      font-size: 40px;
      color: #ffd600;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
      letter-spacing: 0.05em;
    }
  }
}

@keyframes spin {
  0%, 100% { transform: rotate(-10deg) scale(1); }
  50% { transform: rotate(10deg) scale(1.1); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
</style>
