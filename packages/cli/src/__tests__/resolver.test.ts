import { describe, it, expect, vi, beforeEach } from 'vitest'
// Mock the registry module
vi.mock('../lib/registry', () => ({
  fetchComponentEntry: vi.fn(),
  fetchUtilsRegistry: vi.fn(),
}))
import { fetchComponentEntry, fetchUtilsRegistry } from '../lib/registry'
import {
  resolveComponents,
  getComponentNames,
  getDependencyComponents,
} from '../lib/resolver'
import type { RootNativeConfig } from '../lib/types'

const config: RootNativeConfig = {
  aliases: {
    components: '@/components/ui',
    lib: '@/lib',
  },
  registryUrl: 'https://raw.githubusercontent.com/rootnative/ui',
  registryVersion: 'main',
}

const mockUtilsRegistry = {
  color: {
    file: 'packages/utils/src/color.ts',
    exports: ['alphaColor', 'blendColor'],
    dependencies: {},
  },
  elevation: {
    file: 'packages/utils/src/elevation.ts',
    exports: ['elevationStyle'],
    dependencies: {},
  },
  icon: {
    file: 'packages/utils/src/icon.ts',
    exports: ['getMaterialCommunityIcons'],
    dependencies: { '@expo/vector-icons': '>=14.0.0' },
  },
  rtl: {
    file: 'packages/utils/src/rtl.ts',
    exports: ['transformOrigin', 'selectRTL'],
    dependencies: {},
  },
}

const mockComponents = {
  button: {
    name: 'button',
    description: 'MD3 button',
    files: ['packages/components/src/button/Button.tsx'],
    utils: ['color', 'elevation', 'icon'],
    componentDependencies: [],
    dependencies: { '@rootnative/core': '>=0.1.1-alpha.1' },
    optionalDependencies: { '@expo/vector-icons': '>=14.0.0' },
  },
  typography: {
    name: 'typography',
    description: 'Typography component',
    files: ['packages/components/src/typography/Typography.tsx'],
    utils: [],
    componentDependencies: [],
    dependencies: { '@rootnative/core': '>=0.1.1-alpha.1' },
    optionalDependencies: {},
  },
  'icon-button': {
    name: 'icon-button',
    description: 'Icon button',
    files: ['packages/components/src/icon-button/IconButton.tsx'],
    utils: ['color', 'icon'],
    componentDependencies: [],
    dependencies: { '@rootnative/core': '>=0.1.1-alpha.1' },
    optionalDependencies: { '@expo/vector-icons': '>=14.0.0' },
  },
  appbar: {
    name: 'appbar',
    description: 'App bar',
    files: ['packages/components/src/appbar/AppBar.tsx'],
    utils: ['rtl'],
    componentDependencies: ['icon-button', 'typography'],
    dependencies: {
      '@rootnative/core': '>=0.1.1-alpha.1',
      'react-native-safe-area-context': '>=4.0.0',
    },
    optionalDependencies: {},
  },
  card: {
    name: 'card',
    description: 'Card component',
    files: ['packages/components/src/card/Card.tsx'],
    utils: ['color', 'elevation'],
    componentDependencies: [],
    dependencies: { '@rootnative/core': '>=0.1.1-alpha.1' },
    optionalDependencies: {},
  },
}

beforeEach(() => {
  vi.mocked(fetchUtilsRegistry).mockResolvedValue(mockUtilsRegistry)
  vi.mocked(fetchComponentEntry).mockImplementation(async (_config, name) => {
    const entry = mockComponents[name as keyof typeof mockComponents]
    if (!entry) throw new Error(`Unknown component: ${name}`)
    return entry
  })
})

