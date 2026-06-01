import { describe, it, expect } from 'vitest'
import { transformImports, generateUtilsBarrel } from '../lib/transform'
import type { RootNativeConfig } from '../lib/types'

const config: RootNativeConfig = {
  aliases: {
    components: '@/components/ui',
    lib: '@/lib',
  },
  registryUrl: 'https://raw.githubusercontent.com/rootnative/ui',
  registryVersion: 'main',
}

const installedComponents = ['button', 'icon-button', 'typography', 'appbar']

function transform(source: string, componentName = 'button') {
  return transformImports(source, {
    config,
    componentName,
    installedComponents,
  })
}

describe('transformImports', () => {
  describe('@rootnative/utils → local barrel', () => {
    it('rewrites single-line import', () => {
      const input = `import { alphaColor, blendColor } from '@rootnative/utils'`
      const output = transform(input)
      expect(output).toBe(
        `import { alphaColor, blendColor } from '@/lib/rootnative-utils'`,
      )
    })

    it('rewrites multi-line import', () => {
      const input = [
        'import {',
        '  alphaColor,',
        '  blendColor,',
        '  getMaterialCommunityIcons,',
        `} from '@rootnative/utils'`,
      ].join('\n')
      const output = transform(input, 'icon-button')
      expect(output).toContain(`from '@/lib/rootnative-utils'`)
      expect(output).not.toContain('@rootnative/utils')
    })

    it('rewrites type-only import', () => {
      const input = `import type { ElevationLevel } from '@rootnative/utils'`
      const output = transform(input)
      expect(output).toBe(
        `import type { ElevationLevel } from '@/lib/rootnative-utils'`,
      )
    })

    it('rewrites export from', () => {
      const input = `export { alphaColor } from '@rootnative/utils'`
      const output = transform(input)
      expect(output).toBe(`export { alphaColor } from '@/lib/rootnative-utils'`)
    })
  })

  describe('@rootnative/core → unchanged', () => {
    it('keeps @rootnative/core import as-is', () => {
      const input = `import { useTheme } from '@rootnative/core'`
      const output = transform(input)
      expect(output).toBe(input)
    })

    it('keeps @rootnative/core subpath import as-is', () => {
      const input = `import { createMaterialTheme } from '@rootnative/core/create-theme'`
      const output = transform(input)
      expect(output).toBe(input)
    })

    it('keeps type import from core as-is', () => {
      const input = `import type { MaterialTheme } from '@rootnative/core'`
      const output = transform(input)
      expect(output).toBe(input)
    })
  })

  describe('inter-component imports → alias paths', () => {
    it('rewrites ../icon-button to alias', () => {
      const input = `import { IconButton } from '../icon-button'`
      const output = transform(input, 'appbar')
      expect(output).toBe(
        `import { IconButton } from '@/components/ui/icon-button'`,
      )
    })

    it('rewrites ../icon-button/types to alias with subpath', () => {
      const input = `import type { IconButtonProps } from '../icon-button/types'`
      const output = transform(input, 'appbar')
      expect(output).toBe(
        `import type { IconButtonProps } from '@/components/ui/icon-button/types'`,
      )
    })

    it('rewrites ../typography to alias', () => {
      const input = `import { Typography } from '../typography'`
      const output = transform(input, 'appbar')
      expect(output).toBe(
        `import { Typography } from '@/components/ui/typography'`,
      )
    })

    it('skips rewriting if target component is not installed', () => {
      const input = `import { Card } from '../card'`
      const output = transform(input, 'appbar')
      // card is not in installedComponents
      expect(output).toBe(input)
    })
  })

  describe('same-directory imports → unchanged', () => {
    it('keeps ./styles as-is', () => {
      const input = `import { createStyles } from './styles'`
      const output = transform(input)
      expect(output).toBe(input)
    })

    it('keeps ./types as-is', () => {
      const input = `import type { ButtonProps } from './types'`
      const output = transform(input)
      expect(output).toBe(input)
    })
  })

  describe('react-native and other imports → unchanged', () => {
    it('keeps react-native import as-is', () => {
      const input = `import { View, Pressable } from 'react-native'`
      const output = transform(input)
      expect(output).toBe(input)
    })

    it('keeps react import as-is', () => {
      const input = `import { useMemo } from 'react'`
      const output = transform(input)
      expect(output).toBe(input)
    })
  })

  describe('full file transform (real-world)', () => {
    it('transforms AppBar.tsx imports correctly', () => {
      const input = [
        `import { useCallback, useMemo, useState } from 'react'`,
        `import type { ReactNode } from 'react'`,
        `import { Platform, View } from 'react-native'`,
        `import { SafeAreaView } from 'react-native-safe-area-context'`,
        `import { defaultTopAppBarTokens, useTheme } from '@rootnative/core'`,
        '',
        `import { IconButton } from '../icon-button'`,
        `import type { IconButtonProps } from '../icon-button'`,
        `import { Typography } from '../typography'`,
        `import type { TypographyVariant } from '../typography'`,
        `import { selectRTL } from '@rootnative/utils'`,
        `import { createStyles, getColorSchemeColors } from './styles'`,
        `import type { AppBarProps } from './types'`,
      ].join('\n')

      const output = transform(input, 'appbar')

      // Should keep react, react-native, safe-area-context unchanged
      expect(output).toContain(`from 'react'`)
      expect(output).toContain(`from 'react-native'`)
      expect(output).toContain(`from 'react-native-safe-area-context'`)

      // Should keep @rootnative/core unchanged
      expect(output).toContain(`from '@rootnative/core'`)

      // Should rewrite @rootnative/utils
      expect(output).toContain(`from '@/lib/rootnative-utils'`)
      expect(output).not.toContain(`from '@rootnative/utils'`)

      // Should rewrite inter-component imports
      expect(output).toContain(`from '@/components/ui/icon-button'`)
      expect(output).toContain(`from '@/components/ui/typography'`)
      expect(output).not.toContain(`from '../icon-button'`)
      expect(output).not.toContain(`from '../typography'`)

      // Should keep same-directory imports
      expect(output).toContain(`from './styles'`)
      expect(output).toContain(`from './types'`)
    })

    it('transforms button/styles.ts imports correctly', () => {
      const input = [
        `import { StyleSheet } from 'react-native'`,
        `import type { MaterialTheme } from '@rootnative/core'`,
        '',
        `import type { ButtonVariant } from './types'`,
        `import { alphaColor, blendColor, elevationStyle } from '@rootnative/utils'`,
      ].join('\n')

      const output = transform(input)

      expect(output).toContain(`from 'react-native'`)
      expect(output).toContain(`from '@rootnative/core'`)
      expect(output).toContain(`from './types'`)
      expect(output).toContain(`from '@/lib/rootnative-utils'`)
      expect(output).not.toContain(`from '@rootnative/utils'`)
    })
  })

  describe('custom alias config', () => {
    it('uses ~ alias when configured', () => {
      const customConfig: RootNativeConfig = {
        ...config,
        aliases: {
          components: '~/components/ui',
          lib: '~/lib',
        },
      }

      const input = `import { alphaColor } from '@rootnative/utils'`
      const output = transformImports(input, {
        config: customConfig,
        componentName: 'button',
        installedComponents,
      })

      expect(output).toBe(`import { alphaColor } from '~/lib/rootnative-utils'`)
    })
  })
})

