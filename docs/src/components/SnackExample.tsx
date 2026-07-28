import Link from '@docusaurus/Link'
import { useColorMode } from '@docusaurus/theme-common'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import CodeBlock from '@theme/CodeBlock'
import { useMemo, useState } from 'react'

/**
 * RootNative package versions injected by `docusaurus.config.ts`, read from
 * the workspace at build time. Never hardcode them here — a pin in this file
 * boots every live preview on an old release the moment one ships.
 */
interface SnackVersions {
  components: string
  core: string
  inertia: string
}

/** Versioned outside the RootNative release cycle, so pinned by hand. */
const EXTERNAL_DEPENDENCIES = [
  '@material/material-color-utilities@^0.4.0',
  '@expo/vector-icons@^15.0.3',
  'react-native-safe-area-context@~5.6.0',
  // CircularProgress and LoadingIndicator need this at runtime. Declared
  // rather than relying on Snack preloading it with the Expo SDK — those two
  // previews are the only ones that would fail, and silently.
  'react-native-svg@~15.12.1',
]

function useDefaultDependencies(): string {
  const { siteConfig } = useDocusaurusContext()
  const versions = siteConfig.customFields?.snackVersions as
    | SnackVersions
    | undefined

  return useMemo(() => {
    if (!versions) {
      throw new Error(
        'customFields.snackVersions is missing from docusaurus.config.ts — ' +
          'Snack previews cannot resolve @rootnative packages without it.',
      )
    }
    return [
      `@rootnative/components@${versions.components}`,
      `@rootnative/core@${versions.core}`,
      // Required peer of both packages above — Snack resolves from npm and
      // will not pull it in on its own.
      `@rootnative/inertia@${versions.inertia}`,
      ...EXTERNAL_DEPENDENCIES,
    ].join(',')
  }, [versions])
}

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
  const defaultDependencies = useDefaultDependencies()

  const trimmed = code.replace(/^\n+|\n+$/g, '')
  const mergedDeps = dependencies
    ? `${defaultDependencies},${dependencies}`
    : defaultDependencies

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
