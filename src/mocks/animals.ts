import type { Animal } from '@/domain/animal'
import { AnimalCategory, ConservationStatus, HabitatZone } from '@/domain/enums'

// ── Position calibration notes ─────────────────────────────────────────────────
// All x/y values are percentages (0–100) of the rendered map container.
// Desktop positions are calibrated for the landscape pixel-art map:
//   - Peninsular Malaysia occupies roughly x: 3–42%, y: 10–95%
//   - East Malaysia (Borneo) occupies roughly x: 53–100%, y: 25–100%
//   - South China Sea (between): x: 40–55%, y: 30–80%
// Mobile positions are calibrated for the portrait pixel-art map:
//   - Peninsular Malaysia occupies roughly x: 5–75%, y: 5–50%
//   - Borneo occupies roughly x: 8–90%, y: 55–98%
// To re-calibrate: open the map image in a viewer, hover over your target
// location and note the pixel coordinates, then divide by image width/height.

export const MOCK_ANIMALS: Animal[] = [
  {
    id: 'malayan-tiger',
    visualKey: 'malayan-tiger',
    commonName: 'Malayan Tiger',
    scientificName: 'Panthera tigris jacksoni',
    category: AnimalCategory.Mammals,
    habitat: HabitatZone.Rainforest,
    diet: 'Carnivore',
    lifespan: '15–20 yrs',
    conservationStatus: ConservationStatus.Endangered,
    conservationReason: 'Hunting & Habitat Loss',
    conservationExplanation:
      'People cut down forests and hunt tigers. They need big forests to survive!',
    description:
      "The Malayan Tiger is Malaysia's national animal. It has orange fur with black stripes — and no two tigers have the same pattern!",
    funFact: 'Tiger stripes are like fingerprints! No two are the same!',
    iconEmoji: '🐯',
    /** Mock “hero” URLs for Discover detail citations / E2E (list cards stay spirit icons only). */
    animalPhotoUrl: 'https://d111111abcdef8.cloudfront.net/media/wildlife-0.webp',
    imageUrl: 'https://d111111abcdef8.cloudfront.net/media/wildlife-0.webp',
    imageAttribution: {
      author: 'PhotoMaster99',
      licenseName: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    },
    markerSpriteKey: 'tiger',
    mapPosition: {
      desktop: { x: 18, y: 38 },
      mobile: { x: 35, y: 22 },
    },
    occurrences: [
      { id: 'occ-tiger-1', latitude: 4.6, longitude: 101.5, locationName: 'Taman Negara', observedAt: '2023-01-15', notes: 'Camera trap sighting' },
      { id: 'occ-tiger-2', latitude: 5.4, longitude: 101.4, locationName: 'Belum-Temengor', observedAt: '2023-04-10', notes: 'Footprints confirmed' }
    ]
  },
  {
    id: 'hornbill',
    visualKey: 'hornbill',
    commonName: 'Hornbill',
    scientificName: 'Buceros rhinoceros',
    category: AnimalCategory.Birds,
    habitat: HabitatZone.Rainforest,
    diet: 'Omnivore',
    lifespan: '35–40 yrs',
    conservationStatus: ConservationStatus.Vulnerable,
    conservationReason: 'Habitat Loss',
    conservationExplanation:
      'Hornbills need tall trees to nest. When forests are cut down, they lose their homes.',
    description:
      'The Rhinoceros Hornbill is a large bird with a curved orange beak. It can glide like an airplane through the forest!',
    funFact: 'Hornbills can glide like an airplane through the forest!',
    iconEmoji: '🦅',
    markerSpriteKey: 'hornbill',
    mapPosition: {
      desktop: { x: 14, y: 22 },
      mobile: { x: 28, y: 13 },
    },
    occurrences: [
      { id: 'occ-hornbill-1', latitude: 1.55, longitude: 110.35, locationName: 'Kubah National Park', observedAt: '2022-09-05' },
      { id: 'occ-hornbill-2', latitude: 5.5, longitude: 118.2, locationName: 'Kinabatangan River', observedAt: '2023-11-20', notes: 'Flock of 4 observed feeding' }
    ]
  },
  {
    id: 'orangutan',
    visualKey: 'orangutan',
    commonName: 'Orangutan',
    scientificName: 'Pongo pygmaeus',
    category: AnimalCategory.Mammals,
    habitat: HabitatZone.Rainforest,
    diet: 'Herbivore',
    lifespan: '35–45 yrs',
    conservationStatus: ConservationStatus.CriticallyEndangered,
    conservationReason: 'Deforestation',
    conservationExplanation:
      'Palm oil plantations destroy orangutan forests. They build a new nest every single day!',
    description:
      'Orangutans are our tree-dwelling cousins! They share 97% of our DNA and are incredibly smart.',
    funFact: 'Orangutans build a brand new nest every single day!',
    iconEmoji: '🦧',
    markerSpriteKey: 'orangutan',
    mapPosition: {
      desktop: { x: 73, y: 58 },
      mobile: { x: 55, y: 73 },
    },
    occurrences: [
      { id: 'occ-orangutan-1', latitude: 5.85, longitude: 118.0, locationName: 'Sepilok Rehabilitation Centre', observedAt: '2023-02-14', notes: 'Feeding station' },
      { id: 'occ-orangutan-2', latitude: 1.6, longitude: 110.15, locationName: 'Semenggoh Nature Reserve', observedAt: '2023-06-22' }
    ]
  },
  {
    id: 'tapir',
    visualKey: 'tapir',
    commonName: 'Malayan Tapir',
    scientificName: 'Tapirus indicus',
    category: AnimalCategory.Mammals,
    habitat: HabitatZone.Rainforest,
    diet: 'Herbivore',
    lifespan: '25–30 yrs',
    conservationStatus: ConservationStatus.Endangered,
    conservationReason: 'Habitat Destruction',
    conservationExplanation:
      'Tapirs need large forest areas to roam and find food. Roads and farms split up their habitat.',
    description:
      'The Malayan Tapir looks like a mix between a pig and an anteater. Despite its looks, it is actually related to horses and rhinos!',
    funFact: 'The Malayan Tapir is actually related to horses and rhinos!',
    iconEmoji: '🐻',
    markerSpriteKey: 'tapir',
    mapPosition: {
      desktop: { x: 22, y: 62 },
      mobile: { x: 45, y: 38 },
    },
    occurrences: [
      { id: 'occ-tapir-1', latitude: 3.75, longitude: 102.3, locationName: 'Krau Wildlife Reserve', observedAt: '2022-10-18', notes: 'Spotted near riverbank' },
      { id: 'occ-tapir-2', latitude: 2.5, longitude: 103.3, locationName: 'Endau-Rompin', observedAt: '2023-08-05' }
    ]
  },
  {
    id: 'proboscis-monkey',
    visualKey: 'proboscis-monkey',
    commonName: 'Proboscis Monkey',
    scientificName: 'Nasalis larvatus',
    category: AnimalCategory.Mammals,
    habitat: HabitatZone.Mangrove,
    diet: 'Herbivore',
    lifespan: '20–25 yrs',
    conservationStatus: ConservationStatus.Endangered,
    conservationReason: 'Mangrove Destruction',
    conservationExplanation:
      'Mangrove forests are being cleared for buildings and fish farms. Proboscis monkeys can only live in these unique forests.',
    description:
      'The Proboscis Monkey has the longest nose in the animal kingdom! Their big nose helps make their calls louder.',
    funFact: 'Proboscis Monkeys are amazing swimmers — they even swim across rivers!',
    iconEmoji: '🐒',
    markerSpriteKey: 'proboscis',
    mapPosition: {
      desktop: { x: 62, y: 75 },
      mobile: { x: 38, y: 82 },
    },
    occurrences: [
      { id: 'occ-proboscis-1', latitude: 5.8, longitude: 118.3, locationName: 'Labuk Bay', observedAt: '2023-03-30', notes: 'Large family group' },
      { id: 'occ-proboscis-2', latitude: 1.7, longitude: 110.3, locationName: 'Bako National Park', observedAt: '2023-07-12' }
    ]
  },
  {
    id: 'sun-bear',
    visualKey: 'sun-bear',
    commonName: 'Sun Bear',
    scientificName: 'Helarctos malayanus',
    category: AnimalCategory.Mammals,
    habitat: HabitatZone.Rainforest,
    diet: 'Omnivore',
    lifespan: '25–30 yrs',
    conservationStatus: ConservationStatus.Vulnerable,
    conservationReason: 'Habitat Loss & Poaching',
    conservationExplanation:
      'Sun bears are hunted for their bile used in medicine. They also lose their forest homes to farms.',
    description:
      "The Sun Bear is the world's smallest bear! It has a yellow chest patch that looks like the rising sun.",
    funFact: 'Sun Bears have the longest tongue of any bear — up to 25cm!',
    iconEmoji: '🐻',
    markerSpriteKey: 'sunbear',
    mapPosition: {
      desktop: { x: 80, y: 52 },
      mobile: { x: 68, y: 67 },
    },
    occurrences: [
      { id: 'occ-sunbear-1', latitude: 5.86, longitude: 118.01, locationName: 'Bornean Sun Bear Conservation Centre', observedAt: '2022-12-01' },
      { id: 'occ-sunbear-2', latitude: 4.8, longitude: 114.9, locationName: 'Mulu National Park', observedAt: '2023-05-18' }
    ]
  },
  {
    id: 'sea-turtle',
    visualKey: 'sea-turtle',
    commonName: 'Green Sea Turtle',
    scientificName: 'Chelonia mydas',
    category: AnimalCategory.MarineFreshwater,
    habitat: HabitatZone.MarineReserve,
    diet: 'Herbivore',
    lifespan: '80+ yrs',
    conservationStatus: ConservationStatus.Endangered,
    conservationReason: 'Ocean Pollution & Poaching',
    conservationExplanation:
      'Plastic in the ocean harms sea turtles who mistake it for jellyfish. Their eggs are also stolen from beaches.',
    description:
      'Green Sea Turtles swim thousands of kilometres to return to the exact beach where they were born!',
    funFact: 'Sea Turtles can swim thousands of kilometres and always find their way home!',
    iconEmoji: '🐢',
    markerSpriteKey: 'sea-turtle',
    mapPosition: {
      desktop: { x: 50, y: 83 },
      mobile: { x: 28, y: 52 },
    },
    occurrences: [
      { id: 'occ-seaturtle-1', latitude: 5.8, longitude: 103.0, locationName: 'Redang Island', observedAt: '2023-04-12', notes: 'Nesting site' },
      { id: 'occ-seaturtle-2', latitude: 6.2, longitude: 118.0, locationName: 'Turtle Islands Park', observedAt: '2023-08-01' }
    ]
  },
  {
    id: 'pangolin',
    visualKey: 'pangolin',
    commonName: 'Sunda Pangolin',
    scientificName: 'Manis javanica',
    category: AnimalCategory.Mammals,
    habitat: HabitatZone.Rainforest,
    diet: 'Insectivore',
    lifespan: '20 yrs',
    conservationStatus: ConservationStatus.CriticallyEndangered,
    conservationReason: 'Illegal Wildlife Trade',
    conservationExplanation:
      'Pangolins are the most trafficked mammal in the world! People poach them for their scales and meat.',
    description:
      'The Pangolin is covered in tough scales made of keratin — the same material as your fingernails!',
    funFact: 'Pangolins are the only mammals fully covered in scales!',
    iconEmoji: '🦔',
    markerSpriteKey: 'pangolin',
    mapPosition: {
      desktop: { x: 25, y: 45 },
      mobile: { x: 40, y: 28 },
    },
    occurrences: [
      { id: 'occ-pangolin-1', latitude: 3.1, longitude: 101.5, locationName: 'Klang Valley (Rescued)', observedAt: '2023-02-28', notes: 'Rescued from illegal trade' },
      { id: 'occ-pangolin-2', latitude: 4.3, longitude: 103.2, locationName: 'Kemaman', observedAt: '2023-09-14' }
    ]
  },
  {
    id: 'mousedeer',
    visualKey: 'mousedeer',
    commonName: 'Lesser Mousedeer',
    scientificName: 'Tragulus kanchil',
    category: AnimalCategory.Mammals,
    habitat: HabitatZone.Rainforest,
    diet: 'Herbivore',
    lifespan: '10–12 yrs',
    conservationStatus: ConservationStatus.LeastConcern,
    conservationReason: '',
    conservationExplanation: 'This animal is safe and happy in nature! 🌿',
    description:
      "The Lesser Mousedeer is one of the world's smallest hoofed animals! It can hide inside a coconut shell.",
    funFact: 'The Mousedeer is so small it can hide inside a coconut shell!',
    iconEmoji: '🦌',
    markerSpriteKey: 'mousedeer',
    mapPosition: {
      desktop: { x: 28, y: 70 },
      mobile: { x: 50, y: 43 },
    },
    occurrences: [
      { id: 'occ-mousedeer-1', latitude: 2.8, longitude: 102.2, locationName: 'Pasoh Forest Reserve', observedAt: '2022-11-22' },
      { id: 'occ-mousedeer-2', latitude: 5.1, longitude: 100.8, locationName: 'Taiping', observedAt: '2023-01-05' }
    ]
  },
  {
    id: 'dugong',
    visualKey: 'dugong',
    commonName: 'Dugong',
    scientificName: 'Dugong dugon',
    category: AnimalCategory.MarineFreshwater,
    habitat: HabitatZone.CoastalArea,
    diet: 'Herbivore',
    lifespan: '70+ yrs',
    conservationStatus: ConservationStatus.Vulnerable,
    conservationReason: 'Seagrass Loss & Boat Collisions',
    conservationExplanation:
      'Dugongs eat seagrass, but pollution destroys seagrass beds. Boat propellers also injure them.',
    description:
      'Dugongs are gentle sea mammals related to elephants! Sailors long ago mistook them for mermaids.',
    funFact: 'Dugongs are related to elephants and inspired mermaid legends!',
    iconEmoji: '🦭',
    markerSpriteKey: 'dugong',
    mapPosition: {
      desktop: { x: 57, y: 82 },
      mobile: { x: 60, y: 79 },
    },
    occurrences: [
      { id: 'occ-dugong-1', latitude: 1.3, longitude: 104.1, locationName: 'Sibu Island', observedAt: '2023-06-15', notes: 'Grazing in seagrass meadow' }
    ]
  },
  {
    id: 'crocodile',
    visualKey: 'crocodile',
    commonName: 'Estuarine Crocodile',
    scientificName: 'Crocodylus porosus',
    category: AnimalCategory.Reptiles,
    habitat: HabitatZone.Mangrove,
    diet: 'Carnivore',
    lifespan: '70+ yrs',
    conservationStatus: ConservationStatus.LeastConcern,
    conservationReason: '',
    conservationExplanation: 'This animal is safe and happy in nature! 🌿',
    description:
      "The Estuarine Crocodile is the world's largest reptile! It has the strongest bite force of any living animal.",
    funFact: 'Crocodiles have the strongest bite of any animal on Earth!',
    iconEmoji: '🐊',
    markerSpriteKey: 'crocodile',
    mapPosition: {
      desktop: { x: 65, y: 68 },
      mobile: { x: 42, y: 79 },
    },
    occurrences: [
      { id: 'occ-crocodile-1', latitude: 1.5, longitude: 110.2, locationName: 'Kuching Wetlands', observedAt: '2023-05-30' },
      { id: 'occ-crocodile-2', latitude: 5.9, longitude: 118.1, locationName: 'Kinabatangan River', observedAt: '2023-10-02' }
    ]
  },
  {
    id: 'sea-turtle-hawksbill',
    visualKey: 'sea-turtle-hawksbill',
    commonName: 'Hawksbill Sea Turtle',
    scientificName: 'Eretmochelys imbricata',
    category: AnimalCategory.Reptiles,
    habitat: HabitatZone.MarineReserve,
    diet: 'Carnivore',
    lifespan: '30–50 yrs',
    conservationStatus: ConservationStatus.CriticallyEndangered,
    conservationReason: 'Shell Trade & Habitat Loss',
    conservationExplanation:
      'Hawksbill turtles are hunted for their beautiful shells. Coral reef destruction removes their feeding grounds.',
    description:
      'The Hawksbill Sea Turtle has a beautiful patterned shell. It eats sea sponges that other animals cannot digest!',
    funFact: 'Hawksbill Turtles eat sea sponges that are poisonous to other animals!',
    iconEmoji: '🐢',
    markerSpriteKey: 'hawksbill',
    mapPosition: {
      desktop: { x: 87, y: 70 },
      mobile: { x: 78, y: 63 },
    },
    occurrences: [
      { id: 'occ-hawksbill-1', latitude: 2.1, longitude: 102.1, locationName: 'Melaka (Padang Kemunting)', observedAt: '2023-06-25', notes: 'Key nesting site in Peninsular Malaysia' },
      { id: 'occ-hawksbill-2', latitude: 6.5, longitude: 116.7, locationName: 'Tun Sakaran Marine Park', observedAt: '2023-09-08' }
    ]
  },
]
