<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProfileStore } from '@/stores/profileStore'
import { useSessionStore } from '@/stores/sessionStore'
import type { ChildProfile } from '@/domain/session'
import { ROUTE_NAMES } from '@/app/config'
import ExplorerAnimalIcon from '@/features/welcome/components/ExplorerAnimalIcon.vue'
import GameplayIcon from '@/components/ui/GameplayIcon.vue'
import { findExplorerAnimalChoice } from '@/features/welcome/data/explorerAnimalCatalog'
import PixelModal from './PixelModal.vue'
import PixelButton from './PixelButton.vue'
import { LEAF_POINTS_GAMEPLAY_ICON_KEY, LEAF_POINTS_LABEL, formatLeafPointsCount } from '@/domain/pointsCurrency'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const router = useRouter()
const profileStore = useProfileStore()
const sessionStore = useSessionStore()

const confirmDeleteId = ref<string | null>(null)
const switching = ref(false)
const restoreMode = ref(false)
const restoreCode = ref('')
const restorePin = ref('')
const restoreError = ref('')

function close() {
  emit('update:modelValue', false)
  confirmDeleteId.value = null
  restoreMode.value = false
  restoreCode.value = ''
  restorePin.value = ''
  restoreError.value = ''
}

async function selectProfile(profile: ChildProfile) {
  if (sessionStore.activeProfile?.profileId === profile.profileId) {
    close()
    return
  }
  switching.value = true
  try {
    await profileStore.switchToProfile(profile.profileId)
    close()
  } finally {
    switching.value = false
  }
}

function startRestore() {
  restoreMode.value = true
  restoreCode.value = ''
  restorePin.value = ''
  restoreError.value = ''
}

async function submitRestore() {
  if (!restoreCode.value || !restorePin.value) return
  switching.value = true
  restoreError.value = ''
  try {
    await profileStore.restoreProfile({
      profileCode: restoreCode.value,
      pin: restorePin.value
    })
    close()
  } catch (e: unknown) {
    restoreError.value = e instanceof Error ? e.message : 'Could not restore explorer. Check code and PIN.'
  } finally {
    switching.value = false
  }
}

function askDelete(profileId: string) {
  confirmDeleteId.value = profileId
}

async function confirmDelete() {
  if (!confirmDeleteId.value) return
  await profileStore.deleteProfile(confirmDeleteId.value)
  confirmDeleteId.value = null
  if (!sessionStore.hasActiveSession) {
    close()
    await router.push({ name: ROUTE_NAMES.welcome })
  }
}
</script>

