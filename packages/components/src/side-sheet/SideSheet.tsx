import { Motion, Presence } from '@rootnative/inertia'
import { isRTLDirection, resolveLogicalKey, selectRTL } from '@rootnative/utils'
import { useContext, useMemo } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaInsetsContext } from 'react-native-safe-area-context'
import type { EdgeInsets } from 'react-native-safe-area-context'
import { Divider } from '../divider/Divider'
import { IconButton } from '../icon-button'
import { animatedBoxNone, pointerEvents } from '../internal/pointerEvents'
import { resolveLogicalCornerKey } from '../internal/resolveLogicalCornerKey'
import { useBackHandlerDismiss } from '../internal/useBackHandlerDismiss'
import { useFocusTrap } from '../internal/useFocusTrap'
import { useMaterialTheme } from '../internal/useMaterialTheme'
import { PORTAL_LAYERS } from '../portal/layers'
import { Portal } from '../portal/Portal'
import { SafeAreaView } from '../safe-area'
import type { Edge } from '../safe-area'
import {
  SIDE_SHEET_WIDTH,
  contentCornerStyle,
  createSideSheetStyles,
  detachedMargin,
  headerInsetStyle,
  scrimGapStyle,
} from './styles'
import type { SideSheetProps } from './types'

const NO_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 }
const NO_EDGES: Edge[] = []

