import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons'
import type { IconRenderProps } from '@rootnative/core'
import {
  type ComponentProps,
  type ReactNode,
  useSyncExternalStore,
} from 'react'

type MdiName = ComponentProps<typeof MaterialDesignIcons>['name']

const subscribeToNothing = () => () => {}
const notHydrating = () => false
const isHydratingOnServer = () => true

/**
 * The same flag as `useIsHydrating` in `core`, which `core` does not export.
 * `true` on the server and through the hydration pass of a static export.
 */
function useIsHydrating(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    notHydrating,
    isHydratingOnServer,
  )
}

interface MdiIconProps extends IconRenderProps {
  name: string
}

/**
 * Renders no glyph while a static export hydrates.
 *
 * `@react-native-vector-icons/common` 13 draws the glyph on the export server,
 * where it does no dynamic font loading. On the client its first render is an
 * empty string until `expo-font` loads the font. That text mismatch makes
 * React discard the static HTML and render the whole tree again (React error
 * #418). Without a name the icon set draws `''` on both sides, and it is still
 * the same component, so it starts the font load during hydration and keeps
 * that state on the next render, which passes the name.
 */
function MdiIcon({ name, size, color }: MdiIconProps) {
  const isHydrating = useIsHydrating()
  // `IconSource` is a plain `string` by design: the public API accepts any
  // glyph name, and narrowing it to the vendored union would couple consumers
  // to the icon package's typings. The cast absorbs the difference here, the
  // one place the two meet.
  const glyphName = (isHydrating ? '' : name) as MdiName
  return <MaterialDesignIcons name={glyphName} size={size} color={color} />
}

/**
 * Resolves a string icon name through `MaterialDesignIcons` from
 * `@react-native-vector-icons/material-design-icons`, the package Expo
 * recommends in place of `@expo/vector-icons`
 * (https://expo.dev/blog/moving-away-from-expo-vector-icons). Pass it to
 * `ThemeProvider`:
 *
 * ```tsx
 * import { mdiResolver } from '@rootnative/components/mdi'
 *
 * <ThemeProvider iconResolver={mdiResolver}>{children}</ThemeProvider>
 * ```
 *
 * The root import loads the font at run time through `expo-font` when an Expo
 * runtime is present, so it works in Expo Go and on web. A development build
 * can embed the font instead: pass the `/static` export of the package to
 * `createVectorIconsResolver` from `@rootnative/icons`.
 *
 * In a static web export the icons are empty in the HTML and draw after
 * hydration, when the font loads.
 *
 * This is the only module in the library that imports the icon package, and
 * it is reachable only through the `@rootnative/components/mdi` subpath. The
 * root entry and every other subpath stay free of the import, so an app with
 * its own `iconResolver` never installs it. Keep it that way: do not
 * re-export this module from `src/index.ts`.
 */
export function mdiResolver(name: string, props: IconRenderProps): ReactNode {
  return <MdiIcon name={name} size={props.size} color={props.color} />
}
