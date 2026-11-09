<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { generateSafeNickname } from '@/app/config'
import PixelButton from '@/components/ui/PixelButton.vue'

const emit = defineEmits<{ update: [nickname: string] }>()

const nickname = ref('')

function shuffle() {
  nickname.value = generateSafeNickname()
  emit('update', nickname.value)
}

onMounted(() => {
  // Auto-generate first nickname on mount
  shuffle()
})
</script>

<template>
  <div class="nickname-picker" aria-label="Choose your explorer name">
    <div class="nickname-picker__display" aria-live="polite" aria-atomic="true">
      {{ nickname }}
    </div>

    <div class="nickname-picker__hint">
      This is your explorer name!<br>Tap the button to get a different one.
    </div>

    <PixelButton variant="orange" size="md" @click="shuffle">
      🎲 Try Another Name
    </PixelButton>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.nickname-picker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  width: 100%;
  max-width: 400px;

  &__display {
    background: rgba(255,255,255,0.15);
    border: 3px solid rgba(255,255,255,0.5);
    border-radius: var(--radius-lg);
    padding: var(--space-5) var(--space-8);
    font-family: var(--font-readable);
    font-size: clamp(20px, 4vw, 28px);
    font-weight: 900;
    color: #fff;
    text-shadow: 1px 1px 0 rgba(0,0,0,0.4);
    text-align: center;
    min-width: 280px;
    animation: pop 0.2s var(--transition-bounce);
    width: 100%;
  }

  &__hint {
    font-family: var(--font-body);
    font-size: var(--text-base);
    color: rgba(255,255,255,0.8);
    text-align: center;
    line-height: 1.6;
  }
}

@keyframes pop {
  0% { transform: scale(0.95); opacity: 0.6; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
