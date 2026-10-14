import chalk from 'chalk'

interface DiffLine {
  type: 'add' | 'remove' | 'context'
  content: string
}

export interface FileDiff {
  fileName: string
  hasChanges: boolean
  additions: number
  deletions: number
  lines: DiffLine[]
}

export function computeDiff(
  oldContent: string,
  newContent: string,
  fileName: string,
): FileDiff {
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')

  const lines: DiffLine[] = []
  let additions = 0
  let deletions = 0

  // Simple line-by-line diff using longest common subsequence
  const lcs = buildLCS(oldLines, newLines)
  let oldIdx = 0
  let newIdx = 0

  for (const [lcsOld, lcsNew] of lcs) {
    // Lines removed (in old but before next common line)
    while (oldIdx < lcsOld) {
      lines.push({ type: 'remove', content: oldLines[oldIdx] })
      deletions++
      oldIdx++
    }
    // Lines added (in new but before next common line)
    while (newIdx < lcsNew) {
      lines.push({ type: 'add', content: newLines[newIdx] })
      additions++
      newIdx++
    }
    // Common line
    lines.push({ type: 'context', content: oldLines[oldIdx] })
    oldIdx++
    newIdx++
  }

  // Remaining lines after last common line
  while (oldIdx < oldLines.length) {
    lines.push({ type: 'remove', content: oldLines[oldIdx] })
    deletions++
    oldIdx++
  }
  while (newIdx < newLines.length) {
    lines.push({ type: 'add', content: newLines[newIdx] })
    additions++
    newIdx++
  }

  return {
    fileName,
    hasChanges: additions > 0 || deletions > 0,
    additions,
    deletions,
    lines,
  }
}

function buildLCS(a: string[], b: string[]): [number, number][] {
  const m = a.length
  const n = b.length

  // DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  )

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to find the matched indices
  const result: [number, number][] = []
  let i = m
  let j = n

  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.unshift([i - 1, j - 1])
      i--
      j--
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }

  return result
}

export function formatDiff(diff: FileDiff, context = 3): string {
  if (!diff.hasChanges) {
    return chalk.dim(`  ${diff.fileName}: no changes`)
  }

  const output: string[] = []
  output.push(
    chalk.bold(`  ${diff.fileName}`) +
      chalk.green(` +${diff.additions}`) +
      chalk.red(` -${diff.deletions}`),
  )

  // Show only hunks with changes + surrounding context lines
  const changeIndices = new Set<number>()
  diff.lines.forEach((line, idx) => {
    if (line.type !== 'context') {
      for (
        let c = Math.max(0, idx - context);
        c <= Math.min(diff.lines.length - 1, idx + context);
        c++
      ) {
        changeIndices.add(c)
      }
    }
  })

  let lastPrinted = -1

  for (const idx of Array.from(changeIndices).sort((a, b) => a - b)) {
    if (lastPrinted !== -1 && idx > lastPrinted + 1) {
      output.push(chalk.dim('    ...'))
    }

    const line = diff.lines[idx]
    if (line.type === 'add') {
      output.push(chalk.green(`    + ${line.content}`))
    } else if (line.type === 'remove') {
      output.push(chalk.red(`    - ${line.content}`))
    } else {
      output.push(chalk.dim(`      ${line.content}`))
    }

    lastPrinted = idx
  }

  return output.join('\n')
}

export function formatDiffSummary(diffs: FileDiff[]): string {
  const changed = diffs.filter((d) => d.hasChanges)

  if (changed.length === 0) {
    return chalk.dim('  No changes detected')
  }

  const totalAdd = changed.reduce((sum, d) => sum + d.additions, 0)
  const totalDel = changed.reduce((sum, d) => sum + d.deletions, 0)

  return (
    `  ${changed.length} file(s) changed: ` +
    chalk.green(`+${totalAdd}`) +
    ' ' +
    chalk.red(`-${totalDel}`)
  )
}
