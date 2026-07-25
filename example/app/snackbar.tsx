import {
  Button,
  Card,
  Column,
  PortalHost,
  Row,
  SnackbarProvider,
  Typography,
  useSnackbar,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'

function Demos() {
  const theme = useTheme()
  const snackbar = useSnackbar()
  const [lastReason, setLastReason] = useState<string>('—')

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
          <Typography variant="titleMedium">Message only</Typography>
          <Card variant="outlined">
            <Column p="md" gap="sm">
              <Typography variant="bodySmall" style={mutedText}>
                Times out after the MD3 short duration (4s).
              </Typography>
              <Row gap="sm">
                <Button
                  onPress={() => snackbar.show({ message: 'Photo saved' })}
                >
                  Show
                </Button>
              </Row>
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">With an action</Typography>
          <Card variant="outlined">
            <Column p="md" gap="sm">
              <Typography variant="bodySmall" style={mutedText}>
                A snackbar carrying an action waits indefinitely — an undo the
                user never sees is worse than one that waits.
              </Typography>
              <Row gap="sm">
                <Button
                  variant="tonal"
                  onPress={() =>
                    snackbar.show({
                      message: 'Message deleted',
                      actionLabel: 'Undo',
                      onAction: () => setLastReason('undo pressed'),
                      onDismiss: (reason) => setLastReason(reason),
                    })
                  }
                >
                  Show
                </Button>
              </Row>
              <Typography variant="labelSmall" style={mutedText}>
                Last dismissal: {lastReason}
              </Typography>
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Close button</Typography>
          <Card variant="outlined">
            <Column p="md" gap="sm">
              <Typography variant="bodySmall" style={mutedText}>
                showCloseIcon gives an indefinite snackbar a way out.
              </Typography>
              <Row gap="sm">
                <Button
                  variant="outlined"
                  onPress={() =>
                    snackbar.show({
                      message: 'Sync paused while offline',
                      duration: 'indefinite',
                      showCloseIcon: true,
                    })
                  }
                >
                  Show
                </Button>
              </Row>
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Queue</Typography>
          <Card variant="outlined">
            <Column p="md" gap="sm">
              <Typography variant="bodySmall" style={mutedText}>
                One at a time, FIFO. `replace` jumps the visible one instead of
                queueing behind it.
              </Typography>
              <Row gap="sm" wrap>
                <Button
                  variant="tonal"
                  onPress={() => {
                    snackbar.show({ message: 'First' })
                    snackbar.show({ message: 'Second' })
                    snackbar.show({ message: 'Third' })
                  }}
                >
                  Queue three
                </Button>
                <Button
                  variant="outlined"
                  onPress={() =>
                    snackbar.show({
                      message: 'Jumped the queue',
                      replace: true,
                    })
                  }
                >
                  Replace
                </Button>
                <Button variant="text" onPress={() => snackbar.clear()}>
                  Clear
                </Button>
              </Row>
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Two lines</Typography>
          <Card variant="outlined">
            <Column p="md" gap="sm">
              <Typography variant="bodySmall" style={mutedText}>
                48dp single line, 68dp at two. Longer text truncates.
              </Typography>
              <Row gap="sm">
                <Button
                  variant="outlined"
                  onPress={() =>
                    snackbar.show({
                      message:
                        'Your changes were saved to the shared workspace and are visible to everyone on the team.',
                      actionLabel: 'View',
                      onAction: () => {},
                    })
                  }
                >
                  Show
                </Button>
              </Row>
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Color overrides</Typography>
          <Card variant="outlined">
            <Column p="md" gap="sm">
              <Row gap="sm">
                <Button
                  variant="outlined"
                  onPress={() =>
                    snackbar.show({
                      message: 'Upload failed',
                      actionLabel: 'Retry',
                      onAction: () => {},
                      containerColor: theme.colors.errorContainer,
                      contentColor: theme.colors.onErrorContainer,
                      actionColor: theme.colors.error,
                    })
                  }
                >
                  Error styling
                </Button>
              </Row>
            </Column>
          </Card>
        </Column>
      </Column>
    </ScrollView>
  )
}

export default function SnackbarScreen() {
  return (
    <PortalHost>
      <SnackbarProvider>
        <Demos />
      </SnackbarProvider>
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
