import { useTheme } from '@rootnative/core'
import { Motion, Presence } from '@rootnative/inertia'
import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactElement } from 'react'
import type { GestureResponderEvent } from 'react-native'
import { BackHandler, Platform, Pressable, Text, View } from 'react-native'
import { useAnchorPosition } from '../internal/useAnchorPosition'
import { PORTAL_LAYERS } from '../portal/layers'
import { Portal } from '../portal/Portal'
import {
  PLAIN_TOOLTIP_DURATION,
  TOOLTIP_ANCHOR_SPACING,
  createTooltipStyles,
} from './styles'
import type { TooltipProps } from './types'

/**
 * MD3 fades a tooltip in and out — no scale, unlike a menu. The hidden state
 * doubles as the pre-measurement state: the surface has to be laid out before
 * its size is known, so it mounts invisible and fades in once
 * `useAnchorPosition` resolves a position for it.
 */
const HIDDEN = { opacity: 0 }
const SHOWN = { opacity: 1 }

interface AnchorTriggerProps {
  onPress?: (event: GestureResponderEvent) => void
  onLongPress?: (event: GestureResponderEvent) => void
}

export function Tooltip({
  anchor,
  children,
  variant = 'plain',
  subhead,
  actions,
  visible,
  onDismiss,
  side = 'top',
  align = 'center',
  offset = TOOLTIP_ANCHOR_SPACING,
  screenMargin,
  duration = PLAIN_TOOLTIP_DURATION,
  containerColor,
  contentColor,
  hostName,
  style,
  textStyle,
  anchorStyle,
  dismissAccessibilityLabel = 'Close tooltip',
  testID,
  ...rest
}: TooltipProps) {
  const theme = useTheme()
  const isRich = variant === 'rich'
  const hasActions = isRich && Boolean(actions)
  const styles = useMemo(
    () =>
      createTooltipStyles(
        theme,
        variant,
        hasActions,
        containerColor,
        contentColor,
      ),
    [theme, variant, hasActions, containerColor, contentColor],
  )

  const isControlled = visible !== undefined
  const [selfVisible, setSelfVisible] = useState(false)
  const open = isControlled ? visible : selfVisible

  const show = useCallback(() => {
    if (!isControlled) setSelfVisible(true)
  }, [isControlled])

  const dismiss = useCallback(() => {
    if (!isControlled) setSelfVisible(false)
    onDismiss?.()
  }, [isControlled, onDismiss])

  // Anchor-driven hiding (hover out, anchor press) only reports a dismissal
  // that actually happened — a pointer sweeping across a control that never
  // showed a tooltip must not fire `onDismiss`.
  const hide = useCallback(() => {
    if (open) dismiss()
  }, [open, dismiss])

  const { anchorRef, layerRef, measure, onOverlayLayout, position } =
    useAnchorPosition({
      active: open,
      side,
      align,
      offset,
      screenMargin,
    })

  const warnedRef = useRef(false)
  if (
    __DEV__ &&
    !isRich &&
    (subhead !== undefined || actions) &&
    !warnedRef.current
  ) {
    warnedRef.current = true
    console.error(
      '[@rootnative/components] <Tooltip> renders `subhead` and `actions` on ' +
        'the rich variant only — a plain tooltip is a single line of text. ' +
        'Pass `variant="rich"` to show them.',
    )
  }

  // Touch opens a tooltip with a long press, which has to come from the anchor
  // itself: wrapping it in a second pressable would lose the gesture to the
  // anchor's own press handling. Hover is caught on the wrapper below, because
  // every RootNative pressable drives its state layer from `onHoverIn` /
  // `onHoverOut` and would overwrite an injected pair.
  const trigger = useMemo(() => {
    if (isControlled || !isValidElement(anchor)) return anchor
    const element = anchor as ReactElement<AnchorTriggerProps>
    return cloneElement(element, {
      onLongPress: (event: GestureResponderEvent) => {
        element.props.onLongPress?.(event)
        show()
      },
      // A tap is the anchor doing its job, not a request for help text.
      onPress: (event: GestureResponderEvent) => {
        element.props.onPress?.(event)
        hide()
      },
    })
  }, [anchor, isControlled, show, hide])

  // Read through a ref so an inline `onDismiss` (a new function every render)
  // cannot restart the timeout on each render and keep the tooltip up forever.
  const dismissRef = useRef(dismiss)
  useEffect(() => {
    dismissRef.current = dismiss
  })

  // Plain tooltips are transient: MD3 takes them down after 1.5s whether or not
  // the pointer is still on the anchor. Rich tooltips are persistent and wait
  // for a dismissal.
  useEffect(() => {
    if (!open || isRich || duration <= 0) return
    const timeout = setTimeout(() => dismissRef.current(), duration)
    return () => clearTimeout(timeout)
  }, [open, isRich, duration])

  // Android hardware back closes a persistent tooltip before it pops the
  // navigation stack. Plain tooltips take themselves down, so they never
  // swallow a back press.
  useEffect(() => {
    if (!open || !isRich || Platform.OS !== 'android') return
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        dismiss()
        return true
      },
    )
    return () => subscription.remove()
  }, [open, isRich, dismiss])

  const positionStyle = useMemo(
    () =>
      position === null
        ? null
        : {
            top: position.top,
            left: position.left,
            maxHeight: position.maxHeight,
          },
    [position],
  )

  const resolvedTextStyle = useMemo(
    () => [styles.text, textStyle],
    [styles.text, textStyle],
  )
  const wrapperStyle = useMemo(
    () => [styles.anchorWrapper, anchorStyle],
    [styles.anchorWrapper, anchorStyle],
  )

  const isPlainText =
    typeof children === 'string' || typeof children === 'number'
  const body = isPlainText ? (
    <Text style={resolvedTextStyle}>{children}</Text>
  ) : (
    children
  )

  return (
    <>
      <Pressable
        ref={anchorRef}
        style={wrapperStyle}
        collapsable={false}
        onLayout={measure}
        // The wrapper exists to measure the anchor and to catch hover — it is
        // not a control. Leaving it out of the accessibility tree keeps the
        // anchor's own role and label as the only thing a screen reader sees,
        // and `tabIndex={-1}` keeps react-native-web from giving every anchor a
        // second tab stop (RNW makes an enabled Pressable focusable).
        accessible={false}
        importantForAccessibility="no"
        tabIndex={-1}
        onHoverIn={isControlled ? undefined : show}
        onHoverOut={isControlled ? undefined : hide}
        onLongPress={isControlled ? undefined : show}
      >
        {trigger}
      </Pressable>

      <Portal priority={PORTAL_LAYERS.tooltip} hostName={hostName}>
        <View
          ref={layerRef}
          style={styles.layer}
          pointerEvents="box-none"
          collapsable={false}
          onLayout={measure}
        >
          {/*
            Only the persistent variant catches outside presses. A plain
            tooltip must never stand between the user and the UI it describes.
          */}
          {open && isRich ? (
            <Pressable
              style={styles.dismissRegion}
              onPress={dismiss}
              accessibilityLabel={dismissAccessibilityLabel}
              role="button"
            />
          ) : null}

          <Presence>
            {open ? (
              <Motion.View
                key="surface"
                {...rest}
                testID={testID}
                role="tooltip"
                accessibilityLiveRegion="polite"
                // A plain tooltip is decoration over the UI, so it stays out of
                // the way of touches; a rich one owns its actions.
                pointerEvents={isRich ? 'auto' : 'none'}
                style={[styles.surface, positionStyle, style]}
                initial={HIDDEN}
                animate={position === null ? HIDDEN : SHOWN}
                exit={HIDDEN}
                transition="spring-fast-effects"
                onLayout={onOverlayLayout}
              >
                {isRich && subhead !== undefined ? (
                  <Text style={styles.subhead}>{subhead}</Text>
                ) : null}
                {body}
                {hasActions ? (
                  <View style={styles.actions}>{actions}</View>
                ) : null}
              </Motion.View>
            ) : null}
          </Presence>
        </View>
      </Portal>
    </>
  )
}
