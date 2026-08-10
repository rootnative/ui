import { lightTheme } from '@rootnative/core'
import { renderWithTheme } from '@rootnative/utils/test'
import { screen, fireEvent } from '@testing-library/react-native'
import { StyleSheet, Text, View } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import { Card } from '../card/Card'
import {
  CARD_ACTIONS_GAP,
  CARD_ACTIONS_PADDING_TOP,
  CARD_CONTENT_PADDING,
} from '../card/styles'

/**
 * Absolutely-positioned Views inside a region — the fill wrapper `Card.Media`
 * adds only when it has a size of its own.
 *
 * Asserted through the style rather than node identity: RNTL's `children`
 * yields wrapper instances, so comparing them against a `getByTestId` handle
 * passes or fails for reasons unrelated to the structure under test.
 *
 * Typed structurally on the one field this reads — RNTL uses
 * `ReactTestInstance` internally but does not re-export it, and
 * `react-test-renderer` ships no types here, so `findAllByType` is untyped.
 */
interface StyledNode {
  props: { style?: StyleProp<ViewStyle> }
}

function absoluteFillsWithin(testID: string): StyledNode[] {
  const nodes: StyledNode[] = screen.getByTestId(testID).findAllByType(View)
  return nodes.filter((node) => {
    const flat = StyleSheet.flatten(node.props.style)
    return flat?.position === 'absolute'
  })
}

