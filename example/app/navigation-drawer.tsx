import {
  Button,
  Card,
  Column,
  Container,
  NavigationDrawer,
  Row,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { ScreenIntro } from '../src/ScreenIntro'
import { ScreenNavFooter } from '../src/ScreenNavFooter'

function MailDestinations() {
  return (
    <>
      <NavigationDrawer.Section headline="Mail">
        <NavigationDrawer.Item
          value="inbox"
          label="Inbox"
          icon="inbox-outline"
          selectedIcon="inbox"
          badge={24}
          accessibilityLabel="Inbox, 24 unread"
        />
        <NavigationDrawer.Item
          value="outbox"
          label="Outbox"
          icon="send-outline"
          selectedIcon="send"
        />
        <NavigationDrawer.Item
          value="favorites"
          label="Favorites"
          icon="heart-outline"
          selectedIcon="heart"
        />
        <NavigationDrawer.Item
          value="trash"
          label="Trash"
          icon="trash-can-outline"
          selectedIcon="trash-can"
        />
      </NavigationDrawer.Section>
      <NavigationDrawer.Divider />
      <NavigationDrawer.Section headline="Labels">
        <NavigationDrawer.Item value="family" label="Family" />
        <NavigationDrawer.Item value="school" label="School" />
        <NavigationDrawer.Item value="work" label="Work" disabled />
      </NavigationDrawer.Section>
    </>
  )
}

function NavigationDrawerScreenContent() {
  const theme = useTheme()
  const [open, setOpen] = useState(false)
  const [destination, setDestination] = useState('inbox')
  const [standardDestination, setStandardDestination] = useState('inbox')

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

  return (
    <ScrollView contentContainerStyle={scrollStyle}>
      <Container width="expanded" p="lg" gap="xl">
        <ScreenIntro />
        <Column gap="sm">
          <Typography variant="titleMedium">Modal</Typography>
          <Card variant="outlined">
            <Column p="md" gap="md">
              <Typography variant="bodySmall" style={mutedText}>
                Slides in from the start edge over a scrim and closes when a
                destination is chosen. Active: {destination}.
              </Typography>
              <Row>
                <Button variant="tonal" onPress={() => setOpen(true)}>
                  Open drawer
                </Button>
              </Row>
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Standard</Typography>
          <Card variant="outlined">
            <Row style={styles.frame}>
              <NavigationDrawer
                variant="standard"
                value={standardDestination}
                onValueChange={setStandardDestination}
                style={styles.standardDrawer}
              >
                <Typography variant="titleLarge" style={styles.appTitle}>
                  Mail
                </Typography>
                <MailDestinations />
              </NavigationDrawer>
              <Column p="md" gap="xs" style={panelStyle}>
                <Typography variant="bodyMedium">
                  {standardDestination}
                </Typography>
                <Typography variant="bodySmall" style={mutedText}>
                  A standard drawer renders in place for an expanded window. It
                  is 360dp wide; this one is narrowed with `style` to fit the
                  demo.
                </Typography>
              </Column>
            </Row>
          </Card>
        </Column>
        <ScreenNavFooter />
      </Container>

      <NavigationDrawer
        visible={open}
        onDismiss={() => setOpen(false)}
        value={destination}
        onValueChange={setDestination}
        accessibilityLabel="Main navigation"
      >
        <Typography variant="titleLarge" style={styles.appTitle}>
          Mail
        </Typography>
        <MailDestinations />
      </NavigationDrawer>
    </ScrollView>
  )
}

export default function NavigationDrawerScreen() {
  return <NavigationDrawerScreenContent />
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  frame: {
    height: 520,
    overflow: 'hidden',
  },
  standardDrawer: {
    width: 240,
  },
  appTitle: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  panel: {
    flex: 1,
    alignSelf: 'stretch',
  },
})
