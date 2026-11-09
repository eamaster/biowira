# BioWira Audio Assets

This directory contains all background music and SFX for BioWira.
**All files are served statically from `/public/audio/` — no bundling.**

## Directory Layout

```
public/audio/
├── music/
│   ├── calm-jungle-loop.ogg      ← Calm, soft jungle ambient music (OGG preferred)
│   ├── calm-jungle-loop.mp3      ← MP3 fallback
│   │                              Used on: ALL pages (Welcome, Home, Discover, Quiz, Games,
│   │                                       Missions, Eco-Comics, Explorer Rescue chapter/
│   │                                       result/journal)
│   │                              Duration: 2–4 min seamless loop
│   │                              Style: Soft nature sounds + light birds/leaves/water,
│   │                                     gentle marimba or flute. NOT busy or loud.
│   │
│   ├── adventure-jungle-loop.ogg ← Upbeat jungle adventure music (OGG preferred)
│   └── adventure-jungle-loop.mp3 ← MP3 fallback
│                                  Used on: Explorer Rescue Run gameplay only
│                                  Duration: 2–3 min seamless loop
│                                  Style: Playful percussion, upbeat jungle adventure.
│                                         Still soft and kid-friendly (not aggressive).
│
└── sfx/
    ├── tap-soft.ogg              ← Very short, soft tap/click (60–80ms)
    ├── tap-soft.mp3              ← Used on: all interactive buttons/links (global)
    ├── answer-correct-soft.ogg   ← Positive chime (300–500ms, bright but gentle)
    ├── answer-correct-soft.mp3   ← Used on: correct quiz and game answers
    ├── answer-wrong-soft.ogg     ← Soft "boop" (300ms, NOT harsh/punishing)
    ├── answer-wrong-soft.mp3     ← Used on: wrong quiz and game answers
    ├── achievement-soft.ogg      ← Uplifting achievement jingle (800ms–1s)
    ├── achievement-soft.mp3      ← Used on: ALL result pages (quiz result, game result)
    │                                Style: Celebratory but gentle — same sound for all
    │                                       result screens regardless of outcome level.
    ├── card-flip-soft.ogg        ← Quick whoosh/flip (100–200ms)
    ├── card-flip-soft.mp3        ← Used on: Fun Fact card flips
    ├── leaf-collect-soft.ogg     ← Light nature pickup sound (200–300ms, satisfying)
    ├── leaf-collect-soft.mp3     ← Used on: Explorer Run clue leaf collection
    ├── jump-soft.ogg             ← Light boing/spring (80–150ms)
    ├── jump-soft.mp3             ← Used on: Explorer Run player jump
    │                                Style: Playful, light, kid-friendly. Short enough
    │                                       not to overlap on rapid jumps.
    ├── journal-flip-soft.ogg     ← Papery page-turn rustle (200–400ms)
    └── journal-flip-soft.mp3     ← Used on: Rescue Journal page open
                                     Style: Soft paper/book sound, organic and warm.
```

## How the Service Loads Files

The audio service (`src/services/appAudioService.ts`) uses `.ogg` as the first source
and `.mp3` as the fallback. Browsers try sources in order and use the first they support.
Always provide BOTH formats.

## Tone Guide — CRITICAL for Kid Users (Ages 6–12)

All sounds MUST be:
- **Calm and soft** — Never harsh, jarring, or piercing. Low master volume.
- **Friendly** — Cheerful but not annoying or over-excited.
- **Jungle-themed** — Nature, wildlife, organic sounds where possible.
- **Non-repetitive** — SFX must be short so they don't irritate on repeat use.
- **Non-punishing** — Wrong answer must be a gentle soft sound, NOT a buzzer or alarm.

## File Format Requirements

- **Format**: OGG Vorbis + MP3 (broadest browser support)
- **Bitrate**: 128 kbps or lower (fast mobile loading)
- **Channels**: Stereo for music, Mono acceptable for SFX
- **Normalize**: Master at −14 LUFS for music, −12 LUFS for SFX

## Recommended Sources (Free / Open License)

- [Freesound.org](https://freesound.org) — CC0 and CC-BY sounds
- [Pixabay](https://pixabay.com/music/) — Royalty-free music and SFX
- [OpenGameArt.org](https://opengameart.org) — Game SFX and looping music
- [ZapSplat](https://www.zapsplat.com) — Free SFX with attribution

**Always verify licenses before use. Record the license for each file below.**

## License Log

| File | Source | License | Author |
|------|--------|---------|--------|
| *(add entries here)* | | | |

## Graceful Failure

If a file is missing, the app continues without crashing. The service catches
HTMLMediaElement `error` events and logs a warning in development mode only.
Audio settings UI still renders regardless of asset availability.
