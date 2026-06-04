import { lightTheme } from '@rootnative/core'
import { renderWithTheme } from '@rootnative/utils/test'
import { screen, fireEvent } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { Chip } from '../chip/Chip'

describe('Chip', () => {
  it('renders the label text', () => {
    renderWithTheme(<Chip>Tag</Chip>)
    expect(screen.getByText('Tag')).toBeTruthy()
  })

  it('has the button accessibility role', () => {
    renderWithTheme(<Chip>Action</Chip>)
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('calls onPress when pressed', () => {
    const onPress = jest.fn()
    renderWithTheme(<Chip onPress={onPress}>Tap</Chip>)
    fireEvent.press(screen.getByRole('button'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn()
    renderWithTheme(
      <Chip onPress={onPress} disabled>
        Tap
      </Chip>,
    )
    fireEvent.press(screen.getByRole('button'))
    expect(onPress).not.toHaveBeenCalled()
  })

  describe('leading icon', () => {
    it('renders a custom leading icon', () => {
      renderWithTheme(<Chip leadingIcon="star">Starred</Chip>)
      expect(screen.getByText('star')).toBeTruthy()
    })

    it('shows checkmark when filter variant is selected', () => {
      renderWithTheme(
        <Chip variant="filter" selected>
          Active
        </Chip>,
      )
      expect(screen.getByText('check')).toBeTruthy()
    })

    it('shows custom leadingIcon instead of checkmark on selected filter', () => {
      renderWithTheme(
        <Chip variant="filter" selected leadingIcon="heart">
          Liked
        </Chip>,
      )
      expect(screen.getByText('heart')).toBeTruthy()
      expect(screen.queryByText('check')).toBeNull()
    })

    it('renders avatar for input variant', () => {
      renderWithTheme(
        <Chip variant="input" avatar={<Text>AV</Text>}>
          User
        </Chip>,
      )
      expect(screen.getByText('AV')).toBeTruthy()
    })
  })

  describe('close icon', () => {
    it('renders close icon for input variant when onClose is provided', () => {
      renderWithTheme(
        <Chip variant="input" onClose={jest.fn()}>
          Tag
        </Chip>,
      )
      expect(screen.getByText('close')).toBeTruthy()
    })

    it('calls onClose when close icon is pressed', () => {
      const onClose = jest.fn()
      renderWithTheme(
        <Chip variant="input" onClose={onClose}>
          Tag
        </Chip>,
      )
      fireEvent.press(screen.getByLabelText('Remove'))
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('renders close icon for filter variant only when selected', () => {
      const { rerender } = renderWithTheme(
        <Chip variant="filter" onClose={jest.fn()}>
          Filter
        </Chip>,
      )
      expect(screen.queryByText('close')).toBeNull()

      rerender(
        <Chip variant="filter" selected onClose={jest.fn()}>
          Filter
        </Chip>,
      )
      expect(screen.getByText('close')).toBeTruthy()
    })
  })

  describe('container colors', () => {
    it('flat chips have a transparent container with a 1dp outline', () => {
      renderWithTheme(<Chip>Flat</Chip>)
      const chip = screen.getByRole('button')
      const flatStyle = StyleSheet.flatten(chip.props.style)
      expect(flatStyle.backgroundColor).toBe('transparent')
      expect(flatStyle.borderWidth).toBe(1)
      expect(flatStyle.borderColor).toBe(lightTheme.colors.outline)
    })

    it('disabled flat chips stay transparent with a 12% onSurface outline', () => {
      renderWithTheme(<Chip disabled>Flat disabled</Chip>)
      const chip = screen.getByRole('button')
      const flatStyle = StyleSheet.flatten(chip.props.style)
      expect(flatStyle.backgroundColor).toBe('transparent')
      expect(flatStyle.borderColor).toBe('rgba(29, 27, 32, 0.12)')
    })

    it('disabled elevated chips get the 12% onSurface container fill', () => {
      renderWithTheme(
        <Chip elevated disabled>
          Elevated disabled
        </Chip>,
      )
      const chip = screen.getByRole('button')
      const flatStyle = StyleSheet.flatten(chip.props.style)
      expect(flatStyle.backgroundColor).toBe('rgba(29, 27, 32, 0.12)')
    })

    it('disabled selected filter chips get the 12% onSurface container fill', () => {
      renderWithTheme(
        <Chip variant="filter" selected disabled>
          Selected disabled
        </Chip>,
      )
      const chip = screen.getByRole('button')
      const flatStyle = StyleSheet.flatten(chip.props.style)
      expect(flatStyle.backgroundColor).toBe('rgba(29, 27, 32, 0.12)')
    })
  })

  describe('leading icon color', () => {
    const renderFnIcon = () =>
      jest.fn(({ size, color }) => (
        <Text testID="fn-icon">{`${size}:${color}`}</Text>
      ))

    it('assist chip icon is primary when enabled', () => {
      const renderFn = renderFnIcon()
      renderWithTheme(<Chip leadingIcon={renderFn}>Assist</Chip>)
      expect(renderFn).toHaveBeenCalledWith(
        expect.objectContaining({ color: lightTheme.colors.primary }),
      )
    })

    it('suggestion chip icon is primary when enabled', () => {
      const renderFn = renderFnIcon()
      renderWithTheme(
        <Chip variant="suggestion" leadingIcon={renderFn}>
          Suggest
        </Chip>,
      )
      expect(renderFn).toHaveBeenCalledWith(
        expect.objectContaining({ color: lightTheme.colors.primary }),
      )
    })

    it('input chip icon stays onSurfaceVariant', () => {
      const renderFn = renderFnIcon()
      renderWithTheme(
        <Chip variant="input" leadingIcon={renderFn}>
          Input
        </Chip>,
      )
      expect(renderFn).toHaveBeenCalledWith(
        expect.objectContaining({ color: lightTheme.colors.onSurfaceVariant }),
      )
    })

    it('unselected filter chip icon stays onSurfaceVariant', () => {
      const renderFn = renderFnIcon()
      renderWithTheme(
        <Chip variant="filter" leadingIcon={renderFn}>
          Filter
        </Chip>,
      )
      expect(renderFn).toHaveBeenCalledWith(
        expect.objectContaining({ color: lightTheme.colors.onSurfaceVariant }),
      )
    })

    it('selected filter chip icon uses onSecondaryContainer', () => {
      const renderFn = renderFnIcon()
      renderWithTheme(
        <Chip variant="filter" selected leadingIcon={renderFn}>
          Filter
        </Chip>,
      )
      expect(renderFn).toHaveBeenCalledWith(
        expect.objectContaining({
          color: lightTheme.colors.onSecondaryContainer,
        }),
      )
    })

    it('disabled chip icon uses 38% onSurface', () => {
      const renderFn = renderFnIcon()
      renderWithTheme(
        <Chip leadingIcon={renderFn} disabled>
          Disabled
        </Chip>,
      )
      expect(renderFn).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'rgba(29, 27, 32, 0.38)' }),
      )
    })

    it('contentColor overrides the variant icon color', () => {
      const renderFn = renderFnIcon()
      renderWithTheme(
        <Chip leadingIcon={renderFn} contentColor="#123456">
          Custom
        </Chip>,
      )
      expect(renderFn).toHaveBeenCalledWith(
        expect.objectContaining({ color: '#123456' }),
      )
    })
  })

  describe('overrides', () => {
    it('applies containerColor to the container background', () => {
      renderWithTheme(<Chip containerColor="#FF0000">Custom</Chip>)
      const chip = screen.getByRole('button')
      const flatStyle = StyleSheet.flatten(chip.props.style)
      expect(flatStyle.backgroundColor).toBe('#FF0000')
    })

    it('applies contentColor to the label text', () => {
      renderWithTheme(<Chip contentColor="#00FF00">Custom</Chip>)
      const label = screen.getByText('Custom')
      const flatStyle = StyleSheet.flatten(label.props.style)
      expect(flatStyle.color).toBe('#00FF00')
    })

    it('applies labelStyle to the label text', () => {
      renderWithTheme(<Chip labelStyle={{ fontWeight: '900' }}>Styled</Chip>)
      const label = screen.getByText('Styled')
      const flatStyle = StyleSheet.flatten(label.props.style)
      expect(flatStyle.fontWeight).toBe('900')
    })

    it('contentColor does not get overridden by labelStyle without color', () => {
      renderWithTheme(
        <Chip contentColor="#00FF00" labelStyle={{ fontSize: 20 }}>
          Both
        </Chip>,
      )
      const label = screen.getByText('Both')
      const flatStyle = StyleSheet.flatten(label.props.style)
      expect(flatStyle.color).toBe('#00FF00')
      expect(flatStyle.fontSize).toBe(20)
    })
  })

  describe('icon sources', () => {
    it('accepts a pre-rendered ReactElement as leadingIcon', () => {
      renderWithTheme(
        <Chip leadingIcon={<Text testID="lucide-icon">★</Text>}>Star</Chip>,
      )
      expect(screen.getByTestId('lucide-icon')).toBeTruthy()
    })

    it('invokes a render-function leadingIcon with size and color', () => {
      const renderFn = jest.fn(({ size, color }) => (
        <Text testID="fn-icon">{`${size}:${color}`}</Text>
      ))
      renderWithTheme(
        <Chip leadingIcon={renderFn} iconSize={20} contentColor="#123456">
          Fn
        </Chip>,
      )
      expect(renderFn).toHaveBeenCalledWith({ size: 20, color: '#123456' })
    })

    it('routes string icon names through iconResolver', () => {
      const iconResolver = jest.fn((name: string) => (
        <Text testID={`resolved-${name}`}>{`r:${name}`}</Text>
      ))
      renderWithTheme(<Chip leadingIcon="star">Star</Chip>, { iconResolver })
      expect(iconResolver).toHaveBeenCalledWith(
        'star',
        expect.objectContaining({ size: 18 }),
      )
    })

    it('routes the internal check icon through iconResolver on selected filter', () => {
      const iconResolver = jest.fn((name: string) => (
        <Text testID={`resolved-${name}`}>{`r:${name}`}</Text>
      ))
      renderWithTheme(
        <Chip variant="filter" selected>
          Active
        </Chip>,
        { iconResolver },
      )
      expect(iconResolver).toHaveBeenCalledWith(
        'check',
        expect.objectContaining({ size: 18 }),
      )
    })

    it('routes the internal close icon through iconResolver', () => {
      const iconResolver = jest.fn((name: string) => (
        <Text testID={`resolved-${name}`}>{`r:${name}`}</Text>
      ))
      renderWithTheme(
        <Chip variant="input" onClose={jest.fn()}>
          Tag
        </Chip>,
        { iconResolver },
      )
      expect(iconResolver).toHaveBeenCalledWith(
        'close',
        expect.objectContaining({ size: 18 }),
      )
    })
  })

  describe('accessibility', () => {
    it('reports selected state for filter variant', () => {
      renderWithTheme(
        <Chip variant="filter" selected>
          On
        </Chip>,
      )
      const chip = screen.getByRole('button')
      expect(chip.props.accessibilityState).toEqual(
        expect.objectContaining({ selected: true }),
      )
    })

    it('reports unselected state for filter variant', () => {
      renderWithTheme(<Chip variant="filter">Off</Chip>)
      const chip = screen.getByRole('button')
      expect(chip.props.accessibilityState).toEqual(
        expect.objectContaining({ selected: false }),
      )
    })

    it('reports disabled state', () => {
      renderWithTheme(<Chip disabled>Disabled</Chip>)
      const chip = screen.getByRole('button')
      expect(chip.props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: true }),
      )
    })
  })
})
