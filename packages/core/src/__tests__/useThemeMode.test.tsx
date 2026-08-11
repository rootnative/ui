import { act, render, screen, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Text, useColorScheme } from 'react-native'
import {
  THEME_MODE_STORAGE_KEY,
  ThemeProvider,
  useTheme,
  useThemeMode,
} from '../index'
import type { ThemeMode, ThemeModeStorage } from '../index'
import { darkTheme } from '../theme/dark'
import { lightTheme } from '../theme/light'

jest.mock('react-native/Libraries/Utilities/useColorScheme')

const mockedUseColorScheme = useColorScheme as jest.MockedFunction<
  typeof useColorScheme
>

const pair = { light: lightTheme, dark: darkTheme }

/** Prints the resolved scheme, the requested mode, and readiness. */
function Probe() {
  const { mode, scheme, isReady } = useThemeMode()
  const theme = useTheme()

  return (
    <>
      <Text testID="mode">{mode}</Text>
      <Text testID="scheme">{scheme}</Text>
      <Text testID="ready">{String(isReady)}</Text>
      <Text testID="surface">{theme.colors.surface}</Text>
    </>
  )
}

function Toggle() {
  const { scheme, setMode } = useThemeMode()

  return (
    <Text
      testID="toggle"
      onPress={() => setMode(scheme === 'dark' ? 'light' : 'dark')}
    >
      toggle
    </Text>
  )
}

/** In-memory storage that records writes, for the persistence tests. */
function createStorage(initial?: string): ThemeModeStorage & {
  writes: Array<[string, string]>
} {
  let value = initial ?? null

  return {
    writes: [],
    getItem: async (key: string) => {
      expect(key).toBe(THEME_MODE_STORAGE_KEY)
      return value
    },
    setItem(key: string, next: string) {
      this.writes.push([key, next])
      value = next
      return Promise.resolve()
    },
  }
}

beforeEach(() => {
  mockedUseColorScheme.mockReturnValue('light')
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('mode resolution', () => {
  it("follows the OS when mode is 'system'", () => {
    mockedUseColorScheme.mockReturnValue('dark')

    render(
      <ThemeProvider theme={pair}>
        <Probe />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('mode')).toHaveTextContent('system')
    expect(screen.getByTestId('scheme')).toHaveTextContent('dark')
    expect(screen.getByTestId('surface')).toHaveTextContent(
      darkTheme.colors.surface,
    )
  })

  it('keeps following the OS as it changes', () => {
    const { rerender } = render(
      <ThemeProvider theme={pair}>
        <Probe />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('scheme')).toHaveTextContent('light')

    mockedUseColorScheme.mockReturnValue('dark')
    rerender(
      <ThemeProvider theme={pair}>
        <Probe />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('scheme')).toHaveTextContent('dark')
  })

  it('pins the scheme when mode is explicit, ignoring the OS', () => {
    mockedUseColorScheme.mockReturnValue('dark')

    render(
      <ThemeProvider theme={pair} defaultMode="light">
        <Probe />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('scheme')).toHaveTextContent('light')
    expect(screen.getByTestId('surface')).toHaveTextContent(
      lightTheme.colors.surface,
    )
  })

  it('treats a null OS scheme as light', () => {
    mockedUseColorScheme.mockReturnValue(null)

    render(
      <ThemeProvider theme={pair}>
        <Probe />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('scheme')).toHaveTextContent('light')
  })
})

describe('setMode', () => {
  it('switches the resolved theme', () => {
    render(
      <ThemeProvider theme={pair}>
        <Probe />
        <Toggle />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('surface')).toHaveTextContent(
      lightTheme.colors.surface,
    )

    act(() => {
      screen.getByTestId('toggle').props.onPress()
    })

    expect(screen.getByTestId('mode')).toHaveTextContent('dark')
    expect(screen.getByTestId('surface')).toHaveTextContent(
      darkTheme.colors.surface,
    )
  })

  it('does not move an externally controlled mode, but reports the request', () => {
    const onModeChange = jest.fn()

    render(
      <ThemeProvider theme={pair} mode="light" onModeChange={onModeChange}>
        <Probe />
        <Toggle />
      </ThemeProvider>,
    )

    act(() => {
      screen.getByTestId('toggle').props.onPress()
    })

    expect(onModeChange).toHaveBeenCalledWith('dark')
    // Controlled: the provider must not self-update.
    expect(screen.getByTestId('mode')).toHaveTextContent('light')
  })

  it('does not persist behind a controlled mode', async () => {
    const storage = createStorage()

    render(
      <ThemeProvider theme={pair} mode="light" storage={storage}>
        <Probe />
        <Toggle />
      </ThemeProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('ready')).toHaveTextContent('true')
    })

    act(() => {
      screen.getByTestId('toggle').props.onPress()
    })

    // The app's own state is the source of truth; writing behind it would
    // resurrect a stale mode on next launch.
    expect(storage.writes).toEqual([])
  })

  it('leaves the shadow state untouched while controlled', () => {
    const onModeChange = jest.fn()
    const { rerender } = render(
      <ThemeProvider theme={pair} mode="light" onModeChange={onModeChange}>
        <Probe />
        <Toggle />
      </ThemeProvider>,
    )

    act(() => {
      screen.getByTestId('toggle').props.onPress()
    })

    // Dropping to uncontrolled must fall back to `defaultMode`, not to a
    // value the provider quietly accumulated while controlled.
    rerender(
      <ThemeProvider theme={pair} onModeChange={onModeChange}>
        <Probe />
        <Toggle />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('mode')).toHaveTextContent('system')
  })
})

