#!/usr/bin/env node
// Builds every RootNative UI brand asset from the one geometry definition below.
//
// The mark is a stack of three isometric cubes: two on the base row, one resting
// on top. It says what the library is -- composable blocks you assemble into an
// interface. It survives a 16 px favicon because it is six solid rhombi with no
// hairline strokes.
//
// This script is the single source of truth. `assets/brand/*.svg`,
// `docs/static/img/*`, and `example/assets/*` are all generated; edit the
// constants here, re-run, and commit the output.
//
//   pnpm run build:brand
//
// Every mark raster is drawn by the small renderer in this file rather than by
// an external tool. The sibling `inertia` repo learned that the hard way: it
// first shelled out to macOS QuickLook (`qlmanage`) and shipped two silent
// defects, because a thumbnailer is not a rasterizer.
//
//   1. QuickLook composites onto opaque white. Nothing it emitted was ever
//      transparent, so the "transparent" favicon and the Android adaptive-icon
//      foreground were both solid white tiles.
//   2. It anchors artwork top-left when the requested size exceeds the size it
//      infers, instead of scaling. The 180 px favicon came out as a half-size
//      mark in the corner of its frame.
//
// The mark is a set of straight-edged rhombi filled with a linear gradient, so
// drawing it directly gives real alpha, is exact at every size, and works on any
// platform. The one exception is the social card, which needs text:
// that still goes through QuickLook, and it is unaffected by (1) because the
// card paints its own opaque background.

import { execFileSync } from 'node:child_process'
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const BRAND_DIR = path.join(ROOT, 'assets', 'brand')
const DOCS_IMG_DIR = path.join(ROOT, 'docs', 'static', 'img')
const EXAMPLE_ASSET_DIR = path.join(ROOT, 'example', 'assets')

// --- palette -----------------------------------------------------------------
// A block is lit, not translucent. Each of a cube's three faces takes one FLAT,
// FULLY OPAQUE colour from a three-tone ramp -- top lit, right mid, left shaded.
// Keep the top tone in step with `--rn-accent` in docs/src/css/custom.css.
//
// This replaced a gradient-plus-opacity model, and both halves of that were
// defects visible the moment the mark was viewed on a transparency checkerboard:
//
//   1. Semi-transparent faces let the backdrop show THROUGH the darker faces. A
//      solid object cannot be see-through; the eye stops reading it as a solid.
//   2. One gradient spanning the whole mark meant a face's colour came from where
//      it sat on the canvas rather than from which way it pointed. Faces on
//      adjacent cubes therefore met at nearly the same value and blended, so the
//      three cubes fused into one continuous folded surface.
//
// Flat per-face tones fix both: a face's colour now encodes its orientation, which
// is the whole reason a drawn cube reads as a cube.
// The three tones need real separation between them, INCLUDING between `right` and
// `left`. An earlier pair sat only ~0.06 luminance apart and the two side faces of
// each block barely resolved, so a block's vertical corner -- the edge that tells
// you which way it faces -- went soft.
const LIGHT_FACES = { top: '#60a5fa', right: '#2563eb', left: '#1739a8' }
const DARK_FACES = { top: '#bfdbfe', right: '#60a5fa', left: '#2563eb' }

// Backdrop for the app icon and the social card. Near-black rather than pure
// black so the mark's lit top faces stay visible against it.
const CANVAS_DARK = '#0a0a0f'

// --- geometry ----------------------------------------------------------------
// A 64-unit canvas. The mark is three isometric cubes: two side by side on the
// base row, one centred on top of them.
//
// One primitive, defined by its centre and its half-width rather than by a
// bounding box:
//
//   - `cube` -- an isometric box drawn as three rhombi: the top face, the left
//               face, and the right face. Each face is a straight-edged quad, so
//               a face is one polygon and needs no curve flattening.
//
// A cube is NOT a hexagon with two lines through it. The three faces are separate
// shapes with separate flat colours, which is what makes the form read as a solid
// with light on it. Drawing one hexagon and stroking the interior seams gives
// hairlines that disappear at favicon sizes, and the mark flattens to a blob.
//
// The isometric projection is the standard 2:1 one: a step of `w` along either
// ground axis moves `w` across and `w * ISO_RISE` down the screen. 0.5 is the
// classic value and keeps every edge on a clean half-unit slope.
//
// Every emitted asset is centred on the artwork's measured bounds, so changing a
// cube's size or position cannot push the mark off-centre.
const MARK_VIEWBOX = 64

