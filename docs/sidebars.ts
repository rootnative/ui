import type { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  docs: [
    { type: 'doc', id: 'index', label: 'Introduction' },
    { type: 'doc', id: 'quick-start', label: 'Quick Start' },
    { type: 'doc', id: 'installation', label: 'Installation' },
    { type: 'doc', id: 'cli', label: 'CLI' },
    { type: 'doc', id: 'theming', label: 'Theming' },
    { type: 'doc', id: 'fonts', label: 'Fonts' },
    { type: 'doc', id: 'icons', label: 'Icons' },
    { type: 'doc', id: 'llms', label: 'For AI Agents' },
    {
      type: 'category',
      label: 'Layout',
      collapsed: false,
      items: [
        'components/box',
        'components/row',
        'components/column',
        'components/grid',
        'components/layout',
      ],
    },
    {
      type: 'category',
      label: 'Inputs',
      collapsed: false,
      items: [
        'components/button',
        'components/button-group',
        'components/checkbox',
        'components/chip',
        'components/fab',
        'components/icon-button',
        'components/radio',
        'components/slider',
        'components/switch',
        'components/text-field',
      ],
    },
    {
      type: 'category',
      label: 'Data Display',
      collapsed: false,
      items: [
        'components/avatar',
        'components/card',
        'components/list',
        'components/progress',
        'components/typography',
      ],
    },
    {
      type: 'category',
      label: 'Surfaces',
      collapsed: false,
      items: [
        'components/appbar',
        'components/keyboard-avoiding-wrapper',
        'components/portal',
      ],
    },
  ],
}

export default sidebars
