import { useTheme } from '@rootnative/core'
import { Motion, Presence } from '@rootnative/inertia'
import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactElement } from 'react'
import type {
  GestureResponderEvent,
  NativeSyntheticEvent,
  TargetedEvent,
} from 'react-native'
import { Pressable, Text, View } from 'react-native'
import { plainTextOf } from '../internal/plainText'
import { pointerEvents } from '../internal/pointerEvents'
import type { PressableKeyDownEvent } from '../internal/pressableKeyDown'
import { useAnchorPosition } from '../internal/useAnchorPosition'
import { useBackHandlerDismiss } from '../internal/useBackHandlerDismiss'
import { warnOnce } from '../internal/warnOnce'
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

/**
 * What the anchor is cloned with. `aria-describedby` is web-only — RN has no
 * concept of one view describing another, and react-native-web forwards it —
 * but it is the only thing that makes a keyboard user hear the tooltip at all:
 * the surface renders in a portal, far from the anchor in the DOM, so without
 * the pointer nothing connects them.
 */
type AnchorFocusEvent = NativeSyntheticEvent<TargetedEvent>

interface AnchorTriggerProps {
  onPress?: (event: GestureResponderEvent) => void
  onLongPress?: (event: GestureResponderEvent) => void
  onFocus?: (event: AnchorFocusEvent) => void
  onBlur?: (event: AnchorFocusEvent) => void
  'aria-describedby'?: string
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

  const tooltipId = `${useId()}-tooltip`

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

  // A rich tooltip is persistent: it has actions, and a mouse has to leave the
  // anchor to reach them. Only the outside press, an action, Escape, or the
  // Android back button take it down. A plain tooltip hides on hover out and
  // on blur.
  const hideOnHoverOut = isRich ? undefined : hide

  // Escape on the anchor, with the key stopped so an enclosing Dialog does
  // not close on the same press.
  const handleKeyDown = useCallback(
    (event: PressableKeyDownEvent) => {
      if (event.nativeEvent.key !== 'Escape' || !open) return
      event.preventDefault?.()
      event.stopPropagation?.()
      dismiss()
    },
    [open, dismiss],
  )

  const { anchorRef, layerRef, measure, onOverlayLayout, position } =
    useAnchorPosition({
      active: open,
      side,
      align,
      offset,
      screenMargin,
    })

  if (!isRich && (subhead !== undefined || actions)) {
    warnOnce(
      'tooltip-plain-with-rich-props',
      '[@rootnative/components] <Tooltip> renders `subhead` and `actions` on ' +
        'the rich variant only — a plain tooltip is a single line of text. ' +
        'Pass `variant="rich"` to show them.',
    )
  }

  // Touch opens a tooltip with a long press, which has to come from the anchor
  // itself: wrapping it in a second pressable would lose the gesture to the
  // anchor's own press handling. Focus comes from the anchor too: on web a
  // Pressable reports only its own focus, not one that bubbles up from a
  // child, so the wrapper never sees the anchor take a Tab stop. Hover is
  // caught on the wrapper below, because every RootNative pressable drives
  // its state layer from `onHoverIn` / `onHoverOut` and would overwrite an
  // injected pair.
  // The description is pointed at only while the tooltip is mounted — an
  // `aria-describedby` naming an absent id is announced as nothing at best.
  const trigger = useMemo(() => {
    if (!isValidElement(anchor)) return anchor
    const element = anchor as ReactElement<AnchorTriggerProps>
    const describedBy = open ? { 'aria-describedby': tooltipId } : {}
    if (isControlled) return cloneElement(element, describedBy)
    return cloneElement(element, {
      ...describedBy,
      onLongPress: (event: GestureResponderEvent) => {
        element.props.onLongPress?.(event)
        show()
      },
      // A tap is the anchor doing its job, not a request for help text.
      onPress: (event: GestureResponderEvent) => {
        element.props.onPress?.(event)
        hide()
      },
      onFocus: (event: AnchorFocusEvent) => {
        element.props.onFocus?.(event)
        show()
      },
      onBlur: (event: AnchorFocusEvent) => {
        element.props.onBlur?.(event)
        hideOnHoverOut?.()
      },
    })
  }, [anchor, isControlled, show, hide, hideOnHoverOut, open, tooltipId])

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

  // Plain tooltips take themselves down, so only the persistent variant
  // answers the Android back button.
  useBackHandlerDismiss(open && isRich, dismiss)

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

  const isPlainText = plainTextOf(children) !== undefined
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
        onHoverOut={isControlled ? undefined : hideOnHoverOut}
        // A key press on the anchor bubbles up to the wrapper, unlike focus.
        onKeyDown={handleKeyDown}
        onLongPress={isControlled ? undefined : show}
      >
        {trigger}
      </Pressable>

      <Portal priority={PORTAL_LAYERS.tooltip} hostName={hostName}>
        <View
          ref={layerRef}
          style={[styles.layer, pointerEvents.boxNone]}
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
                id={tooltipId}
                role="tooltip"
                accessibilityLiveRegion="polite"
                // A plain tooltip is decoration over the UI, so it stays out of
                // the way of touches; a rich one owns its actions.
                style={[
                  styles.surface,
                  positionStyle,
                  style,
                  isRich ? pointerEvents.auto : pointerEvents.none,
                ]}
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
