import { lightTheme } from '@rootnative/core'
import { renderWithTheme } from '@rootnative/utils/test'
import { screen } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { Badge } from '../badge'
import { formatBadgeLabel } from '../badge/Badge'
import { NavigationBar } from '../navigation-bar'

function flatten(testID: string) {
  return StyleSheet.flatten(screen.getByTestId(testID).props.style)
}

describe('Badge', () => {
  describe('size', () => {
    it('renders a 6dp error dot when there is no label', () => {
      renderWithTheme(<Badge testID="badge" />)
      const style = flatten('badge')
      expect(style.width).toBe(6)
      expect(style.height).toBe(6)
      expect(style.backgroundColor).toBe(lightTheme.colors.error)
      expect(screen.getByTestId('badge').props.children).toBeNull()
    })

    it('renders a 16dp pill with labelSmall onError text when a label is set', () => {
      renderWithTheme(<Badge label={3} testID="badge" />)
      const style = flatten('badge')
      expect(style.height).toBe(16)
      expect(style.minWidth).toBe(16)
      expect(style.paddingHorizontal).toBe(4)
      expect(style.borderRadius).toBe(lightTheme.shape.cornerFull)

      const text = screen.getByText('3')
      const textStyle = StyleSheet.flatten(text.props.style)
      expect(textStyle.color).toBe(lightTheme.colors.onError)
      expect(textStyle.fontSize).toBe(lightTheme.typography.labelSmall.fontSize)
    })

    it('renders a string label as is', () => {
      renderWithTheme(<Badge label="NEW" />)
      expect(screen.getByText('NEW')).toBeTruthy()
    })
  })

  describe('max', () => {
    it('caps a number above max as max+', () => {
      renderWithTheme(<Badge label={1200} />)
      expect(screen.getByText('999+')).toBeTruthy()
    })

    it('honours a custom max', () => {
      renderWithTheme(<Badge label={120} max={99} />)
      expect(screen.getByText('99+')).toBeTruthy()
    })

    it('shows a number equal to max without the plus', () => {
      renderWithTheme(<Badge label={99} max={99} />)
      expect(screen.getByText('99')).toBeTruthy()
    })

    it('does not cap a string label', () => {
      expect(formatBadgeLabel('1200', 999)).toBe('1200')
    })

    it('formats zero and negative numbers as plain text', () => {
      expect(formatBadgeLabel(0, 999)).toBe('0')
      expect(formatBadgeLabel(-1, 999)).toBe('-1')
    })
  })

  describe('anchor', () => {
    it('renders inline with no wrapper when there are no children', () => {
      renderWithTheme(<Badge label={1} testID="badge" />)
      expect(screen.queryByTestId('badge-wrapper')).toBeNull()
      expect(flatten('badge').position).toBeUndefined()
    })

    it('anchors a large badge with the MD3 12dp / 14dp offsets', () => {
      renderWithTheme(
        <Badge label={1} testID="badge">
          <Text>anchor</Text>
        </Badge>,
      )
      expect(screen.getByTestId('badge-wrapper')).toBeTruthy()
      expect(screen.getByText('anchor')).toBeTruthy()
      const style = flatten('badge')
      expect(style.position).toBe('absolute')
      expect(style.start).toBe('100%')
      expect(style.marginStart).toBe(-12)
      expect(style.top).toBe(-2)
      expect(style.pointerEvents).toBe('none')
    })

    it('anchors a small badge with the MD3 6dp offset', () => {
      renderWithTheme(
        <Badge testID="badge">
          <Text>anchor</Text>
        </Badge>,
      )
      const style = flatten('badge')
      expect(style.position).toBe('absolute')
      expect(style.marginStart).toBe(-6)
      expect(style.top).toBe(0)
    })

    it('keeps the anchor and drops the badge when visible is false', () => {
      renderWithTheme(
        <Badge label={4} visible={false} testID="badge">
          <Text>anchor</Text>
        </Badge>,
      )
      expect(screen.getByText('anchor')).toBeTruthy()
      expect(screen.queryByTestId('badge')).toBeNull()
      expect(screen.queryByText('4')).toBeNull()
    })

    it('renders nothing when visible is false and there is no anchor', () => {
      const { toJSON } = renderWithTheme(<Badge label={4} visible={false} />)
      expect(toJSON()).toBeNull()
    })
  })

  describe('colors', () => {
    it('applies containerColor and contentColor overrides', () => {
      renderWithTheme(
        <Badge
          label={5}
          containerColor="#123456"
          contentColor="#ABCDEF"
          testID="badge"
        />,
      )
      expect(flatten('badge').backgroundColor).toBe('#123456')
      expect(StyleSheet.flatten(screen.getByText('5').props.style).color).toBe(
        '#ABCDEF',
      )
    })
  })

  describe('accessibility', () => {
    it('is not an accessible node without an accessibilityLabel', () => {
      renderWithTheme(<Badge testID="badge" />)
      expect(screen.getByTestId('badge').props.accessible).toBeUndefined()
    })

    it('exposes the accessibilityLabel on the badge node', () => {
      renderWithTheme(<Badge accessibilityLabel="New activity" />)
      const node = screen.getByLabelText('New activity')
      expect(node.props.accessible).toBe(true)
    })
  })

  describe('style', () => {
    it('applies style to the badge and wrapperStyle to the wrapper', () => {
      renderWithTheme(
        <Badge
          label={1}
          testID="badge"
          style={{ opacity: 0.5 }}
          wrapperStyle={{ margin: 3 }}
        >
          <Text>anchor</Text>
        </Badge>,
      )
      expect(flatten('badge').opacity).toBe(0.5)
      expect(flatten('badge-wrapper').margin).toBe(3)
    })
  })

  describe('NavigationBar integration', () => {
    // The icon block is `aria-hidden`, and RNTL skips hidden nodes by default.
    const hidden = { includeHiddenElements: true }
    const items = [
      { value: 'home', label: 'Home', icon: 'home-outline' },
      { value: 'inbox', label: 'Inbox', icon: 'email-outline', badge: 7 },
      { value: 'alerts', label: 'Alerts', icon: 'bell-outline', badge: true },
      { value: 'off', label: 'Off', icon: 'circle', badge: false },
    ]

    it('renders a large badge for a numeric item badge', () => {
      renderWithTheme(<NavigationBar items={items} testID="nav" />)
      expect(screen.getByText('7', hidden)).toBeTruthy()
      expect(
        StyleSheet.flatten(
          screen.getByTestId('nav-item-inbox-badge', hidden).props.style,
        ).height,
      ).toBe(16)
    })

    it('renders a dot for badge: true', () => {
      renderWithTheme(<NavigationBar items={items} testID="nav" />)
      expect(
        StyleSheet.flatten(
          screen.getByTestId('nav-item-alerts-badge', hidden).props.style,
        ).width,
      ).toBe(6)
    })

    it('renders no badge when badge is false or unset', () => {
      renderWithTheme(<NavigationBar items={items} testID="nav" />)
      expect(screen.queryByTestId('nav-item-home-badge', hidden)).toBeNull()
      expect(screen.queryByTestId('nav-item-off-badge', hidden)).toBeNull()
    })
  })
})
