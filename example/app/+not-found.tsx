import { Button, Column, Container, Typography } from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import type { PageMeta } from '@rootnative/seo'
import { PageHead } from '@rootnative/seo/expo-router'
import { Link } from 'expo-router'
import { useMemo } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { pageMetadata } from '../src/metadata'

// The host serves this page at every unknown path, so it has no canonical
// URL. No `url` means no canonical link and no share card.
const NOT_FOUND_META: PageMeta = { title: 'Page not found', noindex: true }

// Expo SDK 58 does not call this for `+not-found`: the export skips internal
// routes. `scripts/write-seo.mjs` writes the head of the export from a copy
// of this meta, so change the two together.
export function generateMetadata() {
  return pageMetadata(NOT_FOUND_META)
}

export default function NotFoundScreen() {
  const theme = useTheme()

  const scrollStyle = useMemo(
    () => [styles.scroll, { backgroundColor: theme.colors.surface }],
    [theme],
  )
  const mutedText = useMemo(
    () => ({ color: theme.colors.onSurfaceVariant }),
    [theme],
  )

  return (
    <ScrollView contentContainerStyle={scrollStyle}>
      <PageHead {...NOT_FOUND_META} />
      <Container width="expanded" p="lg" gap="lg">
        <Column gap="xs">
          <Typography level={2} variant="headlineSmall">
            Page not found
          </Typography>
          <Typography variant="bodyMedium" style={mutedText}>
            This address has no demo. Every component starts from the home page.
          </Typography>
        </Column>
        <Link href="/" replace asChild>
          <Button variant="filled" leadingIcon="arrow-left">
            Back to the home page
          </Button>
        </Link>
      </Container>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
})