describe('persistence', () => {
  it('restores a persisted mode on mount', async () => {
    const storage = createStorage('dark')

    render(
      <ThemeProvider theme={pair} storage={storage}>
        <Probe />
      </ThemeProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('mode')).toHaveTextContent('dark')
    })
    expect(screen.getByTestId('surface')).toHaveTextContent(
      darkTheme.colors.surface,
    )
  })

  it('writes the mode on change', async () => {
    const storage = createStorage()

    render(
      <ThemeProvider theme={pair} storage={storage}>
        <Probe />
        <Toggle />
      </ThemeProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('ready')).toHaveTextContent('true')
    })

    act(() => {
      screen.getByTestId('toggle').props.onPress()
    })

    expect(storage.writes).toEqual([[THEME_MODE_STORAGE_KEY, 'dark']])
  })

  it('reports isReady only after the read resolves', async () => {
    const storage = createStorage('dark')

    render(
      <ThemeProvider theme={pair} storage={storage}>
        <Probe />
      </ThemeProvider>,
    )

    // The async getItem has not resolved yet on first paint.
    expect(screen.getByTestId('ready')).toHaveTextContent('false')

    await waitFor(() => {
      expect(screen.getByTestId('ready')).toHaveTextContent('true')
    })
  })

  it('is ready immediately when no storage is configured', () => {
    render(
      <ThemeProvider theme={pair}>
        <Probe />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('ready')).toHaveTextContent('true')
  })

  it('ignores a garbage persisted value', async () => {
    const storage = createStorage('not-a-mode')

    render(
      <ThemeProvider theme={pair} defaultMode="light">
        <Probe />
      </ThemeProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('ready')).toHaveTextContent('true')
    })
    expect(screen.getByTestId('mode')).toHaveTextContent('light')
    void storage
  })

  it('survives a storage that throws', async () => {
    const storage: ThemeModeStorage = {
      getItem: () => {
        throw new Error('storage unavailable')
      },
      setItem: () => {
        throw new Error('storage unavailable')
      },
    }

    render(
      <ThemeProvider theme={pair} storage={storage}>
        <Probe />
        <Toggle />
      </ThemeProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('ready')).toHaveTextContent('true')
    })

    // A failed write must not stop the in-memory switch.
    act(() => {
      screen.getByTestId('toggle').props.onPress()
    })

    expect(screen.getByTestId('mode')).toHaveTextContent('dark')
  })

  it('does not re-read when storage is an inline object literal', async () => {
    let reads = 0
    const inlineStorage = () => ({
      getItem: async () => {
        reads += 1
        return 'dark' as string | null
      },
      setItem: async () => {},
    })

    const { rerender } = render(
      <ThemeProvider theme={pair} storage={inlineStorage()}>
        <Probe />
      </ThemeProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('ready')).toHaveTextContent('true')
    })

    // A fresh literal each render must not restart the load and stomp state.
    rerender(
      <ThemeProvider theme={pair} storage={inlineStorage()}>
        <Probe />
      </ThemeProvider>,
    )
    rerender(
      <ThemeProvider theme={pair} storage={inlineStorage()}>
        <Probe />
      </ThemeProvider>,
    )

    expect(reads).toBe(1)
  })
})

describe('single-theme providers', () => {
  it('still renders the theme it was given', () => {
    render(
      <ThemeProvider theme={darkTheme}>
        <SingleProbe />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('surface')).toHaveTextContent(
      darkTheme.colors.surface,
    )
  })

  it('throws from useThemeMode, since there is no mode to control', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() =>
      render(
        <ThemeProvider theme={darkTheme}>
          <Probe />
        </ThemeProvider>,
      ),
    ).toThrow(/requires a <ThemeProvider theme=\{\{ light, dark \}\}>/)

    spy.mockRestore()
  })

  it('is not fooled by a theme carrying its own light/dark tokens', () => {
    // A custom BaseTheme is free to name tokens `light` and `dark`. Sniffing
    // for those keys would misread this as a { light, dark } pair and hand
    // `theme.light` — a color string — to the whole tree as the theme.
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const customTheme = {
      ...lightTheme,
      light: '#ffffff',
      dark: '#000000',
    } as unknown as typeof lightTheme

    render(
      <ThemeProvider theme={customTheme}>
        <SingleProbe />
      </ThemeProvider>,
    )

    expect(screen.getByTestId('surface')).toHaveTextContent(
      lightTheme.colors.surface,
    )

    spy.mockRestore()
  })

  it('throws with no provider at all', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<Probe />)).toThrow(/requires a <ThemeProvider/)

    spy.mockRestore()
  })
})

function SingleProbe() {
  const theme = useTheme()
  return <Text testID="surface">{theme.colors.surface}</Text>
}

describe('mode type', () => {
  it('accepts every ThemeMode', () => {
    const modes: ThemeMode[] = ['system', 'light', 'dark']

    for (const mode of modes) {
      const view = render(
        <ThemeProvider theme={pair} mode={mode}>
          <Probe />
        </ThemeProvider>,
      )

      expect(screen.getByTestId('mode')).toHaveTextContent(mode)
      view.unmount()
    }
  })
})
