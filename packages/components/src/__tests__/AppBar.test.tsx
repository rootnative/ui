import { defaultTopAppBarTokens, lightTheme } from '@rootnative/core'
import type { SharedValue } from '@rootnative/inertia'
import { alphaColor } from '@rootnative/utils'
import { renderWithTheme } from '@rootnative/utils/test'
import { screen, fireEvent } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import type { TextStyle, ViewStyle } from 'react-native'
import { AppBar, useAppBarContentColor } from '../appbar'
import { IconButton } from '../icon-button'
import { Menu } from '../menu'
import { Portal, PortalHost } from '../portal'
import { childrenOf, rootOf } from '../test-support/rendered-node'
import type { RenderedNode } from '../test-support/rendered-node'

// The Jest mock evaluates worklets once per render, so a plain `{ value }`
// stub is all a scroll offset needs to drive the collapse interpolation.
function scrollOffsetAt(value: number): SharedValue<number> {
  return { value } as SharedValue<number>
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
  return [...own, ...collectFlattenedStyles(childrenOf(node))]
}

function findSideSlots(node: RenderedNode): RenderedNode[] {
  const style = StyleSheet.flatten(node.props?.style) as ViewStyle | undefined
  const isSideSlot =
    style?.flexDirection === 'row' &&
    style.minHeight === defaultTopAppBarTokens.sideSlotMinHeight
  return [
    ...(isSideSlot ? [node] : []),
    ...childrenOf(node).flatMap(findSideSlots),
  ]
}

// Jest does no layout, so this asserts the rule that decides it: the side
// slot centres its children through `alignItems`, and a child that sets its
// own `alignSelf` escapes that. `IconButton` sets `flex-start`.
function expectSlotChildrenCentred(node: RenderedNode) {
  const slots = findSideSlots(node)
  expect(slots).toHaveLength(2)
  for (const slot of slots) {
    for (const child of childrenOf(slot)) {
      const style = StyleSheet.flatten(child.props.style) as ViewStyle
      expect(style?.alignSelf ?? 'auto').toMatch(/^(auto|center)$/)
    }
  }
}

// Jest fires no layout events, so a test reports the measured widths of the
// leading and trailing slots itself.
function layoutSideSlots(leadingWidth: number, actionsWidth: number) {
  const [leadingSlot, actionsSlot] = screen
    .UNSAFE_getAllByProps({ collapsable: false })
    .filter((node) => typeof node.type === 'string' && node.props.onLayout)
  const layout = (width: number) => ({
    nativeEvent: { layout: { x: 0, y: 0, width, height: 48 } },
  })
  fireEvent(leadingSlot, 'layout', layout(leadingWidth))
  fireEvent(actionsSlot, 'layout', layout(actionsWidth))
}

// `Typography` renders an `RCTText` host under the Jest `Text` mock, and an
// `Animated.Text` renders a `Text` host.
function isTextHost(node: RenderedNode) {
  return node.type === 'Text' || node.type === 'RCTText'
}

function parentOfText(
  node: RenderedNode,
  text: string,
): RenderedNode | undefined {
  const holdsText = childrenOf(node).some(
    (child) => isTextHost(child) && child.children?.join('') === text,
  )
  if (holdsText) return node
  for (const child of childrenOf(node)) {
    const found = parentOfText(child, text)
    if (found) return found
  }
  return undefined
}

function textsBeside(node: RenderedNode, text: string): string[] {
  const parent = parentOfText(node, text)
  if (!parent) throw new Error(`no node holds the text "${text}"`)
  return childrenOf(parent)
    .filter(isTextHost)
    .map((child) => child.children?.join('') ?? '')
}

function textStyleOf(text: string) {
  return StyleSheet.flatten(screen.getByText(text).props.style) as TextStyle
}

