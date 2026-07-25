import {
  Box,
  Button,
  Card,
  Column,
  PORTAL_LAYERS,
  Portal,
  PortalHost,
  Row,
  Typography,
} from '@rootnative/components'
import { useTheme } from '@rootnative/core'
import { alphaColor } from '@rootnative/utils'
import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

function ToastDemo() {
  const [visible, setVisible] = useState(false)
  const theme = useTheme()

  const toastStyle = useMemo(
    () => [
      portalStyles.toast,
      { backgroundColor: theme.colors.inverseSurface },
    ],
    [theme.colors.inverseSurface],
  )
  const toastTextStyle = useMemo(
    () => ({ color: theme.colors.inverseOnSurface }),
    [theme.colors.inverseOnSurface],
  )

  return (
    <>
      <Button onPress={() => setVisible((v) => !v)}>
        {visible ? 'Hide toast' : 'Show toast'}
      </Button>
      {visible ? (
        <Portal priority={PORTAL_LAYERS.snackbar}>
          <View style={portalStyles.toastWrapper} pointerEvents="box-none">
            <Pressable
              onPress={() => setVisible(false)}
              style={toastStyle}
              accessibilityRole="button"
              accessibilityLabel="Dismiss toast"
            >
              <Typography variant="bodyMedium" style={toastTextStyle}>
                Saved! Tap to dismiss.
              </Typography>
            </Pressable>
          </View>
        </Portal>
      ) : null}
    </>
  )
}

