import path from "path"
import fs from "fs/promises"
import crypto from "crypto"
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – we rely on the bundled types or will install @types/sharp later
import sharp from "sharp"

/**
 * Unicode code-points (lowercase hex) for fruit emojis.
 * The SVGs should live at `public/avatars/fruits/<code>.svg`.
 */
const FRUITS = [
  "1F351", // 🍑 Peach
  "1F352", // 🍒 Cherries
  "1F96D", // 🥭 Mango
  "1F965", // 🥥 Coconut
  "1FAD2", // 🫒 Olive
] as const

/**
 * Solid-colour backgrounds. Fill with 25 hex strings (no leading # removed).
 * Example: "#f87171" (tailwind rose-400)
 */
// prettier-ignore
export const BACKGROUNDS: string[] = [
    "#ffd1dc", // pastel pink
    "#ffe5b4", // pastel peach
    "#fff5ba", // pastel yellow
    "#d1f7c4", // pastel green
    "#c8e7f0", // pastel blue
    "#e0bbf9", // pastel purple
    "#f6d6ad", // pastel apricot
    "#f9c6c9", // pastel rose
    "#d8f3dc", // mint green
    "#e3f2fd", // baby blue
    "#e0f7fa", // light aqua
    "#fce4ec", // soft pink
    "#ede7f6", // lavender
    "#fff3e0", // light orange
    "#f0f4c3", // lemon cream
    "#c5e1a5", // soft lime
    "#b2dfdb", // turquoise tint
    "#d7ccc8", // muted taupe
    "#f8bbd0", // cotton candy
    "#dcedc8", // pale green
    "#f3e5f5", // soft lilac
    "#e6ee9c", // light chartreuse
    "#ffecb3", // vanilla
    "#ffccbc", // pastel coral
    "#cfd8dc", // cloudy grey-blue
  ];

// Output directory (absolute path)
const OUTPUT_DIR = path.resolve(process.cwd(), "public", "avatars", "generated")

/**
 * Deterministically generates (or returns pre-existing) avatar for a given userId.
 * Returns a public URL such as "/avatars/generated/<userId>.png".
 */
export async function generateAvatar(userId: string): Promise<string> {
  if (!userId) throw new Error("generateAvatar: userId is required")

  // Derive background + fruit indexes from a SHA-256 hash for stability
  const hash = crypto.createHash("sha256").update(userId).digest()
  const bgIndex = hash[0] % BACKGROUNDS.length
  const fruitIndex = hash[1] % FRUITS.length

  const bgHex = BACKGROUNDS[bgIndex]
  const fruitCode = FRUITS[fruitIndex]

  const outputFile = `${userId}.png`
  const outputPath = path.join(OUTPUT_DIR, outputFile)

  // If we've already generated it, short-circuit
  try {
    await fs.access(outputPath)
    return `/avatars/generated/${outputFile}`
  } catch (_) {
    /* continue — file does not exist */
  }

  // Ensure output dir exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  // Load fruit SVG
  const fruitPath = path.resolve(
    process.cwd(),
    "public",
    "avatars",
    "fruits",
    `${fruitCode}.svg`
  )
  const fruitSvg = await fs.readFile(fruitPath)

  // Prepare overlay
  const FRUIT_SIZE = 180 // pixels
  const fruitOverlay = await sharp(fruitSvg)
    .resize(FRUIT_SIZE, FRUIT_SIZE, {
      fit: "contain",
    })
    .toBuffer()

  // Create 256×256 background & composite SVG centred
  const image = sharp({
    create: {
      width: 256,
      height: 256,
      channels: 4,
      background: bgHex,
    },
  })

  await image
    .composite([
      {
        input: fruitOverlay,
        gravity: "center",
        // The SVG will scale automatically to fit; we can tweak density if needed
      },
    ])
    .png()
    .toFile(outputPath)

  return `/avatars/generated/${outputFile}`
}

// ---------- CLI helper ----------
// `pnpm tsx scripts/generateAvatar.ts <userId>`
if (require.main === module) {
  const uid = process.argv[2]
  if (!uid) {
    // eslint-disable-next-line no-console
    console.error("Usage: generateAvatar <userId>")
    process.exit(1)
  }
  generateAvatar(uid)
    .then(url => {
      // eslint-disable-next-line no-console
      console.log("Generated avatar:", url)
    })
    .catch(err => {
      // eslint-disable-next-line no-console
      console.error(err)
      process.exit(1)
    })
}
