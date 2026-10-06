/**
 * LLM Documentation Build Script
 *
 * Auto-generates per-package llms.txt files for npm and a combined
 * docs/static/llms-full.txt for the documentation site.
 *
 * Component props are extracted from TypeScript source files.
 * Everything else (examples, API docs, CLI docs) uses static templates.
 *
 * Usage: npx tsx scripts/build-llms.ts
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// ============================================================
// Constants
// ============================================================

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const COMPONENTS_SRC = path.join(ROOT, 'packages/components/src')

const readPkg = (p: string) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf-8'))

const CORE_VERSION: string = readPkg('packages/core/package.json').version
const COMPONENTS_VERSION: string = readPkg(
  'packages/components/package.json',
).version
const CLI_VERSION: string = readPkg('packages/cli/package.json').version
const ICONS_VERSION: string = readPkg('packages/icons/package.json').version
const SEO_VERSION: string = readPkg('packages/seo/package.json').version
// Read the inertia peer range rather than hard-coding it. A literal here
// drifted two releases behind (it still said `>=0.0.4` at 0.0.6), because a
// version bump has no reason to bring anyone to this file.
//
// Read it *per package*, not once. The ranges are deliberately allowed to
// differ — `components` uses far more inertia API than `core`, so it carries
// the higher floor — and one shared constant quietly published `core`'s
// lower floor as the requirement for `components` too.
const inertiaPeerOf = (pkg: string): string =>
  readPkg(`packages/${pkg}/package.json`).peerDependencies[
    '@rootnative/inertia'
  ]

const CORE_INERTIA_PEER: string = inertiaPeerOf('core')
const COMPONENTS_INERTIA_PEER: string = inertiaPeerOf('components')

// Every other runtime requirement in the generated headers is read the same
// way, and for the same reason the inertia range already is. A literal here has
// no reason to bring anyone to this file when a version moves, and all of them
// had gone stale: the headers still advertised `react >=18`, `react-native
// >=0.72`, `react-native-reanimated >=4` and `react-native-worklets >=0.5` on a
// tree whose real floors are 19.2.3, 0.83.0, 4.5.0 and 0.10.0, and still named
// Expo SDK 54 three SDKs later. `llms.txt` is the file CLAUDE.md tells an agent
// to trust over the hosted docs, so an understated floor there is worse than no
// statement at all — it reads as permission to install a combination the
// package rejects.
const peerOf = (pkg: string, dep: string): string => {
  const range = readPkg(`packages/${pkg}/package.json`).peerDependencies?.[dep]

  if (!range) {
    throw new Error(
      `packages/${pkg}/package.json declares no ${dep} peer — the generated ` +
        'llms.txt must not state a requirement the package does not declare.',
    )
  }

  return range
}

const CORE_REACT: string = peerOf('core', 'react')
const CORE_RN: string = peerOf('core', 'react-native')

const COMPONENTS_REACT: string = peerOf('components', 'react')
const COMPONENTS_RN: string = peerOf('components', 'react-native')
const COMPONENTS_SAFE_AREA: string = peerOf(
  'components',
  'react-native-safe-area-context',
)
const COMPONENTS_REANIMATED: string = peerOf(
  'components',
  'react-native-reanimated',
)
const COMPONENTS_WORKLETS: string = peerOf(
  'components',
  'react-native-worklets',
)
const COMPONENTS_VECTOR_ICONS: string = peerOf(
  'components',
  '@react-native-vector-icons/material-design-icons',
)

const ICONS_REACT: string = peerOf('icons', 'react')
const ICONS_RN: string = peerOf('icons', 'react-native')

const SEO_REACT: string = peerOf('seo', 'react')
const SEO_RN: string = peerOf('seo', 'react-native')
const SEO_EXPO_ROUTER: string = peerOf('seo', 'expo-router')

const CLI_NODE: string = readPkg('packages/cli/package.json').engines.node

// The SDK band, read from the Expo the workspace installs — the same source of
// truth `check-template-pins.ts` uses. Nothing in a peer range names an SDK
// number, so this is the only place it can be derived from rather than typed.
const EXPO_SDK: string = (() => {
  const expoPkg = path.join(ROOT, 'node_modules/expo/package.json')

  if (!fs.existsSync(expoPkg)) {
    throw new Error(
      'node_modules/expo/package.json is missing — the generated llms.txt ' +
        'reads the SDK band from the installed Expo. Run `pnpm install` first.',
    )
  }

  return (
    JSON.parse(fs.readFileSync(expoPkg, 'utf-8')).version as string
  ).split('.')[0]
})()

// ============================================================
// Type Extraction — Interfaces & Type Aliases from TS source
// ============================================================

interface JsDoc {
  comment: string
  defaultValue?: string
}

interface MemberInfo {
  name: string
  type: string
  optional: boolean
  comment: string
  defaultValue?: string
}

interface InterfaceInfo {
  name: string
  comment: string
  extends: string[]
  members: MemberInfo[]
}

interface TypeAliasInfo {
  name: string
  comment: string
  type: string
}

interface ParseResult {
  interfaces: InterfaceInfo[]
  typeAliases: TypeAliasInfo[]
}

function parseJsDoc(raw: string): JsDoc {
  const inner = raw.replace(/^\s*\/\*\*\s*/, '').replace(/\s*\*\/\s*$/, '')
  const lines = inner.split('\n').map((l) => l.replace(/^\s*\*\s?/, '').trim())

  let comment = ''
  let defaultValue: string | undefined

  for (const line of lines) {
    if (line.startsWith('@default')) {
      defaultValue = line.replace(/^@default\s*/, '').trim()
    } else if (line.startsWith('@')) {
      // skip @example, @see, etc.
    } else if (line) {
      comment += (comment ? ' ' : '') + line
    }
  }

  return { comment, defaultValue }
}

function simplifyType(type: string): string {
  return type
    .replace(/ComponentProps<typeof MaterialDesignIcons>\['name'\]/g, 'string')
    .replace(/IconButtonProps\['icon'\]/g, 'string')
    .replace(
      /KeyboardAvoidingViewProps\['behavior'\]/g,
      "'padding' | 'height' | 'position'",
    )
    .replace(
      /keyof MaterialTheme\['spacing'\]/g,
      "'xs' | 'sm' | 'md' | 'lg' | 'xl'",
    )
}

