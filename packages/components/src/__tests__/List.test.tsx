import { lightTheme } from '@rootnative/core'
import { renderWithTheme } from '@rootnative/utils/test'
import { screen, fireEvent } from '@testing-library/react-native'
import { FlatList, StyleSheet, Text, View } from 'react-native'
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

  it('renders no headline by default', () => {
    renderWithTheme(
      <List>
        <Text>Child</Text>
      </List>,
    )
    expect(screen.queryByRole('heading')).toBeNull()
  })

  it('renders the headline as a heading above the items', () => {
    renderWithTheme(
      <List headline="App preference">
        <ListItem headlineText="Dark mode" />
      </List>,
    )
    const headline = screen.getByRole('heading', { name: 'App preference' })
    const style = StyleSheet.flatten(headline.props.style)
    expect(style.fontSize).toBe(lightTheme.typography.titleSmall.fontSize)
    expect(style.color).toBe(lightTheme.colors.onSurfaceVariant)
    // The same start and end padding as ListItem, so the text lines up.
    expect(style.paddingStart).toBe(16)
    expect(style.paddingEnd).toBe(24)
  })

  it('applies headlineStyle after the default style', () => {
    renderWithTheme(
      <List headline="News" headlineStyle={{ color: '#FF0000' }}>
        <ListItem headlineText="Country" />
      </List>,
    )
    const headline = screen.getByRole('heading', { name: 'News' })
    expect(StyleSheet.flatten(headline.props.style).color).toBe('#FF0000')
  })

  it('exports the headline as List.Headline for a FlatList header', () => {
    renderWithTheme(
      <FlatList
        data={['Reuters', 'AP']}
        keyExtractor={(item) => item}
        ListHeaderComponent={
          <List.Headline style={{ color: '#FF0000' }}>Sources</List.Headline>
        }
        renderItem={({ item }) => <ListItem headlineText={item} />}
      />,
    )
    const headline = screen.getByRole('heading', { name: 'Sources' })
    const style = StyleSheet.flatten(headline.props.style)
    expect(style.fontSize).toBe(lightTheme.typography.titleSmall.fontSize)
    expect(style.paddingStart).toBe(16)
    expect(style.paddingEnd).toBe(24)
    expect(style.color).toBe('#FF0000')
    expect(screen.getByText('AP')).toBeTruthy()
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

  it('cuts the headline and the overline at one line by default', () => {
    renderWithTheme(<ListItem headlineText="Title" overlineText="OVERLINE" />)
    expect(screen.getByText('Title').props.numberOfLines).toBe(1)
    expect(screen.getByText('OVERLINE').props.numberOfLines).toBe(1)
  })

  it('takes a line limit for the headline and the overline', () => {
    renderWithTheme(
      <ListItem
        headlineText="Title"
        overlineText="OVERLINE"
        headlineNumberOfLines={2}
        overlineNumberOfLines={0}
      />,
    )
    expect(screen.getByText('Title').props.numberOfLines).toBe(2)
    expect(screen.getByText('OVERLINE').props.numberOfLines).toBe(0)
  })

  it('keeps the template when the headline or the overline wraps', () => {
    renderWithTheme(
      <ListItem
        testID="item"
        headlineText="Title"
        overlineText="OVERLINE"
        headlineNumberOfLines={2}
        overlineNumberOfLines={2}
      />,
    )
    const style = StyleSheet.flatten(screen.getByTestId('item').props.style)
    expect(style.minHeight).toBe(72)
    expect(style.alignItems).toBe('center')
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

  it('uses MD3 padding: 16dp leading / 24dp trailing', () => {
    renderWithTheme(<ListItem testID="item" headlineText="Title" />)
    const item = screen.getByTestId('item')
    const flatStyle = StyleSheet.flatten(item.props.style)
    expect(flatStyle.paddingStart).toBe(16)
    expect(flatStyle.paddingEnd).toBe(24)
  })

  it('allows overriding the accessibility role', () => {
    renderWithTheme(
      <ListItem
        headlineText="Title"
        onPress={() => {}}
        accessibilityRole="link"
      />,
    )
    expect(screen.getByRole('link')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
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
