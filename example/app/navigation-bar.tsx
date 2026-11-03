import {
  Card,
  Column,
  Container,
  NavigationBar,
  type NavigationBarItem,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { catalogMetadata } from '../src/metadata'
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

// A nested `SafeAreaProvider` measures the insets of its own frame, so the
// capsule keeps its gap to the frame and not to the window.
function FloatingDemo() {
  const [destination, setDestination] = useState('home')

  return (
    <SafeAreaProvider style={styles.floatingFrame}>
      <ScrollView
        nestedScrollEnabled
        contentContainerStyle={styles.floatingScrollContent}
      >
        <Typography variant="bodyMedium">{PANELS[destination]}</Typography>
        {Array.from({ length: 12 }, (_, index) => (
          <Typography key={index} variant="bodyMedium">
            Scroll content row {index + 1}
          </Typography>
        ))}
      </ScrollView>
      <NavigationBar
        variant="floating"
        items={DESTINATIONS}
        value={destination}
        onValueChange={setDestination}
        accessibilityLabel="Floating navigation"
      />
    </SafeAreaProvider>
  )
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
      <Container width="expanded" p="lg" gap="xl">
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
                accessibilityLabel="Main navigation"
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
                accessibilityLabel="Selected labels only"
              />
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">No labels</Typography>
          <Card variant="outlined">
            <NavigationBar
              labelVisibility="never"
              items={DESTINATIONS}
              accessibilityLabel="No labels"
            />
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Floating</Typography>
          <Card variant="outlined">
            <Column gap="sm">
              <Column p="md">
                <Typography variant="bodySmall" style={mutedText}>
                  variant=&quot;floating&quot; is a capsule over the content,
                  16dp from the edges, with an icon for each destination. The
                  label is the screen-reader name.
                </Typography>
              </Column>
              <FloatingDemo />
            </Column>
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
                accessibilityLabel="Disabled and overrides"
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
      </Container>
    </ScrollView>
  )
}

export function generateMetadata() {
  return catalogMetadata('/navigation-bar')
}

export default function NavigationBarScreen() {
  return <NavigationBarScreenContent />
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  floatingFrame: {
    flex: 0,
    height: 320,
    overflow: 'hidden',
  },
  // 16 of padding plus the 64dp capsule and its 16dp gap, so the last row
  // scrolls clear of it.
  floatingScrollContent: {
    padding: 16,
    paddingBottom: 112,
    rowGap: 16,
  },
})