const ISO_RISE = 0.5

/**
 * A single quad face. `points` are canvas-space corners in order; the outline is
 * closed automatically. `tone` names which face of the light model this is, and
 * the palette in use resolves it to a flat colour.
 */
function face(points, tone) {
  return { kind: 'poly', points, tone }
}

/**
 * An isometric cube.
 *
 * `[cx, cy]` is the centre of the cube's TOP face. `w` is the half-width of that
 * face across the screen, so the cube spans `2 * w` horizontally. `h` is the
 * vertical height of the two side faces.
 *
 * The three faces are returned back to front (top, left, right). They are
 * disjoint, so paint order between them does not matter, but keeping it fixed
 * makes the emitted SVG stable.
 */
function cube({ cx, cy, w, h }) {
  const rise = w * ISO_RISE
  // Top face corners, clockwise from the far (upper) point.
  const far = [cx, cy - rise]
  const rightCorner = [cx + w, cy]
  const near = [cx, cy + rise]
  const leftCorner = [cx - w, cy]

  return [
    face([far, rightCorner, near, leftCorner], 'top'),
    face(
      [
        leftCorner,
        near,
        [near[0], near[1] + h],
        [leftCorner[0], leftCorner[1] + h],
      ],
      'left',
    ),
    face(
      [
        near,
        rightCorner,
        [rightCorner[0], rightCorner[1] + h],
        [near[0], near[1] + h],
      ],
      'right',
    ),
  ]
}

// The stack: two blocks on the base row, one resting on top.
//
// CUBE_H equals CUBE_W, and that is not a coincidence to be tuned away: in 2:1
// isometric a cube's side face is exactly as tall as the top face's half-width.
// An earlier version used a shorter height and every box read as a flat slab.
const CUBE_W = 13
const CUBE_H = CUBE_W

// GAP is what makes these read as separate BLOCKS rather than as one folded
// surface, and it is the single most load-bearing constant in the table.
//
// The first version had no gap at all: the base pair shared its near/far edge and
// the top cube sat flush on that shared corner. Every cube was then edge-to-edge
// with its neighbours, so the silhouette was one continuous outline and the mark
// read as a single creased sheet -- which is exactly the "doesn't look like
// building blocks" failure. Real blocks sit apart with backdrop visible between
// them. The gap has to survive a 16 px favicon, so it is a whole canvas unit
// rather than a hairline.
const GAP = 4

// Half the horizontal step between the two base blocks. Two blocks that touch sit
// at +/- CUBE_W; adding half the gap pushes them apart by GAP.
const HALF_STEP = CUBE_W + GAP / 2

// The top block needs MORE clearance than the horizontal gap, not the same amount.
// Its bottom corner points down into the V between the two base blocks, so a
// clearance equal to GAP leaves that corner grazing them and the three shapes
// re-merge at the one place the eye checks first.
const TOP_GAP = GAP * 2

const ROW_Y = 32

const MARK_SHAPES = [
  // Base row, left and right, separated by GAP.
  ...cube({ cx: 32 - HALF_STEP, cy: ROW_Y, w: CUBE_W, h: CUBE_H }),
  ...cube({ cx: 32 + HALF_STEP, cy: ROW_Y, w: CUBE_W, h: CUBE_H }),
  // Top block, centred between them, clearing the row by TOP_GAP.
  ...cube({ cx: 32, cy: ROW_Y - CUBE_H - TOP_GAP, w: CUBE_W, h: CUBE_H }),
]

