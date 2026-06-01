import Link from '@docusaurus/Link'
import { useColorMode } from '@docusaurus/theme-common'
import CodeBlock from '@theme/CodeBlock'
import { useState } from 'react'

const COMPONENTS_VERSION = '0.0.0-alpha.0'

const DEFAULT_DEPENDENCIES = [
  `@rootnative/components@${COMPONENTS_VERSION}`,
  `@rootnative/core@${COMPONENTS_VERSION}`,
  '@material/material-color-utilities@^0.4.0',
  '@expo/vector-icons@^15.0.3',
  'react-native-safe-area-context@~5.6.0',
].join(',')

type SnackPlatform = 'ios' | 'android' | 'web' | 'mydevice'

interface SnackExampleProps {
  code: string
  name?: string
  description?: string
  dependencies?: string
  platform?: SnackPlatform
  sdkVersion?: string
  height?: number
}

export default function SnackExample({
  code,
  name = 'RootNative UI Example',
  description,
  dependencies,
  platform,
  sdkVersion,
  height = 500,
}: SnackExampleProps) {
  const [showPreview, setShowPreview] = useState(false)
  const { colorMode } = useColorMode()

  const trimmed = code.replace(/^\n+|\n+$/g, '')
  const mergedDeps = dependencies
    ? `${DEFAULT_DEPENDENCIES},${dependencies}`
    : DEFAULT_DEPENDENCIES

  const baseParams = new URLSearchParams({
    code: trimmed,
    name,
    dependencies: mergedDeps,
    supportedPlatforms: 'ios,android,web',
  })
  if (description) baseParams.set('description', description)
  if (sdkVersion) baseParams.set('sdkVersion', sdkVersion)

  const openParams = new URLSearchParams(baseParams)
  openParams.set('platform', platform ?? 'android')
  const fullUrl = `https://snack.expo.dev/?${openParams.toString()}`

  const embedParams = new URLSearchParams(baseParams)
  embedParams.set('platform', platform ?? 'web')
  embedParams.set('preview', 'true')
  embedParams.set('theme', colorMode === 'dark' ? 'dark' : 'light')
  embedParams.set('hideQueryParams', 'true')
  const embedUrl = `https://snack.expo.dev/embedded?${embedParams.toString()}`

  return (
    <div className="snack-example">
      <div className="snack-example__actions">
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="snack-example__button"
          aria-expanded={showPreview}
        >
          {showPreview ? 'Hide preview' : 'Run preview'}
        </button>
        <Link
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="snack-example__link"
        >
          Open on Snack ↗
        </Link>
      </div>
      {showPreview ? (
        <iframe
          src={embedUrl}
          title={name}
          loading="lazy"
          className="snack-example__iframe"
          style={{ height }}
          allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone"
        />
      ) : (
        <CodeBlock language="tsx">{trimmed}</CodeBlock>
      )}
    </div>
  )
}
