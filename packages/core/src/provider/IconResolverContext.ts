import * as React from 'react'

/** Sizing/coloring information passed to icon resolvers and render functions. */
export interface IconRenderProps {
  size: number
  /**
   * Resolved icon color. May be `undefined` when the component inherits
   * color from a parent text style — handle that case by deferring to the
   * icon library's own default.
   */
  color?: string
}

/**
 * Maps a string icon name to a rendered icon node. Configured at the
 * provider level so consumers can plug in SF Symbols, Lucide, custom SVGs,
 * etc. without forking components.
 */
export type IconResolver = (
  name: string,
  props: IconRenderProps,
) => React.ReactNode

/**
 * Anything a component will accept for an icon prop:
 *
 * - **string** — a name resolved via the `iconResolver` registered on
 *   `ThemeProvider`. Falls back to `MaterialCommunityIcons` when no
 *   resolver is set, preserving the legacy default.
 * - **ReactElement** — a pre-rendered icon. The caller is responsible for
 *   passing size and color; the component will not override them.
 * - **(props) => ReactNode** — a render function that receives the
 *   component's resolved size and color. Useful for plugging in Lucide,
 *   SF Symbols, or custom SVGs without losing theme integration.
 */
export type IconSource =
  | string
  | React.ReactElement
  | ((props: IconRenderProps) => React.ReactNode)

export const IconResolverContext = React.createContext<IconResolver | null>(
  null,
)