// Below roughly 24 px the three-block stack loses its gaps and reads as a blob,
// so favicons get a bolder reduction: ONE block, as large as the frame allows.
//
// A single cube, not a smaller stack. Two stacked cubes were tried and rejected:
// a cube resting on another HIDES the lower one's top face, but this renderer has
// no hidden-surface removal -- every face it is given gets painted. So the buried
// top face shows through as a band across the middle and the pair reads as one
// tall box with a stripe, not as two cubes. Any compact form built from more than
// one cube has to keep the cubes apart, where nothing is occluded, and separated
// blocks are exactly what does not survive 16 px.
const COMPACT_W = 19
const COMPACT_H = COMPACT_W

const COMPACT_SHAPES = cube({ cx: 32, cy: 22, w: COMPACT_W, h: COMPACT_H })

// There is deliberately no `onDark` here any more.
//
// It existed to lift semi-transparent faces that mixed with the dark canvas and
// desaturated to a muddy grey-blue. Faces are now flat and FULLY OPAQUE, so no
// face mixes with the backdrop at all and every output shows the same three tones
// whatever it is composited onto. Re-adding a dark-only adjustment would mean the
// mark no longer has one appearance -- if a tone needs changing, change the
// palette.

const FONT_STACK =
  "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"

// --- shape maths -------------------------------------------------------------
// The primitive exposes the same two things, so the SVG emitter and the
// rasterizer read one description and cannot disagree about where a shape is:
//
//   covers(s, x, y)  -> is this canvas-space point inside the shape?
//   svgPath(s)       -> the same outline as an SVG `d` attribute
//
// The two agree by construction, not by coincidence: both read the same corner
// list. A face is straight-edged, so there is no flattening step where the two
// could drift.

