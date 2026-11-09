<script setup lang="ts">
import { computed } from 'vue'
import PixelAppShell from '@/components/layout/PixelAppShell.vue'
import InitialAppLoader from '@/components/ui/InitialAppLoader.vue'
import { useAppBootstrapStore } from '@/stores/appBootstrapStore'

const bootstrapStore = useAppBootstrapStore()
const isReady = computed(() => bootstrapStore.isReady)
</script>

<template>
  <!--
    Show InitialAppLoader until all critical assets are ready.
    Once isReady flips to true, fade it out and reveal the full app shell.
    Using separate v-if keys ensures the Transition correctly unmounts the loader.
  -->
  <Transition name="bw-bootstrap" mode="out-in">
    <InitialAppLoader v-if="!isReady" key="loader" />
    <PixelAppShell v-else key="shell">
      <div class="route-shell">
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" class="route-view-root" />
          </Transition>
        </RouterView>
      </div>
    </PixelAppShell>
  </Transition>
</template>

<style scoped lang="scss">
/* ── Route content layout ─────────────────────────────────────────── */
.route-shell {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.route-view-root {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* ── Bootstrap loader → app shell transition ─────────────────────── */
.bw-bootstrap-enter-active,
.bw-bootstrap-leave-active {
  transition: opacity 0.4s ease;
}

.bw-bootstrap-enter-from,
.bw-bootstrap-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .bw-bootstrap-enter-active,
  .bw-bootstrap-leave-active {
    transition: none;
  }
}

/* ── Route transition ─────────────────────────────────────────────── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
