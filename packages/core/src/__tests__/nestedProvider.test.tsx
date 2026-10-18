import { MotionConfig, useMotionConfig } from '@rootnative/inertia'
import type { TransitionConfig } from '@rootnative/inertia'
import { act, render, screen, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Text, useColorScheme } from 'react-native'
import {
  ThemeProvider,
  useIconResolver,
  useTheme,
  useThemeMode,
} from '../index'
import type { IconResolver, ThemeMode, ThemeModeStorage } from '../index'
import { createMaterialTheme } from '../theme/createMaterialTheme'
import { darkTheme } from '../theme/dark'
import { lightTheme } from '../theme/light'

jest.mock('react-native/Libraries/Utilities/useColorScheme')

const mockedUseColorScheme = useColorScheme as jest.MockedFunction<
  typeof useColorScheme
>

const rootPair = { light: lightTheme, dark: darkTheme }
const seeded = createMaterialTheme('#1E3A8A')
const nestedPair = { light: seeded.lightTheme, dark: seeded.darkTheme }

const resolver: IconResolver = (name) => <Text>{name}</Text>

function Probe({ id }: { id: string }) {
  const { mode, scheme, isReady } = useThemeMode()
  const theme = useTheme()
  const iconResolver = useIconResolver()

  return (
    <>
      <Text testID={`${id}-mode`}>{mode}</Text>
      <Text testID={`${id}-scheme`}>{scheme}</Text>
      <Text testID={`${id}-ready`}>{String(isReady)}</Text>
      <Text testID={`${id}-primary`}>{theme.colors.primary}</Text>
      <Text testID={`${id}-icons`}>{String(iconResolver !== null)}</Text>
    </>
  )
}

function SetDark({ id }: { id: string }) {
  const { setMode } = useThemeMode()
  return (
    <Text testID={`${id}-set-dark`} onPress={() => setMode('dark')}>
      dark
    </Text>
  )
}

function text(testID: string) {
  return screen.getByTestId(testID).props.children
}

