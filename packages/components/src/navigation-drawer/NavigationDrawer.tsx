import { useTheme } from '@rootnative/core'
import { Motion, Presence } from '@rootnative/inertia'
import { isRTLDirection } from '@rootnative/utils'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native'
import { pointerEvents } from '../internal/pointerEvents'
import { useFocusTrap } from '../internal/useFocusTrap'
import { PORTAL_LAYERS } from '../portal/layers'
import { Portal } from '../portal/Portal'
import { SafeAreaView } from '../safe-area'
import type { Edge } from '../safe-area'
import { NavigationDrawerContext } from './context'
import type { NavigationDrawerContextValue } from './context'
import { NavigationDrawerDivider } from './NavigationDrawerDivider'
import { NavigationDrawerItem } from './NavigationDrawerItem'
import { NavigationDrawerSection } from './NavigationDrawerSection'
import {
  DRAWER_WIDTH,
  createNavigationDrawerStyles,
  getNavigationDrawerColors,
} from './styles'
import type { NavigationDrawerProps } from './types'

export function NavigationDrawer(props: NavigationDrawerProps) {
  const {
    children,
    value,
    defaultValue,
    onValueChange,
    variant = 'modal',
    insetTop,
    insetBottom,
    containerColor,
    contentColor,
    selectedContentColor,
    indicatorColor,
    labelStyle,
    style,
    accessibilityLabel,
    testID,
    visible,
    onDismiss,
    dismissable = true,
    dismissOnSelect = true,
    hostName,
    scrimStyle,
    scrimAccessibilityLabel = 'Close navigation drawer',
    role,
    ...rest
  } = props
  const isModal = variant === 'modal'
  const theme = useTheme()
  const colors = useMemo(
    () =>
      getNavigationDrawerColors(
        theme,
        contentColor,
        selectedContentColor,
        indicatorColor,
      ),
    [theme, contentColor, selectedContentColor, indicatorColor],
  )
  const styles = useMemo(
    () => createNavigationDrawerStyles(theme, variant, containerColor),
    [theme, variant, containerColor],
  )

  const isControlled = value !== undefined
  const [selfValue, setSelfValue] = useState(defaultValue)
  const selected = isControlled ? value : selfValue

  const select = useCallback(
    (next: string) => {
      if (!isControlled) setSelfValue(next)
      onValueChange?.(next)
      if (isModal && dismissOnSelect) onDismiss?.()
    },
    [isControlled, onValueChange, isModal, dismissOnSelect, onDismiss],
  )

  const contextValue = useMemo<NavigationDrawerContextValue>(
    () => ({ selected, select, colors, labelStyle }),
    [selected, select, colors, labelStyle],
  )

  const edges = useMemo<Edge[]>(() => {
    const result: Edge[] = []
    if (insetTop ?? isModal) result.push('top')
    if (insetBottom ?? isModal) result.push('bottom')
    return result
  }, [insetTop, insetBottom, isModal])

  const open = isModal && visible === true

  // Web keyboard containment: focus enters the drawer on open, Tab cycles
  // inside it, Escape dismisses, and focus returns to the trigger on close.
  // No-op on native, where `accessibilityViewIsModal` does the job.
  const surfaceRef = useFocusTrap({
    active: open,
    onEscape: dismissable ? onDismiss : undefined,
  })

  // Android hardware back closes a dismissable drawer before it pops the
  // navigation stack.
  useEffect(() => {
    if (!open || !dismissable || Platform.OS !== 'android') return
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onDismiss?.()
        return true
      },
    )
    return () => subscription.remove()
  }, [open, dismissable, onDismiss])

  const content = (
    <SafeAreaView edges={edges} style={styles.safeArea}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View role="tablist">{children}</View>
      </ScrollView>
    </SafeAreaView>
  )

  if (!isModal) {
    return (
      <NavigationDrawerContext.Provider value={contextValue}>
        <View
          {...rest}
          testID={testID}
          style={[styles.surface, style]}
          role={role ?? 'navigation'}
          accessibilityLabel={accessibilityLabel}
        >
          {content}
        </View>
      </NavigationDrawerContext.Provider>
    )
  }

  // The sheet enters from the start edge, which is the right edge in RTL.
  const hiddenOffset = isRTLDirection() ? DRAWER_WIDTH : -DRAWER_WIDTH

  return (
    <Portal priority={PORTAL_LAYERS.sheet} hostName={hostName}>
      <NavigationDrawerContext.Provider value={contextValue}>
        <View style={[styles.layer, pointerEvents.boxNone]}>
          <Presence>
            {open ? (
              <Motion.View
                key="scrim"
                testID={testID === undefined ? undefined : `${testID}-scrim`}
                style={[styles.scrim, scrimStyle]}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition="spring-fast-effects"
              >
                <Pressable
                  style={styles.scrimPressArea}
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

            {open ? (
              <Motion.View
                key="sheet"
                testID={testID === undefined ? undefined : `${testID}-layer`}
                style={[styles.sheetLayer, pointerEvents.boxNone]}
                initial={{ translateX: hiddenOffset }}
                animate={{ translateX: 0 }}
                exit={{ translateX: hiddenOffset }}
                transition="spring-default-spatial"
              >
                <View
                  {...rest}
                  ref={surfaceRef}
                  testID={testID}
                  style={[styles.surface, style]}
                  role={role ?? 'dialog'}
                  aria-modal
                  accessibilityViewIsModal
                  accessibilityLabel={accessibilityLabel}
                >
                  {content}
                </View>
              </Motion.View>
            ) : null}
          </Presence>
        </View>
      </NavigationDrawerContext.Provider>
    </Portal>
  )
}

NavigationDrawer.Item = NavigationDrawerItem
NavigationDrawer.Section = NavigationDrawerSection
NavigationDrawer.Divider = NavigationDrawerDivider
