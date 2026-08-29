import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(scriptDir, '..')
const sourcePath = path.join(rootDir, 'public', 'portfolio_hero.png')

const ogOverlay = Buffer.from(`
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#050505" stop-opacity="0.94" />
        <stop offset="0.42" stop-color="#050505" stop-opacity="0.62" />
        <stop offset="0.6" stop-color="#050505" stop-opacity="0.05" />
        <stop offset="1" stop-color="#050505" stop-opacity="0" />
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="#000" fill-opacity="0.06" />
    <rect width="1200" height="630" fill="url(#shade)" />

    <g font-family="Arial, Helvetica, sans-serif" text-anchor="start">
      <text x="68" y="128" fill="#facc15" font-size="72" font-weight="800">RADWA</text>
      <text x="68" y="199" fill="#ffffff" font-size="72" font-weight="800">MUHAMMED</text>

      <text x="72" y="272" fill="#f4f4f5" font-size="27" font-weight="400">
        <tspan x="72" dy="0">Marketing strategy, services, templates</tspan>
        <tspan x="72" dy="38">and practical growth systems.</tspan>
      </text>

      <rect x="70" y="365" width="348" height="60" rx="8" fill="#facc15" />
      <text x="96" y="405" fill="#111111" font-size="24" font-weight="700">radwamuhammed.com</text>

      <rect x="70" y="477" width="84" height="5" fill="#facc15" />
      <text x="70" y="530" fill="#ffffff" font-size="24" font-weight="700">Strategy / Proof / Execution</text>
    </g>
  </svg>
`)

const source = sharp(sourcePath).rotate()
const metadata = await source.metadata()

if (!metadata.width || !metadata.height) {
  throw new Error('Could not read portfolio hero dimensions.')
}

const ogBuffer = await source
  .clone()
  .resize({ width: 1200, height: 630, fit: 'cover', position: 'centre' })
  .composite([{ input: ogOverlay }])
  .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
  .toBuffer()

const cropSize = Math.round(Math.min(metadata.width, metadata.height) * 0.54)
const cropLeft = Math.max(0, Math.round(metadata.width * 0.5 - cropSize / 2))
const cropTop = Math.max(0, Math.round(metadata.height * 0.34 - cropSize / 2))

const iconSource = source.clone().extract({
  left: cropLeft,
  top: cropTop,
  width: cropSize,
  height: cropSize,
})

const [icon512, icon256, apple180] = await Promise.all([
  iconSource.clone().resize(512, 512).png({ compressionLevel: 9 }).toBuffer(),
  iconSource.clone().resize(256, 256).png({ compressionLevel: 9 }).toBuffer(),
  iconSource.clone().resize(180, 180).png({ compressionLevel: 9 }).toBuffer(),
])

const icoHeader = Buffer.alloc(22)
icoHeader.writeUInt16LE(0, 0)
icoHeader.writeUInt16LE(1, 2)
icoHeader.writeUInt16LE(1, 4)
icoHeader.writeUInt8(0, 6)
icoHeader.writeUInt8(0, 7)
icoHeader.writeUInt8(0, 8)
icoHeader.writeUInt8(0, 9)
icoHeader.writeUInt16LE(1, 10)
icoHeader.writeUInt16LE(32, 12)
icoHeader.writeUInt32LE(icon256.length, 14)
icoHeader.writeUInt32LE(22, 18)
const favicon = Buffer.concat([icoHeader, icon256])

await Promise.all([
  writeFile(path.join(rootDir, 'public', 'og-radwa.jpg'), ogBuffer),
  writeFile(path.join(rootDir, 'public', 'radwa-icon.png'), icon512),
  writeFile(path.join(rootDir, 'public', 'apple-icon.png'), apple180),
  writeFile(path.join(rootDir, 'src', 'app', 'icon.png'), icon512),
  writeFile(path.join(rootDir, 'src', 'app', 'apple-icon.png'), apple180),
  writeFile(path.join(rootDir, 'src', 'app', 'favicon.ico'), favicon),
])

console.log('Generated social preview and browser icons from portfolio_hero.png.')
