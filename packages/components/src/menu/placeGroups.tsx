import { isValidElement } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { MenuGroupPlaceContext } from './context'
import { MenuGroup } from './MenuGroup'
import { flatten, placeItems, placeOf } from './placeItems'

function isMenuGroup(node: ReactNode): node is ReactElement {
  return isValidElement(node) && node.type === MenuGroup
}

interface MenuLayout {
  /** Two or more groups, each on a surface of its own. */
  stacked: boolean
  content: ReactNode
}

/**
 * Lays out the children of a vertical menu. With no `Menu.Group`, the menu
 * surface is the one group, and the items get their places. With groups, the
 * other children between them form groups of their own, so every item is on
 * a group. One group stays on the menu surface. Two or more groups each draw
 * their own surface and get their places. Groups count when they are direct
 * children, in an array, or in a fragment.
 */
export function placeGroups(children: ReactNode): MenuLayout {
  const nodes = flatten(children)
  if (!nodes.some(isMenuGroup)) {
    return { stacked: false, content: placeItems(children) }
  }

  const groups: ReactElement[] = []
  let run: ReactNode[] = []
  const closeRun = () => {
    if (run.length === 0) return
    // A key from `Children.toArray` starts with `.` or `$`, so this one
    // can't match the key of a group.
    groups.push(<MenuGroup key={`run-${groups.length}`}>{run}</MenuGroup>)
    run = []
  }
  for (const node of nodes) {
    if (isMenuGroup(node)) {
      closeRun()
      groups.push(node)
    } else {
      run.push(node)
    }
  }
  closeRun()

  if (groups.length === 1) return { stacked: false, content: groups }
  return {
    stacked: true,
    content: groups.map((group, index) => (
      <MenuGroupPlaceContext.Provider
        key={group.key}
        value={placeOf(index, groups.length)}
      >
        {group}
      </MenuGroupPlaceContext.Provider>
    )),
  }
}
