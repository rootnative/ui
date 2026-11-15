import { defineTheme, lightTheme } from '@rootnative/core'
import type { Theme } from '@rootnative/core'
import { renderWithTheme } from '@rootnative/utils/test'
import type { ReactElement } from 'react'
import { Text } from 'react-native'
import { AppBar } from '../appbar'
import { Avatar } from '../avatar'
import { Badge } from '../badge'
import { BottomAppBar } from '../bottom-app-bar'
import { BottomSheet } from '../bottom-sheet'
import { Button } from '../button'
import { ButtonGroup } from '../button-group'
import { Card } from '../card'
import { Carousel } from '../carousel'
import { Checkbox } from '../checkbox'
import { Chip } from '../chip'
import { Dialog } from '../dialog'
import { Divider } from '../divider'
import { FAB } from '../fab'
import { Icon } from '../icon'
import { IconButton } from '../icon-button'
import { __resetWarnOnceForTests } from '../internal/warnOnce'
import { Layout } from '../layout'
import { List, ListItem } from '../list'
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
import { Tooltip } from '../tooltip'
import { Typography } from '../typography'

/**
 * A theme with its own role names is valid for `ThemeProvider`, and it is for
 * the app's own components. A library component that gets it must say so, and
 * must not throw a `TypeError` that doesn't name the theme. The cast is the
 * point: `useTheme()` returns the MD3 type for any theme at runtime.
 */
const { shape, spacing, stateLayer, elevation, motion } = lightTheme

const bareTheme = defineTheme({
  colors: { background: '#FFFFFF', text: '#1A1A1A', accent: '#FF6B00' },
  typography: {
    body: {
      fontFamily: 'Inter',
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      letterSpacing: 0,
    },
  },
  shape,
  spacing,
  stateLayer,
  elevation,
  motion,
}) as unknown as Theme

const ITEMS = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
]
const NAV_ITEMS = [
  { value: 'a', label: 'A', icon: 'home-outline' },
  { value: 'b', label: 'B', icon: 'magnify' },
]
const noop = () => {}

const CASES: { name: string; ui: ReactElement }[] = [
  { name: 'Typography', ui: <Typography>Text</Typography> },
  { name: 'Layout', ui: <Layout /> },
  { name: 'Button', ui: <Button>OK</Button> },
  { name: 'ButtonGroup', ui: <ButtonGroup items={ITEMS} /> },
  {
    name: 'IconButton',
    ui: <IconButton icon="plus" accessibilityLabel="Add" />,
  },
  { name: 'Icon', ui: <Icon source="plus" /> },
  { name: 'AppBar', ui: <AppBar title="Home" /> },
  {
    name: 'AppBar large',
    ui: <AppBar title="Home" variant="large" subtitle="Sub" />,
  },
  {
    name: 'BottomAppBar',
    ui: (
      <BottomAppBar actions={[{ icon: 'magnify', accessibilityLabel: 'Go' }]} />
    ),
  },
  {
    name: 'Card',
    ui: (
      <Card>
        <Text>Body</Text>
      </Card>
    ),
  },
  { name: 'Chip', ui: <Chip>Tag</Chip> },
  { name: 'Checkbox', ui: <Checkbox value={false} onValueChange={noop} /> },
  { name: 'Radio', ui: <Radio value={false} onValueChange={noop} /> },
  { name: 'Switch', ui: <Switch value={false} onValueChange={noop} /> },
  { name: 'TextField', ui: <TextField label="Email" supportingText="Help" /> },
  { name: 'SearchBar', ui: <SearchBar placeholder="Search" /> },
  {
    name: 'SearchView',
    ui: <SearchView visible onDismiss={noop} placeholder="Search" />,
  },
  {
    name: 'Dialog',
    ui: (
      <Dialog visible onDismiss={noop}>
        <Dialog.Title>Title</Dialog.Title>
        <Dialog.Content>Body</Dialog.Content>
      </Dialog>
    ),
  },
  {
    name: 'BottomSheet',
    ui: (
      <BottomSheet visible onDismiss={noop}>
        <Text>Body</Text>
      </BottomSheet>
    ),
  },
  {
    name: 'SideSheet',
    ui: (
      <SideSheet visible onDismiss={noop} headline="Filters">
        <Text>Body</Text>
      </SideSheet>
    ),
  },
  { name: 'Divider', ui: <Divider /> },
  {
    name: 'Menu',
    ui: (
      <Menu visible anchor={null} onDismiss={noop}>
        <Menu.Item label="Edit" />
      </Menu>
    ),
  },
  {
    name: 'Menu vertical',
    ui: (
      <Menu visible anchor={null} onDismiss={noop} variant="vertical">
        <Menu.Group label="Sort by">
          <Menu.Item label="Name" />
        </Menu.Group>
      </Menu>
    ),
  },
  {
    name: 'Tooltip',
    ui: <Tooltip anchor={<Text>Info</Text>}>Save changes</Tooltip>,
  },
  { name: 'Tabs', ui: <Tabs items={ITEMS} /> },
  {
    name: 'Carousel',
    ui: <Carousel items={['a', 'b']} renderItem={() => null} />,
  },
  { name: 'NavigationBar', ui: <NavigationBar items={NAV_ITEMS} /> },
  { name: 'NavigationRail', ui: <NavigationRail items={NAV_ITEMS} /> },
  {
    name: 'NavigationDrawer',
    ui: (
      <NavigationDrawer visible onDismiss={noop} defaultValue="a">
        <NavigationDrawer.Item value="a" label="Inbox" icon="inbox" />
      </NavigationDrawer>
    ),
  },
  {
    name: 'List',
    ui: (
      <List>
        <ListItem headlineText="Row" supportingText="More" />
      </List>
    ),
  },
  { name: 'Avatar', ui: <Avatar label="john" /> },
  { name: 'Badge', ui: <Badge label={3} /> },
  { name: 'Slider', ui: <Slider defaultValue={0.5} /> },
  { name: 'LinearProgress', ui: <LinearProgress progress={0.5} /> },
  { name: 'CircularProgress', ui: <CircularProgress progress={0.5} /> },
  {
    name: 'LoadingIndicator',
    ui: <LoadingIndicator accessibilityLabel="Loading" />,
  },
  { name: 'Skeleton', ui: <Skeleton /> },
  { name: 'FAB', ui: <FAB icon="plus" label="Compose" /> },
]

describe('a theme with no MD3 roles', () => {
  let errorSpy: jest.SpyInstance

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    errorSpy.mockRestore()
  })

  it.each(CASES)('$name renders and does not throw', ({ ui }) => {
    expect(() =>
      renderWithTheme(<PortalHost>{ui}</PortalHost>, { theme: bareTheme }),
    ).not.toThrow()
  })

  it('names the missing role and the cause, one time', () => {
    __resetWarnOnceForTests()
    renderWithTheme(<Button>OK</Button>, { theme: bareTheme })
    renderWithTheme(<Chip>Tag</Chip>, { theme: bareTheme })

    const warnings = errorSpy.mock.calls
      .map(([message]) => String(message))
      .filter((message) => message.includes('MD3 typography role'))
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('"labelLarge"')
    expect(warnings[0]).toContain('theming#custom-design-systems')
  })

  it('stays quiet with the MD3 theme', () => {
    __resetWarnOnceForTests()
    renderWithTheme(<Button>OK</Button>)
    expect(errorSpy).not.toHaveBeenCalled()
  })
})
