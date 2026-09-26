// Generates the PNG app icons (no image tools needed). Run: node scripts/make-icons.mjs
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const BG = [0x11, 0x14, 0x1a], FG = [0xf2, 0xa3, 0x3a]

function crc32(buf) {
  let c, crc = 0xffffffff
  for (const b of buf) { c = (crc ^ b) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c }
  return (crc ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
function png(size) {
  const raw = Buffer.alloc(size * (size * 3 + 1)), c = size / 2
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const dx = (x - c) / size, dy = (y - c) / size, r = Math.hypot(dx, dy)
      const ring = r > 0.2 && r < 0.29 // training ring
      const bar = Math.abs(dy) < 0.035 && Math.abs(dx) < 0.36 // pull-up bar through it
      const col = ring || bar ? FG : BG
      raw.set(col, y * (size * 3 + 1) + 1 + x * 3)
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}
for (const [name, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) writeFileSync(`public/${name}`, png(size))
console.log('icons written')
