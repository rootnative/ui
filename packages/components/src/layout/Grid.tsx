import { useBreakpointValue, useTheme } from '@rootnative/core'
import React, { useMemo } from 'react'
import type { ViewStyle } from 'react-native'
import { View } from 'react-native'
import { resolveSpacing } from './resolveSpacing'
import { Row } from './Row'
import type { GridProps } from './types'

export function Grid({
  columns,
  gap,
  columnGap,
  rowGap,
  children,
  style,
  ...rowProps
}: GridProps) {
  const { spacing } = useTheme()
  // The hook call must stay unconditional, so a plain number becomes a
  // constant one-entry map instead of skipping the hook.
  const resolvedColumns = useBreakpointValue(
    typeof columns === 'number' ? { compact: columns } : columns,
  )
  const resolvedColumnGap = resolveSpacing(spacing, columnGap ?? gap)
  const resolvedRowGap = resolveSpacing(spacing, rowGap ?? gap)
  const halfGap = resolvedColumnGap ? resolvedColumnGap / 2 : 0

  const cellStyle = useMemo<ViewStyle>(
    () => ({
      flexBasis: `${100 / resolvedColumns}%` as unknown as number,
      flexShrink: 1,
      paddingStart: halfGap,
      paddingEnd: halfGap,
    }),
    [resolvedColumns, halfGap],
  )

  const rowStyle = useMemo<ViewStyle>(
    () => ({
      marginStart: -halfGap,
      marginEnd: -halfGap,
    }),
    [halfGap],
  )

  return (
    <Row wrap rowGap={resolvedRowGap} {...rowProps} style={[rowStyle, style]}>
      {React.Children.map(children, (child) =>
        child != null ? <View style={cellStyle}>{child}</View> : null,
      )}
    </Row>
  )
}
