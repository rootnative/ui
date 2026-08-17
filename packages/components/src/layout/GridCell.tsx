import { useBreakpointValue } from '@rootnative/core'
import { useMemo, useRef } from 'react'
import type { ViewStyle } from 'react-native'
import { View } from 'react-native'
import type { GridCellProps } from './types'

/**
 * Geometry the parent Grid injects when it clones the cell. Deliberately a
 * module-private type rather than part of `GridCellProps`: the fields are an
 * internal contract between Grid and GridCell, and putting them on the public
 * interface would both invite consumers to set them and demand documentation
 * from the `props-coverage` check.
 */
type GridCellInjected = {
  gridColumns?: number
  gridHalfGap?: number
}

export function GridCell(props: GridCellProps) {
  const { span = 1, style, ...rest } = props
  const {
    gridColumns,
    gridHalfGap = 0,
    ...viewProps
  } = rest as typeof rest & GridCellInjected
  const warnedRef = useRef(false)

  // The hook call must stay unconditional, so a plain number becomes a
  // constant one-entry map instead of skipping the hook.
  const resolvedSpan = useBreakpointValue(
    typeof span === 'number' ? { compact: span } : span,
  )

  if (gridColumns === undefined && __DEV__ && !warnedRef.current) {
    warnedRef.current = true
    console.error(
      '[@rootnative/components] <Grid.Cell> must be a direct child of a ' +
        '<Grid>. Rendering it full-width.',
    )
  }

  const cellStyle = useMemo<ViewStyle>(() => {
    // Outside a Grid there is no column count to span, so fall back to a
    // full-width block (the dev warning above names the misuse).
    const columns = gridColumns ?? 1
    const clamped = Math.min(Math.max(resolvedSpan, 1), columns)
    return {
      flexBasis: `${(100 * clamped) / columns}%` as unknown as number,
      flexShrink: 1,
      paddingStart: gridHalfGap,
      paddingEnd: gridHalfGap,
    }
  }, [gridColumns, gridHalfGap, resolvedSpan])

  return <View {...viewProps} style={[cellStyle, style]} />
}
