<script setup lang="ts">
import { ref } from 'vue'
import PixelModal from './PixelModal.vue'
import PixelButton from './PixelButton.vue'

const infoOpen = ref(false)
</script>

<template>
  <div class="parent-backup-card" role="region" aria-label="Parent Backup">
    <div class="parent-backup-card__icon" aria-hidden="true">🔒</div>
    <div class="parent-backup-card__body">
      <div class="parent-backup-card__title">Parent Backup</div>
      <div class="parent-backup-card__badge">Coming Soon</div>
      <p class="parent-backup-card__desc">
        Protect your explorer's progress across devices.
      </p>
    </div>
    <PixelButton variant="gray" size="sm" @click="infoOpen = true">
      Learn More
    </PixelButton>

    <PixelModal v-model="infoOpen" title="Parent Backup" max-width="400px">
      <div class="parent-backup-card__modal-content">
        <p>
          A grown-up can link an email address to back up your explorer's progress.
          This means your explorer can be restored on a new device — no data lost!
        </p>
        <p class="parent-backup-card__modal-note">
          🔧 This feature is coming soon. We're working hard to make it safe and easy.
        </p>
      </div>
    </PixelModal>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.parent-backup-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  box-shadow: 2px 2px 0 var(--color-border);

  &__icon {
    font-size: 36px;
    flex-shrink: 0;
    opacity: 0.7;
  }

  &__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  &__title {
    font-family: var(--font-readable);
    font-size: var(--text-lg);
    font-weight: 800;
    color: var(--color-text);
  }

  &__badge {
    display: inline-block;
    background: var(--color-secondary);
    color: var(--color-text);
    font-family: var(--font-readable);
    font-size: var(--text-xs);
    font-weight: 800;
    padding: 2px 8px;
    border-radius: var(--radius-full);
    align-self: flex-start;
  }

  &__desc {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    margin: 0;
  }

  &__modal-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    p {
      font-family: var(--font-body);
      font-size: var(--text-base);
      color: var(--color-text);
      line-height: 1.6;
      margin: 0;
    }
  }

  &__modal-note {
    color: var(--color-text-muted) !important;
    font-size: var(--text-sm) !important;
    font-style: italic;
  }
}
</style>
