import { Button, Column, Container, Typography } from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { PageHead } from '@rootnative/seo/expo-router'
import { Link } from 'expo-router'
import { useMemo } from 'react'
import { ScrollView, StyleSheet } from 'react-native'

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
      {/* The host serves this page at every unknown path, so it has no
          canonical URL. No `url` means no canonical link and no share card. */}
      <PageHead title="Page not found" noindex />
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
