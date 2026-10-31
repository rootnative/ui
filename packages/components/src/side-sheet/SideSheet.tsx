import { useTheme } from '@rootnative/core'
import { Motion, Presence } from '@rootnative/inertia'
import { isRTLDirection, selectRTL } from '@rootnative/utils'
import { useMemo } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { Divider } from '../divider/Divider'
import { IconButton } from '../icon-button'
import { pointerEvents } from '../internal/pointerEvents'
import { useBackHandlerDismiss } from '../internal/useBackHandlerDismiss'
import { useFocusTrap } from '../internal/useFocusTrap'
import { PORTAL_LAYERS } from '../portal/layers'
import { Portal } from '../portal/Portal'
import { SafeAreaView } from '../safe-area'
import type { Edge } from '../safe-area'
import {
  SIDE_SHEET_DETACHED_MARGIN,
  SIDE_SHEET_WIDTH,
  createSideSheetStyles,
} from './styles'
import type { SideSheetProps } from './types'

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
  const theme = useTheme()
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

  const edges = useMemo<Edge[]>(() => {
    const result: Edge[] = []
    if (insetTop ?? isModal) result.push('top')
    if (insetBottom ?? isModal) result.push('bottom')
    return result
  }, [insetTop, insetBottom, isModal])

  const hasHeader =
    headline !== undefined || onBack !== undefined || onDismiss !== undefined
  const hasActions =
    actions !== undefined && actions !== null && actions !== false

  const headerStyle = useMemo(
    () => [
      styles.header,
      onBack !== undefined ? styles.headerWithBack : null,
      onDismiss !== undefined ? styles.headerWithClose : null,
    ],
    [styles, onBack, onDismiss],
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
    <SafeAreaView edges={edges} style={styles.safeArea}>
      {hasHeader ? (
        <View style={headerStyle}>
          {onBack !== undefined ? (
            <IconButton
              icon={backIcon ?? selectRTL('arrow-left', 'arrow-right')}
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
        style={[styles.surface, style]}
        role={role ?? 'complementary'}
        accessibilityLabel={accessibleName}
      >
        {content}
      </View>
    )
  }

  // 'end' is the right edge in LTR. The detached margin adds to the travel,
  // so the sheet leaves the screen completely.
  const travel = width + (detached ? SIDE_SHEET_DETACHED_MARGIN : 0)
  const entersFromRight = (edge === 'end') !== isRTLDirection()
  const hiddenOffset = entersFromRight ? travel : -travel

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
