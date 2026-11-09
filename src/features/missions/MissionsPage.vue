<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/app/config'
import { useMissionStore } from '@/stores/missionStore'

import MissionLocationPicker from './components/MissionLocationPicker.vue'
import MissionWeatherChip from './components/MissionWeatherChip.vue'
import MissionCard from './components/MissionCard.vue'
import BioWiraScenePage from '@/components/layout/BioWiraScenePage.vue'

const router = useRouter()
const missionStore = useMissionStore()

// Guard against double-tap while saving
const completing = ref(false)

async function handleStart() {
  await missionStore.startMission()
}

async function handleComplete() {
  if (completing.value) return
  completing.value = true
  try {
    await missionStore.completeMission()
    if (!missionStore.missionError) {
      await router.push({ name: ROUTE_NAMES.missionResult })
    }
  } finally {
    completing.value = false
  }
}

async function handleNewMission() {
  await missionStore.refreshMission()
}

async function onLocationChange(locationId: string) {
  await missionStore.selectLocation(locationId)
}
</script>

<template>
  <BioWiraScenePage
    title="Nature Missions"
    subtitle="Try small real-world actions that help nature around you."
    content-width="wide"
  >
    <div class="missions-page">
      <div class="missions-page__content">
        <!-- Location & Weather Row -->
        <section class="missions-page__context">
          <MissionLocationPicker
            :model-value="missionStore.selectedLocationId"
            @update:model-value="onLocationChange"
          />
          <MissionWeatherChip
            :loading="missionStore.weatherLoading"
            :display-info="missionStore.weatherDisplay"
          />
        </section>

        <!-- Mission error banner -->
        <div
          v-if="missionStore.missionError && missionStore.missionError !== 'session'"
          class="missions-page__error"
          role="alert"
        >
          <span v-if="missionStore.missionError === 'fetch'">
            We couldn't find a mission right now. Try a different location!
          </span>
          <span v-else-if="missionStore.missionError === 'start'">
            Something went wrong starting your mission. Please try again.
          </span>
          <span v-else-if="missionStore.missionError === 'complete'">
            We couldn't save your mission result. Please try again.
          </span>
        </div>

        <!-- Session expired banner -->
        <div
          v-if="missionStore.missionError === 'session'"
          class="missions-page__error missions-page__error--session"
          role="alert"
        >
          Your explorer session has expired. Please restore your explorer to continue!
        </div>

        <!-- Main Mission Card -->
        <section class="missions-page__active" aria-label="Current mission">
          <MissionCard
            :mission="missionStore.activeMission"
            :loading="missionStore.missionLoading"
            :starting="missionStore.missionStarting"
            :completing="missionStore.missionCompleting || completing"
            @start="handleStart"
            @complete="handleComplete"
            @new-mission="handleNewMission"
          />
        </section>
      </div>
    </div>
  </BioWiraScenePage>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.missions-page {
  display: flex;
  flex-direction: column;
  min-height: 0;
  width: 100%;

  &__content {
    /* Hug mission content; scene page already pads above bottom nav */
    flex: 0 1 auto;
    padding: clamp(var(--space-4), 3vh, var(--space-6));
    display: flex;
    flex-direction: column;
    gap: var(--space-4);

    background: var(--scene-warm-panel-bg);
    border: var(--pixel-border) solid var(--scene-warm-panel-border);
    border-radius: var(--radius-xl);
    box-shadow: var(--scene-warm-panel-shadow);
    backdrop-filter: blur(2px);

    width: min(calc(100% - clamp(24px, 6vw, 72px)), 1180px);
    margin: 0 auto;
  }

  &__context {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
  }

  &__error {
    background: #FFF3E0;
    border: 2px solid #FF9800;
    border-radius: var(--radius-sm);
    padding: var(--space-3) var(--space-4);
    font-family: var(--font-body);
    font-size: var(--text-base);
    font-weight: 600;
    color: #7C4200;
    text-align: center;

    &--session {
      background: #FFF8E7;
      border-color: #E8A020;
      color: #8B5E00;
    }
  }
}
</style>
