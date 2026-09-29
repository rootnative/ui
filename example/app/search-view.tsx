import {
  Column,
  List,
  ListItem,
  SearchBar,
  SearchView,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { useMemo, useRef, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { ScreenIntro } from '../src/ScreenIntro'
import { ScreenNavFooter } from '../src/ScreenNavFooter'

const SUGGESTIONS = [
  'Hiking trails near me',
  'Weekend weather',
  'Trail running shoes',
  'Campsites with water',
  'Sunrise times',
]

export default function SearchViewScreen() {
  const theme = useTheme()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [lastSearch, setLastSearch] = useState<string | null>(null)
  const anchorRef = useRef<View>(null)

  const captionStyle = useMemo(
    () => ({ color: theme.colors.onSurfaceVariant }),
    [theme.colors.onSurfaceVariant],
  )

  const matches = query
    ? SUGGESTIONS.filter((item) =>
        item.toLowerCase().includes(query.toLowerCase()),
      )
    : SUGGESTIONS

  const search = (text: string) => {
    setLastSearch(text)
    setOpen(false)
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ScreenIntro />

      <Column gap="md">
        <Typography variant="titleSmall">Opens from a bar</Typography>
        <View ref={anchorRef}>
          <SearchBar
            placeholder="Search trails"
            value={query}
            onChangeText={setQuery}
            onPress={() => setOpen(true)}
          />
        </View>
        <Typography variant="bodySmall" style={captionStyle}>
          {lastSearch === null
            ? 'Press the bar to open the view. It is full screen on a phone and docked on a wider window.'
            : `Last search: "${lastSearch}"`}
        </Typography>
      </Column>

      <SearchView
        visible={open}
        onDismiss={() => setOpen(false)}
        anchor={anchorRef}
        placeholder="Search trails"
        value={query}
        onChangeText={setQuery}
        onSearch={search}
        actions={[
          {
            icon: 'microphone',
            accessibilityLabel: 'Voice search',
            onPress: () => setQuery('hiking'),
          },
        ]}
        testID="search-view"
      >
        <List>
          {matches.map((item) => (
            <ListItem
              key={item}
              headlineText={item}
              onPress={() => {
                setQuery(item)
                search(item)
              }}
            />
          ))}
        </List>
      </SearchView>

      <ScreenNavFooter />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingBottom: 120,
    rowGap: 28,
  },
})
