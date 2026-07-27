import {
  Button,
  Column,
  Divider,
  IconButton,
  Row,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { usePathname } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Linking, Platform, StyleSheet } from 'react-native'
import { DOCS_BASE_URL, findEntry } from './catalog'
import { canCopy, copyToClipboard } from './clipboard'

const COPIED_RESET_MS = 1600

const monoFontFamily = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'ui-monospace, SFMono-Regular, Menlo, monospace',
})

/**
 * Header block for a component demo screen: title, one-line description, the
 * `rootnative add` command, and a link to the component's docs page.
 *
 * Takes no props — it resolves the current route against the catalog, so a
 * screen only has to render it as the first child of its scroll content.
 * Renders nothing on a route that isn't in the catalog.
 */
export function ScreenIntro() {
  const theme = useTheme()
  const pathname = usePathname()
  const entry = useMemo(() => findEntry(pathname), [pathname])
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )

  useEffect(() => {
    return () => clearTimeout(resetTimer.current)
  }, [])

  const command = entry?.add ? `npx rootnative add ${entry.add}` : undefined
  const docsPath = entry?.docs

  const handleCopy = useCallback(async () => {
    if (!command || !(await copyToClipboard(command))) {
      return
    }

    setCopied(true)
    clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS)
  }, [command])

  const handleOpenDocs = useCallback(() => {
    if (docsPath) {
      Linking.openURL(`${DOCS_BASE_URL}${docsPath}`)
    }
  }, [docsPath])

  const showCopyButton = canCopy()
  const commandSurfaceStyle = useMemo(
    () => ({ backgroundColor: theme.colors.surfaceContainerHigh }),
    [theme.colors.surfaceContainerHigh],
  )
  const commandTextStyle = useMemo(() => ({ fontFamily: monoFontFamily }), [])

  if (!entry) {
    return null
  }

  return (
    <Column gap="md">
      <Column gap="xs">
        <Typography variant="headlineSmall">{entry.label}</Typography>
        <Typography variant="bodyMedium" color={theme.colors.onSurfaceVariant}>
          {entry.description}
        </Typography>
      </Column>

      <Row gap="sm" align="center" wrap>
        {command ? (
          <Row
            gap="xs"
            align="center"
            style={[
              styles.commandSurface,
              showCopyButton
                ? styles.commandSurfaceWithCopy
                : styles.commandSurfacePlain,
              commandSurfaceStyle,
            ]}
          >
            <Typography
              variant="bodySmall"
              selectable
              color={theme.colors.onSurfaceVariant}
              style={commandTextStyle}
              numberOfLines={1}
            >
              {command}
            </Typography>
            {showCopyButton ? (
              <IconButton
                icon={copied ? 'check' : 'content-copy'}
                size="xs"
                onPress={handleCopy}
                accessibilityLabel={
                  copied ? 'Command copied' : `Copy "${command}"`
                }
              />
            ) : null}
          </Row>
        ) : null}

        {docsPath ? (
          <Button
            variant="text"
            size="s"
            trailingIcon="open-in-new"
            onPress={handleOpenDocs}
            accessibilityLabel={`Open the ${entry.label} documentation`}
          >
            Docs
          </Button>
        ) : null}
      </Row>

      <Divider />
    </Column>
  )
}

const styles = StyleSheet.create({
  commandSurface: {
    borderRadius: 8,
    minHeight: 40,
    maxWidth: '100%',
    paddingStart: 12,
  },
  // The copy button carries its own touch padding, so the end inset shrinks.
  commandSurfaceWithCopy: {
    paddingEnd: 4,
  },
  commandSurfacePlain: {
    paddingEnd: 12,
  },
})
