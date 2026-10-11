import { renderWithTheme } from '@rootnative/utils/test'
import { fireEvent, screen } from '@testing-library/react-native'
import { Checkbox } from '../checkbox'
import { ListItem } from '../list'
import { Radio } from '../radio'
import { Switch } from '../switch'

const CONTROLS = [
  { name: 'Checkbox', role: 'checkbox', Control: Checkbox },
  { name: 'Radio', role: 'radio', Control: Radio },
  { name: 'Switch', role: 'switch', Control: Switch },
] as const

describe.each(CONTROLS)(
  '$name with value and no onValueChange',
  ({ role, Control }) => {
    it('lets a tap on the control reach the row', () => {
      const onPress = jest.fn()
      renderWithTheme(
        <ListItem
          headlineText="Wi-Fi"
          onPress={onPress}
          trailingContent={<Control value={false} testID="control" />}
        />,
      )
      fireEvent.press(
        screen.getByTestId('control', { includeHiddenElements: true }),
      )
      expect(onPress).toHaveBeenCalledTimes(1)
    })

    it('is hidden from assistive technology, so the row carries the state', () => {
      renderWithTheme(
        <ListItem
          headlineText="Wi-Fi"
          role={role}
          aria-checked
          onPress={() => {}}
          trailingContent={<Control value />}
        />,
      )
      expect(screen.getAllByRole(role)).toHaveLength(1)
      expect(screen.getByRole(role, { checked: true })).toBeTruthy()
    })

    it('still announces its state when disabled', () => {
      renderWithTheme(<Control value disabled />)
      expect(
        screen.getByRole(role, { checked: true, disabled: true }),
      ).toBeTruthy()
    })

    it('takes the press itself when it has an onValueChange', () => {
      const onPress = jest.fn()
      const onValueChange = jest.fn()
      renderWithTheme(
        <ListItem
          headlineText="Wi-Fi"
          onPress={onPress}
          trailingContent={
            <Control
              value={false}
              onValueChange={onValueChange}
              testID="control"
            />
          }
        />,
      )
      fireEvent.press(screen.getByTestId('control'))
      expect(onValueChange).toHaveBeenCalledWith(true)
      expect(onPress).not.toHaveBeenCalled()
    })
  },
)
