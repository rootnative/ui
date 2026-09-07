import type {
  ReactTestRendererJSON,
  ReactTestRendererNode,
} from 'react-test-renderer'

/** One node of a `toJSON()` tree. */
export type RenderedNode = ReactTestRendererJSON

/**
 * Narrow a `toJSON()` result to the single root the test rendered.
 *
 * react-test-renderer 19.2 types `toJSON()` as
 * `null | ReactTestRendererJSON | ReactTestRendererJSON[]`, so reading `.props`
 * or `.children` off it no longer compiles. Every caller here renders one
 * element, so an array or a null is a broken test rather than a case to
 * handle: fail loudly instead of returning something that makes the assertion
 * below it pass for the wrong reason.
 */
export function rootOf(
  json: null | ReactTestRendererJSON | ReactTestRendererJSON[],
): RenderedNode {
  if (json === null) {
    throw new Error('toJSON() returned null: nothing rendered')
  }
  if (Array.isArray(json)) {
    throw new Error(
      `toJSON() returned ${json.length} roots, expected exactly 1`,
    )
  }
  return json
}

/**
 * The element children of a node.
 *
 * `children` is nullable and holds raw strings alongside elements. No caller
 * here asserts on a text node, so drop them and hand back a plain array.
 */
export function childrenOf(node: RenderedNode): RenderedNode[] {
  return (node.children ?? []).filter(
    (child: ReactTestRendererNode): child is RenderedNode =>
      typeof child !== 'string',
  )
}

/**
 * The first element child that matches, asserted to exist.
 *
 * A `find` that returns undefined means the rendered tree changed shape. That
 * should fail the test loudly rather than quietly skip the assertion below it.
 */
export function findChild(
  node: RenderedNode,
  predicate: (child: RenderedNode) => boolean,
): RenderedNode {
  const match = childrenOf(node).find(predicate)
  if (!match) {
    throw new Error('no child matched the predicate')
  }
  return match
}
