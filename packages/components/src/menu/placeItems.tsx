import { Children, Fragment, cloneElement, isValidElement } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { MenuItemPlaceContext } from './context'
import type { MenuPlace } from './context'
import { MenuItem } from './MenuItem'

function isMenuItem(node: ReactNode): node is ReactElement {
  return isValidElement(node) && node.type === MenuItem
}

export function placeOf(index: number, count: number): MenuPlace {
  if (count === 1) return 'alone'
  if (index === 0) return 'first'
  if (index === count - 1) return 'last'
  return 'middle'
}

/**
 * `Children.toArray` opens the arrays that `.map` returns, but not a fragment.
 * Each node from inside a fragment gets the fragment key as a prefix, so two
 * fragments can't give the same key twice.
 */
export function flatten(children: ReactNode, prefix = ''): ReactNode[] {
  return Children.toArray(children).flatMap((node) => {
    if (!isValidElement(node)) return [node]
    const key = `${prefix}${node.key ?? ''}`
    if (node.type === Fragment) {
      const { children: inner } = node.props as { children?: ReactNode }
      return flatten(inner, key)
    }
    return [prefix ? cloneElement(node, { key }) : node]
  })
}

/**
 * Gives each `Menu.Item` among `children` its place, through context, so the
 * item can round its outer corners. Items count when they are direct children,
 * in an array, or in a fragment. Other children, such as a `Divider`, don't
 * count.
 */
export function placeItems(children: ReactNode): ReactNode {
  const nodes = flatten(children)
  const count = nodes.filter(isMenuItem).length
  let index = -1
  return nodes.map((node) => {
    if (!isMenuItem(node)) return node
    index += 1
    return (
      <MenuItemPlaceContext.Provider
        key={node.key}
        value={placeOf(index, count)}
      >
        {node}
      </MenuItemPlaceContext.Provider>
    )
  })
}
