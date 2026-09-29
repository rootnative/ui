import { lightTheme } from '@rootnative/core'
import { alphaColor } from '@rootnative/utils'
import { renderWithTheme } from '@rootnative/utils/test'
import { fireEvent, screen } from '@testing-library/react-native'
import { createRef } from 'react'
import { StyleSheet, Text, TextInput } from 'react-native'
import type { ReactTestInstance } from 'react-test-renderer'
import { __resetWarnOnceForTests } from '../internal/warnOnce'
import { SearchBar } from '../search-bar/SearchBar'
import { SEARCH_BAR_HEIGHT, SEARCH_BAR_MAX_WIDTH } from '../search-bar/styles'
import { rootOf } from '../test-support/rendered-node'

const disabledContent = alphaColor(
  lightTheme.colors.onSurface,
  lightTheme.stateLayer.disabledOpacity,
)

/** The animated pill that carries the container color and the state layer. */
function containerOf(input: ReactTestInstance): ReactTestInstance {
  let node: ReactTestInstance | null = input.parent
  while (node) {
    if (StyleSheet.flatten(node.props.style)?.height === SEARCH_BAR_HEIGHT) {
      return node
    }
    node = node.parent
  }
  throw new Error('no container above the input')
}

function styleOf(node: ReactTestInstance) {
  return StyleSheet.flatten(node.props.style)
}

