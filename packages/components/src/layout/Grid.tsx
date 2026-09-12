import { useBreakpointValue, useTheme } from '@rootnative/core'
import { Stagger, type StaggerProps } from '@rootnative/inertia'
import React, { cloneElement, isValidElement, useMemo } from 'react'
import type { ViewStyle } from 'react-native'
import { View } from 'react-native'
import { GridCell } from './GridCell'
import { resolveSpacing } from './resolveSpacing'
import { Row } from './Row'
import type { GridCellProps, GridProps } from './types'

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

  // The geometry a Grid.Cell needs to size itself. Injected through
  // cloneElement rather than a context, so no new React context has to be
  // guarded by check:singletons. The field names are the module-private
  // contract declared in GridCell.tsx.
  const injected = useMemo(
    () =>
      ({
        gridColumns: resolvedColumns,
        gridHalfGap: halfGap,
      }) as Partial<GridCellProps>,
    [resolvedColumns, halfGap],
  )

  // One child → one cell. Split out so the `<Stagger>` branch below can
  // reuse it for the children it looks through to.
  const wrapCell = (child: React.ReactNode) => {
    if (child == null) return null
    // A Grid.Cell sizes itself, so wrapping it in the default cell would
    // pin it back to one column. Detect by reference, not displayName —
    // a minifier rewrites names, never identities.
    if (isValidElement(child) && child.type === GridCell) {
      return cloneElement(child as React.ReactElement<GridCellProps>, injected)
    }
    return <View style={cellStyle}>{child}</View>
  }

  return (
    <Row wrap rowGap={resolvedRowGap} {...rowProps} style={[rowStyle, style]}>
      {React.Children.map(children, (child) => {
        // `<Stagger>` renders a fragment of context providers and no host
        // view, and `React.Children.map` does not descend into a fragment —
        // so a stagger wrapping N cards arrives here as *one* child and
        // every card lands in a single cell. Look through it instead: cell
        // wrap its children, and keep the `Stagger` element itself so each
        // cell still sits under its own delay provider.
        //
        // The fix has to live here. `Stagger` already assigns its delays
        // per child rather than per parent slot, so the cascade was never
        // what broke — only the layout — and nothing `Stagger` could do
        // would help, because this collapse happens before it renders.
        if (isValidElement(child) && child.type === Stagger) {
          const stagger = child as React.ReactElement<StaggerProps>
          return cloneElement(
            stagger,
            undefined,
            React.Children.map(stagger.props.children, wrapCell),
          )
        }
        return wrapCell(child)
      })}
    </Row>
  )
}

Grid.Cell = GridCell
