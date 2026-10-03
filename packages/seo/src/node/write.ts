import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/** Writes `content` to `outDir/fileName`, creates the directory, and returns the path. */
export async function writeOutput(
  outDir: string,
  fileName: string,
  content: string,
): Promise<string> {
  await mkdir(outDir, { recursive: true })
  const file = join(outDir, fileName)
  await writeFile(file, content, 'utf8')
  return file
}

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function trimTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}
