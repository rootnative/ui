import {
  Button,
  Card,
  Column,
  Dialog,
  PortalHost,
  Row,
  TextField,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { ScreenIntro } from '../src/ScreenIntro'
import { ScreenNavFooter } from '../src/ScreenNavFooter'

type OpenDialog = 'basic' | 'icon' | 'persistent' | 'form' | 'fullscreen' | null

function DialogScreenContent() {
  const theme = useTheme()
  const [open, setOpen] = useState<OpenDialog>(null)
  const [name, setName] = useState('Ada Lovelace')

  const close = () => setOpen(null)

  const scrollStyle = useMemo(
    () => [styles.scroll, { backgroundColor: theme.colors.surface }],
    [theme],
  )
  const mutedText = useMemo(
    () => ({ color: theme.colors.onSurfaceVariant }),
    [theme],
  )

  return (
    <>
      <ScrollView contentContainerStyle={scrollStyle}>
        <Column gap="xl" style={styles.container}>
          <ScreenIntro />
          <Column gap="sm">
            <Typography variant="titleMedium">Basic</Typography>
            <Card variant="outlined">
              <Column p="md" gap="sm">
                <Typography variant="bodySmall" style={mutedText}>
                  Headline, supporting text, and end-aligned text buttons. Tap
                  the scrim to dismiss.
                </Typography>
                <Row gap="sm">
                  <Button onPress={() => setOpen('basic')}>Open</Button>
                </Row>
              </Column>
            </Card>
          </Column>

          <Column gap="sm">
            <Typography variant="titleMedium">With icon</Typography>
            <Card variant="outlined">
              <Column p="md" gap="sm">
                <Typography variant="bodySmall" style={mutedText}>
                  A hero icon centers the headline, per MD3.
                </Typography>
                <Row gap="sm">
                  <Button variant="tonal" onPress={() => setOpen('icon')}>
                    Open
                  </Button>
                </Row>
              </Column>
            </Card>
          </Column>

          <Column gap="sm">
            <Typography variant="titleMedium">Non-dismissable</Typography>
            <Card variant="outlined">
              <Column p="md" gap="sm">
                <Typography variant="bodySmall" style={mutedText}>
                  dismissable={'{false}'} — the scrim and Android back button
                  stop closing it, so an action must resolve it.
                </Typography>
                <Row gap="sm">
                  <Button
                    variant="outlined"
                    onPress={() => setOpen('persistent')}
                  >
                    Open
                  </Button>
                </Row>
              </Column>
            </Card>
          </Column>

          <Column gap="sm">
            <Typography variant="titleMedium">Arbitrary content</Typography>
            <Card variant="outlined">
              <Column p="md" gap="sm">
                <Typography variant="bodySmall" style={mutedText}>
                  Dialog.Content takes any node, not just supporting text.
                </Typography>
                <Row gap="sm">
                  <Button variant="outlined" onPress={() => setOpen('form')}>
                    Open
                  </Button>
                </Row>
              </Column>
            </Card>
          </Column>

          <Column gap="sm">
            <Typography variant="titleMedium">Full-screen</Typography>
            <Card variant="outlined">
              <Column p="md" gap="sm">
                <Typography variant="bodySmall" style={mutedText}>
                  Header with a close button, title, and confirming action above
                  scrollable content. No scrim.
                </Typography>
                <Row gap="sm">
                  <Button variant="tonal" onPress={() => setOpen('fullscreen')}>
                    Open
                  </Button>
                </Row>
              </Column>
            </Card>
          </Column>
          <ScreenNavFooter />
        </Column>
      </ScrollView>

      <Dialog visible={open === 'basic'} onDismiss={close}>
        <Dialog.Title>Delete file?</Dialog.Title>
        <Dialog.Content>
          This permanently removes report.pdf. You cannot undo this action.
        </Dialog.Content>
        <Dialog.Actions>
          <Button variant="text" onPress={close}>
            Cancel
          </Button>
          <Button variant="text" onPress={close}>
            Delete
          </Button>
        </Dialog.Actions>
      </Dialog>

      <Dialog visible={open === 'icon'} onDismiss={close}>
        <Dialog.Icon icon="alert-circle-outline" />
        <Dialog.Title>Reset settings?</Dialog.Title>
        <Dialog.Content>
          Every preference returns to its default. Your data is untouched.
        </Dialog.Content>
        <Dialog.Actions>
          <Button variant="text" onPress={close}>
            Cancel
          </Button>
          <Button variant="text" onPress={close}>
            Reset
          </Button>
        </Dialog.Actions>
      </Dialog>

      <Dialog
        visible={open === 'persistent'}
        onDismiss={close}
        dismissable={false}
      >
        <Dialog.Title>Accept the terms</Dialog.Title>
        <Dialog.Content>
          You have to choose one of these before continuing — the scrim will not
          dismiss this dialog.
        </Dialog.Content>
        <Dialog.Actions>
          <Button variant="text" onPress={close}>
            Decline
          </Button>
          <Button variant="text" onPress={close}>
            Accept
          </Button>
        </Dialog.Actions>
      </Dialog>

      <Dialog visible={open === 'form'} onDismiss={close}>
        <Dialog.Title>Rename</Dialog.Title>
        <Dialog.Content>
          <TextField label="Name" value={name} onChangeText={setName} />
        </Dialog.Content>
        <Dialog.Actions>
          <Button variant="text" onPress={close}>
            Cancel
          </Button>
          <Button variant="text" onPress={close}>
            Save
          </Button>
        </Dialog.Actions>
      </Dialog>

      <Dialog
        visible={open === 'fullscreen'}
        variant="fullscreen"
        onDismiss={close}
      >
        <Dialog.Title>Edit profile</Dialog.Title>
        <Dialog.Actions>
          <Button variant="text" onPress={close}>
            Save
          </Button>
        </Dialog.Actions>
        <Dialog.Content>
          <Column gap="lg">
            <TextField
              label="Display name"
              value={name}
              onChangeText={setName}
            />
            <TextField label="Email" value="ada@example.com" />
            <TextField label="Bio" value="" placeholder="Tell us about you" />
            <Typography variant="bodySmall" style={mutedText}>
              The body scrolls independently of the header.
            </Typography>
          </Column>
        </Dialog.Content>
      </Dialog>
    </>
  )
}

export default function DialogScreen() {
  return (
    <PortalHost>
      <DialogScreenContent />
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
