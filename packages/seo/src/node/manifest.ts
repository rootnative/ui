import { writeOutput } from './write'

export type ManifestIcon = {
  /** Relative to the manifest, for example `./apple-touch-icon.png`. */
  src: string
  /** For example `180x180`. */
  sizes: string
  /** The default follows the file extension of `src`. */
  type?: string
  purpose?: 'any' | 'maskable' | 'monochrome' | 'any maskable'
}

export type ManifestOptions = {
  name: string
  shortName?: string
  description?: string
  /** Relative, so it works under a subpath host. The default is `./`. */
  startUrl?: string
  /** The default is `./`. */
  scope?: string
  /** The default is `standalone`. */
  display?: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser'
  themeColor?: string
  backgroundColor?: string
  lang?: string
  icons?: ManifestIcon[]
}

export type WriteManifestOptions = ManifestOptions & {
  outDir: string
  /** The default is `manifest.webmanifest`. */
  fileName?: string
}

const MIME_BY_EXTENSION: Record<string, string> = {
  png: 'image/png',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
}

function iconType(src: string): string | undefined {
  const extension = src.split('?')[0]?.split('.').pop()?.toLowerCase()
  return extension ? MIME_BY_EXTENSION[extension] : undefined
}

/** The manifest as a plain object, with every empty field left out. */
export function manifestJson(
  options: ManifestOptions,
): Record<string, unknown> {
  const manifest: Record<string, unknown> = {
    name: options.name,
    short_name: options.shortName,
    description: options.description,
    start_url: options.startUrl ?? './',
    scope: options.scope ?? './',
    display: options.display ?? 'standalone',
    theme_color: options.themeColor,
    background_color: options.backgroundColor,
    lang: options.lang,
    icons: options.icons?.map((icon) => ({
      src: icon.src,
      sizes: icon.sizes,
      type: icon.type ?? iconType(icon.src),
      purpose: icon.purpose,
    })),
  }
  for (const [key, value] of Object.entries(manifest)) {
    if (value === undefined || value === '') delete manifest[key]
    if (Array.isArray(value)) {
      if (value.length === 0) delete manifest[key]
      else {
        manifest[key] = value.map((item: Record<string, unknown>) =>
          Object.fromEntries(
            Object.entries(item).filter(([, v]) => v !== undefined),
          ),
        )
      }
    }
  }
  return manifest
}

/** Writes `manifest.webmanifest` into `outDir` and returns the file path. */
export function writeManifest(options: WriteManifestOptions): Promise<string> {
  return writeOutput(
    options.outDir,
    options.fileName ?? 'manifest.webmanifest',
    `${JSON.stringify(manifestJson(options), null, 2)}\n`,
  )
}
