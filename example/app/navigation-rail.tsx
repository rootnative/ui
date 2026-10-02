import {
  Card,
  Column,
  FAB,
  IconButton,
  NavigationRail,
  Row,
  Typography,
  type NavigationRailItem,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { ScreenIntro } from '../src/ScreenIntro'
import { ScreenNavFooter } from '../src/ScreenNavFooter'

const DESTINATIONS: NavigationRailItem[] = [
  { value: 'home', label: 'Home', icon: 'home-outline', selectedIcon: 'home' },
  { value: 'search', label: 'Search', icon: 'magnify' },
  { value: 'library', label: 'Library', icon: 'bookshelf', badge: 3 },
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

function NavigationRailScreenContent() {
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
  const panelStyle = useMemo(
    () => [styles.panel, { backgroundColor: theme.colors.surfaceContainer }],
    [theme],
  )

  const header = (
    <Column gap="sm" align="center">
      <IconButton icon="menu" accessibilityLabel="Open menu" />
      <FAB
        icon="pencil-outline"
        variant="tertiary"
        accessibilityLabel="Compose"
      />
    </Column>
  )

  return (
    <ScrollView contentContainerStyle={scrollStyle}>
      <Column gap="xl" style={styles.container}>
        <ScreenIntro />
        <Column gap="sm">
          <Typography variant="titleMedium">With a header</Typography>
          <Card variant="outlined">
            <Row style={styles.frame}>
              <NavigationRail
                items={DESTINATIONS}
                value={destination}
                onValueChange={setDestination}
                header={header}
              />
              <Column p="md" gap="xs" style={panelStyle}>
                <Typography variant="bodyMedium">
                  {PANELS[destination]}
                </Typography>
                <Typography variant="bodySmall" style={mutedText}>
                  NavigationRail is a rail, not a navigator — the panel is this
                  screen&apos;s own state. The header holds the menu button and
                  the FAB, per MD3.
                </Typography>
              </Column>
            </Row>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">
            Centred, selected label only
          </Typography>
          <Card variant="outlined">
            <Row style={styles.frame}>
              <NavigationRail
                items={DESTINATIONS}
                defaultValue="search"
                align="center"
                labelVisibility="selected"
              />
              <View style={panelStyle} />
            </Row>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">
            Bottom-aligned, no labels
          </Typography>
          <Card variant="outlined">
            <Row style={styles.frame}>
              <NavigationRail
                items={DESTINATIONS}
                align="bottom"
                labelVisibility="never"
              />
              <View style={panelStyle} />
            </Row>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Disabled and overrides</Typography>
          <Card variant="outlined">
            <Row style={styles.frame}>
              <NavigationRail
                containerColor={theme.colors.surfaceContainerLow}
                indicatorColor={theme.colors.tertiaryContainer}
                selectedContentColor={theme.colors.onTertiaryContainer}
                items={[
                  DESTINATIONS[0],
                  DESTINATIONS[1],
                  { ...DESTINATIONS[2], disabled: true },
                ]}
              />
              <Column p="md" style={panelStyle}>
                <Typography variant="bodySmall" style={mutedText}>
                  A tinted rail, tertiary-container indicator, and a disabled
                  destination at 38%.
                </Typography>
              </Column>
            </Row>
          </Card>
        </Column>
        <ScreenNavFooter />
      </Column>
    </ScrollView>
  )
}

export default function NavigationRailScreen() {
  return <NavigationRailScreenContent />
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
  frame: {
    height: 420,
    overflow: 'hidden',
  },
  panel: {
    flex: 1,
    alignSelf: 'stretch',
  },
})
