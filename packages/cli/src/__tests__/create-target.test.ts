import os from 'node:os'
import path from 'node:path'
import fs from 'fs-extra'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  findConflicts,
  resolveProjectTarget,
  templateFiles,
} from '../commands/create'

/**
 * `create` resolved its target directory with `path.resolve(cwd, slugify(name))`.
 * `slugify` strips every character that is not a letter or a digit, so `.`
 * became `''` and the target resolved to the current directory. `create .` then
 * took the "directory already exists" branch and ran `fs.remove` on the user's
 * own working directory — which deleted `.git` with it.
 */
let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rootnative-create-'))
  // macOS puts the temp directory behind a /private symlink
  tmpDir = await fs.realpath(tmpDir)
})

afterEach(async () => {
  await fs.remove(tmpDir)
})

function ok(result: ReturnType<typeof resolveProjectTarget>) {
  if (!result.ok) throw new Error(`expected ok, got ${result.reason}`)
  return result.target
}

describe('resolveProjectTarget — current directory', () => {
  it('takes the project name from the current folder', () => {
    const cwd = path.join(tmpDir, 'My Cool App')
    const target = ok(resolveProjectTarget('.', cwd))

    expect(target.projectName).toBe('my-cool-app')
    expect(target.targetDir).toBe(cwd)
    expect(target.useCurrentDir).toBe(true)
  })

  it.each(['.', './', '.\\', ' . '])('accepts %j', (input) => {
    const cwd = path.join(tmpDir, 'demo')
    const target = ok(resolveProjectTarget(input, cwd))

    expect(target.targetDir).toBe(cwd)
    expect(target.useCurrentDir).toBe(true)
  })

  it('never resolves the current directory as a deletable target', () => {
    const cwd = path.join(tmpDir, 'demo')

    // useCurrentDir is what stops the caller reaching fs.remove
    expect(ok(resolveProjectTarget('.', cwd)).useCurrentDir).toBe(true)
  })

  it('rejects a folder name that has no letters or digits', () => {
    const result = resolveProjectTarget('.', path.join(tmpDir, '---'))

    expect(result).toEqual({ ok: false, reason: 'invalid-folder-name' })
  })
})

describe('resolveProjectTarget — named project', () => {
  it('resolves a subdirectory of the current directory', () => {
    const target = ok(resolveProjectTarget('my-app', tmpDir))

    expect(target.projectName).toBe('my-app')
    expect(target.targetDir).toBe(path.join(tmpDir, 'my-app'))
    expect(target.useCurrentDir).toBe(false)
  })

  it('slugifies the name', () => {
    expect(ok(resolveProjectTarget('My App!', tmpDir)).projectName).toBe(
      'my-app',
    )
  })

  // The regression: each of these used to slugify to '' and resolve to cwd.
  it.each(['...', '---', '!!!', '   ', '..'])(
    'rejects %j instead of resolving to the current directory',
    (input) => {
      expect(resolveProjectTarget(input, tmpDir)).toEqual({
        ok: false,
        reason: 'invalid-name',
      })
    },
  )

  it('never points a named project at the current directory', () => {
    for (const input of ['my-app', 'a', 'App', '1']) {
      const target = ok(resolveProjectTarget(input, tmpDir))
      expect(target.targetDir).not.toBe(tmpDir)
      expect(target.useCurrentDir).toBe(false)
    }
  })
})

describe('findConflicts', () => {
  it('reports only the files that are already there', async () => {
    await fs.outputFile(path.join(tmpDir, '.gitignore'), 'node_modules\n')
    await fs.outputFile(path.join(tmpDir, 'assets/icon.png'), 'x')

    const conflicts = await findConflicts(tmpDir, templateFiles('blank'))

    expect(conflicts).toEqual(['.gitignore', 'assets/icon.png'])
  })

  it('reports nothing for an empty directory', async () => {
    expect(await findConflicts(tmpDir, templateFiles('blank'))).toEqual([])
  })

  it('ignores files the template does not write', async () => {
    await fs.ensureDir(path.join(tmpDir, '.git'))
    await fs.outputFile(path.join(tmpDir, 'notes.txt'), 'x')

    expect(await findConflicts(tmpDir, templateFiles('with-router'))).toEqual(
      [],
    )
  })
})

describe('templateFiles', () => {
  it('covers the files each template writes', () => {
    expect(templateFiles('blank')).toEqual(
      expect.arrayContaining([
        'package.json',
        'app.json',
        '.gitignore',
        'App.tsx',
        'CLAUDE.md',
        'assets/icon.png',
      ]),
    )
    expect(templateFiles('with-router')).toEqual(
      expect.arrayContaining(['app/_layout.tsx', 'app/index.tsx']),
    )
  })
})
