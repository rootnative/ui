import { Motion, Presence } from '@rootnative/inertia'
import { isRTLDirection, resolveLogicalKey } from '@rootnative/utils'
import { useCallback, useMemo, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { animatedBoxNone, pointerEvents } from '../internal/pointerEvents'
import { resolveLogicalCornerKey } from '../internal/resolveLogicalCornerKey'
import { useBackHandlerDismiss } from '../internal/useBackHandlerDismiss'
import { useFocusTrap } from '../internal/useFocusTrap'
import { useMaterialTheme } from '../internal/useMaterialTheme'
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
  endCornerStyle,
  getNavigationDrawerColors,
  scrimGapStyle,
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
    insetSides,
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
  const theme = useMaterialTheme()
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

  // The drawer sits at the start edge, which is the right edge in RTL.
  const isRTL = isRTLDirection()
  const edges = useMemo<Edge[]>(() => {
    const result: Edge[] = []
    if (insetTop ?? isModal) result.push('top')
    if (insetBottom ?? isModal) result.push('bottom')
    if (insetSides ?? isModal) result.push(isRTL ? 'right' : 'left')
    return result
  }, [insetTop, insetBottom, insetSides, isModal, isRTL])

  // Keys resolved on each render, not in a memo, so the one-sided styles
  // follow a runtime change of the document `dir` on the web.
  const endKey = resolveLogicalKey('paddingEnd')
  const topEndCornerKey = resolveLogicalCornerKey('borderTopEndRadius')
  const bottomEndCornerKey = resolveLogicalCornerKey('borderBottomEndRadius')
  const cornerStyle = useMemo(
    () =>
      isModal
        ? endCornerStyle(theme, topEndCornerKey, bottomEndCornerKey)
        : null,
    [isModal, theme, topEndCornerKey, bottomEndCornerKey],
  )
  const surfaceStyle = useMemo(
    () => [styles.surface, cornerStyle, style, pointerEvents.auto],
    [styles.surface, cornerStyle, style],
  )
  const sheetLayerStyle = useMemo(
    () => [styles.sheetLayer, scrimGapStyle(endKey), animatedBoxNone],
    [styles.sheetLayer, endKey],
  )

  const open = isModal && visible === true

  // Web keyboard containment: focus enters the drawer on open, Tab cycles
  // inside it, Escape dismisses, and focus returns to the trigger on close.
  // No-op on native, where `accessibilityViewIsModal` does the job.
  const surfaceRef = useFocusTrap({
    active: open,
    onEscape: dismissable ? onDismiss : undefined,
  })

  useBackHandlerDismiss(open && dismissable, onDismiss)

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
          style={surfaceStyle}
          role={role ?? 'navigation'}
          accessibilityLabel={accessibilityLabel}
        >
          {content}
        </View>
      </NavigationDrawerContext.Provider>
    )
  }

  const hiddenOffset = isRTL ? DRAWER_WIDTH : -DRAWER_WIDTH

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
                style={sheetLayerStyle}
                initial={{ translateX: hiddenOffset }}
                animate={{ translateX: 0 }}
                exit={{ translateX: hiddenOffset }}
                transition="spring-default-spatial"
              >
                <View
                  {...rest}
                  ref={surfaceRef}
                  testID={testID}
                  style={surfaceStyle}
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
