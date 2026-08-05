import path from 'node:path'
import fs from 'fs-extra'

/**
 * tsconfig allows comments, so it cannot be read with `JSON.parse` directly.
 *
 * This walks the text instead of using a regex, because a regex cannot tell a
 * comment from the same characters inside a string. The obvious
 * `/\/\*[\s\S]*?\*\/|\/\/.*` /` sees the `/*` in `"**\/*.ts"` as a block-comment
 * opener and deletes everything up to the next `*\/` — so `"include":
 * ["**\/*.ts", "**\/*.tsx"]` collapsed to `["***.tsx"]`. Every real tsconfig has
 * globs like that, and the corruption is silent: valid JSON out, wrong values.
 */
export function stripJsonComments(raw: string): string {
  let out = ''
  let inString = false
  let escaped = false

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i]

    if (inString) {
      out += char
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      out += char
      continue
    }

    if (char === '/' && raw[i + 1] === '*') {
      const end = raw.indexOf('*/', i + 2)
      i = end === -1 ? raw.length : end + 1
      continue
    }

    if (char === '/' && raw[i + 1] === '/') {
      while (i < raw.length && raw[i] !== '\n') i++
      out += '\n'
      continue
    }

    out += char
  }

  return out
}

export type TsconfigPatchResult =
  | { status: 'added'; prefix: string; target: string }
  | { status: 'already-mapped'; prefix: string }
  | { status: 'no-tsconfig' }
  | { status: 'not-an-alias' }
  | { status: 'failed'; error: string }

/**
 * The prefix and directory a `@/components/ui`-style alias implies.
 *
 * `resolveAliasPath` in `config.ts` writes files to `src/<rest>`, so the
 * tsconfig mapping has to point at `src/*` to agree with where `add` actually
 * put them. Returns null for a plain relative alias like `./components`, which
 * needs no mapping.
 */
export function parseAliasPrefix(
  alias: string,
): { prefix: string; target: string } | null {
  const match = /^([^./\\][^/\\]*)\//.exec(alias)
  if (!match) return null

  return { prefix: match[1], target: 'src' }
}

/**
 * Adds a `paths` mapping for the alias prefix `init` chose, when tsconfig has
 * none.
 *
 * Without this, every import `add` rewrites to `@/lib/rootnative-utils` is
 * unresolved: an Expo project from `create` extends `expo/tsconfig.base` and
 * declares no `paths`, so a fresh `init` + `add` produced six "Cannot find
 * module" errors. `detector.ts` only ever read this field; nothing wrote it.
 *
 * Existing `compilerOptions` survive. Comments do not — they are stripped to
 * parse, and re-emitting them would need a CST. That is why the patch is
 * skipped whenever a mapping for the prefix already exists: the common case for
 * a project with comments in its tsconfig is one that already declares paths.
 */
export async function ensureTsconfigPaths(
  cwd: string,
  alias: string,
): Promise<TsconfigPatchResult> {
  const parsed = parseAliasPrefix(alias)
  if (!parsed) return { status: 'not-an-alias' }

  const { prefix, target } = parsed
  const tsconfigPath = path.resolve(cwd, 'tsconfig.json')

  if (!(await fs.pathExists(tsconfigPath))) {
    return { status: 'no-tsconfig' }
  }

  try {
    const raw = await fs.readFile(tsconfigPath, 'utf-8')
    const tsconfig = JSON.parse(stripJsonComments(raw)) as {
      compilerOptions?: {
        baseUrl?: string
        paths?: Record<string, string[]>
      }
    }

    const key = `${prefix}/*`
    const existing = tsconfig.compilerOptions?.paths

    if (existing && key in existing) {
      return { status: 'already-mapped', prefix }
    }

    const compilerOptions = tsconfig.compilerOptions ?? {}

    tsconfig.compilerOptions = {
      ...compilerOptions,
      baseUrl: compilerOptions.baseUrl ?? '.',
      paths: {
        ...existing,
        [key]: [`./${target}/*`],
      },
    }

    await fs.writeJSON(tsconfigPath, tsconfig, { spaces: 2 })

    return { status: 'added', prefix, target }
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
