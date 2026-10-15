import {
  Button,
  Column,
  Container,
  Row,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { resolveUrl } from '@rootnative/seo'
import { PageHead } from '@rootnative/seo/expo-router'
import { breadcrumbList } from '@rootnative/seo/schema'
import { Link, useLocalSearchParams } from 'expo-router'
import { useMemo } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { findEntry } from '../../src/catalog'
import { findShowcase, showcaseEntries } from '../../src/showcase'
import { site } from '../../src/site'

/**
 * One HTML file per entry at export time. Without this the static export
 * writes the route template only, and a crawler finds no page.
 */
export function generateStaticParams() {
  return showcaseEntries.map(({ slug }) => ({ slug }))
}

export default function ShowcaseScreen() {
  const theme = useTheme()
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const entry = findShowcase(slug)

  const scrollStyle = useMemo(
    () => [styles.scroll, { backgroundColor: theme.colors.surface }],
    [theme],
  )
  const mutedText = useMemo(
    () => ({ color: theme.colors.onSurfaceVariant }),
    [theme],
  )

  if (!entry) {
    return (
      <ScrollView contentContainerStyle={scrollStyle}>
        {/* The route template, or a slug outside the list: no page to index. */}
        <PageHead title="Showcase not found" noindex />
        <Container width="expanded" p="lg" gap="lg">
          <Typography level={2} variant="headlineSmall">
            Showcase not found
          </Typography>
          <Link href="/showcase" replace asChild>
            <Button variant="filled" leadingIcon="arrow-left">
              All showcases
            </Button>
          </Link>
        </Container>
      </ScrollView>
    )
  }

  const url = `/showcase/${entry.slug}`
  return (
    <ScrollView contentContainerStyle={scrollStyle}>
      <PageHead
        title={entry.title}
        description={entry.description}
        url={url}
        jsonLd={[
          breadcrumbList([
            { name: 'Home', url: resolveUrl(site, '/') },
            { name: 'Showcase', url: resolveUrl(site, '/showcase') },
            { name: entry.title, url: resolveUrl(site, url) },
          ]),
        ]}
      />
      <Container width="expanded" p="lg" gap="lg">
        <Column gap="xs">
          <Typography level={2} variant="headlineSmall">
            {entry.title}
          </Typography>
          <Typography variant="bodyMedium" style={mutedText}>
            {entry.description}
          </Typography>
        </Column>
        <Column gap="sm">
          <Typography level={3} variant="titleMedium">
            Built with
          </Typography>
          <Row gap="sm" wrap>
            {entry.components.map((route) => {
              const component = findEntry(`/${route}`)
              if (!component) return null
              return (
                <Link key={route} href={component.route} asChild>
                  <Button variant="tonal" size="small">
                    {component.label}
                  </Button>
                </Link>
              )
            })}
          </Row>
        </Column>
        <Link href="/showcase" asChild>
          <Button variant="text" leadingIcon="arrow-left">
            All showcases
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
