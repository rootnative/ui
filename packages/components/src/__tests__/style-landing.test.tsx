/**
 * Where a consumer `style` lands is public behavior: the stability page
 * states the rule, and these tests hold each component to it.
 *
 * - In flow: the outer node, which the parent lays out.
 * - A component that wraps its pressable: the layout keys on the outer node,
 *   every other key on the pressable.
 * - An overlay: the surface, because the component positions it and no
 *   parent lays it out.
 *
 * `marginTop` is the layout probe and `borderStyle` is the paint probe. No
 * component sets either value by itself.
 */
import { renderWithTheme } from '@rootnative/utils/test'
import { screen } from '@testing-library/react-native'
import type { ReactElement } from 'react'
import { StyleSheet, Text } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import { AppBar } from '../appbar'
import { Avatar } from '../avatar'
import { Badge } from '../badge'
import { BottomAppBar } from '../bottom-app-bar'
import { BottomSheet } from '../bottom-sheet'
import { Button } from '../button'
import { ButtonGroup } from '../button-group'
import { Card, CardActions, CardContent } from '../card'
import { Carousel } from '../carousel'
import { Checkbox } from '../checkbox'
import { Chip } from '../chip'
import { Dialog } from '../dialog'
import { Divider } from '../divider'
import { FAB } from '../fab'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { KeyboardAvoidingWrapper } from '../keyboard-avoiding-wrapper'
import { Box, Column, Container, Grid, Layout, Row } from '../layout'
import { List, ListDivider, ListHeadline, ListItem } from '../list'
import { LoadingIndicator } from '../loading-indicator'
import { Menu } from '../menu'
import { NavigationBar } from '../navigation-bar'
import { NavigationDrawer } from '../navigation-drawer'
import { NavigationRail } from '../navigation-rail'
import { PortalHost } from '../portal'
import { CircularProgress, LinearProgress } from '../progress'
import { Radio } from '../radio'
import { SearchBar } from '../search-bar'
import { SearchView } from '../search-view'
import { SideSheet } from '../side-sheet'
import { Skeleton } from '../skeleton'
import { Slider } from '../slider'
import { Switch } from '../switch'
import { Tabs } from '../tabs'
import { TextField } from '../text-field'
import { Typography } from '../typography'

type Style = StyleProp<ViewStyle>
interface Case {
  name: string
  render: (style: Style) => ReactElement
}

const PROBE = { marginTop: 13, borderStyle: 'dashed' } as const

const ITEMS = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
]
const NAV_ITEMS = [
  { value: 'a', label: 'A', icon: 'home-outline' },
  { value: 'b', label: 'B', icon: 'magnify' },
]
const noop = () => {}

function flat(style: unknown): ViewStyle {
  return (StyleSheet.flatten(style as Style) ?? {}) as ViewStyle
}

/** True when a node below the root carries the paint probe. */
function paintIsBelowRoot(): boolean {
  return screen.UNSAFE_root.findAll(
    (node) =>
      typeof node.type === 'string' &&
      flat(node.props.style).borderStyle === PROBE.borderStyle,
  ).some((node) => node !== screen.root)
}

const IN_FLOW: Case[] = [
  {
    name: 'Typography',
    render: (s) => <Typography style={s}>Text</Typography>,
  },
  { name: 'Layout', render: (s) => <Layout style={s} /> },
  { name: 'Box', render: (s) => <Box style={s} /> },
  { name: 'Row', render: (s) => <Row style={s} /> },
  { name: 'Column', render: (s) => <Column style={s} /> },
  { name: 'Container', render: (s) => <Container style={s} /> },
  { name: 'Grid', render: (s) => <Grid columns={2} style={s} /> },
  {
    name: 'ButtonGroup',
    render: (s) => <ButtonGroup items={ITEMS} style={s} />,
  },
  { name: 'Icon', render: (s) => <Icon source="plus" style={s} /> },
  { name: 'AppBar', render: (s) => <AppBar title="Home" style={s} /> },
  {
    name: 'BottomAppBar',
    render: (s) => (
      <BottomAppBar
        actions={[{ icon: 'magnify', accessibilityLabel: 'Go' }]}
        style={s}
      />
    ),
  },
  {
    name: 'Card',
    render: (s) => (
      <Card style={s}>
        <Text>Body</Text>
      </Card>
    ),
  },
  {
    name: 'CardContent',
    render: (s) => (
      <CardContent style={s}>
        <Text>Body</Text>
      </CardContent>
    ),
  },
  {
    name: 'CardActions',
    render: (s) => (
      <CardActions style={s}>
        <Text>Body</Text>
      </CardActions>
    ),
  },
  {
    name: 'Checkbox',
    render: (s) => <Checkbox value={false} onValueChange={noop} style={s} />,
  },
  {
    name: 'Radio',
    render: (s) => <Radio value={false} onValueChange={noop} style={s} />,
  },
  { name: 'TextField', render: (s) => <TextField label="Email" style={s} /> },
  {
    name: 'TextField outlined',
    render: (s) => <TextField label="Email" variant="outlined" style={s} />,
  },
  {
    name: 'SearchBar',
    render: (s) => <SearchBar placeholder="Search" style={s} />,
  },
  { name: 'Divider', render: (s) => <Divider style={s} /> },
  { name: 'Tabs', render: (s) => <Tabs items={ITEMS} style={s} /> },
  {
    name: 'Carousel',
    render: (s) => (
      <Carousel items={['a', 'b']} renderItem={() => null} style={s} />
    ),
  },
  {
    name: 'NavigationBar',
    render: (s) => <NavigationBar items={NAV_ITEMS} style={s} />,
  },
  {
    name: 'NavigationRail',
    render: (s) => <NavigationRail items={NAV_ITEMS} style={s} />,
  },
  {
    name: 'NavigationDrawer standard',
    render: (s) => (
      <NavigationDrawer variant="standard" defaultValue="a" style={s}>
        <NavigationDrawer.Item value="a" label="Inbox" icon="inbox" />
      </NavigationDrawer>
    ),
  },
  {
    name: 'SideSheet standard',
    render: (s) => (
      <SideSheet variant="standard" headline="Filters" style={s}>
        <Text>Body</Text>
      </SideSheet>
    ),
  },
  {
    name: 'List',
    render: (s) => (
      <List style={s}>
        <ListItem headlineText="Row" />
      </List>
    ),
  },
  {
    name: 'ListItem',
    render: (s) => <ListItem headlineText="Row" style={s} />,
  },
  {
    name: 'ListItem with onPress',
    render: (s) => <ListItem headlineText="Row" onPress={noop} style={s} />,
  },
  {
    name: 'ListHeadline',
    render: (s) => <ListHeadline style={s}>Head</ListHeadline>,
  },
  { name: 'ListDivider', render: (s) => <ListDivider style={s} /> },
  {
    name: 'KeyboardAvoidingWrapper',
    render: (s) => (
      <KeyboardAvoidingWrapper style={s}>
        <Text>Body</Text>
      </KeyboardAvoidingWrapper>
    ),
  },
  { name: 'Avatar', render: (s) => <Avatar label="john" style={s} /> },
  { name: 'Badge', render: (s) => <Badge label={3} style={s} /> },
  { name: 'Slider', render: (s) => <Slider defaultValue={0.5} style={s} /> },
  {
    name: 'LinearProgress',
    render: (s) => <LinearProgress progress={0.5} style={s} />,
  },
  {
    name: 'CircularProgress',
    render: (s) => <CircularProgress progress={0.5} style={s} />,
  },
  {
    name: 'LoadingIndicator',
    render: (s) => <LoadingIndicator accessibilityLabel="Loading" style={s} />,
  },
  { name: 'Skeleton', render: (s) => <Skeleton style={s} /> },
]

