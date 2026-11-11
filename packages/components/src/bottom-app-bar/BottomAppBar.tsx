import { useTheme } from '@rootnative/core'
import {
  useAnimator,
  useHideOnScroll,
  useInterpolatedStyle,
  useMotionValue,
} from '@rootnative/inertia'
import { Animated } from '@rootnative/inertia/reanimated'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AccessibilityInfo, Platform, View } from 'react-native'
import type { LayoutChangeEvent, ViewProps } from 'react-native'
import { FAB } from '../fab'
import { IconButton } from '../icon-button'
import { AppBarContentColorContext } from '../icon-button/context'
import {
  barEdges,
  barSideEdges,
  useSideInsetBleed,
} from '../layout/edgesContext'
import { SafeAreaView } from '../safe-area'
import { BOTTOM_APP_BAR_HEIGHT, createStyles } from './styles'
import type { BottomAppBarProps } from './types'

type FocusEvent = Parameters<NonNullable<ViewProps['onFocus']>>[0]

function useScreenReaderEnabled(active: boolean): boolean {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    // react-native-web resolves `isScreenReaderEnabled` to `true` on every
    // page, so on web the check would keep every bar in place.
    if (!active || Platform.OS === 'web') {
      return
    }
    let mounted = true
    AccessibilityInfo.isScreenReaderEnabled().then((value) => {
      if (mounted) {
        setEnabled(value)
      }
    })
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setEnabled,
    )
    return () => {
      mounted = false
      subscription.remove()
    }
  }, [active])

  return active && enabled
}

export function BottomAppBar({
  actions,
  leading,
  fab,
  insetBottom = false,
  insetSides = true,
  scrollOffset,
  containerColor,
  contentColor,
  style,
  onLayout,
  onFocus,
  ...rest
}: BottomAppBarProps) {
  const theme = useTheme()
  const sideEdges = barSideEdges(insetSides)
  const sideInsetBleed = useSideInsetBleed(sideEdges)
  // The side insets keep the actions clear of the notch in landscape, see
  // `insetSides`. The bottom inset is opt-in, see `insetBottom`.
  const insetEdges = useMemo(
    () => barEdges(sideEdges, insetBottom ? 'bottom' : undefined),
    [sideEdges, insetBottom],
  )
  const styles = useMemo(
    () => createStyles(theme, containerColor),
    [theme, containerColor],
  )
  const resolvedContentColor = contentColor ?? theme.colors.onSurfaceVariant

  // The bar moves by its measured height, so the bottom inset and a height
  // from `style` leave it fully off screen.
  const [height, setHeight] = useState(BOTTOM_APP_BAR_HEIGHT)
  const hidesOnScroll = scrollOffset != null
  const screenReaderEnabled = useScreenReaderEnabled(hidesOnScroll)
  const restOffset = useMotionValue(0)
  const hideSource =
    scrollOffset && !screenReaderEnabled ? scrollOffset : restOffset
  const hidden = useHideOnScroll(hideSource, { distance: Math.max(1, height) })
  const hideStyle = useInterpolatedStyle(hidden, { translateY: [0, height] })
  const animate = useAnimator()

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      setHeight(event.nativeEvent.layout.height)
      onLayout?.(event)
    },
    [onLayout],
  )

  // On web, Tab can reach a control while the bar is off screen. Focus
  // bubbles to the root there, and the bar comes back.
  const handleFocus = useCallback(
    (event: FocusEvent) => {
      if (hidesOnScroll) {
        animate(hidden, 0, 'spring-default-spatial')
      }
      onFocus?.(event)
    },
    [animate, hidden, hidesOnScroll, onFocus],
  )

  const leadingContent = useMemo(() => {
    if (leading) {
      return leading
    }

    if (!actions || actions.length === 0) {
      return null
    }

    // Key by position: a key from the icon mounts a new button when a toggle
    // action changes its icon, and the focus goes away.
    return actions.map((action, index) => (
      <View key={index} style={styles.iconFrame}>
        <IconButton
          icon={action.icon}
          size="small"
          variant="standard"
          accessibilityLabel={action.accessibilityLabel}
          onPress={action.onPress}
          disabled={action.disabled}
        />
      </View>
    ))
  }, [actions, leading, styles.iconFrame])

  // The built-in buttons read their color from the context, not from
  // `iconColor`, so their hover and press layers derive from the slot color.
  const row = (
    <View style={styles.row}>
      <AppBarContentColorContext.Provider value={resolvedContentColor}>
        <View style={styles.slot}>{leadingContent}</View>
      </AppBarContentColorContext.Provider>
      {fab ? (
        <>
          <View style={styles.spacer} />
          <View style={styles.fabFrame}>
            <FAB
              icon={fab.icon}
              label={fab.label}
              variant={fab.variant ?? 'secondary'}
              elevated={false}
              accessibilityLabel={fab.accessibilityLabel}
              onPress={fab.onPress}
              disabled={fab.disabled}
            />
          </View>
        </>
      ) : null}
    </View>
  )

  // `toolbar` groups the actions for a screen reader. `role` in the props
  // replaces it.
  return (
    <Animated.View
      role="toolbar"
      {...rest}
      onLayout={handleLayout}
      onFocus={handleFocus}
      style={[
        styles.root,
        hidesOnScroll ? hideStyle : null,
        style,
        sideInsetBleed,
      ]}
    >
      <SafeAreaView edges={insetEdges}>{row}</SafeAreaView>
    </Animated.View>
  )
}
