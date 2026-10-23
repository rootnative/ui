import {
  Button,
  Column,
  Container,
  Row,
  Switch,
  TextField,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import type { PageAlternate, PageMeta } from '@rootnative/seo'
import { PageHead } from '@rootnative/seo/expo-router'
import { Link } from 'expo-router'
import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'

export type Language = 'en' | 'de'

/**
 * Every language version of the page, in one order, on each version. The
 * first entry is also the `x-default`.
 */
const ALTERNATES: PageAlternate[] = [
  { lang: 'en', url: '/i18n' },
  { lang: 'de', url: '/de/i18n' },
]

const COPY: Record<
  Language,
  {
    url: string
    locale: string
    title: string
    description: string
    other: { label: string; url: string }
    name: string
    email: string
    digest: string
    subscribe: string
  }
> = {
  en: {
    url: '/i18n',
    locale: 'en_US',
    title: 'One page in two languages',
    description:
      'The same screen in English and German. Each version links the other with hreflang, and the sitemap lists both.',
    other: { label: 'Deutsch', url: '/de/i18n' },
    name: 'Name',
    email: 'Email',
    digest: 'Weekly digest',
    subscribe: 'Subscribe',
  },
  de: {
    url: '/de/i18n',
    locale: 'de_DE',
    title: 'Eine Seite in zwei Sprachen',
    description:
      'Derselbe Bildschirm auf Englisch und Deutsch. Jede Version verlinkt die andere mit hreflang, und die Sitemap nennt beide.',
    other: { label: 'English', url: '/i18n' },
    name: 'Name',
    email: 'E-Mail',
    digest: 'Wöchentliche Übersicht',
    subscribe: 'Abonnieren',
  },
}

/** The head of the i18n demo in one language. */
export function i18nMeta(language: Language): PageMeta {
  const copy = COPY[language]
  return {
    title: copy.title,
    description: copy.description,
    url: copy.url,
    locale: copy.locale,
    alternates: ALTERNATES,
  }
}

/** The i18n demo in one language. `app/i18n.tsx` and `app/de/i18n.tsx` render it. */
export function I18nScreen({ language }: { language: Language }) {
  const theme = useTheme()
  const copy = COPY[language]
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [digest, setDigest] = useState(true)

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
      <PageHead {...i18nMeta(language)} />
      <Container width="medium" p="lg" gap="lg">
        <Column gap="xs">
          <Typography level={2} variant="headlineSmall">
            {copy.title}
          </Typography>
          <Typography variant="bodyMedium" style={mutedText}>
            {copy.description}
          </Typography>
        </Column>
        <Link href={copy.other.url} asChild>
          <Button variant="tonal" leadingIcon="translate">
            {copy.other.label}
          </Button>
        </Link>
        <Column gap="md">
          <TextField label={copy.name} value={name} onChangeText={setName} />
          <TextField
            label={copy.email}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
          />
          <Row align="center" justify="space-between">
            <Typography variant="bodyLarge">{copy.digest}</Typography>
            <Switch
              value={digest}
              onValueChange={setDigest}
              accessibilityLabel={copy.digest}
            />
          </Row>
          <Button variant="filled">{copy.subscribe}</Button>
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
