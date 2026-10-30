import { useTheme } from '@rootnative/core'
import { useMemo } from 'react'
import { View } from 'react-native'
import { FAB } from '../fab'
import { IconButton } from '../icon-button'
import { AppBarContentColorContext } from '../icon-button/context'
import { SafeAreaView } from '../safe-area'
import type { Edge } from '../safe-area'
import { createStyles } from './styles'
import type { BottomAppBarProps } from './types'

const BOTTOM_EDGE: Edge[] = ['bottom']

export function BottomAppBar({
  actions,
  leading,
  fab,
  insetBottom = false,
  containerColor,
  contentColor,
  style,
  ...rest
}: BottomAppBarProps) {
  const theme = useTheme()
  const styles = useMemo(
    () => createStyles(theme, containerColor),
    [theme, containerColor],
  )
  const resolvedContentColor = contentColor ?? theme.colors.onSurfaceVariant

  const leadingContent = useMemo(() => {
    if (leading) {
      return leading
    }

    if (!actions || actions.length === 0) {
      return null
    }

    return actions.map((action, index) => (
      <View key={`${String(action.icon)}-${index}`} style={styles.iconFrame}>
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
    <View role="toolbar" {...rest} style={[styles.root, style]}>
      {insetBottom ? (
        <SafeAreaView edges={BOTTOM_EDGE}>{row}</SafeAreaView>
      ) : (
        row
      )}
    </View>
  )
}
