/**
 * Common MaterialCommunityIcons names mapped to their closest Lucide
 * equivalents (kebab-case, matching Lucide's name slugs). Used as
 * compatibility shims when a project switches its `iconResolver` from
 * the default MCI to Lucide and still has string names like `magnify`
 * scattered through the codebase.
 *
 * This is intentionally a small, hand-curated list of the icons that
 * appear in real component usage and RootNative's own internal icons.
 * Extend it via the `aliases` option on `createLucideResolver`.
 */
export const mdiToLucideAliases: Readonly<Record<string, string>> = {
  // RootNative system icons
  check: 'check',
  close: 'x',

  // Common navigation
  'arrow-left': 'arrow-left',
  'arrow-right': 'arrow-right',
  'arrow-up': 'arrow-up',
  'arrow-down': 'arrow-down',
  'chevron-left': 'chevron-left',
  'chevron-right': 'chevron-right',
  'chevron-up': 'chevron-up',
  'chevron-down': 'chevron-down',
  menu: 'menu',
  'dots-vertical': 'more-vertical',
  'dots-horizontal': 'more-horizontal',

  // Common actions
  plus: 'plus',
  minus: 'minus',
  pencil: 'pencil',
  delete: 'trash-2',
  magnify: 'search',
  filter: 'filter',
  refresh: 'refresh-cw',
  download: 'download',
  upload: 'upload',
  share: 'share',
  content: 'copy',
  'content-copy': 'copy',
  'content-paste': 'clipboard',
  'content-cut': 'scissors',

  // Common UI affordances
  eye: 'eye',
  'eye-off': 'eye-off',
  heart: 'heart',
  'heart-outline': 'heart',
  star: 'star',
  'star-outline': 'star',
  bell: 'bell',
  'bell-outline': 'bell',
  bookmark: 'bookmark',
  'bookmark-outline': 'bookmark',
  home: 'home',
  account: 'user',
  'account-circle': 'circle-user',
  cog: 'settings',
  information: 'info',
  'alert-circle': 'alert-circle',
  alert: 'triangle-alert',
  help: 'circle-help',
  lock: 'lock',
  'lock-open': 'lock-open',
  calendar: 'calendar',
  clock: 'clock',
  email: 'mail',
  phone: 'phone',
  link: 'link',
  'open-in-new': 'external-link',
}

/**
 * MaterialCommunityIcons names mapped to their closest
 * [Phosphor](https://phosphoricons.com/) equivalents. Phosphor exports
 * each glyph in PascalCase (e.g. `MagnifyingGlass`); these aliases use
 * that PascalCase form so they can be looked up directly in a Phosphor
 * icon map.
 */
export const mdiToPhosphorAliases: Readonly<Record<string, string>> = {
  // RootNative system icons
  check: 'Check',
  close: 'X',

  // Navigation
  'arrow-left': 'ArrowLeft',
  'arrow-right': 'ArrowRight',
  'arrow-up': 'ArrowUp',
  'arrow-down': 'ArrowDown',
  'chevron-left': 'CaretLeft',
  'chevron-right': 'CaretRight',
  'chevron-up': 'CaretUp',
  'chevron-down': 'CaretDown',
  menu: 'List',
  'dots-vertical': 'DotsThreeVertical',
  'dots-horizontal': 'DotsThree',

  // Actions
  plus: 'Plus',
  minus: 'Minus',
  pencil: 'PencilSimple',
  delete: 'Trash',
  magnify: 'MagnifyingGlass',
  filter: 'Funnel',
  refresh: 'ArrowsClockwise',
  download: 'DownloadSimple',
  upload: 'UploadSimple',
  share: 'ShareNetwork',
  content: 'Copy',
  'content-copy': 'Copy',
  'content-paste': 'Clipboard',
  'content-cut': 'Scissors',

  // UI affordances
  eye: 'Eye',
  'eye-off': 'EyeSlash',
  heart: 'Heart',
  'heart-outline': 'Heart',
  star: 'Star',
  'star-outline': 'Star',
  bell: 'Bell',
  'bell-outline': 'Bell',
  bookmark: 'BookmarkSimple',
  'bookmark-outline': 'BookmarkSimple',
  home: 'House',
  account: 'User',
  'account-circle': 'UserCircle',
  cog: 'Gear',
  information: 'Info',
  'alert-circle': 'WarningCircle',
  alert: 'Warning',
  help: 'Question',
  lock: 'Lock',
  'lock-open': 'LockOpen',
  calendar: 'Calendar',
  clock: 'Clock',
  email: 'Envelope',
  phone: 'Phone',
  link: 'Link',
  'open-in-new': 'ArrowSquareOut',
}
