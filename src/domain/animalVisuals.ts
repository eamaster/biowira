/**
 * Maps an animal's biological classification to the discovery icon registry key.
 *
 * This isolates visual identity from database `id` schemas, guaranteeing
 * that backend integers do not accidentally miss the icon lookup table.
 *
 * Keys returned here are used by both `iconRegistry.ts` (explorer SVGs) and
 * `discoveryAnimalIconRegistry.ts` (discovery WEBPs via alias map or direct stem).
 *
 * NOTE: This function maps visual assets only — it does NOT encode biological
 * facts like habitat, diet, or group. Do not use it for trait resolution.
 */
export function resolveAnimalVisualKey(scientificName: string, commonName: string): string | undefined {
  const sci = (scientificName || '').toLowerCase().trim()
  const com = (commonName || '').toLowerCase().trim()

  // ── Mammals ───────────────────────────────────────────────────────────────
  if (sci.includes('panthera tigris') || com.includes('malayan tiger')) return 'malayan-tiger'
  if (sci.includes('helarctos malayanus') || com.includes('sun bear')) return 'sun-bear'
  if (sci.includes('pongo pygmaeus') || com.includes('bornean orangutan')) return 'orangutan'
  if (sci.includes('pongo') || com.includes('orangutan')) return 'orangutan'
  if (sci.includes('tapirus') || com.includes('tapir')) return 'tapir'
  if (sci.includes('nasalis') || com.includes('proboscis monkey')) return 'proboscis-monkey'
  if (sci.includes('manis') || com.includes('pangolin')) return 'pangolin'
  if (sci.includes('tragulus') || com.includes('mousedeer') || com.includes('mouse deer')) return 'mousedeer'
  if (sci.includes('elephas maximus') || com.includes('pygmy elephant') || com.includes('bornean pygmy elephant')) return 'bornean-pygmy-elephant'
  if (sci.includes('rhinopithecus') || com.includes('proboscis')) return 'proboscis-monkey'

  // ── Reptiles ──────────────────────────────────────────────────────────────
  if (sci.includes('crocodylus porosus') || com.includes('saltwater crocodile')) return 'saltwater-crocodile'
  if (sci.includes('crocodylus') || com.includes('crocodile')) return 'crocodile'
  // Note: Hawksbill checked before Green Sea Turtle to avoid collisions
  if (sci.includes('eretmochelys') || com.includes('hawksbill')) return 'sea-turtle-hawksbill'
  if (sci.includes('chelonia') || com.includes('green sea turtle')) return 'sea-turtle'
  if (sci.includes('dermochelys') || com.includes('leatherback sea turtle') || com.includes('leatherback')) return 'leatherback-sea-turtle'
  if (sci.includes('chrysopelea') || com.includes('flying snake') || com.includes('paradise flying snake')) return 'paradise-flying-snake'
  if (sci.includes('gekko') || com.includes('flying gecko') || com.includes("kuhl's flying gecko")) return 'kuhls-flying-gecko'
  if (sci.includes('cuora') || com.includes('spiny terrapin')) return 'spiny-terrapin'
  if (sci.includes('calotes') || com.includes('painted frog') || com.includes('asian painted frog')) return 'asian-painted-frog'

  // ── Marine & Freshwater ───────────────────────────────────────────────────
  if (sci.includes('dugong')) return 'dugong'
  if (sci.includes('rhincodon') || com.includes('whale shark')) return 'whale-shark'
  if (sci.includes('sphyrna lewini') || com.includes('scalloped hammerhead')) return 'scalloped-hammerhead'
  if (sci.includes('hippocampus') || com.includes('seahorse') || com.includes('tiger tail seahorse')) return 'tiger-tail-seahorse'
  if (sci.includes('helostoma') || com.includes('kissing gourami')) return 'kissing-gourami'
  if (sci.includes('poecilia') || com.includes('guppy')) return 'guppy'

  // ── Birds ─────────────────────────────────────────────────────────────────
  if (sci.includes('buceros rhinoceros') || com.includes('rhinoceros hornbill')) return 'rhinoceros-hornbill'
  if (sci.includes('buceros bicornis') || com.includes('great hornbill')) return 'hornbill'
  if (sci.includes('buceros') || com.includes('hornbill')) return 'hornbill'
  if (sci.includes('argusianus') || com.includes('great argus')) return 'great-argus'
  if (sci.includes('pitta') || com.includes('black-crowned pitta')) return 'black-crowned-pitta'
  if (sci.includes('rollulus') || com.includes('crested partridge')) return 'crested-partridge'

  // ── Insects ───────────────────────────────────────────────────────────────
  if (sci.includes('troides') || com.includes('malayan birdwing') || com.includes('birdwing')) return 'malayan-birdwing'
  if (sci.includes('catopsilia') || com.includes('common grass yellow')) return 'common-grass-yellow'
  if (sci.includes('graphium') || com.includes('little mapwing')) return 'little-mapwing'
  if (sci.includes('euploea') || com.includes('monarch')) return 'monarch'
  if (com.includes('slender skimmer') || sci.includes('orthetrum')) return 'slender-skimmer'

  // ── Amphibians ────────────────────────────────────────────────────────────
  if (sci.includes('rhacophorus') || com.includes("wallace's flying frog") || com.includes('flying frog')) return 'wallaces-flying-frog'
  if (sci.includes('limnonectes') || com.includes('torrent frog') || com.includes('larut torrent frog')) return 'larut-torrent-frog'
  if (sci.includes('duttaphrynus') || com.includes('asian common toad')) return 'asian-common-toad'
  if (sci.includes('megophrys') || com.includes('horned frog') || com.includes('long-nosed horned frog')) return 'long-nosed-horned-frog'

  return undefined
}