describe('generateUtilsBarrel', () => {
  it('generates barrel with sorted exports', () => {
    const result = generateUtilsBarrel(['icon', 'color', 'elevation'], {
      color: ['alphaColor', 'blendColor'],
      elevation: ['elevationStyle'],
      icon: ['getMaterialCommunityIcons'],
    })

    expect(result).toBe(
      [
        '// Auto-generated by rootnative CLI. Do not edit.',
        `export { alphaColor, blendColor } from './color'`,
        `export { elevationStyle } from './elevation'`,
        `export { getMaterialCommunityIcons } from './icon'`,
        '',
      ].join('\n'),
    )
  })

  it('skips utils with no exports', () => {
    const result = generateUtilsBarrel(['color'], {
      color: [],
    })

    expect(result).toBe('// Auto-generated by rootnative CLI. Do not edit.\n')
  })

  it('generates barrel for rtl utils', () => {
    const result = generateUtilsBarrel(['rtl'], {
      rtl: ['transformOrigin', 'selectRTL'],
    })

    expect(result).toContain(
      `export { transformOrigin, selectRTL } from './rtl'`,
    )
  })

  it('emits export type for type-only utility exports', () => {
    const result = generateUtilsBarrel(
      ['render-icon'],
      { 'render-icon': ['renderIcon'] },
      { 'render-icon': ['IconSource'] },
    )

    expect(result).toContain(`export { renderIcon } from './render-icon'`)
    expect(result).toContain(`export type { IconSource } from './render-icon'`)
  })

  it('emits both value and type exports for the same util', () => {
    const result = generateUtilsBarrel(
      ['pressable'],
      { pressable: ['resolvePressableStyle', 'resolveColorFromStyle'] },
      { pressable: ['PressableState', 'PressableStyleProp'] },
    )

    const lines = result.trim().split('\n')
    // Value exports come before type exports per util.
    expect(lines).toEqual([
      '// Auto-generated by rootnative CLI. Do not edit.',
      `export { resolvePressableStyle, resolveColorFromStyle } from './pressable'`,
      `export type { PressableState, PressableStyleProp } from './pressable'`,
    ])
  })
})
