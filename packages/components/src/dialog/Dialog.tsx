import { useTheme } from '@rootnative/core'
import { Motion, Presence } from '@rootnative/inertia'
import { Children, isValidElement, useEffect, useMemo } from 'react'
import type { ReactNode, Ref } from 'react'
import {
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native'
import type { ViewProps } from 'react-native'
import { IconButton } from '../icon-button'
import { useFocusTrap } from '../internal/useFocusTrap'
import { PORTAL_LAYERS } from '../portal/layers'
import { Portal } from '../portal/Portal'
import { DialogContext } from './context'
import type { DialogContextValue } from './context'
import {
  DialogActions,
  DialogContent,
  DialogIcon,
  DialogTitle,
  slotKindOf,
} from './slots'
import { FULLSCREEN_SLIDE, createDialogStyles } from './styles'
import type { DialogProps } from './types'

interface Slots {
  icon: ReactNode[]
  title: ReactNode[]
  content: ReactNode[]
  actions: ReactNode[]
}

function collectSlots(children: ReactNode): Slots {
  const slots: Slots = { icon: [], title: [], content: [], actions: [] }

  Children.forEach(children, (child) => {
    if (child === null || child === undefined || child === false) return
    const kind = slotKindOf(child)
    // Anything that isn't a recognised slot is treated as body content, so
    // `<Dialog><MyForm /></Dialog>` works without ceremony.
    slots[kind ?? 'content'].push(child)
  })

  return slots
}

/**
 * A dialog needs an accessible name, and its headline is that name. Only a
 * plain-string headline can be lifted automatically — a `Dialog.Title` built
 * out of nodes has no single string to announce, so those dialogs pass
 * `accessibilityLabel` themselves.
 */
function headlineOf(title: ReactNode[]): string | undefined {
  const [first] = title
  if (!isValidElement<{ children?: ReactNode }>(first)) return undefined
  const { children } = first.props
  if (typeof children === 'string') return children
  if (typeof children === 'number') return String(children)
  return undefined
}

function DialogBasic({
  slots,
  styles,
  style,
  testID,
  surfaceRef,
  role,
  ...rest
}: Omit<ViewProps, 'children' | 'style'> & {
  slots: Slots
  styles: ReturnType<typeof createDialogStyles>
  style: DialogProps['style']
  testID?: string
  surfaceRef: Ref<View>
}) {
  return (
    <View
      {...rest}
      ref={surfaceRef}
      testID={testID}
      style={[styles.container, style]}
      // MD3 dialogs are plain dialogs. `alertdialog` is opt-in because
      // assistive technology treats it as an interruption.
      role={role ?? 'dialog'}
      aria-modal
      accessibilityViewIsModal
    >
      {slots.icon}
      {slots.title}
      {slots.content}
      {slots.actions}
    </View>
  )
}

function DialogFullscreen({
  slots,
  styles,
  style,
  testID,
  closeIcon,
  closeAccessibilityLabel,
  onDismiss,
  surfaceRef,
  role,
  ...rest
}: Omit<ViewProps, 'children' | 'style'> & {
  slots: Slots
  styles: ReturnType<typeof createDialogStyles>
  style: DialogProps['style']
  testID?: string
  closeIcon: DialogProps['closeIcon']
  closeAccessibilityLabel: string
  onDismiss: () => void
  surfaceRef: Ref<View>
}) {
  return (
    <View
      {...rest}
      ref={surfaceRef}
      testID={testID}
      style={[styles.fullscreenContainer, style]}
      role={role ?? 'dialog'}
      aria-modal
      accessibilityViewIsModal
    >
      <View style={styles.header}>
        <IconButton
          variant="standard"
          icon={closeIcon ?? 'close'}
          accessibilityLabel={closeAccessibilityLabel}
          onPress={onDismiss}
        />
        <View style={styles.headerTitle}>{slots.title}</View>
        {slots.actions.length > 0 ? (
          <View style={styles.headerActions}>{slots.actions}</View>
        ) : null}
      </View>
      <ScrollView contentContainerStyle={styles.fullscreenBody}>
        {slots.icon}
        {slots.content}
      </ScrollView>
    </View>
  )
}

export function Dialog({
  visible,
  onDismiss,
  children,
  variant = 'basic',
  dismissable = true,
  containerColor,
  closeIcon,
  closeAccessibilityLabel = 'Close',
  scrimAccessibilityLabel = 'Close dialog',
  accessibilityLabel,
  style,
  scrimStyle,
  testID,
  ...rest
}: DialogProps) {
  const theme = useTheme()
  const styles = useMemo(
    () => createDialogStyles(theme, variant, containerColor),
    [theme, variant, containerColor],
  )

  const slots = useMemo(() => collectSlots(children), [children])
  const isFullscreen = variant === 'fullscreen'

  const accessibleName = accessibilityLabel ?? headlineOf(slots.title)

  const contextValue = useMemo<DialogContextValue>(
    () => ({
      variant,
      hasIcon: slots.icon.length > 0,
      // The actions row owns the 24dp gap above itself in the fullscreen
      // header, so the body content must not add its own bottom padding.
      contentIsFlush: isFullscreen || slots.actions.length === 0,
    }),
    [variant, slots.icon.length, slots.actions.length, isFullscreen],
  )

  // Web keyboard containment: focus enters the surface on open, Tab cycles
  // inside it, Escape dismisses, and focus returns to the trigger on close.
  // No-op on native, where `accessibilityViewIsModal` above does the job.
  const surfaceRef = useFocusTrap({
    active: visible,
    onEscape: dismissable ? onDismiss : undefined,
  })

  // Android hardware back closes a dismissable dialog before it pops the
  // navigation stack.
  useEffect(() => {
    if (!visible || !dismissable || Platform.OS !== 'android') return
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onDismiss()
        return true
      },
    )
    return () => subscription.remove()
  }, [visible, dismissable, onDismiss])

  return (
    <Portal priority={PORTAL_LAYERS.dialog}>
      <DialogContext.Provider value={contextValue}>
        <Presence>
          {visible && !isFullscreen ? (
            <Motion.View
              key="scrim"
              style={[styles.scrim, scrimStyle]}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition="spring-fast-effects"
            >
              <Pressable
                style={styles.scrim}
                onPress={dismissable ? onDismiss : undefined}
                disabled={!dismissable}
                accessibilityLabel={scrimAccessibilityLabel}
                role="button"
                importantForAccessibility={
                  dismissable ? 'yes' : 'no-hide-descendants'
                }
              />
            </Motion.View>
          ) : null}

          {visible ? (
            <Motion.View
              key="surface"
              pointerEvents="box-none"
              style={isFullscreen ? styles.fullscreenLayer : styles.centerLayer}
              // MD3 enters a basic dialog with a scale-up + fade; the
              // fullscreen variant slides up. A true full-height slide would
              // need the measured surface height, which fights the safe-area
              // layout — a 48dp rise reads the same at spring speed.
              initial={
                isFullscreen
                  ? { opacity: 0, translateY: FULLSCREEN_SLIDE }
                  : { opacity: 0, scale: 0.8 }
              }
              animate={
                isFullscreen
                  ? { opacity: 1, translateY: 0 }
                  : { opacity: 1, scale: 1 }
              }
              exit={
                isFullscreen
                  ? { opacity: 0, translateY: FULLSCREEN_SLIDE }
                  : { opacity: 0, scale: 0.8 }
              }
              transition="spring-default-spatial"
            >
              {isFullscreen ? (
                <DialogFullscreen
                  slots={slots}
                  styles={styles}
                  style={style}
                  testID={testID}
                  closeIcon={closeIcon}
                  closeAccessibilityLabel={closeAccessibilityLabel}
                  onDismiss={onDismiss}
                  surfaceRef={surfaceRef}
                  accessibilityLabel={accessibleName}
                  {...rest}
                />
              ) : (
                <DialogBasic
                  slots={slots}
                  styles={styles}
                  style={style}
                  testID={testID}
                  surfaceRef={surfaceRef}
                  accessibilityLabel={accessibleName}
                  {...rest}
                />
              )}
            </Motion.View>
          ) : null}
        </Presence>
      </DialogContext.Provider>
    </Portal>
  )
}

Dialog.Icon = DialogIcon
Dialog.Title = DialogTitle
Dialog.Content = DialogContent
Dialog.Actions = DialogActions