<template>
  <PixelModal
    :model-value="modelValue"
    title="Switch Explorer"
    max-width="480px"
    testid="switch-explorer-modal"
    @update:model-value="close"
  >
    <!-- Delete confirmation -->
    <div v-if="confirmDeleteId" class="switcher__confirm" role="alertdialog" aria-label="Confirm delete">
      <p class="switcher__confirm-text">
        ⚠️ Are you a grown-up? This will delete the explorer forever!
      </p>
      <div class="switcher__confirm-actions">
        <PixelButton variant="gray" size="sm" @click="confirmDeleteId = null">Cancel</PixelButton>
        <PixelButton variant="red" size="sm" @click="confirmDelete">Yes, Delete</PixelButton>
      </div>
    </div>

    <!-- Restore form -->
    <div v-else-if="restoreMode" class="switcher__restore">
      <div class="switcher__restore-header">
        <h3>Restore Explorer</h3>
        <p>Enter your profile code and PIN</p>
      </div>
      <div class="switcher__restore-form">
        <input
          v-model="restoreCode"
          placeholder="Profile Code"
          class="switcher__input"
        >
        <input
          v-model="restorePin"
          placeholder="PIN"
          type="password"
          class="switcher__input"
        >
      </div>
      <div v-if="restoreError" class="switcher__error">{{ restoreError }}</div>
      <div class="switcher__confirm-actions">
        <PixelButton variant="gray" size="sm" @click="restoreMode = false">Cancel</PixelButton>
        <PixelButton variant="green" size="sm" :disabled="!restoreCode || !restorePin || switching" @click="submitRestore">
          Restore
        </PixelButton>
      </div>
    </div>

    <!-- Profile list -->
    <div v-else class="switcher__list" role="list">
      <div
        v-for="profile in profileStore.profiles"
        :key="profile.profileId"
        class="switcher__item"
        :class="{ 'switcher__item--active': sessionStore.activeProfile?.profileId === profile.profileId }"
        role="listitem"
      >
        <button
          class="switcher__profile-btn"
          type="button"
          :disabled="switching"
          :aria-label="`Switch to ${profile.displayNickname}`"
          :aria-pressed="sessionStore.activeProfile?.profileId === profile.profileId"
          @click="selectProfile(profile)"
        >
          <span class="switcher__avatar" aria-hidden="true">
            <ExplorerAnimalIcon
              :visual-key="profile.animalVisualKey"
              :common-name="(findExplorerAnimalChoice(profile.animalId) ?? findExplorerAnimalChoice(profile.animalVisualKey))?.commonName ?? profile.animalId"
              :fallback-emoji="(findExplorerAnimalChoice(profile.animalId) ?? findExplorerAnimalChoice(profile.animalVisualKey))?.fallbackEmoji ?? '🐾'"
              size="40px"
            />
          </span>
          <span class="switcher__profile-info">
            <span class="switcher__profile-name">{{ profile.displayNickname }}</span>
            <span class="switcher__profile-level">
              <GameplayIcon :type="LEAF_POINTS_GAMEPLAY_ICON_KEY" size="10px" class="switcher__leaf-icon" />
              LV {{ profile.level }} · {{ formatLeafPointsCount(profile.leafPoints) }} {{ LEAF_POINTS_LABEL }}
            </span>
          </span>
          <span v-if="sessionStore.activeProfile?.profileId === profile.profileId" class="switcher__active-badge" aria-hidden="true">✓</span>
        </button>
        <button
          class="switcher__delete-btn"
          type="button"
          :aria-label="`Delete explorer ${profile.displayNickname}`"
          title="Delete this explorer"
          @click="askDelete(profile.profileId)"
        >
          🗑
        </button>
      </div>

      <!-- Restore explorer entry -->
      <button
        v-if="profileStore.profiles.length < 5"
        class="switcher__new-btn"
        type="button"
        @click="startRestore"
      >
        <span class="switcher__new-icon" aria-hidden="true">＋</span>
        Restore Explorer
      </button>
    </div>
  </PixelModal>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.switcher {
  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    border-radius: var(--radius-md);
    border: 2px solid var(--color-border-light);

    &--active {
      border-color: var(--color-primary);
      background: rgba(91, 138, 60, 0.08);
    }
  }

  &__profile-btn {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
    background: none;
    border: none;
    cursor: pointer;
    border-radius: var(--radius-md);
    text-align: left;
    transition: background var(--transition-fast);

    &:hover:not(:disabled) {
      background: rgba(91, 138, 60, 0.06);
    }

    &:focus-visible {
      outline: 3px solid var(--color-secondary);
      outline-offset: 2px;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &__avatar {
    line-height: 0;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__profile-info {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__profile-name {
    font-family: var(--font-readable);
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text);
  }

  &__profile-level {
    font-family: var(--font-readable);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-muted);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }

  &__leaf-icon {
    flex-shrink: 0;
  }

  &__active-badge {
    margin-left: auto;
    font-size: 18px;
    color: var(--color-primary);
  }

  &__delete-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--space-3);
    font-size: 18px;
    color: var(--color-text-muted);
    border-radius: var(--radius-sm);
    transition: color var(--transition-fast);
    flex-shrink: 0;

    &:hover { color: var(--btn-red-bg); }
    &:focus-visible { outline: 3px solid var(--color-secondary); outline-offset: 2px; }
  }

  &__new-btn {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    margin-top: var(--space-1);
    background: none;
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    font-family: var(--font-readable);
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--color-text-muted);
    width: 100%;
    transition: all var(--transition-fast);

    &:hover { border-color: var(--color-primary); color: var(--color-primary); }
    &:focus-visible { outline: 3px solid var(--color-secondary); outline-offset: 2px; }
  }

  &__new-icon { font-size: 22px; }

  &__confirm {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-4) 0;
  }

  &__confirm-text {
    font-family: var(--font-body);
    font-size: var(--text-base);
    color: var(--color-text);
    text-align: center;
    line-height: 1.6;
  }

  &__confirm-actions {
    display: flex;
    gap: var(--space-3);
  }

  &__restore {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-2) 0;
  }

  &__restore-header {
    text-align: center;
    h3 {
      font-family: var(--font-readable);
      font-size: var(--text-lg);
      font-weight: 800;
      margin-bottom: var(--space-1);
    }
    p {
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }
  }

  &__restore-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  &__input {
    width: 100%;
    padding: var(--space-3);
    font-family: var(--font-body);
    font-size: var(--text-base);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-sm);
    outline: none;

    &:focus {
      border-color: var(--color-secondary);
    }
  }

  &__error {
    color: var(--btn-red-bg);
    font-size: var(--text-sm);
    text-align: center;
  }
}
</style>
