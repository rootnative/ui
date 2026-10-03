import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons'
import type { IconRenderProps } from '@rootnative/core'
import type { ComponentProps, ReactNode } from 'react'

type MdiName = ComponentProps<typeof MaterialDesignIcons>['name']

/**
 * The resolver `renderWithTheme` installs by default. It is the test-side
 * copy of `mdiResolver` from `@rootnative/components/mdi`: utils cannot import
 * components, and the suite renders string icons the way an Expo app does.
 * Each Jest setup mocks the icon package to a `Text` that holds the icon name.
 */
export function testMdiResolver(
  name: string,
  props: IconRenderProps,
): ReactNode {
  return (
    <MaterialDesignIcons
      name={name as MdiName}
      size={props.size}
      color={props.color}
    />
  )
}