describe('Card', () => {
  it('renders children content', () => {
    renderWithTheme(
      <Card>
        <Text>Card content</Text>
      </Card>,
    )
    expect(screen.getByText('Card content')).toBeTruthy()
  })

  it('renders as non-interactive when no onPress provided', () => {
    renderWithTheme(
      <Card>
        <Text>Static card</Text>
      </Card>,
    )
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders as interactive when onPress is provided', () => {
    renderWithTheme(
      <Card onPress={() => {}}>
        <Text>Clickable card</Text>
      </Card>,
    )
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('calls onPress when pressed', () => {
    const onPress = jest.fn()
    renderWithTheme(
      <Card onPress={onPress}>
        <Text>Tap me</Text>
      </Card>,
    )
    fireEvent.press(screen.getByRole('button'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn()
    renderWithTheme(
      <Card onPress={onPress} disabled>
        <Text>Disabled card</Text>
      </Card>,
    )
    fireEvent.press(screen.getByRole('button'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('sets disabled accessibility state when disabled', () => {
    renderWithTheme(
      <Card onPress={() => {}} disabled>
        <Text>Disabled</Text>
      </Card>,
    )
    const button = screen.getByRole('button')
    expect(button.props.accessibilityState).toEqual({ disabled: true })
  })

  describe('MD3 variant colors', () => {
    it('elevated card uses surfaceContainerLow as its container color', () => {
      renderWithTheme(
        <Card testID="card" variant="elevated">
          <Text>Elevated</Text>
        </Card>,
      )
      const flatStyle = StyleSheet.flatten(
        screen.getByTestId('card').props.style,
      )
      expect(flatStyle.backgroundColor).toBe(
        lightTheme.colors.surfaceContainerLow,
      )
    })

    it('outlined card uses outlineVariant for its border', () => {
      renderWithTheme(
        <Card testID="card" variant="outlined">
          <Text>Outlined</Text>
        </Card>,
      )
      const flatStyle = StyleSheet.flatten(
        screen.getByTestId('card').props.style,
      )
      expect(flatStyle.borderColor).toBe(lightTheme.colors.outlineVariant)
      expect(flatStyle.borderWidth).toBe(1)
    })
  })

  // Elevation lives in `elevation.test.tsx` — the mechanism is shared with
  // Button, Chip and FAB, and the invariants are the same for all four.

  describe('overrides', () => {
    it('applies containerColor to a non-interactive card', () => {
      renderWithTheme(
        <Card testID="card" containerColor="#FF0000">
          <Text>Red card</Text>
        </Card>,
      )
      const card = screen.getByTestId('card')
      const flatStyle = StyleSheet.flatten(card.props.style)
      expect(flatStyle.backgroundColor).toBe('#FF0000')
    })

    it('applies containerColor to an interactive card', () => {
      renderWithTheme(
        <Card onPress={() => {}} containerColor="#FF0000">
          <Text>Red card</Text>
        </Card>,
      )
      const card = screen.getByRole('button')
      const flatStyle = StyleSheet.flatten(card.props.style)
      expect(flatStyle.backgroundColor).toBe('#FF0000')
    })
  })

  describe('regions', () => {
    // The reason the slots exist: every consumer (and this library's own
    // example screen) hand-rolled a padded wrapper, and they drifted.
    it('Card.Content owns the MD3 content padding', () => {
      renderWithTheme(
        <Card>
          <Card.Content testID="content">
            <Text>Body</Text>
          </Card.Content>
        </Card>,
      )
      const flatStyle = StyleSheet.flatten(
        screen.getByTestId('content').props.style,
      )
      expect(flatStyle.padding).toBe(CARD_CONTENT_PADDING)
    })

    it('Card.Media carries no padding, so media sits edge-to-edge', () => {
      renderWithTheme(
        <Card>
          <Card.Media testID="media" height={120}>
            <Text>Image</Text>
          </Card.Media>
        </Card>,
      )
      const flatStyle = StyleSheet.flatten(
        screen.getByTestId('media').props.style,
      )
      expect(flatStyle.padding).toBeUndefined()
      expect(flatStyle.paddingStart).toBeUndefined()
      expect(flatStyle.height).toBe(120)
    })

    it('Card.Media takes its height from aspectRatio when height is absent', () => {
      renderWithTheme(
        <Card>
          <Card.Media testID="media" aspectRatio={16 / 9}>
            <Text>Image</Text>
          </Card.Media>
        </Card>,
      )
      const flatStyle = StyleSheet.flatten(
        screen.getByTestId('media').props.style,
      )
      expect(flatStyle.aspectRatio).toBe(16 / 9)
      expect(flatStyle.height).toBeUndefined()
    })

    it('Card.Media prefers height over aspectRatio when both are set', () => {
      renderWithTheme(
        <Card>
          <Card.Media testID="media" height={100} aspectRatio={16 / 9}>
            <Text>Image</Text>
          </Card.Media>
        </Card>,
      )
      const flatStyle = StyleSheet.flatten(
        screen.getByTestId('media').props.style,
      )
      expect(flatStyle.height).toBe(100)
      expect(flatStyle.aspectRatio).toBeUndefined()
    })

    // An unsized Media *is* the height source for its own children, so it must
    // not wrap them in an absolute fill — that would collapse it to zero.
    // Asserted via the fill style reaching the tree, not via node identity:
    // RNTL's `children` yields wrapper instances, so comparing them against a
    // `getByTestId` handle passes or fails for reasons unrelated to structure.
    it('Card.Media does not stretch children when it has no size of its own', () => {
      renderWithTheme(
        <Card>
          <Card.Media testID="media">
            <Text>Image</Text>
          </Card.Media>
        </Card>,
      )
      expect(absoluteFillsWithin('media')).toHaveLength(0)
    })

    it('Card.Media stretches children to fill when it is sized', () => {
      renderWithTheme(
        <Card>
          <Card.Media testID="media" height={120}>
            <Text>Image</Text>
          </Card.Media>
        </Card>,
      )
      const fills = absoluteFillsWithin('media')
      expect(fills).toHaveLength(1)
      const flat = StyleSheet.flatten(fills[0].props.style)
      expect(flat.width).toBe('100%')
      expect(flat.height).toBe('100%')
    })

    it('Card.Actions aligns to the trailing edge by default', () => {
      renderWithTheme(
        <Card>
          <Card.Actions testID="actions">
            <Text>Action</Text>
          </Card.Actions>
        </Card>,
      )
      const flatStyle = StyleSheet.flatten(
        screen.getByTestId('actions').props.style,
      )
      expect(flatStyle.flexDirection).toBe('row')
      expect(flatStyle.justifyContent).toBe('flex-end')
      expect(flatStyle.gap).toBe(CARD_ACTIONS_GAP)
    })

    it('Card.Actions honors align', () => {
      renderWithTheme(
        <Card>
          <Card.Actions testID="actions" align="space-between">
            <Text>A</Text>
            <Text>B</Text>
          </Card.Actions>
        </Card>,
      )
      const flatStyle = StyleSheet.flatten(
        screen.getByTestId('actions').props.style,
      )
      expect(flatStyle.justifyContent).toBe('space-between')
    })

    // Logical padding, so the row mirrors in RTL without a direction branch.
    // `justifyContent: 'flex-end'` needs no mirroring — it already follows the
    // writing direction.
    it('Card.Actions uses logical padding rather than left/right', () => {
      renderWithTheme(
        <Card>
          <Card.Actions testID="actions">
            <Text>Action</Text>
          </Card.Actions>
        </Card>,
      )
      const flatStyle = StyleSheet.flatten(
        screen.getByTestId('actions').props.style,
      )
      expect(flatStyle.paddingStart).toBe(CARD_CONTENT_PADDING)
      expect(flatStyle.paddingEnd).toBe(CARD_CONTENT_PADDING)
      expect(flatStyle.paddingLeft).toBeUndefined()
      expect(flatStyle.paddingRight).toBeUndefined()
    })

    // The actions row sits closer to the content above it than a symmetric
    // 16dp would put it, because a Button brings its own vertical padding.
    it('Card.Actions has a shorter top pad than its bottom pad', () => {
      renderWithTheme(
        <Card>
          <Card.Actions testID="actions">
            <Text>Action</Text>
          </Card.Actions>
        </Card>,
      )
      const flatStyle = StyleSheet.flatten(
        screen.getByTestId('actions').props.style,
      )
      expect(flatStyle.paddingTop).toBe(CARD_ACTIONS_PADDING_TOP)
      expect(flatStyle.paddingBottom).toBe(CARD_CONTENT_PADDING)
      expect(flatStyle.paddingTop).toBeLessThan(flatStyle.paddingBottom)
    })

    it('regions compose in the MD3 order without a wrapper', () => {
      renderWithTheme(
        <Card>
          <Card.Media height={100}>
            <Text>Media</Text>
          </Card.Media>
          <Card.Content>
            <Text>Content</Text>
          </Card.Content>
          <Card.Actions>
            <Text>Actions</Text>
          </Card.Actions>
        </Card>,
      )
      expect(screen.getByText('Media')).toBeTruthy()
      expect(screen.getByText('Content')).toBeTruthy()
      expect(screen.getByText('Actions')).toBeTruthy()
    })

    it('regions work inside an interactive card', () => {
      const onPress = jest.fn()
      renderWithTheme(
        <Card onPress={onPress}>
          <Card.Content>
            <Text>Body</Text>
          </Card.Content>
        </Card>,
      )
      fireEvent.press(screen.getByRole('button'))
      expect(onPress).toHaveBeenCalledTimes(1)
    })

    // The slots are additive. Raw children must stay unpadded, or every
    // existing call site silently gains spacing.
    it('leaves raw children unpadded', () => {
      renderWithTheme(
        <Card testID="card">
          <Text>Raw</Text>
        </Card>,
      )
      const flatStyle = StyleSheet.flatten(
        screen.getByTestId('card').props.style,
      )
      expect(flatStyle.padding).toBeUndefined()
      expect(flatStyle.paddingTop).toBeUndefined()
    })
  })
})
