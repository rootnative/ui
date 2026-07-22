import type { SharedValue } from '@rootnative/inertia'
import { renderWithTheme } from '@rootnative/utils/test'
import { screen, fireEvent } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import type { TextStyle, ViewStyle } from 'react-native'
import { AppBar } from '../appbar/AppBar'

// The Jest mock evaluates worklets once per render, so a plain `{ value }`
// stub is all a scroll offset needs to drive the collapse interpolation.
function scrollOffsetAt(value: number): SharedValue<number> {
  return { value } as SharedValue<number>
}

type RenderedNode = {
  props?: { style?: ViewStyle | TextStyle }
  children?: RenderedNode[] | null
}

function collectFlattenedStyles(
  node: RenderedNode | RenderedNode[] | null,
): Array<ViewStyle & TextStyle> {
  if (!node) return []
  if (Array.isArray(node)) {
    return node.flatMap((child) => collectFlattenedStyles(child))
  }
  const own = node.props?.style
    ? [StyleSheet.flatten(node.props.style) as ViewStyle & TextStyle]
    : []
  return [...own, ...collectFlattenedStyles(node.children ?? null)]
}

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

  describe('collapse on scroll', () => {
    it('renders the expanded geometry at rest', () => {
      const { toJSON } = renderWithTheme(
        <AppBar
          title="Medium"
          variant="medium"
          scrollOffset={scrollOffsetAt(0)}
        />,
      )
      const styles = collectFlattenedStyles(toJSON() as RenderedNode)
      expect(styles.some((s) => s.height === 112)).toBe(true)

      const title = StyleSheet.flatten(
        screen.getByText('Medium').props.style,
      ) as TextStyle
      expect(title.fontSize).toBe(24)
      expect(title.lineHeight).toBe(32)
    })

    it('collapses the medium bar to the small type scale when scrolled', () => {
      // The Jest mock's `interpolate` is a step function (intermediate
      // frames are not observable), so this asserts the collapsed endpoint;
      // the continuous interpolation is example-app-verified.
      const { toJSON } = renderWithTheme(
        <AppBar
          title="Medium"
          variant="medium"
          scrollOffset={scrollOffsetAt(48)}
        />,
      )
      const styles = collectFlattenedStyles(toJSON() as RenderedNode)
      expect(styles.some((s) => s.height === 64)).toBe(true)

      const title = StyleSheet.flatten(
        screen.getByText('Medium').props.style,
      ) as TextStyle
      expect(title.fontSize).toBe(22)
      expect(title.lineHeight).toBe(28)
    })

    it('matches the small form when fully collapsed (clamped past the range)', () => {
      const { toJSON } = renderWithTheme(
        <AppBar
          title="Large"
          variant="large"
          scrollOffset={scrollOffsetAt(500)}
        />,
      )
      const styles = collectFlattenedStyles(toJSON() as RenderedNode)
      expect(styles.some((s) => s.height === 64)).toBe(true)

      const title = StyleSheet.flatten(
        screen.getByText('Large').props.style,
      ) as TextStyle
      expect(title.fontSize).toBe(22)
      expect(title.lineHeight).toBe(28)
    })

    it('starts the large variant from its expanded type scale', () => {
      renderWithTheme(
        <AppBar
          title="Large"
          variant="large"
          scrollOffset={scrollOffsetAt(0)}
        />,
      )
      const title = StyleSheet.flatten(
        screen.getByText('Large').props.style,
      ) as TextStyle
      expect(title.fontSize).toBe(28)
      expect(title.lineHeight).toBe(36)
    })

    it('keeps the title accessible as a header', () => {
      renderWithTheme(
        <AppBar
          title="Medium"
          variant="medium"
          scrollOffset={scrollOffsetAt(0)}
        />,
      )
      expect(screen.getByRole('header')).toBeTruthy()
    })

    it('applies contentColor and titleStyle to the collapsible title', () => {
      renderWithTheme(
        <AppBar
          title="Styled"
          variant="medium"
          scrollOffset={scrollOffsetAt(0)}
          contentColor="#00FF00"
          titleStyle={{ fontWeight: '900' }}
        />,
      )
      const title = StyleSheet.flatten(
        screen.getByText('Styled').props.style,
      ) as TextStyle
      expect(title.color).toBe('#00FF00')
      expect(title.fontWeight).toBe('900')
    })

    it('ignores scrollOffset on the small variant', () => {
      const { toJSON } = renderWithTheme(
        <AppBar title="Small" scrollOffset={scrollOffsetAt(500)} />,
      )
      const styles = collectFlattenedStyles(toJSON() as RenderedNode)
      expect(styles.some((s) => s.height === 64)).toBe(true)

      const title = StyleSheet.flatten(
        screen.getByText('Small').props.style,
      ) as TextStyle
      expect(title.fontSize).toBe(22)
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
