import { Motion } from '@rootnative/inertia'
import {
  getStyle,
  renderSettled,
  renderWithTheme,
} from '@rootnative/utils/test'
import { fireEvent, screen } from '@testing-library/react-native'
import { Switch } from '../switch'

// 52 track - 2 * 4 padding - 24 on-thumb.
const THUMB_TRANSLATE_X = 20

const entrance = (
  <Motion.View
    testID="entrance"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  />
)

function thumbTranslateX() {
  const { transform } = getStyle(screen.getByTestId('switch-thumb')) as {
    transform?: Array<{ translateX?: number }>
  }
  return transform?.[0]?.translateX
}

describe('renderSettled', () => {
  describe('entrance animations', () => {
    // Pins the deliberate blindness of the plain helper. `renderWithTheme` is a
    // single-pass render on purpose — flushing it would silently change what
    // every one of its 400+ call sites asserts. If this fails, someone has
    // "fixed" it and that blast radius needs a conscious decision.
    it('renderWithTheme still reads the initial value', () => {
      renderWithTheme(entrance)
      expect(getStyle(screen.getByTestId('entrance')).opacity).toBe(0)
    })

    it('settles on mount', () => {
      renderSettled(entrance)
      expect(getStyle(screen.getByTestId('entrance')).opacity).toBe(1)
    })
  })

  describe('progress-driven transitions', () => {
    it('is already settled at mount, like renderWithTheme', () => {
      renderSettled(<Switch value />)
      expect(thumbTranslateX()).toBe(THUMB_TRANSLATE_X)
    })

    it('settles after a prop change, without an explicit flush', () => {
      const { rerender } = renderSettled(<Switch value={false} />)
      expect(thumbTranslateX()).toBe(0)

      rerender(<Switch value />)
      expect(thumbTranslateX()).toBe(THUMB_TRANSLATE_X)
    })

    it('settles after an interaction, once flushed', () => {
      const { flush } = renderSettled(<Switch />)
      // The press is its own render pass, and that pass runs the worklet before
      // its effect writes the new progress — so the settled value needs one
      // more pass on top.
      fireEvent.press(screen.getByRole('switch'))
      flush()
      expect(thumbTranslateX()).toBe(THUMB_TRANSLATE_X)
    })

    it('flushes what is mounted, not the element first passed in', () => {
      const view = renderSettled(<Switch value={false} />)
      view.rerender(<Switch value />)

      // A flush that re-rendered the original element would revert the switch
      // to its off position here.
      view.flush()
      expect(thumbTranslateX()).toBe(THUMB_TRANSLATE_X)
    })
  })
})
