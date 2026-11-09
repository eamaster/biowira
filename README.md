# BioWira — Malaysian Rainforest Biodiversity App

**BioWira** is a child-friendly **Progressive Web App (PWA)** that helps young learners (age 6–12) discover Malaysian rainforest wildlife through a pixel-art UI, animal discovery, an interactive drawing canvas, gamified quizzes, nature missions, Eco-Comic storybooks, an AI animal companion chatbot, the **Explorer Rescue Run** mini-game, and a collectible **Game Journal** — all unified by a **Leaf Points** progression system across **10 product epics**.

**Course:** FIT5120 Industry Experience Studio — Monash University  
**Production URL:** `https://biowira.pages.dev`  
**Backend API:** `https://biowira.pages.dev/api/v1` (Same-origin via Cloudflare Pages proxy)  
**Direct Worker API:** `https://biowira-api.smah0085.workers.dev`  
**Database:** Cloudflare D1 Edge SQL Database (`biowira-db`)

**Stack:** Vue 3 · TypeScript · Vite · Pinia · Vue Router · SCSS (tokens) · Phaser 3 · PWA (vite-plugin-pwa / Workbox) · Cloudflare Pages · Cloudflare Workers (Hono) · Cloudflare D1 · Vitest · Playwright

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Features](#2-features)
3. [Architecture](#3-architecture)
4. [Project Structure](#4-project-structure)
5. [Getting Started](#5-getting-started)
6. [Environment Variables](#6-environment-variables)
7. [Available Scripts](#7-available-scripts)
8. [Routing & Navigation Guard](#8-routing--navigation-guard)
9. [State Management (Pinia Stores)](#9-state-management-pinia-stores)
10. [Domain & Data Layer](#10-domain--data-layer)
11. [Repository Layer](#11-repository-layer)
12. [Icon Registries](#12-icon-registries)
13. [Design System & SCSS Tokens](#13-design-system--scss-tokens)
14. [Explorer Rescue Run (Phaser game)](#14-explorer-rescue-run-phaser-game)
15. [Eco-Comics Interactive Fiction](#15-eco-comics-interactive-fiction)
16. [AI Animal Companion Chatbot](#16-ai-animal-companion-chatbot)
17. [Animal Sketching](#17-animal-sketching)
18. [Game Journal & Progress Collection](#18-game-journal--progress-collection)
19. [Backend API Contract](#19-backend-api-contract)
20. [Fun Facts — Unlock System](#20-fun-facts--unlock-system)
21. [Leaf Points & Level System](#21-leaf-points--level-system)
22. [Child Profiles & Session](#22-child-profiles--session)
23. [Explorer Animal Picker](#23-explorer-animal-picker)
24. [Missions & Badges](#24-missions--badges)
25. [Testing](#25-testing)
26. [CI/CD & Deployment](#26-cicd--deployment)
27. [PWA & Offline Support](#27-pwa--offline-support)
28. [Code Quality & Tooling](#28-code-quality--tooling)
29. [Known Backend Inconsistencies](#29-known-backend-inconsistencies)
30. [Developer Workflow](#30-developer-workflow)

---

## 1. Project Overview

BioWira covers **all 10 product epics**: child profiles & session (1), animal discovery (2), fun facts & micro-learning (3), gamified quizzes (4), real-world eco-missions (5), Explorer Rescue Run mini-game (6), Eco-Comics interactive fiction (7), AI animal companion chatbot (8), animal sketching canvas (9), and a unified game journal (10). It is fully **API-backed** when a session token is available, with graceful mock fallbacks for offline development and CI.

The primary persona is a **young Malaysian learner**: large touch targets, simple vocabulary, no raw JSON errors in the UI, consistent pixel-art visuals, and a safe child-friendly nickname system (no email or passwords for children).

---

## 2. Features

### Animal Discovery (`/discover`) — Epics 2 & 9
- Category filters: **All / Mammals / Birds / Reptiles / Marine & Freshwater / Amphibians / Insects**
- Animal grid (card list) with detail sheet: conservation status (IUCN-aligned), description, habitat, diet, lifespan
- **Mapbox** occurrence map restricted to Malaysia bounding box
- **Text-to-Speech narration** with word-level highlighting via ElevenLabs backend TTS (`NarrationPlayer.vue` + `useNarrationAudio`)
- Animal icons resolved from `src/app/iconRegistry.ts` (never hardcoded paths in components)
- Conservation statuses: `extinct` → `extinct_in_the_wild` → `critically_endangered` → `endangered` → `vulnerable` → `near_threatened` → `least_concern` → `data_deficient` → `not_evaluated`
- Discovery cards use **WEBP** images from `src/assets/discovery-animals/` via `discoveryAnimalIconRegistry.ts`
- **Animal Sketching** (Epic 9): Sketch button on every animal profile opens `AnimalDrawingCanvas.vue` — Brush / Pen / Pencil / Spray / Chalk / Fill / Shapes / Eraser tools, colour palette, size slider, Undo / Clear / Save-to-device, and an Import panel for AI-styled images (Watercolour, Oil Paint, Pencil, Cartoon, Vintage, Neon, Dreamy, B&W). Powered by `drawingStore`.
- Fun-fact panel (`AnimalFunFactsPanel.vue`) embedded directly in the animal profile sheet

### Fun Facts — Epic 3 (integrated into `/discover`; `/facts` is a legacy redirect)
- All facts (locked + unlocked) fetched per-animal via `GET /api/v1/fun-facts/{animalId}` with `X-Session-Token`
- **Unlocked facts** render as interactive flip-cards; **Locked facts** show 🔒 badge with "Reach Level X"
- Facts sorted by `unlockLevel` ascending → `factOrder`
- `/facts` route **redirects** to `/discover` (preserved for backward compatibility / bookmarks)
- After level-up: dual-layer cache invalidated; next load re-fetches updated access state

### Quizzes (`/quiz`)
- Multiple-choice flow: 1 retry per question, points awarded per correct answer
- **Retry rule**: wrong → `retryQuestion()` activates retry mode → second attempt counted
- Points: `20 per correct answer + 20 bonus for perfect score` (see `appConfig`)
- Progress saved via `POST /api/v1/quizzes/save-progress` (server-authoritative total, not client-computed)
- Results screen at `/quiz/result` with score breakdown and progress panel
- `prepareForQuizEntry()` resets stale completed-run state when re-entering `/quiz`

### Missions (`/missions`) — Epic 5
- **Weather-adaptive missions** from `GET /api/v1/missions/weather-adaptive?weatherCode=&isDay=`
- Location picker (preset Malaysian cities): Kuala Lumpur, Penang, etc.
- State machine: `preview → in_progress → completed`
- Completion via `POST /api/v1/missions/complete` — server-authoritative points + new badges
- Dedicated result page at `/missions/result` (`MissionResultPage.vue`)
- Mission history (`GET /api/v1/missions/history`) and badge shelf (`GET /api/v1/badges`)
- Progress persisted per-profile in localStorage (`bw_mission_{profileId}`)

### Games Hub (`/games`) — Epics 6 & 7
- **Explorer Rescue Run** — Phaser 3 platform mini-game (see [section 14](#14-explorer-rescue-run-phaser-game))
- **Eco-Comics** — AVG-style interactive fiction (see [section 15](#15-eco-comics-interactive-fiction))
- **Animal Quiz** — links to `/quiz`
- **Nature Missions** — links to `/missions`
- **Game Journal** — collectible stamp history (see [section 18](#18-game-journal--progress-collection))

### AI Animal Companion Chatbot — Epic 8
- Floating chat widget powered by `useAnimalChat` composable + `animalChatService`
- Companion mirrors the child's chosen explorer animal; responds in-character with animal-themed expressions
- Appears on Home, Discover, Quiz, and Games pages
- Suggested-question chips + free-text input field; empty-input guard prevents spurious API calls
- Responses are child-safe (ages 6–12), nature-focused, and educationally grounded

### Global UX
- Responsive layout: top nav (desktop ≥ `$bp-md`) / bottom nav (mobile) via `PixelAppShell`
- Main nav: **Home · Discover · Games** (`NAV_ITEMS` in `config.ts`)
- The **Games** tab (`/games`) is a hub launching all game modes
- **Welcome** (`/welcome`): onboarding, explorer creation/restore — redirected to when no session
- `InitialAppLoader.vue` covers the viewport during the pre-mount bootstrap phase
- `PixelLoadingState`, `PixelErrorState`, `PixelEmptyState` for all async UI states
- Child-friendly error copy; never raw API JSON in the UI (`src/utils/apiErrors.ts`)

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Vue 3 SFCs  (features/ + components/)                                   │
│  DiscoverPage (Sketch+Facts) · QuizPage · MissionsPage · Welcome         │
│  GamesPage → ExplorerRescue / EcoComics / GameJournal                   │
│  HomePage (AI Chatbot) · InitialAppLoader (pre-mount bootstrap)          │
├──────────────────────────┬───────────────────────────────────────────────┤
│  Vue Router              │  Pinia Stores                                 │
│  /welcome guard          │  session · profile · progress · discoverStore │
│  session bootstrap       │  funFact · quiz · mission · audioStore        │
│  (main.ts awaits         │  drawingStore · gameJournalStore              │
│   bootstrapSession()     │  appBootstrapStore · animalFunFactUnlockStore │
│   before app.use)        │  explorerRescueProgressStore (feature-scoped) │
│                          │  ecoComicProgressStore (feature-scoped)       │
│                          ├───────────────────────────────────────────────┤
│                          │  Composables                                  │
│                          │  useProgress · useFunFactUnlocks · useAudio   │
│                          │  useNarrationAudio · usePreparedNarrationAudio│
│                          │  useAppAudio · useAnimalChat                  │
│                          │  useExplorerDisplay (Explorer Rescue)         │
├──────────────────────────┴───────────────────────────────────────────────┤
│  Repository factory  src/repositories/index.ts                           │
│  Per-domain: 'api' | 'mock'  (VITE_REPO_*)                               │
│  animals · funFacts · quizzes · profile · session                        │
│  user · missions · badges                                                │
├──────────────────────────────────────────────────────────────────────────┤
│  apiClient  src/services/apiClient.ts                                    │
│  fetch() wrapper — attaches X-Session-Token from localStorage            │
│  joinApiUrl() prevents doubled /api/v1 prefixes                          │
├──────────────────────────────────────────────────────────────────────────┤
│  Cloudflare Serverless Edge Infrastructure                               │
│  Pages: https://biowira.pages.dev  (Frontend PWA bundle)                 │
│  Worker API: Hono.js on Cloudflare Workers edge isolates                 │
│  Database: Cloudflare D1 (biowira-db) distributed edge SQLite            │
│  AI integrations: Google Gemini (Chatbot) + ElevenLabs TTS (Narration)   │
├──────────────────────────────────────────────────────────────────────────┤
│  Phaser 3 (ExplorerRescueScene)                                          │
│  Mounted inside ExplorerRescueGamePage via createExplorerRescueGame()    │
│  Data bridge: sceneContext.ts (setSceneContext / getSceneContext)        │
└──────────────────────────────────────────────────────────────────────────┘
```

**Design principles:**
- **Per-domain repository selection** — each domain (`animals`, `funFacts`, `quizzes`, `profile`, `session`, `user`, `missions`, `badges`) is independently set to `api` or `mock` via `VITE_REPO_*`. Defaults in `src/app/config.ts`.
- **Session-first bootstrap** — `main.ts` awaits `sessionStore.bootstrapSession()` before `app.use(router)` so the navigation guard never races.
- **Asset preloading** — `appBootstrapStore` drives `assetPreloadService` during bootstrap; `InitialAppLoader.vue` covers the viewport until preloading resolves.
- **No raw `localStorage` in features** — always use `storageService` + `STORAGE_KEYS`.
- **No hardcoded API paths in components** — repositories hold all endpoint strings.
- **Typed wire boundaries** — all REST shapes live in dedicated `*Api.dto.ts` files and are mapped to domain models before stores/components ever see them.
- **Dual cache invalidation** — the fun-fact store keeps its own reactive cache AND the API repository has an internal Map cache. Both must be cleared (`invalidateFactsCache()` + `repositories.funFacts.clearCache()`) to guarantee fresh data after a level-up.
- **Icon registry isolation** — explorer profile icons (SVG, `public/icons/animals/`) and discovery card icons (WEBP, `src/assets/discovery-animals/`) use completely separate registries and must never cross-pollinate.
- **Feature-scoped stores** — `explorerRescueProgressStore` and `ecoComicProgressStore` live inside their feature folders and are not part of the global `src/stores/` set.

---

## 4. Project Structure

```
fit5120_frontend/
├── public/
│   ├── icons/
│   │   ├── animals/          # Per-animal SVG pixel icons (e.g. malayan-tiger.svg)
│   │   ├── nav/              # Nav SVG icons (home.svg, discover.svg, …)
│   │   └── rewards/          # Reward/gameplay SVG icons (leaf-level.svg, trophy.svg, …)
│   ├── maps/                 # Malaysia discover map assets (desktop + mobile PNG)
│   ├── backgrounds/          # Pixel-art backgrounds (hero, rainforest, etc.)
│   ├── branding/             # PWA icons (192 × 192, 512 × 512) + logos
│   ├── apple-touch-icon.png
│   └── favicon.ico
│   # Note: animal marker sprites resolve from `public/sprites/<key>.png` via
│   # getMarkerSpriteUrl() in config.ts. Drop sprite PNGs there when the art
│   # team ships them — no code changes required.
│
├── e2e/                      # Playwright E2E specs
│   ├── home-discover.spec.ts         # Home + Discover flow
│   ├── home-responsive.spec.ts       # Home responsiveness (390/768/1366)
│   ├── home-animal-chat.spec.ts      # AI chatbot widget
│   ├── fun-facts.spec.ts             # Fun Facts (via Discover)
│   ├── quiz.spec.ts                  # Quiz full flow
│   ├── discover-detail.spec.ts       # Animal detail sheet
│   ├── discover-scene-layout.spec.ts # Scene layout responsiveness
│   ├── games-menu.spec.ts            # Games hub navigation
│   ├── eco-comic-reader.spec.ts      # Eco-Comics reader flow
│   ├── game-journal.spec.ts          # Journal menu + stamp pages
│   ├── explorer-rescue.spec.ts       # Explorer Rescue Run — all viewports
│   └── initial-loading.spec.ts       # InitialAppLoader pre-mount check
│
├── scripts/
│   └── generate-icons.mjs    # PWA icon generation helper
│
├── src/
│   ├── App.vue               # Root component (PixelAppShell wrapper)
│   ├── main.ts               # Pinia → bootstrapSession() → router → mount
│   ├── env.d.ts              # VITE_* type declarations
│   │
│   ├── app/
│   │   ├── config.ts                    # appConfig · STORAGE_KEYS · ROUTE_NAMES
│   │   │                                # NAV_ITEMS · CATEGORY_EMOJI · STATUS_COLORS
│   │   │                                # DISCOVER_MAP_CONFIG · MAPBOX_CONFIG
│   │   │                                # SESSION_OPTIONS · generateSafeNickname()
│   │   ├── branding.ts                  # App name, favicon, PWA icon paths
│   │   ├── iconRegistry.ts              # Explorer SVG + nav + gameplay icon registries
│   │   └── discoveryAnimalIconRegistry.ts  # Discovery WEBP registry (Vite glob-loaded)
│   │
│   ├── assets/
│   │   └── discovery-animals/           # WEBP images for Discover cards
│   │       # Drop new *.webp files here; Vite/discoveryAnimalIconRegistry picks them up
│   │       # automatically — no code change needed.
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── PixelAppShell.vue        # Top + bottom nav wrapper; bottom-nav height token
│   │   │   ├── PixelTopNav.vue          # Desktop navigation
│   │   │   ├── PixelBottomNav.vue       # Mobile navigation
│   │   │   └── PixelFooter.vue          # Global footer
│   │   └── ui/
│   │       ├── AnimalIcon.vue           # Explorer SVG or emoji fallback
│   │       ├── AppIcon.vue              # Generic icon resolver (nav/misc keys)
│   │       ├── GameplayIcon.vue         # Gameplay / reward icon resolver
│   │       ├── DiscoverAnimalIcon.vue   # Discovery WEBP icon (uses discoveryAnimalIconRegistry)
│   │       ├── DiscoverStatIcon.vue     # Stat icons on animal profile sheet
│   │       ├── CitedImage.vue           # Image with attribution caption
│   │       ├── ImageAttributionCaption.vue
│   │       ├── InitialAppLoader.vue     # Full-viewport loader during bootstrap
│   │       ├── ExplorerChip.vue         # Compact active-profile chip
│   │       ├── NarrationPlayer.vue      # Text-to-speech / read-aloud control
│   │       ├── ParentBackupCard.vue     # Profile code + PIN backup UI
│   │       ├── ReadAlongText.vue        # Narration-synced highlighted text
│   │       ├── PixelButton.vue          # Variants: green · orange · blue · red · yellow · gray
│   │       ├── PixelCard.vue
│   │       ├── PixelModal.vue
│   │       ├── PixelBottomSheet.vue
│   │       ├── PixelTabs.vue
│   │       ├── PixelLegend.vue
│   │       ├── PixelPageRibbon.vue      # Pixel-art page header banner
│   │       ├── PixelProgressBar.vue
│   │       ├── PixelProgressChip.vue
│   │       ├── PixelStatusBadge.vue     # Conservation status pill
│   │       ├── PixelLoadingState.vue
│   │       ├── PixelErrorState.vue
│   │       ├── PixelEmptyState.vue
│   │       ├── SharedProgressPanel.vue  # Leaf points + level bar (quiz/mission)
│   │       ├── SwitchExplorerModal.vue
│   │       └── RewardIcon.vue
│   │
│   ├── features/
│   │   ├── welcome/
│   │   │   ├── WelcomePage.vue
│   │   │   ├── components/
│   │   │   │   ├── AvatarPicker.vue              # Explorer animal picker
│   │   │   │   ├── CreateExplorerCard.vue
│   │   │   │   ├── ExplorerProfileCard.vue        # Existing profile card
│   │   │   │   └── SafeNicknamePicker.vue
│   │   │   └── data/
│   │   │       ├── explorerAnimalCatalog.ts       # Curated list (Malaysia order)
│   │   │       ├── loadExplorerAnimalChoices.ts
│   │   │       └── resolveProfileAnimalWireId.ts  # Visual key → backend animal id
│   │   │
│   │   ├── home/
│   │   │   ├── HomePage.vue
│   │   │   ├── homeFeatureCards.ts            # Feature card data (3D carousel items)
│   │   │   └── components/
│   │   │       ├── HomeHeroBanner.vue
│   │   │       ├── HomeFeatureCard.vue         # 3D carousel feature card
│   │   │       ├── HomeActionCard.vue          # role="button" card — whole card is tappable
│   │   │       ├── HomeProgressPanel.vue       # Leaf points / level summary
│   │   │       ├── HomeWoodRibbon.vue          # Decorative wood-panel ribbon
│   │   │       └── ContinueLearningCard.vue
│   │   │
│   │   ├── discover/
│   │   │   ├── DiscoverPage.vue
│   │   │   └── components/
│   │   │       ├── AnimalGridView.vue
│   │   │       ├── AnimalMapView.vue
│   │   │       ├── AnimalListCard.vue
│   │   │       ├── AnimalGridCard.vue
│   │   │       ├── AnimalCardList.vue
│   │   │       ├── AnimalProfileSheet.vue
│   │   │       ├── AnimalFunFactsPanel.vue        # Fun-fact cards inside profile sheet
│   │   │       ├── AnimalDrawingCanvas.vue        # Epic 9 sketch canvas (drawingStore)
│   │   │       ├── AnimalMarker.vue
│   │   │       ├── AnimalOccurrencesMap.vue       # Mapbox GL JS
│   │   │       ├── CategoryFilterChips.vue
│   │   │       └── DiscoverFilterBar.vue
│   │   │
│   │   ├── games/
│   │   │   ├── GamesPage.vue                     # Games hub
│   │   │   └── gameMenuCards.ts                  # Hub card definitions
│   │   │
│   │   ├── quiz/
│   │   │   ├── QuizPage.vue
│   │   │   ├── QuizResultPage.vue
│   │   │   └── components/
│   │   │       ├── QuizOptionButton.vue
│   │   │       ├── QuizFeedbackPanel.vue
│   │   │       └── QuizProgressNav.vue
│   │   │
│   │   ├── missions/
│   │   │   ├── MissionsPage.vue
│   │   │   ├── MissionResultPage.vue              # /missions/result
│   │   │   ├── components/
│   │   │   │   ├── MissionCard.vue
│   │   │   │   ├── MissionLocationPicker.vue
│   │   │   │   ├── MissionWeatherChip.vue
│   │   │   │   ├── MissionHistoryList.vue
│   │   │   │   └── MissionBadgeShelf.vue
│   │   │   └── data/
│   │   │       ├── missionCatalog.ts             # Offline fallback templates
│   │   │       ├── badgeCatalog.ts               # Badge definitions + unlock rules
│   │   │       └── locationCatalog.ts            # Preset Malaysian city coordinates
│   │   │
│   │   ├── eco-comics/                           # Epic 7 — Eco-Comics feature
│   │   │   ├── EcoComicsPage.vue                 # /games/eco-comics storybook library
│   │   │   ├── EcoComicReaderPage.vue            # /games/eco-comics/story/:storyId
│   │   │   ├── components/
│   │   │   │   ├── EcoComicNarrationButton.vue   # Scene audio narration control
│   │   │   │   └── EcoComicsRibbonSubtitle.vue
│   │   │   ├── data/
│   │   │   │   ├── ecoComicStoryCatalog.ts       # All story scenes + choice branches
│   │   │   │   ├── ecoComicAssetRegistry.ts      # Scene image asset registry
│   │   │   │   └── ecoComicPanelLayout.ts        # Panel layout definitions
│   │   │   ├── stores/
│   │   │   │   └── ecoComicProgressStore.ts      # Feature-scoped: endings, stamps, points
│   │   │   └── utils/
│   │   │       └── buildEcoComicNarrationText.ts
│   │   │
│   │   ├── game-journal/                         # Epic 10 — Game Journal
│   │   │   ├── GameJournalMenuPage.vue            # /games/journal — category selector
│   │   │   ├── GameJournalStampPage.vue           # /games/journal/:categoryId
│   │   │   ├── components/
│   │   │   │   ├── JournalBookFrame.vue
│   │   │   │   ├── JournalCategoryCard.vue
│   │   │   │   ├── JournalStamp.vue
│   │   │   │   ├── JournalEmptyNotice.vue
│   │   │   │   ├── JournalPageControls.vue
│   │   │   │   ├── JournalActionBar.vue
│   │   │   │   ├── JournalSideArrow.vue
│   │   │   │   └── renderers/
│   │   │   │       ├── NatureMissionJournalRecord.vue
│   │   │   │       ├── ExplorerRescueJournalRecord.vue
│   │   │   │       └── EcoComicJournalRecord.vue
│   │   │   └── data/
│   │   │       ├── gameJournalCatalog.ts          # Category definitions
│   │   │       ├── gameJournalAssetRegistry.ts    # Stamp + reward image registry
│   │   │       └── journalMissionMapping.ts       # Mission → journal record mapping
│   │   │
│   │   └── explorer-rescue-run/                  # Explorer Rescue Run feature (Phaser)
│   │       ├── ExplorerRescueChapterPage.vue      # /games/explorer-rescue-run
│   │       ├── ExplorerRescueGamePage.vue         # /games/explorer-rescue-run/play
│   │       ├── ExplorerRescueResultPage.vue       # /games/explorer-rescue-run/result
│   │       ├── ExplorerRescueJournalPage.vue      # /games/explorer-rescue-run/journal
│   │       ├── components/
│   │       │   ├── MobileGameControls.vue         # Touch D-pad + jump button
│   │       │   ├── RescueInfoChips.vue            # Explorer / Rainforest / Leaf Points chips
│   │       │   ├── RescueProgressPanel.vue        # 4-step chapter node grid
│   │       │   ├── RescueTraitBadge.vue           # Clue trait badge pill
│   │       │   └── RescueJournalStamp.vue         # Stamp card (locked / unlocked)
│   │       ├── game/
│   │       │   ├── createExplorerRescueGame.ts    # Phaser game factory + singleton management
│   │       │   ├── sceneContext.ts                # setSceneContext / getSceneContext bridge
│   │       │   ├── types.ts                       # RescueTrait · ExplorerRescueRound · Result
│   │       │   └── scenes/
│   │       │       └── ExplorerRescueScene.ts     # Phaser scene (physics, player, clues, gates)
│   │       ├── stores/
│   │       │   └── explorerRescueProgress.ts      # Feature-scoped Pinia store
│   │       ├── utils/
│   │       │   ├── explorerRescueStorage.ts       # localStorage adapter (storageService)
│   │       │   ├── roundResolver.ts               # Picks the correct round for the active explorer
│   │       │   └── useExplorerDisplay.ts          # nickname · species · visualKey · fallbackEmoji
│   │       └── data/
│   │           └── explorerRescueRounds.ts        # Round config for all 12 explorer animals
│   │
│   ├── composables/
│   │   ├── useProgress.ts              # Progress shortcuts (level, points, …)
│   │   ├── useFunFactUnlocks.ts        # Mock-mode fact unlock helper
│   │   ├── useAudio.ts                 # ElevenLabs / browser TTS audio composable
│   │   ├── useNarrationAudio.ts        # Unified narration (api = ElevenLabs, browser = Web Speech)
│   │   ├── usePreparedNarrationAudio.ts # Pre-fetches narration before the user presses play
│   │   ├── useAppAudio.ts              # Global background music / SFX bridge
│   │   └── useAnimalChat.ts            # AI companion chatbot composable
│   │
│   ├── stores/
│   │   ├── sessionStore.ts           # Bootstrap, activeProfile, switch, clear
│   │   ├── profileStore.ts           # Profile CRUD + progress patches
│   │   ├── progressStore.ts          # Leaf points / level — session-isolated
│   │   ├── discoverStore.ts          # Animals, filters, selection, map
│   │   ├── funFactStore.ts           # Fact-centric grid, eager load, cache invalidation
│   │   ├── quizStore.ts              # Quiz flow, scoring, save-progress API call
│   │   ├── missionStore.ts           # Weather mission state machine + history + badges
│   │   ├── audioStore.ts             # Global audio state (music theme, SFX, mute)
│   │   ├── drawingStore.ts           # Sketch canvas state + tool/colour selection
│   │   ├── gameJournalStore.ts       # Unified journal aggregation across all game categories
│   │   ├── appBootstrapStore.ts      # Asset preload state; drives InitialAppLoader
│   │   └── animalFunFactUnlockStore.ts # Tracks per-animal demo-mode unlock overrides
│   │
│   ├── domain/
│   │   ├── enums.ts                     # AnimalCategory, ConservationStatus, HabitatZone, QuizAnswerResult
│   │   ├── animal.ts                    # Animal, AnimalListItem, AnimalOccurrence
│   │   ├── animalApi.dto.ts             # AnimalCardApiDto, AnimalDetailApiDto, mappers
│   │   ├── animalCategoryMap.ts         # Backend category string → domain enum
│   │   ├── animalMapping.test.ts        # Co-located unit tests for animal mapping helpers
│   │   ├── animalVisuals.ts             # Scientific/common name → visual key resolver
│   │   ├── animalTraitResolution.ts     # Resolves comparable ecological traits across animals
│   │   ├── animalChat.ts                # AnimalChatMessage domain type
│   │   ├── buildAnimalNarrationText.ts  # Assembles narration script from animal fields
│   │   ├── conservationMapping.ts       # Backend statusCode → ConservationStatus
│   │   ├── discoverFocus.ts             # Selects the "focus" animal for the discover hero
│   │   ├── funFact.ts                   # FunFact domain model, FunFactApiDto, mapper
│   │   ├── funFactAccess.ts             # resolveFunFactAccessState() — lock precedence resolver
│   │   ├── funFactSelection.ts          # sortFunFactsForDisplay(), pickPrimaryUnlockedFact()
│   │   ├── demoFunFactUnlocks.ts        # Demo-mode unlock overrides for animalFunFactUnlockStore
│   │   ├── gameJournal.ts               # JournalEntry, JournalCategory domain types
│   │   ├── imageAttribution.ts          # CitedImage domain type + attribution registry
│   │   ├── appAudio.ts                  # AudioTheme type + route-theme map
│   │   ├── pointsCurrency.ts            # Formats "Leaf Points" labels / pluralisation
│   │   ├── quiz.ts                      # Quiz, QuizQuestion, QuizAttempt, QuizResult
│   │   ├── quizApi.dto.ts               # ApiQuizSummary, ApiQuizQuestion, mapBackendQuizToDomain
│   │   ├── quizRelevance.ts             # Ranks / filters quizzes by relevance to the profile
│   │   ├── session.ts                   # ChildProfile, SessionState, CreateProfileInput, …
│   │   ├── profileApi.dto.ts            # Wire ↔ domain mappers for profile endpoints
│   │   ├── profileAnimalMigration.ts    # Legacy avatarKey → animalId migration
│   │   ├── mission.ts                   # MissionInstance domain model
│   │   ├── missionApi.dto.ts            # RewardProgressDto, mission endpoint DTOs
│   │   ├── badgeApi.dto.ts              # BackendBadge, NewBadgeDto
│   │   ├── user.ts                      # UserProgress, LEVEL_DEFINITIONS, getLevelForPoints()
│   │   ├── weather.ts                   # NormalizedWeather, getWeatherDisplay()
│   │   └── index.ts                     # Re-exports AppConfig, RepoSource, RepoSources
│   │
│   ├── repositories/
│   │   ├── interfaces.ts          # IAnimalRepository, IFunFactRepository (clearCache()),
│   │   │                          # IQuizRepository, IProfileRepository, ISessionRepository,
│   │   │                          # IMissionRepository, IBadgeRepository, IUserRepository
│   │   ├── index.ts               # createRepositories() factory — mock vs api per domain
│   │   ├── mock/
│   │   │   ├── mockAnimalRepository.ts
│   │   │   ├── mockFunFactRepository.ts    # clearCache() no-op; pulls from MOCK_FUN_FACTS
│   │   │   ├── mockQuizRepository.ts
│   │   │   ├── mockProfileRepository.ts   # localStorage-backed; auto-migrates legacy profiles
│   │   │   ├── mockSessionRepository.ts
│   │   │   ├── mockUserRepository.ts
│   │   │   ├── mockMissionRepository.ts
│   │   │   └── mockBadgeRepository.ts
│   │   └── api/
│   │       ├── apiAnimalRepository.ts
│   │       ├── apiFunFactRepository.ts    # Two-layer cache (Map + allCache); clearCache()
│   │       ├── apiQuizRepository.ts       # saveProgress() → POST /quizzes/save-progress
│   │       ├── apiProfileRepository.ts    # create/restore/current; local catalog mirror
│   │       ├── apiSessionRepository.ts    # bootstrapSession() via GET /profiles
│   │       ├── apiUserRepository.ts
│   │       ├── apiMissionRepository.ts
│   │       └── apiBadgeRepository.ts
│   │
│   ├── services/
│   │   ├── apiClient.ts            # fetch wrapper; joinApiUrl(); X-Session-Token injection
│   │   ├── storageService.ts       # localStorage get/set/remove typed abstraction
│   │   ├── weatherService.ts       # Open-Meteo wrapper; returns NormalizedWeather
│   │   ├── narrationService.ts     # ElevenLabs cached TTS: generateNarrationTts() + resolveNarrationAudioUrl()
│   │   ├── appAudioService.ts      # Background music playback; route-based theme switching
│   │   ├── assetPreloadService.ts  # Preloads critical images before app renders
│   │   ├── animalChatService.ts    # AI chatbot API wrapper (child-safe responses)
│   │   └── deviceInfo.ts           # getDeviceInfo() — sent with create/restore profile
│   │
│   ├── utils/
│   │   ├── security.ts            # generatePin() — 4-digit PIN for profile restore
│   │   ├── apiErrors.ts           # messageForExplorerCreateFailure() — child-friendly errors
│   │   ├── htmlEscape.ts
│   │   └── narrationTokenize.ts
│   │
│   ├── mocks/
│   │   ├── animals.ts             # MOCK_ANIMALS (≥10 with map positions)
│   │   ├── funFacts.ts            # MOCK_FUN_FACTS (12 facts, various unlock levels)
│   │   ├── quizzes.ts             # MOCK_QUIZZES (≥1 quiz, ≥5 questions each)
│   │   └── userProgress.ts        # Mock UserProgress initial state
│   │
│   ├── styles/
│   │   ├── tokens.scss            # Design tokens (colors, spacing, fonts, breakpoints)
│   │   ├── global.scss            # CSS reset + global base
│   │   └── pixel.scss             # Pixel-art aesthetic utilities
│   │
│   └── test/                      # Vitest unit tests (34 files)
│       ├── smoke.test.ts
│       ├── funFactAccess.test.ts
│       ├── animalFunFactUnlockStore.test.ts
│       ├── animalApi.dto.test.ts
│       ├── profileApi.dto.test.ts
│       ├── quizApiMapping.test.ts
│       ├── quizCompletion.test.ts
│       ├── quizRelevance.test.ts
│       ├── missions.test.ts
│       ├── repoFactory.test.ts
│       ├── explorerAnimalCatalog.test.ts
│       ├── resolveProfileAnimalWireId.test.ts
│       ├── apiErrors.test.ts
│       ├── weatherService.test.ts
│       ├── badgeApi.dto.test.ts
│       ├── narration.test.ts
│       ├── discoverFocus.test.ts
│       ├── gamesHub.test.ts
│       ├── discoveryAnimalIconRegistry.test.ts
│       ├── explorerRescue.test.ts
│       ├── explorerRescueGamePageLayout.test.ts
│       ├── gameJournal.test.ts
│       ├── journalAssetRegistry.test.ts
│       ├── ecoComicReaderLayout.test.ts
│       ├── ecoComicNarrationAssets.test.ts
│       ├── audioSystem.test.ts
│       ├── assetPreload.test.ts
│       ├── homePageAssets.test.ts
│       ├── scenePagesLayout.test.ts
│       ├── demoFunFactUnlocks.test.ts
│       ├── imageAttribution.test.ts
│       ├── imageAttributionCaption.test.ts
│       ├── citedImage.test.ts
│       ├── discoverImageAttributionUi.test.ts
│       └── (+ src/domain/animalMapping.test.ts co-located)
│
├── .env.example               # Template — copy to .env
├── .env                       # Gitignored — your local overrides
├── .gitignore
├── .npmrc
├── .prettierrc.json
├── eslint.config.js
├── index.html
├── package.json
├── playwright.config.ts
├── tsconfig.json
├── tsconfig.app.json          # Strict TS for src/ (excludes test files)
├── tsconfig.node.json         # For vite.config.ts / vitest.config.ts
├── vite.config.ts             # Vue + PWA + dev proxy (/api → api.biowira.dpdns.org)
├── vitest.config.ts           # happy-dom env; merges viteConfig
├── vitest.setup.ts            # Forces all VITE_REPO_* = 'mock' for unit tests
└── README.md
```

---

## 5. Getting Started

### Prerequisites

| Tool    | Version requirement |
|---------|---------------------|
| Node.js | `^20.19.0` or `>=22.12.0` (see `engines` in `package.json`) |
| npm     | Bundled with Node; no separate install needed |

### Quick start

```bash
git clone <repository-url>
cd fit5120_frontend
npm install
cp .env.example .env
# Edit .env — at minimum set VITE_MAPBOX_ACCESS_TOKEN for the Discover map
npm run dev
```

Default dev URL: **http://localhost:5173** (Vite auto-increments port if taken).

Vite proxies `/api` → `https://api.biowira.dpdns.org` in dev so all `apiClient` calls work out of the box without any backend on your machine.

### Full pre-submit validation

```bash
npm run type-check   # must be zero errors
npm run lint         # must be zero errors (warnings OK)
npm run test         # all unit tests pass
npm run build        # production build must succeed
```

---

## 6. Environment Variables

Copy `.env.example` to `.env`. Vite only injects variables prefixed with `VITE_`.

### Core Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `/api/v1` | API prefix including version. Repositories use clean relative paths (`/animals`, `/profiles`, …); `joinApiUrl()` concatenates. |
| `VITE_USE_MOCK` | `false` | Legacy global flag. Per-domain `VITE_REPO_*` always takes precedence. |
| `VITE_SESSION_ENABLED` | `true` | Set `false` to bypass the `/welcome` redirect guard (e2e tests, Playwright web server). |
| `VITE_APP_VERSION` | `0.1.0` | App version string exposed in branding. |
| `VITE_MAPBOX_ACCESS_TOKEN` | _(empty)_ | Required for Discover occurrence map; inject via CI secret in GitHub Actions. |
| `VITE_WEATHER_API_BASE_URL` | _(optional)_ | Override the Open-Meteo base URL (defaults to `https://api.open-meteo.com/v1`). |
| `VITE_BASE_PATH` | `/` | Deployment base path for branch/iteration deployments (e.g. `/ver1/`). |
| `VITE_DEV_API_ORIGIN` | `https://api.biowira.dpdns.org` | Override the API host that Vite's dev proxy forwards to. |
| `VITE_NARRATION_SOURCE` | `api` | `api` = BioWira backend ElevenLabs cached TTS (default); `browser` = Web Speech API explicit dev fallback. Never put ElevenLabs keys in `.env`. |
| `VITE_TTS_VOICE_ID` | `rCmVtv8cYU60uhlsOo1M` | ElevenLabs voice ID sent to the backend. Backend uses it to key the PostgreSQL TTS cache. |
| `VITE_TTS_MODEL_ID` | `eleven_v3` | ElevenLabs model ID sent to the backend. |
| `VITE_TTS_SPEED` | `1` | TTS playback speed (positive number; invalid/missing values fall back to `1`). |

### Per-domain Repository Source (`VITE_REPO_*`)

Each variable accepts `api` or `mock`. Invalid or missing values fall back to the default in `src/app/config.ts`.

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_REPO_ANIMALS` | `api` | `GET /animals`, detail, occurrences |
| `VITE_REPO_SESSION` | `api` | Session bootstrap / logout |
| `VITE_REPO_PROFILE` | `api` | Child profiles create / restore / current |
| `VITE_REPO_USER` | **`mock`** | In-memory user progress; `/api/user/*` does not exist in backend contract |
| `VITE_REPO_FUN_FACTS` | `api` | Fun facts per animal |
| `VITE_REPO_QUIZZES` | `api` | Quiz list, questions, save-progress |
| `VITE_REPO_MISSIONS` | `api` | Weather-adaptive missions, assign, start, complete, history |
| `VITE_REPO_BADGES` | `api` | `GET /badges` for badge shelf |

> **Unit tests** (`vitest.setup.ts`) override **all** domains to **`mock`** so CI never makes real network calls.

> **Playwright web server** (`playwright.config.ts`) sets `VITE_SESSION_ENABLED=false` so e2e can navigate to any page without a profile session.

---

## 7. Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server with HMR + API proxy |
| `npm run build` | `vue-tsc -b` type check + Vite production build to `dist/` |
| `npm run preview` | Serve `dist/` locally (mirrors production) |
| `npm run type-check` | `vue-tsc --noEmit` — zero-error requirement |
| `npm run lint` | ESLint on `src/**/*.{ts,vue}` |
| `npm run lint:fix` | ESLint with `--fix` |
| `npm run format` | Prettier on `src/` |
| `npm run test` | Vitest single run (all unit tests) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Playwright E2E (starts dev server automatically) |
| `npm run test:e2e:ui` | Playwright interactive UI |
| `npm run test:e2e:ci` | Playwright, 1 worker, headless (CI) |
| `npm run generate:icons` | PWA icon generation via `scripts/generate-icons.mjs` |

---

## 8. Routing & Navigation Guard

| Path | Route name | Component |
|------|------------|-----------|
| `/welcome` | `welcome` | `WelcomePage` |
| `/` | `home` | `HomePage` |
| `/discover` | `discover` | `DiscoverPage` |
| `/facts` | — | **redirect** → `/discover` (legacy) |
| `/games` | `games` | `GamesPage` |
| `/quiz` | `quiz` | `QuizPage` |
| `/quiz/result` | `quiz-result` | `QuizResultPage` |
| `/missions` | `missions` | `MissionsPage` |
| `/missions/result` | `mission-result` | `MissionResultPage` |
| `/games/eco-comics` | `eco-comics` | `EcoComicsPage` |
| `/games/eco-comics/story/:storyId` | `eco-comic-reader` | `EcoComicReaderPage` |
| `/games/journal` | `game-journal-menu` | `GameJournalMenuPage` |
| `/games/journal/:categoryId` | `game-journal-category` | `GameJournalStampPage` |
| `/games/explorer-rescue-run` | `explorer-rescue` | `ExplorerRescueChapterPage` |
| `/games/explorer-rescue-run/play` | `explorer-rescue-play` | `ExplorerRescueGamePage` |
| `/games/explorer-rescue-run/result` | `explorer-rescue-result` | `ExplorerRescueResultPage` |
| `/games/explorer-rescue-run/journal` | `explorer-rescue-journal` | `ExplorerRescueJournalPage` |
| `/:pathMatch(.*)*` | — | redirect `/` |

All nested Explorer Rescue routes are under `/games/…` so the top nav **Games** link stays active (`top-nav__link--active`).

### Guard decision table (`router/index.ts`)

1. `sessionEnabled === false` → allow (CI / Playwright bypass)
2. Going to `/welcome` → allow
3. `sessionStore.isReady && hasActiveSession` → allow
4. `sessionStore.isReady && !hasActiveSession` → redirect `/welcome`
5. `!sessionStore.isReady` → await `readyPromise` then re-evaluate (safety net only)

### Bootstrap order in `main.ts`

```
createPinia() → app.use(pinia) → bootstrapSession() → app.use(router) → app.mount()
```

This guarantees the guard sees a resolved session state on the very first navigation.

### Route name constants

All route names come from `ROUTE_NAMES` in `src/app/config.ts`. **Never** hardcode route strings or paths in components — always use `ROUTE_NAMES`.

---

## 9. State Management (Pinia Stores)

### `sessionStore` (`stores/sessionStore.ts`)

| Property / Method | Description |
|-------------------|-------------|
| `sessionState` | `'none' \| 'restoring' \| 'choosing' \| 'active'` |
| `activeProfile` | `ChildProfile \| null` — the in-memory active profile |
| `isReady` / `readyPromise` | Bootstrap completion flags |
| `hasActiveSession` | `sessionState === 'active' && activeProfile !== null` |
| `bootstrapSession()` | Reads `bw_session_token` → `GET /profiles` → sets activeProfile |
| `activateProfile(profile)` | Persists session + bumps `lastActiveAt` |
| `switchProfile(profileId)` | Loads profile from catalog + activates |
| `clearSession()` | `DELETE /profiles/session` + clears localStorage token |
| `patchActiveProfile(update)` | In-memory patch (used by quiz/mission after save-progress) |

### `profileStore` (`stores/profileStore.ts`)

| Method | Description |
|--------|-------------|
| `loadProfiles()` | Load from local catalog |
| `createProfile(input)` | `POST /profiles` → stores token → activates |
| `restoreProfile(input)` | `POST /profiles/restore` → stores token → activates |
| `switchToProfile(id)` | Delegates to `sessionStore.switchProfile` |
| `deleteProfile(id)` | Removes from catalog; clears session if active |
| `updateProgress(id, update)` | Persists to local catalog + patches sessionStore |

### `progressStore` (`stores/progressStore.ts`)

Session-aware — all operations route through `sessionStore.activeProfile` when active, never through a shared singleton. This isolates progress per child profile.

| Property | Description |
|----------|-------------|
| `leafPoints` | Current Leaf Points |
| `level` | Current level (1–5) derived from `getLevelForPoints()` |
| `levelTitle` | e.g. "Forest Scout" |
| `levelProgressPercent` | 0–100% progress within the current level |
| `displayName` | Nickname from `activeProfile.displayNickname` |
| `addPoints(n)` | Adds points and persists; used by Explorer Rescue recordCompletion |

### `funFactStore` (`stores/funFactStore.ts`)

| Property | Description |
|----------|-------------|
| `allFacts` | Computed: all facts from all animals (locked + unlocked), sorted by `unlockLevel` → `factOrder` |
| `loadingAllFacts` | True while `fetchAllFacts()` is in flight |
| `animalFactsCache` | `Record<string, FunFact[]>` keyed by `${token}:${animalId}` |
| `expandedFact` | The fact currently open in the modal |

| Action | Description |
|--------|-------------|
| `fetchAllFacts(force?)` | Fetches animals then ALL their facts in parallel; no-op if already cached |
| `loadAnimalFacts(animal, force?)` | Per-animal fetch (called by `fetchAllFacts` + directly) |
| `invalidateFactsCache()` | Clears BOTH store-level cache AND `repositories.funFacts.clearCache()` |
| `openFact(fact)` / `closeFact()` | Modal state |

**Automatic invalidation watchers:**
- `sessionStore.activeProfile?.profileId` changes → clear all caches + `clearCache()`
- `sessionStore.activeProfile?.level` changes → clear all caches + `clearCache()` (fires when quiz/mission patches the profile level)

### `quizStore` (`stores/quizStore.ts`)

- `selectAnswer(answerId)`: creates or updates the attempt for the current question
- `retryQuestion()`: activates retry mode (max 1 retry per question)
- `canProceed()`: true when answered correctly OR retry exhausted
- `finishQuiz()`: computes result → `POST /quizzes/save-progress` → patches profile → `getCurrentProfile()` for authoritative sync
- `prepareForQuizEntry()`: resets stale completed-run on re-entering `/quiz`

### `missionStore` (`stores/missionStore.ts`)

- State machine: `preview → in_progress → completed`
- `completeMission()`: `POST /missions/complete` → patches profile points/level → `getCurrentProfile()` → refreshes history + badges
- Persists `{ selectedLocationId, activeMission }` per profile in `bw_mission_{profileId}`

### `discoverStore` (`stores/discoverStore.ts`)

- `fetchAnimals()`, `setCategory()`, `openAnimalProfile()`, `openOccurrencesMap()`, `closeOccurrencesMap()`
- `filteredAnimals`: computed from `animals` + active category filter

### `audioStore` (`stores/audioStore.ts`)

- Tracks current `audioTheme` (mapped from route `meta.audioTheme`)
- Controls `isMuted`, `volume`, and SFX playback
- `appAudioService` subscribes to store changes and swaps background music tracks

### `drawingStore` (`stores/drawingStore.ts`)

- Holds the active tool, selected colour, brush size, and canvas undo history
- `hasImported` flag enforces the one-import-per-session rule
- Coordinates between `AnimalDrawingCanvas.vue` and toolbar UI

### `gameJournalStore` (`stores/gameJournalStore.ts`)

- Aggregates journal records across all three game categories (Explorer Rescue Run, Eco-Comics, Nature Missions)
- `getRecordsForCategory(categoryId)`: returns all completed records for a category
- `hasRecords(categoryId)`: drives empty-state vs. stamp-page routing in `GameJournalMenuPage`

### `appBootstrapStore` (`stores/appBootstrapStore.ts`)

- `bootstrapState`: `'idle' | 'loading' | 'done' | 'error'`
- Drives `InitialAppLoader.vue` full-viewport overlay until critical assets are preloaded
- `startPreload()`: calls `assetPreloadService.preloadCriticalAssets()` and resolves the overlay

### `animalFunFactUnlockStore` (`stores/animalFunFactUnlockStore.ts`)

- Demo-mode override store: allows a specific animal's facts to be artificially unlocked without a real API session
- Used only in development / demo contexts; `demoFunFactUnlocks.ts` defines the override rules

### `ecoComicProgressStore` (`features/eco-comics/stores/ecoComicProgressStore.ts`)

Feature-scoped store; not part of the global `src/stores/` set.

| Property | Description |
|----------|-------------|
| `unlockedEndings` | Array of ending IDs the user has reached |
| `earnedStamps` | Stamp keys earned from Eco-Comic endings |
| `endingCount` | Total endings unlocked out of total available |

| Method | Description |
|--------|-------------|
| `recordEnding(endingId)` | Awards points/stamp only if ending is new; no duplicate rewards |
| `hasUnlockedEnding(endingId)` | True if already completed |

### `explorerRescueProgressStore` (`features/explorer-rescue-run/stores/explorerRescueProgress.ts`)

Feature-scoped store; not part of the global store set.

| Computed | Description |
|----------|-------------|
| `rainforestRestored` | % forest restored (starts at 25%; increases 15% per first completion) |
| `journalStamps` | Array of earned stamp keys (e.g. `['wild-match-finder']`) |
| `latestResult` | The most recent `ExplorerRescueResult` |
| `completedExplorerIds` | Array of completed explorer animal IDs |

| Method | Description |
|--------|-------------|
| `checkFirstCompletion(explorerAnimalId)` | `true` if this explorer has never been completed |
| `recordCompletion(result)` | Authoritative reward recording — always reads fresh storage, never trusts stale `result.pointsEarned` |
| `reset()` | Resets progress (dev/testing only) |

---

## 10. Domain & Data Layer

### Key types (`src/domain/`)

**`enums.ts`:**
- `AnimalCategory`: `all | mammals | birds | reptiles | marine_freshwater | amphibians | insects`
- `ConservationStatus`: 9 values from `extinct` to `not_evaluated`
- `HabitatZone`: 6 zones
- `QuizAnswerResult`: `correct | wrong | pending`

**`funFact.ts`:**
```typescript
interface FunFact {
  id: string
  animalId: string
  animalName: string
  animalEmoji: string
  animalVisualKey?: string      // for AnimalIcon component
  animalImageUrl?: string       // enriched from GET /animals
  factText: string
  unlockLevel: number
  factOrder?: number            // backend display rank within the animal
  imageUrl?: string             // factImageUrl from API
  isLocked?: boolean            // WARNING: unreliable — use resolveFunFactAccessState()
  accessStatus?: string         // "unlocked" | "locked" — highest priority signal
  levelsNeeded?: number         // how many more levels needed
  userLevel?: number            // profile's current level from backend
  alreadyUnlocked?: boolean     // profile has already seen this fact
}
```

**`user.ts` — Leaf Points levels:**

| Level | Title | Points range |
|-------|-------|-------------|
| 1 | Nature Newbie | 0 – 199 |
| 2 | Animal Explorer | 200 – 499 |
| 3 | Forest Scout | 500 – 999 |
| 4 | Wildlife Guardian | 1000 – 1999 |
| 5 | Rainforest Hero | 2000+ |

---

## 11. Repository Layer

### Interface contract (`src/repositories/interfaces.ts`)

All eight domains have typed interfaces. Key additions:

**`IFunFactRepository`:**
```typescript
getAll(): Promise<FunFact[]>
getById(id: string): Promise<FunFact | null>
getByAnimalId(animalId, context, force?): Promise<FunFact[]>
clearCache(): void   // REQUIRED — purge internal Map; called by funFactStore on level-up
```

### `apiFunFactRepository` — two-layer cache

```
funFactStore.animalFactsCache  →  reactive Vue ref (outer layer)
  └─ apiFunFactRepository.animalFactsCache  →  internal Map (inner layer)
```

Both layers are keyed by `${sessionToken}:${animalId}`. After a level-up, **both** must be cleared — clearing only the outer layer causes `getByAnimalId()` to return stale data from the inner Map. `invalidateFactsCache()` handles both in one call.

### `apiProfileRepository` — local catalog mirror

- Maintains a local catalog in `bw_profiles` (localStorage) that mirrors server data
- `getCurrentProfile()` calls `GET /profiles`, merges with local `animalVisualKey`, re-saves
- `updateProfileProgress()` applies locally only (no `/api/profiles/PATCH` exists in contract)
- Handles legacy `avatarKey` → `animalId` migration via `profileAnimalMigration.ts`

---

## 12. Icon Registries

BioWira uses **two completely separate icon systems** that must never cross-pollinate:

### Explorer / nav icons (`src/app/iconRegistry.ts`)

| Registry | Asset location | Format | Used by |
|----------|---------------|--------|---------|
| `ANIMAL_ICON_MAP` | `public/icons/animals/` | SVG | `AnimalIcon.vue` · Explorer picker |
| `NAV_ICON_MAP` | `public/icons/nav/` | SVG | `AppIcon.vue` · top/bottom nav |
| `GAMEPLAY_ICON_MAP` | `public/icons/rewards/` | SVG | `GameplayIcon.vue` · reward chips |

Functions: `getAnimalIconUrl(key)` · `getNavIconUrl(key)` · `getGameplayIconUrl(key)` · `getRegisteredAnimalIconKeys()`

### Discovery icons (`src/app/discoveryAnimalIconRegistry.ts`)

- Powered by Vite `import.meta.glob('src/assets/discovery-animals/*.webp', { eager: true, query: '?url' })`
- Adding a discovery icon: **drop a `.webp` file** in `src/assets/discovery-animals/` and restart the dev server — no code changes needed
- Alias map for cases where `visualKey` or `commonName` slug don't match the WEBP filename
- Functions: `getDiscoveryAnimalIconUrl({ visualKey, commonName })` · `getDiscoveryAnimalIconKeys()` · `getDiscoveryIconAliases()`
- Used exclusively by `DiscoveryAnimalIcon.vue` — never by the explorer SVG pipeline

### Adding icons — decision tree

```
New animal image for Discover cards?
  → Add *.webp to src/assets/discovery-animals/   (auto-discovered, no code change)

New animal for profile picker / explorer SVG?
  → Add *.svg to public/icons/animals/
  → Register key in ANIMAL_ICON_MAP in iconRegistry.ts

New nav/feature icon?
  → Add *.svg to public/icons/nav/
  → Register key in NAV_ICON_MAP in iconRegistry.ts
  → Add entry to NAV_ITEMS in config.ts with the same iconKey

New reward/gameplay icon?
  → Add *.svg to public/icons/rewards/
  → Register key in GAMEPLAY_ICON_MAP in iconRegistry.ts
```

---

## 13. Design System & SCSS Tokens

All design tokens are defined in `src/styles/tokens.scss` as CSS custom properties and used throughout every component and feature.

### Color palette

| Token | Value | Purpose |
|-------|-------|---------|
| `--color-primary` | `#5B8A3C` | Deep forest green — buttons, accents, active states |
| `--color-secondary` | `#E8A020` | Warm amber / leaf gold — rewards, highlights |
| `--color-accent` | `#4ABFCF` | Sky/water blue — quiz options, info |
| `--color-bg` | `#F5E6C8` | Warm page background |
| `--color-bg-card` | `#FFF8E7` | Cream card surface |
| `--color-bg-dark` | `#3D2B1F` | Dark brown — nav backgrounds |
| `--color-text` | `#3D2B1F` | Main body text |
| `--color-text-muted` | `#A07850` | Muted / label text |
| `--color-border` | `#C8A870` | Pixel-art card borders |

### Spacing scale

| Token | Value |
|-------|-------|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `20px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |
| `--space-10` | `40px` |
| `--space-12` | `48px` |
| `--space-16` | `64px` |

### Breakpoints (SCSS variables)

| Variable | Value |
|----------|-------|
| `$bp-sm` | `480px` |
| `$bp-md` | `768px` |
| `$bp-lg` | `1024px` |
| `$bp-xl` | `1280px` |

### Typography

| Token | Value |
|-------|-------|
| `--font-pixel` | `'Press Start 2P', monospace` — all headings, labels, pixel UI |
| `--font-body` | `'Nunito', 'Segoe UI', sans-serif` — body/prose text |

### Usage in components

```scss
// Every component scoped style block:
@use '@/styles/tokens' as *;

.my-component {
  color: var(--color-text);
  background: var(--color-bg-card);
  padding: var(--space-3);

  @media (max-width: $bp-md) {
    padding: var(--space-2);
  }
}
```

**Rules:**
- Never hardcode hex values or pixel sizes in component styles — always use tokens
- Never override `--color-bg`, `--color-text`, etc. globally without a design decision
- Prefer `var(--space-*)` over raw pixel values for all padding / gap / margin
- Responsive breakpoints use SCSS `$bp-*` variables, not raw numbers

---

## 14. Explorer Rescue Run (Phaser game)

Explorer Rescue Run is a **non-combat, child-friendly platform mini-game** built on **Phaser 3** and embedded inside a Vue page.

### Routes

| Path | Page | Description |
|------|------|-------------|
| `/games/explorer-rescue-run` | `ExplorerRescueChapterPage` | Chapter map, info chips, step nodes, Start Rescue |
| `/games/explorer-rescue-run/play` | `ExplorerRescueGamePage` | Phaser canvas + HUD toolbar + clue panel + mobile controls |
| `/games/explorer-rescue-run/result` | `ExplorerRescueResultPage` | Wild Match result, reward chips, action buttons |
| `/games/explorer-rescue-run/journal` | `ExplorerRescueJournalPage` | Scrapbook — explorer/match cards, stamps, traits, progress |

### Game concept

1. The player runs through a rainforest, jumping on platforms to **collect 3 Clue Leaves** that reveal traits of their explorer animal (e.g. "Rainforest", "Carnivore", "Habitat Loss").
2. After collecting all clues, 3 **Choice Gates** appear. Each gate shows a potential Wild Match animal.
3. The player runs into the correct gate (the animal sharing all 3 traits). Wrong gates flash red and bounce the player back.
4. Correct choice triggers the "See Reward" overlay → player confirms → `recordCompletion()` → navigates to result.

### Architecture

```
ExplorerRescueGamePage.vue
  ├─ createExplorerRescueGame(config)      # Phaser factory (singleton)
  │    ├─ setSceneContext(ctx)             # Bridge: passes round config before Phaser starts
  │    └─ new Phaser.Game({ scene: ExplorerRescueScene })
  │
  ├─ ExplorerRescueScene (Phaser.Scene)
  │    ├─ preload()   → loads explorerIconUrl from sceneContext
  │    ├─ create()    → getSceneContext() → builds world (ground, leaves, gates)
  │    └─ update()    → player physics, mobile controls (mobileLeft/Right/Jump flags)
  │
  ├─ MobileGameControls.vue               # Touch D-pad; emits leftStart/leftEnd/rightStart/rightEnd/jumpStart/jumpEnd
  ├─ RescueTraitBadge.vue                 # Clue panel badges
  └─ PixelButton / AnimalIcon / ...
```

### Phaser singleton management

- `createExplorerRescueGame(config)` — creates and tracks a single `Phaser.Game` instance. Calls `destroyExplorerRescueGame()` first to prevent duplicate canvases on hot-reload or re-entry.
- `destroyExplorerRescueGame()` — destroys the Phaser instance and clears the tracked reference. Always called in `onUnmounted` and before navigating away.
- `getExplorerRescueScene()` — returns the live `ExplorerRescueScene` if active; used for mobile control flag injection.

### Scene context bridge

Phaser's first scene starts automatically without calling `scene.init()`. To pass round config from the Vue layer to the Phaser scene:

```typescript
// Vue side (before new Phaser.Game):
setSceneContext({ round, profileId, explorerIconUrl, ... })

// Phaser scene (in preload / create):
const ctx = getSceneContext()
```

### Reward logic

`explorerRescueProgressStore.recordCompletion(result)` is **authoritative** — it always reads **fresh progress from localStorage** and recalculates whether the run is a first completion or replay. It never trusts `result.pointsEarned` from the scene (which was set at game-start time and could be stale).

| Run type | Leaf Points | Rainforest Restored |
|----------|------------|---------------------|
| First completion | +50 | +15% (capped at 100%) |
| Replay | +5 | unchanged |

### Explorer display composable

`useExplorerDisplay()` in `utils/useExplorerDisplay.ts` provides a single source of truth for what to show across chapter, game, result, and journal pages:

| Return | Description |
|--------|-------------|
| `animalId` | Domain animal ID (e.g. `'malayan-tiger'`) |
| `visualKey` | Icon registry key for `AnimalIcon` (same as `animalId` for most animals) |
| `displayName` | Nickname if available, otherwise species name |
| `animalName` | Species name (e.g. "Malayan Tiger") |
| `fallbackEmoji` | Emoji fallback when no icon is registered |

### Mobile controls & canvas sizing

- `MobileGameControls.vue` is rendered only on viewport widths < 768px (`isMobile` reactive ref in `ExplorerRescueGamePage`)
- Touch buttons set `scene.mobileLeft/Right/Jump = true/false` directly
- The `game-page__canvas` uses **`aspect-ratio: 16/9`** on desktop and **`aspect-ratio: 4/3`** on mobile (≤ 768px)
- `PixelAppShell` already reserves bottom nav space; `game-page__mobile-controls` uses only `padding-bottom: max(var(--space-2), env(safe-area-inset-bottom, 0px))` — **do not add `nav-height-bottom` here**

### Responsive toolbar layout

The game HUD toolbar uses **CSS grid on mobile** (≤ 768px) — 2×2 layout so all four items (Back · Explorer · Clues · Leaf Points) stay aligned:

```
@media (max-width: $bp-md) {
  .game-page__toolbar {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

At ≤380px it collapses to a single column.

### localStorage key

```
bw_explorer_rescue_{profileId}
```

Schema version `{ v: 1, data: ExplorerRescueProgress }` via `storageService`.

### E2E seeding for result page tests

Playwright tests seed the result by setting localStorage before navigation:

```typescript
await page.addInitScript((isFirstCompletion: boolean) => {
  localStorage.setItem('bw_explorer_rescue_guest', JSON.stringify({
    v: 1,
    data: {
      profileId: 'guest',
      rainforestRestored: 40,
      completedExplorerIds: ['malayan-tiger'],
      journalStamps: ['wild-match-finder'],
      latestResult: { /* ExplorerRescueResult fields */ },
      updatedAt: new Date().toISOString(),
    }
  }))
}, true)
```

---

## 15. Eco-Comics Interactive Fiction

Eco-Comics is an AVG-style (Adventure Visual Game) interactive storybook system implemented as a standalone feature under `src/features/eco-comics/`.

### Data model

All story content is statically defined in `ecoComicStoryCatalog.ts` — no API call required. Each story is a directed graph of **scenes**:

```typescript
interface EcoComicScene {
  id: string
  narrationText: string          // used by ElevenLabs TTS narration
  panelLayout: PanelLayoutKey    // how images are arranged on-screen
  imageKeys: string[]            // resolved via ecoComicAssetRegistry.ts
  choices?: EcoComicChoice[]     // branch options (undefined = ending scene)
  isEnding?: boolean
  endingId?: string              // used to record completion in ecoComicProgressStore
}
```

### Reader flow

1. `EcoComicsPage.vue` — lists available stories with cover art and progress badges
2. `EcoComicReaderPage.vue` — renders the current scene panel-by-panel; advances on choice tap
3. `EcoComicNarrationButton.vue` — triggers `usePreparedNarrationAudio` for scene narration
4. On reaching an ending scene, `ecoComicProgressStore.recordEnding(endingId)` is called — awards Leaf Points and a journal stamp exactly once (idempotent)

### Key invariants
- `hideFooter: true, gameLayout: true` on the reader route — no nav chrome during reading
- Narration text is assembled by `buildEcoComicNarrationText.ts`; `ReadAlongText.vue` highlights words in sync
- Asset images resolve via `ecoComicAssetRegistry.ts` (Vite static imports, not runtime fetch)

---

## 16. AI Animal Companion Chatbot

The AI chatbot gives children a personalised learning companion powered by `animalChatService.ts`.

### Architecture
- `useAnimalChat` composable: manages message history, loading state, and error handling
- `animalChatService.ts`: thin wrapper around `POST /api/v1/chat` — sends `{ animalId, message, conversationHistory }`
- The active profile's `animalId` is passed so the backend can respond in-character for that animal species

### UX rules
- Maximum **5 conversation turns** stored in local history (prevents context overflow)
- Suggested-question chips are surfaced when the chat window is empty
- Empty-input guard prevents spurious API calls
- Error state shows a child-friendly fallback ("Oops! My jungle Wi-Fi is bad right now 🌿")
- Chat widget is **non-blocking** — if the API fails, the rest of the page remains usable

---

## 17. Animal Sketching

Animal Sketching (Epic 9) is a free-draw canvas embedded inside the Discover animal profile sheet, implemented in `AnimalDrawingCanvas.vue` + `drawingStore`.

### Canvas tools

| Tool | Description |
|------|-------------|
| Brush | Soft round stroke |
| Pen | Hard-edged stroke |
| Pencil | Textured stroke |
| Spray | Scatter dots |
| Chalk | Dry texture |
| Fill | Flood-fill by colour |
| Shapes | Rectangle / Circle / Line |
| Eraser | Erase to white |

### Import panel (AI Styles)
- Tapping **Import** opens a style picker: Watercolour / Oil Paint / Pencil / Cartoon / Vintage / Neon / Dreamy / B&W
- The backend returns a styled version of the animal's hero image which is stamped onto the canvas
- `drawingStore.hasImported` enforces **one import per session** to prevent API abuse
- `POST /api/v1/animals/{animalId}/sketch-style` → returns `{ imageUrl: string }`

### Save
- **Save to Device**: renders canvas to a PNG blob and triggers a browser download via `<a download>`
- No server-side persistence — sketches are ephemeral unless the child saves locally

### State (`drawingStore`)
- `activeTool`, `activeColour`, `brushSize` — toolbar binding
- `undoHistory: ImageData[]` — max 20 steps
- `hasImported: boolean` — import gate

---

## 18. Game Journal & Progress Collection

The Game Journal (Epic 10) is a cross-feature progress dashboard that aggregates stamps earned across all three game categories.

### Categories

| Category ID | Source | Record renderer |
|-------------|--------|-----------------|
| `explorer-rescue` | `explorerRescueProgressStore` | `ExplorerRescueJournalRecord.vue` |
| `eco-comics` | `ecoComicProgressStore` | `EcoComicJournalRecord.vue` |
| `nature-missions` | `missionStore` history | `NatureMissionJournalRecord.vue` |

### Pages

- **`GameJournalMenuPage.vue`** (`/games/journal`): Shows all three category cards. If a category has no records, the card shows a locked state with a "Play to earn stamps!" prompt.
- **`GameJournalStampPage.vue`** (`/games/journal/:categoryId`): Paginates through earned stamps in a book-frame layout (`JournalBookFrame.vue`). `JournalPageControls.vue` handles prev/next.

### Stamp system

Each completed activity earns a **stamp** — a visual collectible with:
- `stampKey`: resolved to an image via `gameJournalAssetRegistry.ts`
- `earnedAt`: ISO timestamp
- `title` + `description`: child-friendly caption
- Optional `leafPointsAwarded`: displayed as Leaf Points chip

`journalMissionMapping.ts` maps mission template IDs to their corresponding journal stamp metadata.

### Key invariant: stamps are awarded exactly once

Both `ecoComicProgressStore.recordEnding()` and `explorerRescueProgressStore.recordCompletion()` check completion history before awarding points or stamps, making them safe to call multiple times.

---

## 19. Backend API Contract


All endpoints live under `/api/v1/`. The `apiClient` reads `VITE_API_BASE_URL` and prepends it via `joinApiUrl()` which also strips accidental double prefixes.

**Auth:** `X-Session-Token: <token>` header on all protected endpoints (attached automatically by `apiClient`).

### Profiles

| Method | Endpoint | Body / Notes |
|--------|----------|-------------|
| `POST` | `/profiles` | `{ displayName, animalId, pin, deviceInfo }` — create explorer; returns `{ profile, sessionToken, profileCode, pin }` |
| `GET` | `/profiles` | Returns current profile for the active session token |
| `POST` | `/profiles/restore` | `{ profileCode, pin, deviceInfo }` — restore on new device |
| `DELETE` | `/profiles/session` | Log out (invalidates server-side session) |

> There is no `PATCH /profiles` or `POST /profiles/progress`. Progress is applied locally via `updateProfileProgress()` and synced through `getCurrentProfile()` after quiz/mission completion.

### Animals

| Method | Endpoint |
|--------|----------|
| `GET` | `/animals` — list (optionally `?category=mammals` etc.) |
| `GET` | `/animals/{id}` — detail |
| `GET` | `/animals/{id}/occurrence` — occurrence coordinates for Mapbox |

### Fun Facts

| Method | Endpoint | Notes |
|--------|----------|-------|
| `GET` | `/fun-facts` | All facts. **Response does NOT include `animalId` per item.** Frontend uses per-animal endpoint instead. |
| `GET` | `/fun-facts/{animalId}` | Personalised facts for one animal. Requires `X-Session-Token`. Returns `FunFactApiDto[]`. |

**`FunFactApiDto` fields:** `id`, `emoji`, `factText`, `factImageUrl`, `factOrder`, `unlockLevel`, `isLocked`, `accessStatus`, `levelsNeeded`, `userLevel`, `userPoints`, `alreadyUnlocked`

### Quizzes

| Method | Endpoint | Body |
|--------|----------|------|
| `GET` | `/quizzes` | Quiz summaries list |
| `GET` | `/quizzes/{id}/questions` | Questions for a specific quiz |
| `POST` | `/quizzes/save-progress` | `{ totalQuestions, correctAnswers }` — **exactly these two fields**; no `profileId`, no client-computed score |

### Missions

| Method | Endpoint | Body |
|--------|----------|------|
| `GET` | `/missions/weather-adaptive?weatherCode=&isDay=` | Preview based on weather |
| `POST` | `/missions/assign` | `{ missionId, weatherCode, isDay, weatherTemp, locationLat, locationLon }` |
| `POST` | `/missions/start` | `{ profileMissionId }` |
| `GET` | `/missions/history` | Last 3 completed missions |
| `POST` | `/missions/complete` | `{ profileMissionId }` — returns `RewardProgressDto` |

**`RewardProgressDto`:** `{ totalPoints, newLevel, leveledUp, newFactsUnlocked, newBadges }`

### Badges

| Method | Endpoint |
|--------|----------|
| `GET` | `/badges` | All badges (earned + locked) for the active session |

### Chatbot (Google Gemini 1.5 Flash)

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/chat/message` | `{ message, animalName, animalCategory, profileNickname }` | Returns `{ reply }` tailored to the child's age with guardrails and conservation focus. |

### TTS (ElevenLabs cached narration)

| Method | Endpoint | Notes |
|--------|----------|-------|
| `POST` | `/tts/generate` | Body: `{ text, voiceId, modelId, speed }`. Returns JSON metadata — `audioUrl`, `timings`, `textHash`, `cached`. |
| `GET` | `/tts/audio/{textHash}` | Serves the cached audio file (MP3). URL is returned in the `audioUrl` field of the generate response. |

**Narration flow:**

1. `AnimalProfileSheet.vue` builds narration text via `buildAnimalNarrationText(animal)` and passes it to `useNarrationAudio(audioText)`.
2. When the user presses Listen & Learn, `useNarrationAudio` calls `generateNarrationTts()` in `narrationService.ts`.
3. The frontend POSTs `{ text, voiceId, modelId, speed }` to `POST /api/v1/tts/generate`.
4. The Cloudflare Worker backend returns cached or freshly generated JSON metadata including `audioUrl` and word-level `timings`.
5. `resolveNarrationAudioUrl()` converts the absolute `audioUrl` to a same-origin relative path (e.g. `/api/v1/tts/audio/{hash}`) so Pages proxy routes resolve it correctly.
6. The frontend creates `new Audio(resolvedUrl)` and plays it.
7. Word highlighting uses backend `timings` (seconds converted to ms) for precise synchronization.

**Security notes:**
- No ElevenLabs or Gemini API key exists anywhere in the frontend.
- Cloudflare Worker securely owns all secret bindings (`GEMINI_API_KEY`, `ELEVENLABS_API_KEY`) and D1 TTS cache.
- The PWA service worker uses `NetworkOnly` for all `/api/*` routes — audio and chat responses are never cached by the SW.

---

## 20. Fun Facts — Unlock System

### How it works end-to-end

1. `FunFactsPage.vue` calls `store.fetchAllFacts()` on mount
2. `fetchAllFacts()` calls `fetchAnimals()` then `loadAnimalFacts(animal)` in parallel for all animals
3. `loadAnimalFacts()` calls `GET /api/v1/fun-facts/{animalId}` with `X-Session-Token`
4. The backend returns ALL facts for that animal (locked + unlocked) personalised to the profile's current level
5. Facts are stored in `animalFactsCache[${token}:${animalId}]`
6. `allFacts` computed flattens all caches → sorted by `unlockLevel` → `factOrder`
7. `FunFactsPage` renders one `FunFactCard` per fact from `store.allFacts`
8. Each `FunFactCard` resolves its own lock state via `resolveFunFactAccessState(fact)`

### Lock state resolution (`funFactAccess.ts`)

The backend has a known bug where `isLocked` can be `false` even when `accessStatus` is `"locked"`. Use `resolveFunFactAccessState(fact)` which applies this precedence:

| Priority | Field(s) | Rule |
|----------|----------|------|
| 1 (highest) | `accessStatus` | `"unlocked"` → unlocked; `"locked"` → locked |
| 2 | `levelsNeeded` | `> 0` → locked; `<= 0` → unlocked |
| 3 | `userLevel` + `unlockLevel` | `userLevel >= unlockLevel` → unlocked |
| 4 | `isLocked` | Direct boolean (weakest — known bug source) |
| 5 (lowest) | none | `'unknown'` → treat as unlocked (mock mode fallback) |

**Never read `fact.isLocked` directly in components.** Always use `resolveFunFactAccessState(fact).isUnlocked`.

### Cache invalidation after level-up

When a profile levels up (quiz `finishQuiz()` or mission `completeMission()`):
1. Both call `sessionStore.patchActiveProfile({ level: newLevel })`
2. `funFactStore` watcher on `sessionStore.activeProfile?.level` fires
3. Watcher calls `invalidateFactsCache()` which clears:
   - `animalFactsCache.value = {}` (store reactive ref)
   - `repositories.funFacts.clearCache()` (repository internal Map)
4. Next time `FunFactsPage` mounts (or user navigates to `/facts`), `fetchAllFacts()` re-fetches all facts with the updated `X-Session-Token` → backend returns updated `accessStatus` / `levelsNeeded`

---

## 21. Leaf Points & Level System

Points are earned from:
- **Quizzes:** `20 pts × correct answers + 20 bonus for perfect score`
- **Missions:** declared `pointsValue` per mission template (or server-authoritative total from `/missions/complete`)
- **Explorer Rescue Run:** +50 on first completion of any explorer animal; +5 on replay

Level thresholds (defined in `src/domain/user.ts`):
```
Level 1: Nature Newbie      0 – 199 pts
Level 2: Animal Explorer    200 – 499 pts
Level 3: Forest Scout       500 – 999 pts
Level 4: Wildlife Guardian  1000 – 1999 pts
Level 5: Rainforest Hero    2000+ pts
```

Use `getLevelForPoints(points)` and `getLevelProgress(points)` from `src/domain/user.ts`. Never compute levels locally in components.

---

## 22. Child Profiles & Session

Profiles are pseudonymous with no email/password for children. Safe nicknames come from `generateSafeNickname()` in `config.ts` (adjective + noun combinator).

### localStorage Keys (`STORAGE_KEYS`)

| Key | Description |
|-----|-------------|
| `bw_profiles` | Local catalog of known profiles (mirrors server data); also used as sole store in mock mode |
| `bw_active_session` | Used by `MockSessionRepository` only |
| `bw_session_token` | API session token (from create/restore); sent as `X-Session-Token` on every request |
| `bw_seen_unlocks_{profileId}` | IDs of fun facts already acknowledged (glow animation tracking) |
| `bw_mission_{profileId}` | Persisted mission state (location + in-progress mission) |
| `bw_explorer_rescue_{profileId}` | Explorer Rescue progress (rainforestRestored, completedIds, stamps, latestResult) |

All values are stored as `{ v: 1, data: T }` schema envelopes. `storageService.get()` returns `null` on schema version mismatch. **Never** write raw strings to these keys — always go through `storageService`.

**Max profiles per device:** 5 (`SESSION_OPTIONS.maxProfilesPerDevice`)

### Resetting local data during development

```javascript
// In browser DevTools console:
Object.keys(localStorage)
  .filter(k => k.startsWith('bw_'))
  .forEach(k => localStorage.removeItem(k))
location.reload()
```

---

## 23. Explorer Animal Picker

The welcome flow lets children choose an animal avatar for their explorer profile.

- **Icons source:** `getRegisteredAnimalIconKeys()` from `iconRegistry.ts` → only animals with a registered entry in `ANIMAL_ICON_MAP` appear
- **Ordering:** `MALAYSIA_EXPLORER_POPULARITY_ORDER` in `explorerAnimalCatalog.ts` — Malayan Tiger first (national animal), then curated flagship species
- **Metadata enrichment:** `explorerAnimalCatalog.ts` maps visual keys to display names and category emojis; `mocks/animals.ts` provides fallback data
- **Backend ID resolution:** `resolveProfileAnimalWireId()` matches the chosen visual key to the backend's numeric animal ID from `GET /animals` (by visual key → slug → name fuzzy match) before `POST /profiles`
- **Child-friendly errors:** API failures on create use `messageForExplorerCreateFailure()` from `utils/apiErrors.ts`; never shows raw JSON

---

## 24. Missions & Badges

### Weather-adaptive missions

- Fetches current weather via Open-Meteo for the selected city (lat/lon from `locationCatalog.ts`)
- `fetchWeatherForLocation()` normalises Open-Meteo WMO codes to `NormalizedWeather` (`sunny | cloudy | rainy | stormy | unknown`)
- `GET /missions/weather-adaptive?weatherCode=&isDay=` returns a mission preview tailored to outdoor safety
- On weather fetch failure: falls back to `isOutdoorSafe: false` → indoor mission

### Badges

- Fetched from `GET /api/v1/badges` after each mission completion
- `recentlyEarnedBadges` from `/missions/complete` drives the celebration UI in `MissionBadgeShelf`
- Local `badgeCatalog.ts` is the offline fallback for badge definitions

---

## 25. Testing

### Unit tests (Vitest)

Config: `vitest.config.ts` · Environment: `happy-dom` · Globals enabled · All repos forced to `mock` in `vitest.setup.ts` (no real HTTP calls in CI).

Test files live in `src/test/` plus one co-located test `src/domain/animalMapping.test.ts`.

```bash
npm run test         # single run
npm run test:watch   # watch mode (re-runs on file save)
```

| File | Coverage |
|------|----------|
| `smoke.test.ts` | Enums, user progress, config, NAV_ITEMS, icon registry, router, mock data integrity, all stores, quiz retry flow, session/profile/progress isolation |
| `funFactAccess.test.ts` | DTO mapping, `resolveFunFactAccessState()` all branches, `sortFunFactsForDisplay`, `pickPrimaryUnlockedFact`, `invalidateFactsCache()` dual-layer, `allFacts` computed, level-change + profile-switch watchers |
| `animalFunFactUnlockStore.test.ts` | Demo-mode unlock overrides; idempotency |
| `animalApi.dto.test.ts` | `mapAnimalListItemFromCardApiDto`, `pickBackendIdFromAnimalCardWire` |
| `profileApi.dto.test.ts` | `mapWireProfileToChildProfile`, token/code/pin parsers |
| `quizApiMapping.test.ts` | `mapBackendQuizToDomain`, question/answer mapping |
| `quizCompletion.test.ts` | Quiz finish flow, `POST /quizzes/save-progress`, result-screen state |
| `quizRelevance.test.ts` | `domain/quizRelevance` ranking / filtering rules |
| `missions.test.ts` | `missionStore` state machine, complete/start/history, badge unlock |
| `repoFactory.test.ts` | `VITE_REPO_*` env resolution, fallback to defaults |
| `explorerAnimalCatalog.test.ts` | `loadExplorerAnimalChoices()`, catalog ordering |
| `resolveProfileAnimalWireId.test.ts` | Visual key → backend ID matching |
| `apiErrors.test.ts` | `messageForExplorerCreateFailure()` |
| `weatherService.test.ts` | WMO code normalization |
| `badgeApi.dto.test.ts` | `BackendBadge` mapper |
| `narration.test.ts` | Narration text tokeniser, word-timing alignment |
| `discoverFocus.test.ts` | `domain/discoverFocus` hero-animal selection |
| `gamesHub.test.ts` | `/games` hub navigation targets; top nav `Games` link |
| `discoveryAnimalIconRegistry.test.ts` | WEBP registry bootstrap, alias resolution, direct visualKey lookup |
| `explorerRescue.test.ts` | `roundResolver`, data integrity, storage utils, reward logic, `wrongChoice` semantics, `RescueInfoChips` + `RescueProgressPanel` render |
| `explorerRescueGamePageLayout.test.ts` | `ExplorerRescueGamePage` layout; `hideFooter` meta; mobile controls visibility |
| `gameJournal.test.ts` | `gameJournalStore` aggregation, `getRecordsForCategory`, `hasRecords`; stamp rendering; pagination |
| `journalAssetRegistry.test.ts` | `gameJournalAssetRegistry` key-to-image resolution; all stamp keys covered |
| `ecoComicReaderLayout.test.ts` | `EcoComicReaderPage` panel layout; choice branch navigation; ending detection |
| `ecoComicNarrationAssets.test.ts` | `ecoComicAssetRegistry` image resolution; narration text builder output |
| `audioSystem.test.ts` | `audioStore` theme changes; `appAudioService` mute/unmute; route-theme mapping |
| `assetPreload.test.ts` | `assetPreloadService` critical-asset list; `appBootstrapStore` state machine |
| `homePageAssets.test.ts` | Home page 3D carousel card data; all `homeFeatureCards` have valid routes |
| `scenePagesLayout.test.ts` | `gameLayout` meta flag suppresses footer; layout correctness per viewport |
| `demoFunFactUnlocks.test.ts` | `demoFunFactUnlocks.ts` rules; level thresholds match `LEVEL_DEFINITIONS` |
| `imageAttribution.test.ts` | `imageAttribution.ts` registry; all images have attribution entries |
| `imageAttributionCaption.test.ts` | `ImageAttributionCaption.vue` renders correct licence + author text |
| `citedImage.test.ts` | `CitedImage.vue` accessibility attributes (alt, aria-label) |
| `discoverImageAttributionUi.test.ts` | Attribution panel visible on animal profile sheet |
| `animalMapping.test.ts` (co-located in `domain/`) | Animal mapping domain helpers |
| `apiClient.test.ts` (in `src/services/`) | `joinApiUrl()`, token injection, error shapes |

#### Known test expectations to note

- `discoveryAnimalIconRegistry.test.ts` expects **WEBP** URLs for discovery assets

### E2E tests (Playwright)

Config: `playwright.config.ts`. Browsers: `chromium` (Desktop Chrome) + `mobile-chrome` (Pixel 7 viewport).

The Playwright-spawned dev server runs with `VITE_SESSION_ENABLED=false` (set in `playwright.config.ts` `webServer.env`) so tests can navigate to any route without creating a profile.

```bash
npm run test:e2e        # run all specs
npm run test:e2e:ui     # interactive Playwright UI
npm run test:e2e:ci     # headless, 1 worker
```

| Spec | Area | Key assertions |
|------|------|----------------|
| `home-discover.spec.ts` | Home + Discover | Animals render, category filter, map toggle |
| `home-responsive.spec.ts` | Home responsiveness | Layout at 390/768/1366px; no overflow |
| `home-animal-chat.spec.ts` | AI chatbot | Widget opens, sends message, shows response |
| `fun-facts.spec.ts` | Fun Facts (via Discover) | Facts panel visible in animal profile; locked state |
| `quiz.spec.ts` | Quiz full flow | Start → answer → retry → result |
| `discover-detail.spec.ts` | Animal detail sheet | Profile sheet opens; map tab; sketch button |
| `discover-scene-layout.spec.ts` | Scene layout | Responsive at all breakpoints; no overflow |
| `games-menu.spec.ts` | Games hub | All 5 game cards render; correct links |
| `eco-comic-reader.spec.ts` | Eco-Comics reader | Story navigates through scenes; choice branches; ending reward |
| `game-journal.spec.ts` | Game Journal | Menu page; stamp page; empty state; pagination |
| `explorer-rescue.spec.ts` | Explorer Rescue Run | All routes; nav active; responsive (390/768/1366); horizontal scroll check |
| `initial-loading.spec.ts` | Initial load | `InitialAppLoader` overlay resolves before nav is interactive |

#### Seeding localStorage for Explorer Rescue result tests

```typescript
await page.addInitScript((isFirstCompletion: boolean) => {
  localStorage.setItem('bw_explorer_rescue_guest', JSON.stringify({
    v: 1, data: { /* ExplorerRescueProgress with latestResult */ }
  }))
}, true)
await page.goto('/games/explorer-rescue-run/result')
```

---

## 26. CI/CD & Deployment

### Cloudflare Serverless Deployment (`.github/workflows/deploy_cloudflare.yml`)

The primary production CI/CD pipeline triggers on push to `master` and pull requests targeting `master`. It builds and validates both the Worker API and the Vue 3 frontend in parallel before deploying to Cloudflare:

```
push to master ──────────────────────────────┐
                                              │
              ┌───────────────────────────────┴──────────────────────────────┐
              ▼                                                              ▼
   [Job: Build & Verify Worker]                                 [Job: Build & Verify Frontend]
   • Node.js 24 setup                                           • Node.js 24 setup
   • cd worker && npm ci                                        • npm ci
   • npm run type-check (tsc --noEmit)                          • npm run build (PWA & precache)
   • Deploy Worker via wrangler-action                          • Deploy Pages via wrangler-action
   (https://biowira-api.smah0085.workers.dev)                   (https://biowira.pages.dev)
```

**Jobs in Pipeline:**
1. **`Build & Verify Worker API`**:
   - Runs TypeScript strict validation on Worker endpoints.
   - Deploys `worker/` to Cloudflare Workers edge network using `cloudflare/wrangler-action@v3`.
2. **`Build & Verify Frontend`**:
   - Compiles TypeScript and builds Vite PWA bundle (`dist/`).
   - Generates Workbox precache manifest for offline operation.
   - Deploys static build to Cloudflare Pages project **`biowira`** using `cloudflare/wrangler-action@v3`.

### Required GitHub Secrets & Variables

| Secret / Variable | Type | Description |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Secret | Cloudflare API token with `Workers Scripts:Edit`, `Pages:Edit`, `D1:Edit` permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Secret | Cloudflare Account ID (`767ce92674d0bd477eef696c995faf16`) |
| `VITE_MAPBOX_ACCESS_TOKEN` | Secret | Mapbox access token for occurrence mapping in `/discover` |
| `VITE_API_BASE_URL` | Variable | API path prefix (defaults to `/api/v1` in production) |

### Cloudflare Pages Routing (`public/_routes.json`)

Cloudflare Pages proxies backend traffic directly to the Worker:
```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/api/*"]
}
```
* Requests matching `/api/*` are intercepted by the edge Worker without leaving the Cloudflare network.
* Static requests are served directly from Cloudflare Pages CDN edge caches.

---

### Legacy AWS Workflow (`.github/workflows/deploy_to_aws.yml`)

Retained as an optional backup pipeline for AWS S3 + CloudFront deployments:
- Triggers on push to `master`, `iteration1`, `iteration2`, `iteration3`.
- Syncs `dist/` to S3 bucket and issues CloudFront invalidations.

---

## 27. PWA & Offline Support

Configured via `vite-plugin-pwa` in `vite.config.ts`:

- **Manifest:** name, short name, standalone display, portrait orientation, theme `#5B8A3C`, bg `#F5E6C8`
- **Precaching (Workbox):** all `.js`, `.css`, `.html`, `.ico`, `.png`, `.svg`, `.webp` under `dist/`; max file size raised to **4 MiB** (hero map PNGs exceed 2 MiB default)
- **Runtime caching:** `/api/*` routes are **`NetworkOnly`** — never cache API responses (prevents stale facts/profiles across deployments)
- **Branch deployments:** `navigateFallbackDenylist: [/^\/iteration\d+/]` prevents root SW hijacking sub-path deployments
- **Old cache cleanup:** `cleanupOutdatedCaches: true` evicts stale JS bundles after SW update
- **Icons:** generated via `npm run generate:icons`; paths managed in `src/app/branding.ts`
- `registerType: 'autoUpdate'` — SW updates silently in background

---

## 28. Code Quality & Tooling

| Tool | Config file | Notes |
|------|------------|-------|
| ESLint | `eslint.config.js` | Vue 3 recommended + TypeScript + custom rules |
| Prettier | `.prettierrc.json` | `semi: false`, `singleQuote: true`, `printWidth: 100` |
| TypeScript | `tsconfig.app.json` | `strict: true`, `noUnusedLocals`, `noUnusedParameters` |
| Sass | `src/styles/` | `@use '@/styles/tokens' as *` in every component `<style scoped lang="scss">` |

**Path alias:** `@/` → `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`).

### ESLint key rules

| Rule | Level | Reason |
|------|-------|--------|
| `no-console` | `warn` | Allow `console.error/warn` in catch blocks |
| `vue/component-api-style: ['script-setup']` | `error` | Enforce `<script setup>` everywhere |
| `vue/define-emits-declaration: ['type-based']` | `error` | No string-array emits |
| `vue/define-props-declaration: ['type-based']` | `error` | No runtime props declaration |
| `prefer-const` | `error` | No `let` where `const` suffices |
| `eqeqeq` | `error` | No loose equality |

### TypeScript compiler (strict mode)

- `strict: true` — includes `strictNullChecks`, `noImplicitAny`
- `noUnusedLocals` + `noUnusedParameters` — clean dead code
- `moduleResolution: bundler` — Vite-aware ESM resolution

---

## 29. Known Backend Inconsistencies

These are documented so the frontend handles them safely:

1. **`isLocked` vs `accessStatus` conflict** — Backend may return `isLocked: false` with `accessStatus: "locked"` and `levelsNeeded > 0` for the same fact. The frontend **never** trusts `isLocked` directly. `resolveFunFactAccessState()` in `src/domain/funFactAccess.ts` applies a strict precedence order.

2. **`GET /fun-facts` omits `animalId`** — The global collection endpoint does not include which animal each fact belongs to. The frontend cannot use it for the animal-card-centric layout. Instead it calls `GET /fun-facts/{animalId}` per animal (parallel), using `GET /animals` first to get the list of animal IDs.

3. **No `PATCH /profiles` endpoint** — Generic profile field updates are persisted locally in the `bw_profiles` catalog. Authoritative server-side totals are synced via `getCurrentProfile()` (`GET /profiles`) after quiz/mission completion.

---

## 30. Developer Workflow

### Pre-merge checklist

```bash
npm run type-check   # zero TypeScript errors
npm run lint         # zero ESLint errors (warnings allowed)
npm run test         # all unit tests pass
npm run build        # production build succeeds (vue-tsc + vite)
```

### Adding a new feature page

1. Create the Vue SFC in `src/features/<feature>/`
2. Add routes to `src/router/index.ts` using `ROUTE_NAMES`
3. Register route names in `ROUTE_NAMES` in `src/app/config.ts`
4. If the page has a nav entry: add to `NAV_ITEMS` in `config.ts` + register icon in `iconRegistry.ts`
5. Write unit tests in `src/test/`
6. Write E2E spec in `e2e/` covering the new route(s)

### Adding a new domain / endpoint

1. Add the interface to `src/repositories/interfaces.ts`
2. Create `src/repositories/api/apiNewRepository.ts` and `src/repositories/mock/mockNewRepository.ts`
3. Add `VITE_REPO_NEW` to `src/app/config.ts` `resolveRepoSources()` with a safe default
4. Wire it in `src/repositories/index.ts` `createRepositories()`
5. Add `VITE_REPO_NEW=mock` to `vitest.setup.ts`
6. Write tests in `src/test/`

### Adding an animal SVG icon (explorer/profile)

1. Drop `<key>.svg` (or `.gif`) into `public/icons/animals/`
2. Register the key in `src/app/iconRegistry.ts` `ANIMAL_ICON_MAP`
3. The explorer picker, Fun Facts cards, and Discover map will resolve it automatically

### Adding a discovery WEBP image

1. Drop `<key>.webp` into `src/assets/discovery-animals/`
2. Restart the dev server — Vite's `import.meta.glob` picks it up automatically
3. No code changes needed unless the filename stem doesn't match the animal's `visualKey` or `commonName` slug — in that case add an alias to `DISCOVERY_ICON_ALIASES` in `discoveryAnimalIconRegistry.ts`

### Adding a nav icon

1. Drop `<key>.svg` into `public/icons/nav/`
2. Register the key in `src/app/iconRegistry.ts` `NAV_ICON_MAP`
3. Add the entry to `NAV_ITEMS` in `src/app/config.ts` with the same `iconKey`

### Adding a new Explorer animal (round)

1. Ensure the animal SVG/GIF is registered in `ANIMAL_ICON_MAP`
2. Add a new round entry in `src/features/explorer-rescue-run/data/explorerRescueRounds.ts`
3. Add the animal ID to `MALAYSIA_EXPLORER_POPULARITY_ORDER` in `explorerAnimalCatalog.ts` if it should appear in the profile picker
4. Update the "covers all N explorer animals" test in `src/test/explorerRescue.test.ts`

### Adding a new SCSS token

1. Define it in `src/styles/tokens.scss` as a CSS custom property
2. Use it in components via `var(--my-token)`
3. If it's a Sass breakpoint, define it as a `$bp-*` SCSS variable in the same file
4. Never hardcode the value again anywhere else

### Rules — what to always do

| Rule | Why |
|------|-----|
| Use `ROUTE_NAMES` for all navigation | Prevents route string typos; safe to rename |
| Use `STORAGE_KEYS` for all localStorage | Prevents key collisions; easy to audit |
| Use `storageService.get/set/remove` | Schema versioning; no raw `JSON.parse` in features |
| Use `resolveFunFactAccessState(fact)` | Backend `isLocked` is unreliable |
| Use `getLevelForPoints()` from `user.ts` | Centralised level logic; no duplication |
| Use `@use '@/styles/tokens' as *` | All tokens available; no `@import` |
| Avoid `console.log` in production code | ESLint `no-console` warns; use `console.error/warn` in catch only |
| Use `type-based` props/emits in SFCs | ESLint enforces this; Options API declaration is an error |

### Rules — what to never do

| Rule | Why |
|------|-----|
| No raw `localStorage.getItem/setItem` in features | Bypasses schema versioning |
| No hardcoded hex colors in component styles | Design tokens change; hardcodes drift |
| No hardcoded route strings | Breaks on rename |
| No `fact.isLocked` directly | Unreliable backend field |
| No `getAnimalIconUrl()` for discovery images | Wrong registry; use `getDiscoveryAnimalIconUrl()` |
| No WEBP files in `public/icons/animals/` | That folder is SVG-only explorer icons |
| No SVG animal icons in `src/assets/discovery-animals/` | That folder is WEBP discovery images |
| No level computation in components | Use `getLevelForPoints()` |
| No pointsEarned trust from scene results | Explorer Rescue store recalculates authoritatively |

---

*Built for FIT5120 Industry Experience Studio — Monash University*  
*Frontend-only repository. Backend API at `https://api.biowira.dpdns.org`. See `src/repositories/api/` and `src/domain/*Api.dto.ts` for wire-level contract details.*
