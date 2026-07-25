/**
 * Z-order contract for overlays rendered through `Portal`.
 *
 * Entries in the same host are stacked by ascending `priority`, ties broken by
 * mount order. These constants are the layers RootNative's own overlay
 * components use; consumers can slot custom overlays between them by passing
 * any number (e.g. `PORTAL_LAYERS.dialog + 1`).
 *
 * The gaps are intentional — 100 apart leaves room for future layers without
 * renumbering the ones already frozen.
 */
export const PORTAL_LAYERS = {
  /** Bottom sheets and side sheets, plus their scrim. Sits below everything. */
  sheet: 100,
  /** Dialogs and their scrim. Above sheets — a dialog can be raised from one. */
  dialog: 200,
  /**
   * Snackbars. Above dialogs so a confirmation stays visible while a modal is
   * open, and so a queued message is never hidden behind one.
   */
  snackbar: 300,
  /**
   * Menus and dropdowns. Above snackbars because a menu can be opened from any
   * surface below it, including a dialog's actions.
   */
  menu: 400,
  /** Tooltips. Topmost — they can describe a control in any layer below. */
  tooltip: 500,
} as const

/** Name of one of the built-in {@link PORTAL_LAYERS}. */
export type PortalLayerName = keyof typeof PORTAL_LAYERS

/** Host that receives portals with no explicit `hostName`. */
export const DEFAULT_PORTAL_HOST = 'default'
