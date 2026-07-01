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

  headTags: [
    {
      tagName: 'link',
      attributes: { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossorigin: 'anonymous',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap',
      },
    },
  ],

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
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'RootNative UI',
      hideOnScroll: true,
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          label: 'Docs',
          position: 'left',
        },
        {
          to: '/theming',
          label: 'Theming',
          position: 'left',
        },
        {
          to: '/cli',
          label: 'CLI',
          position: 'left',
        },
        {
          href: 'https://rootnative.github.io/ui/demo/',
          label: 'Demo',
          position: 'right',
        },
        {
          href: 'https://github.com/rootnative/ui',
          position: 'right',
          className: 'navbar-github-link',
          'aria-label': 'GitHub repository',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Introduction', to: '/introduction' },
            { label: 'Quick Start', to: '/quick-start' },
            { label: 'Installation', to: '/installation' },
            { label: 'Theming', to: '/theming' },
          ],
        },
        {
          title: 'Components',
          items: [
            { label: 'Button', to: '/components/button' },
            { label: 'Card', to: '/components/card' },
            { label: 'TextField', to: '/components/text-field' },
            { label: 'All components', to: '/introduction' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'CLI', to: '/cli' },
            { label: 'For AI Agents', to: '/llms' },
            {
              label: 'Live Demo',
              href: 'https://rootnative.github.io/ui/demo/',
            },
            { label: 'GitHub', href: 'https://github.com/rootnative/ui' },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} RootNative · MIT Licensed`,
    },
    prism: {
      additionalLanguages: ['bash'],
    },
  } satisfies Preset.ThemeConfig,
}

export default config
