import { renderWithTheme } from '@rootnative/utils/test'
import { screen, fireEvent } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { AppBar } from '../appbar/AppBar'

describe('AppBar', () => {
  it('renders the title text', () => {
    renderWithTheme(<AppBar title="Home" />)
    expect(screen.getByText('Home')).toBeTruthy()
  })

  it('marks the title as a header for accessibility', () => {
    renderWithTheme(<AppBar title="Settings" />)
    expect(screen.getByRole('header')).toBeTruthy()
  })

  describe('back button', () => {
    it('does not render a back button by default', () => {
      renderWithTheme(<AppBar title="Home" />)
      expect(screen.queryByLabelText('Go back')).toBeNull()
    })

    it('renders a back button when canGoBack is true', () => {
      renderWithTheme(<AppBar title="Details" canGoBack />)
      expect(screen.getByLabelText('Go back')).toBeTruthy()
    })

    it('calls onBackPress when the back button is pressed', () => {
      const onBackPress = jest.fn()
      renderWithTheme(
        <AppBar title="Details" canGoBack onBackPress={onBackPress} />,
      )
      fireEvent.press(screen.getByLabelText('Go back'))
      expect(onBackPress).toHaveBeenCalledTimes(1)
    })
  })

  describe('leading', () => {
    it('overrides the back button when leading is provided', () => {
      renderWithTheme(
        <AppBar
          title="Home"
          canGoBack
          leading={<Text testID="custom-leading">Menu</Text>}
        />,
      )
      expect(screen.queryByLabelText('Go back')).toBeNull()
      expect(screen.getByTestId('custom-leading')).toBeTruthy()
    })
  })

  describe('actions', () => {
    it('renders action icons', () => {
      renderWithTheme(
        <AppBar
          title="Home"
          actions={[
            { icon: 'magnify', accessibilityLabel: 'Search' },
            { icon: 'dots-vertical', accessibilityLabel: 'More' },
          ]}
        />,
      )
      expect(screen.getByLabelText('Search')).toBeTruthy()
      expect(screen.getByLabelText('More')).toBeTruthy()
    })

    it('calls action onPress when pressed', () => {
      const onSearch = jest.fn()
      renderWithTheme(
        <AppBar
          title="Home"
          actions={[
            {
              icon: 'magnify',
              accessibilityLabel: 'Search',
              onPress: onSearch,
            },
          ]}
        />,
      )
      fireEvent.press(screen.getByLabelText('Search'))
      expect(onSearch).toHaveBeenCalledTimes(1)
    })

    it('does not render actions when the array is empty', () => {
      renderWithTheme(<AppBar title="Home" actions={[]} />)
      expect(screen.queryByRole('button')).toBeNull()
    })

    it('renders a text action when label is provided', () => {
      const onSave = jest.fn()
      renderWithTheme(
        <AppBar
          title="Edit"
          actions={[
            { label: 'Save', accessibilityLabel: 'Save', onPress: onSave },
          ]}
        />,
      )
      expect(screen.getByText('Save')).toBeTruthy()
      fireEvent.press(screen.getByLabelText('Save'))
      expect(onSave).toHaveBeenCalledTimes(1)
    })

    it('renders icon and text actions side by side', () => {
      renderWithTheme(
        <AppBar
          title="Edit"
          actions={[
            { icon: 'magnify', accessibilityLabel: 'Search' },
            { label: 'Done', accessibilityLabel: 'Done' },
          ]}
        />,
      )
      expect(screen.getByLabelText('Search')).toBeTruthy()
      expect(screen.getByText('Done')).toBeTruthy()
    })
  })

  describe('trailing', () => {
    it('overrides actions when trailing is provided', () => {
      renderWithTheme(
        <AppBar
          title="Home"
          actions={[{ icon: 'magnify', accessibilityLabel: 'Search' }]}
          trailing={<Text testID="custom-trailing">Custom</Text>}
        />,
      )
      expect(screen.queryByLabelText('Search')).toBeNull()
      expect(screen.getByTestId('custom-trailing')).toBeTruthy()
    })
  })

  describe('variants', () => {
    it('renders small variant by default', () => {
      renderWithTheme(<AppBar title="Small" />)
      expect(screen.getByText('Small')).toBeTruthy()
    })

    it('renders center-aligned variant', () => {
      renderWithTheme(<AppBar title="Centered" variant="center-aligned" />)
      const title = screen.getByText('Centered')
      const flatStyle = StyleSheet.flatten(title.props.style)
      expect(flatStyle.textAlign).toBe('center')
    })

    it('renders medium variant', () => {
      renderWithTheme(<AppBar title="Medium" variant="medium" />)
      expect(screen.getByText('Medium')).toBeTruthy()
    })

    it('renders large variant', () => {
      renderWithTheme(<AppBar title="Large" variant="large" />)
      expect(screen.getByText('Large')).toBeTruthy()
    })
  })

  describe('overrides', () => {
    it('applies containerColor to the root background', () => {
      const { toJSON } = renderWithTheme(
        <AppBar title="Custom" containerColor="#FF0000" />,
      )
      const root = toJSON()
      const flatStyle = StyleSheet.flatten(root.props.style)
      expect(flatStyle.backgroundColor).toBe('#FF0000')
    })

    it('applies contentColor to the title text', () => {
      renderWithTheme(<AppBar title="Custom" contentColor="#00FF00" />)
      const title = screen.getByText('Custom')
      const flatStyle = StyleSheet.flatten(title.props.style)
      expect(flatStyle.color).toBe('#00FF00')
    })

    it('applies titleStyle to the title text', () => {
      renderWithTheme(
        <AppBar title="Styled" titleStyle={{ fontWeight: '900' }} />,
      )
      const title = screen.getByText('Styled')
      const flatStyle = StyleSheet.flatten(title.props.style)
      expect(flatStyle.fontWeight).toBe('900')
    })

    it('applies style to the root container', () => {
      const { toJSON } = renderWithTheme(
        <AppBar title="Home" style={{ margin: 10 }} />,
      )
      const root = toJSON()
      const flatStyle = StyleSheet.flatten(root.props.style)
      expect(flatStyle.margin).toBe(10)
    })
  })
})
