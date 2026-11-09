// ============================================================
// BioWira Eco-Comic Story Catalog
//
// Central data for all Eco-Comic stories.
// Story panels are modelled as a flat linked list with optional
// choice branches. The EcoComicReaderPage walks this structure.
//
// Image paths are always imported from ecoComicAssetRegistry —
// never hardcoded in this file or in Vue templates.
// ============================================================

import { SECRET_WOODEN_CRATE_ASSETS as A } from './ecoComicAssetRegistry'

/** Library + reader ribbon subtitle (paired with story titles in the subtitle pill). */
export const ECO_COMICS_RIBBON_TAGLINE =
  'Read pixel stories about protecting Malaysia\'s wildlife.'

/** Wood-ribbon title on the eco-comic completion surface (shared across stories). */
export const ECO_COMIC_COMPLETION_RIBBON_TITLE = 'Ending unlocked!'

/** Rainforest card subline when this session did not increase restoration % (replay / duplicate stamp). */
export const ECO_COMIC_RESTORATION_REPLAY_HINT = 'Already restored for this stamp'

// ── Panel types ────────────────────────────────────────────────────────────────

export interface EcoComicPanelDialogue {
  speaker?: string
  text: string
}

export interface EcoComicPanelChoice {
  label: string
  nextPanelId: string
}

/**
 * A single reader panel (one "page" displayed at a time).
 * - imageSrc: real production asset path (set for all non-ending panels).
 * - imagePlaceholder: emoji fallback used only when imageSrc is absent or fails.
 * - isOpening: when true the reader shows "START" instead of "NEXT".
 * - choices: shown as choice buttons instead of NEXT when present.
 * - isEnding: triggers the completion/reward screen when the user proceeds.
 */
export interface EcoComicPanel {
  id: string
  /** Real production image path (from asset registry). */
  imageSrc?: string
  /** Emoji-only defensive fallback — not the normal story experience. */
  imagePlaceholder: string
  /** Narrator text shown above dialogues (italicised scene description). */
  narration?: string
  /**
   * Prepared MP3 clips from the asset registry, played in order when the child taps the speaker.
   * When absent, the reader falls back to dynamic TTS (`buildEcoComicNarrationText` + `useNarrationAudio`).
   */
  narrationAudioSrcs?: readonly string[]
  dialogues?: EcoComicPanelDialogue[]
  /** Next panel in linear flow. Undefined on choice and ending panels. */
  nextPanelId?: string
  /** When present, replace NEXT button with choice buttons. */
  choices?: EcoComicPanelChoice[]
  /** True only for the first panel — reader shows "START ▶" button. */
  isOpening?: boolean
  isEnding?: boolean
  endingId?: string
  stampId?: string
  leafPoints?: number
  endingTitle?: string
  endingDescription?: string
}

// ── Story definition ───────────────────────────────────────────────────────────

export interface EcoComicStory {
  id: string
  title: string
  description: string
  coverImageSrc?: string
  coverPlaceholder: string
  available: boolean
  firstPanelId: string
  panels: Record<string, EcoComicPanel>
  /** Completion card impact line — plain language, no emoji (copy lives in data, not Vue). */
  completionImpactLine?: string
}

// ── Story: The Secret in the Wooden Crate ─────────────────────────────────────

