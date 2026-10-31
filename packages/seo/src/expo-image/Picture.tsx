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
  /**
   * More files of the same image, each with its width in pixels. The web
   * writes them as `srcset`, and the browser picks the smallest file that
   * fills the shown width at the pixel density of the screen, before any
   * script runs. `source` stays the file of a browser with no `srcset`.
   * Native passes them to `expo-image` in place of `source`, and
   * `expo-image` picks one by the view size and the screen scale. A path
   * resolves as `source` does.
   */
  srcSet?: ReadonlyArray<{ source: string; width: number }>
  /**
   * The width the image shows at, as the HTML `sizes` attribute, for example
   * `'160px'` or `'(min-width: 600px) 50vw, 100vw'`. Without it the browser
   * takes `100vw`, the full window, and picks a file too large for a small
   * image. Web only, and only with `srcSet`.
   */
  sizes?: string
  /** `lazy` defers an image below the fold. Web only. @default 'lazy' */
  loading?: 'lazy' | 'eager'
  /** Wins over the site from `SeoProvider`. A relative `source` needs one. */
  site?: Site
  /**
   * A React Native image style. It comes after the `width` and `height` box,
   * so a size in `style` wins. To let `flex` or `aspectRatio` set a side, set
   * that side to `undefined`. The web lays out the `<img>` as a
   * react-native-web view, and flattens the style to CSS.
   */
  style?: StyleProp<ImageStyle>
  testID?: string
}

/**
 * The react-native-web `View` defaults that change the layout or the border
 * of an `<img>`. A raw element has none of them: with no `min-height: 0` a
 * flex item keeps the height of its ratio, with no `border-style` a border
 * width draws nothing, and with `position: static` an offset does nothing.
 */
const WEB_VIEW_DEFAULTS: CSSProperties = {
  boxSizing: 'border-box',
  borderWidth: 0,
  borderStyle: 'solid',
  borderColor: 'black',
  flexShrink: 0,
  minHeight: 0,
  minWidth: 0,
  position: 'relative',
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

/** The `src` of the web `<img>`: a relative source becomes a path under the host. */
function webSource(source: string, site: Site | undefined): string {
  if (isAbsolute(source)) return source
  const url = new URL(resolveSource(source, site))
  return `${url.pathname}${url.search}`
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
  const files = props.srcSet?.length ? props.srcSet : undefined

  if (Platform.OS === 'web') {
    const srcSet = files
      ?.map((file) => `${webSource(file.source, site)} ${file.width}w`)
      .join(', ')
    const css: CSSProperties = {
      ...WEB_VIEW_DEFAULTS,
      width,
      height,
      objectFit: contentFit,
      ...(StyleSheet.flatten(style) as CSSProperties | undefined),
    }
    // A side with no CSS value takes its size from the `width` or `height`
    // attribute. On native that side is `auto`, so write `auto` here too.
    css.width ??= 'auto'
    css.height ??= 'auto'
    return (
      <img
        src={webSource(source, site)}
        srcSet={srcSet}
        sizes={srcSet ? props.sizes : undefined}
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

  const sources = files?.map((file) => ({
    uri: resolveSource(file.source, site),
    width: file.width,
    height: Math.round((file.width * height) / width),
  }))

  return (
    <Image
      source={sources ?? { uri: url }}
      alt={alt}
      accessibilityLabel={alt}
      accessible={alt !== ''}
      contentFit={contentFit}
      style={[{ width, height }, style]}
      testID={props.testID}
    />
  )
}
