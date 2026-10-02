import { useTheme } from '@rootnative/core'
import { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'
import { NavigationItem } from '../navigation-bar/NavigationItem'
import { getNavigationBarColors } from '../navigation-bar/styles'
import { createNavigationRailStyles } from './styles'
import type { NavigationRailProps } from './types'

export function NavigationRail({
  items,
  value,
  defaultValue,
  onValueChange,
  labelVisibility = 'always',
  align = 'top',
  header,
  containerColor,
  contentColor,
  selectedContentColor,
  indicatorColor,
  labelStyle,
  style,
  accessibilityLabel,
  testID,
  ...rest
}: NavigationRailProps) {
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
    () => createNavigationRailStyles(theme, align, containerColor),
    [theme, align, containerColor],
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

  return (
    <View
      {...rest}
      testID={testID}
      style={[styles.root, style]}
      accessibilityLabel={accessibilityLabel}
    >
      {header !== undefined && header !== null ? (
        <View style={styles.header}>{header}</View>
      ) : null}
      <View
        style={styles.destinations}
        role="tablist"
        testID={testID === undefined ? undefined : `${testID}-destinations`}
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
            placement="rail"
            testID={
              testID === undefined ? undefined : `${testID}-item-${item.value}`
            }
          />
        ))}
      </View>
    </View>
  )
}
