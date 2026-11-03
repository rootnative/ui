import { useTheme } from '@rootnative/core'
import { useCallback, useContext, useMemo, useState } from 'react'
import { View } from 'react-native'
import { SafeAreaInsetsContext } from 'react-native-safe-area-context'
import { pointerEvents } from '../internal/pointerEvents'
import { SafeAreaView } from '../safe-area'
import type { Edge } from '../safe-area'
import { NavigationItem } from './NavigationItem'
import {
  FLOATING_BAR_GAP,
  createFloatingNavigationBarStyles,
  createNavigationBarStyles,
  floatingBarBottom,
  getNavigationBarColors,
} from './styles'
import type { NavigationBarProps } from './types'

const BOTTOM_EDGE: Edge[] = ['bottom']

export function NavigationBar({
  items,
  value,
  defaultValue,
  onValueChange,
  variant = 'docked',
  labelVisibility = 'always',
  insetBottom = false,
  containerColor,
  contentColor,
  selectedContentColor,
  indicatorColor,
  labelStyle,
  style,
  accessibilityLabel,
  testID,
  ...rest
}: NavigationBarProps) {
  const theme = useTheme()
  const floating = variant === 'floating'
  const colors = useMemo(
    () =>
      getNavigationBarColors(
        theme,
        contentColor,
        selectedContentColor,
        indicatorColor,
      ),
    [theme, contentColor, selectedContentColor, indicatorColor],
  )
  const styles = useMemo(
    () => createNavigationBarStyles(theme, containerColor),
    [theme, containerColor],
  )
  const floatingStyles = useMemo(
    () => createFloatingNavigationBarStyles(theme, containerColor),
    [theme, containerColor],
  )

  // Outside a `SafeAreaProvider` the floating bar has no insets to read, and
  // it keeps the plain gap to the edges.
  const insets = useContext(SafeAreaInsetsContext)
  const insetBottomValue = insets?.bottom ?? 0
  const insetLeft = insets?.left ?? 0
  const insetRight = insets?.right ?? 0
  const trackStyle = useMemo(
    () => [
      floatingStyles.track,
      {
        bottom: floatingBarBottom(insetBottomValue),
        paddingLeft: FLOATING_BAR_GAP + insetLeft,
        paddingRight: FLOATING_BAR_GAP + insetRight,
      },
      pointerEvents.boxNone,
    ],
    [floatingStyles.track, insetBottomValue, insetLeft, insetRight],
  )

  const isControlled = value !== undefined
  const [selfValue, setSelfValue] = useState(
    () => defaultValue ?? items[0]?.value,
  )
  const selected = isControlled ? value : selfValue

  const handlePress = useCallback(
    (next: string) => {
      if (!isControlled) setSelfValue(next)
      onValueChange?.(next)
    },
    [isControlled, onValueChange],
  )

  // The bar is a `navigation` landmark, `<nav>` on the web. The row inside
  // is the tablist, and it carries the name: a label on a plain view is not
  // read on web.
  const row = (
    <View
      style={floating ? floatingStyles.row : styles.row}
      role="tablist"
      accessibilityLabel={accessibilityLabel}
      testID={testID === undefined ? undefined : `${testID}-tablist`}
    >
      {items.map((item) => (
        <NavigationItem
          key={item.value}
          item={item}
          selected={item.value === selected}
          labelVisibility={floating ? 'never' : labelVisibility}
          colors={colors}
          labelStyle={floating ? undefined : labelStyle}
          onPress={handlePress}
          placement={floating ? 'floating' : 'bar'}
          testID={
            testID === undefined ? undefined : `${testID}-item-${item.value}`
          }
        />
      ))}
    </View>
  )

  if (floating) {
    return (
      <View style={trackStyle}>
        <View
          role="navigation"
          {...rest}
          style={[floatingStyles.capsule, style]}
          testID={testID}
        >
          {row}
        </View>
      </View>
    )
  }

  return (
    <View
      role="navigation"
      {...rest}
      style={[styles.root, style]}
      testID={testID}
    >
      {insetBottom ? (
        <SafeAreaView edges={BOTTOM_EDGE}>{row}</SafeAreaView>
      ) : (
        row
      )}
    </View>
  )
}
