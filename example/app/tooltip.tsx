import {
  Button,
  Card,
  Column,
  IconButton,
  Row,
  Tooltip,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'

function TooltipScreenContent() {
  const theme = useTheme()
  const [helpOpen, setHelpOpen] = useState(false)

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
          <Typography variant="titleMedium">Plain</Typography>
          <Card variant="outlined">
            <Column p="md" gap="sm">
              <Typography variant="bodySmall" style={mutedText}>
                Hover on the web, long-press on a touch device. A plain tooltip
                takes itself down after 1.5s and never blocks a press.
              </Typography>
              <Row gap="sm" align="center">
                <Tooltip
                  anchor={
                    <IconButton
                      icon="heart-outline"
                      accessibilityLabel="Favourite"
                    />
                  }
                >
                  Add to favourites
                </Tooltip>
                <Tooltip
                  anchor={
                    <IconButton
                      icon="share-variant"
                      accessibilityLabel="Share"
                    />
                  }
                >
                  Share
                </Tooltip>
                <Tooltip
                  anchor={
                    <IconButton
                      icon="archive-outline"
                      accessibilityLabel="Archive"
                    />
                  }
                >
                  Move to archive
                </Tooltip>
                <Tooltip
                  duration={0}
                  anchor={<Button variant="tonal">Stays up</Button>}
                >
                  {'duration={0} waits for a hover out or a press'}
                </Tooltip>
              </Row>
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Placement</Typography>
          <Card variant="outlined">
            <Column p="md" gap="sm">
              <Typography variant="bodySmall" style={mutedText}>
                `side` and `align` are preferences — a tooltip with no room
                above flips below and shifts back inside the screen margin.
              </Typography>
              <Row gap="sm" wrap>
                <Tooltip anchor={<Button variant="outlined">Above</Button>}>
                  Default placement
                </Tooltip>
                <Tooltip
                  side="bottom"
                  anchor={<Button variant="outlined">Below</Button>}
                >
                  side=&quot;bottom&quot;
                </Tooltip>
                <Tooltip
                  align="start"
                  anchor={<Button variant="outlined">Start</Button>}
                >
                  align=&quot;start&quot;
                </Tooltip>
                <Tooltip
                  align="end"
                  offset={12}
                  anchor={<Button variant="outlined">End · 12dp</Button>}
                >
                  align=&quot;end&quot; with a wider gap
                </Tooltip>
              </Row>
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Rich</Typography>
          <Card variant="outlined">
            <Column p="md" gap="sm">
              <Typography variant="bodySmall" style={mutedText}>
                A subhead, supporting text, and actions. Rich tooltips are
                persistent: they wait for an outside press, an action, or
                Android back.
              </Typography>
              <Row gap="sm" align="center">
                <Tooltip
                  variant="rich"
                  subhead="Rich tooltip"
                  actions={<Button variant="text">Learn more</Button>}
                  anchor={
                    <IconButton
                      icon="information-outline"
                      accessibilityLabel="About sync"
                    />
                  }
                >
                  Rich tooltips bring attention to a feature that warrants a
                  sentence of explanation.
                </Tooltip>
                <Tooltip
                  visible={helpOpen}
                  onDismiss={() => setHelpOpen(false)}
                  variant="rich"
                  subhead="Controlled"
                  actions={
                    <Button variant="text" onPress={() => setHelpOpen(false)}>
                      Got it
                    </Button>
                  }
                  anchor={
                    <Button
                      variant="tonal"
                      onPress={() => setHelpOpen((open) => !open)}
                    >
                      {helpOpen ? 'Hide help' : 'Show help'}
                    </Button>
                  }
                >
                  `visible` + `onDismiss` put you in charge — the anchor stops
                  opening it on hover and long press.
                </Tooltip>
              </Row>
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleMedium">Overrides</Typography>
          <Card variant="outlined">
            <Column p="md" gap="sm">
              <Typography variant="bodySmall" style={mutedText}>
                `containerColor` and `contentColor` recolor the surface and its
                text. There are no state layers to re-derive — a tooltip is not
                interactive.
              </Typography>
              <Row gap="sm" wrap>
                <Tooltip
                  containerColor={theme.colors.errorContainer}
                  contentColor={theme.colors.onErrorContainer}
                  anchor={<Button variant="text">Tinted</Button>}
                >
                  Quota nearly reached
                </Tooltip>
                <Tooltip
                  variant="rich"
                  subhead="Long text"
                  anchor={<Button variant="text">Wraps at 320dp</Button>}
                >
                  A rich tooltip caps at 320dp wide and a plain one at 200dp, so
                  anything longer than a line wraps rather than running off the
                  screen.
                </Tooltip>
              </Row>
            </Column>
          </Card>
        </Column>
      </Column>
    </ScrollView>
  )
}

// No PortalHost here on purpose — the root layout mounts one above the AppBar,
// which is what lets a tooltip near the top of the screen open above its anchor.
export default function TooltipScreen() {
  return <TooltipScreenContent />
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
