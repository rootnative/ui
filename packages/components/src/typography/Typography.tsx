import { useTheme } from '@rootnative/core'
import type { MaterialTheme } from '@rootnative/core'
import { useMemo } from 'react'
import type { ComponentType, ReactNode } from 'react'
import type { StyleProp, TextProps, TextStyle } from 'react-native'
import { Platform, StyleSheet, Text } from 'react-native'
import { createStyles } from './styles'
import type { TypographyVariant } from './types'

// Read from the name, not from a list: a list of the six plain names missed
// the `*Emphasized` variants, which are headings too.
function isHeadingVariant(variant: TypographyVariant): boolean {
  return variant.startsWith('display') || variant.startsWith('headline')
}

export interface TypographyProps extends Omit<TextProps, 'children' | 'style'> {
  /** Content to display. Accepts strings, numbers, or nested elements. */
  children: ReactNode
  /**
   * MD3 type scale role. Controls font size, weight, line height, and letter spacing.
   * @default 'bodyMedium'
   */
  variant?: TypographyVariant
  /** Override the text color. Takes priority over `style.color`. Defaults to the theme's `onSurface` color. */
  color?: string
  /** Additional text styles. Can override the default theme color via `style.color` when no `color` prop is set. */
  style?: StyleProp<TextStyle>
  /**
   * Override the underlying text component (e.g. Animated.Text).
   * @default Text
   */
  as?: ComponentType<TextProps>
  /**
   * The outline level of a heading. Sets the header role and `aria-level`, so
   * the web renders `<h1>` to `<h6>` and a crawler reads the outline. Without
   * it, a display or headline variant, plain or `Emphasized`, announces a
   * header on native only: on the web a level-less header is always `<h1>`,
   * and a page with five display texts had five `<h1>`.
   */
  level?: 1 | 2 | 3 | 4 | 5 | 6
}

export function Typography({
  children,
  variant = 'bodyMedium',
  color,
  style,
  as: Component = Text,
  accessibilityRole,
  level,
  ...textProps
}: TypographyProps) {
  const theme = useTheme() as MaterialTheme
  const typographyStyle = theme.typography[variant]
  const styles = useMemo(() => createStyles(theme), [theme])
  // RN's `TextProps` has no `aria-level`, but react-native-web reads it, and a
  // wrapper such as `Heading` from `@rootnative/seo` passes it with the header
  // role. Keep it, or the spread below would reset it to `undefined` and the
  // web would fall back to `<h1>`.
  const ariaLevelProp = (textProps as { 'aria-level'?: number })['aria-level']
  const impliedHeader =
    level !== undefined || (isHeadingVariant(variant) && Platform.OS !== 'web')
  const resolvedRole =
    accessibilityRole ?? (impliedHeader ? 'header' : undefined)

  // When the consumer overrides fontSize via style, auto-adjust lineHeight
  // proportionally so text isn't clipped inside overflow:hidden containers.
  // Skipped when: no style prop (theme lineHeight is already proportional),
  // no fontSize override, or consumer explicitly sets lineHeight.
  const lineHeightFix = useMemo(() => {
    if (!style) return undefined
    const flat = StyleSheet.flatten(style)
    if (!flat?.fontSize || flat.lineHeight) return undefined
    const ratio = typographyStyle.lineHeight / typographyStyle.fontSize
    return { lineHeight: Math.ceil(flat.fontSize * ratio) }
  }, [style, typographyStyle.fontSize, typographyStyle.lineHeight])

  const colorOverride = useMemo(
    () => (color != null ? { color } : undefined),
    [color],
  )

  return (
    <Component
      {...textProps}
      accessibilityRole={resolvedRole}
      aria-level={level ?? ariaLevelProp}
      style={[
        styles.base,
        typographyStyle,
        style,
        lineHeightFix,
        colorOverride,
      ]}
    >
      {children}
    </Component>
  )
}
