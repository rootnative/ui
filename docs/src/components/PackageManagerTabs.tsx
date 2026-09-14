import CodeBlock from '@theme/CodeBlock'
import TabItem from '@theme/TabItem'
import Tabs from '@theme/Tabs'

function toYarn(cmd: string): string {
  return cmd
    .replace(/^npm install\b/, 'yarn add')
    .replace(/^npm run /, 'yarn ')
    .replace(/^npx /, 'yarn dlx ')
}

function toPnpm(cmd: string): string {
  return cmd
    .replace(/^npm install\b/, 'pnpm add')
    .replace(/^npm run /, 'pnpm ')
    .replace(/^npx /, 'pnpm dlx ')
}

export default function PackageManagerTabs({ cmd }: { cmd: string }) {
  const lines = cmd.trim().split('\n')
  const yarnCode = lines.map(toYarn).join('\n')
  const npmCode = lines.map((l) => l.trim()).join('\n')
  const pnpmCode = lines.map(toPnpm).join('\n')

  return (
    <Tabs groupId="package-manager" defaultValue="yarn">
      <TabItem value="yarn" label="yarn">
        <CodeBlock language="bash">{yarnCode}</CodeBlock>
      </TabItem>
      <TabItem value="npm" label="npm">
        <CodeBlock language="bash">{npmCode}</CodeBlock>
      </TabItem>
      <TabItem value="pnpm" label="pnpm">
        <CodeBlock language="bash">{pnpmCode}</CodeBlock>
      </TabItem>
    </Tabs>
  )
}
