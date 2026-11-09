<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'green' | 'orange' | 'blue' | 'red' | 'yellow' | 'gray'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    fullWidth?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'green',
    size: 'md',
    disabled: false,
    fullWidth: false,
    type: 'button',
  },
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="['pixel-btn', `pixel-btn--${variant}`, `pixel-btn--${size}`, { 'pixel-btn--full': fullWidth }]"
  >
    <slot></slot>
  </button>
</template>

<style scoped lang="scss">
@use '@/styles/pixel' as *;

.pixel-btn {
  @include pixel-button-base;
  color: #fff;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-shadow: 1px 1px 0 rgba(0,0,0,0.3);

  &--full { width: 100%; }

  &--sm {
    font-size: var(--text-sm);
    padding: 8px 16px;
    border-width: 2px;
    min-height: 44px;
  }
  &--md {
    font-size: var(--text-base);
    padding: 12px 24px;
    border-width: 3px;
    min-height: 48px;
  }
  &--lg {
    font-size: var(--text-md);
    padding: 16px 32px;
    border-width: 4px;
    min-height: 52px;
  }

  &--green {
    background: var(--btn-green-bg);
    border: 3px solid var(--btn-green-border);
    box-shadow: 0 4px 0 var(--btn-green-border);
    &:hover:not(:disabled) { background: #43A047; }
    &:active { box-shadow: none; transform: translateY(4px); }
  }
  &--orange {
    background: var(--btn-orange-bg);
    border: 3px solid var(--btn-orange-border);
    box-shadow: 0 4px 0 var(--btn-orange-border);
    &:hover:not(:disabled) { background: #F57C00; }
    &:active { box-shadow: none; transform: translateY(4px); }
  }
  &--blue {
    background: var(--btn-blue-bg);
    border: 3px solid var(--btn-blue-border);
    box-shadow: 0 4px 0 var(--btn-blue-border);
    &:hover:not(:disabled) { background: #1976D2; }
    &:active { box-shadow: none; transform: translateY(4px); }
  }
  &--red {
    background: var(--btn-red-bg);
    border: 3px solid var(--btn-red-border);
    box-shadow: 0 4px 0 var(--btn-red-border);
    &:hover:not(:disabled) { background: #D32F2F; }
    &:active { box-shadow: none; transform: translateY(4px); }
  }
  &--yellow {
    background: var(--btn-yellow-bg);
    border: 3px solid var(--btn-yellow-border);
    box-shadow: 0 4px 0 var(--btn-yellow-border);
    color: var(--color-text);
    text-shadow: none;
    &:hover:not(:disabled) { background: #FFB300; }
    &:active { box-shadow: none; transform: translateY(4px); }
  }
  &--gray {
    background: var(--btn-gray-bg);
    border: 3px solid var(--btn-gray-border);
    box-shadow: 0 4px 0 var(--btn-gray-border);
    &:hover:not(:disabled) { background: #757575; }
    &:active { box-shadow: none; transform: translateY(4px); }
  }
}
</style>
