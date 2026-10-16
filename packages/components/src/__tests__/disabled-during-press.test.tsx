import {
  getStyle,
  renderSettled,
  renderWithTheme,
} from '@rootnative/utils/test'
import { fireEvent, screen } from '@testing-library/react-native'
import type { ReactElement } from 'react'
import { Text } from 'react-native'
import * as Reanimated from 'react-native-reanimated'
import { Button } from '../button'
import { getButtonMorphRadii } from '../button/styles'
import { Card } from '../card'
import { Chip } from '../chip'
import { FAB } from '../fab'
import { IconButton } from '../icon-button'

// A view keeps the last value that an animated style wrote after the style
// leaves its `style` prop. So a control that removes its state-layer style
// when it becomes disabled during a press keeps the pressed color on a
// device. The Reanimated mock cannot show that, so these tests check the
// cause: the animated style stays on the container and resolves to the
// disabled color.

const ANIMATED = Symbol('animated')

/** Merges the animated styles in the `style` prop of a node. */
function animatedStyle(node: { props: { style?: unknown } }) {
  const out: Record<string, unknown> = {}
  const visit = (style: unknown) => {
    if (Array.isArray(style)) style.forEach(visit)
    else if (style && typeof style === 'object' && ANIMATED in style)
      Object.assign(out, style)
  }
  visit(node.props.style)
  return out
}

interface DisableCase {
  name: string
  render: (disabled: boolean) => ReactElement
}

const noop = () => {}

const CASES: readonly DisableCase[] = [
  {
    name: 'Button (filled)',
    render: (disabled) => (
      <Button testID="target" disabled={disabled}>
        Next
      </Button>
    ),
  },
  {
    name: 'Button (text)',
    render: (disabled) => (
      <Button testID="target" variant="text" disabled={disabled}>
        Next
      </Button>
    ),
  },
  {
    name: 'Card (filled)',
    render: (disabled) => (
      <Card testID="target" variant="filled" onPress={noop} disabled={disabled}>
        <Text>Body</Text>
      </Card>
    ),
  },
  {
    name: 'Chip',
    render: (disabled) => (
      <Chip testID="target" onPress={noop} disabled={disabled}>
        Tag
      </Chip>
    ),
  },
  {
    name: 'FAB',
    render: (disabled) => (
      <FAB
        testID="target"
        icon="plus"
        accessibilityLabel="Add"
        disabled={disabled}
      />
    ),
  },
  {
    name: 'IconButton (filled)',
    render: (disabled) => (
      <IconButton
        testID="target"
        variant="filled"
        icon="heart"
        accessibilityLabel="Like"
        disabled={disabled}
      />
    ),
  },
]

describe('a control that becomes disabled during a press', () => {
  beforeEach(() => {
    const useAnimatedStyle = Reanimated.useAnimatedStyle
    jest
      .spyOn(Reanimated, 'useAnimatedStyle')
      .mockImplementation((...args: Parameters<typeof useAnimatedStyle>) =>
        Object.defineProperty({ ...useAnimatedStyle(...args) }, ANIMATED, {
          value: true,
        }),
      )
  })

  afterEach(() => jest.restoreAllMocks())

  it.each(CASES)(
    '$name: keeps the state layer and shows the disabled color',
    ({ render }) => {
      const { rerender } = renderSettled(render(false))
      fireEvent(screen.getByTestId('target'), 'pressIn')
      rerender(render(true))

      const node = screen.getByTestId('target')
      expect(animatedStyle(node).backgroundColor).toBe(
        getStyle(node).backgroundColor,
      )
    },
  )

  it.each(CASES)(
    '$name: shows the rest color, not the pressed color, when enabled again',
    ({ render }) => {
      const { rerender } = renderSettled(render(false))
      const rest = animatedStyle(screen.getByTestId('target')).backgroundColor
      fireEvent(screen.getByTestId('target'), 'pressIn')
      rerender(render(true))
      rerender(render(false))

      expect(animatedStyle(screen.getByTestId('target')).backgroundColor).toBe(
        rest,
      )
    },
  )

  it.each(CASES)(
    '$name: shows the disabled color on the first frame of a disabled mount',
    ({ render }) => {
      // One render pass, no settle: the first frame is what the user sees
      // before any animation runs.
      renderWithTheme(render(true))
      const node = screen.getByTestId('target')
      expect(animatedStyle(node).backgroundColor).toBe(
        getStyle(node).backgroundColor,
      )
    },
  )

  it('Button: puts the pressed corner back to rest', () => {
    const { rest } = getButtonMorphRadii('small', 'round')
    const { rerender } = renderSettled(
      <Button testID="target" size="small">
        Next
      </Button>,
    )
    fireEvent(screen.getByTestId('target'), 'pressIn')
    rerender(
      <Button testID="target" size="small" disabled>
        Next
      </Button>,
    )
    expect(animatedStyle(screen.getByTestId('target')).borderRadius).toBe(rest)
  })
})
