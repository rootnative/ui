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
    .replace(
      /ComponentProps<typeof MaterialCommunityIcons>\['name'\]/g,
      'string',
    )
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
        i++
      }

      result.typeAliases.push({ name, comment: jsDoc.comment, type: typeValue })
      continue
    }

    // --- Interface ---
    if (line.startsWith('export interface ')) {
      const jsDoc = collectJsDoc()

      // Collect full declaration up to opening brace
      let declText = ''
      while (i < lines.length && !lines[i].includes('{')) {
        declText += lines[i] + ' '
        i++
      }
      declText += lines[i]

      const nameMatch = declText.match(/export interface (\w+)/)
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

        // Property signature
        const propMatch = memberLine.match(/^(\w+)(\?)?:\s*(.+)$/)
        if (propMatch) {
          members.push({
            name: propMatch[1],
            optional: !!propMatch[2],
            type: simplifyType(propMatch[3]),
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

function resolveTypeAlias(type: string, aliases: TypeAliasInfo[]): string {
  const alias = aliases.find((a) => a.name === type)
  return alias ? alias.type : type
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
  'fab',
  'appbar',
  'card',
  'chip',
  'checkbox',
  'radio',
  'switch',
  'text-field',
  'layout',
  'list',
  'keyboard-avoiding-wrapper',
  'avatar',
  'slider',
  'progress',
]

const COMPONENT_NAMES: Record<string, string> = {
  typography: 'Typography',
  button: 'Button',
  'button-group': 'ButtonGroup',
  'icon-button': 'IconButton',
  fab: 'FAB',
  appbar: 'AppBar',
  card: 'Card',
  chip: 'Chip',
  checkbox: 'Checkbox',
  radio: 'Radio',
  switch: 'Switch',
  'text-field': 'TextField',
  layout: 'Layout Components',
  list: 'List',
  'keyboard-avoiding-wrapper': 'KeyboardAvoidingWrapper',
  avatar: 'Avatar',
  slider: 'Slider',
  progress: 'Progress',
}

const COMPONENT_EXAMPLES: Record<string, string> = {
  typography: `\`\`\`tsx
import { Typography } from '@rootnative/components/typography'

<Typography variant="headlineMedium" color="#333">Hello</Typography>
\`\`\``,

  button: `\`\`\`tsx
import { Button } from '@rootnative/components/button'

<Button variant="filled" leadingIcon="plus" onPress={handlePress}>Create</Button>
<Button variant="outlined">Cancel</Button>
<Button variant="tonal" containerColor="#E8DEF8" contentColor="#1D192B">Custom</Button>
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
<AppBar title="Settings" variant="center-aligned" actions={[
  { icon: 'magnify', accessibilityLabel: 'Search', onPress: onSearch },
  { icon: 'dots-vertical', accessibilityLabel: 'More', onPress: onMore },
]} />
\`\`\``,

  card: `\`\`\`tsx
import { Card } from '@rootnative/components/card'

<Card variant="elevated">{children}</Card>
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

  avatar: `\`\`\`tsx
import { Avatar } from '@rootnative/components/avatar'

<Avatar imageUri="https://example.com/photo.jpg" size="large" />
<Avatar icon="account" size="medium" containerColor="#E8DEF8" />
<Avatar label="JD" size="small" />
<Avatar icon="plus" onPress={handleAdd} accessibilityLabel="Add user" />
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
<LinearProgress progress={value} thickness={8} containerColor="#2E7D32" trackColor="#C8E6C9" />
<CircularProgress progress={value} size={56} thickness={5} />
\`\`\``,
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
        desc: 'Vertical flex container (extends Box).',
        example: `\`\`\`tsx
import { Column } from '@rootnative/components/layout'

<Column gap="md">{children}</Column>
\`\`\``,
        ifaceName: 'ColumnProps',
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

    const dividerIface = interfaces.find((i) => i.name === 'ListDividerProps')
    if (dividerIface) {
      output += formatSubInterface(
        dividerIface,
        typeAliases,
        '#### ListDivider',
      )
    }

    return output
  }

  // --- AppBar: main props + AppBarAction ---
  if (dirName === 'appbar') {
    let output = `### ${displayName}\n\n${example}\n\n`

    const propsIface = interfaces.find((i) => i.name === 'AppBarProps')
    if (propsIface) {
      output += formatPropsSection(propsIface, typeAliases)
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

  // --- Chip: discriminated union, one sub-section per variant ---
  if (dirName === 'chip') {
    let output = `### ${displayName}\n\n${example}\n\n`
    output +=
      '`ChipProps` is a discriminated union on `variant`. Each variant exposes only its valid props — `selected` is filter-only, `elevated` is unavailable on `input`, and on `input` `avatar` and `leadingIcon` are mutually exclusive at the type level.\n\n'

    output += 'Common props (every variant):\n'
    output += '- `children: string` — Text label rendered inside the chip.\n'
    output +=
      '- `iconSize?: number` — Default: `18`. Size of the leading icon in dp.\n'
    output +=
      '- `containerColor?: string` — Override the container (background) color. State-layer colors auto-derived.\n'
    output +=
      '- `contentColor?: string` — Override the content (label and icon) color. State-layer colors auto-derived when no `containerColor` is set.\n'
    output +=
      '- `labelStyle?: StyleProp<TextStyle>` — Additional style applied to the label text.\n'
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
// Content: Core API (static templates)
// ============================================================

function coreContent(): string {
  return `### ThemeProvider

Wrap your app root to supply the theme to all components. Works with any design system — Material Design 3 or custom themes. Defaults to the MD3 light theme when no theme is provided.

\`\`\`tsx
import { ThemeProvider, darkTheme } from '@rootnative/core'

// Light theme (default)
<ThemeProvider>{children}</ThemeProvider>

// Dark theme
<ThemeProvider theme={darkTheme}>{children}</ThemeProvider>

// Custom theme
import { lightTheme } from '@rootnative/core'
import type { Theme } from '@rootnative/core'

const custom: Theme = {
  ...lightTheme,
  colors: { ...lightTheme.colors, primary: '#006A6A', onPrimary: '#FFFFFF' },
}
<ThemeProvider theme={custom}>{children}</ThemeProvider>
\`\`\`

Props:
- \`theme?: BaseTheme\` — Theme object. Default: \`lightTheme\` (MD3)
- \`children: ReactNode\`

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
import type { BaseTheme, TextStyle } from '@rootnative/core'

interface MyColors { [key: string]: string; brand: string; background: string; text: string }
interface MyTypography { [key: string]: TextStyle; heading: TextStyle; body: TextStyle }
interface MyTheme extends BaseTheme { colors: MyColors; typography: MyTypography }

const myTheme = defineTheme<MyTheme>({
  colors: { brand: '#FF6B00', background: '#FFFFFF', text: '#1A1A1A' },
  typography: {
    heading: { fontFamily: 'Inter', fontSize: 24, fontWeight: '700', lineHeight: 32, letterSpacing: 0 },
    body: { fontFamily: 'Inter', fontSize: 16, fontWeight: '400', lineHeight: 24, letterSpacing: 0.5 },
  },
  shape: { roundness: 1, cornerNone: 0, cornerExtraSmall: 4, cornerSmall: 8, cornerMedium: 12, cornerLarge: 16, cornerExtraLarge: 28, cornerFull: 9999 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  stateLayer: { pressedOpacity: 0.12, focusedOpacity: 0.12, hoveredOpacity: 0.08, disabledOpacity: 0.38 },
  elevation: { ... },
  motion: { ... },
})
\`\`\`

### createMaterialTheme(seedColor, options?)

Generates a complete MD3 light and dark theme from a single seed color. Uses Google's HCT color space via \`@material/material-color-utilities\` for spec-compliant palette generation.

Defaults are byte-identical to the upstream MD3 \`material-color-utilities\` library — pure spec output.

**Spec-aligned options:**
- \`variant?: 'tonalSpot' | 'neutral' | 'vibrant' | 'expressive' | 'fidelity' | 'content' | 'monochrome' | 'rainbow' | 'fruitSalad'\` — MD3 scheme variant (default \`'tonalSpot'\`, the Material You default on Android 12+). Each is a spec-defined recipe for deriving the palette. Use \`'monochrome'\` for spec-legal pure-grey themes, \`'vibrant'\` for high-colorfulness, etc.
- \`contrastLevel?: 'standard' | 'medium' | 'high'\` — MD3 contrast preset (default \`'standard'\`). Maps to MD3 contrast values \`0 / 0.5 / 1.0\`. Use \`'medium'\` or \`'high'\` for WCAG AAA / low-vision modes.
- \`fontFamily?: string\` — Custom font family applied to all 15 typography styles. When omitted, platform defaults are used (Roboto on Android, System on iOS).
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

// Use in provider
<ThemeProvider theme={lightTheme}>{children}</ThemeProvider>

// Or with dark mode
<ThemeProvider theme={isDark ? darkTheme : lightTheme}>{children}</ThemeProvider>
\`\`\`

Returns: \`{ lightTheme: Theme, darkTheme: Theme }\`

The generated themes include all 69 MD3 color roles plus shared tokens (typography, shape, spacing, stateLayer, elevation, motion, topAppBar).

Requires \`@material/material-color-utilities\` as a peer dependency: \`npm install @material/material-color-utilities\`

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

- \`BaseTheme\` — Generic base interface. All design systems extend this. Has \`colors: Record<string, string>\`, \`typography: Record<string, TextStyle>\`, plus shape, spacing, stateLayer, elevation, motion.
- \`Theme\` — Material Design 3 theme. Extends \`BaseTheme\` with 69 MD3 color roles, 15 typography variants, and optional \`topAppBar\` tokens. \`MaterialTheme\` is an identical alias (same type) — use it to disambiguate in multi-design-system codebases.

### Theme structure

\`\`\`
BaseTheme {
  colors: Record<string, string>
  typography: Record<string, TextStyle>
  shape: Shape           — roundness, cornerNone, cornerExtraSmall, cornerSmall, cornerMedium, cornerLarge, cornerExtraLarge, cornerFull
  spacing: Spacing       — xs, sm, md, lg, xl
  elevation: Elevation   — level0..level3 (shadow properties)
  stateLayer: StateLayer — pressedOpacity, focusedOpacity, hoveredOpacity, disabledOpacity
  motion: Motion         — duration and easing tokens
}

Theme extends BaseTheme {
  colors: Colors         — 69 MD3 color roles
  typography: Typography — 15 type scale variants (displayLarge..labelSmall)
  topAppBar?: TopAppBarTokens
}
\`\`\`

Colors: primary, onPrimary, primaryContainer, onPrimaryContainer, primaryFixed, onPrimaryFixed, primaryFixedDim, onPrimaryFixedVariant, secondary (same pattern), tertiary (same pattern), error, onError, errorContainer, onErrorContainer, background, onBackground, surface, surfaceDim, surfaceBright, surfaceContainerLowest, surfaceContainerLow, surfaceContainer, surfaceContainerHigh, surfaceContainerHighest, onSurface, surfaceVariant, onSurfaceVariant, outline, outlineVariant, surfaceTint, shadow, scrim, inverseSurface, inverseOnSurface, inversePrimary

Typography variants: displayLarge, displayMedium, displaySmall, headlineLarge, headlineMedium, headlineSmall, titleLarge, titleMedium, titleSmall, bodyLarge, bodyMedium, bodySmall, labelLarge, labelMedium, labelSmall — each with fontFamily, fontSize, fontWeight, lineHeight, letterSpacing

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
`
}

// ============================================================
// Content: CLI (static)
// ============================================================

function cliContent(): string {
  return `### Commands

#### \`rootnative create [name]\`

Create a new project with RootNative UI pre-configured. Fetches the quickstart template, applies your project name to \`package.json\` and \`app.json\`, and optionally installs dependencies.

\`\`\`bash
npx rootnative create            # Interactive
npx rootnative create my-app     # With name
npx rootnative create my-app -y  # Non-interactive, accept defaults
\`\`\`

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
  "registryVersion": "main"
}
\`\`\`

#### \`rootnative add <components...>\`

Add components to your project. Resolves dependency graph, copies files with rewritten imports, installs npm deps.

\`\`\`bash
npx rootnative add button
npx rootnative add card chip text-field
npx rootnative add appbar      # auto-adds icon-button + typography
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
- \`--package-manager <pm>\` — Package manager to use (\`npm\`, \`yarn\`, \`pnpm\`, \`bun\`)

What it does:
1. Reads the installed \`@rootnative/core\` version from \`node_modules\`
2. Fetches the latest version from the npm registry
3. Compares peer dependencies between the installed and latest versions
4. Shows a plan: version bump, new required peer deps, changed version ranges, removed deps
5. Upgrades \`@rootnative/core\` and installs any new required peer dependencies in one step
6. Reports optional peer deps that aren't installed (does not auto-install optional deps)
7. Lists peer deps that are no longer required so you can remove them manually

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

\`\`\`tsx
import { alphaColor, blendColor, elevationStyle, getMaterialCommunityIcons, transformOrigin, selectRTL } from '@rootnative/utils'
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

### Icon resolver

- \`getMaterialCommunityIcons()\` — Lazily resolves \`MaterialCommunityIcons\` from \`@expo/vector-icons\` at render time. Throws with install instructions if the package is missing.

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

Every icon prop accepts an \`IconSource\` (\`import type { IconSource } from '@rootnative/utils'\`) — one of three forms:

1. **String name** — resolved through the theme's \`iconResolver\`. Defaults to \`MaterialCommunityIcons\` from \`@expo/vector-icons\`. Browse names at https://pictogrammers.com/library/mdi/.
2. **ReactElement** — a pre-rendered icon (\`leadingIcon={<Check size={18} color="#fff" />}\`). The component does not override size/color.
3. **Render function** — \`(props: { size: number; color?: string }) => ReactNode\`. Receives the component's resolved icon size and color, so the icon stays consistent with theme/variant state.

Per-call elements/functions always take precedence over the resolver. \`@expo/vector-icons\` is only required if you actually pass string icon names without a custom resolver.

### \`@rootnative/icons\` adapter package (v${ICONS_VERSION})

Pre-built resolver factories for the most common React Native icon libraries. Install only the icon library you actually use — Lucide / Phosphor / \`@expo/vector-icons\` are declared as optional peer deps.

\`\`\`bash
pnpm add @rootnative/icons
\`\`\`

| Helper | For |
|--------|-----|
| \`createLucideResolver({ icons })\` | [Lucide](https://lucide.dev) (\`lucide-react-native\`) |
| \`createPhosphorResolver({ icons })\` | [Phosphor](https://phosphoricons.com) (\`phosphor-react-native\`) |
| \`createVectorIconsResolver({ IconSet })\` | Any \`@expo/vector-icons\` set (\`Ionicons\`, \`FontAwesome\`, …) |
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

#### \`@expo/vector-icons\`

\`\`\`tsx
import { Ionicons } from '@expo/vector-icons'
import { createVectorIconsResolver } from '@rootnative/icons'

const resolver = createVectorIconsResolver({
  IconSet: Ionicons,
  aliases: { check: 'checkmark', close: 'close', 'arrow-right': 'arrow-forward' },
})
\`\`\`

#### Custom resolver + MDI compatibility

\`withLegacyMdiFallback\` wraps any \`IconResolver\` so that legacy MaterialCommunityIcons names (\`magnify\`, \`pencil\`, \`dots-vertical\`, …) are rewritten to the wrapped resolver's vocabulary. The base resolver is always tried first; the alias map is consulted only when the base returns \`null\`.

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
> Peer deps: react >=18, react-native >=0.72
> Optional: @material/material-color-utilities >=0.4.0 (for createMaterialTheme)

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
> Peer deps: @rootnative/core >=${CORE_VERSION}, react >=18, react-native >=0.72, react-native-safe-area-context >=4, react-native-reanimated >=4
> Optional: @expo/vector-icons >=14 (only needed for icon props)

## Usage

${componentsContent()}

---

${iconsContent()}`
}

function generateCliLlms(): string {
  return `# @rootnative/cli — CLI for RootNative UI

> Version: ${CLI_VERSION}
> Binary: \`rootnative\`
> Requirements: Node >=18

## CLI (\`rootnative\`)

${cliContent()}`
}

function generateIconsLlms(): string {
  return `# @rootnative/icons — Icon Library Adapters for RootNative UI

> Version: ${ICONS_VERSION}
> Peer deps: @rootnative/core >=${CORE_VERSION}, react >=18, react-native >=0.72
> Optional peer deps: lucide-react-native, phosphor-react-native, @expo/vector-icons

Pre-built resolver factories that plug into the theme's \`iconResolver\`. Install only the icon library you actually use — each is declared as an optional peer dep.

\`\`\`bash
pnpm add @rootnative/icons
\`\`\`

${iconsContent()}`
}

function generateFullLlms(): string {
  return `# RootNative UI — Full API Reference

> Design-system agnostic component library for React Native — ships with Material Design 3
> Versions: \`@rootnative/core\` ${CORE_VERSION} · \`@rootnative/components\` ${COMPONENTS_VERSION} · \`@rootnative/icons\` ${ICONS_VERSION} · \`@rootnative/cli\` ${CLI_VERSION}
> Requirements: React Native 0.81+, React 19+, Expo SDK 54+
> Peer deps: \`react-native-safe-area-context >=4\`, \`react-native-reanimated >=4\`
> Optional peer deps: \`@expo/vector-icons >=14\` (only needed for icon props)

---

## Quick Start (new project)

\`\`\`bash
npx rootnative create my-app
cd my-app
npx expo start
\`\`\`

The \`create\` command scaffolds a ready-to-run Expo project with \`ThemeProvider\`, example components (Button, Card), Expo Router, and all dependencies pre-configured.

Interactive prompts: project name, display name (shown on home screen), package manager (npm/yarn/pnpm/bun), install dependencies.

Options:
- \`-y, --yes\` — Skip all prompts, use defaults (name: \`my-app\`, pm: \`npm\`, auto-install)

Pass name directly: \`npx rootnative create my-app\`

## Installation (existing project)

\`\`\`bash
pnpm add @rootnative/core @rootnative/components @expo/vector-icons react-native-safe-area-context react-native-reanimated
\`\`\`

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
