# BioWira Backend Services

Welcome to the **BioWira Backend Documentation**. BioWira provides a child-friendly, gamified wildlife conservation education platform designed for young learners (ages 6–12).

The backend architecture features a modern, ultra-low-latency **Cloudflare Serverless API** powered by **Cloudflare Workers** and **Cloudflare D1** as the primary production infrastructure, alongside an **ASP.NET Core 9.0 Minimal API** enterprise reference implementation.

---

## Architecture Overview

```
                      ┌──────────────────────────────────────────────┐
                      │    BioWira Frontend (Vue 3 PWA on Pages)     │
                      │          https://biowira.pages.dev           │
                      └──────────────────────┬───────────────────────┘
                                             │
                       HTTPS /api/v1/* and /api/v2/* (Same-Origin)
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │       Cloudflare Worker API (Hono.js)        │
                      │         /api/v1/* via Pages Proxy            │
                      ├──────────────────────┬───────────────────────┤
                      │                      │                       │
                      ▼                      ▼                       ▼
            ┌──────────────────┐   ┌───────────────────┐   ┌───────────────────┐
            │  Cloudflare D1   │   │ Google Gemini API │   │  ElevenLabs TTS   │
            │   (biowira-db)   │   │  (AI Companion)   │   │ (Word Sync Audio) │
            └──────────────────┘   └───────────────────┘   └───────────────────┘
```