beforeEach(() => {
  mockedUseColorScheme.mockReturnValue('light')
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('the mode of a nested provider', () => {
  it('follows the controlled mode of the parent, not the OS', () => {
    render(
      <ThemeProvider theme={rootPair} mode="dark">
        <ThemeProvider theme={nestedPair}>
          <Probe id="nested" />
        </ThemeProvider>
      </ThemeProvider>,
    )

    expect(text('nested-mode')).toBe('dark')
    expect(text('nested-scheme')).toBe('dark')
    expect(text('nested-primary')).toBe(seeded.darkTheme.colors.primary)
  })

  it('follows the uncontrolled mode of the parent as it changes', () => {
    render(
      <ThemeProvider theme={rootPair}>
        <SetDark id="root" />
        <ThemeProvider theme={nestedPair}>
          <Probe id="nested" />
        </ThemeProvider>
      </ThemeProvider>,
    )

    expect(text('nested-scheme')).toBe('light')

    act(() => {
      screen.getByTestId('root-set-dark').props.onPress()
    })

    expect(text('nested-scheme')).toBe('dark')
    expect(text('nested-primary')).toBe(seeded.darkTheme.colors.primary)
  })

  it('sets the mode of the parent from below the nested provider', () => {
    render(
      <ThemeProvider theme={rootPair}>
        <Probe id="root" />
        <ThemeProvider theme={nestedPair}>
          <SetDark id="nested" />
        </ThemeProvider>
      </ThemeProvider>,
    )

    act(() => {
      screen.getByTestId('nested-set-dark').props.onPress()
    })

    expect(text('root-mode')).toBe('dark')
    expect(text('root-primary')).toBe(darkTheme.colors.primary)
  })

  it('reports the request to its own onModeChange and to the parent', () => {
    const onRootChange = jest.fn()
    const onNestedChange = jest.fn()

    render(
      <ThemeProvider theme={rootPair} mode="light" onModeChange={onRootChange}>
        <ThemeProvider theme={nestedPair} onModeChange={onNestedChange}>
          <SetDark id="nested" />
        </ThemeProvider>
      </ThemeProvider>,
    )

    act(() => {
      screen.getByTestId('nested-set-dark').props.onPress()
    })

    expect(onRootChange).toHaveBeenCalledWith('dark')
    expect(onNestedChange).toHaveBeenCalledWith('dark')
  })

  it('waits for the stored mode of the parent', async () => {
    let resolveRead: (value: string | null) => void = () => {}
    const storage: ThemeModeStorage = {
      getItem: () =>
        new Promise<string | null>((resolve) => {
          resolveRead = resolve
        }),
      setItem: () => {},
    }

    render(
      <ThemeProvider theme={rootPair} storage={storage}>
        <ThemeProvider theme={nestedPair}>
          <Probe id="nested" />
        </ThemeProvider>
      </ThemeProvider>,
    )

    expect(text('nested-ready')).toBe('false')

    await act(async () => {
      resolveRead('dark')
    })

    await waitFor(() => {
      expect(text('nested-ready')).toBe('true')
    })
    expect(text('nested-scheme')).toBe('dark')
  })

  it.each<[string, Record<string, unknown>]>([
    ['mode', { mode: 'light' as ThemeMode }],
    ['defaultMode', { defaultMode: 'light' as ThemeMode }],
    ['storage', { storage: { getItem: () => null, setItem: () => {} } }],
  ])('has a mode of its own when it gets %s', async (_, ownModeProps) => {
    render(
      <ThemeProvider theme={rootPair} mode="dark">
        <ThemeProvider theme={nestedPair} {...ownModeProps}>
          <Probe id="nested" />
        </ThemeProvider>
      </ThemeProvider>,
    )

    await waitFor(() => {
      expect(text('nested-ready')).toBe('true')
    })
    expect(text('nested-scheme')).toBe('light')
  })

  it('does not move the parent when it has a mode of its own', () => {
    render(
      <ThemeProvider theme={rootPair}>
        <Probe id="root" />
        <ThemeProvider theme={nestedPair} defaultMode="light">
          <Probe id="nested" />
          <SetDark id="nested" />
        </ThemeProvider>
      </ThemeProvider>,
    )

    act(() => {
      screen.getByTestId('nested-set-dark').props.onPress()
    })

    expect(text('nested-mode')).toBe('dark')
    expect(text('root-mode')).toBe('system')
  })

  it('follows the OS under a parent with a single theme', () => {
    mockedUseColorScheme.mockReturnValue('dark')

    render(
      <ThemeProvider theme={lightTheme}>
        <ThemeProvider theme={nestedPair}>
          <Probe id="nested" />
        </ThemeProvider>
      </ThemeProvider>,
    )

    expect(text('nested-mode')).toBe('system')
    expect(text('nested-scheme')).toBe('dark')
  })
})

describe('the icon resolver of a nested provider', () => {
  it('is the resolver of the parent when it gets none', () => {
    render(
      <ThemeProvider theme={rootPair} iconResolver={resolver}>
        <ThemeProvider theme={nestedPair}>
          <Probe id="nested" />
        </ThemeProvider>
      </ThemeProvider>,
    )

    expect(text('nested-icons')).toBe('true')
  })

  it('is its own resolver when it gets one', () => {
    const nestedResolver: IconResolver = () => null
    let seen: IconResolver | null = null

    function ResolverProbe() {
      seen = useIconResolver()
      return null
    }

    render(
      <ThemeProvider theme={rootPair} iconResolver={resolver}>
        <ThemeProvider theme={nestedPair} iconResolver={nestedResolver}>
          <ResolverProbe />
        </ThemeProvider>
      </ThemeProvider>,
    )

    expect(seen).toBe(nestedResolver)
  })

  it('is null with no resolver above', () => {
    render(
      <ThemeProvider theme={rootPair}>
        <ThemeProvider theme={nestedPair}>
          <Probe id="nested" />
        </ThemeProvider>
      </ThemeProvider>,
    )

    expect(text('nested-icons')).toBe('false')
  })
})

describe('the motion of a nested provider', () => {
  it('keeps a named transition that the app adds above it', () => {
    let names: string[] = []

    function MotionProbe() {
      names = Object.keys(useMotionConfig().transitions)
      return null
    }

    // An app registers its own names through `RegisteredTransitions`. This
    // test registers none, so it widens the type for its one name.
    const appTransitions: Record<string, TransitionConfig> = {
      press: { type: 'timing', duration: 90 },
    }

    render(
      <ThemeProvider theme={rootPair}>
        <MotionConfig transitions={appTransitions}>
          <ThemeProvider theme={nestedPair}>
            <MotionProbe />
          </ThemeProvider>
        </MotionConfig>
      </ThemeProvider>,
    )

    expect(names).toContain('press')
  })
})
