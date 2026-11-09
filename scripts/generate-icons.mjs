/**
 * generate-icons.mjs
 * Bootstrap utility: creates minimal solid-color PWA icon PNGs for local dev
 * when the real branded assets are not yet available in public/icons/.
 *
 * ⚠️  The production app ships with real branded icons (icon-192.png /
 *     icon-512.png) sourced from the BioWira brand package.  This script
 *     is NOT part of the regular build — do not run it in CI or on a machine
 *     that already has the correct branded assets in place.
 *
 * Usage (first-time dev bootstrap only):
 *   node scripts/generate-icons.mjs
 *
 * No external dependencies required — uses only Node.js built-ins.
 */

import { writeFileSync, mkdirSync } from 'fs'
import { deflateSync } from 'zlib'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** CRC-32 for PNG chunk integrity */
function crc32(buf) {
  let crc = 0xffffffff
  for (const byte of buf) {
    crc ^= byte
    for (let i = 0; i < 8; i++) {
      crc = crc & 1 ? (0xedb88320 ^ (crc >>> 1)) : crc >>> 1
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

/** Build a PNG chunk: length(4) + type(4) + data + crc(4) */
function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const dataBytes = Buffer.isBuffer(data) ? data : Buffer.from(data)
  const crcInput = Buffer.concat([typeBytes, dataBytes])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(crcInput), 0)
  const length = Buffer.alloc(4)
  length.writeUInt32BE(dataBytes.length, 0)
  return Buffer.concat([length, typeBytes, dataBytes, crc])
}

/**
 * Create a minimal valid PNG containing a solid-color square.
 * @param {number} size   Width and height in pixels
 * @param {number} r      Red channel (0-255)
 * @param {number} g      Green channel
 * @param {number} b      Blue channel
 * @returns {Buffer}      Raw PNG file bytes
 */
function solidColorPNG(size, r, g, b) {
  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR: width, height, bit depth=8, color type=2 (RGB), compression=0, filter=0, interlace=0
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 2  // RGB

  // Raw pixel data: each row prefixed with filter byte 0x00 (None)
  const rowSize = size * 3
  const rawData = Buffer.alloc(size * (rowSize + 1))
  for (let y = 0; y < size; y++) {
    const offset = y * (rowSize + 1)
    rawData[offset] = 0x00 // filter = None
    for (let x = 0; x < size; x++) {
      rawData[offset + 1 + x * 3] = r
      rawData[offset + 2 + x * 3] = g
      rawData[offset + 3 + x * 3] = b
    }
  }

  return Buffer.concat([
    PNG_SIG,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(rawData)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

// ── Output ────────────────────────────────────────────────────────────────────

const iconsDir = resolve(__dirname, '../public/icons')
mkdirSync(iconsDir, { recursive: true })

// BioWira brand green: #5B8A3C = rgb(91, 138, 60)
const R = 91, G = 138, B = 60

writeFileSync(resolve(iconsDir, 'icon-192.png'), solidColorPNG(192, R, G, B))
writeFileSync(resolve(iconsDir, 'icon-512.png'), solidColorPNG(512, R, G, B))

console.log('✅  Placeholder PWA icons written (dev bootstrap only):')
console.log('   public/icons/icon-192.png  (192×192, brand green solid fill)')
console.log('   public/icons/icon-512.png  (512×512, brand green solid fill)')
console.log()
console.log('⚠️   These are placeholder files for local dev environment setup.')
console.log('    The real branded icon-192.png / icon-512.png from the BioWira')
console.log('    brand package should be restored before deploying to production.')