/** Crossing-number point-in-polygon. */
function insidePolygon(px, py, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

/**
 * Prepare a shape for repeated hit-testing: precompute a bounding box so most
 * pixels reject with four comparisons instead of walking every edge.
 */
function prepare(s) {
  const poly = s.points
  const xs = poly.map((p) => p[0])
  const ys = poly.map((p) => p[1])
  const box = [
    Math.min(...xs),
    Math.min(...ys),
    Math.max(...xs),
    Math.max(...ys),
  ]
  return {
    tone: s.tone,
    box,
    covers: (px, py) =>
      px >= box[0] &&
      px <= box[2] &&
      py >= box[1] &&
      py <= box[3] &&
      insidePolygon(px, py, poly),
  }
}

const round = (n) => Number(n.toFixed(2))

/** The shape as an SVG path `d`. Emits the same corners `covers` tests. */
function svgPath(s) {
  const [first, ...rest] = s.points
  return (
    `M ${round(first[0])} ${round(first[1])} ` +
    rest.map((p) => `L ${round(p[0])} ${round(p[1])}`).join(' ') +
    ` Z`
  )
}

// --- SVG builders ------------------------------------------------------------
//
// Faces are flat fills, so there are no `<defs>` and no gradient to keep in step
// with the rasterizer. Each path carries its own `fill`, which is also why the
// emitted SVGs no longer need a unique gradient id per variant.

function shapes(faces, list, indent = '    ') {
  const paths = list.map(
    (s) => `${indent}  <path d="${svgPath(s)}" fill="${faces[s.tone]}" />`,
  )
  return [`${indent}<g>`, ...paths, `${indent}</g>`].join('\n')
}

/**
 * The mark on its own, transparent, filling the viewBox. These SVGs are what
 * the docs navbar loads; every PNG comes from `renderMark` instead.
 *
 * `width` / `height` are set as well as `viewBox` because Safari gives an SVG
 * with no intrinsic size a zero width inside an `<img>` that only sets
 * `height` -- exactly how Docusaurus renders a navbar logo.
 *
 * The artwork is centred here by an explicit transform, from the same
 * `artworkBounds` the rasterizer measures. Do not drop it in favour of trusting
 * the raw coordinates: `renderMark` re-centres on the measured bounds, so a
 * shape table that is off-centre in viewBox space still yields correct PNGs
 * while every SVG consumer gets the mark visibly adrift. That was live under an
 * earlier geometry -- the artwork's centre sat at y=38 on a 64-unit canvas, so
 * the navbar logo was 6 units low with 18 units of dead headroom.
 */
function markSvg({ faces, shapeList, note, size = MARK_VIEWBOX }) {
  const bounds = artworkBounds(shapeList)
  const dx = MARK_VIEWBOX / 2 - (bounds.x0 + bounds.x1) / 2
  const dy = MARK_VIEWBOX / 2 - (bounds.y0 + bounds.y1) / 2
  const centred = dx !== 0 || dy !== 0

  return [
    note ? `<!--\n${note}\n-->` : null,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${MARK_VIEWBOX} ${MARK_VIEWBOX}" fill="none" role="img" aria-label="RootNative UI">`,
    `  <title>RootNative UI</title>`,
    centred ? `  <g transform="translate(${round(dx)} ${round(dy)})">` : null,
    shapes(faces, shapeList, centred ? '    ' : '  '),
    centred ? `  </g>` : null,
    `</svg>`,
    ``,
  ]
    .filter((line) => line !== null)
    .join('\n')
}

const CARD_WIDTH = 1200
const CARD_HEIGHT = 630

/**
 * Open Graph / Twitter card: mark, wordmark, tagline, package name.
 *
 * `square` letterboxes the same artwork into a 1200x1200 canvas. QuickLook only
 * emits square thumbnails, so the raster path renders the square form and crops
 * the middle band back out; the 1200x630 form is what gets committed as the
 * readable source.
 */
function socialCardSvg({ square = false } = {}) {
  const height = square ? CARD_WIDTH : CARD_HEIGHT
  const shift = square ? (CARD_WIDTH - CARD_HEIGHT) / 2 : 0

  // The card's mark is the same geometry and the same flat tones as every other
  // output. It takes the lighter palette because the card canvas is dark.
  const cardMark = shapes(DARK_FACES, MARK_SHAPES, '      ')

  // The card's own gradients stay: they are card chrome (the footer rule and the
  // corner glow), not part of the mark.
  const [glowDeep, glowMid] = [LIGHT_FACES.left, LIGHT_FACES.top]

  return `<!--
  Open Graph / Twitter card, ${CARD_WIDTH}x${CARD_HEIGHT}. Text is baked into the raster output,
  so the font stack only has to resolve on the machine running this script.
-->
<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${height}" viewBox="0 0 ${CARD_WIDTH} ${height}" fill="none">
  <title>RootNative UI — design-system agnostic components for React Native</title>
  <defs>
    <linearGradient id="cardBar" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${CARD_WIDTH}" y2="0">
      <stop offset="0" stop-color="${DARK_FACES.top}" />
      <stop offset="0.55" stop-color="${DARK_FACES.right}" />
      <stop offset="1" stop-color="${DARK_FACES.left}" />
    </linearGradient>
    <radialGradient id="cardGlow" gradientUnits="userSpaceOnUse" cx="1020" cy="110" r="560">
      <stop offset="0" stop-color="${glowDeep}" stop-opacity="0.34" />
      <stop offset="0.55" stop-color="${glowMid}" stop-opacity="0.09" />
      <stop offset="1" stop-color="${CANVAS_DARK}" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="${CARD_WIDTH}" height="${height}" fill="${CANVAS_DARK}" />
  <g transform="translate(0 ${shift})">
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="${CANVAS_DARK}" />
    <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#cardGlow)" />
    <rect y="${CARD_HEIGHT - 5}" width="${CARD_WIDTH}" height="5" fill="url(#cardBar)" />

    <!--
      The mark is wider than it is tall, so this scale is set from its visual
      weight against the wordmark rather than from a nominal box height.
    -->
    <g transform="translate(84 74) scale(4.0)">
${cardMark}
    </g>

    <text x="110" y="392" font-family="${FONT_STACK}" font-size="90" font-weight="800" letter-spacing="-3" fill="#fafafa">RootNative UI</text>
    <text x="110" y="448" font-family="${FONT_STACK}" font-size="34" font-weight="500" fill="#a1a1aa">Design-system agnostic components for React Native</text>
    <text x="110" y="524" font-family="${FONT_STACK}" font-size="26" font-weight="500" letter-spacing="0.4" fill="#71717a">@rootnative/components</text>
  </g>
</svg>
`
}

// --- rasterization -----------------------------------------------------------

let scratch = null

function scratchDir() {
  if (!scratch) scratch = mkdtempSync(path.join(tmpdir(), 'rootnative-brand-'))
  return scratch
}

// QuickLook caches thumbnails per input path, and re-rendering the same path
// can return the previous run's image even after the bytes change. The social
// card is the only thing still going through it, but the counter is cheap
// insurance against a fixed asset still looking broken.
let renderSeq = 0

function hexToRgb(hex) {
  const value = parseInt(hex.slice(1), 16)
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff]
}

