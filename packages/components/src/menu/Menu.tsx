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
import {
  BackHandler,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native'
import { useAnchorPosition } from '../internal/useAnchorPosition'
import { PORTAL_LAYERS } from '../portal/layers'
import { Portal } from '../portal/Portal'
import { MenuContext } from './context'
import type { MenuContextValue } from './context'
import { MenuItem } from './MenuItem'
import { createMenuStyles } from './styles'
import type { MenuProps } from './types'

/**
 * MD3 scales a menu in from 80% at the corner nearest its anchor. The same
 * values double as the pre-measurement state: the surface has to be laid out
 * before its size is known, so it mounts hidden and animates in once
 * `useAnchorPosition` resolves a position for it.
 */
const HIDDEN = { opacity: 0, scale: 0.8 }
const SHOWN = { opacity: 1, scale: 1 }

interface AnchorPressProps {
  onPress?: (event: GestureResponderEvent) => void
}

export function Menu({
  anchor,
  children,
  visible,
  onDismiss,
  side = 'bottom',
  align = 'start',
  offset = 0,
  screenMargin,
  containerColor,
  hostName,
  style,
  anchorStyle,
  dismissAccessibilityLabel = 'Close menu',
  testID,
}: MenuProps) {
  const theme = useTheme()
  const styles = useMemo(
    () => createMenuStyles(theme, containerColor),
    [theme, containerColor],
  )

  const isControlled = visible !== undefined
  const [selfVisible, setSelfVisible] = useState(false)
  const open = isControlled ? visible : selfVisible

  const dismiss = useCallback(() => {
    if (!isControlled) setSelfVisible(false)
    onDismiss?.()
  }, [isControlled, onDismiss])

  const { anchorRef, layerRef, measure, onOverlayLayout, position } =
    useAnchorPosition({
      active: open,
      side,
      align,
      offset,
      screenMargin,
    })

  const contextValue = useMemo<MenuContextValue>(() => ({ dismiss }), [dismiss])

  const warnedRef = useRef(false)
  if (
    __DEV__ &&
    !isControlled &&
    !isValidElement(anchor) &&
    !warnedRef.current
  ) {
    warnedRef.current = true
    console.error(
      '[@rootnative/components] <Menu> opens itself when `visible` is omitted, ' +
        'which needs a single element accepting `onPress` as its `anchor`. ' +
        'Pass `visible` + `onDismiss` to drive visibility yourself instead.',
    )
  }

  // Self-managing mode hooks the trigger's press rather than wrapping it in a
  // second Pressable, which would double up the state layer it already draws.
  const trigger = useMemo(() => {
    if (isControlled || !isValidElement(anchor)) return anchor
    const element = anchor as ReactElement<AnchorPressProps>
    return cloneElement(element, {
      onPress: (event: GestureResponderEvent) => {
        element.props.onPress?.(event)
        setSelfVisible(true)
      },
    })
  }, [anchor, isControlled])

  // Android hardware back closes the menu before it pops the navigation stack.
  useEffect(() => {
    if (!open || Platform.OS !== 'android') return
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        dismiss()
        return true
      },
    )
    return () => subscription.remove()
  }, [open, dismiss])

  const positionStyle = useMemo(
    () =>
      position === null
        ? null
        : {
            top: position.top,
            left: position.left,
            transformOrigin: position.transformOrigin,
          },
    [position],
  )

  const listStyle = useMemo(
    () => (position === null ? null : { maxHeight: position.maxHeight }),
    [position],
  )

  return (
    <>
      <View
        ref={anchorRef}
        style={anchorStyle}
        collapsable={false}
        onLayout={measure}
      >
        {trigger}
      </View>

      <Portal priority={PORTAL_LAYERS.menu} hostName={hostName}>
        <MenuContext.Provider value={contextValue}>
          <View
            ref={layerRef}
            style={styles.layer}
            pointerEvents="box-none"
            collapsable={false}
            onLayout={measure}
          >
            {/*
              Mounted only while open, so the exit animation does not keep
              swallowing presses on its way out. MD3 menus have no scrim, so
              this region is transparent — it exists to catch outside presses
              and to give screen readers a way out.
            */}
            {open ? (
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
                  testID={testID}
                  role="menu"
                  style={[styles.surface, positionStyle, style]}
                  initial={HIDDEN}
                  animate={position === null ? HIDDEN : SHOWN}
                  exit={HIDDEN}
                  transition="spring-fast-spatial"
                  onLayout={onOverlayLayout}
                >
                  <ScrollView
                    style={listStyle}
                    contentContainerStyle={styles.listContent}
                    bounces={false}
                  >
                    {children}
                  </ScrollView>
                </Motion.View>
              ) : null}
            </Presence>
          </View>
        </MenuContext.Provider>
      </Portal>
    </>
  )
}

Menu.Item = MenuItem
