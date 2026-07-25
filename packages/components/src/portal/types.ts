import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'

export interface PortalHostProps {
  /** Content rendered inside the host. Optional on a named (slot) host. */
  children?: ReactNode
  /**
   * Registers this host under a name that `<Portal hostName="…">` can target.
   *
   * A named host must sit inside a root `<PortalHost>` — it renders its
   * portals where it appears in the tree instead of in the root overlay, which
   * is the point of naming one (scoping overlays to a screen or a nested
   * navigator). Cross-host stacking therefore follows tree position, not
   * `priority`; `priority` only orders portals inside the same host. Anything
   * that has to participate in the app-wide z-order belongs in the default
   * host with a `priority` from `PORTAL_LAYERS`.
   */
  name?: string
  /**
   * Style applied to the root container on a root host, or to the overlay
   * container on a named host (which absolute-fills its parent by default).
   */
  style?: StyleProp<ViewStyle>
}

export interface PortalProps {
  /** Content teleported into the host's overlay layer. */
  children: ReactNode
  /**
   * Name of the host to render into. Falls back to the default host when no
   * host with this name is mounted.
   * @default 'default'
   */
  hostName?: string
  /**
   * Stack order within the host — higher renders above lower, ties broken by
   * mount order. Use the `PORTAL_LAYERS` constants for the layers RootNative
   * itself defines.
   * @default 0
   */
  priority?: number
}
