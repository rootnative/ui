/**
 * The react-native-web tab-stop facts that `@rootnative/inertia` documents as
 * measured truth, pinned where they can be measured.
 *
 * `useGesture` returns two handler bags, and its docs pick between them on one
 * claim: **a `Pressable` is a tab stop even when it does nothing.** That is why
 * `pointerHandlers` exists at all. The claim is stated as fact in inertia's
 * `useGesture` doc comments and in its `llms.txt`, and nothing in inertia can
 * hold it — that repository has no jsdom project, so a react-native-web release
 * could make the guidance wrong with every inertia test still green. `ui` has
 * the DOM project and consumes `useGesture`, so the guard lives here.
 *
 * Measured against react-native-web 0.21:
 *
 * | rendered | `tabindex` |
 * | --- | --- |
 * | `Pressable`, no `onPress` | `0` |
 * | `+ accessible={false} focusable={false}` | still `0` |
 * | `View` + `onPointerEnter` / `onPointerLeave` | none |
 *
 * Row 2 is the one that earns the file. `accessible={false}` and
 * `focusable={false}` are the two props a reader reaches for to suppress the
 * stop, they read as if they work, and they do not. Without this test the
 * natural repair for a future regression is to add them and believe the
 * problem is solved.
 *
 * Read `tabindex`, never the props. RNTL asserts on the React prop, so a
 * native-project test here would assert that `focusable={false}` was passed —
 * true, and beside the point. Only the DOM says whether a keyboard stop
 * exists. This is the same blindness `aria.web.test.tsx` was written for.
 *
 * `focus.web.test.tsx` covers the `ui` side of tab order: which of this
 * library's components are stops, and where the count must not grow. This file
 * covers the primitives underneath them.
 */
import { useGesture } from '@rootnative/inertia'
import { renderHook } from '@testing-library/react'
import { Pressable, Text, View } from 'react-native'
import { renderWeb } from './render-web'

function tabIndexOf(ui: Parameters<typeof renderWeb>[0]) {
  const { container } = renderWeb(ui)
  const node = container.querySelector('[data-testid="surface"]')
  expect(node).toBeTruthy()
  return node!.getAttribute('tabindex')
}

describe('a Pressable is a tab stop whatever it does', () => {
  it('is a stop with no onPress', () => {
    expect(
      tabIndexOf(
        <Pressable testID="surface">
          <Text>Card</Text>
        </Pressable>,
      ),
    ).toBe('0')
  })

  it('is still a stop with accessible and focusable both false', () => {
    expect(
      tabIndexOf(
        <Pressable testID="surface" accessible={false} focusable={false}>
          <Text>Card</Text>
        </Pressable>,
      ),
    ).toBe('0')
  })
})

describe('a View carrying pointer handlers is not a tab stop', () => {
  it('renders no tabindex at all', () => {
    expect(
      tabIndexOf(
        <View
          testID="surface"
          onPointerEnter={() => {}}
          onPointerLeave={() => {}}
        >
          <Text>Card</Text>
        </View>,
      ),
    ).toBeNull()
  })

  it('still renders none when the handlers come from useGesture', () => {
    const { result } = renderHook(() => useGesture())

    // The bag inertia recommends for a hover-only surface. Spreading it must
    // not turn the View into a stop — that is the whole reason the bag exists.
    expect(
      tabIndexOf(
        <View testID="surface" {...result.current.pointerHandlers}>
          <Text>Card</Text>
        </View>,
      ),
    ).toBeNull()
  })
})
