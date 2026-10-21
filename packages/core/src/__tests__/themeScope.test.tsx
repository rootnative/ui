import { MotionConfig, useMotionConfig } from '@rootnative/inertia'
import { fireEvent, render, screen } from '@testing-library/react-native'
import * as React from 'react'
import { Text, useColorScheme } from 'react-native'
import {
  ThemeProvider,
  ThemeScopeProvider,
  useIconResolver,
  useTheme,
  useThemeMode,
  useThemeScope,
} from '../index'
import type { IconResolver, ThemeScope } from '../index'
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

const rootResolver: IconResolver = (name) => <Text>root:{name}</Text>
const nestedResolver: IconResolver = (name) => <Text>nested:{name}</Text>

function Probe({ id }: { id: string }) {
  const theme = useTheme()
  const resolver = useIconResolver()
  const mode = React.useContext(ModeProbeContext)
  const motion = useMotionConfig()

  return (
    <>
      <Text testID={`${id}-primary`}>{theme.colors.primary}</Text>
      <Text testID={`${id}-icon`}>
        {resolver ? resolver('star', { size: 16 }) : 'none'}
      </Text>
      <Text testID={`${id}-mode`}>{mode}</Text>
      <Text testID={`${id}-hover`}>
        {String(
          (motion.transitions['state-hover'] as { duration?: number })
            ?.duration,
        )}
      </Text>
    </>
  )
}

// `useThemeMode()` throws under a single-theme provider, so the probe reads
// the mode through a wrapper that the single-theme test leaves out.
const ModeProbeContext = React.createContext('')
function ModeProbe({ children }: { children: React.ReactNode }) {
  const { mode } = useThemeMode()
  return (
    <ModeProbeContext.Provider value={mode}>
      {children}
    </ModeProbeContext.Provider>
  )
}

function SetDark() {
  const { setMode } = useThemeMode()
  return (
    <Text testID="set-dark" onPress={() => setMode('dark')}>
      dark
    </Text>
  )
}

/**
 * Reads the scope where it stands and hands it up through a ref, so a test
 * can render it again somewhere else, as a portal does.
 */
function Capture({ into }: { into: { current: ThemeScope | null } }) {
  into.current = useThemeScope()
  return null
}

function text(testID: string) {
  return screen.getByTestId(testID).props.children
}

beforeEach(() => {
  mockedUseColorScheme.mockReturnValue('light')
})

describe('useThemeScope and ThemeScopeProvider', () => {
  it('carries the theme, the icon resolver and the mode to another place', () => {
    const captured: { current: ThemeScope | null } = { current: null }

    function App() {
      const [, rerender] = React.useReducer((n: number) => n + 1, 0)
      return (
        <ThemeProvider
          theme={rootPair}
          iconResolver={rootResolver}
          defaultMode="light"
        >
          <ThemeProvider theme={nestedPair} iconResolver={nestedResolver}>
            <MotionConfig
              transitions={{ 'state-hover': { type: 'timing', duration: 999 } }}
            >
              <Capture into={captured} />
              <Text testID="capture-done" onPress={rerender}>
                captured
              </Text>
            </MotionConfig>
          </ThemeProvider>
          <ModeProbe>
            <Probe id="root" />
          </ModeProbe>
          {captured.current ? (
            <ThemeScopeProvider scope={captured.current}>
              <ModeProbe>
                <Probe id="carried" />
              </ModeProbe>
            </ThemeScopeProvider>
          ) : null}
        </ThemeProvider>
      )
    }

    render(<App />)
    fireEvent.press(screen.getByTestId('capture-done'))

    expect(text('root-primary')).toBe(lightTheme.colors.primary)
    expect(text('carried-primary')).toBe(seeded.lightTheme.colors.primary)
    expect(screen.getByText('nested:star')).toBeTruthy()
    expect(text('carried-mode')).toBe('light')
    expect(text('root-hover')).not.toBe('999')
    expect(text('carried-hover')).toBe('999')
  })

  it('sets the mode of the source provider through the carried scope', () => {
    const captured: { current: ThemeScope | null } = { current: null }

    function App() {
      const [, rerender] = React.useReducer((n: number) => n + 1, 0)
      return (
        <ThemeProvider theme={rootPair} defaultMode="light">
          <ThemeProvider theme={nestedPair}>
            <Capture into={captured} />
            <Text testID="capture-done" onPress={rerender}>
              captured
            </Text>
          </ThemeProvider>
          <ModeProbe>
            <Probe id="root" />
          </ModeProbe>
          {captured.current ? (
            <ThemeScopeProvider scope={captured.current}>
              <SetDark />
            </ThemeScopeProvider>
          ) : null}
        </ThemeProvider>
      )
    }

    render(<App />)
    fireEvent.press(screen.getByTestId('capture-done'))
    fireEvent.press(screen.getByTestId('set-dark'))

    expect(text('root-mode')).toBe('dark')
    expect(text('root-primary')).toBe(darkTheme.colors.primary)
  })

  it('gives a nested provider below it the carried values as its parent', () => {
    const captured: { current: ThemeScope | null } = { current: null }

    function App() {
      const [, rerender] = React.useReducer((n: number) => n + 1, 0)
      return (
        <ThemeProvider theme={rootPair} defaultMode="dark">
          <ThemeProvider theme={nestedPair} iconResolver={nestedResolver}>
            <Capture into={captured} />
            <Text testID="capture-done" onPress={rerender}>
              captured
            </Text>
          </ThemeProvider>
          {captured.current ? (
            <ThemeScopeProvider scope={captured.current}>
              <ThemeProvider theme={rootPair}>
                <ModeProbe>
                  <Probe id="below" />
                </ModeProbe>
              </ThemeProvider>
            </ThemeScopeProvider>
          ) : null}
        </ThemeProvider>
      )
    }

    render(<App />)
    fireEvent.press(screen.getByTestId('capture-done'))

    expect(text('below-mode')).toBe('dark')
    expect(screen.getByText('nested:star')).toBeTruthy()
  })

  it('reports a single-theme scope as having no mode', () => {
    const captured: { current: ThemeScope | null } = { current: null }

    function App() {
      const [, rerender] = React.useReducer((n: number) => n + 1, 0)
      return (
        <ThemeProvider theme={lightTheme}>
          <Capture into={captured} />
          <Text testID="capture-done" onPress={rerender}>
            captured
          </Text>
          {captured.current ? (
            <ThemeScopeProvider scope={captured.current}>
              <Probe id="carried" />
            </ThemeScopeProvider>
          ) : null}
        </ThemeProvider>
      )
    }

    render(<App />)
    fireEvent.press(screen.getByTestId('capture-done'))

    expect(text('carried-icon')).toBe('none')

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(
        <ThemeScopeProvider scope={captured.current!}>
          <SetDark />
        </ThemeScopeProvider>,
      ),
    ).toThrow(/requires a <ThemeProvider theme=\{\{ light, dark \}\}>/)
    spy.mockRestore()
  })
})
