// ============================================================
// BioWira — Mission Catalog
// Central repository of all mission templates.
// No mission text is hardcoded in Vue templates or stores.
// All missions are child-safe and supervised-context appropriate.
// ============================================================

import type { MissionTemplate } from '@/domain/mission'

/**
 * The full catalog of available mission templates.
 *
 * Rules for all entries:
 *   - steps must be exactly 3 items (enforced by MissionTemplate type)
 *   - durationMinutes must be 5–15 inclusive
 *   - content must be safe for children aged 6–12
 *   - no dangerous tools, no wildlife handling, no going far from home alone
 *   - language must be simple, clear, and encouraging
 */
export const MISSION_CATALOG: MissionTemplate[] = [
  // ── OUTDOOR MISSIONS ─────────────────────────────────────────────────────────

  {
    id: 'observe-plant',
    title: 'Plant Explorer',
    description: 'Find a plant or tree near you and take a close look!',
    steps: [
      'Find a plant or tree outside — in a garden, park, or near your home.',
      'Look closely at its leaves, stem, or flowers. Notice the colour and shape.',
      'Draw or describe what you see in 3 words!',
    ],
    durationMinutes: 10,
    pointsValue: 30,
    environment: 'outdoor',
    weatherTags: ['sunny', 'cloudy'],
    iconType: 'leaf',
  },
  {
    id: 'listen-for-birds',
    title: 'Bird Listener',
    description: 'Sit quietly and listen for birds around you.',
    steps: [
      'Find a quiet spot outside and sit still for 1 minute.',
      'Close your eyes and listen carefully — can you hear any birds?',
      'Count how many different bird sounds you can hear and share your count!',
    ],
    durationMinutes: 8,
    pointsValue: 25,
    environment: 'outdoor',
    weatherTags: ['sunny', 'cloudy'],
    iconType: 'leaf',
  },
  {
    id: 'count-clouds',
    title: 'Cloud Counter',
    description: 'Look up at the sky and watch the clouds!',
    steps: [
      'Go outside and look up at the sky safely.',
      'Count how many clouds you can see. Are they big or small?',
      'Pick one cloud and watch it for a minute — does it change shape?',
    ],
    durationMinutes: 7,
    pointsValue: 20,
    environment: 'outdoor',
    weatherTags: ['cloudy', 'sunny'],
    iconType: 'leaf',
  },
  {
    id: 'nature-walk',
    title: 'Mini Nature Walk',
    description: 'Take a short walk and spot 5 living things!',
    steps: [
      'Go for a short walk near your home with a grown-up.',
      'Look for 5 living things — plants, insects, birds, or animals.',
      'Remember them and share what you found when you get back!',
    ],
    durationMinutes: 15,
    pointsValue: 40,
    environment: 'outdoor',
    weatherTags: ['sunny', 'cloudy'],
    iconType: 'leaf',
  },
  {
    id: 'leaf-collection',
    title: 'Leaf Hunter',
    description: 'Find 3 different leaves outside!',
    steps: [
      'Walk around outside and look for fallen leaves on the ground.',
      'Try to find 3 leaves that look different — different size, shape, or colour.',
      'Bring them inside and compare them with someone!',
    ],
    durationMinutes: 10,
    pointsValue: 30,
    environment: 'outdoor',
    weatherTags: ['sunny', 'cloudy'],
    iconType: 'leaf',
  },
  {
    id: 'spot-insects',
    title: 'Insect Spotter',
    description: 'Look for tiny insects from a safe distance!',
    steps: [
      'Find a grassy or leafy spot outside and look around carefully.',
      'Spot at least one insect — an ant, butterfly, bee, or beetle.',
      'Watch what it does for 30 seconds without touching it.',
    ],
    durationMinutes: 10,
    pointsValue: 30,
    environment: 'outdoor',
    weatherTags: ['sunny', 'cloudy'],
    iconType: 'leaf',
  },

  // ── INDOOR MISSIONS ──────────────────────────────────────────────────────────

  {
    id: 'sort-recycling',
    title: 'Recycling Helper',
    description: 'Help sort the recycling at home — every bit counts!',
    steps: [
      'Ask a grown-up where the recycling bins or bags are at home.',
      'Look around for paper, plastic, or cans that can be recycled.',
      'Sort them into the right bins and say "I helped the Earth today!"',
    ],
    durationMinutes: 10,
    pointsValue: 35,
    environment: 'indoor',
    weatherTags: ['rainy', 'stormy', 'unknown'],
    iconType: 'trophy',
  },
  {
    id: 'lights-check',
    title: 'Energy Saver',
    description: 'Help save energy by checking lights and plugs!',
    steps: [
      'Walk around your home and check every room.',
      'Turn off any lights in rooms where nobody is sitting.',
      'Ask a grown-up to unplug any chargers or devices not in use.',
    ],
    durationMinutes: 7,
    pointsValue: 25,
    environment: 'indoor',
    weatherTags: ['rainy', 'stormy', 'unknown'],
    iconType: 'leaf',
  },
  {
    id: 'water-indoor-plant',
    title: 'Plant Watering',
    description: 'Give an indoor plant some water and care!',
    steps: [
      'Find an indoor plant at home. Touch the soil lightly — is it dry?',
      'If the soil feels dry, fill a small cup with water and water the plant gently.',
      'Tell the plant something kind — plants love care!',
    ],
    durationMinutes: 8,
    pointsValue: 25,
    environment: 'indoor',
    weatherTags: ['rainy', 'stormy', 'hot', 'unknown'],
    iconType: 'leaf',
  },
  {
    id: 'draw-nature',
    title: 'Nature Artist',
    description: 'Draw something you love from the natural world!',
    steps: [
      'Get some paper and something to draw with.',
      'Think of your favourite animal, plant, or place in nature.',
      'Draw it as best you can and give your picture a title!',
    ],
    durationMinutes: 12,
    pointsValue: 30,
    environment: 'indoor',
    weatherTags: ['rainy', 'stormy', 'unknown'],
    iconType: 'leaf',
  },
  {
    id: 'nature-journal',
    title: 'Nature Journal',
    description: 'Write or draw 3 things you noticed about nature today!',
    steps: [
      'Find a piece of paper or a notebook.',
      'Think about something from nature you saw or heard today — a cloud, a bird, a leaf.',
      'Write or draw 3 nature things you noticed. Give each one a little label!',
    ],
    durationMinutes: 12,
    pointsValue: 30,
    environment: 'indoor',
    weatherTags: ['rainy', 'stormy', 'unknown'],
    iconType: 'leaf',
  },
  {
    id: 'leaf-rubbing',
    title: 'Leaf Rubbing',
    description: 'Make a leaf rubbing artwork indoors!',
    steps: [
      'Find a leaf (from outside earlier, or from an indoor plant) and put it flat.',
      'Place a piece of paper over it and rub a crayon or pencil gently over the paper.',
      'Lift the paper and see the leaf pattern — colour it in however you like!',
    ],
    durationMinutes: 10,
    pointsValue: 25,
    environment: 'indoor',
    weatherTags: ['rainy', 'stormy', 'unknown'],
    iconType: 'leaf',
  },
  {
    id: 'water-check',
    title: 'Water Saver',
    description: 'Check for dripping taps and help save water!',
    steps: [
      'Walk around your home and check all the taps.',
      'Is any tap dripping? Tell a grown-up so they can tighten it.',
      'Turn off your tap fully the next time you wash your hands — count how long the water runs!',
    ],
    durationMinutes: 7,
    pointsValue: 30,
    environment: 'both',
    weatherTags: ['rainy', 'stormy', 'sunny', 'cloudy', 'unknown'],
    iconType: 'leaf',
  },
]

/**
 * Get all templates suitable for a given environment.
 *
 * 'indoor' → returns indoor + both
 * 'outdoor' → returns outdoor + both
 */
export function getTemplatesByEnvironment(
  isOutdoorSafe: boolean,
): MissionTemplate[] {
  const preferred: string[] = isOutdoorSafe ? ['outdoor', 'both'] : ['indoor', 'both']
  return MISSION_CATALOG.filter((t) => preferred.includes(t.environment))
}
