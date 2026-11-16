// Generates the grey/black mock asset thumbnails used by the /mock/asset-browse page.
// Run with: node scripts/generate-mock-thumbnails.mjs
// Writes public/mock-assets/thumbs/*.svg and the matching src/pages/mockups/AssetBrowseDemo/mockAssets.json.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const thumbDir = join(root, 'public/mock-assets/thumbs')
const manifestPath = join(root, 'src/pages/mockups/AssetBrowseDemo/mockAssets.json')

const SHADES = ['#0d0d0d', '#1c1c1c', '#2b2b2b', '#3b3b3b', '#4f4f4f', '#666666', '#7f7f7f', '#999999', '#b2b2b2', '#cccccc']

// [width, height] ratios. Images mix landscape and portrait; video is mostly wide; PDFs are pages.
const IMAGE_RATIOS = [[3, 2], [2, 3], [4, 3], [3, 4], [16, 9], [1, 1], [4, 5], [9, 16], [5, 4], [2, 1]]
const VIDEO_RATIOS = [[16, 9], [16, 9], [4, 3], [9, 16], [21, 9]]
const DOC_RATIOS = [[17, 22], [17, 22], [210, 297], [22, 17]]

const IMAGE_WORDS = ['harbor', 'ridge', 'atrium', 'canopy', 'quarry', 'meadow', 'skyline', 'studio', 'portrait', 'product', 'facade', 'shoreline']
const VIDEO_WORDS = ['teaser', 'interview', 'walkthrough', 'launch', 'b-roll', 'tutorial']
const DOC_WORDS = ['brand-guidelines', 'spec-sheet', 'press-kit', 'annual-report', 'catalog', 'style-guide']

// Titles are "<adjective> <noun>"; 7 adjectives against 12 or 6 nouns keeps the combinations unique.
const TITLE_ADJECTIVES = ['Misty', 'Golden', 'Quiet', 'Northern', 'Early', 'Bold', 'Winter']
const titleNoun = (word) => word.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(word === 'b-roll' ? '-' : ' ')

// Widths for small and large; the preview's longest edge.
const SMALL_W = 220
const LARGE_W = 360
const PREVIEW_EDGE = 1200

const COUNTS = { IMAGE: 48, VIDEO: 16, DOCUMENT: 16 }

function sizeFor(variant, [rw, rh]) {
  if (variant === 'preview') {
    return rw >= rh
      ? [PREVIEW_EDGE, Math.round((PREVIEW_EDGE * rh) / rw)]
      : [Math.round((PREVIEW_EDGE * rw) / rh), PREVIEW_EDGE]
  }
  const w = variant === 'small' ? SMALL_W : LARGE_W
  return [w, Math.round((w * rh) / rw)]
}

function motif(type, w, h, fg) {
  const cx = w / 2
  const cy = h / 2
  const s = Math.min(w, h)
  if (type === 'VIDEO') {
    const r = s * 0.16
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${fg}" stroke-width="${s * 0.02}"/>
  <path d="M${cx - r * 0.35} ${cy - r * 0.5} L${cx + r * 0.55} ${cy} L${cx - r * 0.35} ${cy + r * 0.5} Z" fill="${fg}"/>`
  }
  if (type === 'DOCUMENT') {
    const m = s * 0.12
    const lines = []
    const gap = (h - m * 2) / 14
    for (let i = 2; i < 13; i++) {
      const len = i === 2 ? 0.45 : i % 4 === 0 ? 0.6 : 0.85
      lines.push(`<rect x="${m}" y="${m + i * gap}" width="${(w - m * 2) * len}" height="${gap * 0.35}" fill="${fg}" opacity="${i === 2 ? 0.9 : 0.55}"/>`)
    }
    return lines.join('\n  ')
  }
  // Image: a sun over two hills.
  return `<circle cx="${w * 0.72}" cy="${h * 0.3}" r="${s * 0.09}" fill="${fg}" opacity="0.8"/>
  <path d="M0 ${h} L${w * 0.32} ${h * 0.52} L${w * 0.55} ${h * 0.78} L${w * 0.72} ${h * 0.6} L${w} ${h * 0.92} L${w} ${h} Z" fill="${fg}" opacity="0.55"/>`
}

function svg({ type, w, h, bg, fg, label, variant }) {
  const fs = Math.max(11, Math.round(Math.min(w, h) * 0.07))
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${bg}"/>
  ${motif(type, w, h, fg)}
  <text x="${fs * 0.8}" y="${fs * 1.4}" font-family="Helvetica, Arial, sans-serif" font-size="${fs}" font-weight="700" fill="${fg}">${label}</text>
  <text x="${fs * 0.8}" y="${h - fs * 0.8}" font-family="Helvetica, Arial, sans-serif" font-size="${fs * 0.75}" fill="${fg}" opacity="0.8">${variant} ${w}×${h}</text>
</svg>
`
}

rmSync(thumbDir, { recursive: true, force: true })
mkdirSync(thumbDir, { recursive: true })

const assets = []
let n = 0
for (const [type, count] of Object.entries(COUNTS)) {
  const ratios = type === 'IMAGE' ? IMAGE_RATIOS : type === 'VIDEO' ? VIDEO_RATIOS : DOC_RATIOS
  const words = type === 'IMAGE' ? IMAGE_WORDS : type === 'VIDEO' ? VIDEO_WORDS : DOC_WORDS
  for (let i = 0; i < count; i++) {
    n++
    const id = String(n).padStart(3, '0')
    const ratio = ratios[(i * 7 + n) % ratios.length]
    const bg = SHADES[(n * 3) % SHADES.length]
    const fg = SHADES.indexOf(bg) < 5 ? '#d9d9d9' : '#0d0d0d'
    const word = words[i % words.length]
    const ext = type === 'IMAGE' ? (i % 3 === 0 ? 'png' : 'jpg') : type === 'VIDEO' ? 'mp4' : 'pdf'
    const mimeType = { png: 'image/png', jpg: 'image/jpeg', mp4: 'video/mp4', pdf: 'application/pdf' }[ext]

    const thumbnails = {}
    for (const variant of ['small', 'large', 'preview']) {
      const [w, h] = sizeFor(variant, ratio)
      const file = `asset-${id}-${variant}.svg`
      writeFileSync(join(thumbDir, file), svg({ type, w, h, bg, fg, label: `#${id}`, variant }).replace(/\d+\.\d{2,}/g, (m) => String(+(+m).toFixed(1))))
      thumbnails[variant] = { url: `/mock-assets/thumbs/${file}`, width: w, height: h }
    }

    // Spread creation dates back from 2026-11-01 so date sorting is meaningful.
    const created = new Date(Date.UTC(2026, 10, 1, 9) - ((n * 37) % 300) * 86_400_000 - n * 3_600_000)
    assets.push({
      id: `00000000-0000-4000-8000-000000000${id}`,
      // About two in three assets have a title; the rest fall back to the file name.
      title: n % 3 === 0 ? null : `${TITLE_ADJECTIVES[n % TITLE_ADJECTIVES.length]} ${titleNoun(word)}`,
      originalFilename: `${word}-${id}.${ext}`,
      mediaType: type,
      mimeType,
      fileSize: 40_000 + ((n * 7919) % 9_000_000) * (type === 'VIDEO' ? 9 : 1),
      createdAt: created.toISOString().slice(0, 19),
      thumbnails,
    })
  }
}

writeFileSync(manifestPath, JSON.stringify(assets, null, 2) + '\n')
console.log(`Wrote ${assets.length * 3} thumbnails and ${assets.length} assets.`)