/**
 * Bounding box of the artwork in viewBox units.
 *
 * Taken from each shape's prepared box, so every face contributes the extent of
 * its own corners. The top cube's far corner and the base row's bottom edge are
 * on different shapes, so nothing but the union of all six faces is correct here.
 */
function artworkBounds(shapeList) {
  const boxes = shapeList.map((s) => prepare(s).box)
  const x0 = Math.min(...boxes.map((b) => b[0]))
  const y0 = Math.min(...boxes.map((b) => b[1]))
  const x1 = Math.max(...boxes.map((b) => b[2]))
  const y1 = Math.max(...boxes.map((b) => b[3]))
  return { x0, y0, x1, y1, width: x1 - x0, height: y1 - y0 }
}

// Samples per axis for anti-aliasing; 4 gives 16 per pixel, which is smooth at
// 16 px and still fast enough at 1024 px.
const AA = 4

/**
 * Draw the mark to an RGBA PNG.
 *
 * `scale` is the fraction of the canvas the artwork's bounding box fills, so it
 * means the same thing at every size and is what sets each slot's padding: a
 * favicon wants almost the whole frame, an Android adaptive foreground has to
 * stay inside the 66% safe circle. `background` makes the canvas opaque;
 * omitting it leaves genuine transparency.
 */
function renderMark({ shapeList, faces, size, scale = 1, background = null }) {
  const bounds = artworkBounds(shapeList)
  const unit = (size * scale) / Math.max(bounds.width, bounds.height)
  const originX = size / 2 - ((bounds.x0 + bounds.x1) / 2) * unit
  const originY = size / 2 - ((bounds.y0 + bounds.y1) / 2) * unit

  const toUnitX = (deviceX) => (deviceX - originX) / unit
  const toUnitY = (deviceY) => (deviceY - originY) / unit

  // Prepare each shape once, not per pixel. Rebuilding a shape's bounding box
  // inside the sampling loop is what took an early version of this render from
  // seconds to minutes.
  const prepared = shapeList.map(prepare)

  // One flat colour per face, resolved once. The gradient sampling this replaced
  // ran per pixel and, worse, meant a face's colour depended on its position
  // rather than on its orientation -- see the palette note.
  const toneRgb = prepared.map((p) => hexToRgb(faces[p.tone]))

  // Device-space bounding box per shape, so most pixels skip supersampling.
  const boxes = prepared.map((p) => ({
    left: p.box[0] * unit + originX - 1,
    top: p.box[1] * unit + originY - 1,
    right: p.box[2] * unit + originX + 1,
    bottom: p.box[3] * unit + originY + 1,
  }))

  const base = background ? hexToRgb(background) : null
  const rgba = Buffer.alloc(size * size * 4)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      if (base) {
        r = base[0]
        g = base[1]
        b = base[2]
        a = 1
      }

      for (let i = 0; i < prepared.length; i++) {
        const box = boxes[i]
        if (x < box.left || x > box.right || y < box.top || y > box.bottom) {
          continue
        }

        const p = prepared[i]
        let hits = 0
        for (let sy = 0; sy < AA; sy++) {
          const uy = toUnitY(y + (sy + 0.5) / AA)
          for (let sx = 0; sx < AA; sx++) {
            const ux = toUnitX(x + (sx + 0.5) / AA)
            if (p.covers(ux, uy)) hits++
          }
        }
        if (hits === 0) continue

        // Alpha is coverage ONLY. A face is fully opaque, so the sole source of a
        // partial value is an edge pixel that the supersampler found half inside
        // the shape. That is what keeps the backdrop from showing through a face.
        const alpha = hits / (AA * AA)
        const [cr, cg, cb] = toneRgb[i]

        // Source-over, un-premultiplied.
        const out = alpha + a * (1 - alpha)
        if (out > 0) {
          const keep = (a * (1 - alpha)) / out
          const add = alpha / out
          r = cr * add + r * keep
          g = cg * add + g * keep
          b = cb * add + b * keep
        }
        a = out
      }

      const o = (y * size + x) * 4
      rgba[o] = Math.round(r)
      rgba[o + 1] = Math.round(g)
      rgba[o + 2] = Math.round(b)
      rgba[o + 3] = Math.round(a * 255)
    }
  }

  return encodePng(rgba, size, size)
}

