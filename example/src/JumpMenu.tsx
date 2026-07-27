import { Divider, IconButton, Menu, MenuItem } from '@rootnative/components'
import { usePathname, useRouter } from 'expo-router'
import { catalogEntries } from './catalog'

/**
 * AppBar action that opens the full component list, so any screen is one tap
 * from any other. Uses `router.navigate` rather than `push` so hopping around
 * pops back to a screen already in the stack instead of growing it.
 */
export function JumpMenu() {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <Menu
      align="end"
      offset={4}
      maxHeight={360}
      anchor={
        <IconButton
          icon="view-list-outline"
          accessibilityLabel="Jump to a component"
        />
      }
    >
      <MenuItem
        label="Home"
        leadingIcon="home-outline"
        trailingIcon={pathname === '/' ? 'check' : undefined}
        onPress={() => router.navigate('/')}
      />
      <Divider />
      {catalogEntries.map((entry) => (
        <MenuItem
          key={entry.route}
          label={entry.label}
          trailingIcon={pathname === entry.route ? 'check' : undefined}
          onPress={() => router.navigate(entry.route)}
        />
      ))}
    </Menu>
  )
}
