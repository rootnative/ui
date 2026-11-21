import { resolveLogicalKey } from '@rootnative/utils'
import { useMemo } from 'react'
import type { ViewStyle } from 'react-native'
import { View } from 'react-native'
import { useMaterialTheme } from '../internal/useMaterialTheme'
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
  const { spacing } = useMaterialTheme()

  // The one-sided insets take keys from `resolveLogicalKey`: react-native-web
  // resolves a `paddingStart` to the left edge under `dir="rtl"`. The keys
  // resolve on each render, not in the memo, so the insets follow a runtime
  // change of `dir`. The two-sided ones are symmetric.
  const paddingStartKey = resolveLogicalKey('paddingStart')
  const paddingEndKey = resolveLogicalKey('paddingEnd')
  const marginStartKey = resolveLogicalKey('marginStart')
  const marginEndKey = resolveLogicalKey('marginEnd')
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
      ...(ps !== undefined && { [paddingStartKey]: s(ps) }),
      ...(pe !== undefined && { [paddingEndKey]: s(pe) }),
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
      ...(ms !== undefined && { [marginStartKey]: s(ms) }),
      ...(me !== undefined && { [marginEndKey]: s(me) }),
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
    paddingStartKey,
    paddingEndKey,
    marginStartKey,
    marginEndKey,
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
