import { lightTheme } from '@rootnative/core'
import { alphaColor } from '@rootnative/utils'
import {
  getStyle,
  renderSettled,
  renderWithTheme,
} from '@rootnative/utils/test'
import { screen, fireEvent } from '@testing-library/react-native'
import { I18nManager, StyleSheet, Text } from 'react-native'
import { Switch } from '../switch/Switch'

describe('Switch', () => {
  it('renders without crashing', () => {
    renderWithTheme(<Switch />)
    expect(screen.getByRole('switch')).toBeTruthy()
  })

  it('has the switch accessibility role', () => {
    renderWithTheme(<Switch />)
    expect(screen.getByRole('switch')).toBeTruthy()
  })

  it('reports checked=false by default', () => {
    renderWithTheme(<Switch />)
    const sw = screen.getByRole('switch')
    expect(sw.props.accessibilityState).toEqual(
      expect.objectContaining({ checked: false }),
    )
  })

  it('reports checked=true when value is true', () => {
    renderWithTheme(<Switch onValueChange={jest.fn()} value />)
    const sw = screen.getByRole('switch')
    expect(sw.props.accessibilityState).toEqual(
      expect.objectContaining({ checked: true }),
    )
  })

  it('calls onValueChange with toggled value when pressed', () => {
    const onValueChange = jest.fn()
    renderWithTheme(<Switch value={false} onValueChange={onValueChange} />)
    fireEvent.press(screen.getByRole('switch'))
    expect(onValueChange).toHaveBeenCalledWith(true)
  })

  it('calls onValueChange with false when toggled off', () => {
    const onValueChange = jest.fn()
    renderWithTheme(<Switch value onValueChange={onValueChange} />)
    fireEvent.press(screen.getByRole('switch'))
    expect(onValueChange).toHaveBeenCalledWith(false)
  })

  it('does not call onValueChange when disabled', () => {
    const onValueChange = jest.fn()
    renderWithTheme(<Switch onValueChange={onValueChange} disabled />)
    fireEvent.press(screen.getByRole('switch'))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('reports disabled state', () => {
    renderWithTheme(<Switch disabled />)
    const sw = screen.getByRole('switch')
    expect(sw.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    )
  })

  it('renders selectedIcon when value is true', () => {
    renderWithTheme(<Switch value selectedIcon="check" />)
    expect(
      screen.getByText('check', { includeHiddenElements: true }),
    ).toBeTruthy()
  })

  it('does not render an icon by default (MD3 default switch)', () => {
    renderWithTheme(<Switch value />)
    expect(
      screen.queryByText('check', { includeHiddenElements: true }),
    ).toBeNull()
  })

  it('renders unselectedIcon when value is false', () => {
    renderWithTheme(<Switch value={false} unselectedIcon="close" />)
    expect(
      screen.getByText('close', { includeHiddenElements: true }),
    ).toBeTruthy()
  })

  describe('disabled visuals', () => {
    it('uses surface for the disabled selected handle', () => {
      renderWithTheme(<Switch value disabled />)
      const thumb = screen.getByTestId('switch-thumb')
      const flatStyle = StyleSheet.flatten(thumb.props.style)
      expect(flatStyle.backgroundColor).toBe(lightTheme.colors.surface)
    })

    it('keeps 38% onSurface for the disabled unselected handle', () => {
      renderWithTheme(<Switch value={false} disabled />)
      const thumb = screen.getByTestId('switch-thumb')
      const flatStyle = StyleSheet.flatten(thumb.props.style)
      expect(flatStyle.backgroundColor).toBe(
        alphaColor(lightTheme.colors.onSurface, 0.38),
      )
    })
  })

  // MD3 track: 52 x 32 dp with a 2 dp outline. The thumb center sits 16 dp
  // from the start edge when off and 36 dp when on, at every thumb size.
  describe('thumb geometry', () => {
    const BORDER = 2

    function thumb() {
      const style = getStyle(screen.getByTestId('switch-thumb'))
      const transform = style.transform as { translateX?: number }[]
      const translateX = transform.find(
        (t) => t.translateX !== undefined,
      )?.translateX
      const size = style.width as number
      const start = BORDER + (translateX as number)
      return { size, start, center: start + size / 2, end: start + size }
    }

    it('centers the 16 dp off thumb 16 dp from the start edge', () => {
      renderSettled(<Switch value={false} onValueChange={() => {}} />)
      expect(thumb()).toMatchObject({ size: 16, center: 16 })
    })

    it('centers the 24 dp on thumb 36 dp from the start edge', () => {
      renderSettled(<Switch value onValueChange={() => {}} />)
      expect(thumb()).toMatchObject({ size: 24, center: 36 })
    })

    it('centers a 24 dp off thumb with an unselected icon at 16 dp', () => {
      renderSettled(
        <Switch
          value={false}
          onValueChange={() => {}}
          unselectedIcon="close"
        />,
      )
      expect(thumb()).toMatchObject({ size: 24, center: 16 })
    })

    it.each([
      ['off', false, 16],
      ['on', true, 36],
    ])(
      'grows the pressed %s thumb to 28 dp around its center',
      (_, value, center) => {
        const { flush } = renderSettled(
          <Switch value={value} onValueChange={() => {}} />,
        )
        fireEvent(screen.getByRole('switch'), 'pressIn')
        flush()
        expect(thumb()).toMatchObject({ size: 28, center })
      },
    )

    it('keeps the pressed on thumb inside the outline', () => {
      const { flush } = renderSettled(<Switch value onValueChange={() => {}} />)
      fireEvent(screen.getByRole('switch'), 'pressIn')
      flush()
      expect(thumb().end).toBe(52 - BORDER)
    })

    it('returns to the rest size on release', () => {
      const { flush } = renderSettled(
        <Switch value={false} onValueChange={() => {}} />,
      )
      fireEvent(screen.getByRole('switch'), 'pressIn')
      flush()
      fireEvent(screen.getByRole('switch'), 'pressOut')
      flush()
      expect(thumb()).toMatchObject({ size: 16, center: 16 })
    })
  })

  describe('overrides', () => {
    it('applies containerColor to the track background', () => {
      renderWithTheme(<Switch containerColor="#FF0000" />)
      const sw = screen.getByRole('switch')
      const flatStyle = StyleSheet.flatten(sw.props.style)
      expect(flatStyle.backgroundColor).toBe('#FF0000')
    })
  })

  describe('icon sources', () => {
    it('accepts a pre-rendered ReactElement as selectedIcon', () => {
      renderWithTheme(
        <Switch value selectedIcon={<Text testID="custom-icon">★</Text>} />,
      )
      expect(
        screen.getByTestId('custom-icon', { includeHiddenElements: true }),
      ).toBeTruthy()
    })

    it('invokes a render-function selectedIcon with size and color', () => {
      const renderFn = jest.fn(({ size, color }) => (
        <Text testID="fn-icon">{`${size}:${color}`}</Text>
      ))
      renderWithTheme(<Switch value selectedIcon={renderFn} />)
      expect(renderFn).toHaveBeenCalledWith(
        expect.objectContaining({ size: 16 }),
      )
    })

    it('routes string selectedIcon names through iconResolver', () => {
      const iconResolver = jest.fn(() => <Text testID="resolved">r</Text>)
      renderWithTheme(<Switch value selectedIcon="check" />, { iconResolver })
      expect(iconResolver).toHaveBeenCalledWith(
        'check',
        expect.objectContaining({ size: 16 }),
      )
    })
  })
})

/** See the equivalent block in Checkbox.test.tsx for why this path exists. */
describe('Switch — uncontrolled', () => {
  it('toggles itself when no value prop is passed', () => {
    renderWithTheme(<Switch />)
    expect(screen.getByRole('switch').props.accessibilityState).toMatchObject({
      checked: false,
    })

    fireEvent.press(screen.getByRole('switch'))
    expect(screen.getByRole('switch').props.accessibilityState).toMatchObject({
      checked: true,
    })

    fireEvent.press(screen.getByRole('switch'))
    expect(screen.getByRole('switch').props.accessibilityState).toMatchObject({
      checked: false,
    })
  })

  it('starts from defaultValue', () => {
    renderWithTheme(<Switch defaultValue />)
    expect(screen.getByRole('switch').props.accessibilityState).toMatchObject({
      checked: true,
    })
  })

  it('a controlled switch does not move on its own', () => {
    renderWithTheme(<Switch value={false} onValueChange={jest.fn()} />)
    fireEvent.press(screen.getByRole('switch'))
    expect(screen.getByRole('switch').props.accessibilityState).toMatchObject({
      checked: false,
    })
  })

  describe('RTL', () => {
    const original = I18nManager.isRTL
    afterEach(() => {
      Object.defineProperty(I18nManager, 'isRTL', {
        value: original,
        configurable: true,
      })
    })

    function thumbTranslateX() {
      const transform = getStyle(screen.getByTestId('switch-thumb'))
        .transform as { translateX?: number }[] | undefined
      return transform?.find((t) => t.translateX !== undefined)?.translateX
    }

    it('moves the thumb toward the end, which is negative x in RTL', () => {
      renderSettled(<Switch value onValueChange={() => {}} />)
      const ltr = thumbTranslateX()
      expect(ltr).toBeGreaterThan(0)
      screen.unmount()

      Object.defineProperty(I18nManager, 'isRTL', {
        value: true,
        configurable: true,
      })
      renderSettled(<Switch value onValueChange={() => {}} />)
      expect(thumbTranslateX()).toBe(-(ltr as number))
    })
  })
})
