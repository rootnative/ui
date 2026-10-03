import type { ReactElement } from 'react'

export type ShellTagsOptions = {
  /**
   * The base path of a subpath host, for example `/ui/demo`. Every relative
   * `href` in this list is prefixed with it. Pass `process.env.EXPO_BASE_URL`.
   */
  basePath?: string
  themeColor?: string
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

/**
 * The head of the HTML shell as React elements: charset, viewport, theme
 * colour, icons, manifest, and preconnect links. Place the result first in the
 * `<head>` of `app/+html.tsx`. It has no router dependency, so the same list
 * serves a Vite template through `renderToStaticMarkup`.
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
  ]
  if (options.themeColor) {
    tags.push(
      <meta
        key="theme-color"
        name="theme-color"
        content={options.themeColor}
      />,
    )
  }
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
