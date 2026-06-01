import { renderWithTheme } from '@rootnative/utils/test'
import { fireEvent, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { ButtonGroup } from '../button-group/ButtonGroup'
import type { ButtonGroupItem } from '../button-group/types'

const ITEMS: ButtonGroupItem[] = [
  { value: 'one', label: 'One' },
  { value: 'two', label: 'Two' },
  { value: 'three', label: 'Three' },
]

describe('ButtonGroup', () => {
  it('renders every item label', () => {
    renderWithTheme(<ButtonGroup items={ITEMS} />)
    expect(screen.getByText('One')).toBeTruthy()
    expect(screen.getByText('Two')).toBeTruthy()
    expect(screen.getByText('Three')).toBeTruthy()
  })

  it('renders without items without crashing', () => {
    renderWithTheme(<ButtonGroup items={[]} testID="bg" />)
    expect(screen.getByTestId('bg')).toBeTruthy()
  })

  describe('container role by selectionMode', () => {
    it('uses toolbar for none', () => {
      renderWithTheme(<ButtonGroup items={ITEMS} testID="bg" />)
      expect(screen.getByTestId('bg').props.accessibilityRole).toBe('toolbar')
    })

    it('uses radiogroup for single', () => {
      renderWithTheme(
        <ButtonGroup
          items={ITEMS}
          selectionMode="single"
          defaultValue="one"
          testID="bg"
        />,
      )
      expect(screen.getByTestId('bg').props.accessibilityRole).toBe(
        'radiogroup',
      )
    })

    it('uses no special role (none) for multiple', () => {
      renderWithTheme(
        <ButtonGroup
          items={ITEMS}
          selectionMode="multiple"
          defaultValue={[]}
          testID="bg"
        />,
      )
      expect(screen.getByTestId('bg').props.accessibilityRole).toBe('none')
    })
  })

  describe('item role by selectionMode', () => {
    it('renders button items in none mode', () => {
      renderWithTheme(<ButtonGroup items={ITEMS} />)
      expect(screen.getAllByRole('button')).toHaveLength(3)
    })

    it('renders radio items in single mode', () => {
      renderWithTheme(<ButtonGroup items={ITEMS} selectionMode="single" />)
      expect(screen.getAllByRole('radio')).toHaveLength(3)
    })

    it('renders checkbox items in multiple mode', () => {
      renderWithTheme(<ButtonGroup items={ITEMS} selectionMode="multiple" />)
      expect(screen.getAllByRole('checkbox')).toHaveLength(3)
    })
  })

  describe('selection mode: none', () => {
    it('calls onItemPress with the pressed value', () => {
      const onItemPress = jest.fn()
      renderWithTheme(<ButtonGroup items={ITEMS} onItemPress={onItemPress} />)
      fireEvent.press(screen.getByRole('button', { name: 'Two' }))
      expect(onItemPress).toHaveBeenCalledWith('two')
    })

    it('does not mark items as selected', () => {
      renderWithTheme(<ButtonGroup items={ITEMS} />)
      const button = screen.getByRole('button', { name: 'One' })
      expect(button.props.accessibilityState).toEqual(
        expect.objectContaining({ disabled: false }),
      )
      expect(button.props.accessibilityState.selected).toBeUndefined()
    })
  })

  describe('selection mode: single', () => {
    it('reflects defaultValue in accessibilityState', () => {
      renderWithTheme(
        <ButtonGroup items={ITEMS} selectionMode="single" defaultValue="two" />,
      )
      const two = screen.getByRole('radio', { name: 'Two' })
      expect(two.props.accessibilityState).toEqual(
        expect.objectContaining({ selected: true }),
      )
      const one = screen.getByRole('radio', { name: 'One' })
      expect(one.props.accessibilityState).toEqual(
        expect.objectContaining({ selected: false }),
      )
    })

    it('calls onValueChange with the new value when an unselected item is pressed', () => {
      const onValueChange = jest.fn()
      renderWithTheme(
        <ButtonGroup
          items={ITEMS}
          selectionMode="single"
          defaultValue="one"
          onValueChange={onValueChange}
        />,
      )
      fireEvent.press(screen.getByRole('radio', { name: 'Three' }))
      expect(onValueChange).toHaveBeenCalledWith('three')
    })

    it('calls onValueChange with null when the selected item is pressed again', () => {
      const onValueChange = jest.fn()
      renderWithTheme(
        <ButtonGroup
          items={ITEMS}
          selectionMode="single"
          defaultValue="one"
          onValueChange={onValueChange}
        />,
      )
      fireEvent.press(screen.getByRole('radio', { name: 'One' }))
      expect(onValueChange).toHaveBeenCalledWith(null)
    })

    it('also calls onItemPress alongside onValueChange', () => {
      const onItemPress = jest.fn()
      const onValueChange = jest.fn()
      renderWithTheme(
        <ButtonGroup
          items={ITEMS}
          selectionMode="single"
          onItemPress={onItemPress}
          onValueChange={onValueChange}
        />,
      )
      fireEvent.press(screen.getByRole('radio', { name: 'Two' }))
      expect(onItemPress).toHaveBeenCalledWith('two')
      expect(onValueChange).toHaveBeenCalledWith('two')
    })

    it('honors the controlled value prop', () => {
      renderWithTheme(
        <ButtonGroup items={ITEMS} selectionMode="single" value="three" />,
      )
      const three = screen.getByRole('radio', { name: 'Three' })
      expect(three.props.accessibilityState).toEqual(
        expect.objectContaining({ selected: true }),
      )
    })
  })

  describe('selection mode: multiple', () => {
    it('reflects defaultValue (multi-selected) as checked in accessibilityState', () => {
      renderWithTheme(
        <ButtonGroup
          items={ITEMS}
          selectionMode="multiple"
          defaultValue={['one', 'three']}
        />,
      )
      expect(
        screen.getByRole('checkbox', { name: 'One' }).props.accessibilityState,
      ).toEqual(expect.objectContaining({ checked: true }))
      expect(
        screen.getByRole('checkbox', { name: 'Two' }).props.accessibilityState,
      ).toEqual(expect.objectContaining({ checked: false }))
      expect(
        screen.getByRole('checkbox', { name: 'Three' }).props
          .accessibilityState,
      ).toEqual(expect.objectContaining({ checked: true }))
    })

    it('does not expose a selected accessibilityState on checkbox items', () => {
      renderWithTheme(
        <ButtonGroup
          items={ITEMS}
          selectionMode="multiple"
          defaultValue={['one']}
        />,
      )
      const one = screen.getByRole('checkbox', { name: 'One' })
      expect(one.props.accessibilityState.selected).toBeUndefined()
    })

    it('toggles checked state when an item is pressed', () => {
      renderWithTheme(
        <ButtonGroup
          items={ITEMS}
          selectionMode="multiple"
          defaultValue={[]}
        />,
      )
      fireEvent.press(screen.getByRole('checkbox', { name: 'Two' }))
      expect(
        screen.getByRole('checkbox', { name: 'Two' }).props.accessibilityState,
      ).toEqual(expect.objectContaining({ checked: true }))
    })

    it('adds a value to the selection when an unselected item is pressed', () => {
      const onValueChange = jest.fn()
      renderWithTheme(
        <ButtonGroup
          items={ITEMS}
          selectionMode="multiple"
          defaultValue={['one']}
          onValueChange={onValueChange}
        />,
      )
      fireEvent.press(screen.getByRole('checkbox', { name: 'Two' }))
      expect(onValueChange).toHaveBeenCalledWith(['one', 'two'])
    })

    it('removes a value when an already-selected item is pressed', () => {
      const onValueChange = jest.fn()
      renderWithTheme(
        <ButtonGroup
          items={ITEMS}
          selectionMode="multiple"
          defaultValue={['one', 'two']}
          onValueChange={onValueChange}
        />,
      )
      fireEvent.press(screen.getByRole('checkbox', { name: 'One' }))
      expect(onValueChange).toHaveBeenCalledWith(['two'])
    })
  })

  describe('disabled', () => {
    it('marks every item disabled when groupDisabled is set', () => {
      renderWithTheme(<ButtonGroup items={ITEMS} disabled />)
      for (const name of ['One', 'Two', 'Three']) {
        const item = screen.getByRole('button', { name })
        expect(item.props.accessibilityState).toEqual(
          expect.objectContaining({ disabled: true }),
        )
      }
    })

    it('does not call onItemPress when the group is disabled', () => {
      const onItemPress = jest.fn()
      renderWithTheme(
        <ButtonGroup items={ITEMS} disabled onItemPress={onItemPress} />,
      )
      fireEvent.press(screen.getByRole('button', { name: 'One' }))
      expect(onItemPress).not.toHaveBeenCalled()
    })

    it('disables only the marked item when item.disabled is set', () => {
      const items: ButtonGroupItem[] = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B', disabled: true },
      ]
      renderWithTheme(<ButtonGroup items={items} />)
      expect(
        screen.getByRole('button', { name: 'A' }).props.accessibilityState,
      ).toEqual(expect.objectContaining({ disabled: false }))
      expect(
        screen.getByRole('button', { name: 'B' }).props.accessibilityState,
      ).toEqual(expect.objectContaining({ disabled: true }))
    })

    it('does not toggle selection for a disabled item', () => {
      const onValueChange = jest.fn()
      const items: ButtonGroupItem[] = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B', disabled: true },
      ]
      renderWithTheme(
        <ButtonGroup
          items={items}
          selectionMode="single"
          onValueChange={onValueChange}
        />,
      )
      fireEvent.press(screen.getByRole('radio', { name: 'B' }))
      expect(onValueChange).not.toHaveBeenCalled()
    })
  })

  describe('icons', () => {
    it('renders a leadingIcon string via the iconResolver', () => {
      const iconResolver = jest.fn(() => (
        <Text testID="leading-resolved">L</Text>
      ))
      renderWithTheme(
        <ButtonGroup
          items={[{ value: 'x', label: 'X', leadingIcon: 'star' }]}
        />,
        { iconResolver },
      )
      expect(iconResolver).toHaveBeenCalledWith(
        'star',
        expect.objectContaining({ size: expect.any(Number) }),
      )
      expect(screen.getByTestId('leading-resolved')).toBeTruthy()
    })

    it('renders a trailingIcon ReactElement as-is', () => {
      renderWithTheme(
        <ButtonGroup
          items={[
            {
              value: 'x',
              label: 'X',
              trailingIcon: <Text testID="trailing-icon">→</Text>,
            },
          ]}
        />,
      )
      expect(screen.getByTestId('trailing-icon')).toBeTruthy()
    })
  })

  it('forwards accessibilityLabel and testID to the container', () => {
    renderWithTheme(
      <ButtonGroup
        items={ITEMS}
        accessibilityLabel="View options"
        testID="bg-root"
      />,
    )
    const container = screen.getByTestId('bg-root')
    expect(container.props.accessibilityLabel).toBe('View options')
  })

  it('uses item.accessibilityLabel as a fallback for the item label', () => {
    renderWithTheme(
      <ButtonGroup
        items={[{ value: 'a', accessibilityLabel: 'Icon-only action' }]}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Icon-only action' }),
    ).toBeTruthy()
  })
})
