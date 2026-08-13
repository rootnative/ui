/**
 * Checks the docs site against the source it describes.
 *
 * Why this exists: a docs-vs-source audit found the same failure mode over and
 * over — a hand-maintained enumeration that nobody extended when the code
 * changed. `cli.md` documented 14 of 28 components and was missing 7 command
 * flags; the `appbar` dependency list was short one entry; a code example used
 * two `ListItem` props that don't exist. Every one of those is mechanically
 * detectable, so detecting it by hand once a year is the wrong plan.
 *
 * Three groups of checks:
 *
 *   cli-reference   `docs/docs/cli.md` vs `packages/cli/src` + `registry/`
 *   component-props every JSX prop in every docs example vs the component's
 *                   real props type, resolved through the TypeScript checker so
 *                   inherited React Native props count too
 *   props-coverage  the other direction — every prop the library declares is
 *                   documented in `packages/components/llms.txt`
 *
 * `props-coverage` exists because the other two are one-directional: they prove
 * a documented prop is real, never that a real prop is documented. `Box.justify`
 * was implemented, typed and undocumented for the library's whole life while
 * `docs:check` stayed green, because there was nothing in the docs to scan. The
 * generator that omitted it exited 0, which is the failure mode this whole file
 * is about — a generator that can emit an incomplete file successfully needs an
 * assertion about its OUTPUT, not just its input.
 *
 * Only files that are committed belong here. A third `claude-md` group once
 * checked the repo's own root `CLAUDE.md`, which is never tracked — so it
 * passed locally, crashed CI on the commit that added it, and could not have
 * done otherwise. A check whose input is absent on a clean checkout is not a
 * check. Whatever guards an untracked file, it is not this script.
 *
 * Usage:
 *   npx tsx scripts/check-docs.ts          # report and exit 1 on any problem
 *   npx tsx scripts/check-docs.ts --list   # also print what was checked
 *
 * Reads source, not `dist/` — no build required.
 *
 * Every checker was validated by fault injection before being trusted: an
 * earlier ad-hoc version of the prop audit reported a false clean twice, once
 * because an outer `<SnackExample code={`…`}>` match swallowed the inner
 * component tags and once because the file walker only visited `.ts`.
 * If you extend this script, break it on purpose first and confirm it
 * complains — and confirm it still passes on a checkout that has only tracked
 * files, which is the half that was missed when `claude-md` went in.
 */
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const ROOT = path.resolve(import.meta.dirname, '..')
const CLI_DOC = path.join(ROOT, 'docs/docs/cli.md')
const CLI_SRC = path.join(ROOT, 'packages/cli/src/index.ts')
const DOCTOR_SRC = path.join(ROOT, 'packages/cli/src/commands/doctor.ts')
const REGISTRY_DIR = path.join(ROOT, 'registry/components')
const DOCS_DIR = path.join(ROOT, 'docs/docs')
const COMPONENTS_ENTRY = path.join(ROOT, 'packages/components/src/index.ts')
const COMPONENTS_LLMS = path.join(ROOT, 'packages/components/llms.txt')

interface Problem {
  check: string
  message: string
}
const problems: Problem[] = []
const notes: string[] = []

function fail(check: string, message: string) {
  problems.push({ check, message })
}

function read(file: string): string {
  return fs.readFileSync(file, 'utf8')
}

// ---------------------------------------------------------------------------
// cli-reference
// ---------------------------------------------------------------------------

interface Command {
  name: string
  /** Every flag spelling Commander accepts, e.g. `-y` and `--yes`. */
  flags: Set<string>
}

/**
 * Commands and their options, read out of the Commander chain. Deliberately a
 * scan rather than a parse: `.command('x')` starts a command and every
 * following `.option('…')` belongs to it until the next `.command(`.
 */
