import { StyleSheet } from 'react-native'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      /** Asserts the element has a specific flattened style property value. */
      toHaveStyleProp(property: string, expected: unknown): R
      /** Asserts the element has matching accessibilityState entries. */
      toHaveAccessibilityState(expected: Record<string, unknown>): R
    }
  }
}

interface TestElement {
  props: { style?: unknown; accessibilityState?: Record<string, unknown> }
}

/**
 * Custom Jest matchers for RootNative component testing.
 *
 * @example
 * // In jest.setup.js:
 * import { rootNativeMatchers } from '@rootnative/utils/test'
 * expect.extend(rootNativeMatchers)
 *
 * // In tests:
 * expect(button).toHaveStyleProp('backgroundColor', '#FF0000')
 * expect(checkbox).toHaveAccessibilityState({ checked: true })
 */
export const rootNativeMatchers = {
  /**
   * Asserts that a rendered element has a specific flattened style property value.
   *
   * @example
   * expect(screen.getByRole('button')).toHaveStyleProp('backgroundColor', '#FF0000')
   * expect(screen.getByText('Label')).toHaveStyleProp('color', '#00FF00')
   */
  toHaveStyleProp(received: TestElement, property: string, expected: unknown) {
    const flatStyle = (StyleSheet.flatten(received.props.style as never) ??
      {}) as Record<string, unknown>
    const actual = flatStyle[property]
    const pass = actual === expected

    return {
      pass,
      message: () =>
        `expected style.${property} to${pass ? ' not' : ''} be ${String(expected)}, received ${String(actual)}`,
    }
  },

  /**
   * Asserts that a rendered element has matching accessibilityState entries.
   *
   * @example
   * expect(screen.getByRole('checkbox')).toHaveAccessibilityState({ checked: true })
   * expect(screen.getByRole('switch')).toHaveAccessibilityState({ disabled: true })
   */
  toHaveAccessibilityState(
    received: TestElement,
    expected: Record<string, unknown>,
  ) {
    const actual = received.props.accessibilityState ?? {}
    const mismatches: string[] = []

    for (const [key, value] of Object.entries(expected)) {
      if (actual[key] !== value) {
        mismatches.push(
          `  ${key}: expected ${String(value)}, received ${String(actual[key])}`,
        )
      }
    }

    const pass = mismatches.length === 0

    return {
      pass,
      message: () =>
        pass
          ? `expected accessibilityState not to match ${JSON.stringify(expected)}`
          : `accessibilityState mismatch:\n${mismatches.join('\n')}`,
    }
  },
}
