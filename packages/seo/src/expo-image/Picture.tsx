import { Image, type ImageContentFit } from 'expo-image'
import { useContext, type CSSProperties } from 'react'
import {
  Platform,
  StyleSheet,
  type ImageStyle,
  type StyleProp,
} from 'react-native'
import { SeoContext } from '../react/SeoProvider'
import { resolveUrl } from '../site'
import type { Site } from '../types'

export type PictureProps = {
  /**
   * The image: absolute, or a path under the site URL, like `PageMeta.image`.
   * The web `<img>` gets the path under the host; native gets the absolute
   * URL.
   */
  source: string
  /** The text a crawler and a screen reader read. Pass `''` for a decorative image. */
  alt: string
  /**
   * The box, in CSS pixels on the web and in dp on native. Both are
   * required: the page reserves the space before the image loads, and a
   * crawler reads the size.
   */
  width: number
  height: number
  /** How the image fills the box. The values are the CSS `object-fit` values. @default 'cover' */
  contentFit?: ImageContentFit
  /** `lazy` defers an image below the fold. Web only. @default 'lazy' */
  loading?: 'lazy' | 'eager'
  /** Wins over the site from `SeoProvider`. A relative `source` needs one. */
  site?: Site
  style?: StyleProp<ImageStyle>
  testID?: string
}

function isAbsolute(source: string): boolean {
  return /^https?:\/\//.test(source)
}

/**
 * The image as a URL. A relative `source` joins the site URL, so it needs the
 * site; an absolute one passes through.
 */
function resolveSource(source: string, site: Site | undefined): string {
  if (isAbsolute(source)) return source
  if (!site) {
    throw new Error(
      'Picture: a relative `source` needs the site. Wrap the tree in <SeoProvider site={site}>, pass `site`, or pass an absolute URL.',
    )
  }
  return resolveUrl(site, source)
}

/**
 * An image a crawler sees. `expo-image` mounts its image in an effect, so a
 * static export holds no `<img>`; this renders a plain `<img>` on the web,
 * with `alt`, `width` and `height`, and `expo-image` on native. The web
 * side takes a React Native style, flattened: the keys an image uses are
 * CSS keys.
 */
export function Picture(props: PictureProps) {
  const fromContext = useContext(SeoContext)?.site
  const site = props.site ?? fromContext
  const { source, alt, width, height, contentFit = 'cover', style } = props
  const url = resolveSource(source, site)

  if (Platform.OS === 'web') {
    const src = isAbsolute(source)
      ? source
      : `${new URL(url).pathname}${new URL(url).search}`
    const css: CSSProperties = {
      objectFit: contentFit,
      ...(StyleSheet.flatten(style) as CSSProperties | undefined),
    }
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={props.loading ?? 'lazy'}
        decoding="async"
        style={css}
        data-testid={props.testID}
      />
    )
  }

  return (
    <Image
      source={{ uri: url }}
      alt={alt}
      accessibilityLabel={alt}
      accessible={alt !== ''}
      contentFit={contentFit}
      style={[{ width, height }, style]}
      testID={props.testID}
    />
  )
}
