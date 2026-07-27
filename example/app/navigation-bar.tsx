import {
  Card,
  Column,
  NavigationBar,
  Typography,
  type NavigationBarItem,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { ScreenIntro } from '../src/ScreenIntro'
import { ScreenNavFooter } from '../src/ScreenNavFooter'

const DESTINATIONS: NavigationBarItem[] = [
  { value: 'home', label: 'Home', icon: 'home-outline', selectedIcon: 'home' },
  { value: 'search', label: 'Search', icon: 'magnify' },
  {
    value: 'library',
    label: 'Library',
    icon: 'bookshelf',
  },
  {
    value: 'profile',
    label: 'Profile',
    icon: 'account-outline',
    selectedIcon: 'account',
  },
]

const PANELS: Record<string, string> = {
  home: 'Fresh picks for you.',
  search: 'Type to find anything.',
  library: 'Everything you saved.',
  profile: 'Your account and settings.',
}

function NavigationBarScreenContent() {
  const theme = useTheme()
  const [destination, setDestination] = useState('home')

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
      <Column gap="xl" style={styles.container}>
        <ScreenIntro />
        <Column gap="sm">
          <Typography variant="titleMedium">Default</Typography>
          <Card variant="outlined">
            <Column gap="sm">
              <Column p="md" gap="xs">
                <Typography variant="bodyMedium">
                  {PANELS[destination]}
                </Typography>
                <Typography variant="bodySmall" style={mutedText}>
                  NavigationBar is a bar, not a navigator — the panel above is
                  this screen&apos;s own state. An active destination swaps to
                  its filled icon when one is given.
                </Typography>
              </Column>
              <NavigationBar
                items={DESTINATIONS}
                value={destination}
                onValueChange={setDestination}
              />
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Selected labels only</Typography>
          <Card variant="outlined">
            <Column gap="sm">
              <Column p="md">
                <Typography variant="bodySmall" style={mutedText}>
                  labelVisibility=&quot;selected&quot; fades the inactive labels
                  out and centres their icons; &quot;never&quot; hides them all.
                </Typography>
              </Column>
              <NavigationBar
                labelVisibility="selected"
                defaultValue="search"
                items={DESTINATIONS}
              />
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">No labels</Typography>
          <Card variant="outlined">
            <NavigationBar labelVisibility="never" items={DESTINATIONS} />
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Disabled and overrides</Typography>
          <Card variant="outlined">
            <Column gap="sm">
              <Column p="md">
                <Typography variant="bodySmall" style={mutedText}>
                  A tinted bar, tertiary-container indicator, and a disabled
                  destination at 38%. In a real app shell, pass insetBottom to
                  clear the home indicator.
                </Typography>
              </Column>
              <NavigationBar
                containerColor={theme.colors.surfaceContainerHigh}
                indicatorColor={theme.colors.tertiaryContainer}
                selectedContentColor={theme.colors.onTertiaryContainer}
                items={[
                  DESTINATIONS[0],
                  DESTINATIONS[1],
                  { ...DESTINATIONS[2], disabled: true },
                ]}
              />
            </Column>
          </Card>
        </Column>
        <ScreenNavFooter />
      </Column>
    </ScrollView>
  )
}

export default function NavigationBarScreen() {
  return <NavigationBarScreenContent />
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    padding: 24,
  },
  container: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
})
