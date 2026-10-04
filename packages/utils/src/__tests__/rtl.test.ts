import { I18nManager } from 'react-native'
import {
  resolveLogical,
  resolveLogicalKey,
  selectRTL,
  transformOrigin,
} from '../rtl'

function withRTL(isRTL: boolean, fn: () => void) {
  const original = I18nManager.isRTL
  Object.defineProperty(I18nManager, 'isRTL', {
    configurable: true,
    get: () => isRTL,
  })
  try {
    fn()
  } finally {
    Object.defineProperty(I18nManager, 'isRTL', {
      configurable: true,
      get: () => original,
    })
  }
}

describe('selectRTL', () => {
  it('returns the ltr value when layout direction is LTR', () => {
    withRTL(false, () => {
      expect(selectRTL('ltr-value', 'rtl-value')).toBe('ltr-value')
    })
  })

  it('returns the rtl value when layout direction is RTL', () => {
    withRTL(true, () => {
      expect(selectRTL('ltr-value', 'rtl-value')).toBe('rtl-value')
    })
  })

  it('works with non-string values', () => {
    withRTL(false, () => {
      expect(selectRTL(1, 2)).toBe(1)
    })
    withRTL(true, () => {
      expect(selectRTL(1, 2)).toBe(2)
    })
  })

  it('works with object values', () => {
    const ltr = { icon: 'chevron-right' }
    const rtl = { icon: 'chevron-left' }
    withRTL(false, () => {
      expect(selectRTL(ltr, rtl)).toBe(ltr)
    })
    withRTL(true, () => {
      expect(selectRTL(ltr, rtl)).toBe(rtl)
    })
  })
})

describe('transformOrigin', () => {
  it('returns left-anchored origin in LTR', () => {
    withRTL(false, () => {
      expect(transformOrigin()).toBe('left top')
      expect(transformOrigin('top')).toBe('left top')
      expect(transformOrigin('center')).toBe('left center')
      expect(transformOrigin('bottom')).toBe('left bottom')
    })
  })

  it('returns right-anchored origin in RTL', () => {
    withRTL(true, () => {
      expect(transformOrigin()).toBe('right top')
      expect(transformOrigin('top')).toBe('right top')
      expect(transformOrigin('center')).toBe('right center')
      expect(transformOrigin('bottom')).toBe('right bottom')
    })
  })
})

describe('resolveLogical on native', () => {
  // Native resolves a logical key in an inline style itself, in either
  // direction, so the key passes through. The web half, where the key turns
  // physical, is in `packages/components/src/__tests__/web/rtl.web.test.tsx`.
  it('keeps the logical key in LTR', () => {
    withRTL(false, () => {
      expect(resolveLogicalKey('start')).toBe('start')
      expect(resolveLogical('marginStart', 8)).toEqual({ marginStart: 8 })
    })
  })

  it('keeps the logical key in RTL', () => {
    withRTL(true, () => {
      expect(resolveLogicalKey('end')).toBe('end')
      expect(resolveLogical('paddingEnd', 8)).toEqual({ paddingEnd: 8 })
    })
  })
})
