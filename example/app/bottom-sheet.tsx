import { MaterialCommunityIcons } from '@expo/vector-icons'
import {
  BottomSheet,
  Button,
  Card,
  Column,
  ListItem,
  Row,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { ScreenIntro } from '../src/ScreenIntro'
import { ScreenNavFooter } from '../src/ScreenNavFooter'

type OpenSheet = 'basic' | 'snap' | 'standard' | 'persistent' | null

function Icon({ name }: { name: string }) {
  const theme = useTheme()
  return (
    <MaterialCommunityIcons
      name={name as never}
      size={24}
      color={theme.colors.onSurfaceVariant}
    />
  )
}

export default function BottomSheetScreen() {
  const theme = useTheme()
  const [open, setOpen] = useState<OpenSheet>(null)
  const [snapIndex, setSnapIndex] = useState(0)

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
            <Typography variant="titleMedium">Modal</Typography>
            <Card variant="outlined">
              <Column p="md" gap="sm">
                <Typography variant="bodySmall" style={mutedText}>
                  Content-sized sheet over a scrim. Drag the handle down, tap
                  the scrim, or press the Android back button to dismiss.
                </Typography>
                <Row gap="sm">
                  <Button onPress={() => setOpen('basic')}>Open</Button>
                </Row>
              </Column>
            </Card>
          </Column>

          <Column gap="sm">
            <Typography variant="titleMedium">Snap points</Typography>
            <Card variant="outlined">
              <Column p="md" gap="sm">
                <Typography variant="bodySmall" style={mutedText}>
                  snapPoints={"{['50%', '90%']}"} — a fling or a slow drag moves
                  between them; below the lowest one it dismisses. Currently at
                  index {snapIndex}.
                </Typography>
                <Row gap="sm">
                  <Button variant="tonal" onPress={() => setOpen('snap')}>
                    Open
                  </Button>
                </Row>
              </Column>
            </Card>
          </Column>

          <Column gap="sm">
            <Typography variant="titleMedium">Standard</Typography>
            <Card variant="outlined">
              <Column p="md" gap="sm">
                <Typography variant="bodySmall" style={mutedText}>
                  {'variant="standard"'} — no scrim, and the screen behind stays
                  interactive.
                </Typography>
                <Row gap="sm">
                  <Button
                    variant="outlined"
                    onPress={() => setOpen('standard')}
                  >
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
                  dismissable={'{false}'} — drags below the lowest snap
                  rubber-band back, and the scrim stops responding. An action
                  inside has to close it.
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

          <ScreenNavFooter />
        </Column>
      </ScrollView>

      <BottomSheet visible={open === 'basic'} onDismiss={close}>
        <Column p="lg" pt={0} gap="md">
          <Typography variant="titleMedium">Share file</Typography>
          <ListItem
            headlineText="Copy link"
            leadingContent={<Icon name="link-variant" />}
            onPress={close}
          />
          <ListItem
            headlineText="Send by email"
            leadingContent={<Icon name="email-outline" />}
            onPress={close}
          />
          <ListItem
            headlineText="Save to device"
            leadingContent={<Icon name="download-outline" />}
            onPress={close}
          />
          <Button variant="text" onPress={close}>
            Cancel
          </Button>
        </Column>
      </BottomSheet>

      <BottomSheet
        visible={open === 'snap'}
        onDismiss={close}
        snapPoints={['50%', '90%']}
        onSnapIndexChange={setSnapIndex}
      >
        <ScrollView>
          <Column p="lg" pt={0} gap="md">
            <Typography variant="titleMedium">Nearby places</Typography>
            <Typography variant="bodyMedium" style={mutedText}>
              Drag the handle up to expand to 90%, down to return to 50%, and
              past that to dismiss. A fast fling skips straight there. The list
              scrolls inside the sheet.
            </Typography>
            {Array.from({ length: 12 }, (_, i) => (
              <ListItem
                key={i}
                headlineText={`Place ${i + 1}`}
                supportingText="2.4 km away"
                leadingContent={<Icon name="map-marker-outline" />}
              />
            ))}
          </Column>
        </ScrollView>
      </BottomSheet>

      <BottomSheet
        visible={open === 'standard'}
        onDismiss={close}
        variant="standard"
      >
        <Column p="lg" pt={0} gap="md">
          <Typography variant="titleMedium">Now playing</Typography>
          <Typography variant="bodyMedium" style={mutedText}>
            The screen behind this sheet still scrolls and its buttons still
            press. Drag the handle down to dismiss.
          </Typography>
        </Column>
      </BottomSheet>

      <BottomSheet
        visible={open === 'persistent'}
        onDismiss={close}
        dismissable={false}
      >
        <Column p="lg" pt={0} gap="md">
          <Typography variant="titleMedium">Accept the terms</Typography>
          <Typography variant="bodyMedium" style={mutedText}>
            This sheet only closes through one of its actions.
          </Typography>
          <Row gap="sm">
            <Button variant="text" onPress={close}>
              Decline
            </Button>
            <Button onPress={close}>Accept</Button>
          </Row>
        </Column>
      </BottomSheet>
    </>
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
