import {
  BottomAppBar,
  type BottomAppBarAction,
  Card,
  Column,
  Container,
  IconButton,
  Menu,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { catalogMetadata } from '../src/metadata'
import { ScreenIntro } from '../src/ScreenIntro'
import { ScreenNavFooter } from '../src/ScreenNavFooter'

const ACTIONS: BottomAppBarAction[] = [
  { icon: 'magnify', accessibilityLabel: 'Search' },
  { icon: 'archive-outline', accessibilityLabel: 'Archive' },
  { icon: 'delete-outline', accessibilityLabel: 'Delete' },
]

function BottomAppBarScreenContent() {
  const theme = useTheme()
  const [lastPress, setLastPress] = useState('Nothing pressed yet.')

  const scrollStyle = useMemo(
    () => [styles.scroll, { backgroundColor: theme.colors.surface }],
    [theme],
  )
  const mutedText = useMemo(
    () => ({ color: theme.colors.onSurfaceVariant }),
    [theme],
  )
  const actions = useMemo(
    () =>
      ACTIONS.map((action) => ({
        ...action,
        onPress: () => setLastPress(`${action.accessibilityLabel} pressed.`),
      })),
    [],
  )

  return (
    <ScrollView contentContainerStyle={scrollStyle}>
      <Container width="expanded" p="lg" gap="xl">
        <ScreenIntro />
        <Column gap="sm">
          <Typography variant="titleMedium">Actions and a FAB</Typography>
          <Card variant="outlined">
            <Column gap="sm">
              <Column p="md" gap="xs">
                <Typography variant="bodyMedium">{lastPress}</Typography>
                <Typography variant="bodySmall" style={mutedText}>
                  Up to four icon actions at the start and a flat secondary FAB
                  at the end. In a real app shell, pass insetBottom to clear the
                  home indicator.
                </Typography>
              </Column>
              <BottomAppBar
                actions={actions}
                fab={{
                  icon: 'plus',
                  accessibilityLabel: 'Compose',
                  onPress: () => setLastPress('Compose pressed.'),
                }}
              />
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Extended FAB</Typography>
          <Card variant="outlined">
            <Column gap="sm">
              <Column p="md">
                <Typography variant="bodySmall" style={mutedText}>
                  A label makes the FAB extended, and variant changes its
                  colors.
                </Typography>
              </Column>
              <BottomAppBar
                actions={actions.slice(0, 2)}
                fab={{
                  icon: 'pencil-outline',
                  label: 'Compose',
                  variant: 'tertiary',
                  onPress: () => setLastPress('Compose pressed.'),
                }}
              />
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Actions only</Typography>
          <Card variant="outlined">
            <BottomAppBar actions={actions} />
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Custom leading content</Typography>
          <Card variant="outlined">
            <Column gap="sm">
              <Column p="md">
                <Typography variant="bodySmall" style={mutedText}>
                  leading replaces actions for content they cannot build, such
                  as a Menu anchor.
                </Typography>
              </Column>
              <BottomAppBar
                leading={
                  <Menu
                    anchor={
                      <IconButton
                        icon="dots-vertical"
                        accessibilityLabel="More"
                      />
                    }
                  >
                    <Menu.Item
                      label="Settings"
                      onPress={() => setLastPress('Settings pressed.')}
                    />
                    <Menu.Item
                      label="Help"
                      onPress={() => setLastPress('Help pressed.')}
                    />
                  </Menu>
                }
                fab={{
                  icon: 'plus',
                  accessibilityLabel: 'Add',
                  onPress: () => setLastPress('Add pressed.'),
                }}
              />
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Overrides</Typography>
          <Card variant="outlined">
            <Column gap="sm">
              <Column p="md">
                <Typography variant="bodySmall" style={mutedText}>
                  A tinted bar with tinted action icons, and a disabled action
                  at 38%.
                </Typography>
              </Column>
              <BottomAppBar
                containerColor={theme.colors.primaryContainer}
                contentColor={theme.colors.onPrimaryContainer}
                actions={[
                  actions[0],
                  actions[1],
                  { ...actions[2], disabled: true },
                ]}
                fab={{
                  icon: 'plus',
                  accessibilityLabel: 'Add',
                  onPress: () => setLastPress('Add pressed.'),
                }}
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
  return catalogMetadata('/bottom-app-bar')
}

export default function BottomAppBarScreen() {
  return <BottomAppBarScreenContent />
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
})