function DialogDemo() {
  const [open, setOpen] = useState(false)
  const theme = useTheme()

  const dialogStyle = useMemo(
    () => [
      portalStyles.dialog,
      { backgroundColor: theme.colors.surfaceContainerHigh },
    ],
    [theme.colors.surfaceContainerHigh],
  )
  const scrimStyle = useMemo(
    () => [
      portalStyles.scrim,
      { backgroundColor: alphaColor(theme.colors.scrim, 0.4) },
    ],
    [theme.colors.scrim],
  )
  const supportingStyle = useMemo(
    () => ({ color: theme.colors.onSurfaceVariant }),
    [theme.colors.onSurfaceVariant],
  )

  return (
    <>
      <Button variant="outlined" onPress={() => setOpen(true)}>
        Open dialog
      </Button>
      {open ? (
        <Portal priority={PORTAL_LAYERS.dialog}>
          <Pressable
            style={scrimStyle}
            onPress={() => setOpen(false)}
            accessibilityLabel="Dismiss dialog"
          >
            <Pressable style={dialogStyle} onPress={() => {}}>
              <Column gap="md">
                <Typography variant="headlineSmall">Save changes?</Typography>
                <Typography variant="bodyMedium" style={supportingStyle}>
                  This dialog renders into a Portal so it sits above the rest of
                  the screen and is not constrained by parent overflow /
                  z-index.
                </Typography>
                <Row gap="sm" justify="flex-end">
                  <Button variant="text" onPress={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onPress={() => setOpen(false)}>Save</Button>
                </Row>
              </Column>
            </Pressable>
          </Pressable>
        </Portal>
      ) : null}
    </>
  )
}

/**
 * Opens the dialog *after* the toast. Without priority the dialog would cover
 * the toast; `PORTAL_LAYERS.snackbar` > `PORTAL_LAYERS.dialog` keeps it on top.
 */
function StackingDemo() {
  const [open, setOpen] = useState(false)
  const theme = useTheme()

  const scrimStyle = useMemo(
    () => [
      portalStyles.scrim,
      { backgroundColor: alphaColor(theme.colors.scrim, 0.4) },
    ],
    [theme.colors.scrim],
  )
  const dialogStyle = useMemo(
    () => [
      portalStyles.dialog,
      { backgroundColor: theme.colors.surfaceContainerHigh },
    ],
    [theme.colors.surfaceContainerHigh],
  )
  const toastStyle = useMemo(
    () => [
      portalStyles.toast,
      { backgroundColor: theme.colors.inverseSurface },
    ],
    [theme.colors.inverseSurface],
  )
  const toastTextStyle = useMemo(
    () => ({ color: theme.colors.inverseOnSurface }),
    [theme.colors.inverseOnSurface],
  )

  return (
    <>
      <Button variant="tonal" onPress={() => setOpen(true)}>
        Open dialog + toast
      </Button>
      {open ? (
        <>
          {/* Mounted first, but sits on top — priority wins over mount order. */}
          <Portal priority={PORTAL_LAYERS.snackbar}>
            <View style={portalStyles.toastWrapper} pointerEvents="box-none">
              <View style={toastStyle}>
                <Typography variant="bodyMedium" style={toastTextStyle}>
                  Snackbar layer — above the dialog scrim
                </Typography>
              </View>
            </View>
          </Portal>
          <Portal priority={PORTAL_LAYERS.dialog}>
            <Pressable
              style={scrimStyle}
              onPress={() => setOpen(false)}
              accessibilityLabel="Dismiss dialog"
            >
              <Pressable style={dialogStyle} onPress={() => {}}>
                <Column gap="md">
                  <Typography variant="headlineSmall">Dialog layer</Typography>
                  <Typography variant="bodyMedium">
                    Tap the scrim to close. The toast stays readable because it
                    sits in a higher portal layer.
                  </Typography>
                </Column>
              </Pressable>
            </Pressable>
          </Portal>
        </>
      ) : null}
    </>
  )
}

/**
 * A named host renders its portals where it sits in the tree rather than in
 * the root overlay — here, clipped inside the bordered box below.
 */
function NamedHostDemo() {
  const [visible, setVisible] = useState(false)
  const theme = useTheme()

  const badgeStyle = useMemo(
    () => [
      portalStyles.scopedBadge,
      { backgroundColor: theme.colors.tertiaryContainer },
    ],
    [theme.colors.tertiaryContainer],
  )
  const badgeTextStyle = useMemo(
    () => ({ color: theme.colors.onTertiaryContainer }),
    [theme.colors.onTertiaryContainer],
  )
  const slotStyle = useMemo(
    () => [portalStyles.slot, { borderColor: theme.colors.outlineVariant }],
    [theme.colors.outlineVariant],
  )

  return (
    <>
      <Button variant="outlined" onPress={() => setVisible((v) => !v)}>
        {visible ? 'Hide scoped overlay' : 'Show scoped overlay'}
      </Button>

      <View style={slotStyle}>
        <Typography variant="bodySmall">
          {'<PortalHost name="scoped" />'}
        </Typography>
        <PortalHost name="scoped" />
      </View>

      {visible ? (
        <Portal hostName="scoped">
          <View style={portalStyles.scopedWrapper} pointerEvents="box-none">
            <View style={badgeStyle}>
              <Typography variant="labelLarge" style={badgeTextStyle}>
                Scoped to the box
              </Typography>
            </View>
          </View>
        </Portal>
      ) : null}
    </>
  )
}

export default function PortalScreen() {
  const theme = useTheme()
  const mutedTextStyle = useMemo(
    () => ({ color: theme.colors.onSurfaceVariant }),
    [theme.colors.onSurfaceVariant],
  )

  return (
    <PortalHost style={styles.host}>
      <Column gap="lg" style={styles.content}>
        <Typography variant="headlineSmall">Portal Showcase</Typography>
        <Typography variant="bodyMedium" style={mutedTextStyle}>
          Portals render their children into a host higher in the tree, so
          overlays escape parent overflow and stacking contexts. Wrap your app
          in PortalHost once, then use Portal anywhere.
        </Typography>

        <Column gap="sm">
          <Typography variant="titleSmall">Toast</Typography>
          <Card variant="outlined">
            <Column p="md" gap="sm">
              <Typography variant="bodySmall" style={mutedTextStyle}>
                Anchored to the bottom of the host.
              </Typography>
              <ToastDemo />
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleSmall">Modal dialog</Typography>
          <Card variant="outlined">
            <Column p="md" gap="sm">
              <Typography variant="bodySmall" style={mutedTextStyle}>
                Renders a full-screen scrim with a centered dialog.
              </Typography>
              <DialogDemo />
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleSmall">Stacking order</Typography>
          <Card variant="outlined">
            <Column p="md" gap="sm">
              <Typography variant="bodySmall" style={mutedTextStyle}>
                PORTAL_LAYERS defines the z-order contract: sheet (100) &lt;
                dialog (200) &lt; snackbar (300) &lt; menu (400) &lt; tooltip
                (500). Priority beats mount order.
              </Typography>
              <StackingDemo />
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleSmall">Named host</Typography>
          <Card variant="outlined">
            <Column p="md" gap="sm">
              <Typography variant="bodySmall" style={mutedTextStyle}>
                A Portal with hostName renders into the matching named host
                instead of the root overlay — useful for scoping overlays to one
                screen or nested navigator.
              </Typography>
              <NamedHostDemo />
            </Column>
          </Card>
        </Column>

        <Column gap="sm">
          <Typography variant="titleSmall">Why a Portal?</Typography>
          <Box
            bg={theme.colors.surfaceContainerLow}
            style={styles.constrainedDemo}
          >
            <Column gap="xs">
              <Typography variant="labelLarge">Constrained parent</Typography>
              <Typography variant="bodySmall" style={mutedTextStyle}>
                This box clips overflow and has a stacking context, but a Portal
                child still renders above the whole screen.
              </Typography>
              <ToastDemo />
            </Column>
          </Box>
        </Column>
      </Column>
    </PortalHost>
  )
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  constrainedDemo: {
    padding: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
})

const portalStyles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  toast: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 240,
    alignItems: 'center',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    padding: 24,
  },
  slot: {
    height: 96,
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: 'dashed',
    padding: 12,
    overflow: 'hidden',
  },
  scopedWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopedBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
})
