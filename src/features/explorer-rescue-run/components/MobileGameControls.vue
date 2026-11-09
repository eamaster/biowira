<script setup lang="ts">
const emit = defineEmits<{
  leftStart: []
  leftEnd: []
  rightStart: []
  rightEnd: []
  jumpStart: []
  jumpEnd: []
}>()
</script>

<template>
  <div class="mobile-controls" aria-label="Game controls">
    <div class="mobile-controls__left">
      <button
        class="mobile-controls__btn"
        aria-label="Move left"
        @touchstart.prevent="emit('leftStart')"
        @touchend.prevent="emit('leftEnd')"
        @mousedown.prevent="emit('leftStart')"
        @mouseup.prevent="emit('leftEnd')"
      >
        ◀
      </button>
      <button
        class="mobile-controls__btn"
        aria-label="Move right"
        @touchstart.prevent="emit('rightStart')"
        @touchend.prevent="emit('rightEnd')"
        @mousedown.prevent="emit('rightStart')"
        @mouseup.prevent="emit('rightEnd')"
      >
        ▶
      </button>
    </div>
    <div class="mobile-controls__right">
      <button
        class="mobile-controls__btn mobile-controls__btn--jump"
        aria-label="Jump"
        @touchstart.prevent="emit('jumpStart')"
        @touchend.prevent="emit('jumpEnd')"
        @mousedown.prevent="emit('jumpStart')"
        @mouseup.prevent="emit('jumpEnd')"
      >
        ▲
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.mobile-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-4);
  touch-action: none;
  user-select: none;

  &__left {
    display: flex;
    gap: var(--space-2);
  }

  &__right {
    display: flex;
  }

  &__btn {
    width: 56px;
    height: 56px;
    min-height: 44px;
    background: var(--color-bg-nav);
    border: 3px solid var(--color-border);
    border-radius: var(--radius-md);
    color: #fff;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: var(--pixel-shadow);
    -webkit-tap-highlight-color: transparent;
    touch-action: none;
    transition: background 0.1s;

    &:active {
      background: var(--color-primary);
      transform: translateY(2px);
    }

    &--jump {
      background: #4CAF50;
      border-color: #2E7D32;
      width: 64px;
      height: 64px;
    }
  }
}
</style>
