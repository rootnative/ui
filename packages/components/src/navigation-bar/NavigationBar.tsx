import { useTheme } from '@rootnative/core'
import { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'
import { SafeAreaView } from '../safe-area'
import type { Edge } from '../safe-area'
import { NavigationItem } from './NavigationItem'
import { createNavigationBarStyles, getNavigationBarColors } from './styles'
import type { NavigationBarProps } from './types'

const BOTTOM_EDGE: Edge[] = ['bottom']

export function NavigationBar({
  items,
  value,
  defaultValue,
  onValueChange,
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
      style={styles.row}
      role="tablist"
      accessibilityLabel={accessibilityLabel}
      testID={testID === undefined ? undefined : `${testID}-tablist`}
    >
      {items.map((item) => (
        <NavigationItem
          key={item.value}
          item={item}
          selected={item.value === selected}
          labelVisibility={labelVisibility}
          colors={colors}
          labelStyle={labelStyle}
          onPress={handlePress}
          testID={
            testID === undefined ? undefined : `${testID}-item-${item.value}`
          }
        />
      ))}
    </View>
  )

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
