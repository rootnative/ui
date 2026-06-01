import { useTheme } from '@rootnative/core'
import type { MaterialTheme } from '@rootnative/core'
import { useMemo } from 'react'
import type { ComponentType, ReactNode } from 'react'
import type { StyleProp, TextProps, TextStyle } from 'react-native'
import { StyleSheet, Text } from 'react-native'
import { createStyles } from './styles'
import type { TypographyVariant } from './types'

const HEADING_VARIANTS: ReadonlySet<TypographyVariant> = new Set([
  'displayLarge',
  'displayMedium',
  'displaySmall',
  'headlineLarge',
  'headlineMedium',
  'headlineSmall',
])

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
}

export function Typography({
  children,
  variant = 'bodyMedium',
  color,
  style,
  as: Component = Text,
  accessibilityRole,
  ...textProps
}: TypographyProps) {
  const theme = useTheme() as MaterialTheme
  const typographyStyle = theme.typography[variant]
  const styles = useMemo(() => createStyles(theme), [theme])
  const resolvedRole =
    accessibilityRole ?? (HEADING_VARIANTS.has(variant) ? 'header' : undefined)

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