describe('SearchBar', () => {
  describe('input', () => {
    it('is a searchbox named by its placeholder', () => {
      renderWithTheme(<SearchBar placeholder="Search mail" />)
      const input = screen.getByRole('searchbox')
      expect(input.props.accessibilityLabel).toBe('Search mail')
      expect(input.props.placeholder).toBe('Search mail')
    })

    it('lets an explicit accessibilityLabel win over the placeholder', () => {
      renderWithTheme(
        <SearchBar placeholder="Search" accessibilityLabel="Search contacts" />,
      )
      expect(screen.getByLabelText('Search contacts')).toBeTruthy()
    })

    it('sits inside a search landmark', () => {
      const { toJSON } = renderWithTheme(<SearchBar placeholder="Search" />)
      expect(rootOf(toJSON()).props.accessibilityRole).toBe('search')
    })

    it('shows a Search key on the keyboard by default', () => {
      renderWithTheme(<SearchBar placeholder="Search" />)
      expect(screen.getByRole('searchbox').props.returnKeyType).toBe('search')
    })

    it('displays a controlled value and reports typing', () => {
      const onChangeText = jest.fn()
      renderWithTheme(
        <SearchBar
          placeholder="Search"
          value="rain"
          onChangeText={onChangeText}
        />,
      )
      const input = screen.getByRole('searchbox')
      expect(input.props.value).toBe('rain')
      fireEvent.changeText(input, 'rainbow')
      expect(onChangeText).toHaveBeenCalledWith('rainbow')
    })

    it('calls onSearch with the current query on submit', () => {
      const onSearch = jest.fn()
      const onSubmitEditing = jest.fn()
      renderWithTheme(
        <SearchBar
          placeholder="Search"
          value="trek"
          onSearch={onSearch}
          onSubmitEditing={onSubmitEditing}
        />,
      )
      fireEvent(screen.getByRole('searchbox'), 'submitEditing', {
        nativeEvent: { text: 'trek' },
      })
      expect(onSearch).toHaveBeenCalledWith('trek')
      expect(onSubmitEditing).toHaveBeenCalledTimes(1)
    })

    it('forwards the ref to the TextInput', () => {
      const ref = createRef<TextInput>()
      renderWithTheme(<SearchBar placeholder="Search" ref={ref} />)
      expect(ref.current).not.toBeNull()
      expect(typeof ref.current?.focus).toBe('function')
    })
  })

  describe('clear button', () => {
    it('is hidden while the bar is empty', () => {
      renderWithTheme(<SearchBar placeholder="Search" value="" />)
      expect(screen.queryByLabelText('Clear search')).toBeNull()
    })

    it('empties a controlled bar through onChangeText', () => {
      const onChangeText = jest.fn()
      const onClear = jest.fn()
      renderWithTheme(
        <SearchBar
          placeholder="Search"
          value="rain"
          onChangeText={onChangeText}
          onClear={onClear}
        />,
      )
      fireEvent.press(screen.getByLabelText('Clear search'))
      expect(onChangeText).toHaveBeenCalledWith('')
      expect(onClear).toHaveBeenCalledTimes(1)
    })

    it('shows and hides itself in an uncontrolled bar', () => {
      renderWithTheme(<SearchBar placeholder="Search" />)
      expect(screen.queryByLabelText('Clear search')).toBeNull()

      fireEvent.changeText(screen.getByRole('searchbox'), 'rain')
      fireEvent.press(screen.getByLabelText('Clear search'))

      expect(screen.queryByLabelText('Clear search')).toBeNull()
    })

    it('starts visible when defaultValue holds text', () => {
      renderWithTheme(<SearchBar placeholder="Search" defaultValue="rain" />)
      expect(screen.getByLabelText('Clear search')).toBeTruthy()
    })

    it('can be turned off', () => {
      renderWithTheme(
        <SearchBar placeholder="Search" value="rain" showClearButton={false} />,
      )
      expect(screen.queryByLabelText('Clear search')).toBeNull()
    })

    it('takes a custom accessibility label', () => {
      renderWithTheme(
        <SearchBar
          placeholder="Search"
          value="rain"
          clearButtonAccessibilityLabel="Clear query"
        />,
      )
      expect(screen.getByLabelText('Clear query')).toBeTruthy()
    })
  })

  describe('leading icon', () => {
    it('is decoration without a press handler', () => {
      renderWithTheme(<SearchBar placeholder="Search" />)
      expect(screen.queryAllByRole('button')).toHaveLength(0)
    })

    it('becomes a labelled button with onLeadingIconPress', () => {
      const onLeadingIconPress = jest.fn()
      renderWithTheme(
        <SearchBar
          placeholder="Search"
          leadingIcon="menu"
          onLeadingIconPress={onLeadingIconPress}
          leadingIconAccessibilityLabel="Open menu"
        />,
      )
      fireEvent.press(screen.getByLabelText('Open menu'))
      expect(onLeadingIconPress).toHaveBeenCalledTimes(1)
    })

    it('warns once when the leading button has no label', () => {
      __resetWarnOnceForTests()
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      renderWithTheme(
        <SearchBar placeholder="Search" onLeadingIconPress={() => {}} />,
      )
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('leadingIconAccessibilityLabel'),
      )
      errorSpy.mockRestore()
    })
  })

  /**
   * `IconButton` sets `alignSelf: 'flex-start'`, which beats the row's
   * `alignItems: 'center'`. Without its frame, each button rides at the top
   * of the 56dp bar. Found on web, where the clear button sat 8dp high; jsdom
   * computes no layout, so this asserts the frame instead of a position.
   */
  describe('icon buttons stay centered', () => {
    it.each(['Clear search', 'Open menu', 'Voice search'])(
      '%s sits in a centering frame',
      (label) => {
        renderWithTheme(
          <SearchBar
            placeholder="Search"
            value="rain"
            onLeadingIconPress={() => {}}
            leadingIconAccessibilityLabel="Open menu"
            actions={[
              { icon: 'microphone', accessibilityLabel: 'Voice search' },
            ]}
          />,
        )
        // The button's outermost node is the one that sets `flex-start`.
        // Its parent must be the frame: in the broken layout the parent was
        // the 56dp bar itself.
        let node: ReactTestInstance | null = screen.getByLabelText(label)
        while (node && styleOf(node)?.alignSelf !== 'flex-start') {
          node = node.parent
        }
        let parent = node?.parent ?? null
        while (
          parent &&
          (styleOf(parent) === undefined ||
            styleOf(parent).alignSelf === 'flex-start')
        ) {
          parent = parent.parent
        }
        const frame = parent ? styleOf(parent) : undefined
        expect(frame).toMatchObject({
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
        })
      },
    )
  })

  describe('trailing slot', () => {
    it('renders actions as labelled icon buttons', () => {
      const onPress = jest.fn()
      renderWithTheme(
        <SearchBar
          placeholder="Search"
          actions={[
            { icon: 'microphone', accessibilityLabel: 'Voice search', onPress },
          ]}
        />,
      )
      fireEvent.press(screen.getByLabelText('Voice search'))
      expect(onPress).toHaveBeenCalledTimes(1)
    })

    it('renders custom trailing content', () => {
      renderWithTheme(
        <SearchBar
          placeholder="Search"
          trailing={<Text testID="avatar">JD</Text>}
        />,
      )
      expect(screen.getByTestId('avatar')).toBeTruthy()
    })

    // The `@ts-expect-error` is the assertion: the build fails if the union
    // ever stops rejecting the pair.
    it('rejects actions and trailing together at the type level', () => {
      renderWithTheme(
        // @ts-expect-error - trailing cannot be combined with actions
        <SearchBar
          placeholder="Search"
          actions={[{ icon: 'microphone', accessibilityLabel: 'Voice' }]}
          trailing={<Text testID="custom-trailing">Custom</Text>}
        />,
      )
      expect(screen.getByTestId('custom-trailing')).toBeTruthy()
    })
  })

  describe('as a trigger', () => {
    it('is a button named by the placeholder that calls onPress', () => {
      const onPress = jest.fn()
      renderWithTheme(<SearchBar placeholder="Search" onPress={onPress} />)
      const button = screen.getByRole('button', { name: 'Search' })
      expect(button.props.tabIndex).toBe(0)
      fireEvent.press(button)
      expect(onPress).toHaveBeenCalledTimes(1)
    })

    it('takes an explicit accessibilityLabel as the button name', () => {
      renderWithTheme(
        <SearchBar
          placeholder="Search"
          accessibilityLabel="Open search"
          onPress={() => {}}
        />,
      )
      expect(screen.getByRole('button', { name: 'Open search' })).toBeTruthy()
    })

    it('locks the input out of the tab order and the accessibility tree', () => {
      renderWithTheme(
        <SearchBar placeholder="Search" value="rain" onPress={() => {}} />,
      )
      const input = screen.UNSAFE_getByType(TextInput)
      expect(input.props.editable).toBe(false)
      expect(input.props.focusable).toBe(false)
      expect(input.props.tabIndex).toBe(-1)
      expect(input.props['aria-hidden']).toBe(true)
      expect(input.props.importantForAccessibility).toBe('no-hide-descendants')
      expect(input.props.value).toBe('rain')
      // The frame, not the input: Android's text field consumes a touch even
      // with a `pointerEvents` style, and a `View` does not.
      expect(StyleSheet.flatten(input.parent?.props.style).pointerEvents).toBe(
        'none',
      )
    })

    it('keeps the clear button and the actions as buttons of their own', () => {
      const onPress = jest.fn()
      const onClear = jest.fn()
      const onVoice = jest.fn()
      renderWithTheme(
        <SearchBar
          placeholder="Search"
          value="rain"
          onPress={onPress}
          onClear={onClear}
          actions={[
            {
              icon: 'microphone',
              accessibilityLabel: 'Voice',
              onPress: onVoice,
            },
          ]}
        />,
      )
      fireEvent.press(screen.getByLabelText('Clear search'))
      fireEvent.press(screen.getByLabelText('Voice'))
      expect(onClear).toHaveBeenCalledTimes(1)
      expect(onVoice).toHaveBeenCalledTimes(1)
      expect(onPress).not.toHaveBeenCalled()
    })

    it('leaves the input editable and the wrapper out of the tree without onPress', () => {
      renderWithTheme(<SearchBar placeholder="Search" />)
      expect(screen.queryByRole('button')).toBeNull()
      expect(screen.getByRole('searchbox').props.editable).toBe(true)
      expect(screen.getByRole('searchbox').props.focusable).toBeUndefined()
    })
  })

  describe('MD3 container', () => {
    it('is a 56dp pill on surfaceContainerHigh, at most 720dp wide', () => {
      const { toJSON } = renderWithTheme(<SearchBar placeholder="Search" />)
      const container = containerOf(screen.getByRole('searchbox'))
      expect(styleOf(container).backgroundColor).toBe(
        lightTheme.colors.surfaceContainerHigh,
      )
      expect(styleOf(container).borderRadius).toBe(lightTheme.shape.cornerFull)
      expect(StyleSheet.flatten(rootOf(toJSON()).props.style).maxWidth).toBe(
        SEARCH_BAR_MAX_WIDTH,
      )
    })

    it('uses the MD3 input and placeholder colors', () => {
      renderWithTheme(<SearchBar placeholder="Search" />)
      const input = screen.getByRole('searchbox')
      expect(styleOf(input).color).toBe(lightTheme.colors.onSurface)
      expect(input.props.placeholderTextColor).toBe(
        lightTheme.colors.onSurfaceVariant,
      )
      expect(input.props.cursorColor).toBe(lightTheme.colors.primary)
    })

    it('applies containerColor', () => {
      renderWithTheme(
        <SearchBar placeholder="Search" containerColor="#FF0000" />,
      )
      const container = containerOf(screen.getByRole('searchbox'))
      expect(styleOf(container).backgroundColor).toBe('#FF0000')
    })

    it('applies contentColor to the input text', () => {
      renderWithTheme(<SearchBar placeholder="Search" contentColor="#00FF00" />)
      expect(styleOf(screen.getByRole('searchbox')).color).toBe('#00FF00')
    })
  })

  describe('disabled', () => {
    it('locks the input and dims its content', () => {
      renderWithTheme(<SearchBar placeholder="Search" disabled />)
      const input = screen.getByRole('searchbox')
      expect(input.props.editable).toBe(false)
      expect(input.props.accessibilityState).toEqual({ disabled: true })
      expect(styleOf(input).color).toBe(disabledContent)
      expect(input.props.placeholderTextColor).toBe(disabledContent)
    })

    it('keeps the MD3 container color', () => {
      renderWithTheme(<SearchBar placeholder="Search" disabled />)
      const container = containerOf(screen.getByRole('searchbox'))
      expect(styleOf(container).backgroundColor).toBe(
        lightTheme.colors.surfaceContainerHigh,
      )
    })

    it('hides the clear button and disables the actions', () => {
      renderWithTheme(
        <SearchBar
          placeholder="Search"
          value="rain"
          disabled
          actions={[{ icon: 'microphone', accessibilityLabel: 'Voice' }]}
        />,
      )
      expect(screen.queryByLabelText('Clear search')).toBeNull()
      expect(
        screen.getByLabelText('Voice').props.accessibilityState,
      ).toMatchObject({ disabled: true })
    })
  })
})
