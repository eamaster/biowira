<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Animal } from '@/domain/animal'
import type { FunFact } from '@/domain/funFact'
import { resolveDemoFunFactUnlockAnimal, DEMO_FUN_FACT_UNLOCK_ANIMALS } from '@/domain/demoFunFactUnlocks'
import { useAnimalFunFactUnlockStore } from '@/stores/animalFunFactUnlockStore'
import { useFunFactStore } from '@/stores/funFactStore'
import PixelButton from '@/components/ui/PixelButton.vue'
import FunFactCard from '@/features/fun-facts/components/FunFactCard.vue'
import FunFactModal from '@/features/fun-facts/components/FunFactModal.vue'
import { useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/app/config'

const props = defineProps<{
  animal: Animal
}>()

const router = useRouter()
const unlockStore = useAnimalFunFactUnlockStore()
const funFactStore = useFunFactStore()

// ── Demo unlock resolution ────────────────────────────────────────────────────

const demoAnimal = computed(() =>
  resolveDemoFunFactUnlockAnimal({
    animalVisualKey: props.animal.visualKey,
    animalId: props.animal.id,
    animalName: props.animal.commonName,
    scientificName: props.animal.scientificName,
  }),
)

const isDemoEligible = computed(() => demoAnimal.value !== null)

const isUnlocked = computed(() => {
  if (!demoAnimal.value) return false
  return unlockStore.isAnimalFactsUnlocked(demoAnimal.value.canonicalId)
})

// ── Facts loading ─────────────────────────────────────────────────────────────

const animalListItem = computed(() => ({
  listKey: props.animal.id,
  backendId: props.animal.id,
  commonName: props.animal.commonName,
  scientificName: props.animal.scientificName,
  category: props.animal.category,
  conservationStatus: props.animal.conservationStatus,
  iconEmoji: props.animal.iconEmoji,
  visualKey: props.animal.visualKey,
  imageUrl: props.animal.imageUrl,
  imageAttribution: props.animal.imageAttribution,
}))

async function loadFacts() {
  if (isUnlocked.value && props.animal.id) {
    await funFactStore.loadAnimalFacts(animalListItem.value)
  }
}

onMounted(() => void loadFacts())

watch(isUnlocked, (unlocked) => {
  if (unlocked) void loadFacts()
})

const facts = computed(() => funFactStore.getAnimalFacts(props.animal.id))
const isLoadingFacts = computed(() => funFactStore.isLoadingAnimalFacts(props.animal.id))

// ── Quiz navigation ───────────────────────────────────────────────────────────

function goToQuizUnlock() {
  router.push({
    name: ROUTE_NAMES.quiz,
    query: {
      animal: props.animal.id,
      animalName: props.animal.commonName,
      animalSci: props.animal.scientificName,
      animalVisualKey: props.animal.visualKey ?? '',
      unlockFacts: '1',
    },
  })
}

// ── Demo animal names list for the unsupported message ────────────────────────
const demoAnimalNames = DEMO_FUN_FACT_UNLOCK_ANIMALS.map((a) => a.displayName).join(', ')

// ── Modal state ───────────────────────────────────────────────────────────────
const showModal = ref(false)
const selectedFact = ref<FunFact | null>(null)

function openFact(fact: FunFact) {
  selectedFact.value = fact
  showModal.value = true
}
</script>

<template>
  <section class="animal-fun-facts" aria-label="Fun Facts">
    <h3 class="animal-fun-facts__heading">
      <span aria-hidden="true">📖</span> Fun Facts
    </h3>

    <!-- ── Demo-eligible but locked ─────────────────────────────────────────── -->
    <div
      v-if="isDemoEligible && !isUnlocked"
      class="animal-fun-facts__locked"
      role="note"
      aria-label="Fun facts locked"
    >
      <div class="animal-fun-facts__locked-icon" aria-hidden="true">🔒</div>
      <p class="animal-fun-facts__locked-text">
        Complete this animal's quiz to unlock all fun facts.
      </p>
      <PixelButton variant="orange" size="md" @click="goToQuizUnlock">
        Unlock with Quiz
      </PixelButton>
    </div>

    <!-- ── Demo-eligible and unlocked ───────────────────────────────────────── -->
    <template v-else-if="isDemoEligible && isUnlocked">
      <div v-if="isLoadingFacts" class="animal-fun-facts__loading" role="status">
        <span aria-hidden="true">🍃</span> Loading fun facts…
      </div>
      <div v-else-if="facts.length === 0" class="animal-fun-facts__empty">
        No fun facts found for this animal yet.
      </div>
      <ul v-else class="animal-fun-facts__grid" role="list">
        <li v-for="fact in facts" :key="fact.id" role="listitem">
          <FunFactCard
            :fact="{ ...fact, accessStatus: 'unlocked', isLocked: false, levelsNeeded: 0 }"
            variant="compact-profile"
            @open-fact="openFact($event)"
          />
        </li>
      </ul>
    </template>

    <!-- ── Not in demo unlock list ──────────────────────────────────────────── -->
    <div v-else class="animal-fun-facts__unsupported" role="note">
      <p class="animal-fun-facts__unsupported-text">
        Fun fact unlocks are available for {{ demoAnimalNames }} in this demo.
      </p>
    </div>

    <!-- Modal for expanded fact -->
    <FunFactModal v-model="showModal" :fact="selectedFact" />
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/tokens' as *;

.animal-fun-facts {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  &__heading {
    font-family: var(--font-readable);
    font-size: var(--text-base);
    font-weight: 800;
    color: var(--color-text);
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  // Locked panel
  &__locked {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--color-bg-card);
    border: 2px dashed rgba(200, 160, 0, 0.5);
    border-radius: var(--radius-md);
    text-align: center;
  }

  &__locked-icon {
    font-size: 28px;
    line-height: 1;
  }

  &__locked-text {
    font-family: var(--font-readable);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text-muted);
    line-height: 1.4;
    margin: 0;
  }

  // Loading / empty
  &__loading,
  &__empty {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3);
    background: var(--color-bg-card);
    border: 2px solid var(--color-border-light);
    border-radius: var(--radius-md);
    font-family: var(--font-readable);
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-text-muted);
  }

  // Facts grid
  &__grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: var(--space-4);

    @media (max-width: $bp-sm) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  // Unsupported animals note
  &__unsupported {
    padding: var(--space-3) var(--space-4);
    background: var(--color-bg);
    border: 2px solid var(--color-border-light);
    border-radius: var(--radius-md);
  }

  &__unsupported-text {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-muted);
    margin: 0;
    line-height: 1.5;
    text-align: center;
  }
}
</style>
