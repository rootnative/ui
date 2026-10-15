import { Card, Column, Container, Typography } from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { PageHead } from '@rootnative/seo/expo-router'
import { Link } from 'expo-router'
import { useMemo } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { showcaseEntries } from '../../src/showcase'

const DESCRIPTION =
  'Patterns built from several components, one page each. The pages come from a seeded list through generateStaticParams.'

export default function ShowcaseListScreen() {
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
      <PageHead title="Showcase" description={DESCRIPTION} url="/showcase" />
      <Container width="expanded" p="lg" gap="lg">
        <Column gap="xs">
          <Typography level={2} variant="headlineSmall">
            Showcase
          </Typography>
          <Typography variant="bodyMedium" style={mutedText}>
            {DESCRIPTION}
          </Typography>
        </Column>
        <Column gap="md">
          {showcaseEntries.map((entry) => (
            // `Link asChild` gives the card `href` and `role="link"`, so the
            // export holds a real `<a>` a crawler can follow.
            <Link key={entry.slug} href={`/showcase/${entry.slug}`} asChild>
              <Card variant="outlined">
                <Column px="md" py="sm" gap="xs">
                  <Typography level={3} variant="titleMedium">
                    {entry.title}
                  </Typography>
                  <Typography variant="bodySmall" style={mutedText}>
                    {entry.description}
                  </Typography>
                </Column>
              </Card>
            </Link>
          ))}
        </Column>
      </Container>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
})