function splitExtendsClause(text: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''

  for (const char of text) {
    if (char === '<' || char === '(') depth++
    if (char === '>' || char === ')') depth--
    if (char === ',' && depth === 0) {
      parts.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  if (current.trim()) parts.push(current.trim())
  return parts
}

/** Open minus closed angle brackets, with `=>` arrows left out of the count. */
function angleDepth(text: string): number {
  const bare = text.replace(/=>/g, '')
  return (bare.match(/</g)?.length ?? 0) - (bare.match(/>/g)?.length ?? 0)
}

function parseTypeSource(content: string): ParseResult {
  const result: ParseResult = { interfaces: [], typeAliases: [] }
  const lines = content.split('\n')
  let i = 0

  function collectJsDoc(): JsDoc {
    let j = i - 1
    while (j >= 0 && lines[j].trim() === '') j--
    if (j >= 0 && lines[j].trim().endsWith('*/')) {
      let start = j
      while (start > 0 && !lines[start].trim().startsWith('/**')) start--
      if (lines[start].trim().startsWith('/**')) {
        return parseJsDoc(lines.slice(start, j + 1).join('\n'))
      }
    }
    return { comment: '' }
  }

  while (i < lines.length) {
    const line = lines[i]

    // --- Type alias ---
    const typeMatch = line.match(/^export type (\w+)\s*=\s*(.*)/)
    if (typeMatch) {
      const jsDoc = collectJsDoc()
      const name = typeMatch[1]
      let typeValue = typeMatch[2].trim()

      if (!typeValue) {
        i++
        const typeLines: string[] = []
        while (i < lines.length && lines[i].match(/^\s+\|/)) {
          typeLines.push(lines[i].trim())
          i++
        }
        typeValue = typeLines.map((l) => l.replace(/^\|\s*/, '')).join(' | ')
      } else {
        // A generic that Prettier wrapped past 80 columns opens on this line
        // and closes on a later one. Follow it until the angle brackets
        // balance, or the alias renders as `Omit<` and nothing else.
        let depth = angleDepth(typeValue)
        i++
        while (depth > 0 && i < lines.length) {
          typeValue += ' ' + lines[i].trim()
          depth += angleDepth(lines[i])
          i++
        }
        typeValue = typeValue
          .replace(/<\s+/g, '<')
          .replace(/,\s+\|\s*/g, ', ')
          .replace(/\s+>/g, '>')
      }

      result.typeAliases.push({ name, comment: jsDoc.comment, type: typeValue })
      continue
    }

    // --- Interface ---
    // Local (non-exported) interfaces count only when the name ends in
    // `CommonProps`. A props type that makes two props mutually exclusive keeps
    // its shared props in a local `<Name>CommonProps` interface and exports a
    // type alias, so matching `export interface` alone dropped that whole props
    // block — silently, which is this parser's failure mode. Matching *every*
    // local interface is too broad: component files declare private prop bags
    // for internal sub-components (Tooltip, Slider, ButtonGroup), and those
    // shadow the real props type because they are declared earlier in the file.
    if (
      line.startsWith('export interface ') ||
      /^interface \w*CommonProps\b/.test(line)
    ) {
      const jsDoc = collectJsDoc()

      // Collect full declaration up to opening brace
      let declText = ''
      while (i < lines.length && !lines[i].includes('{')) {
        declText += lines[i] + ' '
        i++
      }
      declText += lines[i]

      const nameMatch = declText.match(/(?:export )?interface (\w+)/)
      const name = nameMatch![1]

      // Parse extends clause
      const extendsArr: string[] = []
      const extendsMatch = declText.match(/extends\s+([\s\S]+?)(?:\s*\{)/)
      if (extendsMatch) {
        const normalized = extendsMatch[1].replace(/\s+/g, ' ').trim()
        extendsArr.push(...splitExtendsClause(normalized))
      }

      // Skip past opening brace
      i++

      // Parse members
      const members: MemberInfo[] = []
      let braceDepth = 1
      let pendingJsDoc: JsDoc = { comment: '' }

      while (i < lines.length && braceDepth > 0) {
        const memberLine = lines[i].trim()

        for (const ch of memberLine) {
          if (ch === '{') braceDepth++
          if (ch === '}') braceDepth--
        }
        if (braceDepth <= 0) break

        if (
          !memberLine ||
          memberLine.startsWith('[') ||
          memberLine.startsWith('//')
        ) {
          i++
          continue
        }

        // JSDoc block
        if (memberLine.startsWith('/**')) {
          const jsDocLines = [lines[i]]
          if (!memberLine.endsWith('*/')) {
            while (
              i + 1 < lines.length &&
              !lines[i + 1].trim().endsWith('*/')
            ) {
              i++
              jsDocLines.push(lines[i])
            }
            i++
            jsDocLines.push(lines[i])
          }
          pendingJsDoc = parseJsDoc(jsDocLines.join('\n'))
          i++
          continue
        }

        // Property signature. The type may continue on following lines — a
        // union Prettier wrapped past 80 columns puts nothing after the colon,
        // and each arm arrives as its own `| 'x'` line. Requiring the type on
        // the same line silently dropped such props: `Box.justify` was fully
        // implemented and typed, yet absent from every generated `llms.txt`,
        // so anyone reading the docs concluded the prop did not exist.
        const propMatch = memberLine.match(/^(\w+)(\?)?:\s*(.*)$/)
        if (propMatch) {
          let type = propMatch[3].trim()

          // Continuation lines are the wrapped union arms. Stop at the next
          // member, JSDoc, or the interface's closing brace.
          if (!type || type.endsWith('|')) {
            const parts = type ? [type.replace(/\|$/, '').trim()] : []
            while (i + 1 < lines.length) {
              const next = lines[i + 1].trim()
              if (!next.startsWith('|')) break
              parts.push(next.replace(/^\|\s*/, ''))
              i++
            }
            type = parts.filter(Boolean).join(' | ')
          }

          members.push({
            name: propMatch[1],
            optional: !!propMatch[2],
            type: simplifyType(type),
            comment: pendingJsDoc.comment,
            defaultValue: pendingJsDoc.defaultValue,
          })
          pendingJsDoc = { comment: '' }
        }

        i++
      }

      result.interfaces.push({
        name,
        comment: jsDoc.comment,
        extends: extendsArr,
        members,
      })
      i++
      continue
    }

    i++
  }

  return result
}

function parseComponentDir(dirName: string): ParseResult {
  const dir = path.join(COMPONENTS_SRC, dirName)
  const files = fs
    .readdirSync(dir)
    .filter(
      (f) =>
        (f.endsWith('.ts') || f.endsWith('.tsx')) &&
        !f.includes('.test.') &&
        f !== 'styles.ts',
    )

  const allInterfaces: InterfaceInfo[] = []
  const allTypeAliases: TypeAliasInfo[] = []

  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8')
    const { interfaces, typeAliases } = parseTypeSource(content)
    allInterfaces.push(...interfaces)
    allTypeAliases.push(...typeAliases)
  }

  return { interfaces: allInterfaces, typeAliases: allTypeAliases }
}

// ============================================================
// Formatting Helpers
// ============================================================

// `keyof <CoreType>` expanded to its literal members. A prop whose type is
// derived from a core type (TypographyVariant is `keyof Typography`) would
// otherwise reach consumers as the bare alias text, which tells an agent
// reading node_modules nothing about the accepted values. Keys are read from
// core's declaration, so this cannot drift from the theme.
function coreTypeKeys(typeName: string): string[] | null {
  const source = fs.readFileSync(
    path.join(ROOT, 'packages/core/src/theme/types.ts'),
    'utf-8',
  )
  const decl = source.match(
    new RegExp(`export type ${typeName} = \\{([\\s\\S]*?)\\n\\}`),
  )
  if (!decl) return null
  const keys = [...decl[1].matchAll(/^\s{2}(\w+)[?]?:/gm)].map((m) => m[1])
  return keys.length > 0 ? keys : null
}

function resolveTypeAlias(type: string, aliases: TypeAliasInfo[]): string {
  const alias = aliases.find((a) => a.name === type)
  const resolved = alias ? alias.type : type

  const keyofMatch = resolved.match(/^keyof (\w+)$/)
  if (keyofMatch) {
    const keys = coreTypeKeys(keyofMatch[1])
    if (keys) return keys.map((k) => `'${k}'`).join(' | ')
  }

  return resolved
}

function formatInheritsNote(ext: string): string | null {
  if (ext.startsWith('Omit<')) {
    const match = ext.match(/Omit<(\w+), (.+)>/)
    if (match) {
      const base = match[1]
      const omitted = match[2]
        .split('|')
        .map((s) => s.trim().replace(/['"]/g, ''))
        .join('`, `')
      return `- Inherits \`${base}\` (except \`${omitted}\`)`
    }
  }
  if (
    ext === 'ViewProps' ||
    ext === 'PropsWithChildren' ||
    ext.startsWith('Omit<TextProps') ||
    ext.startsWith('Omit<ViewProps')
  ) {
    return `- Inherits \`${ext}\``
  }
  return null
}

function formatPropsSection(
  iface: InterfaceInfo,
  aliases: TypeAliasInfo[],
): string {
  let output = 'Props:\n'

  for (const member of iface.members) {
    const resolved = simplifyType(resolveTypeAlias(member.type, aliases))
    const opt = member.optional ? '?' : ''
    let line = `- \`${member.name}${opt}: ${resolved}\``

    if (member.defaultValue && member.comment) {
      line += ` — Default: \`${member.defaultValue}\`. ${member.comment}`
    } else if (member.defaultValue) {
      line += ` — Default: \`${member.defaultValue}\``
    } else if (member.comment) {
      line += ` — ${member.comment}`
    }

    output += line + '\n'
  }

  for (const ext of iface.extends) {
    const note = formatInheritsNote(ext)
    if (note) output += note + '\n'
  }

  return output
}

function formatSubInterface(
  iface: InterfaceInfo,
  aliases: TypeAliasInfo[],
  heading: string,
  description?: string,
): string {
  let output = heading + '\n'
  if (description) output += '\n' + description + '\n'
  output += '\n' + formatPropsSection(iface, aliases)
  return output
}

// ============================================================
// Component Metadata
// ============================================================

const COMPONENT_ORDER = [
  'typography',
  'button',
  'button-group',
  'icon-button',
  'icon',
  'fab',
  'appbar',
  'card',
  'chip',
  'checkbox',
  'radio',
  'switch',
  'text-field',
  'search-bar',
  'search-view',
  'layout',
  'divider',
  'list',
  'keyboard-avoiding-wrapper',
  'portal',
  'dialog',
  'bottom-sheet',
  'snackbar',
  'menu',
  'tooltip',
  'tabs',
  'navigation-bar',
  'navigation-rail',
  'navigation-drawer',
  'avatar',
  'badge',
  'slider',
  'progress',
  'loading-indicator',
  'skeleton',
]

const COMPONENT_NAMES: Record<string, string> = {
  typography: 'Typography',
  button: 'Button',
  'button-group': 'ButtonGroup',
  'icon-button': 'IconButton',
  icon: 'Icon',
  fab: 'FAB',
  appbar: 'AppBar',
  card: 'Card',
  chip: 'Chip',
  checkbox: 'Checkbox',
  radio: 'Radio',
  switch: 'Switch',
  'text-field': 'TextField',
  'search-bar': 'SearchBar',
  'search-view': 'SearchView',
  layout: 'Layout Components',
  divider: 'Divider',
  list: 'List',
  'keyboard-avoiding-wrapper': 'KeyboardAvoidingWrapper',
  portal: 'Portal',
  dialog: 'Dialog',
  'bottom-sheet': 'BottomSheet',
  snackbar: 'Snackbar',
  menu: 'Menu',
  tooltip: 'Tooltip',
  tabs: 'Tabs',
  'navigation-bar': 'NavigationBar',
  'navigation-rail': 'NavigationRail',
  'navigation-drawer': 'NavigationDrawer',
  avatar: 'Avatar',
  badge: 'Badge',
  slider: 'Slider',
  progress: 'Progress',
  'loading-indicator': 'LoadingIndicator',
  skeleton: 'Skeleton',
}

const COMPONENT_EXAMPLES: Record<string, string> = {
  typography: `\`\`\`tsx
import { Typography } from '@rootnative/components/typography'

<Typography variant="headlineMedium" color="#333">Hello</Typography>
\`\`\``,

  button: `\`\`\`tsx
import { Button } from '@rootnative/components/button'
import { Link } from 'expo-router'

<Button variant="filled" leadingIcon="plus" onPress={handlePress}>Create</Button>
<Button variant="outlined">Cancel</Button>
<Button variant="tonal" containerColor="#E8DEF8" contentColor="#1D192B">Custom</Button>

// A link: Link from expo-router gives the button role="link" and href, so the
// web renders <a href>, which a crawler follows. hrefAttrs opens a new tab.
<Link href="https://github.com/rootnative" asChild>
  <Button variant="text" hrefAttrs={{ target: '_blank', rel: 'noopener' }}>GitHub</Button>
</Link>
\`\`\``,

  'button-group': `\`\`\`tsx
import { ButtonGroup } from '@rootnative/components/button-group'

// Single-select connected group (replaces deprecated MD3 segmented button).
<ButtonGroup
  variant="connected"
  selectionMode="single"
  value={alignment}
  onValueChange={setAlignment}
  items={[
    { value: 'left', label: 'Left', leadingIcon: 'format-align-left' },
    { value: 'center', label: 'Center', leadingIcon: 'format-align-center' },
    { value: 'right', label: 'Right', leadingIcon: 'format-align-right' },
  ]}
/>

// Multi-select standard group.
<ButtonGroup
  variant="standard"
  selectionMode="multiple"
  value={formatting}
  onValueChange={setFormatting}
  items={[
    { value: 'bold', label: 'Bold', leadingIcon: 'format-bold' },
    { value: 'italic', label: 'Italic', leadingIcon: 'format-italic' },
  ]}
/>

// Action-only group — no selection state.
<ButtonGroup
  selectionMode="none"
  onItemPress={handleAction}
  items={[
    { value: 'reply', label: 'Reply', leadingIcon: 'reply' },
    { value: 'forward', label: 'Forward', leadingIcon: 'share' },
  ]}
/>
\`\`\``,

  'icon-button': `\`\`\`tsx
import { IconButton } from '@rootnative/components/icon-button'

<IconButton icon="heart" variant="filled" accessibilityLabel="Like" onPress={handleLike} />
<IconButton icon="heart-outline" selectedIcon="heart" selected={liked} variant="tonal" accessibilityLabel="Like" onPress={toggle} />
\`\`\``,

  icon: `\`\`\`tsx
import { Icon } from '@rootnative/components/icon'

// Renders an IconSource through the theme's iconResolver: 24dp, onSurface by default.
<Icon source="star" />
<Icon source="heart" size={32} color={theme.colors.primary} />

// Decorative by default (hidden from assistive technology). A label exposes it as an image.
<Icon source="wifi-strength-4" accessibilityLabel="Wi-Fi connected" />

// An element renders as is; a render function receives { size, color }.
<Icon source={<MySvg width={24} height={24} />} />
<Icon size={32} source={({ size, color }) => <MySvg width={size} height={size} fill={color} />} />
\`\`\``,

  fab: `\`\`\`tsx
import { FAB } from '@rootnative/components/fab'

// Icon-only — accessibilityLabel required
<FAB icon="plus" accessibilityLabel="Add" onPress={handleAdd} />
<FAB icon="plus" size="large" variant="tertiary" accessibilityLabel="Add" onPress={handleAdd} />

// Extended — label doubles as the accessible name
<FAB icon="pencil-outline" label="Edit" variant="surface" onPress={handleEdit} />
\`\`\``,

  appbar: `\`\`\`tsx
import { AppBar } from '@rootnative/components/appbar'

<AppBar title="Home" variant="small" />
<AppBar title="Details" canGoBack onBackPress={router.back} insetTop />
<AppBar title="About" canGoBack navigationIcon="close" onBackPress={router.back} />
<AppBar title="Settings" variant="center-aligned" actions={[
  { icon: 'magnify', accessibilityLabel: 'Search', onPress: onSearch },
  { icon: 'dots-vertical', accessibilityLabel: 'More', onPress: onMore },
]} />
\`\`\``,

  card: `\`\`\`tsx
import { Card } from '@rootnative/components/card'

// Region slots carry the MD3 spacing. Card itself applies no padding.
<Card variant="elevated">
  <Card.Media height={160}>
    <Image source={{ uri }} resizeMode="cover" />
  </Card.Media>
  <Card.Content>
    <Typography variant="titleMedium">Title</Typography>
    <Typography variant="bodyMedium">Supporting text.</Typography>
  </Card.Content>
  <Card.Actions>
    <Button variant="text" onPress={handleShare}>Share</Button>
  </Card.Actions>
</Card>

// Raw children still work and stay unpadded — you own the spacing.
<Card variant="outlined" onPress={handlePress}>{children}</Card>
\`\`\``,

  chip: `\`\`\`tsx
import { Chip } from '@rootnative/components/chip'

<Chip variant="assist" leadingIcon="calendar">Today</Chip>
<Chip variant="filter" selected={isSelected} onPress={toggle}>Active</Chip>
<Chip variant="input" avatar={<Avatar />} onClose={handleRemove}>John</Chip>
<Chip variant="suggestion" onPress={handleSuggest}>Try this</Chip>
\`\`\``,

  checkbox: `\`\`\`tsx
import { Checkbox } from '@rootnative/components/checkbox'

<Checkbox value={checked} onValueChange={setChecked} />
\`\`\``,

  radio: `\`\`\`tsx
import { Radio } from '@rootnative/components/radio'

<Radio value={selected} onValueChange={setSelected} />
\`\`\``,

  switch: `\`\`\`tsx
import { Switch } from '@rootnative/components/switch'

<Switch value={on} onValueChange={setOn} />
<Switch value={on} onValueChange={setOn} selectedIcon="check" unselectedIcon="close" />
\`\`\``,

  'text-field': `\`\`\`tsx
import { TextField } from '@rootnative/components/text-field'

<TextField label="Email" variant="outlined" value={email} onChangeText={setEmail} />
<TextField label="Password" variant="filled" error errorText="Required" />
<TextField label="Search" leadingIcon="magnify" trailingIcon="close" onTrailingIconPress={clear} />
\`\`\``,

  'search-bar': `\`\`\`tsx
import { SearchBar } from '@rootnative/components/search-bar'

// MD3 search bar: 56dp pill, leading search icon, clear button while it holds text.
<SearchBar placeholder="Search mail" value={query} onChangeText={setQuery} onSearch={runSearch} />

// Navigation icon as the leading button, plus trailing icon actions.
<SearchBar
  placeholder="Search"
  leadingIcon="menu"
  onLeadingIconPress={openDrawer}
  leadingIconAccessibilityLabel="Open menu"
  actions={[{ icon: 'microphone', accessibilityLabel: 'Voice search', onPress: listen }]}
/>

// Custom trailing content, such as an avatar.
<SearchBar placeholder="Search" trailing={<Avatar size="extraSmall" label="JD" />} />

// A bar that opens a SearchView: one button, read-only input.
<SearchBar placeholder="Search" value={query} onPress={() => setOpen(true)} />
\`\`\``,

  'search-view': `\`\`\`tsx
import { SearchView } from '@rootnative/components/search-view'

// MD3 search view: the panel that opens from a SearchBar. Full screen on a
// compact window, docked on a wider one. Renders through Portal.
const anchorRef = useRef<View>(null)

<View ref={anchorRef}>
  <SearchBar placeholder="Search mail" value={query} onPress={() => setOpen(true)} />
</View>
<SearchView
  visible={open}
  onDismiss={() => setOpen(false)}
  anchor={anchorRef}
  placeholder="Search mail"
  value={query}
  onChangeText={setQuery}
  onSearch={(text) => { runSearch(text); setOpen(false) }}
>
  <List>{suggestions.map((s) => <ListItem key={s} headlineText={s} onPress={() => pick(s)} />)}</List>
</SearchView>
\`\`\``,

  divider: `\`\`\`tsx
import { Divider } from '@rootnative/components/divider'

// Full-bleed 1dp rule
<Divider />

// Leading inset — \`true\` is the MD3 list inset (56dp), or pass dp
<Divider insetStart />
<Divider insetStart={16} insetEnd={16} />

// Vertical — stretches to the height of its row
<Row>
  <Text>Left</Text>
  <Divider orientation="vertical" />
  <Text>Right</Text>
</Row>

// Thickness / color overrides
<Divider thickness={2} containerColor="#B00020" />
\`\`\``,

  list: `\`\`\`tsx
import { List, ListItem, ListDivider } from '@rootnative/components/list'

<List>
  <ListItem headlineText="Title" supportingText="Subtitle" onPress={handlePress} />
  <ListDivider />
  <ListItem
    headlineText="With Icon"
    leadingContent={<Icon name="star" />}
    trailingContent={<Switch value={on} onValueChange={setOn} />}
  />
</List>
\`\`\``,

  'keyboard-avoiding-wrapper': `\`\`\`tsx
import { KeyboardAvoidingWrapper } from '@rootnative/components/keyboard-avoiding-wrapper'

<KeyboardAvoidingWrapper>
  <TextField label="Name" />
  <TextField label="Email" />
</KeyboardAvoidingWrapper>
\`\`\``,

  portal: `\`\`\`tsx
import { Portal, PortalHost, PORTAL_LAYERS } from '@rootnative/components/portal'

// Mount once at the app root, inside ThemeProvider
<PortalHost>
  <App />
</PortalHost>

// Anywhere below it — renders into the host's overlay layer
{open ? (
  <Portal priority={PORTAL_LAYERS.dialog}>
    <MyDialog onDismiss={close} />
  </Portal>
) : null}

// Scope overlays to part of the tree with a named host
<PortalHost name="sheet-area" />
<Portal hostName="sheet-area">
  <MySheet />
</Portal>
\`\`\``,

  dialog: `\`\`\`tsx
import { Dialog } from '@rootnative/components/dialog'
import { Button } from '@rootnative/components/button'

// Requires a <PortalHost> at the app root. Slots may be written in any order —
// Dialog places them in MD3 order itself.
<Dialog visible={open} onDismiss={close}>
  <Dialog.Icon icon="alert-circle-outline" />
  <Dialog.Title>Delete file?</Dialog.Title>
  <Dialog.Content>This cannot be undone.</Dialog.Content>
  <Dialog.Actions>
    <Button variant="text" onPress={close}>Cancel</Button>
    <Button variant="text" onPress={confirm}>Delete</Button>
  </Dialog.Actions>
</Dialog>

// Must be resolved by an action — scrim + Android back stop dismissing
<Dialog visible={open} onDismiss={close} dismissable={false}>…</Dialog>

// Full-screen: Dialog builds the header (close button + title + actions)
<Dialog visible={open} variant="fullscreen" onDismiss={close}>
  <Dialog.Title>Edit profile</Dialog.Title>
  <Dialog.Actions><Button variant="text" onPress={save}>Save</Button></Dialog.Actions>
  <Dialog.Content><ProfileForm /></Dialog.Content>
</Dialog>
\`\`\``,

  'bottom-sheet': `\`\`\`tsx
import { BottomSheet } from '@rootnative/components/bottom-sheet'

// Requires a <PortalHost> at the app root. Content-sized, drag the handle
// down (or tap the scrim / Android back) to dismiss.
<BottomSheet visible={open} onDismiss={close}>
  <ShareActions />
</BottomSheet>

// Snap points: dp numbers or percentages of the portal host's height.
// Indices are ascending by resolved height; below the lowest one, a
// release dismisses. Scrollable content brings its own ScrollView — the
// drag gesture lives on the handle, so the two never fight.
<BottomSheet
  visible={open}
  onDismiss={close}
  snapPoints={['50%', '90%']}
  onSnapIndexChange={setIndex}
>
  <ScrollView><Places /></ScrollView>
</BottomSheet>

// Standard sheet: no scrim, screen behind stays interactive
<BottomSheet visible={open} onDismiss={close} variant="standard">…</BottomSheet>

// Must be resolved by an action — drags rubber-band back, scrim inert
<BottomSheet visible={open} onDismiss={close} dismissable={false}>…</BottomSheet>
\`\`\``,

  snackbar: `\`\`\`tsx
import {
  SnackbarProvider,
  snackbarOffsetFor,
  useSnackbar,
  useSnackbarOffset,
} from '@rootnative/components/snackbar'
import { FAB_SIZES } from '@rootnative/components/fab'

// Mount once, inside <ThemeProvider> and inside <PortalHost>.
// \`bottomOffset\` is the app-wide default — use it when every screen has the
// same bottom furniture. The layer already adds its own 16dp margin and the
// safe-area inset, so do not include either in the number.
<PortalHost>
  <SnackbarProvider bottomOffset={0}>
    <App />
  </SnackbarProvider>
</PortalHost>

// When only SOME screens carry a FAB, raise the offset from the screen that
// owns it instead. It applies while that screen is mounted and reverts on
// unmount, so the constant lives next to the component that determines it.
function ComposeScreen() {
  useSnackbarOffset(snackbarOffsetFor(FAB_SIZES.medium))   // 56 + 16 = 72
  return <FAB icon="plus" accessibilityLabel="Compose" onPress={compose} />
}

// Imperative only — there is no <Snackbar visible> component.
const snackbar = useSnackbar()

snackbar.show({ message: 'Photo saved' })                      // 4s
snackbar.show({ message: 'Saved', duration: 'long' })          // 10s

// An action makes it indefinite by default
snackbar.show({ message: 'Message deleted', actionLabel: 'Undo', onAction: undo })

// Indefinite with no action needs a way out
snackbar.show({ message: 'Offline', duration: 'indefinite', showCloseIcon: true })

// One at a time, FIFO. \`replace\` jumps the visible one.
const id = snackbar.show({ message: 'First' })
snackbar.show({ message: 'Urgent', replace: true })
snackbar.hide(id)   // specific, visible or queued
snackbar.hide()     // whatever is visible
snackbar.clear()    // visible + queue
\`\`\``,

  menu: `\`\`\`tsx
import { Menu } from '@rootnative/components/menu'
import { Divider } from '@rootnative/components/divider'

// Self-managing: no \`visible\` prop. Menu hooks the anchor's press to open and
// closes on an outside press, an item press, or Android back. The anchor must
// be a single element that accepts \`onPress\`; its own onPress still fires.
<Menu align="end" anchor={<IconButton icon="dots-vertical" accessibilityLabel="More" />}>
  <Menu.Item label="Edit" leadingIcon="pencil-outline" onPress={edit} />
  <Menu.Item label="Duplicate" leadingIcon="content-copy" onPress={duplicate} />
  <Divider />
  <Menu.Item label="Delete" leadingIcon="trash-can-outline" contentColor={theme.colors.error} onPress={del} />
</Menu>

// Controlled: you own visibility, and Menu never toggles itself.
<Menu
  visible={open}
  onDismiss={() => setOpen(false)}
  anchor={<Button onPress={() => setOpen(true)}>Sort</Button>}
>
  {/* closeOnPress={false} keeps the menu open for a toggle-style item */}
  <Menu.Item label="Name" leadingIcon={sort === 'name' ? 'check' : undefined} closeOnPress={false} onPress={() => setSort('name')} />
  <Menu.Item label="Size" leadingIcon={sort === 'size' ? 'check' : undefined} closeOnPress={false} onPress={() => setSort('size')} />
</Menu>

// Placement is a preference: a menu that doesn't fit flips to the roomier side,
// shifts back inside the screen margin horizontally, and scrolls when capped.
// \`align\` is logical — 'start' is the left edge in LTR, the right edge in RTL.
<Menu side="top" align="center" offset={8} anchor={anchor}>…</Menu>

// Item anatomy
<Menu.Item label="New window" leadingIcon="window-maximize" trailingText="⌘N" />
<Menu.Item label="Open recent" leadingIcon="history" trailingIcon="chevron-right" />
<Menu.Item label="Paste" disabled />
\`\`\``,

  tooltip: `\`\`\`tsx
import { Tooltip } from '@rootnative/components/tooltip'

// Plain: hover on web, long press on touch, down again after 1.5s. The anchor
// must accept \`onLongPress\` (every RootNative pressable does); its own
// onLongPress still fires. A press on the anchor hides the tooltip.
<Tooltip anchor={<IconButton icon="heart-outline" accessibilityLabel="Favourite" />}>
  Add to favourites
</Tooltip>

// Placement is a preference: a tooltip that doesn't fit flips to the roomier
// side and shifts back inside the screen margin. \`align\` is logical —
// 'start' is the left edge in LTR, the right edge in RTL.
<Tooltip side="bottom" align="start" offset={8} anchor={anchor}>Move to archive</Tooltip>

// duration={0} keeps a plain tooltip up until a hover out or a press.
<Tooltip duration={0} anchor={anchor}>Stays up</Tooltip>

// Rich: subhead + actions, persistent until an outside press, an action, or
// Android back. \`subhead\`/\`actions\` are ignored by the plain variant.
<Tooltip
  variant="rich"
  subhead="Rich tooltip"
  actions={<Button variant="text" onPress={learnMore}>Learn more</Button>}
  anchor={<IconButton icon="information-outline" accessibilityLabel="About sync" />}
>
  Rich tooltips bring attention to a feature that warrants a sentence.
</Tooltip>

// Controlled: the anchor stops opening it, but the timeout, an outside press,
// and Android back still report through onDismiss.
<Tooltip visible={open} onDismiss={() => setOpen(false)} anchor={anchor}>Saved</Tooltip>
\`\`\``,

  tabs: `\`\`\`tsx
import { Tabs } from '@rootnative/components/tabs'

// A bar, not a navigator: Tabs reports the press, you own the panels/routes.
// Controlled…
<Tabs
  items={[
    { value: 'flights', label: 'Flights' },
    { value: 'trips', label: 'Trips' },
    { value: 'explore', label: 'Explore' },
  ]}
  value={section}
  onValueChange={setSection}
/>

// …or uncontrolled, starting on \`defaultValue\` (falls back to the first item).
<Tabs items={items} defaultValue="trips" onValueChange={load} />

// Primary stacks an icon above the label (64dp) and matches the indicator to
// the label; secondary keeps the icon inline (48dp) with a full-width 2dp one.
<Tabs variant="secondary" items={[{ value: 'a', label: 'Albums', icon: 'album' }]} />

// Scrollable: natural tab widths (min 90dp) instead of an equal split, with the
// active tab scrolled into view. \`edgePadding\` pads before/after the row.
<Tabs scrollable items={manyItems} edgePadding={16} />

// Overrides: containerColor (row), contentColor (inactive), selectedContentColor
// (active), indicatorColor, labelStyle. Disabled items stay at the MD3 38%.
<Tabs items={[{ value: 'x', label: 'Deleted', disabled: true }]} showDivider={false} />
\`\`\``,

  'navigation-bar': `\`\`\`tsx
import { NavigationBar } from '@rootnative/components/navigation-bar'

// A bar, not a navigator: it reports the press, you own the screens/routes.
// MD3 recommends 3–5 destinations. \`selectedIcon\` swaps in while active.
<NavigationBar
  items={[
    { value: 'home', label: 'Home', icon: 'home-outline', selectedIcon: 'home' },
    { value: 'search', label: 'Search', icon: 'magnify' },
    { value: 'library', label: 'Library', icon: 'bookshelf' },
  ]}
  value={destination}
  onValueChange={setDestination}
  insetBottom // adds the safe-area bottom inset below the 80dp bar
/>

// Uncontrolled, starting on \`defaultValue\` (falls back to the first item).
<NavigationBar items={items} defaultValue="search" onValueChange={go} />

// Label modes: 'always' (default), 'selected' (only the active label, faded
// in), 'never' (icons only). The label still names the item for screen readers.
<NavigationBar labelVisibility="selected" items={items} />

// Overrides: containerColor (bar), contentColor (inactive), selectedContentColor
// (active icon+label), indicatorColor (pill), labelStyle. Disabled items stay
// at the MD3 38%.
<NavigationBar indicatorColor="#FFD8E4" items={items} />
\`\`\``,

  'navigation-rail': `\`\`\`tsx
import { NavigationRail } from '@rootnative/components/navigation-rail'

// A rail, not a navigator: it reports the press, you own the screens/routes.
// Same item shape as NavigationBar, so one array serves both widths.
// MD3 recommends 3–7 destinations. Place it at the start of a full-height row.
<NavigationRail
  items={[
    { value: 'home', label: 'Home', icon: 'home-outline', selectedIcon: 'home' },
    { value: 'search', label: 'Search', icon: 'magnify' },
    { value: 'library', label: 'Library', icon: 'bookshelf', badge: 3 },
  ]}
  value={destination}
  onValueChange={setDestination}
  header={<FAB icon="pencil-outline" accessibilityLabel="Compose" />} // menu button and/or FAB
/>

// Uncontrolled, starting on \`defaultValue\` (falls back to the first item).
<NavigationRail items={items} defaultValue="search" onValueChange={go} />

// \`align\`: 'top' (default) | 'center' | 'bottom'. The header stays at the top.
// \`labelVisibility\`: 'always' | 'selected' | 'never' (indicator grows to a 56dp circle).
<NavigationRail items={items} align="center" labelVisibility="never" />

// Overrides: containerColor (rail), contentColor (inactive), selectedContentColor
// (active icon+label), indicatorColor (pill), labelStyle.
<NavigationRail indicatorColor="#FFD8E4" items={items} />
\`\`\``,

  'navigation-drawer': `\`\`\`tsx
import { NavigationDrawer } from '@rootnative/components/navigation-drawer'

// Modal (default): renders through Portal behind a 32% scrim, slides in from the
// start edge, closes on scrim press / Android back / Escape, and after a
// destination press (dismissOnSelect). Needs a root PortalHost.
<NavigationDrawer
  visible={open}
  onDismiss={() => setOpen(false)}
  value={route}
  onValueChange={go}
  accessibilityLabel="Main navigation"
>
  <Typography variant="titleLarge" style={{ padding: 16 }}>Mail</Typography>
  <NavigationDrawer.Section headline="Mail">
    <NavigationDrawer.Item value="inbox" label="Inbox" icon="inbox-outline" selectedIcon="inbox" badge={24} />
    <NavigationDrawer.Item value="outbox" label="Outbox" icon="send-outline" />
  </NavigationDrawer.Section>
  <NavigationDrawer.Divider />
  <NavigationDrawer.Section headline="Labels">
    <NavigationDrawer.Item value="family" label="Family" />  {/* icon is optional */}
    <NavigationDrawer.Item value="work" label="Work" disabled />
  </NavigationDrawer.Section>
</NavigationDrawer>

// Standard: renders in place as a permanent 360dp panel. No visible/onDismiss —
// the type rejects every modal prop on it.
<NavigationDrawer variant="standard" value={route} onValueChange={go}>
  <NavigationDrawer.Item value="inbox" label="Inbox" icon="inbox" />
</NavigationDrawer>

// Uncontrolled: \`defaultValue\`, or omit it for no active destination.
<NavigationDrawer visible={open} onDismiss={close} defaultValue="inbox">{items}</NavigationDrawer>
\`\`\``,

  avatar: `\`\`\`tsx
import { Avatar } from '@rootnative/components/avatar'

<Avatar imageUri="https://example.com/photo.jpg" size="large" />
<Avatar icon="account" size="medium" containerColor="#E8DEF8" />
<Avatar label="JD" size="small" />
<Avatar icon="plus" onPress={handleAdd} accessibilityLabel="Add user" />
\`\`\``,

  badge: `\`\`\`tsx
import { Badge } from '@rootnative/components/badge'

// No label: a 6dp dot. Give it a label for screen readers.
<Badge accessibilityLabel="New activity">
  <MaterialDesignIcons name="bell-outline" size={24} />
</Badge>

// Label: a 16dp pill. Numbers above max (default 999) render as "999+".
<Badge label={3}>
  <MaterialDesignIcons name="email-outline" size={24} />
</Badge>
<Badge label={1200} max={99}>
  <MaterialDesignIcons name="message-outline" size={24} />
</Badge>

// Hidden badge keeps the anchor layout. No children renders inline.
<Badge label={count} visible={count > 0}>{icon}</Badge>
<Badge label={12} />

// NavigationBar items take \`badge\`: true for a dot, a number or string for a count.
<NavigationBar items={[{ value: 'inbox', label: 'Inbox', icon: 'email-outline', badge: 7 }]} />
\`\`\``,

  slider: `\`\`\`tsx
import { Slider } from '@rootnative/components/slider'

// Continuous (single thumb)
<Slider value={value} onValueChange={setValue} />

// Discrete (snaps to step, tick marks shown automatically)
<Slider
  value={volume}
  onValueChange={setVolume}
  minimumValue={0}
  maximumValue={100}
  step={10}
/>

// Range (pass a tuple for two thumbs)
<Slider
  value={range}
  onValueChange={setRange}
  minimumValue={0}
  maximumValue={100}
/>

// Centered — active track fills from midpoint to thumb
<Slider value={balance} onValueChange={setBalance} minimumValue={-50} maximumValue={50} centered />

// With start/end icon decorations
<Slider value={vol} onValueChange={setVol} startIcon="volume-low" endIcon="volume-high" />
\`\`\``,

  progress: `\`\`\`tsx
import { LinearProgress, CircularProgress } from '@rootnative/components/progress'

// Determinate (progress 0..1)
<LinearProgress progress={0.4} />
<CircularProgress progress={0.4} />

// Indeterminate (omit progress)
<LinearProgress />
<CircularProgress />

// Custom sizing / colors
<LinearProgress progress={value} thickness={8} containerColor="#C8E6C9" contentColor="#2E7D32" />
<CircularProgress progress={value} size={56} thickness={5} />
\`\`\``,

  'loading-indicator': `\`\`\`tsx
import { LoadingIndicator } from '@rootnative/components/loading-indicator'

// Indeterminate shape-morph spinner (default)
<LoadingIndicator accessibilityLabel="Loading" />

// Contained (filled circular background)
<LoadingIndicator contained accessibilityLabel="Loading" />

// Determinate (circle -> soft-burst morph as progress advances)
<LoadingIndicator progress={0.6} accessibilityLabel="Loading" />

// Custom size / colors
<LoadingIndicator size={72} contentColor="#00796B" accessibilityLabel="Loading" />
\`\`\``,

  skeleton: `\`\`\`tsx
import { Skeleton } from '@rootnative/components/skeleton'

// One line of text (100% wide, 16dp tall, pulsing)
<Skeleton />
<Skeleton width="70%" />

// Match the content it stands in for
<Skeleton shape="circle" width={40} height={40} />  // avatar
<Skeleton height={160} />                           // image
<Skeleton shape="rectangle" width={96} height={48} />

// Static block / custom color
<Skeleton animated={false} />
<Skeleton containerColor="#E8DEF8" />
\`\`\`

The block reads \`surfaceContainerHighest\` and pulses with a repeating timing
loop from \`theme.motion.durationExtraLong4\` + \`theme.motion.easingStandard\`.
It is hidden from the accessibility tree — announce loading on the container.
Under reduced motion the pulse collapses to a static block.`,
}

// ============================================================
// Component Section Generator
// ============================================================

function generateComponentSection(dirName: string): string {
  const { interfaces, typeAliases } = parseComponentDir(dirName)
  const displayName = COMPONENT_NAMES[dirName]
  const example = COMPONENT_EXAMPLES[dirName]

  // --- Layout: multiple sub-components ---
  if (dirName === 'layout') {
    let output = `### ${displayName}\n\n`

    const layoutEntries: {
      title: string
      desc: string
      example: string
      ifaceName: string
    }[] = [
      {
        title: '#### Layout',
        desc: 'Full-screen safe area wrapper.',
        example: `\`\`\`tsx
import { Layout } from '@rootnative/components/layout'

<Layout>{children}</Layout>
<Layout immersive>{/* No safe area insets */}</Layout>
<Layout edges={['top', 'bottom']}>{children}</Layout>
\`\`\``,
        ifaceName: 'LayoutProps',
      },
      {
        title: '#### Box',
        desc: 'Base layout primitive with spacing shorthand props.',
        example: `\`\`\`tsx
import { Box } from '@rootnative/components/layout'

<Box p="md" bg={theme.colors.surface}>{children}</Box>
<Box px="lg" py="sm" gap="md">{children}</Box>
\`\`\``,
        ifaceName: 'BoxProps',
      },
      {
        title: '#### Row',
        desc: 'Horizontal flex container (extends Box).',
        example: `\`\`\`tsx
import { Row } from '@rootnative/components/layout'

<Row gap="sm" align="center">{children}</Row>
<Row wrap>{/* Wraps to next line */}</Row>
\`\`\``,
        ifaceName: 'RowProps',
      },
      {
        title: '#### Column',
        desc: 'Vertical flex container (extends Box). `align` maps to flexbox `alignItems`, so `align="center"` sizes each child to its own content rather than stretching it. A wrapper you insert between the Column and a child — an animation layer, most often — becomes the aligned child, so a block that centres its own text or lays out its own row collapses to that text. Give the wrapper `alignSelf: \'stretch\'`. `Row` does the same on its cross axis, where `align` controls height.',
        example: `\`\`\`tsx
import { Column } from '@rootnative/components/layout'

<Column gap="md">{children}</Column>

// align="center" sizes children to their content. A wrapper needs
// alignSelf: 'stretch' to give its own child the full width back.
<Column align="center">
  <Motion.View style={{ alignSelf: 'stretch' }}>
    <Typography variant="displayMedium">Centred heading</Typography>
  </Motion.View>
</Column>
\`\`\``,
        ifaceName: 'ColumnProps',
      },
      {
        title: '#### Container',
        desc: 'Centred Column with a maximum width (extends Column). `width` names a breakpoint band, and the Container stops growing at the lower bound of that band: `medium` (default) 600dp, `expanded` 840, `large` 1200, `extraLarge` 1600. Below that width it fills its parent. The limit includes the padding. Use it as the one child of a ScrollView, with the screen padding on it, so every screen shares one content column.',
        example: `\`\`\`tsx
import { Container } from '@rootnative/components/layout'

<ScrollView>
  <Container p="lg" gap="md">{children}</Container>
</ScrollView>
<Container width="large" p="lg">{dashboard}</Container>
\`\`\``,
        ifaceName: 'ContainerProps',
      },
      {
        title: '#### Grid',
        desc: 'Equal-width column grid (extends Row).',
        example: `\`\`\`tsx
import { Grid } from '@rootnative/components/layout'

<Grid columns={3} gap="sm">{children}</Grid>
\`\`\``,
        ifaceName: 'GridProps',
      },
      {
        title: '#### Grid.Cell',
        desc: 'Grid child that spans more than one column. A plain Grid child spans exactly one. Also exported as GridCell.',
        example: `\`\`\`tsx
import { Grid } from '@rootnative/components/layout'

<Grid columns={12} gap="md">
  <Grid.Cell span={8}>{main}</Grid.Cell>
  <Grid.Cell span={4}>{aside}</Grid.Cell>
</Grid>
\`\`\``,
        ifaceName: 'GridCellProps',
      },
    ]

    for (const entry of layoutEntries) {
      output += `${entry.title}\n\n${entry.desc}\n\n${entry.example}\n\n`
      const iface = interfaces.find((i) => i.name === entry.ifaceName)
      if (iface) {
        output += formatPropsSection(iface, typeAliases) + '\n'
      }
    }

    return output
  }

  // --- List: shared example + sub-sections ---
  if (dirName === 'list') {
    let output = `### ${displayName}\n\n${example}\n\n`

    const listIface = interfaces.find((i) => i.name === 'ListProps')
    if (listIface) {
      output += formatSubInterface(
        listIface,
        typeAliases,
        '#### List',
        'Container for list items.',
      )
      output += '\n'
    }

    const listItemIface = interfaces.find((i) => i.name === 'ListItemProps')
    if (listItemIface) {
      output += formatSubInterface(listItemIface, typeAliases, '#### ListItem')
      output += '\n'
    }

    output +=
      '#### ListDivider\n\n' +
      'Alias of the standalone `Divider` component — same props. See the ' +
      'Divider section above.\n'

    return output
  }

  // --- ButtonGroup: common props + the selection-mode arms ---
  if (dirName === 'button-group') {
    let output = `### ${displayName}\n\n${example}\n\n`

    // Same shape as AppBar below: `ButtonGroupProps` is a type alias over a
    // three-arm union discriminated on `selectionMode`, so the shared props come
    // from `ButtonGroupCommonProps` and the arms are described here. The arms
    // carry `selectionMode`, `value`, `defaultValue`, `onValueChange` and
    // `onItemPress`, none of which any interface the parser can see declares.
    const propsIface = interfaces.find(
      (i) => i.name === 'ButtonGroupCommonProps',
    )
    if (propsIface) {
      const section = formatPropsSection(propsIface, typeAliases)
      const inheritsLine = '- Inherits `ViewProps` (except `children`)\n'
      const armProps =
        "- `selectionMode?: 'none' | 'single' | 'multiple'` — Default: " +
        "`'none'`. Discriminates the props below. `'single'` selects one item, " +
        "`'multiple'` selects several, `'none'` is an action-only group with no " +
        'selection state.\n' +
        '- `value?: string | null | string[]` — Selected item value(s), ' +
        "controlled. `string | null` when `selectionMode` is `'single'`, " +
        "`string[]` when `'multiple'`. Rejected when `'none'`.\n" +
        '- `defaultValue?: string | null | string[]` — Initial selected ' +
        'value(s), uncontrolled. Same type per mode as `value`.\n' +
        '- `onValueChange?: (value: string | null | string[]) => void` — ' +
        'Called when the selection changes. Same type per mode as `value`. ' +
        "Rejected when `selectionMode` is `'none'`.\n" +
        '- `onItemPress?: (value: string) => void` — Called when an item is ' +
        'pressed, in every mode. The only press callback available when ' +
        "`selectionMode` is `'none'`.\n"
      output += section.includes(inheritsLine)
        ? section.replace(inheritsLine, armProps + inheritsLine)
        : section + armProps
    }

    const itemIface = interfaces.find((i) => i.name === 'ButtonGroupItem')
    if (itemIface) {
      output += '\nButtonGroupItem:\n'
      for (const member of itemIface.members) {
        const resolved = resolveTypeAlias(member.type, typeAliases)
        const opt = member.optional ? '?' : ''
        let line = `- \`${member.name}${opt}: ${resolved}\``
        if (member.comment) line += ` — ${member.comment}`
        output += line + '\n'
      }
    }

    return output
  }

  // --- AppBar: main props + AppBarAction ---
  if (dirName === 'appbar') {
    let output = `### ${displayName}\n\n${example}\n\n`

    // `AppBarProps` is a type alias — `AppBarCommonProps` intersected with a
    // union that makes `actions` and `trailing` mutually exclusive. The parser
    // reads interfaces, so the shared props come from the common interface and
    // the exclusive pair is described here, where the constraint can be stated
    // rather than implied by two independent optional props.
    const propsIface = interfaces.find((i) => i.name === 'AppBarCommonProps')
    if (propsIface) {
      const section = formatPropsSection(propsIface, typeAliases)
      const inheritsLine = '- Inherits `ViewProps` (except `children`)\n'
      const trailingProps =
        '- `actions?: AppBarAction[]` — Array of actions rendered in the ' +
        'trailing slot. Each entry is either an icon action (`{ icon }`) or a ' +
        'text action (`{ label }`, e.g. "Save"). Mutually exclusive with ' +
        '`trailing`.\n' +
        '- `trailing?: ReactNode` — Custom trailing content. Use instead of ' +
        '`actions` when the slot needs something `actions` cannot build, such ' +
        'as a `Menu` anchor or a `Tooltip`. Mutually exclusive with `actions` ' +
        '— the type rejects both together.\n'
      output += section.includes(inheritsLine)
        ? section.replace(inheritsLine, trailingProps + inheritsLine)
        : section + trailingProps
    }

    const actionIface = interfaces.find((i) => i.name === 'AppBarAction')
    if (actionIface) {
      output += '\nAppBarAction:\n'
      for (const member of actionIface.members) {
        const resolved = resolveTypeAlias(member.type, typeAliases)
        const opt = member.optional ? '?' : ''
        let line = `- \`${member.name}${opt}: ${resolved}\``
        if (member.defaultValue && member.comment) {
          line += ` — Default: \`${member.defaultValue}\`. ${member.comment}`
        } else if (member.defaultValue) {
          line += ` — Default: \`${member.defaultValue}\``
        } else if (member.comment) {
          line += ` — ${member.comment}`
        }
        output += line + '\n'
      }
    }

    return output
  }

  // --- SearchBar: common props + the exclusive trailing pair + SearchBarAction ---
  if (dirName === 'search-bar') {
    let output = `### ${displayName}\n\n${example}\n\n`

    // `SearchBarProps` is a type alias, the same shape as `AppBarProps`: the
    // shared props come from `SearchBarCommonProps`, and the exclusive
    // `actions` / `trailing` pair is described here.
    const propsIface = interfaces.find((i) => i.name === 'SearchBarCommonProps')
    if (propsIface) {
      output += formatPropsSection(propsIface, typeAliases)
      output +=
        '- `actions?: SearchBarAction[]` — Icon buttons rendered in the ' +
        'trailing slot, such as a voice action. Mutually exclusive with ' +
        '`trailing`.\n' +
        '- `trailing?: ReactNode` — Custom trailing content, such as an ' +
        '`Avatar`. Mutually exclusive with `actions` — the type rejects both ' +
        'together. The clear button is not part of the slot: it shows before ' +
        'either one while the bar holds text.\n' +
        '- Inherits `TextInputProps` (except `editable`, `style`)\n'
    }

    const actionIface = interfaces.find((i) => i.name === 'SearchBarAction')
    if (actionIface) {
      output += '\nSearchBarAction:\n'
      for (const member of actionIface.members) {
        const resolved = resolveTypeAlias(member.type, typeAliases)
        const opt = member.optional ? '?' : ''
        let line = `- \`${member.name}${opt}: ${resolved}\``
        if (member.defaultValue && member.comment) {
          line += ` — Default: \`${member.defaultValue}\`. ${member.comment}`
        } else if (member.defaultValue) {
          line += ` — Default: \`${member.defaultValue}\``
        } else if (member.comment) {
          line += ` — ${member.comment}`
        }
        output += line + '\n'
      }
    }

    output +=
      '\nThis is the MD3 search **bar**. `SearchView` is the MD3 search ' +
      '**view**, the panel that opens from the bar.\n'

    return output
  }

  // --- Chip: discriminated union, one sub-section per variant ---
  if (dirName === 'chip') {
    let output = `### ${displayName}\n\n${example}\n\n`
    output +=
      '`ChipProps` is a discriminated union on `variant`. Each variant exposes only its valid props — `selected` is filter-only, `elevated` is unavailable on `input`, and on `input` `avatar` and `leadingIcon` are mutually exclusive at the type level.\n\n'

    output += 'Common props (every variant):\n'
    output += '- `children: string` — Text label rendered inside the chip.\n'
    output +=
      '- `onPress?: (event: GestureResponderEvent) => void` — Called when the chip is pressed. With no `onPress`, `onLongPress` or `href`, an assist, suggestion or input chip is a static label: no button role and no tab stop. A filter chip is always a button, because a press toggles it. Expo Router\'s `<Link asChild>` passes `role="link"` and `href`, so the chip renders as an `<a>` on the web.\n'
    output +=
      '- `iconSize?: number` — Default: `18`. Size of the leading icon in dp.\n'
    output +=
      '- `containerColor?: string` — Override the container (background) color. State-layer colors auto-derived.\n'
    output +=
      '- `contentColor?: string` — Override the content (label and icon) color. State-layer colors auto-derived when no `containerColor` is set.\n'
    output +=
      '- `labelStyle?: StyleProp<TextStyle>` — Additional style applied to the label text.\n'
    output +=
      '- `closeAccessibilityLabel?: string` — Default: `` `Remove ${children}` ``. Accessible name for the trailing close affordance, which is a separate a11y target from the chip itself.\n'
    output += '- Inherits `PressableProps` (except `children`)\n\n'

    const interfaceVariants: {
      iface: string
      heading: string
      description: string
    }[] = [
      {
        iface: 'AssistChipProps',
        heading: '#### Assist (default)',
        description:
          'Smart, contextual actions related to the surrounding content.',
      },
      {
        iface: 'FilterChipProps',
        heading: '#### Filter',
        description:
          'Toggleable chip used to refine or narrow content. Supports a `selected` state and an optional close icon while selected.',
      },
      {
        iface: 'SuggestionChipProps',
        heading: '#### Suggestion',
        description: 'Dynamic recommendations or follow-up actions.',
      },
    ]

    for (const v of interfaceVariants) {
      const iface = interfaces.find((i) => i.name === v.iface)
      if (iface) {
        output += formatSubInterface(
          iface,
          typeAliases,
          v.heading,
          v.description,
        )
        output += '\n'
      }
    }

    output += '#### Input\n\n'
    output +=
      'User-entered information such as a tag or contact. Always outlined; supports either `avatar` or `leadingIcon` (mutually exclusive) plus an optional close icon.\n\n'
    output += 'Variant-specific props:\n'
    output += "- `variant: 'input'`\n"
    output +=
      '- `avatar?: ReactNode` — Custom avatar content (e.g. a small Image or View) before the label. Mutually exclusive with `leadingIcon`.\n'
    output +=
      '- `leadingIcon?: IconSource` — Icon rendered before the label. Mutually exclusive with `avatar`.\n'
    output +=
      '- `onClose?: () => void` — Callback fired when the close/remove icon is pressed. When provided, renders a trailing close icon.\n'

    return output
  }

  // --- Progress: shared example + LinearProgress + CircularProgress ---
  if (dirName === 'progress') {
    let output = `### ${displayName}\n\n${example}\n\n`

    const linearIface = interfaces.find((i) => i.name === 'LinearProgressProps')
    if (linearIface) {
      output += formatSubInterface(
        linearIface,
        typeAliases,
        '#### LinearProgress',
        'Horizontal progress indicator. Omit `progress` for indeterminate mode.',
      )
      output += '\n'
    }

    const circularIface = interfaces.find(
      (i) => i.name === 'CircularProgressProps',
    )
    if (circularIface) {
      output += formatSubInterface(
        circularIface,
        typeAliases,
        '#### CircularProgress',
        'Circular progress indicator. Omit `progress` for indeterminate mode.',
      )
    }

    return output
  }

  // --- Snackbar: provider props + show() options ---
  if (dirName === 'snackbar') {
    let output = `### ${displayName}\n\n${example}\n\n`

    const providerIface = interfaces.find(
      (i) => i.name === 'SnackbarProviderProps',
    )
    if (providerIface) {
      output += formatSubInterface(
        providerIface,
        typeAliases,
        '#### SnackbarProvider',
        'Owns the queue. Mount once, inside `ThemeProvider` and inside `PortalHost`.',
      )
      output += '\n'
    }

    const optionsIface = interfaces.find((i) => i.name === 'SnackbarOptions')
    if (optionsIface) {
      output += formatSubInterface(
        optionsIface,
        typeAliases,
        '#### useSnackbar().show(options)',
        'Enqueues a snackbar and returns its id. `hide(id?)` dismisses one (visible or queued); `clear()` drops everything.',
      )
    }

    return output
  }

  // --- Tabs: row props + the shape of one item ---
  if (dirName === 'tabs') {
    let output = `### ${displayName}\n\n${example}\n\n`

    const propsIface = interfaces.find((i) => i.name === 'TabsProps')
    if (propsIface) {
      output += formatPropsSection(propsIface, typeAliases)
      output += '\n'
    }

    const itemIface = interfaces.find((i) => i.name === 'TabItem')
    if (itemIface) {
      output += formatSubInterface(
        itemIface,
        typeAliases,
        '#### TabItem',
        'One tab. `value` is what `onValueChange` reports and what `value` / `defaultValue` match against.',
      )
    }

    return output
  }

  // --- NavigationBar: bar props + the shape of one destination ---
  if (dirName === 'navigation-bar') {
    let output = `### ${displayName}\n\n${example}\n\n`

    const propsIface = interfaces.find((i) => i.name === 'NavigationBarProps')
    if (propsIface) {
      output += formatPropsSection(propsIface, typeAliases)
      output += '\n'
    }

    const itemIface = interfaces.find((i) => i.name === 'NavigationBarItem')
    if (itemIface) {
      output += formatSubInterface(
        itemIface,
        typeAliases,
        '#### NavigationBarItem',
        'One destination. `value` is what `onValueChange` reports and what `value` / `defaultValue` match against.',
      )
    }

    return output
  }

  // --- NavigationRail: rail props; items share NavigationBarItem ---
  if (dirName === 'navigation-rail') {
    let output = `### ${displayName}\n\n${example}\n\n`

    const propsIface = interfaces.find((i) => i.name === 'NavigationRailProps')
    if (propsIface) {
      output += formatPropsSection(propsIface, typeAliases)
      output += '\n'
    }

    output +=
      '#### NavigationRailItem\n\n' +
      'The same shape as `NavigationBarItem` (see NavigationBar above): ' +
      '`value`, `label`, `icon`, `selectedIcon?`, `badge?`, `disabled?`, ' +
      '`accessibilityLabel?`. One array can feed a `NavigationBar` on a ' +
      'compact window and a `NavigationRail` on a wider one.\n'

    return output
  }

  // --- NavigationDrawer: common props + the modal/standard arms + sub-components ---
  if (dirName === 'navigation-drawer') {
    let output = `### ${displayName}\n\n${example}\n\n`

    // `NavigationDrawerProps` is a type alias — `NavigationDrawerCommonProps`
    // intersected with a union that gives the modal variant `visible` /
    // `onDismiss` and rejects them on the standard one. The parser reads
    // interfaces, so the shared props come from the common interface and the
    // arms are described here.
    const propsIface = interfaces.find(
      (i) => i.name === 'NavigationDrawerCommonProps',
    )
    if (propsIface) {
      const section = formatPropsSection(propsIface, typeAliases)
      const inheritsLine =
        '- Inherits `ViewProps` (except `children`, `style`)\n'
      const armProps =
        "- `variant?: 'modal' | 'standard'` — Default: `'modal'`. `'modal'` " +
        'slides in over the content from the start edge, behind a scrim, and ' +
        "renders through `Portal`. `'standard'` renders in place as a " +
        'permanent side panel.\n' +
        '- `visible: boolean` — **Modal only, required.** Whether the drawer ' +
        'is shown. Exit animations run before it unmounts.\n' +
        '- `onDismiss: () => void` — **Modal only, required.** Called on a ' +
        'scrim press, Android back, Escape on web, or a destination press ' +
        'when `dismissOnSelect` is on. Set `visible` to `false` in response.\n' +
        '- `dismissable?: boolean` — Modal only. Default: `true`. Whether the ' +
        'scrim press, Android back, and Escape dismiss the drawer.\n' +
        '- `dismissOnSelect?: boolean` — Modal only. Default: `true`. Whether ' +
        'a destination press also calls `onDismiss`.\n' +
        '- `hostName?: string` — Modal only. Render into a named `PortalHost`.\n' +
        '- `scrimStyle?: StyleProp<ViewStyle>` — Modal only. Style for the scrim.\n' +
        "- `scrimAccessibilityLabel?: string` — Modal only. Default: `'Close " +
        "navigation drawer'`.\n" +
        'The type rejects every modal prop on `variant="standard"`.\n'
      output += section.includes(inheritsLine)
        ? section.replace(inheritsLine, armProps + inheritsLine)
        : section + armProps
      output += '\n'
    }

    const itemIface = interfaces.find(
      (i) => i.name === 'NavigationDrawerItemProps',
    )
    if (itemIface) {
      output += formatSubInterface(
        itemIface,
        typeAliases,
        '#### NavigationDrawer.Item',
        'One destination: a 56dp row with an optional 24dp icon, a `labelLarge` label, and an optional trailing badge text. Active when `value` matches the drawer selection.',
      )
      output += '\n'
    }

    const sectionIface = interfaces.find(
      (i) => i.name === 'NavigationDrawerSectionProps',
    )
    if (sectionIface) {
      output += formatSubInterface(
        sectionIface,
        typeAliases,
        '#### NavigationDrawer.Section',
        'A group of destinations with an optional `titleSmall` headline, 56dp tall and inset 28dp from the sheet edge.',
      )
      output += '\n'
    }

    output +=
      '#### NavigationDrawer.Divider\n\n' +
      'A `Divider` inset 28dp from both sheet edges, for use between sections. ' +
      'Takes `DividerProps` except `orientation`, `insetStart` and `insetEnd`, ' +
      'which are fixed.\n'

    return output
  }

  // --- Menu: surface props + Menu.Item ---
  if (dirName === 'menu') {
    let output = `### ${displayName}\n\n${example}\n\n`

    const propsIface = interfaces.find((i) => i.name === 'MenuProps')
    if (propsIface) {
      output += formatPropsSection(propsIface, typeAliases)
      output += '\n'
    }

    const itemIface = interfaces.find((i) => i.name === 'MenuItemProps')
    if (itemIface) {
      output += formatSubInterface(
        itemIface,
        typeAliases,
        '#### Menu.Item',
        'One choice. Pressing it closes the menu unless `closeOnPress` is `false`.',
      )
    }

    return output
  }

  // --- Card: main props + the three region slots ---
  if (dirName === 'card') {
    let output = `### ${displayName}\n\n${example}\n\n`

    const propsIface = interfaces.find((i) => i.name === 'CardProps')
    if (propsIface) {
      output += formatPropsSection(propsIface, typeAliases)
      output += '\n'
    }

    const slots: [string, string, string][] = [
      [
        'CardMediaProps',
        '#### Card.Media',
        'Edge-to-edge media. No padding of its own, and the card clips it to the corner radius. Size it with `height` or `aspectRatio`; children then stretch to fill.',
      ],
      [
        'CardContentProps',
        '#### Card.Content',
        'Padded text block — 16dp on every side, with a small gap between children.',
      ],
      [
        'CardActionsProps',
        '#### Card.Actions',
        'Row of action buttons, 8dp gap, aligned to the trailing edge by default.',
      ],
    ]

    for (const [ifaceName, heading, description] of slots) {
      const iface = interfaces.find((i) => i.name === ifaceName)
      if (!iface) continue
      output += formatSubInterface(iface, typeAliases, heading, description)
      output += '\n'
    }

    return output
  }

  // --- Dialog: main props + the four compound slots ---
  if (dirName === 'dialog') {
    let output = `### ${displayName}\n\n${example}\n\n`

    const propsIface = interfaces.find((i) => i.name === 'DialogProps')
    if (propsIface) {
      output += formatPropsSection(propsIface, typeAliases)
      output += '\n'
    }

    const slots: [string, string, string][] = [
      [
        'DialogIconProps',
        '#### Dialog.Icon',
        'Optional 24dp hero icon in `secondary`. Its presence centers the headline.',
      ],
      [
        'DialogTitleProps',
        '#### Dialog.Title',
        'Headline — `headlineSmall` in the basic variant, `titleLarge` in the fullscreen header.',
      ],
      [
        'DialogContentProps',
        '#### Dialog.Content',
        'Supporting text (strings get `bodyMedium` / `onSurfaceVariant`) or arbitrary content.',
      ],
      [
        'DialogActionsProps',
        '#### Dialog.Actions',
        'End-aligned row of text buttons, 8dp gap. Moves into the header in the fullscreen variant.',
      ],
    ]

    for (const [ifaceName, heading, description] of slots) {
      const iface = interfaces.find((i) => i.name === ifaceName)
      if (!iface) continue
      output += formatSubInterface(iface, typeAliases, heading, description)
      output += '\n'
    }

    return output
  }

  // --- Portal: Portal + PortalHost + the z-order contract ---
  if (dirName === 'portal') {
    let output = `### ${displayName}\n\n${example}\n\n`

    const portalIface = interfaces.find((i) => i.name === 'PortalProps')
    if (portalIface) {
      output += formatSubInterface(
        portalIface,
        typeAliases,
        '#### Portal',
        'Teleports its children into a host overlay layer. Renders nothing inline. With no `<PortalHost>` ancestor it falls back to rendering its children inline and logs a `console.error` in dev — check the console first if a `BottomSheet`, `Dialog`, `Snackbar`, `Menu` or `Tooltip` renders nothing at all.',
      )
      output += '\n'
    }

    const hostIface = interfaces.find((i) => i.name === 'PortalHostProps')
    if (hostIface) {
      output += formatSubInterface(
        hostIface,
        typeAliases,
        '#### PortalHost',
        'Mount once at the app root. A `name` makes it a scoped slot that `<Portal hostName>` can target.',
      )
      output += '\n'
    }

    output +=
      '#### PORTAL_LAYERS\n\n' +
      'Z-order contract for overlays in the same host — portals stack by ascending `priority`, ties broken by mount order. Default `priority` is `0`.\n\n' +
      '- `sheet: 100` — bottom/side sheets and their scrim\n' +
      '- `dialog: 200` — dialogs and their scrim\n' +
      '- `snackbar: 300` — snackbars, above an open dialog\n' +
      '- `menu: 400` — menus and dropdowns\n' +
      '- `tooltip: 500` — tooltips, topmost\n\n' +
      'The 100-point gaps let you slot custom overlays between layers (`PORTAL_LAYERS.dialog + 1`). `priority` orders portals within one host only — stacking between hosts follows tree position.\n'

    return output
  }

  // --- Standard single-component section ---
  let output = `### ${displayName}\n\n${example}\n\n`

  const propsIface = interfaces.find((i) => i.name.endsWith('Props'))
  if (propsIface) {
    output += formatPropsSection(propsIface, typeAliases)
  }

  return output
}

// ============================================================
// Content: Components (auto-extracted props + static examples)
// ============================================================

function componentsContent(): string {
  let output = ''

  output += `Import via subpath (preferred): \`import { X } from '@rootnative/components/x'\`
Import via root: \`import { X } from '@rootnative/components'\`

### When to pick which

**Overlays** — all five render through \`Portal\` and need the root \`PortalHost\` (see App root setup):

| You want | Component |
| --- | --- |
| A blocking decision or confirmation | \`Dialog\` |
| A task panel or options sheet from the bottom edge | \`BottomSheet\` |
| A list of contextual actions anchored to a control | \`Menu\` |
| A short label on hover / long-press | \`Tooltip\` |
| A transient, passive message with an optional action | \`Snackbar\` (via \`useSnackbar()\`) |

**Loading and progress:**

| You want | Component |
| --- | --- |
| Determinate or indeterminate progress on a bar | \`LinearProgress\` |
| The same, in a circle | \`CircularProgress\` |
| An indeterminate MD3 Expressive wait indicator | \`LoadingIndicator\` |
| A placeholder shaped like the content it stands in for (image, text row) | \`Skeleton\` |

### Component override pattern

All interactive components follow a 3-tier override system. Merge order: theme defaults → variant → semantic props → style props (last wins).

Standard override props on interactive components:
- \`containerColor?: string\` — Root container background. Hover/press state-layer colors auto-derived.
- \`contentColor?: string\` — Content (label + icons) color. State-layer colors auto-derived.
- \`labelStyle?: StyleProp<TextStyle>\` — Text-specific overrides (does not affect icons).
- \`style\` — Root container style.

Disabled state always uses standard MD3 disabled treatment (38% onSurface) regardless of overrides.

---

`

  for (let idx = 0; idx < COMPONENT_ORDER.length; idx++) {
    output += generateComponentSection(COMPONENT_ORDER[idx])
    if (idx < COMPONENT_ORDER.length - 1) {
      output += '\n---\n\n'
    }
  }

  return output
}

// ============================================================
// Content: Web without Expo (static template)
// ============================================================

/**
 * The config a bundler without Metro needs. Each item was a real failure in
 * an Electron app built with Vite: the build passed and nothing animated,
 * `global` was not defined, and the icon import did not resolve. The icon
 * import now sits behind the `mdi` subpath, so step 5 is a choice, not an alias.
 */
function webWithoutExpoContent(): string {
  return `Expo and Metro do five things for a web app that Vite, webpack, an
Electron renderer or a Tauri renderer do not. Each one is a build or runtime
failure without it. The docs page "Web without Expo" has a full Vite config
and a full webpack config.

1. **Alias \`react-native\` to \`react-native-web\`**, with an exact match
   (\`/^react-native$/\`), so \`react-native-svg\` and the other
   \`react-native-*\` packages keep their names.
2. **Resolve \`.web.tsx\`, \`.web.ts\`, \`.web.mjs\` and \`.web.js\` before the
   plain extensions.** The safe-area package, Reanimated and this library ship
   web variants that Metro picks by platform.
3. **Run \`react-native-worklets/plugin\` on the app source and on
   \`node_modules/@rootnative\`, \`node_modules/react-native-reanimated\` and
   \`node_modules/react-native-worklets\`.** All three ship raw \`'worklet'\`
   directives. A bundler skips \`node_modules\` by default; the build then
   succeeds and nothing animates, with no error in production. Inertia logs one
   \`console.error\` at the first \`Motion\` render when the plugin is missing.
   An include that covers \`@rootnative\` only logs \`timing easing: the
   provided easing function is not a worklet\` in a dev build.
4. **Define \`global\` as \`globalThis\`, plus \`__DEV__\` and
   \`process.env.NODE_ENV\`.** Reanimated reads \`global\`; a browser and a
   sandboxed Electron renderer throw \`ReferenceError: global is not defined\`
   without the define.
5. **Choose an icon set.** A string icon name needs an \`iconResolver\` on
   \`ThemeProvider\`. For MaterialDesignIcons, install
   \`@react-native-vector-icons/material-design-icons\` and \`expo-font\`, which run on
   web without the rest of Expo, and pass \`mdiResolver\` from
   \`@rootnative/components/mdi\`. For your own icons, register your resolver
   and skip the install: only the \`mdi\` subpath imports the icon package,
   so no alias is needed.

Vite, with \`@rolldown/plugin-babel\`:

\`\`\`ts
babel({
  include: [
    /src\\/.*\\.tsx?$/,
    /node_modules\\/(@rootnative|react-native-reanimated|react-native-worklets)\\/.*\\.m?js$/,
  ],
  exclude: /\\0rolldown\\/runtime\\.js/,
  plugins: ['react-native-worklets/plugin'],
})
\`\`\`

The app root is the same as on Expo, and no \`SafeAreaProvider\` is needed.
Electron adds three facts: set the bundler base path to \`./\` for a
\`file://\` page, allow \`'unsafe-inline'\` in \`style-src\` because
\`react-native-web\` inserts its style sheet at run time, and the \`global\`
define is required in a sandboxed renderer. Electron is not yet listed as a
tested host.`
}

// ============================================================
// Content: App root setup (static template)
// ============================================================

/**
 * The assembled provider stack, in one snippet.
 *
 * Every constraint below is stated correctly in its own section — `PortalHost`
 * under Portal, `SnackbarProvider` under Snackbar, `ThemeProvider` in
 * `core/llms.txt` — and nowhere together. A reader who needs a working app root
 * had to find four sections in two files and hold the nesting rules in their
 * head. This section is the assembled result, so it stays first.
 */
function appRootContent(): string {
  return `Mount the providers once, at the app root, in this order. Each provider
below is also documented on its own; this is the assembled result.

\`\`\`tsx
import { mdiResolver } from '@rootnative/components/mdi'
import { PortalHost } from '@rootnative/components/portal'
import { SnackbarProvider } from '@rootnative/components/snackbar'
import { ThemeProvider, darkTheme, lightTheme } from '@rootnative/core'

export default function App() {
  return (
    <ThemeProvider
      theme={{ light: lightTheme, dark: darkTheme }}
      iconResolver={mdiResolver}
    >
      <PortalHost>
        <SnackbarProvider>
          {/* Your app */}
        </SnackbarProvider>
      </PortalHost>
    </ThemeProvider>
  )
}
\`\`\`

That is the whole stack — three providers, and **no \`SafeAreaProvider\`**.
\`react-native-safe-area-context\` is a required peer dep, but the components that
apply insets (\`Layout\`, \`AppBar\`, \`NavigationBar\`, \`BottomSheet\`, \`Snackbar\`)
work without one. Inside a provider they read the insets from its context. On
native without a provider they use the package's native \`SafeAreaView\`, which
measures its own insets. On web without a provider they apply zero insets,
because a browser has no insets to measure there. Add a \`SafeAreaProvider\` on
web when the page needs the \`env(safe-area-inset-*)\` values of a notched
device, or when your own code calls \`useSafeAreaInsets\`.

Why that order:

- **\`ThemeProvider\`** — above every component, since all of them read the theme.
  Passing the \`{ light, dark }\` pair (rather than one theme) is what enables
  \`useThemeMode()\` in descendants; it then follows the OS setting on its own. Add
  \`storage={AsyncStorage}\` to remember an explicit choice across launches. On
  web, pass \`localStorage\` itself: a \`getItem\` or \`setItem\` that throws is
  caught and the mode stays at \`defaultMode\`, so no wrapper is needed.
  \`iconResolver\` renders string icon names; \`mdiResolver\` is the
  MaterialDesignIcons one and the only module that imports
  \`@react-native-vector-icons/material-design-icons\`. Pass your own resolver
  instead to drop that peer.
- **\`PortalHost\`** — inside \`ThemeProvider\`, so portalled overlays are themed
  too, and above your screens, so overlays get the whole window. One host at the
  root; \`Dialog\`, \`BottomSheet\`, \`Menu\`, \`Tooltip\` and \`Snackbar\` all need it.
  Nesting an unnamed host inside another **shadows** the outer one — use
  \`name\` for a scoped host.
- **\`SnackbarProvider\`** — inside both, because it renders through a \`Portal\` and
  its snackbars are themed. It owns the queue; \`useSnackbar()\` works anywhere
  below it. No \`bottomOffset\` is needed here unless every screen carries the same
  bottom furniture: the provider already applies the bottom safe-area inset **and**
  the snackbar's own 16dp margin, so the offset covers only what sits on top of
  those. A screen with a FAB should call \`useSnackbarOffset(snackbarOffsetFor(
  FAB_SIZES.medium))\` instead, which applies while that screen is mounted and
  reverts on unmount. Compute the number rather than hard-coding one — a literal
  \`88\` double-counts the 16dp margin the layer already added.

**No gesture-handler setup is required.** \`react-native-gesture-handler\` is not a
peer dependency of any \`@rootnative/*\` package, so there is no
\`GestureHandlerRootView\` in the stack above. \`BottomSheet\` drag runs on
\`@rootnative/inertia/touch\`, which is built on React Native's own \`PanResponder\`
for exactly this reason; every other interaction uses \`Pressable\`.

Nothing else belongs at the root. Every other component works wherever you
render it.`
}

// ============================================================
// Content: Jest setup (static template)
// ============================================================

/**
 * How to make a consumer's Jest suite load these packages.
 *
 * This is the one setup step no `llms.txt` stated, and it is not guessable:
 * the failure is a syntax error inside `node_modules` on a package the reader
 * did not write, and the obvious fix (`transformIgnorePatterns`) does nothing
 * on its own. Verified here against the installed presets —
 * `react-native/jest-preset` transforms `^.+\.(js|ts|tsx)$`, so the 11 `.mjs`
 * files in `@rootnative/inertia/dist` match no transform at all.
 */
function jestSetupContent(): string {
  return `Every \`@rootnative/*\` package ships ESM. A consumer's Jest suite needs
two things to load them, and the second one is the step people miss.

\`\`\`js
// jest.config.js
module.exports = {
  preset: require.resolve('@rootnative/inertia/jest-preset'),
  transform: {
    // The preset's parent matches .js/.ts/.tsx only — .mjs needs its own entry.
    '^.+\\\\.mjs$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@rootnative|@material/material-color-utilities)/)',
  ],
}
\`\`\`

**\`transformIgnorePatterns\` alone is not enough, and that is the trap.** The two
settings do different jobs, and only one of them is widely known:

- \`transformIgnorePatterns\` says a file is *allowed* to be transformed.
- \`transform\` says a file *matches a transformer*.

A file that matches no transformer is never transformed — allowed or not. The
\`react-native\` preset transforms \`^.+\\.(js|ts|tsx)$\`, which does not include
\`.mjs\`, and \`@rootnative/inertia\` ships \`.mjs\` in its \`dist/\`. So widening only
\`transformIgnorePatterns\` leaves the import failing with a syntax error on
\`export\` — inside \`node_modules\`, in a package the reader did not write, which
is why it reads as a broken package rather than a missing config line.

**The transform entry needs a Babel config that transpiles ESM, and both halves
are required.** Measured on all four combinations: the transform entry with no
applicable Babel config still fails on \`export\`, because \`babel-jest\` then
passes the file through unchanged; a Babel config with no transform entry fails
too, because nothing routes \`.mjs\` to it. An Expo app already has a
\`babel.config.js\` with \`babel-preset-expo\`, so in practice the transform entry
is the missing half — but if you run Jest somewhere without one, add
\`@babel/preset-env\` targeting the current Node.

\`@material/material-color-utilities\` needs the same allowance whenever
\`createMaterialTheme\` is on a tested path; it is ESM-only too.

**Two version pins, whatever the SDK.** Both cost a debugging cycle in
a real consumer, and neither failure names its cause:

- **Jest 29, not 30.** \`jest-expo\` depends on Jest 29 packages. On Jest 30
  every suite dies with \`this._moduleMocker.clearMocksOnScope is not a function\`.
- **\`@testing-library/react-native\` 13, not 14.** Version 14 replaces
  \`react-test-renderer\` with the \`test-renderer\` package; under this preset its
  \`render\` returns an empty object while \`screen\` reports
  \`\\\`render\\\` function has not been called\`.

**Screens need the providers.** A component that reads the theme fails inside
\`useTheme\` when rendered bare. Wrap \`render\` in the same stack as the app root
(see App root setup) and export that wrapper as your test utility, rather than
repeating the providers in every file.`
}

// ============================================================
// Content: Core API (static templates)
// ============================================================

function coreContent(): string {
  return `### When to pick which — theme paths

Ask this first. Every path below ends in the same \`<ThemeProvider theme={...}>\`.

| You want | Reach for |
| --- | --- |
| MD3 defaults, no setup | \`<ThemeProvider>\` alone (light), or \`theme={{ light: lightTheme, dark: darkTheme }}\` to follow the OS |
| A full MD3 palette from one brand color | \`createMaterialTheme(seed)\` from \`@rootnative/core/create-theme\` |
| MD3 with a few token overrides | Spread over \`lightTheme\` / \`darkTheme\` (see the custom-theme example under ThemeProvider) |
| MD3 with sharper or rounder corners | The \`roundness\` option on \`createMaterialTheme\`, or \`applyRoundness()\` on an existing theme |
| A fully custom design system (your own tokens) | \`defineTheme<MyTheme>()\` + \`useTheme<MyTheme>()\` |
| Light/dark switching and persistence | The \`{ light, dark }\` pair + \`useThemeMode()\`; add \`storage\` to persist |

### ThemeProvider

Wrap your app root to supply the theme to all components. Works with any design system — Material Design 3 or custom themes. Defaults to the MD3 light theme when no theme is provided.

\`\`\`tsx
import { ThemeProvider, darkTheme } from '@rootnative/core'

// Light theme (default)
<ThemeProvider>{children}</ThemeProvider>

// Dark theme
<ThemeProvider theme={darkTheme}>{children}</ThemeProvider>

// Light/dark, following the OS setting
import { lightTheme } from '@rootnative/core'

<ThemeProvider theme={{ light: lightTheme, dark: darkTheme }}>
  {children}
</ThemeProvider>

// ...and remembering the user's override across launches
import AsyncStorage from '@react-native-async-storage/async-storage'

<ThemeProvider
  theme={{ light: lightTheme, dark: darkTheme }}
  storage={AsyncStorage}
>
  {children}
</ThemeProvider>

// Custom theme
import type { Theme } from '@rootnative/core'

const custom: Theme = {
  ...lightTheme,
  colors: { ...lightTheme.colors, primary: '#006A6A', onPrimary: '#FFFFFF' },
}
<ThemeProvider theme={custom}>{children}</ThemeProvider>
\`\`\`

Props:
- \`theme?: BaseTheme | { light: BaseTheme; dark: BaseTheme }\` — A single theme, or a light/dark pair. A pair enables \`useThemeMode()\`. Default: \`lightTheme\` (MD3)
- \`mode?: 'system' | 'light' | 'dark'\` — Controlled mode. Leave unset and use \`setMode()\` instead. Pair with \`onModeChange\`. On a static web export, \`'system'\` renders light on the server and while the client hydrates, then follows the OS on the next render. No hydration gate is needed around it
- \`defaultMode?: 'system' | 'light' | 'dark'\` — Initial mode when uncontrolled. Default: \`'system'\`
- \`onModeChange?: (mode: ThemeMode) => void\`
- \`storage?: { getItem, setItem }\` — Persists the mode. Any AsyncStorage-shaped object; sync or async. Nothing is persisted unless you pass this
- \`iconResolver?: IconResolver\` — Renders string icon names. Pass \`mdiResolver\` from \`@rootnative/components/mdi\` for MaterialDesignIcons, or your own. Without it a string name renders nothing and logs one warning
- \`children: ReactNode\`

### useThemeMode()

Reads and controls light/dark mode. Requires a provider given a \`{ light, dark }\` pair — it throws otherwise, since a single-theme provider has no mode to control.

Returns \`{ mode, scheme, setMode, isReady }\`:
- \`mode\` — what was asked for, including \`'system'\`
- \`scheme\` — the resolved \`'light' | 'dark'\` actually rendering. Use this to sync anything outside the theme, such as the status bar
- \`setMode(mode)\` — switches mode, and persists it when \`storage\` is set
- \`isReady\` — \`false\` until a persisted mode has loaded. Always \`true\` without \`storage\`. Gate a splash screen on it to avoid a launch flash

\`\`\`tsx
import { useThemeMode } from '@rootnative/core'
import { StatusBar } from 'expo-status-bar'

function ThemeToggle() {
  const { scheme, setMode } = useThemeMode()

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Button onPress={() => setMode(scheme === 'dark' ? 'light' : 'dark')}>
        Toggle theme
      </Button>
    </>
  )
}
\`\`\`

### useTheme()

Returns the current theme from the nearest \`ThemeProvider\`.

Without a type parameter, returns the Material Design 3 \`Theme\`. Pass a custom theme type for typed access to your design system's tokens.

\`\`\`tsx
import { useTheme } from '@rootnative/core'

// Material Design 3 (default)
const theme = useTheme()
// theme.colors.primary, theme.typography.bodyMedium, theme.spacing.md, etc.

// Custom design system
const theme = useTheme<MyTheme>()
// theme.colors.brand, theme.typography.heading, etc.
\`\`\`

### defineTheme(theme)

Identity function that validates a custom theme object against \`BaseTheme\`. Provides type-checking and autocompletion.

\`\`\`tsx
import { defineTheme } from '@rootnative/core'
import type { BaseTheme, TypographyToken } from '@rootnative/core'

interface MyColors { [key: string]: string; brand: string; background: string; text: string }
interface MyTypography { [key: string]: TypographyToken; heading: TypographyToken; body: TypographyToken }
interface MyTheme extends BaseTheme { colors: MyColors; typography: MyTypography }

const myTheme = defineTheme<MyTheme>({
  colors: { brand: '#FF6B00', background: '#FFFFFF', text: '#1A1A1A' },
  typography: {
    heading: { fontFamily: 'Inter', fontSize: 24, fontWeight: '700', lineHeight: 32, letterSpacing: 0 },
    body: { fontFamily: 'Inter', fontSize: 16, fontWeight: '400', lineHeight: 24, letterSpacing: 0.5 },
  },
  shape: { roundness: 1, cornerNone: 0, cornerExtraSmall: 4, cornerSmall: 8, cornerMedium: 12, cornerLarge: 16, cornerExtraLarge: 28, cornerFull: 999 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  stateLayer: { pressedOpacity: 0.1, focusedOpacity: 0.1, hoveredOpacity: 0.08, draggedOpacity: 0.16, disabledOpacity: 0.38, disabledContainerOpacity: 0.12 },
  elevation: { ... },
  motion: { ... },
})
\`\`\`

### createMaterialTheme(seedColor, options?)

Generates a complete MD3 light and dark theme from a single seed color. Uses Google's HCT color space via \`@material/material-color-utilities\` for spec-compliant palette generation.

Defaults are byte-identical to the upstream MD3 \`material-color-utilities\` library — pure spec output.

**Spec-aligned options:**
- \`variant?: 'tonalSpot' | 'neutral' | 'vibrant' | 'expressive' | 'fidelity' | 'content' | 'monochrome' | 'rainbow' | 'fruitSalad'\` — MD3 scheme variant (default \`'tonalSpot'\`, the Material You default on Android 12+). Each is a spec-defined recipe for deriving the palette. Use \`'monochrome'\` for spec-legal pure-grey themes, \`'vibrant'\` for high-colorfulness, etc. **Two variants move the primary hue away from your seed — see the table below.**

**Does the variant keep the seed hue?**

Ask this first if the seed is a brand color. \`expressive\` and \`fruitSalad\` rotate the primary hue by design — this is correct MD3 behavior, not a defect, but it means the generated \`primary\` is not your brand color. Example results for the seed \`#E07A3F\` (a strong orange):

| Variant | Light \`primary\` | Keeps the seed hue? |
| --- | --- | --- |
| \`tonalSpot\` | \`#8d4e2a\` | Yes |
| \`neutral\` | — | Yes (low chroma) |
| \`vibrant\` | \`#9d4300\` | Yes |
| \`expressive\` | \`#585799\` | **No — rotates to blue-violet** |
| \`fidelity\` | \`#9b450b\` | Yes — also returns the seed as \`primaryContainer\` |
| \`content\` | \`#9b450b\` | Yes |
| \`monochrome\` | — | Yes (chroma 0) |
| \`rainbow\` | \`#984714\` | Yes |
| \`fruitSalad\` | \`#974066\` | **No — rotates to magenta** |

Use \`fidelity\`, \`content\`, or \`tonalSpot\` to keep the seed hue. Pick \`expressive\` for colorfulness only when the palette does not have to match a brand color.

**\`fidelity\` pins \`primaryContainer\` to the seed in both modes.** With \`variant: 'fidelity'\` the seed is returned as \`primaryContainer\` in the light theme **and** the dark theme (\`onPrimaryContainer\` stays dark in both). This is upstream MD3 fidelity behavior: the scheme holds the source color exactly. Every other container role gets darker in dark mode, so a bright container with dark text can break the surface ramp. Override \`primaryContainer\` / \`onPrimaryContainer\` for the dark theme if the ramp matters more than seed fidelity.
- \`contrastLevel?: 'standard' | 'medium' | 'high'\` — MD3 contrast preset (default \`'standard'\`). Maps to MD3 contrast values \`0 / 0.5 / 1.0\`. Use \`'medium'\` or \`'high'\` for WCAG AAA / low-vision modes.
- \`fontFamily?: string\` — Custom font family applied to all 30 typography styles (15 base + 15 emphasized). When omitted, platform defaults are used (Roboto on Android, System on iOS).
- \`roundness?: number\` — Global corner-radius multiplier. \`0\` = sharp corners, \`1\` = default MD3 (default), \`2\` = double rounding. Does not affect \`cornerNone\` or \`cornerFull\`.

**Explicit overrides (NOT part of MD3 spec — use only when no built-in \`variant\` covers your case):**
- \`surfaceTone?: 'spec' | 'neutral'\` — Default \`'spec'\` keeps the variant's neutral palette as-is. \`'neutral'\` rebuilds the neutral and neutralVariant palettes with chroma \`0\` while leaving primary/secondary/tertiary untouched. Use this for a colorful brand + OLED-near-black surfaces. For a fully spec-legal monochrome theme prefer \`variant: 'monochrome'\`.
- \`seedAdjustments?: { primary?: number, secondary?: number }\` — Per-palette HCT chroma overrides. Same hue, fresh chroma. The variant defaults are spec-defined (TonalSpot uses \`primary: 36\` / \`secondary: 16\`); only override when no \`variant\` matches your brand. Try \`variant: 'vibrant'\` first.

**Separate entry point** — keeps the ~60 kB dependency out of the main bundle:

\`\`\`tsx
import { createMaterialTheme } from '@rootnative/core/create-theme'
import { ThemeProvider } from '@rootnative/core'

// Pure MD3 default (TonalSpot variant)
const { lightTheme, darkTheme } = createMaterialTheme('#006A6A')

// Switch MD3 variant
createMaterialTheme('#006A6A', { variant: 'vibrant' })

// Spec-legal monochrome theme
createMaterialTheme('#006A6A', { variant: 'monochrome' })

// High-contrast accessibility preset
createMaterialTheme('#006A6A', { contrastLevel: 'high' })

// Custom font + sharp corners
createMaterialTheme('#006A6A', { fontFamily: 'Inter', roundness: 0 })

// Override: keep colorful primary/secondary, flatten surfaces to pure grey
createMaterialTheme('#006A6A', { surfaceTone: 'neutral' })

// Override: per-palette chroma
createMaterialTheme('#006A6A', { seedAdjustments: { primary: 60, secondary: 32 } })

// Use in provider — pinned light
<ThemeProvider theme={lightTheme}>{children}</ThemeProvider>

// Or hand both to the provider and let it follow the OS. Rename on
// destructure so the pair matches the prop's { light, dark } shape.
const { lightTheme: light, darkTheme: dark } = createMaterialTheme('#006A6A')

<ThemeProvider theme={{ light, dark }}>{children}</ThemeProvider>
\`\`\`

Returns: \`{ lightTheme: Theme, darkTheme: Theme }\`

The generated themes include all 49 MD3 color roles plus shared tokens (typography, shape, spacing, stateLayer, elevation, motion, topAppBar).

No extra install is needed: \`@material/material-color-utilities\` is bundled inside \`@rootnative/core\`, behind the \`create-theme\` subpath. Projects that never import the subpath never load it.

The subpath also imports nothing from \`react-native\`, so it runs in plain Node — print a palette from a script, check a theme in CI, or feed the roles to a design-token pipeline:

\`\`\`bash
node -e "import('@rootnative/core/create-theme').then(({ createMaterialTheme }) => console.log(createMaterialTheme('#006A6A').lightTheme.colors))"
\`\`\`

### applyRoundness(roundness)

Scales the MD3 corner radius tokens by a multiplier. Returns a complete \`Shape\` object. \`cornerNone\` (0) and \`cornerFull\` (999) are never affected.

- \`roundness: 0\` — sharp corners (all intermediate tokens become 0)
- \`roundness: 1\` — default MD3 values
- \`roundness: 2\` — double the rounding

\`\`\`tsx
import { applyRoundness, lightTheme } from '@rootnative/core'

// Use with spread to override shape on an existing theme
const sharpTheme = { ...lightTheme, shape: applyRoundness(0) }

// Or with defineTheme
import { defineTheme } from '@rootnative/core'
const theme = defineTheme({ ...lightTheme, shape: applyRoundness(0.5) })
\`\`\`

### material preset

Grouped object containing all Material Design 3 theme values.

\`\`\`tsx
import { material } from '@rootnative/core'

material.lightTheme  // MD3 light theme
material.darkTheme   // MD3 dark theme
material.defaultTopAppBarTokens
\`\`\`

### Theme type hierarchy

- \`BaseTheme\` — Generic base interface. All design systems extend this. Has \`colors: Record<string, string>\`, \`typography: Record<string, TypographyToken>\`, plus shape, spacing, stateLayer, elevation, motion.
- \`Theme\` — Material Design 3 theme. Extends \`BaseTheme\` with 49 MD3 color roles, 30 typography variants (15 base + 15 emphasized), and optional \`topAppBar\` tokens. \`MaterialTheme\` is an identical alias (same type) — use it to disambiguate in multi-design-system codebases.

### Theme structure

\`\`\`
BaseTheme {
  colors: Record<string, string>
  typography: Record<string, TypographyToken>
  shape: Shape           — roundness, cornerNone, cornerExtraSmall, cornerSmall, cornerMedium, cornerLarge, cornerExtraLarge, cornerFull
  spacing: Spacing       — xs, sm, md, lg, xl
  elevation: Elevation   — level0..level5 (shadow properties)
  stateLayer: StateLayer — pressedOpacity, focusedOpacity, hoveredOpacity, draggedOpacity, disabledOpacity, disabledContainerOpacity
  motion: Motion         — duration, easing, and MD3 Expressive spring tokens (springFastSpatial, springDefaultSpatial, springSlowSpatial, springFastEffects, springDefaultEffects, springSlowEffects — each { tension, friction, mass })
}

Theme extends BaseTheme {
  colors: Colors         — 49 MD3 color roles
  typography: Typography — 30 type scale variants: 15 base (displayLarge..labelSmall) + 15 MD3 Expressive emphasized (displayLargeEmphasized..labelSmallEmphasized)
  topAppBar?: TopAppBarTokens
}
\`\`\`

Colors: primary, onPrimary, primaryContainer, onPrimaryContainer, primaryFixed, onPrimaryFixed, primaryFixedDim, onPrimaryFixedVariant, secondary (same pattern), tertiary (same pattern), error, onError, errorContainer, onErrorContainer, background, onBackground, surface, surfaceDim, surfaceBright, surfaceContainerLowest, surfaceContainerLow, surfaceContainer, surfaceContainerHigh, surfaceContainerHighest, onSurface, surfaceVariant, onSurfaceVariant, outline, outlineVariant, surfaceTint, shadow, scrim, inverseSurface, inverseOnSurface, inversePrimary

Typography variants: displayLarge, displayMedium, displaySmall, headlineLarge, headlineMedium, headlineSmall, titleLarge, titleMedium, titleSmall, bodyLarge, bodyMedium, bodySmall, labelLarge, labelMedium, labelSmall — each with fontFamily, fontSize, fontWeight, lineHeight, letterSpacing. Each also has an MD3 Expressive \`<name>Emphasized\` variant (same size/line height, weight one step heavier: 400→500, 500→700).

### useBreakpoint()

Returns the current MD3 window size class. Reactively updates on resize.

\`\`\`tsx
import { useBreakpoint } from '@rootnative/core'

const bp = useBreakpoint()
// 'compact' (0-599) | 'medium' (600-839) | 'expanded' (840-1199) | 'large' (1200-1599) | 'extraLarge' (1600+)
\`\`\`

### useBreakpointValue(values)

Returns a value based on the current breakpoint with cascade fallback.

\`\`\`tsx
import { useBreakpointValue } from '@rootnative/core'

const columns = useBreakpointValue({ compact: 1, medium: 2, expanded: 4 })
// compact → 1, medium → 2, expanded/large/extraLarge → 4
\`\`\`

Type: \`useBreakpointValue<T>(values: Partial<Record<Breakpoint, T>> & Record<'compact', T>): T\`

### useWindowDimensions()

Returns the window size, the same as \`useWindowDimensions\` from \`react-native\`, but hydration-safe. Use it instead of the \`react-native\` hook when a layout needs a number rather than a size class: a hero height, a carousel slot, a column count.

\`\`\`tsx
import { useWindowDimensions } from '@rootnative/core'

const { width } = useWindowDimensions()
const heroHeight = width * 0.56
\`\`\`

Type: \`useWindowDimensions(): ScaledSize\`

### Breakpoints and static export (web)

The three hooks are hydration-safe, so **no \`useHydrated\` gate is needed at the call site**. The \`useWindowDimensions\` hook from \`react-native\` is **not**: on a static export it keeps the layout of a 0 wide window until the reader resizes the window.

A static export (\`web.output: 'static'\`) renders on a server with no DOM, where react-native-web's \`Dimensions\` is fixed at \`width: 0\` — so every breakpoint resolves to \`compact\` and that is what ships in the HTML. React 19 does **not** repair a \`className\`/\`style\` mismatch during hydration: it adopts the server DOM, keeps it, and fires no recoverable error, so a tablet would silently keep the phone layout.

\`useWindowDimensions\` therefore reports the server's 0 by 0 window for as long as the client is hydrating, matching that markup, and switches to the measured window on the re-render React schedules once hydration finishes. \`useBreakpoint\` reads it, so it reports \`compact\` for the same span, and a breakpoint and a raw width cannot disagree. On native and on a single-page web build there is no hydration, so the measured value is returned from the first render at no cost.

The practical consequence: a breakpoint-dependent layout **starts compact and widens a frame later** on a static export. That is unavoidable — the server cannot know the viewport — so design the compact variant to be the honest first paint. \`Grid\` inherits all of this, which matters because it resolves a \`columns\` map internally and leaves a consumer nowhere to put a gate of their own.

\`ThemeProvider\` reads the same hydration flag for \`mode="system"\`. The export server has no \`matchMedia\`, so react-native-web reports \`'light'\` there and the HTML ships the light theme. The provider keeps light while the client hydrates, then switches to the OS scheme on the same re-render as the window size. A reader with a dark system setting sees one light frame first. The \`useColorScheme\` hook from \`react-native\` is **not** hydration-safe: a theme chosen from it stays light in a dark browser.
`
}

// ============================================================
// Content: CLI (static)
// ============================================================

function cliContent(): string {
  return `### Which command

| You want | Run |
| --- | --- |
| A new project from scratch | \`rootnative create\` |
| The copy-paste workflow in an existing project | \`rootnative init\` |
| Copy a component (and its dependencies) into the project | \`rootnative add <component>\` |
| Refresh installed component files from the pinned registry | \`rootnative update\` |
| Move to a new release — bump \`@rootnative/core\` and the registry pin | \`rootnative upgrade\` |
| See what is available and what is installed | \`rootnative list\` |
| Diagnose a broken setup | \`rootnative doctor\` |

### Commands

#### \`rootnative create [name]\`

Create a new project with RootNative UI pre-configured. Fetches the quickstart template, applies your project name to \`package.json\` and \`app.json\`, and optionally installs dependencies.

\`\`\`bash
npx rootnative create            # Interactive
npx rootnative create my-app     # With name
npx rootnative create .          # Into the current directory, named after it
npx rootnative create my-app -y  # Non-interactive, accept defaults
\`\`\`

Pass \`.\` to scaffold into the directory you are already in. The project name comes from that directory's name, and the directory is never deleted — the CLI lists any file the template would overwrite and asks first (with \`-y\` it stops and changes nothing). A named project goes into a new subdirectory, and the CLI asks before it deletes an existing one.

Options:
- \`-y, --yes\` — Skip prompts and use defaults
- \`-t, --template <name>\` — Template to use (\`blank\`, \`with-router\`)
- \`--package-manager <pm>\` — Package manager to use (\`npm\`, \`yarn\`, \`pnpm\`, \`bun\`)

#### \`rootnative init\`

Copy-paste workflow — copies component source files into your project. The theme system (\`@rootnative/core\`) stays as an npm dependency.

Initialize project. Detects project type (Expo/RN), package manager, and tsconfig path aliases.

\`\`\`bash
npx rootnative init            # Interactive
npx rootnative init -y         # Non-interactive, accept defaults
npx rootnative init -y --components-alias "~/ui" --lib-alias "~/utils"
\`\`\`

Options:
- \`-y, --yes\` — Skip all prompts, use detected defaults. Overwrites existing config. Auto-installs \`@rootnative/core\`.
- \`--components-alias <alias>\` — Components install path. Default: \`@/components/ui\` (or \`~/components/ui\` if \`~/*\` alias detected in tsconfig)
- \`--lib-alias <alias>\` — Utility files path. Default: \`@/lib\` (or \`~/lib\` if \`~/*\` alias detected)
- \`--package-manager <pm>\` — Package manager to use (\`npm\`, \`yarn\`, \`pnpm\`, \`bun\`)

Creates \`rootnative.json\`:
\`\`\`json
{
  "$schema": "https://rootnative.github.io/ui/schema.json",
  "aliases": { "components": "@/components/ui", "lib": "@/lib" },
  "registryUrl": "https://raw.githubusercontent.com/rootnative/ui",
  "registryVersion": "v${COMPONENTS_VERSION}"
}
\`\`\`

\`init\` pins \`registryVersion\` to the \`v<version>\` git tag of the latest published release, so a project keeps fetching the same component sources until you run \`rootnative upgrade\` (which moves the pin forward). It falls back to \`main\` only when npm is unreachable or the tag has not been pushed yet.

#### \`rootnative add <components...>\`

Add components to your project. Resolves dependency graph, copies files with rewritten imports, installs npm deps.

\`\`\`bash
npx rootnative add button
npx rootnative add card chip text-field
npx rootnative add appbar      # auto-adds button + icon-button + typography
\`\`\`

Options:
- \`-f, --force\` — Overwrite existing components
- \`-d, --dry-run\` — Preview without writing files
- \`--package-manager <pm>\` — Package manager to use (\`npm\`, \`yarn\`, \`pnpm\`, \`bun\`)

#### \`rootnative update [components...]\`

Update installed components to latest registry version.

Options:
- \`-a, --all\` — Update all installed components
- \`-d, --dry-run\` — Show diff without applying

#### \`rootnative upgrade\`

Upgrade \`@rootnative/core\` to the latest published version and install any new peer dependencies.

\`\`\`bash
npx rootnative upgrade         # Interactive — shows plan and prompts before installing
npx rootnative upgrade -y      # Non-interactive — skip confirmation
\`\`\`

Options:
- \`-y, --yes\` — Skip confirmation prompt
- \`-a, --all\` — Also update the installed component files, not just the package
- \`--package-manager <pm>\` — Package manager to use (\`npm\`, \`yarn\`, \`pnpm\`, \`bun\`)

What it does:
1. Reads the installed \`@rootnative/core\` version from \`node_modules\`
2. Fetches the latest version from the npm registry
3. Compares peer dependencies between the installed and latest versions
4. Shows a plan: version bump, new required peer deps, changed version ranges, removed deps
5. Upgrades \`@rootnative/core\` and installs any new required peer dependencies in one step
6. Reports optional peer deps that aren't installed (does not auto-install optional deps)
7. Lists peer deps that are no longer required so you can remove them manually
8. Moves \`registryVersion\` forward to the new release tag, so later \`add\`/\`update\` calls fetch matching sources
9. With \`-a, --all\`, also updates the installed component files

#### \`rootnative list\`

Show available components with install status.

#### \`rootnative doctor\`

Check project health: config validity, core installation, RN version, file integrity, peer deps.
`
}

// ============================================================
// Content: Utils (static — package is private, not published)
// ============================================================

function utilsContent(): string {
  return `## @rootnative/utils

Shared utilities used by \`@rootnative/components\` and available for custom component development.

> **Not published to npm.** \`@rootnative/utils\` is a private workspace package —
> \`npm install @rootnative/utils\` will 404. Do not add it to a project's
> dependencies. These helpers reach user projects only as source files copied by
> the CLI (\`rootnative add\`) into the configured \`lib/\` directory, where they are
> imported from that local path (e.g. \`@/lib/rootnative-utils\`) rather than from
> the package name. The import below shows the API as it exists inside this repo.

\`\`\`tsx
import { alphaColor, blendColor, elevationStyle, renderIcon, transformOrigin, selectRTL } from '@rootnative/utils'
\`\`\`

### Color helpers

- \`alphaColor(color: string, alpha: number): string\` — Converts hex color to \`rgba(...)\` with the given alpha (clamped 0–1). Returns the input unchanged if parsing fails.
- \`blendColor(base: string, overlay: string, overlayAlpha: number): string\` — Blends two hex colors by mixing RGB channels at the given overlay opacity. Returns \`rgb(...)\`.

### Elevation

- \`elevationStyle(level: ElevationLevel): ViewStyle\` — Converts an MD3 elevation level into platform-appropriate shadow styles. Uses \`boxShadow\` on web, \`shadow*\` + \`elevation\` on native.

> **Gotcha:** the return shape differs by platform. Both are typed as \`ViewStyle\`, but spreading the result and overriding individual \`shadow*\` props silently no-ops on web — the shadow is baked into the \`boxShadow\` string. To customize, modify the \`ElevationLevel\` before calling, or branch on \`Platform.OS\`.

### RTL support

- \`transformOrigin(vertical?: 'top' | 'center' | 'bottom'): string\` — Returns \`"left top"\` or \`"right top"\` based on RTL layout direction. Used for label animations.
- \`selectRTL<T>(ltr: T, rtl: T): T\` — Picks a value based on layout direction.

### Icon rendering

- \`renderIcon(source: IconSource | null | undefined, props: IconRenderProps, resolver: IconResolver | null | undefined): ReactNode\` — Renders any \`IconSource\`. A string name goes to the resolver; without one it renders \`null\` and logs one warning per process. An element is returned as is; a function is called with \`props\`. Place the result under an \`aria-hidden\` node.

### Test helper (subpath export)

\`\`\`tsx
import { renderWithTheme } from '@rootnative/utils/test'
\`\`\`

- \`renderWithTheme(ui: ReactElement, options?: RenderOptions)\` — Wraps \`@testing-library/react-native\`'s \`render\` with \`ThemeProvider\`.
`
}

// ============================================================
// Content: Icons & Code Style (static footers)
// ============================================================

function iconsContent(): string {
  return `## Icons

Every icon prop accepts an \`IconSource\` (\`import type { IconSource } from '@rootnative/core'\`) — one of three forms:

1. **String name** — resolved through the theme's \`iconResolver\`. Pass \`mdiResolver\` from \`@rootnative/components/mdi\` for \`MaterialDesignIcons\` (browse names at https://pictogrammers.com/library/mdi/), or another resolver. Without a resolver a string name renders nothing and logs one warning.
2. **ReactElement** — a pre-rendered icon (\`leadingIcon={<Check size={18} color="#fff" />}\`). The component does not override size/color.
3. **Render function** — \`(props: { size: number; color?: string }) => ReactNode\`. Receives the component's resolved icon size and color, so the icon stays consistent with theme/variant state.

Per-call elements/functions always take precedence over the resolver. Only \`@rootnative/components/mdi\` imports \`@react-native-vector-icons/material-design-icons\`; the root entry and every other subpath do not. An app with its own resolver never installs the package, and a bundler without Expo needs no alias (docs page: Web without Expo).

### When to pick which

| Situation | Reach for |
| --- | --- |
| MaterialDesignIcons names (\`@react-native-vector-icons/material-design-icons\`) | \`mdiResolver\` from \`@rootnative/components/mdi\` |
| Lucide icons | \`createLucideResolver\` |
| Phosphor icons | \`createPhosphorResolver\` |
| Any other \`@react-native-vector-icons/*\` set (Ionicons, FontAwesome, …), or the MDI \`/static\` export | \`createVectorIconsResolver\` |
| Your own SVGs, SF Symbols, or a one-off mapping | A manual \`IconResolver\` function — no adapter package needed |
| A custom resolver, but existing call sites still use MDI names | \`withLegacyMdiFallback(resolver)\` |

### \`@rootnative/icons\` adapter package (v${ICONS_VERSION})

Pre-built resolver factories for the most common React Native icon libraries. Install only the icon library you actually use — Lucide / Phosphor / \`@react-native-vector-icons/*\` are declared as optional peer deps.

\`\`\`bash
pnpm add @rootnative/icons
\`\`\`

| Helper | For |
|--------|-----|
| \`createLucideResolver({ icons })\` | [Lucide](https://lucide.dev) (\`lucide-react-native\`) |
| \`createPhosphorResolver({ icons })\` | [Phosphor](https://phosphoricons.com) (\`phosphor-react-native\`) |
| \`createVectorIconsResolver({ IconSet })\` | Any \`@react-native-vector-icons/*\` set (\`Ionicons\`, \`FontAwesome7\`, …), or an \`@expo/vector-icons\` set |
| \`withLegacyMdiFallback(resolver)\` | Wrap any custom resolver to add MDI-name compatibility |

#### Lucide

\`\`\`tsx
import { ThemeProvider } from '@rootnative/core'
import { createLucideResolver } from '@rootnative/icons'
import { Check, Search, ArrowRight } from 'lucide-react-native'

const resolver = createLucideResolver({
  icons: { check: Check, search: Search, 'arrow-right': ArrowRight },
  mdiCompat: true,        // accept legacy MDI names like "magnify"
  strokeWidth: 1.75,      // optional — Lucide default is 2
})

<ThemeProvider iconResolver={resolver}>{children}</ThemeProvider>
\`\`\`

#### Phosphor

\`\`\`tsx
import { ThemeProvider } from '@rootnative/core'
import { createPhosphorResolver } from '@rootnative/icons'
import { Check, MagnifyingGlass } from 'phosphor-react-native'

const resolver = createPhosphorResolver({
  icons: { Check, MagnifyingGlass },
  weight: 'regular',     // 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'
  mdiCompat: true,
})
\`\`\`

#### \`@react-native-vector-icons/*\`

\`\`\`tsx
import { Ionicons } from '@react-native-vector-icons/ionicons'
import { createVectorIconsResolver } from '@rootnative/icons'

const resolver = createVectorIconsResolver({
  IconSet: Ionicons,
  aliases: { check: 'checkmark', close: 'close', 'arrow-right': 'arrow-forward' },
})
\`\`\`

#### Custom resolver + MDI compatibility

\`withLegacyMdiFallback\` wraps any \`IconResolver\` so that legacy MaterialDesignIcons names (\`magnify\`, \`pencil\`, \`dots-vertical\`, …) are rewritten to the wrapped resolver's vocabulary. The base resolver is always tried first; the alias map is consulted only when the base returns \`null\`.

\`\`\`tsx
import { withLegacyMdiFallback } from '@rootnative/icons'
import type { IconResolver } from '@rootnative/core'

const baseResolver: IconResolver = (name, { size, color }) => {
  const Svg = mySvgIcons[name]
  return Svg ? <Svg width={size} height={size} fill={color} /> : null
}

// target: 'lucide' | 'phosphor' | Record<string, string>
const resolver = withLegacyMdiFallback(baseResolver, { target: 'lucide' })
\`\`\`

The first call with each legacy name emits a one-time \`console.warn\` so you know which call sites still need migrating. Pass \`warn: false\` to suppress.

#### Adapter options reference

All three name-mapped adapters (Lucide / Phosphor) accept:

- \`icons: Record<string, IconComponent>\` — required. Names you'll pass to component props.
- \`mdiCompat?: boolean | Record<string, string | null>\` — \`true\` enables the built-in MDI alias map; an object merges/overrides entries (\`null\` to suppress).
- \`onMissing?: 'warn' | 'silent' | IconResolver\` — what to do when a name isn't registered. Defaults to \`'warn'\` (one-time \`console.warn\` per missing name). Pass another resolver to delegate.

Lucide-specific: \`strokeWidth?: number\`. Phosphor-specific: \`weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone'\`.

#### Manual resolver (no adapter package)

You don't need \`@rootnative/icons\` at all — \`iconResolver\` accepts any \`(name, { size, color }) => ReactNode\` function:

\`\`\`tsx
import { ThemeProvider } from '@rootnative/core'
import type { IconResolver } from '@rootnative/core'
import { Check, Heart } from 'lucide-react-native'

const icons = { check: Check, heart: Heart }

const lucide: IconResolver = (name, { size, color }) => {
  const Icon = icons[name as keyof typeof icons]
  return Icon ? <Icon size={size} color={color} /> : null
}

<ThemeProvider iconResolver={lucide}>{/* string icon names route to Lucide */}</ThemeProvider>
\`\`\`

Reach for the adapter package when you want \`mdiCompat\`, \`onMissing\` warning behavior, or a typed options surface; reach for the manual form for one-offs and SF Symbols / SVG sprite sheets.
`
}

function codeStyleContent(): string {
  return `## Code style

- No semicolons, single quotes, trailing commas
- TypeScript strict mode
- Subpath imports preferred: \`@rootnative/components/button\` over \`@rootnative/components\`
`
}

// ============================================================
// File Generators
// ============================================================

function generateCoreLlms(): string {
  return `# @rootnative/core — Theme System for React Native

> Version: ${CORE_VERSION}
> Peer deps: react ${CORE_REACT}, react-native ${CORE_RN}, @rootnative/inertia ${CORE_INERTIA_PEER} (required — every animation runs on it)
> createMaterialTheme needs no extra install — its color engine (@material/material-color-utilities) is bundled behind the create-theme subpath

## Quick Start

\`\`\`tsx
import { ThemeProvider } from '@rootnative/core'

export default function App() {
  return (
    <ThemeProvider>
      {/* Your app */}
    </ThemeProvider>
  )
}
\`\`\`

## API

${coreContent()}
`
}

function generateComponentsLlms(): string {
  return `# @rootnative/components — MD3 UI Components for React Native

> Version: ${COMPONENTS_VERSION}
> Peer deps: @rootnative/core >=${CORE_VERSION}, @rootnative/inertia ${COMPONENTS_INERTIA_PEER} (required — every animation runs on it), react ${COMPONENTS_REACT}, react-native ${COMPONENTS_RN}, react-native-safe-area-context ${COMPONENTS_SAFE_AREA}, react-native-reanimated ${COMPONENTS_REANIMATED}, react-native-worklets ${COMPONENTS_WORKLETS} (Expo SDK ${EXPO_SDK} configures its Babel plugin automatically; on bare React Native add react-native-worklets/plugin last in babel.config.js)
> Optional peer: @react-native-vector-icons/material-design-icons ${COMPONENTS_VECTOR_ICONS} (plus expo-font on Expo), imported only by the @rootnative/components/mdi subpath (mdiResolver, the MaterialDesignIcons resolver for string icon names). An app with its own iconResolver does not install it

## App root setup

${appRootContent()}

## Jest setup

${jestSetupContent()}

## The animation layer lives in a separate package

Every animation runs on \`@rootnative/inertia\`, which ships its own reference at
\`node_modules/@rootnative/inertia/llms.txt\`. Read it when an example here uses a
symbol this file does not define — \`Motion.*\`, \`useScroll\`, \`Presence\`,
\`MotionConfig\` and the value-layer hooks are all documented there, not here.

\`Motion\` and the hooks are exported from the **package root**:

\`\`\`tsx
import { Motion, useScroll } from '@rootnative/inertia'
\`\`\`

inertia's subpaths (\`./view\`, \`./scroll-view\`, \`./flat-list\`, …) exist for
tree-shaking and export differently named symbols (\`MotionScrollView\`, not
\`Motion.ScrollView\`). There is no \`@rootnative/inertia/motion\`.

## Usage

${componentsContent()}

---

${iconsContent()}`
}

function generateCliLlms(): string {
  return `# @rootnative/cli — CLI for RootNative UI

> Version: ${CLI_VERSION}
> Binary: \`rootnative\`
> Requirements: Node ${CLI_NODE}

## CLI (\`rootnative\`)

${cliContent()}`
}

function generateIconsLlms(): string {
  return `# @rootnative/icons — Icon Library Adapters for RootNative UI

> Version: ${ICONS_VERSION}
> Peer deps: @rootnative/core >=${CORE_VERSION}, react ${ICONS_REACT}, react-native ${ICONS_RN}
> Optional peer deps: lucide-react-native, phosphor-react-native; createVectorIconsResolver takes any @react-native-vector-icons/* or @expo/vector-icons set you install

Pre-built resolver factories that plug into the theme's \`iconResolver\`. Install only the icon library you actually use — each is declared as an optional peer dep.

\`\`\`bash
pnpm add @rootnative/icons
\`\`\`

${iconsContent()}`
}

// ============================================================
// @rootnative/seo
// ============================================================

/**
 * The checklist in short form. The docs page `seo/checklist.md` carries the
 * long form; an agent that sets up a new app follows the same order.
 */
function seoChecklist(): string {
  return `## The checklist, in order

1. **Static output.** \`web.output: 'static'\` in app.json, and \`extra.router.sitemap: false\` so \`_sitemap.html\` is not exported. A dynamic route needs \`generateStaticParams\`.
2. **Links as \`Link\`.** \`Link\` from expo-router renders \`<a href>\`. A \`Pressable\` with \`router.push\` renders a \`<div>\`, and a \`Button\` with \`Linking.openURL\` renders a \`<button>\`; a crawler follows neither. Put a component inside \`<Link href asChild>\`. On the web \`Link\` opens an external URL in the same tab; for a new tab pass \`hrefAttrs={{ target: '_blank', rel: 'noopener' }}\` to the component, because under \`asChild\` \`Link\` gives \`target\` to the child as a plain prop, which react-native-web drops.
3. **The head on every page.** \`defineSite\` once, \`SeoProvider\` at the root, \`PageHead\` on each screen. A page with no \`url\` gets no canonical link and no share card, which is correct for a \`noindex\` overlay.
4. **Robots and sitemap.** \`writeSitemap\`, \`writeRobots\` and \`writeManifest\` from \`@rootnative/seo/node\`, in the deploy step after the export. Build the URL list from the exported HTML files. \`robots.txt\` is read at the origin root only.
5. **Headings and \`alt\`.** \`Typography\` takes \`level\` (1..6) and renders \`<h1>\`..\`<h6>\`; a display or headline variant with no \`level\` is a plain element on the web. \`Heading\` from \`/react\` does the same for an app without \`@rootnative/components\`. One \`<h1>\` per page: the \`AppBar\` title is level 1 by default (\`titleLevel\` changes it), so put app headings at level 2 and below. On \`expo-image\` set both \`alt\` and \`accessibilityLabel\`; \`imageLabel\` builds the text.
6. **JSON-LD.** The builders in \`@rootnative/seo/schema\`; pass the result in \`jsonLd\`. An empty field is never written.
7. **Bundle and preconnect.** \`shellTags\` in \`app/+html.tsx\` with a \`preconnect\` per origin the first paint needs.
8. **The small tags.** Theme colour, icons and the manifest, through \`shellTags\` and \`writeManifest\`.

Check the export before you deploy: read one page and assert the title, the canonical link, one \`<h1>\`, and one JSON-LD script. Lighthouse and Search Console on the live host are the only checks that count.`
}

function seoApiContent(): string {
  return `## \`@rootnative/seo\` — core (no dependency)

\`\`\`ts
import { defineSite, toHeadTags, clipDescription, isoDuration, serializeJsonLd, resolveUrl } from '@rootnative/seo'
import type { PageMeta, SiteConfig, Site, HeadTag, JsonLd, OpenGraphType } from '@rootnative/seo'
\`\`\`

- \`defineSite(config: SiteConfig): Site\` — fills the defaults. Throws on an empty \`name\` or a relative \`url\`. Strips a trailing slash from \`url\`.
  - \`SiteConfig\`: \`name\`, \`url\` (absolute origin + base path), \`locale?\`, \`titleTemplate?: (title) => string\` (default \`"<title> | <name>"\`, and the bare name when the title equals it), \`twitterSite?\` (\`@handle\`), \`descriptionLimit?\` (default 160).
- \`toHeadTags(site, meta: PageMeta): HeadTag[]\` — tag records, not elements. Any head renderer can write them.
  - \`PageMeta\`: \`title\`, \`description?\`, \`url?\` (absolute or relative to the site), \`image?: string | null\`, \`imageSize?: { width, height }\`, \`imageAlt?\`, \`type?: 'website' | 'article' | 'profile' | 'video.movie' | 'product'\`, \`locale?\`, \`noindex?\`, \`twitterCard?: 'summary' | 'summary_large_image'\`, \`jsonLd?: JsonLd[]\`.
  - \`HeadTag\`: \`{ tag: 'title', text }\` | \`{ tag: 'meta', name, content }\` | \`{ tag: 'meta', property, content }\` | \`{ tag: 'link', rel, href }\` | \`{ tag: 'script', type: 'application/ld+json', text }\`.
  - Rules: the tab title uses the template, \`og:title\` does not. No \`url\` → no canonical link and no og/twitter tags. \`og:image:width\`/\`height\` only with an image and an \`imageSize\`. Twitter card \`summary_large_image\` with an image, \`summary\` without, unless \`twitterCard\` forces one. \`noindex\` writes \`<meta name="robots" content="noindex">\`. Each tag is written once.
- \`clipDescription(text, limit = 160)\` — collapses whitespace, clips at a word boundary, adds one \`…\`.
- \`isoDuration(minutes)\` — \`150\` → \`'PT2H30M'\`. Returns \`null\` for \`0\`, a negative, or a non-finite number.
- \`serializeJsonLd(value)\` — \`JSON.stringify\` with every \`<\` as \`\\\\u003c\`, so \`</script>\` in a title cannot end the tag.
- \`resolveUrl(site, pathOrUrl)\` — joins a path under the site; an absolute URL passes through.

## \`@rootnative/seo/schema\` — JSON-LD builders (no dependency)

Each returns a \`JsonLd\` with \`@context: 'https://schema.org'\` and \`@type\` set. Every empty field (\`undefined\`, \`null\`, \`""\`, \`[]\`, \`{}\`) is removed at every depth.

- \`webSite({ name, url, searchUrlTemplate? })\` — adds a \`SearchAction\` with \`query-input: 'required name=search_term_string'\` when the template is set.
- \`breadcrumbList(trail: { name, url }[])\` — \`ListItem\`s with \`position\` from 1.
- \`organization({ name, url, logo?, sameAs? })\`
- \`article({ headline, url, image?, description?, datePublished?, dateModified?, author? })\` — \`author\` is a string or \`{ name, url? }\`, written as a \`Person\`. Sets \`mainEntityOfPage\` to \`url\`.
- \`product({ name, url, image?, description?, brand?, sku?, offers?, aggregateRating? })\` — \`brand\` becomes \`Brand\`; \`offers: { price, priceCurrency, availability?, url? }\` becomes \`Offer\` with \`availability\` as \`https://schema.org/<name>\`.
- \`movie({ name, url, image?, description?, datePublished?, genre?, durationMinutes?, actors?, director?, rating? })\` — \`duration\` through \`isoDuration\`; \`actors\` and \`director\` as \`Person\`.
- \`person({ name, url, image?, description?, birthDate?, deathDate?, birthPlace?, jobTitle?, sameAs? })\` — \`birthPlace\` as \`Place\`.
- \`event({ name, url, startDate, endDate?, location?, image?, description? })\` — \`location\` is a string or \`{ name, address? }\`, as \`Place\`.
- \`faqPage(questions: { question, answer }[])\` — \`Question\` + \`Answer\` under \`mainEntity\`.
- \`RatingInput\`: \`{ ratingValue, ratingCount?, reviewCount?, bestRating? (5), worstRating? (1) }\`. A rating with no count is left out.

## \`@rootnative/seo/react\` — peers: react \`${SEO_REACT}\`, react-native \`${SEO_RN}\`

- \`<SeoProvider site={site}>\` — gives every \`PageHead\` below it the site.
- \`useSite(site?)\` — the site for the tree. A \`site\` argument wins. Throws with no provider and no argument.
- \`<Heading level={1..6} as={Component}>\` — renders the given text component (default RN \`Text\`) with \`accessibilityRole="header"\` and \`aria-level\`. On the web react-native-web writes \`<h1>\`..\`<h6>\`. Generic: \`<Heading<TypographyProps> level={2} as={Typography} variant="titleMedium">\`. The wrapped component's own \`as\`, \`role\`, \`accessibilityRole\` and \`aria-level\` props are omitted.
- \`imageLabel(kind, subject?)\` — \`imageLabel('Poster', 'Dune')\` → \`'Dune poster'\`. Set the result as both \`alt\` and \`accessibilityLabel\` on \`expo-image\` (its web \`alt\` comes from \`accessibilityLabel\`).

## \`@rootnative/seo/expo-router\` — optional peer: expo-router \`${SEO_EXPO_ROUTER}\`

- \`<PageHead {...meta} site?>\` — \`PageMeta\` as props, plus an optional \`site\` that wins over the provider. Writes the tags through \`expo-router/head\`. Renders \`null\` on native.
- \`renderHeadTag(tag, index)\` — one \`HeadTag\` as the element \`expo-router/head\` expects. A JSON-LD script is written as a string child, not \`dangerouslySetInnerHTML\` (react-helmet-async drops the latter).
- \`shellTags(options): ReactElement[]\` — for \`app/+html.tsx\`: charset, viewport (default \`width=device-width, initial-scale=1, shrink-to-fit=no\`), \`themeColor\`, \`favicon\`, \`appleTouchIcon\`, \`manifest\`, \`preconnect: { href, crossOrigin? }[]\`. \`basePath\` (pass \`process.env.EXPO_BASE_URL\`) prefixes every relative \`href\`. No router dependency: works in a Vite template through \`renderToStaticMarkup\`.

## \`@rootnative/seo/node\` — Node only, no peer

Each \`write*\` creates \`outDir\`, writes the file and resolves to its path. Each has a pure sibling that returns the text.

- \`writeSitemap({ outDir, siteUrl, urls, fileName? })\` / \`sitemapXml({ siteUrl, urls })\` — \`urls: { loc, lastmod?, changefreq?, priority? }[]\`. A relative \`loc\` is joined under \`siteUrl\`. Every value is XML-escaped. \`priority\` is clamped to 0..1.
- \`writeRobots({ outDir, sitemapUrl, disallow?, allow?, userAgent?, fileName? })\` / \`robotsTxt(...)\` — \`sitemapUrl\` is one URL or a list. With no \`disallow\` the file allows everything. The file carries a comment that says why an overlay route is not disallowed: a crawler reads \`noindex\` only on a page it may fetch.
- \`writeManifest({ outDir, name, shortName?, description?, startUrl? ('./'), scope? ('./'), display? ('standalone'), themeColor?, backgroundColor?, lang?, icons?, fileName? })\` / \`manifestJson(...)\` — relative paths, so it works under a subpath host. The icon \`type\` is inferred from the file extension.`
}

function seoContent(): string {
  return `## SEO for the web export (\`@rootnative/seo\` v${SEO_VERSION})

A React Native web export starts as one empty page. \`@rootnative/seo\` holds the parts of the fix that do not depend on the app's data: the head of a page as tag records, the JSON-LD builders, the heading role, the HTML shell, the sitemap, the robots file and the manifest. The app keeps the mapping from its data to the meta. Docs: https://rootnative.github.io/ui/seo/why

\`\`\`bash
pnpm add @rootnative/seo
\`\`\`

${seoChecklist()}

${seoApiContent()}`
}

function generateSeoLlms(): string {
  return `# @rootnative/seo — SEO for a React Native web export

> Version: ${SEO_VERSION}
> Peer deps (/react and /expo-router only): react ${SEO_REACT}, react-native ${SEO_RN}
> Optional peer dep (/expo-router only): expo-router ${SEO_EXPO_ROUTER}
> The core and /schema entries have no dependency; /node runs in Node only.

What a search engine and a link preview read from a React Native web app: the document head, the structured data, the heading outline, the image text, the HTML shell, the sitemap, and the robots file. Docs: https://rootnative.github.io/ui/seo/why

\`\`\`bash
pnpm add @rootnative/seo
\`\`\`

${seoChecklist()}

${seoApiContent()}
`
}

/** The docs API page is generated from the same source as llms.txt, so the two cannot drift. */
function generateSeoApiDoc(): string {
  return `---
sidebar_position: 3
sidebar_label: API reference
description: The API of @rootnative/seo — the core, the schema builders, the React and Expo Router entries, and the Node functions.
---

{/* Generated by scripts/build-llms.ts. Edit seoApiContent() there, then run pnpm run build:llms. */}

# API reference

The package has five entries. The core and \`/schema\` have no dependency and run in Node and in a browser. \`/react\` and \`/expo-router\` need React Native. \`/node\` runs in Node only.

${seoApiContent()}
`
}

function generateFullLlms(): string {
  return `# RootNative UI — Full API Reference

> Design-system agnostic component library for React Native — ships with Material Design 3
> Versions: \`@rootnative/core\` ${CORE_VERSION} · \`@rootnative/components\` ${COMPONENTS_VERSION} · \`@rootnative/icons\` ${ICONS_VERSION} · \`@rootnative/seo\` ${SEO_VERSION} · \`@rootnative/cli\` ${CLI_VERSION}
> Requirements: react-native ${COMPONENTS_RN}, react ${COMPONENTS_REACT}, Expo SDK ${EXPO_SDK}
> Platforms: iOS, Android, and web through \`react-native-web\` (web also needs \`react-dom\`). Web without Expo (Vite, webpack, Electron) needs the config in the "Web without Expo" section below. Electron, macOS, Windows, and other React Native hosts are not tested.
> Peer deps: \`react-native-safe-area-context ${COMPONENTS_SAFE_AREA}\`, \`react-native-reanimated ${COMPONENTS_REANIMATED}\`, \`react-native-worklets ${COMPONENTS_WORKLETS}\` (Reanimated 4 runtime — Expo SDK ${EXPO_SDK} configures its Babel plugin automatically; on bare React Native add \`react-native-worklets/plugin\` last in \`babel.config.js\`)
> Optional peer: \`@react-native-vector-icons/material-design-icons ${COMPONENTS_VECTOR_ICONS}\` (plus \`expo-font\` on Expo), imported only by the \`@rootnative/components/mdi\` subpath (\`mdiResolver\`, the MaterialDesignIcons resolver for string icon names). An app with its own \`iconResolver\` does not install it

---

## Quick Start (new project)

\`\`\`bash
npx rootnative create my-app
cd my-app
npx expo start
\`\`\`

The \`create\` command scaffolds a ready-to-run Expo project with \`ThemeProvider\`, example components (Box, Column, Typography, Card), and all dependencies pre-configured. Two templates: \`blank\` (the default) and \`with-router\`, which adds Expo Router.

Interactive prompts: template, project name, display name (shown on home screen), package manager (npm/yarn/pnpm/bun), install dependencies.

Options:
- \`-y, --yes\` — Skip the optional prompts (template: \`blank\`, pm: \`npm\`, auto-install). The project name is still prompted for unless you pass it as an argument.

Pass name directly: \`npx rootnative create my-app\`

## Installation (existing project)

\`\`\`bash
pnpm add @rootnative/core @rootnative/components @react-native-vector-icons/material-design-icons expo-font react-native-safe-area-context react-native-reanimated react-native-worklets
\`\`\`

Reanimated 4 runs on \`react-native-worklets\` (installed above). Expo SDK ${EXPO_SDK} bundles its Babel plugin — nothing to configure. On bare React Native, add \`'react-native-worklets/plugin'\` last in \`babel.config.js\` plugins.

---

## App root setup

${appRootContent()}

---

## Jest setup

${jestSetupContent()}

---

## Web without Expo

${webWithoutExpoContent()}

---

## CLI (\`rootnative\`)

${cliContent()}
---

${utilsContent()}
---

## @rootnative/core

${coreContent()}
---

## @rootnative/components

${componentsContent()}

---

${iconsContent()}
---

${seoContent()}

---

${codeStyleContent()}`
}

// ============================================================
// Main
// ============================================================

console.log('Building LLM documentation...\n')

const outputs = [
  { file: 'packages/core/llms.txt', content: generateCoreLlms() },
  { file: 'packages/components/llms.txt', content: generateComponentsLlms() },
  { file: 'packages/cli/llms.txt', content: generateCliLlms() },
  { file: 'packages/icons/llms.txt', content: generateIconsLlms() },
  { file: 'packages/seo/llms.txt', content: generateSeoLlms() },
  { file: 'docs/docs/seo/api.md', content: generateSeoApiDoc() },
  { file: 'docs/static/llms-full.txt', content: generateFullLlms() },
]

for (const { file, content } of outputs) {
  const fullPath = path.join(ROOT, file)
  fs.mkdirSync(path.dirname(fullPath), { recursive: true })
  fs.writeFileSync(fullPath, content)
  console.log(`  Wrote ${file}`)
}

console.log(
  `\nLLM documentation build complete. ${outputs.length} files generated.`,
)