function titleInsets(node: RenderedNode) {
  const host = collectFlattenedStyles(node).find(
    (s) => s.start !== undefined || s.paddingStart !== undefined,
  )
  // The expanded title layer spans the container (`start: 0`) and carries the
  // inset as padding, so the padding is the inset when both are present.
  return { start: host?.paddingStart ?? host?.start, end: host?.end }
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

  describe('navigationIcon', () => {
    it('renders a close button that announces "Close"', () => {
      const onBackPress = jest.fn()
      renderWithTheme(
        <AppBar
          title="About"
          canGoBack
          navigationIcon="close"
          onBackPress={onBackPress}
        />,
      )
      expect(
        screen.getByText('close', { includeHiddenElements: true }),
      ).toBeTruthy()
      expect(screen.queryByLabelText('Go back')).toBeNull()
      fireEvent.press(screen.getByLabelText('Close'))
      expect(onBackPress).toHaveBeenCalledTimes(1)
    })

    it('keeps the back arrow and its label by default', () => {
      renderWithTheme(
        <AppBar title="Details" canGoBack navigationIcon="back" />,
      )
      expect(screen.getByLabelText('Go back')).toBeTruthy()
      expect(screen.queryByLabelText('Close')).toBeNull()
    })

    it('renders nothing without canGoBack', () => {
      renderWithTheme(<AppBar title="About" navigationIcon="close" />)
      expect(screen.queryByLabelText('Close')).toBeNull()
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

  // The expected numbers are the Compose Material 3 `TopAppBarLayout`
  // geometry: 4dp slot padding plus 4dp title padding, and a 12dp title
  // inset when the leading slot is empty.
  describe('title insets', () => {
    it('starts the title 16dp from the edge without leading content', () => {
      const { toJSON } = renderWithTheme(<AppBar title="Home" />)
      layoutSideSlots(0, 0)
      expect(titleInsets(rootOf(toJSON()))).toEqual({ start: 16, end: 8 })
    })

    it('starts the title 56dp from the edge after a 48dp navigation icon', () => {
      const { toJSON } = renderWithTheme(
        <AppBar
          title="Details"
          canGoBack
          actions={[{ icon: 'magnify', accessibilityLabel: 'Search' }]}
        />,
      )
      layoutSideSlots(48, 48)
      expect(titleInsets(rootOf(toJSON()))).toEqual({ start: 56, end: 56 })
    })

    it('gives an expanded title its own layer over the whole container', () => {
      const { toJSON } = renderWithTheme(
        <AppBar title="Medium" variant="medium" />,
      )
      // The medium title (32dp line) plus 24dp bottom padding is 56dp, and a
      // row under the 64dp top row had only 48dp, so the descenders clipped.
      const layer = collectFlattenedStyles(rootOf(toJSON())).find(
        (s) =>
          s.paddingBottom === defaultTopAppBarTokens.mediumTitleBottomPadding,
      )
      expect(layer).toMatchObject({
        position: 'absolute',
        top: 0,
        bottom: 0,
        start: 0,
        end: 0,
        justifyContent: 'flex-end',
      })
    })

    describe('center-aligned title placement', () => {
      // Jest fires no layout events, so the bar and the title report their
      // widths here, the way `layoutSideSlots` does for the slots.
      function layoutBarAndTitle(barWidth: number, titleWidth: number) {
        const hosts = screen.UNSAFE_root.findAll(
          (node) =>
            typeof node.type === 'string' &&
            Boolean(node.props.onLayout) &&
            node.props.collapsable !== false,
        )
        const flat = (node: (typeof hosts)[number]) =>
          StyleSheet.flatten(node.props.style) as ViewStyle
        const bar = hosts.find(
          (node) =>
            flat(node).height === defaultTopAppBarTokens.smallContainerHeight,
        )
        const titleHost = hosts.find(
          (node) => flat(node).marginStart !== undefined,
        )
        fireEvent(bar!, 'layout', {
          nativeEvent: { layout: { x: 0, y: 0, width: barWidth, height: 64 } },
        })
        fireEvent(titleHost!, 'layout', {
          nativeEvent: {
            layout: { x: 0, y: 0, width: titleWidth, height: 28 },
          },
        })
        return () => flat(titleHost!).marginStart
      }

      function renderCentered() {
        return renderWithTheme(
          <AppBar
            title="Centered"
            variant="center-aligned"
            canGoBack
            actions={[
              { icon: 'magnify', accessibilityLabel: 'Search' },
              { icon: 'dots-vertical', accessibilityLabel: 'More' },
            ]}
          />,
        )
      }

      it('keeps the whole width between the slots', () => {
        const { toJSON } = renderCentered()
        layoutSideSlots(48, 96)
        expect(titleInsets(rootOf(toJSON()))).toEqual({ start: 56, end: 104 })
      })

      it('sits at the screen centre while it fits there', () => {
        renderCentered()
        layoutSideSlots(48, 96)
        const marginStart = layoutBarAndTitle(400, 100)
        // (400 - 100) / 2 = 150 from the edge, which is 94 past the 56dp start.
        expect(marginStart()).toBe(94)
      })

      it('shifts off centre instead of running under the actions', () => {
        renderCentered()
        layoutSideSlots(48, 96)
        const marginStart = layoutBarAndTitle(400, 220)
        // Centred would start at 90, but 90 + 220 runs past the 296dp end of
        // the free width, so the title starts at 296 - 220 = 76, i.e. 20 past
        // the start inset.
        expect(marginStart()).toBe(20)
      })

      it('fills the free width when it cannot fit at all', () => {
        renderCentered()
        layoutSideSlots(48, 96)
        const marginStart = layoutBarAndTitle(400, 300)
        expect(marginStart()).toBe(0)
      })
    })

    it('aligns an expanded title under the navigation icon', () => {
      const { toJSON } = renderWithTheme(
        <AppBar title="Large" variant="large" canGoBack />,
      )
      layoutSideSlots(48, 0)
      expect(titleInsets(rootOf(toJSON())).start).toBe(16)
    })

    it('moves a collapsing title from 16dp to the small-bar inset', () => {
      const expanded = renderWithTheme(
        <AppBar
          title="Large"
          variant="large"
          canGoBack
          scrollOffset={scrollOffsetAt(0)}
        />,
      )
      layoutSideSlots(48, 0)
      expect(titleInsets(rootOf(expanded.toJSON())).start).toBe(16)
      expanded.unmount()

      const collapsed = renderWithTheme(
        <AppBar
          title="Large"
          variant="large"
          canGoBack
          scrollOffset={scrollOffsetAt(500)}
        />,
      )
      layoutSideSlots(48, 0)
      expect(titleInsets(rootOf(collapsed.toJSON())).start).toBe(56)
    })
  })

  describe('side slot alignment', () => {
    it('centres an IconButton passed to leading and trailing', () => {
      const { toJSON } = renderWithTheme(
        <AppBar
          title="About"
          leading={<IconButton icon="close" accessibilityLabel="Close" />}
          trailing={<IconButton icon="share" accessibilityLabel="Share" />}
        />,
      )
      expectSlotChildrenCentred(rootOf(toJSON()))
    })

    it('centres a fragment of IconButtons in trailing', () => {
      const { toJSON } = renderWithTheme(
        <AppBar
          title="About"
          trailing={
            <>
              <IconButton icon="magnify" accessibilityLabel="Search" />
              <IconButton icon="share" accessibilityLabel="Share" />
            </>
          }
        />,
      )
      expectSlotChildrenCentred(rootOf(toJSON()))
    })

    it('centres the built-in navigation button and actions', () => {
      const { toJSON } = renderWithTheme(
        <AppBar
          title="Details"
          canGoBack
          actions={[{ icon: 'magnify', accessibilityLabel: 'Search' }]}
        />,
      )
      expectSlotChildrenCentred(rootOf(toJSON()))
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
    it('renders custom trailing content', () => {
      renderWithTheme(
        <AppBar
          title="Home"
          trailing={<Text testID="custom-trailing">Custom</Text>}
        />,
      )
      expect(screen.getByTestId('custom-trailing')).toBeTruthy()
    })

    // `trailing` and `actions` fill the same slot, so the type makes them
    // mutually exclusive. Passing both used to type-check while only `trailing`
    // rendered, which left the unused prop as dead code with nothing to catch
    // it. @ts-expect-error is the assertion: it fails the build if the union
    // ever stops rejecting the pair.
    it('rejects actions and trailing together at the type level', () => {
      renderWithTheme(
        // @ts-expect-error - trailing cannot be combined with actions
        <AppBar
          title="Home"
          actions={[{ icon: 'magnify', accessibilityLabel: 'Search' }]}
          trailing={<Text testID="custom-trailing">Custom</Text>}
        />,
      )
      // The runtime precedence is unchanged, and still worth pinning: a
      // consumer on plain JS gets no type error, so `trailing` must keep
      // winning rather than rendering both slots.
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

  // The type roles are Compose `AppBarSmallTokens`,
  // `AppBarMediumFlexibleTokens` and `AppBarLargeFlexibleTokens`, and the
  // color is `AppBarTokens.SubtitleColor`. The baseline medium and large
  // bars have no subtitle in the spec; they take the flexible roles and grow
  // by the flexible bars' growth (+24dp and +32dp).
  describe('subtitle', () => {
    const { typography, colors } = lightTheme

    function expectTypeRole(text: string, role: keyof typeof typography) {
      const style = textStyleOf(text)
      expect(style.fontSize).toBe(typography[role].fontSize)
      expect(style.lineHeight).toBe(typography[role].lineHeight)
      expect(style.letterSpacing).toBe(typography[role].letterSpacing)
    }

    function heightsOf(node: RenderedNode) {
      return collectFlattenedStyles(node).map((s) => s.height)
    }

    // The collapsing title block is the absolute layer whose start, top,
    // height and end the scroll drives.
    function collapsingBlock(node: RenderedNode) {
      const block = collectFlattenedStyles(node).find(
        (s) =>
          s.position === 'absolute' &&
          s.top !== undefined &&
          s.height !== undefined,
      )
      if (!block) throw new Error('no collapsing title block rendered')
      return { top: block.top, height: block.height }
    }

    it('puts a labelMedium line under a small title and keeps 64dp', () => {
      const { toJSON } = renderWithTheme(
        <AppBar title="Inbox" subtitle="3 unread" />,
      )
      const root = rootOf(toJSON())
      expect(textsBeside(root, '3 unread')).toEqual(['Inbox', '3 unread'])
      expectTypeRole('3 unread', 'labelMedium')
      expect(textStyleOf('3 unread').color).toBe(colors.onSurfaceVariant)
      expect(heightsOf(root)).toContain(64)
    })

    it('centres the subtitle with the title in the measured title node', () => {
      const { toJSON } = renderWithTheme(
        <AppBar
          title="Centered"
          subtitle="Subtitle"
          variant="center-aligned"
        />,
      )
      const parent = parentOfText(rootOf(toJSON()), 'Subtitle')
      const parentStyle = StyleSheet.flatten(parent?.props.style) as ViewStyle
      expect(parentStyle.marginStart).toBeDefined()
      expect(textsBeside(rootOf(toJSON()), 'Subtitle')).toEqual([
        'Centered',
        'Subtitle',
      ])
      expect(textStyleOf('Subtitle').textAlign).toBe('center')
      expectTypeRole('Subtitle', 'labelMedium')
    })

    it.each([
      ['medium', 136, 'labelLarge'],
      ['large', 184, 'titleMedium'],
    ] as const)(
      'grows a %s bar to %ddp and sets the subtitle in %s',
      (variant, height, role) => {
        const { toJSON } = renderWithTheme(
          <AppBar title="Title" subtitle="Subtitle" variant={variant} />,
        )
        const root = rootOf(toJSON())
        expect(heightsOf(root)).toContain(height)
        expect(textsBeside(root, 'Subtitle')).toEqual(['Title', 'Subtitle'])
        expectTypeRole('Subtitle', role)
      },
    )

    it('adds no line and no height for an empty subtitle', () => {
      const { toJSON } = renderWithTheme(
        <AppBar title="Title" subtitle="" variant="medium" />,
      )
      const root = rootOf(toJSON())
      expect(heightsOf(root)).toContain(112)
      expect(heightsOf(root)).not.toContain(136)
      expect(textsBeside(root, 'Title')).toEqual(['Title'])
    })

    it('rests a collapsible medium bar at the grown geometry', () => {
      const { toJSON } = renderWithTheme(
        <AppBar
          title="Title"
          subtitle="Subtitle"
          variant="medium"
          scrollOffset={scrollOffsetAt(0)}
        />,
      )
      const root = rootOf(toJSON())
      expect(heightsOf(root)).toContain(136)
      // 136 - 24 bottom padding - (32 title + 20 subtitle) = 60dp.
      expect(collapsingBlock(root)).toEqual({ top: 60, height: 52 })
      expect(textsBeside(root, 'Subtitle')).toEqual(['Title', 'Subtitle'])
      expectTypeRole('Subtitle', 'labelLarge')
    })

    it('collapses the subtitle to labelMedium with the title', () => {
      const { toJSON } = renderWithTheme(
        <AppBar
          title="Title"
          subtitle="Subtitle"
          variant="large"
          scrollOffset={scrollOffsetAt(500)}
        />,
      )
      const root = rootOf(toJSON())
      expect(heightsOf(root)).toContain(64)
      // The small bar's block: (64 - (28 title + 16 subtitle)) / 2 = 10dp.
      expect(collapsingBlock(root)).toEqual({ top: 10, height: 44 })
      expectTypeRole('Subtitle', 'labelMedium')
      expectTypeRole('Title', 'titleLarge')
    })

    it.each([
      ['small', undefined],
      ['medium', undefined],
      ['medium', scrollOffsetAt(0)],
    ] as const)('is not a header on a %s bar', (variant, scrollOffset) => {
      renderWithTheme(
        <AppBar
          title="Title"
          subtitle="Subtitle"
          variant={variant}
          scrollOffset={scrollOffset}
        />,
      )
      expect(screen.getAllByRole('header')).toHaveLength(1)
      expect(screen.getByRole('header', { name: 'Title' })).toBeTruthy()
    })

    it.each([
      ['small', undefined],
      ['medium', scrollOffsetAt(0)],
    ] as const)(
      'keeps its color under contentColor and takes subtitleStyle (%s)',
      (variant, scrollOffset) => {
        renderWithTheme(
          <AppBar
            title="Title"
            subtitle="Subtitle"
            variant={variant}
            scrollOffset={scrollOffset}
            contentColor="#00FF00"
            subtitleStyle={{ fontStyle: 'italic' }}
          />,
        )
        expect(textStyleOf('Title').color).toBe('#00FF00')
        expect(textStyleOf('Subtitle').color).toBe(colors.onSurfaceVariant)
        expect(textStyleOf('Subtitle').fontStyle).toBe('italic')
      },
    )

    it.each([
      ['primary', colors.onPrimary],
      ['primaryContainer', colors.onPrimaryContainer],
    ] as const)(
      'takes the content color on the %s scheme',
      (colorScheme, color) => {
        renderWithTheme(
          <AppBar
            title="Title"
            subtitle="Subtitle"
            colorScheme={colorScheme}
          />,
        )
        expect(textStyleOf('Subtitle').color).toBe(color)
      },
    )
  })

  describe('content color in the slots', () => {
    const { colors } = lightTheme

    function iconColor(name: string) {
      return screen.getByText(name, { includeHiddenElements: true }).props.color
    }

    function ColorProbe({ testID }: { testID: string }) {
      return <Text testID={testID}>{String(useAppBarContentColor())}</Text>
    }

    it('colors a Menu anchor in trailing on a primary bar', () => {
      renderWithTheme(
        <PortalHost>
          <AppBar
            title="Guess It"
            colorScheme="primary"
            trailing={
              <Menu
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    variant="standard"
                    accessibilityLabel="More options"
                  />
                }
              >
                <Menu.Item label="Developer" />
              </Menu>
            }
          />
        </PortalHost>,
      )
      expect(iconColor('dots-vertical')).toBe(colors.onPrimary)
    })

    it('colors a standard IconButton in leading', () => {
      renderWithTheme(
        <AppBar
          title="Inbox"
          colorScheme="primaryContainer"
          leading={
            <IconButton
              icon="menu"
              variant="standard"
              accessibilityLabel="Menu"
            />
          }
        />,
      )
      expect(iconColor('menu')).toBe(colors.onPrimaryContainer)
    })

    // Compose `AppBarTokens`: `LeadingIconColor` is `OnSurface` and
    // `TrailingIconColor` is `OnSurfaceVariant`.
    it('gives leading onSurface and trailing onSurfaceVariant on a surface bar', () => {
      renderWithTheme(
        <AppBar
          title="Inbox"
          leading={
            <IconButton
              icon="menu"
              variant="standard"
              accessibilityLabel="Menu"
            />
          }
          trailing={
            <IconButton
              icon="share"
              variant="standard"
              accessibilityLabel="Share"
            />
          }
        />,
      )
      expect(iconColor('menu')).toBe(colors.onSurface)
      expect(iconColor('share')).toBe(colors.onSurfaceVariant)
    })

    it('gives the built-in buttons the same two colors', () => {
      renderWithTheme(
        <AppBar
          title="About"
          canGoBack
          navigationIcon="close"
          actions={[{ icon: 'magnify', accessibilityLabel: 'Search' }]}
        />,
      )
      expect(iconColor('close')).toBe(colors.onSurface)
      expect(iconColor('magnify')).toBe(colors.onSurfaceVariant)
    })

    it('gives the bar contentColor to both slots', () => {
      renderWithTheme(
        <AppBar
          title="Inbox"
          contentColor="#00FF00"
          leading={
            <IconButton
              icon="menu"
              variant="standard"
              accessibilityLabel="Menu"
            />
          }
          trailing={
            <IconButton
              icon="share"
              variant="standard"
              accessibilityLabel="Share"
            />
          }
        />,
      )
      expect(iconColor('menu')).toBe('#00FF00')
      expect(iconColor('share')).toBe('#00FF00')
    })

    it('still colors the built-in navigation button and actions', () => {
      renderWithTheme(
        <AppBar
          title="About"
          colorScheme="primary"
          canGoBack
          navigationIcon="close"
          actions={[{ icon: 'magnify', accessibilityLabel: 'Search' }]}
        />,
      )
      expect(iconColor('close')).toBe(colors.onPrimary)
      expect(iconColor('magnify')).toBe(colors.onPrimary)
    })

    it('keeps a color that the button sets itself', () => {
      renderWithTheme(
        <AppBar
          title="Inbox"
          colorScheme="primary"
          trailing={
            <>
              <IconButton
                icon="share"
                variant="standard"
                iconColor="#FF0000"
                accessibilityLabel="Share"
              />
              <IconButton
                icon="star"
                variant="standard"
                contentColor="#0000FF"
                accessibilityLabel="Star"
              />
              <IconButton
                icon="pencil"
                variant="tonal"
                accessibilityLabel="Edit"
              />
            </>
          }
        />,
      )
      expect(iconColor('share')).toBe('#FF0000')
      expect(iconColor('star')).toBe('#0000FF')
      expect(iconColor('pencil')).toBe(colors.onSecondaryContainer)
    })

    it('keeps primary on a selected toggle', () => {
      renderWithTheme(
        <AppBar
          title="Film"
          colorScheme="primaryContainer"
          trailing={
            <>
              <IconButton
                icon="heart"
                variant="standard"
                selected
                accessibilityLabel="Liked"
              />
              <IconButton
                icon="bookmark"
                variant="standard"
                selected={false}
                accessibilityLabel="Save"
              />
            </>
          }
        />,
      )
      expect(iconColor('heart')).toBe(colors.primary)
      expect(iconColor('bookmark')).toBe(colors.onPrimaryContainer)
    })

    it('keeps the disabled treatment', () => {
      renderWithTheme(
        <AppBar
          title="Inbox"
          colorScheme="primary"
          trailing={
            <IconButton
              icon="share"
              variant="standard"
              disabled
              accessibilityLabel="Share"
            />
          }
        />,
      )
      expect(iconColor('share')).toBe(
        alphaColor(colors.onSurface, lightTheme.stateLayer.disabledOpacity),
      )
    })

    it('does not reach content that a Portal renders', () => {
      renderWithTheme(
        <PortalHost>
          <AppBar
            title="Inbox"
            colorScheme="primary"
            trailing={
              <Portal>
                <IconButton
                  icon="share"
                  variant="standard"
                  accessibilityLabel="Share"
                />
              </Portal>
            }
          />
        </PortalHost>,
      )
      expect(iconColor('share')).toBe(colors.onSurfaceVariant)
    })

    it('does not reach an IconButton outside the bar', () => {
      renderWithTheme(
        <>
          <AppBar title="Inbox" colorScheme="primary" />
          <IconButton
            icon="share"
            variant="standard"
            accessibilityLabel="Share"
          />
        </>,
      )
      expect(iconColor('share')).toBe(colors.onSurfaceVariant)
    })

    it('returns the slot color from useAppBarContentColor', () => {
      renderWithTheme(
        <>
          <AppBar
            title="Inbox"
            leading={<ColorProbe testID="leading" />}
            trailing={<ColorProbe testID="trailing" />}
          />
          <ColorProbe testID="outside" />
        </>,
      )
      expect(screen.getByTestId('leading')).toHaveTextContent(colors.onSurface)
      expect(screen.getByTestId('trailing')).toHaveTextContent(
        colors.onSurfaceVariant,
      )
      expect(screen.getByTestId('outside')).toHaveTextContent('undefined')
    })
  })

  describe('overrides', () => {
    it('applies containerColor to the root background', () => {
      const { toJSON } = renderWithTheme(
        <AppBar title="Custom" containerColor="#FF0000" />,
      )
      const root = rootOf(toJSON())
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
      const root = rootOf(toJSON())
      const flatStyle = StyleSheet.flatten(root.props.style)
      expect(flatStyle.margin).toBe(10)
    })
  })
})
