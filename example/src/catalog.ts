/**
 * Single source of truth for the demo catalog.
 *
 * The home screen builds its grid from `sections`, the AppBar jump menu and the
 * per-screen prev/next footer walk `catalogEntries`, and `ScreenIntro` looks up
 * the current route here for its description, install command, and docs link.
 * Adding a component means adding one entry — every navigation surface picks it
 * up automatically.
 */

/** Docs site root — `docusaurus.config.ts` serves docs at the site root. */
export const DOCS_BASE_URL = 'https://rootnative.github.io/ui/'

export interface CatalogEntry {
  /** Display name. Also the key the home-screen `Preview` switch matches on. */
  label: string
  /** Expo Router path. */
  route: string
  /** One-line summary — shown on the home card and under the screen title. */
  description: string
  /**
   * Component name to pass to `rootnative add`. Omitted for screens that
   * demonstrate a behavior rather than an installable component.
   */
  add?: string
  /** Page path on the docs site, relative to {@link DOCS_BASE_URL}. */
  docs?: string
  /**
   * Extra search terms — aliases and related words that don't appear in the
   * label or description ("toast" should find Snackbar).
   */
  keywords?: string
}

export interface CatalogSection {
  title: string
  /** Condensed title for the home-screen filter chips, where space is tight. */
  shortTitle: string
  description: string
  items: CatalogEntry[]
}

export const sections: CatalogSection[] = [
  {
    title: 'Foundations',
    shortTitle: 'Foundations',
    description: 'Type, layout, and direction primitives',
    items: [
      {
        label: 'Typography',
        route: '/typography',
        description: 'Display, headline, body, and label text styles',
        add: 'typography',
        docs: 'components/typography',
        keywords: 'text type scale font heading title label',
      },
      {
        label: 'Layout',
        route: '/layout',
        description: 'Flexbox primitives for building page structure',
        add: 'layout',
        docs: 'components/layout',
        keywords: 'box row column grid stack flex spacing safe area',
      },
      {
        label: 'RTL',
        route: '/rtl',
        description: 'Right-to-left layout — toggle from the AppBar',
        keywords: 'right to left direction bidi i18n locale arabic hebrew',
      },
    ],
  },
  {
    title: 'Actions & Inputs',
    shortTitle: 'Actions',
    description: 'Buttons, chips, and text fields',
    items: [
      {
        label: 'Button',
        route: '/button',
        description: 'Filled, outlined, tonal, elevated, and text buttons',
        add: 'button',
        docs: 'components/button',
        keywords: 'cta action press filled tonal elevated',
      },
      {
        label: 'ButtonGroup',
        route: '/button-group',
        description:
          'Standard and connected button groups with single/multi select',
        add: 'button-group',
        docs: 'components/button-group',
        keywords: 'segmented toggle group connected multi select',
      },
      {
        label: 'IconButton',
        route: '/icon-button',
        description: 'Compact icon-only actions with toggle and size variants',
        add: 'icon-button',
        docs: 'components/icon-button',
        keywords: 'icon action toggle compact',
      },
      {
        label: 'FAB',
        route: '/fab',
        description:
          'Floating action button — primary, surface, sizes, and extended',
        add: 'fab',
        docs: 'components/fab',
        keywords: 'floating action button extended primary',
      },
      {
        label: 'Chip',
        route: '/chip',
        description: 'Compact elements for filters and selections',
        add: 'chip',
        docs: 'components/chip',
        keywords: 'tag filter assist input suggestion pill badge',
      },
      {
        label: 'TextField',
        route: '/text-field',
        description: 'Filled and outlined text input fields',
        add: 'text-field',
        docs: 'components/text-field',
        keywords: 'input form entry textbox placeholder helper error',
      },
      {
        label: 'Keyboard Wrapper',
        route: '/keyboard-avoiding-wrapper',
        description: 'Smart keyboard-aware wrapper with platform behavior',
        add: 'keyboard-avoiding-wrapper',
        docs: 'components/keyboard-avoiding-wrapper',
        keywords: 'keyboard avoiding view inset scroll form',
      },
    ],
  },
  {
    title: 'Selection',
    shortTitle: 'Selection',
    description: 'Toggles, checkboxes, radios, and sliders',
    items: [
      {
        label: 'Switch',
        route: '/switch',
        description: 'Toggle controls for on/off settings',
        add: 'switch',
        docs: 'components/switch',
        keywords: 'toggle on off boolean setting',
      },
      {
        label: 'Checkbox',
        route: '/checkbox',
        description: 'Selection controls for multiple choices',
        add: 'checkbox',
        docs: 'components/checkbox',
        keywords: 'tick check multi select indeterminate',
      },
      {
        label: 'Radio',
        route: '/radio',
        description: 'Selection controls for single-choice options',
        add: 'radio',
        docs: 'components/radio',
        keywords: 'option single choice group',
      },
      {
        label: 'Slider',
        route: '/slider',
        description: 'Continuous, discrete, range, and centered MD3 sliders',
        add: 'slider',
        docs: 'components/slider',
        keywords: 'range track thumb steps discrete continuous',
      },
    ],
  },
  {
    title: 'Containment & Display',
    shortTitle: 'Display',
    description: 'Surfaces, lists, app bars, avatars, and progress',
    items: [
      {
        label: 'AppBar',
        route: '/appbar',
        description: 'Top app bars for navigation and actions',
        add: 'appbar',
        docs: 'components/appbar',
        keywords: 'toolbar header navbar top app bar title collapse',
      },
      {
        label: 'Card',
        route: '/card',
        description: 'Contained surfaces for grouping related content',
        add: 'card',
        docs: 'components/card',
        keywords: 'surface panel tile container elevated outlined',
      },
      {
        label: 'List',
        route: '/list',
        description: 'Vertically arranged items with text and icons',
        add: 'list',
        docs: 'components/list',
        keywords: 'listitem row headline supporting leading trailing',
      },
      {
        label: 'Divider',
        route: '/divider',
        description:
          'Horizontal and vertical 1dp rules with optional edge insets',
        add: 'divider',
        docs: 'components/divider',
        keywords: 'separator rule line hairline inset',
      },
      {
        label: 'Avatar',
        route: '/avatar',
        description: 'Circular user representations — image, icon, or initials',
        add: 'avatar',
        docs: 'components/avatar',
        keywords: 'profile picture initials user photo',
      },
      {
        label: 'Progress',
        route: '/progress',
        description:
          'Linear and circular progress (determinate, indeterminate)',
        add: 'progress',
        docs: 'components/progress',
        keywords: 'loader spinner bar linear circular determinate',
      },
      {
        label: 'Loading Indicator',
        route: '/loading-indicator',
        description:
          'Expressive shape-morphing loading spinner (contained + uncontained)',
        add: 'loading-indicator',
        docs: 'components/loading-indicator',
        keywords: 'spinner loader busy expressive morph shapes',
      },
      {
        label: 'Skeleton',
        route: '/skeleton',
        description: 'Pulsing loading placeholders that match content shape',
        add: 'skeleton',
        docs: 'components/skeleton',
        keywords: 'placeholder shimmer loading pulse ghost block',
      },
      {
        label: 'Portal',
        route: '/portal',
        description:
          'Render overlays above the rest of the tree — toasts, dialogs, scrims',
        add: 'portal',
        docs: 'components/portal',
        keywords: 'overlay teleport host layer z-index scrim',
      },
      {
        label: 'Dialog',
        route: '/dialog',
        description: 'Basic and full-screen modal dialogs with compound slots',
        add: 'dialog',
        docs: 'components/dialog',
        keywords: 'modal alert prompt confirm popup full screen',
      },
      {
        label: 'BottomSheet',
        route: '/bottom-sheet',
        description:
          'Draggable modal and standard sheets with velocity-based snap points',
        add: 'bottom-sheet',
        docs: 'components/bottom-sheet',
        keywords: 'sheet drawer drag swipe snap dismiss handle modal',
      },
      {
        label: 'Snackbar',
        route: '/snackbar',
        description: 'Queued transient messages via SnackbarProvider',
        add: 'snackbar',
        docs: 'components/snackbar',
        keywords: 'toast notification message queue transient',
      },
      {
        label: 'Menu',
        route: '/menu',
        description:
          'Anchored dropdown menus that flip and shift to stay on screen',
        add: 'menu',
        docs: 'components/menu',
        keywords: 'dropdown popover context anchored options',
      },
      {
        label: 'Tooltip',
        route: '/tooltip',
        description: 'Plain and rich tooltips on hover or a long press',
        add: 'tooltip',
        docs: 'components/tooltip',
        keywords: 'hint hover long press popover label',
      },
      {
        label: 'Tabs',
        route: '/tabs',
        description:
          'Primary and secondary tab rows, fixed or scrollable, with a sliding indicator',
        add: 'tabs',
        docs: 'components/tabs',
        keywords: 'tab bar indicator scrollable fixed primary secondary',
      },
      {
        label: 'NavigationBar',
        route: '/navigation-bar',
        description:
          '80dp bottom destination bar with an animated indicator pill',
        add: 'navigation-bar',
        docs: 'components/navigation-bar',
        keywords: 'bottom navigation destinations bar pill indicator shell',
      },
    ],
  },
]

