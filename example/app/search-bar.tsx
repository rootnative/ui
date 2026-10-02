import {
  Avatar,
  Column,
  KeyboardAvoidingWrapper,
  SearchBar,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { useMemo, useState } from 'react'
import { StyleSheet } from 'react-native'
import { ScreenIntro } from '../src/ScreenIntro'
import { ScreenNavFooter } from '../src/ScreenNavFooter'

export default function SearchBarScreen() {
  const theme = useTheme()
  const [query, setQuery] = useState('')
  const [lastSearch, setLastSearch] = useState<string | null>(null)
  const [voiceQuery, setVoiceQuery] = useState('')

  const captionStyle = useMemo(
    () => ({ color: theme.colors.onSurfaceVariant }),
    [theme.colors.onSurfaceVariant],
  )

  return (
    <KeyboardAvoidingWrapper
      scrollViewProps={{ bounces: false }}
      contentContainerStyle={styles.content}
    >
      <ScreenIntro />

      <Column gap="md">
        <Typography variant="titleSmall">Default</Typography>
        <SearchBar
          placeholder="Search mail"
          value={query}
          onChangeText={setQuery}
          onSearch={setLastSearch}
        />
        <Typography variant="bodySmall" style={captionStyle}>
          {lastSearch === null
            ? 'Type a query and press the Search key.'
            : `Last search: "${lastSearch}"`}
        </Typography>
      </Column>

      <Column gap="md">
        <Typography variant="titleSmall">Navigation icon</Typography>
        <SearchBar
          placeholder="Search in drive"
          leadingIcon="menu"
          onLeadingIconPress={() => {}}
          leadingIconAccessibilityLabel="Open menu"
        />
      </Column>

      <Column gap="md">
        <Typography variant="titleSmall">Trailing actions</Typography>
        <SearchBar
          placeholder="Search"
          value={voiceQuery}
          onChangeText={setVoiceQuery}
          actions={[
            {
              icon: 'microphone',
              accessibilityLabel: 'Voice search',
              onPress: () => setVoiceQuery('hiking trails'),
            },
          ]}
        />
      </Column>

      <Column gap="md">
        <Typography variant="titleSmall">Dense</Typography>
        <SearchBar placeholder="Search, 40dp" density={-4} />
        <Typography variant="bodySmall" style={captionStyle}>
          density -4 for a desktop toolbar. Each step removes 4dp.
        </Typography>
      </Column>

      <Column gap="md">
        <Typography variant="titleSmall">Avatar</Typography>
        <SearchBar
          placeholder="Search contacts"
          trailing={<Avatar size="extraSmall" label="JD" />}
        />
      </Column>

      <Column gap="md">
        <Typography variant="titleSmall">Custom colors</Typography>
        <SearchBar
          placeholder="Search"
          containerColor={theme.colors.primaryContainer}
          contentColor={theme.colors.onPrimaryContainer}
          placeholderTextColor={theme.colors.onPrimaryContainer}
        />
      </Column>

      <Column gap="md">
        <Typography variant="titleSmall">Disabled</Typography>
        <SearchBar placeholder="Search" disabled />
      </Column>

      <ScreenNavFooter />
    </KeyboardAvoidingWrapper>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingBottom: 120,
    rowGap: 28,
  },
})
