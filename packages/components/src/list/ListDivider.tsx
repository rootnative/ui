import { Divider } from '../divider'
import type { ListDividerProps } from './types'

/**
 * Alias of the standalone `Divider`. The name is kept so list code keeps
 * importing it, but the props are `DividerProps` now — the old boolean `inset`
 * is `insetStart`, which also takes a dp number. New code should import
 * `Divider` from `@rootnative/components/divider`.
 */
export function ListDivider(props: ListDividerProps) {
  return <Divider {...props} />
}