const WRAPPED_PRESSABLE: Case[] = [
  { name: 'Button', render: (s) => <Button style={s}>OK</Button> },
  {
    name: 'IconButton',
    render: (s) => (
      <IconButton icon="plus" accessibilityLabel="Add" style={s} />
    ),
  },
  { name: 'FAB', render: (s) => <FAB icon="plus" label="Compose" style={s} /> },
  { name: 'Chip', render: (s) => <Chip style={s}>Tag</Chip> },
  {
    name: 'Chip with onPress',
    render: (s) => (
      <Chip onPress={noop} style={s}>
        Tag
      </Chip>
    ),
  },
  {
    name: 'Card with onPress',
    render: (s) => (
      <Card onPress={noop} style={s}>
        <Text>Body</Text>
      </Card>
    ),
  },
  {
    name: 'Switch',
    render: (s) => <Switch value={false} onValueChange={noop} style={s} />,
  },
]

const OVERLAY: Case[] = [
  {
    name: 'Dialog',
    render: (s) => (
      <Dialog visible onDismiss={noop} style={s} testID="surface">
        <Dialog.Title>Title</Dialog.Title>
      </Dialog>
    ),
  },
  {
    name: 'Menu',
    render: (s) => (
      <Menu visible anchor={null} onDismiss={noop} style={s} testID="surface">
        <Menu.Item label="Edit" />
      </Menu>
    ),
  },
  {
    name: 'BottomSheet',
    render: (s) => (
      <BottomSheet visible onDismiss={noop} style={s} testID="surface">
        <Text>Body</Text>
      </BottomSheet>
    ),
  },
  {
    name: 'BottomSheet standard',
    render: (s) => (
      <BottomSheet
        variant="standard"
        visible
        onDismiss={noop}
        style={s}
        testID="surface"
      >
        <Text>Body</Text>
      </BottomSheet>
    ),
  },
  {
    name: 'SideSheet modal',
    render: (s) => (
      <SideSheet
        visible
        onDismiss={noop}
        headline="Filters"
        style={s}
        testID="surface"
      >
        <Text>Body</Text>
      </SideSheet>
    ),
  },
  {
    name: 'NavigationDrawer modal',
    render: (s) => (
      <NavigationDrawer
        visible
        onDismiss={noop}
        defaultValue="a"
        style={s}
        testID="surface"
      >
        <NavigationDrawer.Item value="a" label="Inbox" icon="inbox" />
      </NavigationDrawer>
    ),
  },
  {
    name: 'SearchView',
    render: (s) => (
      <SearchView
        visible
        onDismiss={noop}
        placeholder="Search"
        style={s}
        testID="surface"
      />
    ),
  },
]

describe('where style lands', () => {
  it.each(IN_FLOW)(
    '$name: the whole style is on the outer node',
    ({ render }) => {
      renderWithTheme(render(PROBE))
      expect(flat(screen.root.props.style)).toMatchObject(PROBE)
    },
  )

  it.each(WRAPPED_PRESSABLE)(
    '$name: the layout keys are on the outer node, the others below it',
    ({ render }) => {
      renderWithTheme(render(PROBE))
      const outer = flat(screen.root.props.style)
      expect(outer.marginTop).toBe(PROBE.marginTop)
      expect(outer.borderStyle).not.toBe(PROBE.borderStyle)
      expect(paintIsBelowRoot()).toBe(true)
    },
  )

  it.each(OVERLAY)('$name: the whole style is on the surface', ({ render }) => {
    renderWithTheme(<PortalHost>{render(PROBE)}</PortalHost>)
    const surface = screen.getByTestId('surface')
    expect(flat(surface.props.style)).toMatchObject(PROBE)
    expect(surface).not.toBe(screen.root)
  })
})
