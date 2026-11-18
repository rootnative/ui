import { renderWithTheme } from '@rootnative/utils/test'
import { screen, waitFor } from '@testing-library/react-native'
import type { ReactElement } from 'react'
import { I18nManager, Platform, StyleSheet, TextInput } from 'react-native'
import type { TextStyle } from 'react-native'
import { PortalHost } from '../portal/PortalHost'
import { SearchBar } from '../search-bar'
import { SearchView } from '../search-view'
import { TextField } from '../text-field'

/**
 * The value and the placeholder of each input align with the start edge of
 * the layout. iOS does that by itself. Android aligns by the first strong
 * character of the text, so Latin text in RTL needs a physical `textAlign`.
 * The browser half is in `web/rtl.web.test.tsx`.
 */
const INPUTS: [string, (inputStyle?: TextStyle) => ReactElement][] = [
  [
    'TextField',
    (inputStyle) => <TextField label="Email" inputStyle={inputStyle} />,
  ],
  [
    'SearchBar',
    (inputStyle) => (
      <SearchBar placeholder="Search mail" inputStyle={inputStyle} />
    ),
  ],
  [
    'SearchView',
    (inputStyle) => (
      <PortalHost>
        <SearchView
          visible
          onDismiss={() => {}}
          placeholder="Search mail"
          inputStyle={inputStyle}
        />
      </PortalHost>
    ),
  ],
]

const CENTERED: TextStyle = { textAlign: 'center' }

const original = { os: Platform.OS, isRTL: I18nManager.isRTL }

function setPlatform(os: typeof Platform.OS, isRTL: boolean) {
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true })
  Object.defineProperty(I18nManager, 'isRTL', {
    value: isRTL,
    configurable: true,
  })
}

afterEach(() => setPlatform(original.os, original.isRTL))

async function textAlignOf(ui: ReactElement) {
  renderWithTheme(ui)
  const input = await waitFor(() => screen.UNSAFE_getByType(TextInput))
  return StyleSheet.flatten(input.props.style).textAlign
}

describe.each(INPUTS)('%s input alignment', (_name, render) => {
  it('leaves the natural alignment to iOS in RTL', async () => {
    setPlatform('ios', true)
    expect(await textAlignOf(render())).toBeUndefined()
  })

  it('aligns left on Android in LTR', async () => {
    setPlatform('android', false)
    expect(await textAlignOf(render())).toBe('left')
  })

  it('aligns right on Android in RTL', async () => {
    setPlatform('android', true)
    expect(await textAlignOf(render())).toBe('right')
  })

  it('keeps the alignment of inputStyle', async () => {
    setPlatform('android', true)
    expect(await textAlignOf(render(CENTERED))).toBe('center')
  })
})
