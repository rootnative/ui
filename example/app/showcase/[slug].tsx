import {
  Button,
  Column,
  Container,
  Row,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { resolveUrl } from '@rootnative/seo'
import type { PageMeta } from '@rootnative/seo'
import { Picture } from '@rootnative/seo/expo-image'
import { PageHead } from '@rootnative/seo/expo-router'
import { breadcrumbList } from '@rootnative/seo/schema'
import { Link, useLocalSearchParams } from 'expo-router'
import { useMemo } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { findEntry } from '../../src/catalog'
import { pageMetadata } from '../../src/metadata'
import { findShowcase, showcaseEntries } from '../../src/showcase'
import type { ShowcaseEntry } from '../../src/showcase'
import { site } from '../../src/site'

/**
 * One HTML file per entry at export time. Without this the static export
 * writes the route template only, and a crawler finds no page.
 */
export function generateStaticParams() {
  return showcaseEntries.map(({ slug }) => ({ slug }))
}

// The wireframe lives in `public/showcase/`, which the export copies to the
// root, so the path is under the site URL on the web and on native.
function wireframeOf(entry: ShowcaseEntry) {
  return { src: `/showcase/${entry.slug}.svg`, alt: `${entry.title} wireframe` }
}

function showcaseMeta(entry: ShowcaseEntry | undefined): PageMeta {
  // The route template, or a slug outside the list: no page to index.
  if (!entry) {
    return { title: 'Showcase not found', noindex: true }
  }
  const url = `/showcase/${entry.slug}`
  const wireframe = wireframeOf(entry)
  return {
    title: entry.title,
    description: entry.description,
    url,
    image: wireframe.src,
    imageSize: { width: 600, height: 360 },
    imageAlt: wireframe.alt,
    jsonLd: [
      breadcrumbList([
        { name: 'Home', url: resolveUrl(site, '/') },
        { name: 'Showcase', url: resolveUrl(site, '/showcase') },
        { name: entry.title, url: resolveUrl(site, url) },
      ]),
    ],
  }
}

export function generateMetadata(_request: unknown, params: { slug?: string }) {
  return pageMetadata(showcaseMeta(findShowcase(params.slug)))
}

export default function ShowcaseScreen() {
  const theme = useTheme()
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const entry = findShowcase(slug)
  const meta = showcaseMeta(entry)

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
        <PageHead {...meta} />
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

  const wireframe = wireframeOf(entry)
  return (
    <ScrollView contentContainerStyle={scrollStyle}>
      <PageHead {...meta} />
      <Container width="expanded" p="lg" gap="lg">
        <Column gap="xs">
          <Typography level={2} variant="headlineSmall">
            {entry.title}
          </Typography>
          <Typography variant="bodyMedium" style={mutedText}>
            {entry.description}
          </Typography>
        </Column>
        {/* A real `<img>` on the export, with its text and its size. */}
        <Picture
          source={wireframe.src}
          alt={wireframe.alt}
          width={600}
          height={360}
          contentFit="contain"
          loading="eager"
          style={styles.picture}
        />
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
  picture: {
    width: '100%',
    maxWidth: 600,
    height: undefined,
    aspectRatio: 600 / 360,
    borderRadius: 24,
  },
})
