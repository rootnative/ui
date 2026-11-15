import { defineTheme } from '../theme/defineTheme'
import { lightTheme } from '../theme/light'
import type { BaseTheme, Theme, TypographyToken } from '../theme/types'

const body: TypographyToken = {
  fontFamily: 'Inter',
  fontSize: 16,
  fontWeight: '400',
  lineHeight: 24,
  letterSpacing: 0,
}

/**
 * The type check reads this file, so each call below is also a type test of
 * the contract: `BaseTheme` needs `colors` and `typography` and no MD3 group,
 * and `Theme` needs the MD3 groups.
 */
describe('defineTheme', () => {
  it('takes a theme with only colors and typography', () => {
    const theme = defineTheme({
      colors: { brand: '#FF6B00' },
      typography: { body },
    })
    expect(theme.colors.brand).toBe('#FF6B00')
  })

  it('keeps the type of a token group that the theme adds', () => {
    interface BrandTheme extends BaseTheme {
      colors: { brand: string; [key: string]: string }
      typography: { body: TypographyToken; [key: string]: TypographyToken }
      radius: { control: number; card: number }
    }
    const theme = defineTheme<BrandTheme>({
      colors: { brand: '#FF6B00' },
      typography: { body },
      radius: { control: 8, card: 16 },
    })
    const control: number = theme.radius.control
    expect(control).toBe(8)
  })

  it('takes the MD3 theme with tokens beside it', () => {
    interface AppTheme extends Theme {
      status: { success: string }
    }
    const theme = defineTheme<AppTheme>({
      ...lightTheme,
      status: { success: '#388E3C' },
    })
    expect(theme.shape.cornerFull).toBe(lightTheme.shape.cornerFull)
  })

  it('requires the MD3 groups on the MD3 theme', () => {
    const withoutMotion = { ...lightTheme, motion: undefined }
    // @ts-expect-error `motion` is required on `Theme`
    const theme: Theme = withoutMotion
    expect(theme.motion).toBeUndefined()
  })

  it('has no MD3 group on the base theme', () => {
    const base: BaseTheme = { colors: {}, typography: {} }
    // The index signature gives `unknown`, not `Shape`.
    const shape: unknown = base.shape
    expect(shape).toBeUndefined()
    // @ts-expect-error `shape` is not a known group of `BaseTheme`
    expect(() => base.shape.cornerFull).toThrow()
  })
})