| Component | Production Stack (Primary) | Reference Enterprise Stack |
|---|---|---|
| **Runtime** | Cloudflare Workers (V8 Edge Isolates) | .NET 9.0 Runtime / Docker Container |
| **Framework** | Hono 4.x (TypeScript) | ASP.NET Core 9.0 Minimal APIs (C# 13) |
| **Database** | Cloudflare D1 (Distributed SQLite at Edge) | PostgreSQL 16 (Local / Containerized — parameterized via env) |
| **ORM / Data Access** | D1 Prepared SQL Statements | Dapper Micro-ORM + Npgsql |
| **TTS & Narration** | ElevenLabs Multilingual v2 + D1 Cache | ElevenLabs Multilingual v2 + PostgreSQL Cache |
| **AI Companion** | Google Gemini 2.5 Flash (via Worker Bindings) | Google Gemini 2.5 Flash |
| **Deployment** | GitHub Actions &rarr; Cloudflare Workers & Pages | Docker / Containerized Host |
| **Public URL** | `https://biowira.pages.dev/api/v1` | `http://localhost:5215/swagger` |

---

## 1. Cloudflare Serverless Worker (`/worker`) — Production API

The production API is completely serverless, zero-maintenance, and globally distributed across Cloudflare's edge network with 0ms cold starts.

### Tech Stack
* **Framework:** [Hono](https://hono.dev/) v4 (Lightweight, ultra-fast web framework for Cloudflare Workers)
* **Language:** TypeScript 5.8
* **Database:** [Cloudflare D1](https://developers.cloudflare.com/d1/) (`biowira-db`)
* **Tooling:** Wrangler CLI v3

### Directory Layout
```
worker/
├── package.json         # Worker dependencies (hono, @cloudflare/workers-types)
├── tsconfig.json        # TypeScript configuration for Cloudflare Workers
├── wrangler.toml        # Cloudflare Worker configuration & D1 database binding
├── schema.sql           # Complete SQLite D1 database schema and seed data
└── src/
    └── index.ts         # Full REST API implementation (all v1 and v2 routes)
```

### Key Capabilities
1. **Zero Cold-Starts:** Instant response times worldwide using Cloudflare edge isolates.
2. **Same-Origin Routing:** Mounted at `https://biowira.pages.dev/api/v1` and `/api/v2` via Cloudflare Pages proxy routes (`public/_routes.json`), completely avoiding CORS latency.
3. **Integrated Child Safety:** Strict validation on all endpoints; nicknames generated via child-safe combinators without requiring email, password, or PII.
4. **AI Animal Companion:** Server-side streaming and prompt guardrails via Google Gemini API.
5. **Synchronized TTS Narration:** Generates word-level audio timestamps using ElevenLabs and caches binary/timestamp payloads directly in D1 to conserve API quota.

---

## 2. ASP.NET Core 9.0 Minimal API (`/backend`) — Enterprise Reference Stack

The `.NET 9` backend is maintained as an enterprise-grade containerized implementation adhering to clean architecture principles.

### Tech Stack
* **Runtime:** .NET 9.0 (C# 13)
* **Framework:** ASP.NET Core Minimal APIs
* **Database:** PostgreSQL 16
* **Data Access:** Dapper + Npgsql
* **Documentation:** Swagger / OpenAPI
* **Containerization:** Docker multi-stage build

### Layered Architecture
```
Deploy (Endpoints & Startup)
  └── Services (Business Logic, Scoring, Badges, Leveling)
        └── Infrastructure (Dapper Repositories, PostgreSQL)
              └── Domain (Entities, Enums, DTOs, Mappers)
```

- **`Deploy/`** — Minimal API route groups, OpenAPI configuration, middleware, and dependency injection wiring.
- **`Services/`** — Domain services enforcing game rules (mission scoring, level thresholds, badge unlocks, retry logic).
- **`Infrastructure/`** — PostgreSQL data access using parameterized Dapper SQL.
- **`Domain/`** — Strongly typed entity classes, DTOs, mappers, and game enums.

---

## 3. Unified REST API Endpoints

Both the Cloudflare Worker API and the ASP.NET Core API strictly adhere to the identical REST contracts:

### 1. Animals — `/api/v1/animals` & `/api/v2/animals`
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/v1/animals` | List all 31 discovery animals (Mammals, Birds, Reptiles, Amphibians, Marine, Insects) |
| `GET` | `/api/v2/animals` | Paginated animal card collection (`items`, `totalCount`, `offset`, `limit`) |
| `GET` | `/api/v1/animals/:id` | Detailed animal profile with habitat, diet, lifespan, conservation status, threats |
| `GET` | `/api/v2/animals/:id` | Enhanced detail including CC-BY creative commons citations and visual keys |
| `GET` | `/api/v1/animals/:id/occurrence` | GPS sighting coordinates restricted to the Malaysia geographic bounding box |

### 2. Profiles & Sessions — `/api/v1/profiles`
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/v1/profiles` | Create child profile (`nickname`, `animalId`, `ageGroup`, `avatarPath`) &rarr; returns profile code and session token |
| `GET` | `/api/v1/profiles` | Retrieve profile and stats using header `X-Session-Token` |
| `POST` | `/api/v1/profiles/restore` | Multi-device restore using profile code (e.g., `TIG-4821`) and PIN |
| `DELETE` | `/api/v1/profiles/session` | Sign out and invalidate active session token |

### 3. Missions — `/api/v1/missions`
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/v1/missions/weather-adaptive` | WMO weather code + isDay adaptive missions (rainy/cloudy indoor, sunny outdoor) |
| `POST` | `/api/v1/missions/assign` | Assign mission to active profile |
| `POST` | `/api/v1/missions/start` | Transition mission state to `in_progress` |
| `POST` | `/api/v1/missions/complete` | Complete mission, award Leaf Points, verify level-ups, unlock badges |
| `GET` | `/api/v1/missions/history` | Retrieve completed mission log for current profile |

### 4. Quizzes — `/api/v1/quizzes`
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/v1/quizzes` | List all available wildlife quizzes |
| `GET` | `/api/v1/quizzes/questions/random` | Random non-repeating question pool across all quizzes |
| `GET` | `/api/v1/quizzes/animals/:animalId/questions` | Species-specific quiz questions |
| `GET` | `/api/v1/quizzes/:quizId/questions` | Quiz questions with choices, hints, and explanations |
| `POST` | `/api/v1/quizzes/save-progress` | Submit quiz score, compute points, update milestones |

### 5. Fun Facts — `/api/v1/fun-facts`
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/v1/fun-facts` | Full catalog with personalised lock/unlock status based on player level |
| `GET` | `/api/v1/fun-facts/:animalId` | Per-animal fun facts with level unlock thresholds |

### 6. Badges — `/api/v1/badges`
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/v1/badges` | Complete badge collection with earned status, progress percentage, and unlock criteria |

### 7. Audio Narration (TTS) — `/api/v1/tts`
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/v1/tts/generate` | Generate ElevenLabs speech narration with synchronized word timings |
| `GET` | `/api/v1/tts/audio/:textHash` | Serve cached MP3 audio file |

### 8. AI Animal Companion — `/api/v1/Chat/ask`
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/v1/Chat/ask` | Child-safe conversational AI prompt via Google Gemini 2.5 Flash |

---

## 4. Database Schema (Cloudflare D1 & PostgreSQL)

The unified schema includes 15 distinct relational tables:

```
  ┌──────────────┐          ┌───────────────────────┐          ┌──────────────┐
  │   profile    ├──────────┤   profile_progress    ├──────────┤ profile_badge│
  └──────┬───────┘          └───────────────────────┘          └──────────────┘
         │
  ┌──────┴───────┐          ┌───────────────────────┐          ┌──────────────┐
  │profile_session          │        animal         ├──────────┤animal_habitat│
  └──────────────┘          └──────┬──────────┬─────┘          └──────────────┘
                                   │          │
                            ┌──────┴───┐  ┌───┴──────────┐
                            │ fun_fact │  │animal_threat │
                            └──────────┘  └──────────────┘
```

1. **`animal`** — Species taxonomy, common names, scientific names, conservation codes, lifespan, and visual assets.
2. **`animal_habitat`** / **`habitat`** — Priority habitats (Tropical Rainforest, Mangroves, Mountain, River).
3. **`animal_threat`** / **`threat`** — IUCN threat assessments (Habitat Loss, Poaching, Pollution, Climate Change).
4. **`animal_occurrence`** — Malaysian geographic observation coordinates.
5. **`profile`** — Child nicknames, chosen animal avatars, age groups, and profile restore codes.
6. **`profile_session`** — Active session tokens with multi-device tracking.
7. **`profile_progress`** — Leaf Points, current level (1–5), quiz counts, mission milestones, and streak days.
8. **`profile_badge`** / **`badge`** — Milestone and achievement badges.
9. **`mission`** / **`profile_mission`** — Weather-adaptive missions with status state machine (`assigned` &rarr; `in_progress` &rarr; `completed`).
10. **`quiz`** / **`quiz_question`** / **`quiz_choice`** — Question banks, difficulty tiers, and hint explanations.
11. **`fun_fact`** — Micro-learning facts with progressive level unlock requirements.
12. **`tts_cache`** — Binary audio and timing metadata cache to optimize TTS API performance.

---

## 5. Local Development & Deployment

### Running the Cloudflare Worker Locally
```bash
# Navigate to worker folder
cd worker

# Install dependencies
npm install

# Start local dev server with local D1 emulation
npx wrangler dev

# Run migrations against local D1 database
npx wrangler d1 execute biowira-db --local --file=schema.sql

# Deploy to Cloudflare production
npx wrangler deploy
```

### Running the .NET 9 Backend Locally
```bash
# Provide connection strings and API keys via environment variables or a gitignored root .env file:
#   POSTGRES_CONNECTION_STRING="Host=localhost;Database=biowira;Username=...;Password=..."
#   Gemini__ApiKey="..."
#   Tts__ElevenLabsApiKey="..."
# Never commit real credentials to Deploy/appsettings.json (it uses #{TOKEN}# placeholders).

# Navigate to backend folder
cd backend

# Restore NuGet dependencies
dotnet restore

# Run API with HTTP profile (port 5215)
dotnet run --project Deploy --launch-profile http

# Run API with HTTPS profile (port 7251)
dotnet run --project Deploy --launch-profile https

# Build & Run via Docker
docker build -t biowira-backend .
docker run -p 8080:8080 biowira-backend
```
Swagger UI will be available at `http://localhost:5215/swagger`.

---

## 6. CI/CD Automation

Deployment is fully automated using GitHub Actions in [`.github/workflows/deploy-cloudflare.yml`](../.github/workflows/deploy-cloudflare.yml):
* **Worker API Pipeline:** Automatically checks types (`tsc --noEmit`), installs dependencies, and deploys the worker to Cloudflare using `cloudflare/wrangler-action@v3`.
* **Frontend Pipeline:** Builds the Vue 3 PWA (`npm run build`) with asset precaching and deploys to Cloudflare Pages.
* **Authentication & Secrets:** Managed via GitHub repository secrets (`CLOUDFLARE_API_TOKEN`, `VITE_MAPBOX_ACCESS_TOKEN`) and Cloudflare Worker Secrets (`GEMINI_API_KEY`, `ELEVENLABS_API_KEY`). Never commit credentials, tokens, or raw account IDs to documentation or `appsettings.json`.
