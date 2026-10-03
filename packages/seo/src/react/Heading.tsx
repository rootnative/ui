import type { ComponentType } from 'react'
import { Text, type TextProps } from 'react-native'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

// `as` is omitted from `P` too: a text component with an `as` prop of its own,
// such as `Typography`, would otherwise intersect the two `as` types.
export type HeadingProps<P extends TextProps = TextProps> = Omit<
  P,
  'accessibilityRole' | 'aria-level' | 'role' | 'as'
> & {
  /** The outline level. Renders `<h1>` to `<h6>` on the web. */
  level: HeadingLevel
  /**
   * The text component to render. The default is the React Native `Text`.
   * Pass `Typography` from `@rootnative/components` to keep the type scale.
   */
  as?: ComponentType<P>
}

/**
 * A text element with the heading role and an outline level. A plain `Text`
 * renders a `<div>` on the web, which gives a crawler no outline. This renders
 * `<h1>` to `<h6>` through react-native-web and announces a header on native.
 */
export function Heading<P extends TextProps = TextProps>({
  level,
  as,
  ...rest
}: HeadingProps<P>) {
  const Component = (as ?? Text) as ComponentType<TextProps>
  return (
    <Component
      {...(rest as TextProps)}
      accessibilityRole="header"
      aria-level={level}
    />
  )
}
