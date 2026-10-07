import type { ReactElement } from 'react'

type ThemeColor = string | { light: string; dark: string }

export type ShellTagsOptions = {
  /**
   * The base path of a subpath host, for example `/ui/demo`. Every relative
   * `href` in this list is prefixed with it. Pass `process.env.EXPO_BASE_URL`.
   */
  basePath?: string
  /**
   * The browser toolbar colour. The `{ light, dark }` form writes one
   * `theme-color` tag for each `prefers-color-scheme`. The tags follow the
   * system scheme, not a mode the user picks in the app.
   */
  themeColor?: ThemeColor
  /** The `/favicon.ico` or `.png` of the site. */
  favicon?: string
  /** A 180×180 PNG for iOS. */
  appleTouchIcon?: string
  /** The web app manifest path. */
  manifest?: string
  /** Origins the first paint needs: the API, a CDN, a font host. */
  preconnect?: Array<{ href: string; crossOrigin?: boolean }>
  /** The default is `width=device-width, initial-scale=1, shrink-to-fit=no`. */
  viewport?: string
}

const DEFAULT_VIEWPORT = 'width=device-width, initial-scale=1, shrink-to-fit=no'

function withBase(basePath: string | undefined, href: string): string {
  if (!basePath || /^https?:\/\//.test(href)) return href
  const base = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath
  return `${base}${href.startsWith('/') ? href : `/${href}`}`
}

function themeColorTags(themeColor: ThemeColor | undefined): ReactElement[] {
  if (!themeColor) return []
  if (typeof themeColor === 'string') {
    return [<meta key="theme-color" name="theme-color" content={themeColor} />]
  }
  return (['light', 'dark'] as const)
    .filter((scheme) => themeColor[scheme])
    .map((scheme) => (
      <meta
        key={`theme-color:${scheme}`}
        name="theme-color"
        media={`(prefers-color-scheme: ${scheme})`}
        content={themeColor[scheme]}
      />
    ))
}

/**
 * The head of the HTML shell as React elements: charset, viewport, theme
 * colour, icons, manifest, and preconnect links. Place the result first in the
 * `<head>` of `app/+html.tsx`. It has no router dependency, so the same list
 * serves a Vite template through `renderToStaticMarkup`.
 *
 * Expo Router writes the `PageHead` tags at the start of `<head>`, before
 * these. On a page with a long head the charset is then after byte 1024,
 * where the HTML spec requires it, so the host must send
 * `Content-Type: text/html; charset=utf-8`.
 */
export function shellTags(options: ShellTagsOptions = {}): ReactElement[] {
  const { basePath } = options
  const tags: ReactElement[] = [
    <meta key="charset" charSet="utf-8" />,
    <meta
      key="viewport"
      name="viewport"
      content={options.viewport ?? DEFAULT_VIEWPORT}
    />,
    ...themeColorTags(options.themeColor),
  ]
  if (options.favicon) {
    tags.push(
      <link key="icon" rel="icon" href={withBase(basePath, options.favicon)} />,
    )
  }
  if (options.appleTouchIcon) {
    tags.push(
      <link
        key="apple-touch-icon"
        rel="apple-touch-icon"
        href={withBase(basePath, options.appleTouchIcon)}
      />,
    )
  }
  if (options.manifest) {
    tags.push(
      <link
        key="manifest"
        rel="manifest"
        href={withBase(basePath, options.manifest)}
      />,
    )
  }
  for (const origin of options.preconnect ?? []) {
    tags.push(
      <link
        key={`preconnect:${origin.href}`}
        rel="preconnect"
        href={origin.href}
        crossOrigin={origin.crossOrigin ? 'anonymous' : undefined}
      />,
    )
  }
  return tags
}
