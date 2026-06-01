import { renderWithTheme } from '@rootnative/utils/test'
import { screen, fireEvent } from '@testing-library/react-native'
import { StyleSheet, Text, View } from 'react-native'
import { List } from '../list/List'
import { ListDivider } from '../list/ListDivider'
import { ListItem } from '../list/ListItem'

describe('List', () => {
  it('renders children', () => {
    renderWithTheme(
      <List>
        <Text>Child</Text>
      </List>,
    )
    expect(screen.getByText('Child')).toBeTruthy()
  })
})

describe('ListItem', () => {
  it('renders headline text', () => {
    renderWithTheme(<ListItem headlineText="Title" />)
    expect(screen.getByText('Title')).toBeTruthy()
  })

  it('renders supporting text when provided', () => {
    renderWithTheme(<ListItem headlineText="Title" supportingText="Subtitle" />)
    expect(screen.getByText('Subtitle')).toBeTruthy()
  })

  it('renders overline text when provided', () => {
    renderWithTheme(<ListItem headlineText="Title" overlineText="OVERLINE" />)
    expect(screen.getByText('OVERLINE')).toBeTruthy()
  })

  it('renders trailing supporting text when provided', () => {
    renderWithTheme(
      <ListItem headlineText="Title" trailingSupportingText="100+" />,
    )
    expect(screen.getByText('100+')).toBeTruthy()
  })

  it('renders leading content', () => {
    renderWithTheme(
      <ListItem
        headlineText="Title"
        leadingContent={<View testID="leading" />}
      />,
    )
    expect(screen.getByTestId('leading')).toBeTruthy()
  })

  it('renders trailing content', () => {
    renderWithTheme(
      <ListItem
        headlineText="Title"
        trailingContent={<View testID="trailing" />}
      />,
    )
    expect(screen.getByTestId('trailing')).toBeTruthy()
  })

  it('renders as non-interactive when no onPress provided', () => {
    renderWithTheme(<ListItem headlineText="Title" />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders as interactive when onPress is provided', () => {
    renderWithTheme(<ListItem headlineText="Title" onPress={() => {}} />)
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('calls onPress when pressed', () => {
    const onPress = jest.fn()
    renderWithTheme(<ListItem headlineText="Title" onPress={onPress} />)
    fireEvent.press(screen.getByRole('button'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn()
    renderWithTheme(
      <ListItem headlineText="Title" onPress={onPress} disabled />,
    )
    fireEvent.press(screen.getByRole('button'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('sets disabled accessibility state when disabled', () => {
    renderWithTheme(
      <ListItem headlineText="Title" onPress={() => {}} disabled />,
    )
    const button = screen.getByRole('button')
    expect(button.props.accessibilityState).toEqual({ disabled: true })
  })

  describe('overrides', () => {
    it('applies containerColor to a non-interactive item', () => {
      renderWithTheme(
        <ListItem
          testID="item"
          headlineText="Title"
          containerColor="#FF0000"
        />,
      )
      const item = screen.getByTestId('item')
      const flatStyle = StyleSheet.flatten(item.props.style)
      expect(flatStyle.backgroundColor).toBe('#FF0000')
    })

    it('applies containerColor to an interactive item', () => {
      renderWithTheme(
        <ListItem
          headlineText="Title"
          onPress={() => {}}
          containerColor="#FF0000"
        />,
      )
      const item = screen.getByRole('button')
      const flatStyle = StyleSheet.flatten(item.props.style)
      expect(flatStyle.backgroundColor).toBe('#FF0000')
    })
  })
})

describe('ListDivider', () => {
  it('renders with 1dp height', () => {
    renderWithTheme(<ListDivider testID="divider" />)
    const divider = screen.getByTestId('divider')
    const flatStyle = StyleSheet.flatten(divider.props.style)
    expect(flatStyle.height).toBe(1)
  })
})
