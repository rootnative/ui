import { renderWithTheme } from '@rootnative/utils/test'
import { screen, fireEvent } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { TextField } from '../text-field/TextField'

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
