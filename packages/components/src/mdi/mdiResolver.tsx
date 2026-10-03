import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons'
import type { IconRenderProps } from '@rootnative/core'
import type { ComponentProps, ReactNode } from 'react'

type MdiName = ComponentProps<typeof MaterialDesignIcons>['name']

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
 * This is the only module in the library that imports the icon package, and
 * it is reachable only through the `@rootnative/components/mdi` subpath. The
 * root entry and every other subpath stay free of the import, so an app with
 * its own `iconResolver` never installs it. Keep it that way: do not
 * re-export this module from `src/index.ts`.
 */
export function mdiResolver(name: string, props: IconRenderProps): ReactNode {
  // `IconSource` is a plain `string` by design: the public API accepts any
  // glyph name, and narrowing it to the vendored union would couple consumers
  // to the icon package's typings. The cast absorbs the difference here, the
  // one place the two meet.
  return (
    <MaterialDesignIcons
      name={name as MdiName}
      size={props.size}
      color={props.color}
    />
  )
}