function cliCommands(): Command[] {
  const source = read(CLI_SRC)
  const commands: Command[] = []
  const token = /\.(command|option)\(\s*(['"`])([^'"`]+)\2/g

  let match: RegExpExecArray | null
  while ((match = token.exec(source)) !== null) {
    const [, kind, , value] = match
    if (kind === 'command') {
      commands.push({ name: value, flags: new Set() })
      continue
    }
    const current = commands.at(-1)
    if (!current) continue
    // '-d, --dry-run <x>' → '-d', '--dry-run'
    for (const part of value.split(',')) {
      const flag = part.trim().split(/\s+/)[0]
      if (flag.startsWith('-')) current.flags.add(flag)
    }
  }
  return commands
}

/**
 * The `### \`name\`` section of cli.md, up to the next heading of any level.
 * Slicing starts *after* the heading's own line — slicing one char in leaves
 * the heading at position 0, where it matches the "next heading" pattern and
 * every section comes back empty.
 */
function docSection(doc: string, command: string): string | null {
  const heading = new RegExp(`^### \`${command}\`\\s*$`, 'm')
  const start = doc.search(heading)
  if (start === -1) return null
  const bodyStart = doc.indexOf('\n', start)
  if (bodyStart === -1) return ''
  const rest = doc.slice(bodyStart + 1)
  const next = rest.search(/^#{2,3} /m)
  return next === -1 ? rest : rest.slice(0, next)
}

/** Flags a doc section claims, from its `| \`-x\`, \`--yes\` |` table rows. */
function documentedFlags(section: string): Set<string> {
  const flags = new Set<string>()
  for (const row of section.split('\n')) {
    if (!row.startsWith('|')) continue
    const cell = row.split('|')[1] ?? ''
    for (const spelling of cell.matchAll(/`(--?[a-z][\w-]*)/g)) {
      flags.add(spelling[1])
    }
  }
  return flags
}

function checkCliFlags(doc: string) {
  const check = 'cli-reference/flags'
  for (const command of cliCommands()) {
    const section = docSection(doc, command.name)
    if (section === null) {
      fail(check, `cli.md has no \`### \\\`${command.name}\\\`\` section`)
      continue
    }
    const documented = documentedFlags(section)
    for (const flag of command.flags) {
      if (!documented.has(flag)) {
        fail(
          check,
          `\`${command.name}\` accepts ${flag}, cli.md doesn't list it`,
        )
      }
    }
    for (const flag of documented) {
      if (!command.flags.has(flag)) {
        fail(
          check,
          `cli.md documents ${flag} on \`${command.name}\`, which doesn't accept it`,
        )
      }
    }
    notes.push(
      `${command.name}: ${command.flags.size} flag(s) in source, ${documented.size} documented`,
    )
  }
}

interface RegistryEntry {
  name: string
  componentDependencies: string[]
}

function registryEntries(): RegistryEntry[] {
  return fs
    .readdirSync(REGISTRY_DIR)
    .filter((file) => file.endsWith('.json'))
    .map(
      (file) =>
        JSON.parse(read(path.join(REGISTRY_DIR, file))) as RegistryEntry,
    )
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Rows of the "Available components" table, as name → dependencies cell. */
function componentTable(doc: string): Map<string, string> {
  const section = doc.slice(doc.search(/^## Available components\s*$/m))
  const rows = new Map<string, string>()
  for (const row of section.split('\n')) {
    const match = /^\|\s*`([a-z-]+)`\s*\|([^|]*)\|/.exec(row)
    if (match) rows.set(match[1], match[2].trim())
  }
  return rows
}

function checkComponentTable(doc: string) {
  const check = 'cli-reference/components'
  const rows = componentTable(doc)
  const entries = registryEntries()

  for (const entry of entries) {
    const cell = rows.get(entry.name)
    if (cell === undefined) {
      fail(check, `registry has \`${entry.name}\`, cli.md's table has no row`)
      continue
    }
    const expected =
      entry.componentDependencies.length > 0
        ? [...entry.componentDependencies].sort().join(', ')
        : '—'
    const actual =
      cell === '—'
        ? '—'
        : cell
            .split(',')
            .map((dep) => dep.trim().replace(/`/g, ''))
            .sort()
            .join(', ')
    if (actual !== expected) {
      fail(
        check,
        `\`${entry.name}\` dependencies: cli.md says "${actual}", registry says "${expected}"`,
      )
    }
  }

  const known = new Set(entries.map((entry) => entry.name))
  for (const name of rows.keys()) {
    if (!known.has(name)) {
      fail(
        check,
        `cli.md's table has a row for \`${name}\`, not in the registry`,
      )
    }
  }
  notes.push(
    `available components: ${rows.size} row(s) vs ${entries.length} registry entries`,
  )
}

function checkDoctorChecks(doc: string) {
  const check = 'cli-reference/doctor'
  // Each check in doctor.ts is introduced by a `// N.` comment; the docs table
  // has one row per check plus a header and separator.
  const numbered = read(DOCTOR_SRC).match(/^\s*\/\/ \d+\. /gm)?.length ?? 0
  const section = docSection(doc, 'doctor')
  if (section === null) {
    fail(check, 'cli.md has no `### `doctor`` section')
    return
  }
  const rows = section
    .split('\n')
    .filter((row) => /^\|/.test(row) && !/^\|\s*-+/.test(row)).length
  const documented = Math.max(0, rows - 1) // minus the header row

  if (numbered === 0) {
    fail(check, 'doctor.ts has no `// N.` check comments to count')
  } else if (documented !== numbered) {
    fail(
      check,
      `doctor.ts runs ${numbered} checks, cli.md's table lists ${documented}`,
    )
  }
  notes.push(`doctor: ${numbered} checks, ${documented} documented`)
}

// ---------------------------------------------------------------------------
// component-props
// ---------------------------------------------------------------------------

/** React-owned attributes that never appear on a props type. */
const REACT_PROPS = new Set(['key', 'ref'])

/**
 * Prop names per component, resolved through the type checker so props
 * inherited from `ViewProps` / `PressableProps` / `TextInputProps` count. Union
 * props types (Chip, ButtonGroup) contribute every constituent's props, since a
 * docs example only ever exercises one arm of the union.
 */
/**
 * Public exports that are values but not components, so they legitimately have
 * no `<Name>Props` type and no JSX tag.
 */
const NOT_COMPONENTS = new Set([
  'PORTAL_LAYERS',
  'DEFAULT_PORTAL_HOST',
  'useSnackbar',
])

function componentProps(): Map<string, Set<string>> {
  const program = ts.createProgram([COMPONENTS_ENTRY], {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
  })
  const source = program.getSourceFile(COMPONENTS_ENTRY)
  if (!source) throw new Error(`Could not load ${COMPONENTS_ENTRY}`)

  const checker = program.getTypeChecker()
  const moduleSymbol = checker.getSymbolAtLocation(source)
  if (!moduleSymbol)
    throw new Error('No module symbol for the components entry')

  const exports = checker.getExportsOfModule(moduleSymbol)
  const byName = new Map(exports.map((symbol) => [symbol.getName(), symbol]))

  // Coverage guard. The prop audit skips any tag it can't resolve to a props
  // type, so a component whose props type isn't named `<Name>Props` would go
  // silently unchecked — a hole that looks exactly like a clean run. Fail loudly
  // instead.
  for (const [name, symbol] of byName) {
    if (NOT_COMPONENTS.has(name) || name.endsWith('Props')) continue
    const resolved =
      symbol.getFlags() & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(symbol)
        : symbol
    const isValue =
      resolved.getFlags() &
      (ts.SymbolFlags.Function | ts.SymbolFlags.Variable | ts.SymbolFlags.Class)
    if (isValue && !byName.has(`${name}Props`)) {
      fail(
        'component-props/coverage',
        `\`${name}\` is exported but has no \`${name}Props\` type — its docs examples would go unchecked. Rename the props type or add it to NOT_COMPONENTS.`,
      )
    }
  }

  const props = new Map<string, Set<string>>()
  for (const [name, symbol] of byName) {
    if (!name.endsWith('Props')) continue
    const declared = checker.getDeclaredTypeOfSymbol(symbol)
    const constituents = declared.isUnion() ? declared.types : [declared]
    const names = new Set<string>()
    for (const type of constituents) {
      for (const property of checker.getPropertiesOfType(type)) {
        names.add(property.getName())
      }
    }
    if (names.size > 0) props.set(name.slice(0, -'Props'.length), names)
  }
  return props
}

/**
 * Attribute names on the opening tag that starts at `start`, or null if the tag
 * never closes. A hand-rolled scan rather than a regex on purpose: attribute
 * values contain braces, nested JSX and template literals, and the two bugs
 * that made the original audit report a false clean were both a regex giving up
 * at the first `}` or `>`. Only depth-0 attributes are collected, so the props
 * of a nested `<Switch>` inside `trailingContent={…}` stay with the Switch —
 * that tag is found on its own pass over the file.
 */
function tagAttributes(text: string, start: number): string[] | null {
  const attributes: string[] = []
  let i = start

  while (i < text.length) {
    const char = text[i]

    if (char === '>') return attributes
    if (char === '/' && text[i + 1] === '>') return attributes

    if (char === '{') {
      i = skipBraces(text, i)
      continue
    }
    if (char === '"' || char === "'" || char === '`') {
      i = skipString(text, i)
      continue
    }
    if (/[A-Za-z_]/.test(char)) {
      const identifier = /^[A-Za-z_][\w-]*/.exec(text.slice(i))![0]
      i += identifier.length
      // Skip to the value, if there is one.
      let j = i
      while (j < text.length && /\s/.test(text[j])) j++
      if (text[j] === '=') {
        j++
        while (j < text.length && /\s/.test(text[j])) j++
        if (text[j] === '{') j = skipBraces(text, j)
        else if (text[j] === '"' || text[j] === "'") j = skipString(text, j)
        i = j
      }
      attributes.push(identifier)
      continue
    }
    i++
  }
  return null
}

/** Index just past the `{…}` starting at `open`, braces balanced. */
function skipBraces(text: string, open: number): number {
  let depth = 0
  let i = open
  while (i < text.length) {
    const char = text[i]
    if (char === '"' || char === "'" || char === '`') {
      i = skipString(text, i)
      continue
    }
    if (char === '{') depth++
    else if (char === '}') {
      depth--
      if (depth === 0) return i + 1
    }
    i++
  }
  return text.length
}

/** Index just past the string literal starting at `open`. */
function skipString(text: string, open: number): number {
  const quote = text[open]
  let i = open + 1
  while (i < text.length) {
    if (text[i] === '\\') {
      i += 2
      continue
    }
    // A template literal can hold `${…}`, which can hold another string.
    if (quote === '`' && text[i] === '$' && text[i + 1] === '{') {
      i = skipBraces(text, i + 1)
      continue
    }
    if (text[i] === quote) return i + 1
    i++
  }
  return text.length
}

function docFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return docFiles(full)
    // Both extensions. The original audit filtered to `.ts` and so visited
    // zero docs pages while reporting a clean run.
    return /\.mdx?$/.test(entry.name) ? [full] : []
  })
}

function checkComponentProps() {
  const check = 'component-props'
  const props = componentProps()
  const files = docFiles(DOCS_DIR)
  let tags = 0

  for (const file of files) {
    const text = read(file)
    const relative = path.relative(ROOT, file)

    for (const match of text.matchAll(
      /<([A-Z][\w]*(?:\.[A-Z][\w]*)?)[\s/>]/g,
    )) {
      const tag = match[1]
      const allowed = props.get(tag.replace('.', ''))
      if (!allowed) continue // not a RootNative component

      const attributes = tagAttributes(text, match.index + 1 + tag.length)
      if (attributes === null) continue
      tags++

      const line = text.slice(0, match.index).split('\n').length
      for (const attribute of attributes) {
        if (REACT_PROPS.has(attribute)) continue
        if (!allowed.has(attribute)) {
          fail(
            check,
            `${relative}:${line} — \`<${tag}>\` has no prop \`${attribute}\``,
          )
        }
      }
    }
  }
  notes.push(
    `component props: ${tags} RootNative tag(s) across ${files.length} docs file(s), ${props.size} props types resolved`,
  )
}

// ---------------------------------------------------------------------------
// props-coverage
// ---------------------------------------------------------------------------

/**
 * Props the library itself declares, per props type — the ones that must be
 * documented. Deliberately NOT every prop the type resolves to: `BoxProps` has
 * 112, of which 90 come from `ViewProps`. Documenting React Native's surface is
 * not this library's job, and demanding it would make the check unsatisfiable.
 *
 * The filter is "declared in the same directory as the props type itself", not
 * "declared anywhere in the repo". That distinction is load-bearing:
 * `BottomSheet.tsx` augments the global `ViewProps` with `onKeyDown` to patch a
 * hole in RN-Web's types, so a repo-wide filter attributes `onKeyDown` to Box,
 * Button and everything else that extends `ViewProps` — none of which offer it.
 *
 * Union props types contribute every arm, since `AppBarProps` splits `actions`
 * and `trailing` across two and both need documenting.
 */
/**
 * True when a property is declared inside a `declare module 'react-native'`
 * block rather than on one of the library's own interfaces.
 *
 * These are type patches, not props. `BottomSheet.tsx` and `Slider.tsx` each
 * augment upstream `ViewProps` / `PressableProps` with `onKeyDown`, and
 * `TextField.tsx` adds `aria-invalid` / `aria-describedby`, because RN-Web
 * forwards all of them to the DOM while the upstream types omit them. They live
 * in the component's own directory, so the scope filter alone still attributes
 * them to that component and demands documentation for a prop the library does
 * not offer.
 */
function isModuleAugmentation(declaration: ts.Node): boolean {
  for (let node: ts.Node | undefined = declaration; node; node = node.parent) {
    if (ts.isModuleDeclaration(node)) return true
  }
  return false
}

function declaredProps(): Map<string, Set<string>> {
  const program = ts.createProgram([COMPONENTS_ENTRY], {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
  })
  const source = program.getSourceFile(COMPONENTS_ENTRY)
  if (!source) throw new Error(`Could not load ${COMPONENTS_ENTRY}`)

  const checker = program.getTypeChecker()
  const moduleSymbol = checker.getSymbolAtLocation(source)
  if (!moduleSymbol)
    throw new Error('No module symbol for the components entry')

  const byType = new Map<string, Set<string>>()

  for (const symbol of checker.getExportsOfModule(moduleSymbol)) {
    const name = symbol.getName()
    if (!name.endsWith('Props')) continue

    // Every props type reaches the entry as a re-export, so the alias resolves
    // to `index.ts` itself. Without this hop every scope directory is the entry
    // directory, no prop matches it, and the check reports a vacuous clean.
    const resolved =
      symbol.getFlags() & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(symbol)
        : symbol
    const declaration = resolved.getDeclarations()?.[0]
    if (!declaration) continue
    const scope = path.dirname(declaration.getSourceFile().fileName)

    const declared = checker.getDeclaredTypeOfSymbol(resolved)
    const constituents = declared.isUnion() ? declared.types : [declared]
    const own = new Set<string>()
    for (const type of constituents) {
      for (const property of checker.getPropertiesOfType(type)) {
        const propertyDeclaration = property.getDeclarations()?.[0]
        if (!propertyDeclaration) continue
        const file = propertyDeclaration.getSourceFile().fileName
        if (path.dirname(file) !== scope) continue
        if (isModuleAugmentation(propertyDeclaration)) continue
        own.add(property.getName())
      }
    }
    if (own.size > 0) byType.set(name.slice(0, -'Props'.length), own)
  }
  return byType
}

/**
 * Prop names `llms.txt` documents, from its `- \`name?: type\` — …` bullets.
 *
 * Read as one flat set for the whole file rather than per component section. The
 * finer check would be per section, but the generator writes some props under a
 * shared heading (the override-pattern block covers `containerColor` /
 * `contentColor` / `labelStyle` for every component at once), so a per-section
 * assertion would demand duplication the document deliberately avoids.
 *
 * **The cost of that choice, stated so nobody reads more into a green run than
 * it means:** a flat set catches a prop documented NOWHERE, not a prop
 * documented for a *different* component. Common names hide behind each other —
 * `variant` appears on 16 prop lines and `containerColor` on 27, so dropping
 * either from one component's block still passes. It was measured, not assumed:
 * reverting the `ButtonGroupCommonProps` rename drops 13 props from the file and
 * this check reports 3, because the other 10 share a name with some other
 * component's documented prop. Those 3 are enough to fail CI and name the cause,
 * which is the job. Tightening to per-section is the obvious next step if the
 * hiding ever matters; it needs the generator's shared-heading props modelled
 * first.
 */
function documentedProps(text: string): Set<string> {
  const names = new Set<string>()
  for (const match of text.matchAll(/^- `([A-Za-z_][\w]*)\??(?::|`)/gm)) {
    names.add(match[1])
  }
  return names
}

function checkPropsCoverage() {
  const check = 'props-coverage'
  const documented = documentedProps(read(COMPONENTS_LLMS))

  // A guard, not a formality. The bullet regex is the only thing standing
  // between this check and a silent pass: if the generator ever changes its
  // prop-line format, the set goes empty, every prop reads as undocumented, and
  // the failure at least names the real cause instead of 391 false positives.
  if (documented.size === 0) {
    fail(
      check,
      'parsed zero prop bullets out of packages/components/llms.txt — the `- `name?: type`` format changed, so this check is blind. Fix the parser.',
    )
    return
  }

  const declared = declaredProps()
  let total = 0
  for (const [component, props] of [...declared].sort()) {
    for (const prop of [...props].sort()) {
      total++
      if (!documented.has(prop)) {
        fail(
          check,
          `\`${component}.${prop}\` is declared but appears in no \`llms.txt\` prop line. Run \`pnpm run build:llms\`; if the generator drops it, its parser cannot see that prop shape.`,
        )
      }
    }
  }
  notes.push(
    `props coverage: ${total} declared prop(s) across ${declared.size} props type(s), ${documented.size} documented name(s)`,
  )
}

// ---------------------------------------------------------------------------

function main() {
  const doc = read(CLI_DOC)
  checkCliFlags(doc)
  checkComponentTable(doc)
  checkDoctorChecks(doc)
  checkComponentProps()
  checkPropsCoverage()

  if (process.argv.includes('--list')) {
    for (const note of notes) console.log(`  ${note}`)
  }

  if (problems.length === 0) {
    console.log('Docs match the source they describe.')
    return
  }

  const byCheck = new Map<string, string[]>()
  for (const { check, message } of problems) {
    byCheck.set(check, [...(byCheck.get(check) ?? []), message])
  }
  for (const [check, messages] of byCheck) {
    console.error(`\n${check}`)
    for (const message of messages) console.error(`  ✗ ${message}`)
  }
  console.error(`\n${problems.length} problem(s).`)
  process.exit(1)
}

main()
