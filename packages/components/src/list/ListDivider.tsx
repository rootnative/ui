import { Divider } from '../divider'
import type { ListDividerProps } from './types'

/**
 * Alias of the standalone `Divider`, kept so existing list code keeps working.
 * New code should import `Divider` from `@rootnative/components/divider`.
 */
export function ListDivider(props: ListDividerProps) {
  return <Divider {...props} />
}
