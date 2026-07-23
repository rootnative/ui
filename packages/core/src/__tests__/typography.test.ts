import { defaultTypography } from '../theme/typography'

const BASE_STYLES = [
  'displayLarge',
  'displayMedium',
  'displaySmall',
  'headlineLarge',
  'headlineMedium',
  'headlineSmall',
  'titleLarge',
  'titleMedium',
  'titleSmall',
  'bodyLarge',
  'bodyMedium',
  'bodySmall',
  'labelLarge',
  'labelMedium',
  'labelSmall',
] as const

describe('defaultTypography emphasized styles', () => {
  it('defines an emphasized variant for all 15 base styles', () => {
    for (const base of BASE_STYLES) {
      expect(defaultTypography[`${base}Emphasized`]).toBeDefined()
    }
  })

  it('keeps the base size and line height', () => {
    for (const base of BASE_STYLES) {
      const emphasized = defaultTypography[`${base}Emphasized`]
      expect(emphasized.fontSize).toBe(defaultTypography[base].fontSize)
      expect(emphasized.lineHeight).toBe(defaultTypography[base].lineHeight)
    }
  })

  it('steps the weight up one level (400→500, 500→700)', () => {
    for (const base of BASE_STYLES) {
      const baseWeight = defaultTypography[base].fontWeight
      const emphasizedWeight = defaultTypography[`${base}Emphasized`].fontWeight
      expect(emphasizedWeight).toBe(baseWeight === '400' ? '500' : '700')
    }
  })
})
