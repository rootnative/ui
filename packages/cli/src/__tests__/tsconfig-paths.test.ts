import os from 'node:os'
import path from 'node:path'
import fs from 'fs-extra'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resolveAliasPath } from '../lib/config'
import { detectProject } from '../lib/detector'
import {
  ensureTsconfigPaths,
  parseAliasPrefix,
  stripJsonComments,
} from '../lib/tsconfig-paths'

/**
 * `init` chose an `@/...` alias and `add` rewrote every generated import to it,
 * but nothing wrote the matching tsconfig mapping — so a fresh `create` + `init`
 * + `add` produced six "Cannot find module '@/lib/rootnative-utils'" errors.
 * `detector.ts` only ever read this field.
 */
let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rootnative-tsconfig-'))
})

afterEach(async () => {
  await fs.remove(tmpDir)
})

async function readTsconfig() {
  return fs.readJSON(path.join(tmpDir, 'tsconfig.json'))
}

describe('stripJsonComments', () => {
  it('removes line and block comments', () => {
    const parsed = JSON.parse(
      stripJsonComments(`{
  // a line comment
  "a": 1,
  /* a block
     comment */
  "b": 2
}`),
    )

    expect(parsed).toEqual({ a: 1, b: 2 })
  })

  it('leaves a glob pattern intact', () => {
    // The regression that motivated the hand-rolled walker. A regex-based
    // stripper reads the `/*` inside `"**/*.ts"` as a block-comment opener and
    // deletes through to the next `*/`, collapsing this array to
    // `["***.tsx"]` — valid JSON, wrong values, no error.
    const parsed = JSON.parse(
      stripJsonComments('{ "include": ["**/*.ts", "**/*.tsx"] }'),
    )

    expect(parsed.include).toEqual(['**/*.ts', '**/*.tsx'])
  })

  it('leaves a path mapping containing /* intact', () => {
    const parsed = JSON.parse(
      stripJsonComments('{ "paths": { "@/*": ["./src/*"] } }'),
    )

    expect(parsed.paths).toEqual({ '@/*': ['./src/*'] })
  })

  it('leaves a // inside a string intact', () => {
    const parsed = JSON.parse(
      stripJsonComments('{ "url": "https://example.com/x" }'),
    )

    expect(parsed.url).toBe('https://example.com/x')
  })

  it('handles an escaped quote before a comment-like sequence', () => {
    const parsed = JSON.parse(
      stripJsonComments('{ "a": "say \\"hi\\"", "b": "**/*.ts" }'),
    )

    expect(parsed).toEqual({ a: 'say "hi"', b: '**/*.ts' })
  })
})

describe('parseAliasPrefix', () => {
  it('extracts the prefix from an aliased path', () => {
    expect(parseAliasPrefix('@/components/ui')).toEqual({
      prefix: '@',
      target: 'src',
    })
  })

  it('handles a non-@ prefix', () => {
    expect(parseAliasPrefix('~/components/ui')).toEqual({
      prefix: '~',
      target: 'src',
    })
  })

  it('returns null for a relative path, which needs no mapping', () => {
    expect(parseAliasPrefix('./components/ui')).toBeNull()
    expect(parseAliasPrefix('components/ui')).toEqual({
      prefix: 'components',
      target: 'src',
    })
  })

  it('targets src, which is where resolveAliasPath writes files', () => {
    // The mapping is only correct if it points at the directory `add` actually
    // used. These two must not drift apart.
    const parsed = parseAliasPrefix('@/lib')
    const written = resolveAliasPath('@/lib', '/project')

    expect(written).toBe(path.resolve('/project', 'src/lib'))
    expect(parsed?.target).toBe('src')
  })
})