const SECRET_WOODEN_CRATE_PANELS: Record<string, EcoComicPanel> = {
  // ── Opening (isOpening → shows START button) ─────────────────────────────

  opening: {
    id: 'opening',
    imageSrc: A.initial.opening,
    imagePlaceholder: '🌿📖',
    narrationAudioSrcs: [A.narration.opening],
    isOpening: true,
    narration: 'The Secret in the Wooden Crate',
    dialogues: [
      {
        text: 'A Malaysian night market. A butterfly. A mystery hidden beneath a satay stall. Can Fatimah save a critically endangered animal from illegal traffickers?',
      },
    ],
    nextPanelId: 'scene_1',
  },

  // ── Linear scenes 1–7 ─────────────────────────────────────────────────────

  scene_1: {
    id: 'scene_1',
    imageSrc: A.initial.scene01,
    imagePlaceholder: '🌙🍢',
    narrationAudioSrcs: [A.narration.initial.scene01],
    narration:
      'Fatimah, a 14-year-old girl, walks through a bustling Malaysian Pasar Malam at night, happily enjoying freshly grilled satay as colourful lights and crowded stalls fill the lively market around her.',
    nextPanelId: 'scene_2',
  },

  scene_2: {
    id: 'scene_2',
    imageSrc: A.initial.scene02,
    imagePlaceholder: '📦❓',
    narrationAudioSrcs: [A.narration.initial.scene02],
    dialogues: [
      {
        text: 'Suddenly, Fatimah hears a strange scratching sound coming from a rough wooden crate hidden beneath a satay stall. Curious and concerned, she crouches down and peers carefully through the narrow slats of the crate.',
      },
      { speaker: 'Fatimah', text: '"What is that sound coming from the crate under the stall…?"' },
    ],
    nextPanelId: 'scene_3',
  },

  scene_3: {
    id: 'scene_3',
    imageSrc: A.initial.scene03,
    imagePlaceholder: '🦋⚠️',
    narrationAudioSrcs: [A.narration.initial.scene03],
    narration: 'A Monarch butterfly notices Fatimah, flutters beside her, and whispers a warning.',
    dialogues: [
      {
        speaker: 'Monarch',
        text: '"Shh... be careful, young lady. Don\'t let the satay stall seller see you. He\'s an animal trafficker. That animal is critically endangered… and someone is coming to take it away tonight."',
      },
    ],
    nextPanelId: 'scene_4',
  },

  scene_4: {
    id: 'scene_4',
    imageSrc: A.initial.scene04,
    imagePlaceholder: '😮🦋',
    narrationAudioSrcs: [A.narration.initial.scene04],
    narration:
      'Surprised, Fatimah turns around and sees a beautiful Monarch butterfly speaking to her. Amazed and curious, she introduces herself.',
    dialogues: [
      {
        speaker: 'Fatimah',
        text: '"Wow... you can talk? Hi, I am Fatimah. Who are you, and what animal is inside the crate?"',
      },
      { speaker: 'Rama', text: '"My name is Rama, and I\'m a Monarch butterfly."' },
    ],
    nextPanelId: 'scene_5',
  },

  scene_5: {
    id: 'scene_5',
    imageSrc: A.initial.scene05,
    imagePlaceholder: '🦔📦',
    narrationAudioSrcs: [A.narration.initial.scene05],
    narration: 'Rama points toward the frightened animal curled tightly inside the crate.',
    dialogues: [
      {
        speaker: 'Rama',
        text: '"That animal is a Sunda Pangolin. Sadly, it is the most illegally trafficked mammal in the world."',
      },
      {
        speaker: 'Fatimah',
        text: '"Why are Sunda Pangolins the most illegally trafficked mammals in the world?"',
      },
    ],
    nextPanelId: 'scene_6',
  },

  scene_6: {
    id: 'scene_6',
    imageSrc: A.initial.scene06,
    imagePlaceholder: '🦔🌿',
    narrationAudioSrcs: [A.narration.initial.scene06],
    dialogues: [
      {
        speaker: 'Rama',
        text: '"Sunda Pangolins are hunted for their meat, which is considered a luxury food, and their scales are used in some traditional medicines."',
      },
      {
        speaker: 'Rama',
        text: '"When they feel threatened, pangolins curl into a tight ball to protect themselves. Poor Pangolin... he must be very frightened right now."',
      },
    ],
    nextPanelId: 'scene_7',
  },

  scene_7: {
    id: 'scene_7',
    imageSrc: A.initial.scene07,
    imagePlaceholder: '😠🦔',
    narrationAudioSrcs: [A.narration.initial.scene07],
    narration:
      'Fatimah feels angry and upset that the helpless pangolin is suffering because of human greed.',
    dialogues: [
      {
        speaker: 'Fatimah',
        text: '"That\'s so cruel! We can\'t just stand here and do nothing. We have to save the pangolin!"',
      },
    ],
    nextPanelId: 'scene_8',
  },

  /**
   * Scene 8: Rama reveals the truck — first story branch.
   * Choices are shown directly on this scene (no separate placeholder panel).
   */
  scene_8: {
    id: 'scene_8',
    imageSrc: A.initial.scene08,
    imagePlaceholder: '🚛🌙',
    narrationAudioSrcs: [A.narration.initial.scene08],
    narration:
      'Rama points toward a nearby truck where several workers are loading boxes and wooden crates.',
    dialogues: [
      {
        speaker: 'Rama',
        text: '"That truck is going to take the pangolin away, and it will leave in less than an hour. What\'s your plan, Fatimah?"',
      },
    ],
    choices: [
      { label: 'Take the Pangolin Now', nextPanelId: 'path_a_9' },
      { label: 'Photograph and Report', nextPanelId: 'path_b_9' },
    ],
  },

  // ── Path A: Take the Pangolin Now ─────────────────────────────────────────

  path_a_9: {
    id: 'path_a_9',
    imageSrc: A.pathAShared.scene09,
    imagePlaceholder: '🤫👀',
    narrationAudioSrcs: [A.narration.pathA.scene09],
    narration:
      'Fatimah and Rama quietly crouch beside the satay stall, waiting for the trafficker to get distracted.',
    dialogues: [
      {
        speaker: 'Fatimah',
        text: '"Let\'s stay hidden until the trafficker turns away... then we\'ll grab the crate!"',
      },
      { speaker: 'Rama', text: '"Got it! Let\'s be careful."' },
    ],
    nextPanelId: 'path_a_10',
  },

  path_a_10: {
    id: 'path_a_10',
    imageSrc: A.pathAShared.scene10,
    imagePlaceholder: '🏃📦',
    narrationAudioSrcs: [A.narration.pathA.scene10],
    narration:
      'After several tense seconds of waiting, Fatimah and Rama finally see their chance to act. They quickly rush forward and grab the crate together.',
    dialogues: [
      { speaker: 'Fatimah', text: '"Now! Grab the crate!"' },
      { speaker: 'Rama', text: '"Quick, run!"' },
    ],
    nextPanelId: 'path_a_11',
  },

  path_a_11: {
    id: 'path_a_11',
    imageSrc: A.pathAShared.scene11,
    imagePlaceholder: '🏃🌳',
    narrationAudioSrcs: [A.narration.pathA.scene11],
    narration:
      'Worried that the animal trafficker might notice the missing crate and chase after them, Fatimah and Rama hurry toward a nearby park, carrying the frightened pangolin as fast as they can.',
    nextPanelId: 'path_a_12',
  },

  /**
   * Scene 12: Exhausted at the park — second story branch.
   * Choices are shown directly on this scene (no separate placeholder panel).
   */
  path_a_12: {
    id: 'path_a_12',
    imageSrc: A.pathAShared.scene12,
    imagePlaceholder: '😮‍💨🦔',
    narrationAudioSrcs: [A.narration.pathA.scene12],
    narration:
      'Fatimah and Rama stop at the park, breathing heavily after running with the crate. Exhausted, they look at the frightened pangolin inside.',
    dialogues: [
      {
        speaker: 'Rama',
        text: '"We saved the pangolin, but we can\'t take care of him ourselves… what should we do now?"',
      },
    ],
    choices: [
      { label: 'Call a Parent', nextPanelId: 'path_a1_13' },
      { label: 'Contact Jabatan PERHILITAN', nextPanelId: 'path_a2_13' },
    ],
  },

  // ── Path A1: Call a Parent ─────────────────────────────────────────────────

  path_a1_13: {
    id: 'path_a1_13',
    imageSrc: A.pathACallParent.scene13,
    imagePlaceholder: '📱👩',
    narrationAudioSrcs: [A.narration.pathAA.scene13],
    narration: 'Fatimah quickly calls her mother for help. After a few rings, her mom answers.',
    dialogues: [
      { speaker: 'Mom', text: '"Hello, sayang. What happened?"' },
      {
        speaker: 'Fatimah',
        text: '"Mom, I need your help! I found a pangolin trapped inside a crate, and I rescued it from an animal trafficker!"',
      },
    ],
    nextPanelId: 'path_a1_14',
  },

  path_a1_14: {
    id: 'path_a1_14',
    imageSrc: A.pathACallParent.scene14,
    imagePlaceholder: '😱👩',
    narrationAudioSrcs: [A.narration.pathAA.scene14],
    dialogues: [
      {
        speaker: 'Mom',
        text: '"Oh my goodness! Are you alright? Where are you now? I\'m coming to find you, and I\'ll contact the PERHILITAN department right away to rescue the pangolin safely."',
      },
    ],
    nextPanelId: 'path_a1_15',
  },

  path_a1_15: {
    id: 'path_a1_15',
    imageSrc: A.pathACallParent.scene15,
    imagePlaceholder: '🗺️🌳',
    narrationAudioSrcs: [A.narration.pathAA.scene15],
    narration: 'Fatimah turns around and finds a navigation board. She reads the name of the park aloud.',
    dialogues: [
      { speaker: 'Fatimah', text: '"We\'re at Taman Raya Park. Please hurry Mom!"' },
    ],
    nextPanelId: 'path_a1_16',
  },

  path_a1_16: {
    id: 'path_a1_16',
    imageSrc: A.pathACallParent.scene16,
    imagePlaceholder: '📱💚',
    narrationAudioSrcs: [A.narration.pathAA.scene16],
    dialogues: [
      { speaker: 'Mom', text: '"Alright, stay calm, sayang. I\'m on my way now."' },
    ],
    nextPanelId: 'path_a1_17',
  },

  path_a1_17: {
    id: 'path_a1_17',
    imageSrc: A.pathACallParent.scene17,
    imagePlaceholder: '👩‍👧🦔',
    narrationAudioSrcs: [A.narration.pathAA.scene17],
    narration:
      'Mom and the PERHILITAN officer soon arrive at Taman Raya Park to help Fatimah, Rama, and the rescued pangolin.',
    nextPanelId: 'path_a1_18',
  },

  path_a1_18: {
    id: 'path_a1_18',
    imageSrc: A.pathACallParent.scene18,
    imagePlaceholder: '👮🦔',
    narrationAudioSrcs: [A.narration.pathAA.scene18],
    narration:
      'The PERHILITAN officer carefully checks the frightened pangolin while Mom places a comforting arm around Fatimah, with Rama fluttering beside them.',
    nextPanelId: 'path_a1_19',
  },

  path_a1_19: {
    id: 'path_a1_19',
    imageSrc: A.pathACallParent.scene19,
    imagePlaceholder: '👮💚',
    narrationAudioSrcs: [A.narration.pathAA.scene19],
    dialogues: [
      {
        speaker: 'PERHILITAN Officer',
        text: '"Thanks to all of you, this little pangolin can now be taken safely to a rehabilitation center. You did a brave and caring thing today. But remember, if you ever see a wild animal in danger again, the safest thing to do is contact the PERHILITAN immediately instead of rescuing it on your own."',
      },
      {
        speaker: 'Mom',
        text: '"I\'m proud of you both. Because of your courage and kindness, the pangolin is safe now."',
      },
    ],
    nextPanelId: 'path_a1_20',
  },

  path_a1_20: {
    id: 'path_a1_20',
    imageSrc: A.pathAShared.scene20,
    imagePlaceholder: '🦔🌿💚',
    narrationAudioSrcs: [A.narration.pathAA.scene20],
    dialogues: [
      {
        speaker: 'Fatimah',
        text: '"You\'re safe now, little pangolin. I hope you can return happily to the forest soon."',
      },
      { speaker: 'Rama', text: '"Take care, Mr. Pangolin!"' },
    ],
    nextPanelId: 'path_a1_21',
  },

  path_a1_21: {
    id: 'path_a1_21',
    imageSrc: A.pathACallParent.scene21,
    imagePlaceholder: '👋🦔🌿',
    narrationAudioSrcs: [A.narration.pathAA.scene21],
    narration:
      'Mom, Fatimah, and Rama stand together waving goodbye as the PERHILITAN Officer carefully carries the rescued pangolin away. The officer and the little pangolin wave back before heading off to the rehabilitation center.',
    nextPanelId: 'ending_a1',
  },

  ending_a1: {
    id: 'ending_a1',
    imageSrc: A.pathACallParent.scene21,
    imagePlaceholder: '🏆🌿',
    isEnding: true,
    endingId: 'call-a-parent',
    stampId: 'family-team-hero',
    leafPoints: 50,
    endingTitle: 'Family Team Hero',
    endingDescription: 'You saved the pangolin with family help! Your mom and the PERHILITAN officers kept everyone safe.',
  },

  // ── Path A2: Contact Jabatan PERHILITAN ────────────────────────────────────

  path_a2_13: {
    id: 'path_a2_13',
    imageSrc: A.pathAContactPerhilitan.scene13,
    imagePlaceholder: '🗺️📞',
    narrationAudioSrcs: [A.narration.pathAB.scene13],
    narration:
      'While searching around the park, Fatimah and Rama spot a navigation board displaying the contact number for Malaysia\'s wildlife department, Jabatan PERHILITAN.',
    dialogues: [
      {
        speaker: 'Rama',
        text: '"Look! The contact number for Jabatan PERHILITAN is written on this board."',
      },
      { speaker: 'Fatimah', text: '"Quick, let\'s call them!!"' },
    ],
    nextPanelId: 'path_a2_14',
  },

  path_a2_14: {
    id: 'path_a2_14',
    imageSrc: A.pathAContactPerhilitan.scene14,
    imagePlaceholder: '📱👮',
    narrationAudioSrcs: [A.narration.pathAB.scene14],
    narration: 'A PERHILITAN officer quickly answers the phone call.',
    dialogues: [
      {
        speaker: 'PERHILITAN Officer',
        text: '"Hello, this is the PERHILITAN department. How may I assist you?"',
      },
      {
        speaker: 'Fatimah',
        text: '"My name is Fatimah. I found a pangolin locked inside a crate, and I rescued it from an animal trafficker."',
      },
      {
        speaker: 'Officer',
        text: '"Alright, can you tell me where you are now so we can send a team to help you and the pangolin?"',
      },
    ],
    nextPanelId: 'path_a2_15',
  },

  path_a2_15: {
    id: 'path_a2_15',
    imageSrc: A.pathAContactPerhilitan.scene15,
    imagePlaceholder: '🗺️🌳',
    narrationAudioSrcs: [A.narration.pathAB.scene15],
    narration:
      'Fatimah quickly looks up at the navigation board and reads the name of the park aloud.',
    dialogues: [{ speaker: 'Fatimah', text: '"We\'re at Taman Raya Park."' }],
    nextPanelId: 'path_a2_16',
  },

  path_a2_16: {
    id: 'path_a2_16',
    imageSrc: A.pathAContactPerhilitan.scene16,
    imagePlaceholder: '📱💚',
    narrationAudioSrcs: [A.narration.pathAB.scene16],
    dialogues: [
      {
        speaker: 'PERHILITAN Officer',
        text: '"Alright, Fatimah. Stay where you are. Keep yourself and the pangolin safe. I\'m on my way now."',
      },
    ],
    nextPanelId: 'path_a2_17',
  },

  path_a2_17: {
    id: 'path_a2_17',
    imageSrc: A.pathAContactPerhilitan.scene17,
    imagePlaceholder: '🚗💨',
    narrationAudioSrcs: [A.narration.pathAB.scene17],
    narration: 'The PERHILITAN Officer quickly drives toward Taman Raya Park to rescue the pangolin.',
    nextPanelId: 'path_a2_18',
  },

  path_a2_18: {
    id: 'path_a2_18',
    imageSrc: A.pathAContactPerhilitan.scene18,
    imagePlaceholder: '👮🦔',
    narrationAudioSrcs: [A.narration.pathAB.scene18],
    narration:
      'The PERHILITAN Officer arrives at Taman Raya Park carrying a professional transport case. She carefully examines the frightened pangolin while Fatimah and Rama watch anxiously beside her.',
    dialogues: [
      { speaker: 'Fatimah', text: '"Is the pangolin going to be okay?"' },
    ],
    nextPanelId: 'path_a2_19',
  },

  path_a2_19: {
    id: 'path_a2_19',
    imageSrc: A.pathAContactPerhilitan.scene19,
    imagePlaceholder: '👮💚',
    narrationAudioSrcs: [A.narration.pathAB.scene19],
    dialogues: [
      {
        speaker: 'PERHILITAN Officer',
        text: '"Your quick thinking helped save this pangolin\'s life. Thank you, both of you. But next time, remember not to rescue a wild animal on your own. The safest thing to do is contact PERHILITAN immediately."',
      },
      {
        speaker: 'PERHILITAN Officer',
        text: '"And most importantly, always put your own safety first, alright?"',
      },
      { speaker: 'Fatimah and Rama', text: '"Alright!"' },
    ],
    nextPanelId: 'path_a2_20',
  },

  path_a2_20: {
    id: 'path_a2_20',
    imageSrc: A.pathAShared.scene20,
    imagePlaceholder: '🦔🌿💚',
    narrationAudioSrcs: [A.narration.pathAB.scene20],
    dialogues: [
      {
        speaker: 'Fatimah',
        text: '"You\'re safe now, little pangolin. I hope you can return happily to the forest soon."',
      },
      { speaker: 'Rama', text: '"Take care, Mr. Pangolin!"' },
    ],
    nextPanelId: 'path_a2_21',
  },

  /** path_a2_21 — Path AB has its own scene21 image (different from Path AA scene21). */
  path_a2_21: {
    id: 'path_a2_21',
    imageSrc: A.pathAContactPerhilitan.scene21,
    imagePlaceholder: '🚗🦔💚',
    narrationAudioSrcs: [A.narration.pathAB.scene21],
    narration:
      'The PERHILITAN Officer offered Fatimah and Rama a ride home while the rescued pangolin rested safely beside them.',
    nextPanelId: 'ending_a2',
  },

  ending_a2: {
    id: 'ending_a2',
    imageSrc: A.pathAContactPerhilitan.scene21,
    imagePlaceholder: '🏆🌿',
    isEnding: true,
    endingId: 'contact-wildlife-dept',
    stampId: 'pangolin-guardian',
    leafPoints: 30,
    endingTitle: 'Pangolin Guardian',
    endingDescription: 'You helped the pangolin reach PERHILITAN safely! Knowing who to call makes all the difference.',
  },

  // ── Path B: Photograph and Report ─────────────────────────────────────────

  path_b_9: {
    id: 'path_b_9',
    imageSrc: A.pathB.scene09,
    imagePlaceholder: '📸🦔',
    narrationAudioSrcs: [A.narration.pathB.scene09],
    narration:
      'Fatimah and Rama quietly crouch beside the satay stall. Carefully, Fatimah takes a photo of the frightened pangolin hidden beneath the stall as evidence of the illegal wildlife trafficking.',
    dialogues: [
      {
        speaker: 'Fatimah',
        text: '"Let\'s take photos of the pangolin and the truck\'s license plate as evidence."',
      },
      { speaker: 'Rama', text: '"Good idea!"' },
    ],
    nextPanelId: 'path_b_10',
  },

  path_b_10: {
    id: 'path_b_10',
    imageSrc: A.pathB.scene10,
    imagePlaceholder: '📸🚛',
    narrationAudioSrcs: [A.narration.pathB.scene10],
    narration: 'Next, Fatimah takes a photo of the truck\'s license plate as evidence.',
    nextPanelId: 'path_b_11',
  },

  path_b_11: {
    id: 'path_b_11',
    imageSrc: A.pathB.scene11,
    imagePlaceholder: '📋🚛',
    narrationAudioSrcs: [A.narration.pathB.scene11],
    narration:
      'Rama points toward a wanted notice displayed on a nearby poster showing details about the trafficker\'s truck.',
    dialogues: [
      {
        speaker: 'Rama',
        text: '"Look at that poster! The PERHILITAN officers are already searching for this truck. Your photos track down the trafficker."',
      },
    ],
    nextPanelId: 'path_b_12',
  },

  path_b_12: {
    id: 'path_b_12',
    imageSrc: A.pathB.scene12,
    imagePlaceholder: '📱📋',
    narrationAudioSrcs: [A.narration.pathB.scene12],
    narration:
      'Fatimah quickly takes out her phone and calls the number shown on the wanted poster while Rama watches beside her.',
    dialogues: [
      { speaker: 'Fatimah', text: '"You\'re right! I\'ll call the number on the poster right now."' },
    ],
    nextPanelId: 'path_b_13',
  },

  path_b_13: {
    id: 'path_b_13',
    imageSrc: A.pathB.scene13,
    imagePlaceholder: '👮📱',
    narrationAudioSrcs: [A.narration.pathB.scene13],
    narration: 'A PERHILITAN officer quickly answers the phone call.',
    dialogues: [
      {
        speaker: 'PERHILITAN Officer',
        text: '"Hello, this is the PERHILITAN office. How may I assist you?"',
      },
      {
        speaker: 'Fatimah',
        text: '"I found a pangolin locked inside a crate under a market stall at Taman Raya Night Market. I also took photos of the pangolin and the trafficker\'s truck."',
      },
      {
        speaker: 'PERHILITAN Officer',
        text: '"Thank you for reporting this. Please stay calm and remain where you are. We are dispatching a team immediately to rescue the pangolin."',
      },
    ],
    nextPanelId: 'path_b_14',
  },

  path_b_14: {
    id: 'path_b_14',
    imageSrc: A.pathB.scene14,
    imagePlaceholder: '👀🚛',
    narrationAudioSrcs: [A.narration.pathB.scene14],
    narration:
      'Fatimah and Rama keep a careful eye on the trafficker and the frightened pangolin from a safe distance, anxiously waiting for help to arrive.',
    dialogues: [
      { speaker: 'Rama', text: '"I hope the PERHILITAN officers get here soon…"' },
      { speaker: 'Fatimah', text: '"Don\'t worry, Rama. I\'m sure they\'ll come in time!"' },
    ],
    nextPanelId: 'path_b_15',
  },

  path_b_15: {
    id: 'path_b_15',
    imageSrc: A.pathB.scene15,
    imagePlaceholder: '👮🏃🦔',
    narrationAudioSrcs: [A.narration.pathB.scene15],
    narration:
      'A team of PERHILITAN officers rushes into Taman Raya Night Market carrying a professional animal transport case. One officer safely rescues the frightened pangolin from the crate while another moves in to arrest the shocked trafficker.',
    dialogues: [
      { speaker: 'Fatimah', text: '"The PERHILITAN officers are here!"' },
      { speaker: 'Rama', text: '"They caught the trafficker!"' },
    ],
    nextPanelId: 'path_b_16',
  },

  path_b_16: {
    id: 'path_b_16',
    imageSrc: A.pathB.scene16,
    imagePlaceholder: '👮💚🦔',
    narrationAudioSrcs: [A.narration.pathB.scene16],
    narration:
      'A PERHILITAN officer walks toward Fatimah and Rama carrying the professional transport case, smiling warmly at them as the trafficker is arrested in the background.',
    nextPanelId: 'path_b_17',
  },

  path_b_17: {
    id: 'path_b_17',
    imageSrc: A.pathB.scene17,
    imagePlaceholder: '👮😊',
    narrationAudioSrcs: [A.narration.pathB.scene17],
    dialogues: [
      {
        speaker: 'PERHILITAN Officer',
        text: '"You did a brave thing today, Fatimah. Thanks to you and Rama, this pangolin is finally safe."',
      },
      {
        speaker: 'Fatimah',
        text: '"I\'m just happy the pangolin can go somewhere safe now."',
      },
      { speaker: 'Rama', text: '"And hopefully, he can return to the wild very soon!"' },
    ],
    nextPanelId: 'path_b_18',
  },

  /**
   * Scene 18: newspaper headline (Path B finale before reward).
   * Path B assets only go to scene18 — no scene19/20/21 exist for this path.
   */
  path_b_18: {
    id: 'path_b_18',
    imageSrc: A.pathB.scene18,
    imagePlaceholder: '📰🦔',
    narrationAudioSrcs: [A.narration.pathB.scene18],
    narration:
      'The next day, a newspaper headline proudly announces the successful rescue of the Sunda Pangolin, showing a photo of the pangolin returning safely to the wild with a story about Fatimah and Rama\'s bravery helping to save an endangered animal.',
    nextPanelId: 'ending_b',
  },

  ending_b: {
    id: 'ending_b',
    imageSrc: A.pathB.scene18,
    imagePlaceholder: '🏆🌿',
    isEnding: true,
    endingId: 'photograph-and-report',
    stampId: 'wildlife-secret-agent',
    leafPoints: 80,
    endingTitle: 'Wildlife Secret Agent',
    endingDescription: 'You reported evidence safely and helped officers catch the trafficker. The safest and most responsible choice!',
  },
}

export const SECRET_WOODEN_CRATE_STORY: EcoComicStory = {
  id: 'secret-wooden-crate',
  title: 'The Secret in the Wooden Crate',
  description:
    "Can Fatimah and Rama save a critically endangered Sunda Pangolin from illegal wildlife traffickers at a night market?",
  coverImageSrc: A.cover,
  coverPlaceholder: '📦🦔',
  available: true,
  firstPanelId: 'opening',
  completionImpactLine:
    'Rescued a critically endangered Sunda Pangolin from illegal traffickers!',
  panels: SECRET_WOODEN_CRATE_PANELS,
}

// ── Public catalog ─────────────────────────────────────────────────────────────

/** All stories — both available and coming-soon placeholders. */
export const ECO_COMIC_STORY_CATALOG: EcoComicStory[] = [SECRET_WOODEN_CRATE_STORY]

/** Coming-soon slots shown in the library (greyed out). */
export const ECO_COMIC_COMING_SOON_COUNT = 2

export function getStoryById(storyId: string): EcoComicStory | undefined {
  return ECO_COMIC_STORY_CATALOG.find((s) => s.id === storyId)
}
