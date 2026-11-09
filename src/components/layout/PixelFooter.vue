<script setup lang="ts">
import { sources } from '@/app/attributionSources'
</script>

<template>
  <footer class="app-shell__footer pixel-footer">
    <div class="pixel-footer__content">
      <span class="pixel-footer__label">Data sources</span>
      <ul class="pixel-footer__list">
        <li v-for="(source, index) in sources" :key="source.id" class="pixel-footer__item">
          <a
            :href="source.url"
            target="_blank"
            rel="noopener noreferrer"
            :title="source.descriptor"
            class="pixel-footer__link"
          >
            {{ source.name }}
          </a>
          <span v-if="index < sources.length - 1" class="pixel-footer__separator" aria-hidden="true">&middot;</span>
        </li>
      </ul>
    </div>
  </footer>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.pixel-footer {
  border-top: 1px solid var(--color-border-light);
  padding: var(--space-6) var(--space-4);
  background-color: transparent;
  display: flex;
  justify-content: center;

  @media (max-width: #{$bp-md}) {
    padding-bottom: calc(var(--space-8));
  }

  &__content {
    max-width: var(--max-content-width);
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--space-2) var(--space-3);
    text-align: center;

    @media (min-width: #{$bp-md}) {
      flex-direction: row;
      gap: var(--space-4);
    }
  }

  &__label {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
  }

  &__item {
    display: flex;
    align-items: center;
    line-height: 1.4;
  }

  &__link {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    color: var(--color-text-light);
    text-decoration: none;
    transition: color var(--transition-fast);

    &:hover,
    &:focus-visible {
      color: var(--color-primary);
      text-decoration: underline;
    }
  }

  &__separator {
    color: var(--color-border);
    margin-left: var(--space-2);
    font-size: var(--text-sm);
    user-select: none;
    opacity: 0.6;
  }
}
</style>