/** Every entry, flattened in section order — the order prev/next walks. */
export const catalogEntries: CatalogEntry[] = sections.flatMap(
  (section) => section.items,
)

/**
 * How many components the library ships — the number the home screen reports.
 *
 * Counts entries with an `add` name rather than every catalog entry. The
 * catalog also carries the RTL demo, which is a `@rootnative/utils` feature and
 * not an installable component, so `catalogEntries.length` claimed 29 for a
 * library of 28. An entry with no `add` is by definition not something
 * `rootnative add` can install.
 */
export const totalComponents = catalogEntries.filter(
  (entry) => entry.add,
).length

/** Look up the entry for an Expo Router pathname (e.g. `/button`). */
export function findEntry(route: string): CatalogEntry | undefined {
  return catalogEntries.find((entry) => entry.route === route)
}

/**
 * Neighbors of `route` in catalog order. Both are `undefined` for a route that
 * isn't in the catalog (the home screen), and the ends of the list don't wrap.
 */
export function findNeighbors(route: string): {
  previous?: CatalogEntry
  next?: CatalogEntry
} {
  const index = catalogEntries.findIndex((entry) => entry.route === route)

  if (index === -1) {
    return {}
  }

  return {
    previous: catalogEntries[index - 1],
    next: catalogEntries[index + 1],
  }
}

/**
 * Whether an entry matches a search query. Every whitespace-separated term has
 * to hit somewhere in the label, description, keywords, or section title, so
 * "outlined button" narrows rather than widens.
 */
export function matchesQuery(
  entry: CatalogEntry,
  sectionTitle: string,
  query: string,
): boolean {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)

  if (terms.length === 0) {
    return true
  }

  const haystack =
    `${entry.label} ${entry.description} ${entry.keywords ?? ''} ${sectionTitle}`.toLowerCase()

  return terms.every((term) => haystack.includes(term))
}