export function SideSheet(props: SideSheetProps) {
  const {
    children,
    variant = 'modal',
    headline,
    headingLevel = 2,
    onBack,
    backIcon,
    backAccessibilityLabel = 'Back',
    closeIcon = 'close',
    closeAccessibilityLabel = 'Close',
    actions,
    showActionsDivider = true,
    detached = false,
    width = SIDE_SHEET_WIDTH,
    insetTop,
    insetBottom,
    insetSides,
    containerColor,
    contentColor,
    headlineStyle,
    style,
    accessibilityLabel,
    testID,
    visible,
    onDismiss,
    dismissable = true,
    edge = 'end',
    hostName,
    scrimStyle,
    scrimAccessibilityLabel = 'Close side sheet',
    role,
    ...rest
  } = props
  const isModal = variant === 'modal'
  const theme = useMaterialTheme()
  const styles = useMemo(
    () =>
      createSideSheetStyles(
        theme,
        variant,
        edge,
        detached,
        width,
        containerColor,
        contentColor,
      ),
    [theme, variant, edge, detached, width, containerColor, contentColor],
  )
  const iconColor = contentColor ?? theme.colors.onSurfaceVariant

  // 'end' is the right edge in LTR.
  const isOnRight = (edge === 'end') !== isRTLDirection()
  const insetEdges = useMemo<Edge[]>(() => {
    const result: Edge[] = []
    if (insetTop ?? isModal) result.push('top')
    if (insetBottom ?? isModal) result.push('bottom')
    if (insetSides ?? isModal) result.push(isOnRight ? 'right' : 'left')
    return result
  }, [insetTop, insetBottom, insetSides, isModal, isOnRight])

  // The context, not `useSafeAreaInsets()`, which throws without a provider.
  const safeArea = useContext(SafeAreaInsetsContext)
  // A detached sheet adds the insets to its margin, so its content needs no
  // inset padding. Without a provider the insets are unknown here: the
  // margin starts at the screen edge, and the safe-area view pads the content.
  const contentEdges = detached && safeArea !== null ? NO_EDGES : insetEdges
  const margin = useMemo(
    () =>
      detached
        ? detachedMargin(
            [styles.surface, style],
            safeArea ?? NO_INSETS,
            insetEdges,
          )
        : null,
    [detached, styles.surface, style, safeArea, insetEdges],
  )
  // A key resolved on each render, not in a memo, so the one-sided styles
  // follow a runtime change of the document `dir` on the web.
  const startKey = resolveLogicalKey('paddingStart')
  const endKey = resolveLogicalKey('paddingEnd')
  const topCornerKey = resolveLogicalCornerKey(
    edge === 'end' ? 'borderTopStartRadius' : 'borderTopEndRadius',
  )
  const bottomCornerKey = resolveLogicalCornerKey(
    edge === 'end' ? 'borderBottomStartRadius' : 'borderBottomEndRadius',
  )
  const cornerStyle = useMemo(
    () =>
      isModal && !detached
        ? contentCornerStyle(theme, topCornerKey, bottomCornerKey)
        : null,
    [isModal, detached, theme, topCornerKey, bottomCornerKey],
  )
  const surfaceStyle = useMemo(
    () => [
      styles.surface,
      cornerStyle,
      style,
      margin?.style,
      pointerEvents.auto,
    ],
    [styles.surface, cornerStyle, style, margin],
  )
  const farSideKey = edge === 'end' ? startKey : endKey
  const sheetLayerStyle = useMemo(
    () => [styles.sheetLayer, scrimGapStyle(farSideKey), animatedBoxNone],
    [styles.sheetLayer, farSideKey],
  )

  const hasBack = onBack !== undefined
  const hasClose = onDismiss !== undefined
  const hasHeader = headline !== undefined || hasBack || hasClose
  const hasActions =
    actions !== undefined && actions !== null && actions !== false

  const headerStyle = useMemo(
    () => [
      styles.header,
      headerInsetStyle(startKey, endKey, hasBack, hasClose),
    ],
    [styles.header, startKey, endKey, hasBack, hasClose],
  )
  const resolvedHeadlineStyle = useMemo(
    () => [styles.headline, headlineStyle],
    [styles.headline, headlineStyle],
  )
  const bodyContentStyle = useMemo(
    () => [
      styles.bodyContent,
      hasHeader ? null : styles.bodyContentWithoutHeader,
    ],
    [styles, hasHeader],
  )

  const accessibleName = accessibilityLabel ?? headline
  const open = isModal && visible === true

  // Web keyboard containment: focus enters the sheet on open, Tab cycles
  // inside it, Escape dismisses, and focus returns to the trigger on close.
  // No-op on native, where `accessibilityViewIsModal` does the job.
  const surfaceRef = useFocusTrap({
    active: open,
    onEscape: dismissable ? onDismiss : undefined,
  })

  useBackHandlerDismiss(open && dismissable, onDismiss)

  const content = (
    <SafeAreaView edges={contentEdges} style={styles.safeArea}>
      {hasHeader ? (
        <View style={headerStyle}>
          {onBack !== undefined ? (
            <IconButton
              icon={backIcon ?? selectRTL('arrow-left', 'arrow-right')}
              variant="standard"
              accessibilityLabel={backAccessibilityLabel}
              contentColor={iconColor}
              onPress={onBack}
            />
          ) : null}
          {headline !== undefined ? (
            <Text
              style={resolvedHeadlineStyle}
              role="heading"
              // react-native-web writes a level-less heading as `<h1>`. React
              // Native has no `aria-level`, so it is web-only.
              aria-level={headingLevel}
            >
              {headline}
            </Text>
          ) : (
            <View style={styles.headerSpacer} />
          )}
          {onDismiss !== undefined ? (
            <IconButton
              icon={closeIcon}
              variant="standard"
              accessibilityLabel={closeAccessibilityLabel}
              contentColor={iconColor}
              onPress={onDismiss}
            />
          ) : null}
        </View>
      ) : null}
      <ScrollView style={styles.body} contentContainerStyle={bodyContentStyle}>
        {children}
      </ScrollView>
      {hasActions ? (
        <>
          {showActionsDivider ? <Divider /> : null}
          <View style={styles.actions}>{actions}</View>
        </>
      ) : null}
    </SafeAreaView>
  )

  if (!isModal) {
    return (
      <View
        {...rest}
        testID={testID}
        style={surfaceStyle}
        role={role ?? 'complementary'}
        accessibilityLabel={accessibleName}
      >
        {content}
      </View>
    )
  }

  // The detached margin adds to the travel, so the sheet leaves the screen
  // completely.
  const travel = width + (margin?.sides[isOnRight ? 'right' : 'left'] ?? 0)
  const hiddenOffset = isOnRight ? travel : -travel

  return (
    <Portal priority={PORTAL_LAYERS.sheet} hostName={hostName}>
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
                accessibilityLabel={accessibleName}
              >
                {content}
              </View>
            </Motion.View>
          ) : null}
        </Presence>
      </View>
    </Portal>
  )
}
