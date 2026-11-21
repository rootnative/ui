import { resolveLogicalKey } from '@rootnative/utils'
import { useContext, useMemo } from 'react'
import { Platform, Text, View } from 'react-native'
import { useMaterialTheme } from '../internal/useMaterialTheme'
import { warnOnce } from '../internal/warnOnce'
import { MenuGroupPlaceContext, useMenuContext } from './context'
import { placeItems } from './placeItems'
import {
  VERTICAL_MENU_GROUP_LABEL_PADDING_END,
  VERTICAL_MENU_GROUP_LABEL_PADDING_START,
  createMenuGroupStyles,
} from './styles'
import type { MenuGroupProps } from './types'

const isWeb = Platform.OS === 'web'

export function MenuGroup({
  label,
  children,
  style,
  testID,
  ...rest
}: MenuGroupProps) {
  const { variant, containerColor } = useMenuContext('Menu.Group')
  const place = useContext(MenuGroupPlaceContext)
  const theme = useMaterialTheme()
  const styles = useMemo(
    () => createMenuGroupStyles(theme, containerColor),
    [theme, containerColor],
  )
  const groupStyle = useMemo(
    () => [place === null ? undefined : [styles.surface, styles[place]], style],
    [place, styles, style],
  )
  // react-native-web writes a `paddingStart` to the left edge, also under
  // `dir="rtl"`, so the one-sided insets resolve against the document. The
  // keys resolve on each render, not in the memo, so the insets follow a
  // runtime change of `dir`.
  const startKey = resolveLogicalKey('paddingStart')
  const endKey = resolveLogicalKey('paddingEnd')
  const labelRowStyle = useMemo(
    () => [
      styles.labelRow,
      {
        [startKey]: VERTICAL_MENU_GROUP_LABEL_PADDING_START,
        [endKey]: VERTICAL_MENU_GROUP_LABEL_PADDING_END,
      },
    ],
    [styles, startKey, endKey],
  )

  if (variant !== 'vertical') {
    warnOnce(
      'menu-group-baseline',
      '[@rootnative/components] <Menu.Group> works in a vertical menu only. ' +
        'A baseline menu renders the children of the group, with no label.',
    )
    return <>{children}</>
  }

  // A `menu` owns only menu items, groups and separators. So on the web the
  // group takes the label as its name, and the label text is hidden. Native
  // has no group role: a screen reader reads the label before the items.
  const webGroup = isWeb
    ? { role: 'group' as const, 'aria-label': label }
    : undefined

  return (
    <View {...rest} {...webGroup} testID={testID} style={groupStyle}>
      {label !== undefined ? (
        <View style={labelRowStyle} aria-hidden={isWeb}>
          <Text style={styles.label}>{label}</Text>
        </View>
      ) : null}
      {placeItems(children)}
    </View>
  )
}