describe('ensureTsconfigPaths', () => {
  it('adds the mapping and baseUrl to a tsconfig with no paths', async () => {
    // This is the Expo scaffold: extends a base config, declares no paths.
    await fs.writeJSON(path.join(tmpDir, 'tsconfig.json'), {
      extends: 'expo/tsconfig.base',
      compilerOptions: { strict: true },
    })

    const result = await ensureTsconfigPaths(tmpDir, '@/components/ui')

    expect(result).toEqual({ status: 'added', prefix: '@', target: 'src' })

    const tsconfig = await readTsconfig()
    expect(tsconfig.compilerOptions.paths).toEqual({ '@/*': ['./src/*'] })
    expect(tsconfig.compilerOptions.baseUrl).toBe('.')
  })

  it('preserves existing compilerOptions and top-level keys', async () => {
    await fs.writeJSON(path.join(tmpDir, 'tsconfig.json'), {
      extends: 'expo/tsconfig.base',
      compilerOptions: { strict: true, jsx: 'react-jsx' },
      include: ['**/*.ts', '**/*.tsx'],
    })

    await ensureTsconfigPaths(tmpDir, '@/components/ui')

    const tsconfig = await readTsconfig()
    expect(tsconfig.extends).toBe('expo/tsconfig.base')
    expect(tsconfig.include).toEqual(['**/*.ts', '**/*.tsx'])
    expect(tsconfig.compilerOptions.strict).toBe(true)
    expect(tsconfig.compilerOptions.jsx).toBe('react-jsx')
  })

  it('keeps an existing baseUrl rather than overwriting it', async () => {
    await fs.writeJSON(path.join(tmpDir, 'tsconfig.json'), {
      compilerOptions: { baseUrl: './app' },
    })

    await ensureTsconfigPaths(tmpDir, '@/components/ui')

    expect((await readTsconfig()).compilerOptions.baseUrl).toBe('./app')
  })

  it('skips when the prefix is already mapped, whatever it points at', async () => {
    // The user's own mapping wins. Overwriting it would silently redirect
    // every `@/...` import in a project that already worked.
    await fs.writeJSON(path.join(tmpDir, 'tsconfig.json'), {
      compilerOptions: { paths: { '@/*': ['./app/*'] } },
    })

    const result = await ensureTsconfigPaths(tmpDir, '@/components/ui')

    expect(result).toEqual({ status: 'already-mapped', prefix: '@' })
    expect((await readTsconfig()).compilerOptions.paths).toEqual({
      '@/*': ['./app/*'],
    })
  })

  it('adds its mapping alongside unrelated existing ones', async () => {
    await fs.writeJSON(path.join(tmpDir, 'tsconfig.json'), {
      compilerOptions: { paths: { 'assets/*': ['./assets/*'] } },
    })

    await ensureTsconfigPaths(tmpDir, '@/components/ui')

    expect((await readTsconfig()).compilerOptions.paths).toEqual({
      'assets/*': ['./assets/*'],
      '@/*': ['./src/*'],
    })
  })

  it('parses a tsconfig with comments, which tsconfig allows', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'tsconfig.json'),
      `{
  // the Expo base config
  "extends": "expo/tsconfig.base",
  /* block comment */
  "compilerOptions": { "strict": true }
}`,
    )

    const result = await ensureTsconfigPaths(tmpDir, '@/components/ui')

    expect(result.status).toBe('added')
    expect((await readTsconfig()).compilerOptions.paths).toEqual({
      '@/*': ['./src/*'],
    })
  })

  it('reports no-tsconfig instead of creating one', async () => {
    // A JS-only project has nothing to patch and needs no alias mapping.
    const result = await ensureTsconfigPaths(tmpDir, '@/components/ui')

    expect(result).toEqual({ status: 'no-tsconfig' })
    expect(await fs.pathExists(path.join(tmpDir, 'tsconfig.json'))).toBe(false)
  })

  it('reports not-an-alias for a relative components path', async () => {
    await fs.writeJSON(path.join(tmpDir, 'tsconfig.json'), {
      compilerOptions: {},
    })

    const result = await ensureTsconfigPaths(tmpDir, './components/ui')

    expect(result).toEqual({ status: 'not-an-alias' })
    expect((await readTsconfig()).compilerOptions.paths).toBeUndefined()
  })

  it('fails soft on malformed JSON rather than throwing', async () => {
    // init must not abort partway through over a tsconfig it cannot read.
    await fs.writeFile(path.join(tmpDir, 'tsconfig.json'), '{ not json')

    const result = await ensureTsconfigPaths(tmpDir, '@/components/ui')

    expect(result.status).toBe('failed')
  })

  it('writes a mapping that detectProject can then read back', async () => {
    // Closes the loop: a second `init` must see the alias the first one wrote
    // and keep choosing the same one.
    await fs.writeJSON(path.join(tmpDir, 'package.json'), {
      dependencies: { expo: '~54.0.0' },
    })
    await fs.writeJSON(path.join(tmpDir, 'tsconfig.json'), {
      compilerOptions: {},
    })

    await ensureTsconfigPaths(tmpDir, '@/components/ui')

    const project = await detectProject(tmpDir)
    expect(project.aliases).toEqual({ '@': 'src' })
  })
})
