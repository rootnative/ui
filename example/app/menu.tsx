import {
  Button,
  Card,
  Column,
  Divider,
  IconButton,
  Menu,
  PortalHost,
  Row,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'

const SORTS = ['Name', 'Date modified', 'Size'] as const

function MenuScreenContent() {
  const theme = useTheme()
  const [lastAction, setLastAction] = useState('nothing yet')
  const [controlledOpen, setControlledOpen] = useState(false)
  const [sort, setSort] = useState<(typeof SORTS)[number]>('Name')
  const [showHidden, setShowHidden] = useState(false)

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
        <Column gap="sm">
          <Typography variant="titleMedium">Self-managing</Typography>
          <Card variant="outlined">
            <Column p="md" gap="sm">
              <Typography variant="bodySmall" style={mutedText}>
                No `visible` prop — Menu hooks the anchor&apos;s press, closes
                on an outside press, on an item press, and on Android back.
              </Typography>
              <Row gap="sm" align="center" justify="space-between">
                <Typography variant="bodyMedium">
                  Last action: {lastAction}
                </Typography>
                <Menu
                  anchor={
                    <IconButton
                      icon="dots-vertical"
                      accessibilityLabel="More actions"
                    />
                  }
                  align="end"
                >
                  <Menu.Item
                    label="Edit"
                    leadingIcon="pencil-outline"
                    onPress={() => setLastAction('Edit')}
                  />
                  <Menu.Item
                    label="Duplicate"
                    leadingIcon="content-copy"
                    onPress={() => setLastAction('Duplicate')}
                  />
                  <Divider />
                  <Menu.Item
                    label="Delete"
                    leadingIcon="trash-can-outline"
                    contentColor={theme.colors.error}
                    onPress={() => setLastAction('Delete')}
                  />
                </Menu>
              </Row>
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Controlled</Typography>
          <Card variant="outlined">
            <Column p="md" gap="sm">
              <Typography variant="bodySmall" style={mutedText}>
                `visible` + `onDismiss` put you in charge. The items below keep
                the menu open with closeOnPress={'{false}'} so you can flip
                several at once.
              </Typography>
              <Row gap="sm" align="center">
                <Menu
                  visible={controlledOpen}
                  onDismiss={() => setControlledOpen(false)}
                  anchor={
                    <Button
                      variant="outlined"
                      trailingIcon="chevron-down"
                      onPress={() => setControlledOpen(true)}
                    >
                      {`Sort: ${sort}`}
                    </Button>
                  }
                >
                  {SORTS.map((option) => (
                    <Menu.Item
                      key={option}
                      label={option}
                      leadingIcon={option === sort ? 'check' : undefined}
                      closeOnPress={false}
                      onPress={() => setSort(option)}
                    />
                  ))}
                  <Divider />
                  <Menu.Item
                    label="Show hidden files"
                    leadingIcon={showHidden ? 'check' : undefined}
                    closeOnPress={false}
                    onPress={() => setShowHidden((prev) => !prev)}
                  />
                  <Menu.Item
                    label="Done"
                    onPress={() => setControlledOpen(false)}
                  />
                </Menu>
              </Row>
              <Typography variant="bodySmall" style={mutedText}>
                Hidden files: {showHidden ? 'shown' : 'hidden'}
              </Typography>
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Placement</Typography>
          <Card variant="outlined">
            <Column p="md" gap="sm">
              <Typography variant="bodySmall" style={mutedText}>
                `side` and `align` are preferences, not commands — a menu that
                would run off the screen flips to the roomier side and shifts
                back inside the edge.
              </Typography>
              <Row gap="sm" wrap>
                <Menu anchor={<Button variant="tonal">Below · start</Button>}>
                  <Menu.Item label="First" />
                  <Menu.Item label="Second" />
                </Menu>
                <Menu
                  align="end"
                  anchor={<Button variant="tonal">Below · end</Button>}
                >
                  <Menu.Item label="First" />
                  <Menu.Item label="Second" />
                </Menu>
                <Menu
                  side="top"
                  align="center"
                  offset={8}
                  anchor={<Button variant="tonal">Above · center</Button>}
                >
                  <Menu.Item label="First" />
                  <Menu.Item label="Second" />
                </Menu>
              </Row>
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Item anatomy</Typography>
          <Card variant="outlined">
            <Column p="md" gap="sm">
              <Typography variant="bodySmall" style={mutedText}>
                Leading icon, label, trailing text, trailing icon, and the
                disabled state at 38%.
              </Typography>
              <Row gap="sm">
                <Menu anchor={<Button variant="outlined">Open</Button>}>
                  <Menu.Item
                    label="New window"
                    leadingIcon="window-maximize"
                    trailingText="⌘N"
                  />
                  <Menu.Item
                    label="Settings"
                    leadingIcon="cog-outline"
                    trailingText="⌘,"
                  />
                  <Menu.Item
                    label="Open recent"
                    leadingIcon="history"
                    trailingIcon="chevron-right"
                  />
                  <Divider />
                  <Menu.Item
                    label="Paste"
                    leadingIcon="content-paste"
                    disabled
                  />
                </Menu>
              </Row>
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Scrolling</Typography>
          <Card variant="outlined">
            <Column p="md" gap="sm">
              <Typography variant="bodySmall" style={mutedText}>
                A menu taller than the space on its side caps at the available
                height and scrolls.
              </Typography>
              <Row gap="sm">
                <Menu anchor={<Button variant="outlined">30 items</Button>}>
                  {Array.from({ length: 30 }, (_, index) => (
                    <Menu.Item key={index} label={`Item ${index + 1}`} />
                  ))}
                </Menu>
              </Row>
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Overrides</Typography>
          <Card variant="outlined">
            <Column p="md" gap="sm">
              <Typography variant="bodySmall" style={mutedText}>
                `containerColor` on the surface, `contentColor` on an item — the
                state layers re-derive from both.
              </Typography>
              <Row gap="sm">
                <Menu
                  containerColor={theme.colors.secondaryContainer}
                  anchor={<Button variant="text">Tinted</Button>}
                >
                  <Menu.Item
                    label="Archive"
                    leadingIcon="archive-outline"
                    contentColor={theme.colors.onSecondaryContainer}
                  />
                  <Menu.Item
                    label="Report"
                    leadingIcon="flag-outline"
                    contentColor={theme.colors.error}
                  />
                </Menu>
              </Row>
            </Column>
          </Card>
        </Column>
      </Column>
    </ScrollView>
  )
}

export default function MenuScreen() {
  return (
    <PortalHost>
      <MenuScreenContent />
    </PortalHost>
  )
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
