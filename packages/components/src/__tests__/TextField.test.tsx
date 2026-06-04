import { lightTheme } from '@rootnative/core'
import { alphaColor } from '@rootnative/utils'
import { renderWithTheme } from '@rootnative/utils/test'
import { screen, fireEvent } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { TextField } from '../text-field/TextField'

const disabledTextColor = alphaColor(
  lightTheme.colors.onSurface,
  lightTheme.stateLayer.disabledOpacity,
)

describe('TextField', () => {
  it('renders the label text', () => {
    renderWithTheme(<TextField label="Email" />)
    expect(screen.getByText('Email')).toBeTruthy()
  })

  it('uses the label as accessibilityLabel on the input', () => {
    renderWithTheme(<TextField label="Email" />)
    expect(screen.getByLabelText('Email')).toBeTruthy()
  })

  it('renders without a label', () => {
    renderWithTheme(<TextField testID="bare-input" />)
    expect(screen.getByTestId('bare-input')).toBeTruthy()
  })

  describe('value and text input', () => {
    it('displays a controlled value', () => {
      renderWithTheme(<TextField label="Name" value="Alice" />)
      expect(screen.getByLabelText('Name').props.value).toBe('Alice')
    })

    it('calls onChangeText when typing', () => {
      const onChangeText = jest.fn()
      renderWithTheme(<TextField label="Name" onChangeText={onChangeText} />)
      fireEvent.changeText(screen.getByLabelText('Name'), 'Bob')
      expect(onChangeText).toHaveBeenCalledWith('Bob')
    })
  })

  describe('variants', () => {
    it('renders filled variant by default', () => {
      const { toJSON } = renderWithTheme(<TextField label="Filled" />)
      const root = toJSON()
      // Filled variant has a child container with a non-transparent background
      expect(root).toBeTruthy()
    })

    it('renders outlined variant', () => {
      const { toJSON } = renderWithTheme(
        <TextField label="Outlined" variant="outlined" />,
      )
      const root = toJSON()
      expect(root).toBeTruthy()
    })
  })

  describe('supporting text', () => {
    it('displays supporting text', () => {
      renderWithTheme(
        <TextField label="Email" supportingText="Enter your email" />,
      )
      expect(screen.getByText('Enter your email')).toBeTruthy()
    })

    it('does not display supporting text when absent', () => {
      renderWithTheme(<TextField label="Email" />)
      expect(screen.queryByText('Enter your email')).toBeNull()
    })
  })

  describe('character counter', () => {
    it('renders length/maxLength when maxLength is set', () => {
      renderWithTheme(<TextField label="Bio" value="Hello" maxLength={20} />)
      expect(screen.getByText('5/20')).toBeTruthy()
    })

    it('renders the counter even without supporting text', () => {
      renderWithTheme(<TextField label="Bio" maxLength={10} />)
      expect(screen.getByText('0/10')).toBeTruthy()
    })

    it('updates the counter as the user types (uncontrolled)', () => {
      renderWithTheme(<TextField label="Bio" maxLength={10} />)
      fireEvent.changeText(screen.getByLabelText('Bio'), 'abc')
      expect(screen.getByText('3/10')).toBeTruthy()
    })

    it('counts a defaultValue in uncontrolled mode', () => {
      renderWithTheme(
        <TextField label="Bio" defaultValue="abcd" maxLength={10} />,
      )
      expect(screen.getByText('4/10')).toBeTruthy()
    })

    it('does not render a counter without maxLength', () => {
      renderWithTheme(<TextField label="Bio" value="Hello" />)
      expect(screen.queryByText(/\d+\/\d+/)).toBeNull()
    })

    it('hides the counter when showCharacterCounter is false', () => {
      renderWithTheme(
        <TextField
          label="Bio"
          value="Hello"
          maxLength={20}
          showCharacterCounter={false}
        />,
      )
      expect(screen.queryByText('5/20')).toBeNull()
    })

    it('shares the row with supporting text', () => {
      renderWithTheme(
        <TextField
          label="Bio"
          value="Hi"
          maxLength={20}
          supportingText="Tell us about yourself"
        />,
      )
      expect(screen.getByText('Tell us about yourself')).toBeTruthy()
      expect(screen.getByText('2/20')).toBeTruthy()
    })

    it('uses onSurfaceVariant by default', () => {
      renderWithTheme(<TextField label="Bio" value="Hi" maxLength={20} />)
      const counter = screen.getByText('2/20')
      const flatStyle = StyleSheet.flatten(counter.props.style)
      expect(flatStyle.color).toBe(lightTheme.colors.onSurfaceVariant)
    })

    it('uses the error color in error state', () => {
      renderWithTheme(
        <TextField
          label="Bio"
          value="Hi"
          maxLength={20}
          errorText="Too long"
        />,
      )
      const counter = screen.getByText('2/20')
      const flatStyle = StyleSheet.flatten(counter.props.style)
      expect(flatStyle.color).toBe(lightTheme.colors.error)
    })

    it('dims to 38% onSurface when disabled', () => {
      renderWithTheme(
        <TextField label="Bio" value="Hi" maxLength={20} disabled />,
      )
      const counter = screen.getByText('2/20')
      const flatStyle = StyleSheet.flatten(counter.props.style)
      expect(flatStyle.color).toBe(disabledTextColor)
    })
  })

  describe('caret and selection colors', () => {
    it('defaults cursorColor and selectionColor to primary', () => {
      renderWithTheme(<TextField label="Name" />)
      const input = screen.getByLabelText('Name')
      expect(input.props.cursorColor).toBe(lightTheme.colors.primary)
      expect(input.props.selectionColor).toBe(lightTheme.colors.primary)
    })

    it('uses the error color for caret and selection in error state', () => {
      renderWithTheme(<TextField label="Name" errorText="Required" />)
      const input = screen.getByLabelText('Name')
      expect(input.props.cursorColor).toBe(lightTheme.colors.error)
      expect(input.props.selectionColor).toBe(lightTheme.colors.error)
    })

    it('lets consumer cursorColor and selectionColor win', () => {
      renderWithTheme(
        <TextField
          label="Name"
          cursorColor="#123456"
          selectionColor="#654321"
        />,
      )
      const input = screen.getByLabelText('Name')
      expect(input.props.cursorColor).toBe('#123456')
      expect(input.props.selectionColor).toBe('#654321')
    })
  })

  describe('error state', () => {
    it('displays errorText', () => {
      renderWithTheme(<TextField label="Email" errorText="Invalid email" />)
      expect(screen.getByText('Invalid email')).toBeTruthy()
    })

    it('errorText replaces supportingText', () => {
      renderWithTheme(
        <TextField
          label="Email"
          supportingText="Enter your email"
          errorText="Invalid email"
        />,
      )
      expect(screen.getByText('Invalid email')).toBeTruthy()
      expect(screen.queryByText('Enter your email')).toBeNull()
    })

    it('sets accessibilityHint to errorText when in error state', () => {
      renderWithTheme(<TextField label="Email" errorText="Invalid email" />)
      const input = screen.getByLabelText('Email')
      expect(input.props.accessibilityHint).toBe('Invalid email')
    })

    it('keeps the leading icon onSurfaceVariant and only colors the trailing icon', () => {
      const leadingFn = jest.fn(() => <Text>L</Text>)
      const trailingFn = jest.fn(() => <Text>T</Text>)
      renderWithTheme(
        <TextField
          label="Email"
          errorText="Invalid email"
          leadingIcon={leadingFn}
          trailingIcon={trailingFn}
        />,
      )
      expect(leadingFn).toHaveBeenCalledWith(
        expect.objectContaining({
          color: lightTheme.colors.onSurfaceVariant,
        }),
      )
      expect(trailingFn).toHaveBeenCalledWith(
        expect.objectContaining({ color: lightTheme.colors.error }),
      )
    })
  })

  describe('disabled state', () => {
    it('marks the input as not editable', () => {
      renderWithTheme(<TextField label="Name" disabled />)
      const input = screen.getByLabelText('Name')
      expect(input.props.editable).toBe(false)
    })

    it('reports disabled in accessibilityState', () => {
      renderWithTheme(<TextField label="Name" disabled />)
      const input = screen.getByLabelText('Name')
      expect(input.props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: true }),
      )
    })

    it('dims supporting text to 38% onSurface when disabled', () => {
      renderWithTheme(
        <TextField label="Email" supportingText="Enter your email" disabled />,
      )
      const supporting = screen.getByText('Enter your email')
      const flatStyle = StyleSheet.flatten(supporting.props.style)
      expect(flatStyle.color).toBe(disabledTextColor)
    })
  })

  describe('icons', () => {
    it('renders a leading icon', () => {
      renderWithTheme(<TextField label="Search" leadingIcon="magnify" />)
      expect(screen.getByText('magnify')).toBeTruthy()
    })

    it('renders a trailing icon', () => {
      renderWithTheme(<TextField label="Password" trailingIcon="eye" />)
      expect(screen.getByText('eye')).toBeTruthy()
    })

    it('calls onTrailingIconPress when the trailing icon is pressed', () => {
      const onPress = jest.fn()
      renderWithTheme(
        <TextField
          label="Password"
          trailingIcon="eye"
          onTrailingIconPress={onPress}
        />,
      )
      fireEvent.press(screen.getByRole('button'))
      expect(onPress).toHaveBeenCalledTimes(1)
    })

    it('does not fire trailing icon press when disabled', () => {
      const onPress = jest.fn()
      renderWithTheme(
        <TextField
          label="Password"
          trailingIcon="eye"
          onTrailingIconPress={onPress}
          disabled
        />,
      )
      fireEvent.press(screen.getByRole('button'))
      expect(onPress).not.toHaveBeenCalled()
    })

    it('applies trailingIconAccessibilityLabel to the trailing icon pressable', () => {
      renderWithTheme(
        <TextField
          label="Password"
          trailingIcon="eye"
          onTrailingIconPress={jest.fn()}
          trailingIconAccessibilityLabel="Show password"
        />,
      )
      expect(screen.getByLabelText('Show password')).toBeTruthy()
    })

    it('accepts a pre-rendered ReactElement as leadingIcon', () => {
      renderWithTheme(
        <TextField
          label="Search"
          leadingIcon={<Text testID="lucide-icon">★</Text>}
        />,
      )
      expect(screen.getByTestId('lucide-icon')).toBeTruthy()
    })

    it('invokes a render-function trailingIcon with size and color', () => {
      const renderFn = jest.fn(({ size, color }) => (
        <Text testID="fn-icon">{`${size}:${color}`}</Text>
      ))
      renderWithTheme(<TextField label="Password" trailingIcon={renderFn} />)
      expect(renderFn).toHaveBeenCalledWith(
        expect.objectContaining({ size: 24 }),
      )
    })

    it('routes string icon names through iconResolver', () => {
      const iconResolver = jest.fn((name: string) => (
        <Text testID={`resolved-${name}`}>r</Text>
      ))
      renderWithTheme(
        <TextField label="Search" leadingIcon="magnify" trailingIcon="close" />,
        { iconResolver },
      )
      expect(iconResolver).toHaveBeenCalledWith(
        'magnify',
        expect.objectContaining({ size: 24 }),
      )
      expect(iconResolver).toHaveBeenCalledWith(
        'close',
        expect.objectContaining({ size: 24 }),
      )
    })
  })

  describe('overrides', () => {
    it('applies containerColor to the container background', () => {
      const { toJSON } = renderWithTheme(
        <TextField label="Name" containerColor="#FF0000" />,
      )
      const root = toJSON()
      // The container is the Pressable's child View (second level)
      const container = root.children[0].children[0]
      const flatStyle = StyleSheet.flatten(container.props.style)
      expect(flatStyle.backgroundColor).toBe('#FF0000')
    })

    it('applies contentColor to the input text', () => {
      renderWithTheme(<TextField label="Name" contentColor="#00FF00" />)
      const input = screen.getByLabelText('Name')
      const flatStyle = StyleSheet.flatten(input.props.style)
      expect(flatStyle.color).toBe('#00FF00')
    })

    it('applies inputStyle to the input element', () => {
      renderWithTheme(
        <TextField label="Name" inputStyle={{ fontWeight: '900' }} />,
      )
      const input = screen.getByLabelText('Name')
      const flatStyle = StyleSheet.flatten(input.props.style)
      expect(flatStyle.fontWeight).toBe('900')
    })

    it('applies style to the root container', () => {
      const { toJSON } = renderWithTheme(
        <TextField label="Name" style={{ margin: 10 }} />,
      )
      const root = toJSON()
      const flatStyle = StyleSheet.flatten(root.props.style)
      expect(flatStyle.margin).toBe(10)
    })

    it('does not apply containerColor when disabled', () => {
      const { toJSON } = renderWithTheme(
        <TextField label="Name" containerColor="#FF0000" disabled />,
      )
      const root = toJSON()
      const container = root.children[0].children[0]
      const flatStyle = StyleSheet.flatten(container.props.style)
      expect(flatStyle.backgroundColor).not.toBe('#FF0000')
    })
  })
})
