import { Divider } from '../divider/Divider'
import { DRAWER_SECTION_INSET } from './styles'
import type { NavigationDrawerDividerProps } from './types'

/**
 * A `Divider` between drawer sections, inset to the MD3 28dp from the sheet
 * edge: the 12dp item inset the drawer already applies plus 16dp here.
 */
export function NavigationDrawerDivider(props: NavigationDrawerDividerProps) {
  return (
    <Divider
      {...props}
      insetStart={DRAWER_SECTION_INSET}
      insetEnd={DRAWER_SECTION_INSET}
    />
  )
}
