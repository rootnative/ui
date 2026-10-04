import { useTheme } from '@rootnative/core'
import { resolveLogical } from '@rootnative/utils'
import { useMemo } from 'react'
import type { ViewStyle } from 'react-native'
import { View } from 'react-native'
import { resolveSpacing } from './resolveSpacing'
import type { BoxProps, SpacingValue } from './types'

export function Box({
  p,
  px,
  py,
  pt,
  pb,
  ps,
  pe,
  m,
  mx,
  my,
  mt,
  mb,
  ms,
  me,
  gap,
  rowGap,
  columnGap,
  flex,
  align,
  justify,
  bg,
  style,
  ...viewProps
}: BoxProps) {
  const { spacing } = useTheme()

  // The one-sided insets go through `resolveLogical`: this object is an
  // inline style, and react-native-web resolves an inline `paddingStart` to
  // the left edge under `dir="rtl"`. The two-sided ones are symmetric.
  const layoutStyle = useMemo<ViewStyle>(() => {
    const s = (v: SpacingValue | undefined) => resolveSpacing(spacing, v)
    return {
      ...(p !== undefined && { padding: s(p) }),
      ...(px !== undefined && {
        paddingStart: s(px),
        paddingEnd: s(px),
      }),
      ...(py !== undefined && {
        paddingTop: s(py),
        paddingBottom: s(py),
      }),
      ...(pt !== undefined && { paddingTop: s(pt) }),
      ...(pb !== undefined && { paddingBottom: s(pb) }),
      ...(ps !== undefined && resolveLogical('paddingStart', s(ps))),
      ...(pe !== undefined && resolveLogical('paddingEnd', s(pe))),
      ...(m !== undefined && { margin: s(m) }),
      ...(mx !== undefined && {
        marginStart: s(mx),
        marginEnd: s(mx),
      }),
      ...(my !== undefined && {
        marginTop: s(my),
        marginBottom: s(my),
      }),
      ...(mt !== undefined && { marginTop: s(mt) }),
      ...(mb !== undefined && { marginBottom: s(mb) }),
      ...(ms !== undefined && resolveLogical('marginStart', s(ms))),
      ...(me !== undefined && resolveLogical('marginEnd', s(me))),
      ...(gap !== undefined && { gap: s(gap) }),
      ...(rowGap !== undefined && { rowGap: s(rowGap) }),
      ...(columnGap !== undefined && { columnGap: s(columnGap) }),
      ...(flex !== undefined && { flex }),
      ...(align !== undefined && { alignItems: align }),
      ...(justify !== undefined && { justifyContent: justify }),
      ...(bg !== undefined && { backgroundColor: bg }),
    }
  }, [
    spacing,
    p,
    px,
    py,
    pt,
    pb,
    ps,
    pe,
    m,
    mx,
    my,
    mt,
    mb,
    ms,
    me,
    gap,
    rowGap,
    columnGap,
    flex,
    align,
    justify,
    bg,
  ])

  return <View {...viewProps} style={[layoutStyle, style]} />
}