// --- PNG encoding -------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([length, body, crc])
}

/** 8-bit RGBA PNG, one filter-0 scanline per row. */
function encodePng(rgba, width, height) {
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type: RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

/** Read a PNG's declared dimensions straight out of IHDR. */
function pngSize(buf) {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

// --- QuickLook, for the social card only --------------------------------------

/**
 * Render the social card via QuickLook, which is the only step needing a text
 * renderer. It emits square thumbnails only, so the card is drawn letterboxed
 * into a square and cropped back with `sips`.
 */
function rasterizeCard(svg, width, height, label) {
  const dir = scratchDir()
  const stem = `${label}-${renderSeq++}`
  const svgPath = path.join(dir, `${stem}.svg`)
  writeFileSync(svgPath, svg)

  execFileSync('qlmanage', ['-t', '-s', String(width), '-o', dir, svgPath], {
    stdio: 'ignore',
  })

  const square = path.join(dir, `${stem}.svg.png`)
  const cropped = path.join(dir, `${stem}.cropped.png`)
  // sips takes the crop box as height then width, anchored at the centre.
  execFileSync(
    'sips',
    ['-c', String(height), String(width), square, '--out', cropped],
    { stdio: 'ignore' },
  )

  const png = readFileSync(cropped)
  const actual = pngSize(png)
  if (actual.width !== width || actual.height !== height) {
    throw new Error(
      `${label}: expected ${width}x${height} but QuickLook produced ` +
        `${actual.width}x${actual.height}.`,
    )
  }
  return png
}

/**
 * Pack PNG blobs into an .ico. Windows has accepted PNG-compressed entries
 * since Vista, so no BMP encoding is needed -- the directory just points at
 * each PNG.
 */
function buildIco(entries) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0) // reserved
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(entries.length, 4)

  const directory = Buffer.alloc(16 * entries.length)
  let offset = header.length + directory.length

  entries.forEach((entry, index) => {
    const at = index * 16
    directory.writeUInt8(entry.size >= 256 ? 0 : entry.size, at + 0)
    directory.writeUInt8(entry.size >= 256 ? 0 : entry.size, at + 1)
    directory.writeUInt8(0, at + 2) // palette size
    directory.writeUInt8(0, at + 3) // reserved
    directory.writeUInt16LE(1, at + 4) // colour planes
    directory.writeUInt16LE(32, at + 6) // bits per pixel
    directory.writeUInt32LE(entry.png.length, at + 8)
    directory.writeUInt32LE(offset, at + 12)
    offset += entry.png.length
  })

  return Buffer.concat([header, directory, ...entries.map((e) => e.png)])
}

