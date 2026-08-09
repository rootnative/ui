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
 *   claude-md       the repo's own `CLAUDE.md` vs the same sources. Added after
 *                   an audit found it stale in two places while `cli.md` — the
 *                   file this script already read — was correct. It is the file
 *                   an agent reads first, so stale guidance there is costly.
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
 * component tags and once because the file walker only visited `.ts`. The
 * `claude-md` group went the same way — its first cut read every dash-led word
 * in a table cell as a flag and called hyphenated prose a defect, and
 * `claude-md/paths` stayed green on a step that named a real file for a thing
 * the file does not hold, which is why `component-steps` exists.
 * If you extend this script, break it on purpose first and confirm it complains.
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
const CLAUDE_MD = path.join(ROOT, 'CLAUDE.md')

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

/**
 * The `| \`rootnative x\` | … |` rows of CLAUDE.md's "Commands" table, as
 * command name → the flags its description cell claims.
 *
 * A different shape from cli.md, which gives each command its own `###`
 * section and a flag table — here one row holds both the description and an
 * inline `Options: \`-y/--yes\`, …` list, so the flags come out of the second
 * cell rather than the first.
 */
function claudeMdCommandTable(doc: string): Map<string, Set<string>> {
  const start = doc.search(/^### Commands\s*$/m)
  const rest = start === -1 ? '' : doc.slice(start)
  const section = rest.slice(0, rest.search(/^#{2,3} .*$/m) || undefined)
  const rows = new Map<string, Set<string>>()

  for (const row of section.split('\n')) {
    if (!row.startsWith('|')) continue
    const cells = row.split('|')
    const name = cells[1]?.match(/`rootnative ([a-z]+)/)?.[1]
    if (!name) continue

    const flags = new Set<string>()
    // Only inside backticks. Reading every dash-led word out of the cell
    // instead picks up ordinary hyphenated prose — "pre-configured" and
    // "LLM-docs" both parsed as flags and reported a clean table as broken.
    for (const code of (cells[2] ?? '').matchAll(/`([^`]+)`/g)) {
      for (const spelling of code[1].matchAll(
        /(?:^|[\s/,])(--?[a-z][\w-]*)/g,
      )) {
        flags.add(spelling[1])
      }
    }
    rows.set(name, flags)
  }

  return rows
}

/**
 * CLAUDE.md's command table vs Commander, the same way `cli-reference/flags`
 * checks cli.md.
 *
 * `docs:check` used to read the docs site only, so this table drifted unseen:
 * an audit found `add` missing `-y/--yes` while cli.md — which *is* checked —
 * documented it correctly. CLAUDE.md is the file an agent reads first, so a
 * wrong flag list there is the expensive kind of stale.
 */
function checkClaudeMdCommands() {
  const check = 'claude-md/cli-commands'
  const documented = claudeMdCommandTable(read(CLAUDE_MD))

  if (documented.size === 0) {
    fail(check, 'CLAUDE.md has no "### Commands" table rows')
    return
  }

  for (const command of cliCommands()) {
    const flags = documented.get(command.name)
    if (!flags) {
      fail(check, `CLAUDE.md's command table has no \`${command.name}\` row`)
      continue
    }
    for (const flag of command.flags) {
      if (!flags.has(flag)) {
        fail(
          check,
          `\`${command.name}\` accepts ${flag}, CLAUDE.md doesn't list it`,
        )
      }
    }
    for (const flag of flags) {
      if (!command.flags.has(flag)) {
        fail(
          check,
          `CLAUDE.md lists ${flag} on \`${command.name}\`, which doesn't accept it`,
        )
      }
    }
    notes.push(
      `CLAUDE.md ${command.name}: ${command.flags.size} flag(s) in source, ${flags.size} documented`,
    )
  }

  for (const name of documented.keys()) {
    if (!cliCommands().some((command) => command.name === name)) {
      fail(check, `CLAUDE.md documents \`${name}\`, which is not a command`)
    }
  }
}

/**
 * Paths CLAUDE.md tells the reader to edit, which have to exist.
 *
 * The same audit found step 4 of "Adding a New Component" pointing at the
 * `build` script in `packages/components/package.json` for the entry list,
 * which moved to `tsup.config.ts`. A path is cheap to verify, and a checklist
 * that names the wrong file sends every reader to the wrong place.
 */
function checkClaudeMdPaths() {
  const check = 'claude-md/paths'
  const doc = read(CLAUDE_MD)
  let checked = 0
  let skipped = 0

  for (const match of doc.matchAll(
    /`((?:packages|scripts|docs|example|templates|registry)\/[^`\s]*?\.(?:ts|tsx|json|md|mdx))`/g,
  )) {
    const rel = match[1]

    // `<component-name>` is a placeholder and `{core,utils}` is a brace
    // expansion standing for several real files; neither is a path that can be
    // checked. Skipping them is required, but a silent skip is how an audit
    // reports a false clean — so they are counted and reported instead.
    if (/[<>{}*]/.test(rel)) {
      skipped++
      continue
    }

    // A path the reader is told to *create* does not exist yet by definition —
    // the "add a new adapter" steps name `createTablerResolver.tsx` as the file
    // to write. Only paths presented as existing are checkable.
    if (/\bCreate\s+$/.test(doc.slice(0, match.index))) {
      skipped++
      continue
    }

    checked++
    if (!fs.existsSync(path.join(ROOT, rel))) {
      fail(check, `CLAUDE.md names \`${rel}\`, which does not exist`)
    }
  }

  notes.push(
    `CLAUDE.md: ${checked} file path(s) checked, ${skipped} placeholder(s) skipped`,
  )
}

/**
 * The "Adding a New Component" checklist vs where those edits really go.
 *
 * `claude-md/paths` cannot catch this class: step 4 used to send the reader to
 * the `build` script in `packages/components/package.json` for the tsup entry
 * list, and that file plainly exists — the path was real and the claim was
 * false. So the file a step names is checked against the file that actually
 * holds the thing.
 */
function checkClaudeMdComponentSteps() {
  const check = 'claude-md/component-steps'
  const doc = read(CLAUDE_MD)
  const start = doc.search(/^## Adding a New Component\s*$/m)

  if (start === -1) {
    fail(check, 'CLAUDE.md has no "## Adding a New Component" section')
    return
  }

  const rest = doc.slice(start + 1)
  const end = rest.search(/^## /m)
  const section = end === -1 ? rest : rest.slice(0, end)

  // Each claim: the step that names a file, and the file that owns the thing.
  const claims: {
    what: string
    step: RegExp
    owner: string
    holds: RegExp
  }[] = [
    {
      what: 'the tsup entry list',
      step: /entry point[^\n]*?\bin `([^`]+)`/,
      owner: 'packages/components/tsup.config.ts',
      holds: /entry:\s*\[/,
    },
    {
      what: 'the subpath exports',
      step: /subpath export in `([^`]+)`/,
      owner: 'packages/components/package.json',
      holds: /"exports"/,
    },
  ]

  for (const claim of claims) {
    const named = section.match(claim.step)?.[1]

    if (!named) {
      fail(check, `no step in the checklist names where ${claim.what} lives`)
      continue
    }
    if (named !== claim.owner) {
      fail(
        check,
        `checklist puts ${claim.what} in \`${named}\`; it lives in \`${claim.owner}\``,
      )
      continue
    }
    // Guard the expectation itself, so this check fails loudly rather than
    // going stale if the entry list moves again.
    if (!claim.holds.test(read(path.join(ROOT, claim.owner)))) {
      fail(check, `\`${claim.owner}\` no longer holds ${claim.what}`)
      continue
    }
    notes.push(`CLAUDE.md: ${claim.what} → ${named}`)
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

function main() {
  const doc = read(CLI_DOC)
  checkCliFlags(doc)
  checkComponentTable(doc)
  checkDoctorChecks(doc)
  checkComponentProps()
  checkClaudeMdCommands()
  checkClaudeMdPaths()
  checkClaudeMdComponentSteps()

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
