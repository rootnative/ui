import path from 'path'
import type * as Preset from '@docusaurus/preset-classic'
import type { Config } from '@docusaurus/types'

const config: Config = {
  title: 'RootNative UI',
  tagline: 'Design-system agnostic components for React Native',
  url: 'https://rootnative.github.io',
  baseUrl: '/ui/',
  onBrokenLinks: 'throw',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  favicon: 'img/favicon.ico',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          editUrl: 'https://github.com/rootnative/ui/edit/main/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  clientModules: ['./src/clientModules/defaultPackageManager.js'],

  plugins: [
    [
      'docusaurus-plugin-react-docgen-typescript',
      {
        src: [
          path.resolve(__dirname, '../packages/components/src/**/*.{ts,tsx}'),
          path.resolve(__dirname, '../packages/core/src/**/*.{ts,tsx}'),
        ],
        global: true,
        parserOptions: {
          shouldExtractLiteralValuesFromEnum: true,
          shouldRemoveUndefinedFromOptional: true,
          propFilter: (prop: { parent?: { fileName: string } }) => {
            if (prop.parent) {
              return !prop.parent.fileName.includes('node_modules')
            }
            return true
          },
        },
      },
    ],
  ],

  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        docsRouteBasePath: '/',
        indexBlog: false,
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'RootNative UI',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          label: 'Docs',
          position: 'left',
        },
        {
          href: 'https://rootnative.github.io/ui/demo/',
          label: 'Demo',
          position: 'right',
        },
        {
          href: 'https://github.com/rootnative/ui',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} RootNative`,
    },
    prism: {
      additionalLanguages: ['bash'],
    },
  } satisfies Preset.ThemeConfig,
}

export default config