describe('resolveComponents', () => {
  it('resolves a single component with no deps', async () => {
    const result = await resolveComponents(config, ['button'])

    expect(result.components).toHaveLength(1)
    expect(result.components[0].entry.name).toBe('button')
    expect(result.components[0].isDirectRequest).toBe(true)
  })

  it('resolves utils for a component', async () => {
    const result = await resolveComponents(config, ['button'])

    expect(result.utils).toEqual(['color', 'elevation', 'icon'])
  })

  it('collects npm dependencies', async () => {
    const result = await resolveComponents(config, ['button'])

    expect(result.npmDependencies).toEqual({
      '@rootnative/core': '>=0.1.1-alpha.1',
    })
  })

  it('collects optional npm dependencies', async () => {
    const result = await resolveComponents(config, ['button'])

    expect(result.optionalNpmDependencies).toHaveProperty('@expo/vector-icons')
  })

  it('resolves transitive component dependencies', async () => {
    const result = await resolveComponents(config, ['appbar'])

    const names = getComponentNames(result)
    expect(names).toContain('appbar')
    expect(names).toContain('icon-button')
    expect(names).toContain('typography')
    expect(names).toHaveLength(3)
  })

  it('marks transitive deps as not direct requests', async () => {
    const result = await resolveComponents(config, ['appbar'])

    const appbar = result.components.find((c) => c.entry.name === 'appbar')
    const iconButton = result.components.find(
      (c) => c.entry.name === 'icon-button',
    )
    const typography = result.components.find(
      (c) => c.entry.name === 'typography',
    )

    expect(appbar?.isDirectRequest).toBe(true)
    expect(iconButton?.isDirectRequest).toBe(false)
    expect(typography?.isDirectRequest).toBe(false)
  })

  it('merges utils from all resolved components', async () => {
    const result = await resolveComponents(config, ['appbar'])

    // appbar needs rtl, icon-button needs color+icon
    expect(result.utils).toContain('rtl')
    expect(result.utils).toContain('color')
    expect(result.utils).toContain('icon')
  })

  it('merges npm deps from transitive dependencies', async () => {
    const result = await resolveComponents(config, ['appbar'])

    expect(result.npmDependencies).toHaveProperty(
      'react-native-safe-area-context',
    )
    expect(result.npmDependencies).toHaveProperty('@rootnative/core')
  })

  it('resolves multiple components at once', async () => {
    const result = await resolveComponents(config, ['button', 'card'])

    const names = getComponentNames(result)
    expect(names).toContain('button')
    expect(names).toContain('card')
    expect(names).toHaveLength(2)
  })

  it('deduplicates shared dependencies', async () => {
    // Both button and card use color+elevation
    const result = await resolveComponents(config, ['button', 'card'])

    expect(result.utils).toEqual(['color', 'elevation', 'icon'])
  })

  it('deduplicates components when requested and also a dep', async () => {
    // Request icon-button directly + appbar which depends on icon-button
    const result = await resolveComponents(config, ['icon-button', 'appbar'])

    const iconButtons = result.components.filter(
      (c) => c.entry.name === 'icon-button',
    )
    expect(iconButtons).toHaveLength(1)
    // Direct request takes precedence
    expect(iconButtons[0].isDirectRequest).toBe(true)
  })

  it('handles component with no utils or deps', async () => {
    const result = await resolveComponents(config, ['typography'])

    expect(result.components).toHaveLength(1)
    expect(result.utils).toEqual([])
    expect(result.npmDependencies).toEqual({
      '@rootnative/core': '>=0.1.1-alpha.1',
    })
    expect(result.optionalNpmDependencies).toEqual({})
  })
})

describe('getComponentNames', () => {
  it('returns names from resolution result', async () => {
    const result = await resolveComponents(config, ['appbar'])
    const names = getComponentNames(result)

    expect(names).toEqual(
      expect.arrayContaining(['appbar', 'icon-button', 'typography']),
    )
  })
})

describe('getDependencyComponents', () => {
  it('returns only non-direct components', async () => {
    const result = await resolveComponents(config, ['appbar'])
    const deps = getDependencyComponents(result)

    expect(deps.map((d) => d.name)).toEqual(
      expect.arrayContaining(['icon-button', 'typography']),
    )
    expect(deps.map((d) => d.name)).not.toContain('appbar')
  })

  it('returns empty for components without deps', async () => {
    const result = await resolveComponents(config, ['button'])
    const deps = getDependencyComponents(result)

    expect(deps).toEqual([])
  })
})
