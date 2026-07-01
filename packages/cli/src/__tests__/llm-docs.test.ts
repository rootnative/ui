import os from 'node:os'
import path from 'node:path'
import fs from 'fs-extra'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ensureLlmDocsPointer, LLM_DOCS_POINTER } from '../lib/llm-docs'

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rootnative-test-'))
})

afterEach(async () => {
  await fs.remove(tmpDir)
})

const claudeMdPath = () => path.join(tmpDir, 'CLAUDE.md')

describe('ensureLlmDocsPointer', () => {
  it('creates CLAUDE.md when it does not exist', async () => {
    const result = await ensureLlmDocsPointer(tmpDir)

    expect(result).toBe('created')
    const content = await fs.readFile(claudeMdPath(), 'utf8')
    expect(content).toContain('# CLAUDE.md')
    expect(content).toContain('node_modules/@rootnative/components/llms.txt')
    expect(content).toContain('https://rootnative.github.io/ui/llms-full.txt')
  })

  it('appends to an existing CLAUDE.md without the pointer', async () => {
    const existing = '# My Project\n\nSome existing instructions.\n'
    await fs.outputFile(claudeMdPath(), existing)

    const result = await ensureLlmDocsPointer(tmpDir)

    expect(result).toBe('appended')
    const content = await fs.readFile(claudeMdPath(), 'utf8')
    expect(content.startsWith(existing)).toBe(true)
    expect(content).toContain('## RootNative UI docs for AI agents')
  })

  it('appends cleanly when the existing file has no trailing newline', async () => {
    await fs.outputFile(claudeMdPath(), '# My Project')

    const result = await ensureLlmDocsPointer(tmpDir)

    expect(result).toBe('appended')
    const content = await fs.readFile(claudeMdPath(), 'utf8')
    expect(content).toContain('# My Project\n\n## RootNative UI docs')
  })

  it('does nothing when the pointer is already present', async () => {
    await ensureLlmDocsPointer(tmpDir)
    const before = await fs.readFile(claudeMdPath(), 'utf8')

    const result = await ensureLlmDocsPointer(tmpDir)

    expect(result).toBe('already-present')
    const after = await fs.readFile(claudeMdPath(), 'utf8')
    expect(after).toBe(before)
  })

  it('detects a hand-written pointer via the llms.txt path', async () => {
    await fs.outputFile(
      claudeMdPath(),
      '# Docs\n\nRead node_modules/@rootnative/components/llms.txt first.\n',
    )

    const result = await ensureLlmDocsPointer(tmpDir)

    expect(result).toBe('already-present')
  })

  it('exports a pointer snippet that mentions all doc locations', () => {
    expect(LLM_DOCS_POINTER).toContain(
      'node_modules/@rootnative/components/llms.txt',
    )
    expect(LLM_DOCS_POINTER).toContain('node_modules/@rootnative/core/llms.txt')
    expect(LLM_DOCS_POINTER).toContain(
      'https://rootnative.github.io/ui/llms.txt',
    )
    expect(LLM_DOCS_POINTER).toContain(
      'https://rootnative.github.io/ui/llms-full.txt',
    )
  })
})
