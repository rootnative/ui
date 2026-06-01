import { describe, it, expect } from 'vitest'
import { computeDiff, formatDiffSummary } from '../lib/diff'

describe('computeDiff', () => {
  it('detects no changes for identical content', () => {
    const content = 'line 1\nline 2\nline 3'
    const diff = computeDiff(content, content, 'test.ts')

    expect(diff.hasChanges).toBe(false)
    expect(diff.additions).toBe(0)
    expect(diff.deletions).toBe(0)
  })

  it('detects added lines', () => {
    const old = 'line 1\nline 2'
    const new_ = 'line 1\nline 2\nline 3'
    const diff = computeDiff(old, new_, 'test.ts')

    expect(diff.hasChanges).toBe(true)
    expect(diff.additions).toBe(1)
    expect(diff.deletions).toBe(0)
  })

  it('detects removed lines', () => {
    const old = 'line 1\nline 2\nline 3'
    const new_ = 'line 1\nline 3'
    const diff = computeDiff(old, new_, 'test.ts')

    expect(diff.hasChanges).toBe(true)
    expect(diff.deletions).toBe(1)
  })

  it('detects changed lines as remove + add', () => {
    const old = 'line 1\nold line\nline 3'
    const new_ = 'line 1\nnew line\nline 3'
    const diff = computeDiff(old, new_, 'test.ts')

    expect(diff.hasChanges).toBe(true)
    expect(diff.additions).toBe(1)
    expect(diff.deletions).toBe(1)
  })

  it('handles empty old content (new file)', () => {
    const diff = computeDiff('', 'new content', 'test.ts')

    expect(diff.hasChanges).toBe(true)
    expect(diff.additions).toBeGreaterThan(0)
  })

  it('handles empty new content (deleted file)', () => {
    const diff = computeDiff('old content', '', 'test.ts')

    expect(diff.hasChanges).toBe(true)
    expect(diff.deletions).toBeGreaterThan(0)
  })

  it('preserves file name', () => {
    const diff = computeDiff('a', 'a', 'Button.tsx')
    expect(diff.fileName).toBe('Button.tsx')
  })

  it('handles real import rewriting diff', () => {
    const old = [
      `import { alphaColor } from '@rootnative/utils'`,
      `import { useTheme } from '@rootnative/core'`,
    ].join('\n')

    const new_ = [
      `import { alphaColor } from '@/lib/rootnative-utils'`,
      `import { useTheme } from '@rootnative/core'`,
    ].join('\n')

    const diff = computeDiff(old, new_, 'styles.ts')

    expect(diff.hasChanges).toBe(true)
    expect(diff.additions).toBe(1)
    expect(diff.deletions).toBe(1)
  })

  it('handles multi-line changes in the middle', () => {
    const old = [
      'import React from "react"',
      'import { View } from "react-native"',
      '',
      'export function Foo() {',
      '  return <View />',
      '}',
    ].join('\n')

    const new_ = [
      'import React from "react"',
      'import { View, Text } from "react-native"',
      '',
      'export function Foo() {',
      '  return <View><Text>Hello</Text></View>',
      '}',
    ].join('\n')

    const diff = computeDiff(old, new_, 'Foo.tsx')

    expect(diff.hasChanges).toBe(true)
    // Two lines changed: the import line and the return line
    expect(diff.additions).toBe(2)
    expect(diff.deletions).toBe(2)
  })
})

describe('formatDiffSummary', () => {
  it('reports no changes', () => {
    const result = formatDiffSummary([
      {
        fileName: 'test.ts',
        hasChanges: false,
        additions: 0,
        deletions: 0,
        lines: [],
      },
    ])

    expect(result).toContain('No changes')
  })

  it('reports changed file count and totals', () => {
    const result = formatDiffSummary([
      {
        fileName: 'a.ts',
        hasChanges: true,
        additions: 3,
        deletions: 1,
        lines: [],
      },
      {
        fileName: 'b.ts',
        hasChanges: true,
        additions: 2,
        deletions: 5,
        lines: [],
      },
      {
        fileName: 'c.ts',
        hasChanges: false,
        additions: 0,
        deletions: 0,
        lines: [],
      },
    ])

    // Should say 2 files changed (not 3)
    expect(result).toContain('2 file(s) changed')
  })
})
