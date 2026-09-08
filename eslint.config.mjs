import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import reactNativePlugin from 'eslint-plugin-react-native'
import prettierConfig from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'

export default [
  {
    ignores: [
      '**/*.js',
      '**/*.cjs',
      '**/*.mjs',
      'node_modules/**',
      '**/node_modules/**',
      'dist/**',
      '**/dist/**',
      '.expo/**',
      '**/.expo/**',
      'build/**',
      '**/build/**',
      '.turbo/**',
      '**/.turbo/**',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    ...eslint.configs.recommended,
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-native': reactNativePlugin,
      import: importPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/self-closing-comp': 'warn',
      'react/jsx-no-duplicate-props': ['warn', { ignoreCase: true }],
      // `pointerEvents` belongs in `style`, never as a prop. react-native-web
      // deprecated the prop form and warns once per process, so one component
      // using it prints `props.pointerEvents is deprecated` in the console of
      // every app that renders it. React Native has read the key from `style`
      // since 0.71, and react-native-web's own implementation translated the
      // prop into exactly that style — so the two are equivalent and only the
      // prop spelling is noisy.
      //
      // A lint rule rather than a test: the warning is `warnOnce`-guarded, so
      // only the first offender in a process is ever observable and a
      // per-component test passes for everyone after it. Use the shared table
      // in `packages/components/src/internal/pointerEvents.ts`, appended last
      // in the style array — that is where the prop used to land.
      'react/forbid-component-props': [
        'error',
        {
          forbid: [
            {
              propName: 'pointerEvents',
              message:
                'Put pointerEvents in `style`, not in a prop — react-native-web deprecated the prop form. Use the table in internal/pointerEvents.ts, last in the style array.',
            },
          ],
        },
      ],

      // React Native
      'react-native/no-raw-text': 'off',
      'react-native/no-inline-styles': 'error',
      'react-native/no-unused-styles': 'warn',
      'react-native/no-color-literals': 'warn',
      'react-native/no-single-element-style-arrays': 'warn',

      // TypeScript
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports' },
      ],

      // Import ordering
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'never',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'warn',
    },
  },
  // Relax rules for test files — inline styles and color literals are fine in tests
  {
    files: ['**/__tests__/**', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      'react-native/no-inline-styles': 'off',
      'react-native/no-color-literals': 'off',
    },
  },
  prettierConfig,
]