// --- outputs -----------------------------------------------------------------

const written = []

function write(file, contents) {
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, contents)
  written.push(path.relative(ROOT, file))
}

const MARK = { faces: LIGHT_FACES, shapeList: MARK_SHAPES }
const MARK_DARK = { ...MARK, faces: DARK_FACES }
const COMPACT = { faces: LIGHT_FACES, shapeList: COMPACT_SHAPES }

function main() {
  // 1. Canonical SVG sources.
  write(path.join(BRAND_DIR, 'rootnative-mark.svg'), markSvg(MARK))
  write(
    path.join(BRAND_DIR, 'rootnative-mark-dark.svg'),
    markSvg({
      ...MARK_DARK,
      note: '  Lighter face tones, for the dark navbar and any dark surface where the\n  #1d4ed8 shaded face loses contrast.',
    }),
  )
  write(
    path.join(BRAND_DIR, 'rootnative-mark-compact.svg'),
    markSvg({
      ...COMPACT,
      note: '  Single-block reduction for sizes where the gaps between the three blocks fill\n  in: favicons, and anything below roughly 24 px.',
    }),
  )
  write(path.join(BRAND_DIR, 'rootnative-social-card.svg'), socialCardSvg())

  // 2. A 512 px PNG of the mark, for READMEs. npm does not resolve relative
  //    paths, so the package READMEs point at this file's raw GitHub URL.
  //    Transparent, so it sits correctly on GitHub's light and dark themes.
  write(
    path.join(BRAND_DIR, 'rootnative-mark.png'),
    renderMark({ ...MARK, size: 512, scale: 0.9 }),
  )

  // 3. Docs site.
  write(path.join(DOCS_IMG_DIR, 'logo.svg'), markSvg(MARK))
  write(path.join(DOCS_IMG_DIR, 'logo-dark.svg'), markSvg(MARK_DARK))
  write(
    path.join(DOCS_IMG_DIR, 'social-card.png'),
    rasterizeCard(
      socialCardSvg({ square: true }),
      CARD_WIDTH,
      CARD_HEIGHT,
      'social-card',
    ),
  )

  // Favicons fill almost the whole frame: a browser tab is ~16 px of usable
  // space and padding there is space thrown away.
  const favicon = (size) => renderMark({ ...COMPACT, size, scale: 0.94 })
  write(path.join(DOCS_IMG_DIR, 'favicon.png'), favicon(180))
  write(
    path.join(DOCS_IMG_DIR, 'favicon.ico'),
    buildIco([16, 32, 48].map((size) => ({ size, png: favicon(size) }))),
  )

  // 4. Example app. Scales are per slot: the store icon fills its tile, the
  //    adaptive foreground has to stay inside Android's 66% safe circle, and
  //    the splash is small because `resizeMode: contain` fits a square image to
  //    the full screen width.
  //    The store icon is the one raster composited onto the dark canvas, so it
  //    takes the lighter face tones -- the same pair the social card uses.
  write(
    path.join(EXAMPLE_ASSET_DIR, 'icon.png'),
    renderMark({
      ...MARK_DARK,
      size: 1024,
      scale: 0.66,
      background: CANVAS_DARK,
    }),
  )
  write(
    path.join(EXAMPLE_ASSET_DIR, 'adaptive-icon.png'),
    renderMark({ ...MARK, size: 1024, scale: 0.45 }),
  )
  write(
    path.join(EXAMPLE_ASSET_DIR, 'splash.png'),
    renderMark({ ...MARK, size: 1024, scale: 0.34 }),
  )
  write(path.join(EXAMPLE_ASSET_DIR, 'favicon.png'), favicon(64))

  if (scratch) rmSync(scratch, { recursive: true, force: true })

  console.log(`Wrote ${written.length} brand assets:`)
  for (const file of written) console.log(`  ${file}`)
}

main()
