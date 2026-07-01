import path from 'node:path'
import fs from 'fs-extra'

const CLAUDE_MD = 'CLAUDE.md'

// Presence of this path in CLAUDE.md means the pointer is already there
const POINTER_MARKER = '@rootnative/components/llms.txt'

export const LLM_DOCS_POINTER = `## RootNative UI docs for AI agents

This project uses RootNative UI (\`@rootnative/*\`). LLM-optimized docs:

- \`node_modules/@rootnative/components/llms.txt\` — all component props for the exact installed version (works offline)
- \`node_modules/@rootnative/core/llms.txt\` — theme system API (\`ThemeProvider\`, \`useTheme\`, \`defineTheme\`)
- https://rootnative.github.io/ui/llms.txt — hosted overview (latest release)
- https://rootnative.github.io/ui/llms-full.txt — hosted complete API reference (latest release)

Prefer the \`node_modules\` copies — they match the installed version exactly.
`

export type LlmDocsPointerResult = 'created' | 'appended' | 'already-present'

/**
 * Creates CLAUDE.md with the RootNative LLM-docs pointer, or appends the
 * pointer section to an existing CLAUDE.md. No-op when the file already
 * references the RootNative llms.txt docs.
 */
export async function ensureLlmDocsPointer(
  cwd: string,
): Promise<LlmDocsPointerResult> {
  const filePath = path.join(cwd, CLAUDE_MD)

  if (!(await fs.pathExists(filePath))) {
    await fs.outputFile(filePath, `# CLAUDE.md\n\n${LLM_DOCS_POINTER}`)
    return 'created'
  }

  const existing = await fs.readFile(filePath, 'utf8')

  if (existing.includes(POINTER_MARKER)) {
    return 'already-present'
  }

  const separator = existing.endsWith('\n') ? '\n' : '\n\n'
  await fs.outputFile(filePath, `${existing}${separator}${LLM_DOCS_POINTER}`)
  return 'appended'
}
