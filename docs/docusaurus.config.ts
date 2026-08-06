import fs from 'fs'
import path from 'path'
import type * as Preset from '@docusaurus/preset-classic'
import type { Config } from '@docusaurus/types'

interface WorkspacePackage {
  version: string
  peerDependencies?: Record<string, string>
}

function readWorkspacePackage(dir: string): WorkspacePackage {
  return JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, `../packages/${dir}/package.json`),
      'utf8',
    ),
  ) as WorkspacePackage
}

const componentsPkg = readWorkspacePackage('components')

// Snack encodes dependencies as a comma-separated `name@spec` list, so every
// spec has to be a single whitespace-free token. The inertia peer range is a
// `>=x.y.z <0.1.0` window, which would not survive that encoding — so take the
// lowest version the range allows. It is always published, always compatible,
// and always atomic.
const inertiaPeer =
  componentsPkg.peerDependencies?.['@rootnative/inertia'] ?? '0.0.5'
const inertiaVersion = inertiaPeer.trim().split(/\s+/)[0].replace(/^\D+/, '')

const config: Config = {
  // Versions the Snack previews boot with, read from the workspace at build
  // time. The release workflow bumps these package.json files and pushes to
  // main before the docs redeploy, so live examples always match the latest
  // published packages. A hardcoded pin here rots silently — it sat three
  // alphas behind before this was wired up.
  customFields: {
    snackVersions: {
      components: componentsPkg.version,
      core: readWorkspacePackage('core').version,
      inertia: inertiaVersion,
    },
  },

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
