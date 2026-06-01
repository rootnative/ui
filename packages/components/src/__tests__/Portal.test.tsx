import { renderWithTheme } from '@rootnative/utils/test'
import { screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { Portal } from '../portal/Portal'
import { PortalHost } from '../portal/PortalHost'

describe('Portal', () => {
  it('renders children inside the host', async () => {
    renderWithTheme(
      <PortalHost>
        <Text>app</Text>
        <Portal>
          <Text>portal-child</Text>
        </Portal>
      </PortalHost>,
    )
    expect(await screen.findByText('portal-child')).toBeTruthy()
    expect(screen.getByText('app')).toBeTruthy()
  })

  it('removes children when Portal unmounts', async () => {
    const { rerender } = renderWithTheme(
      <PortalHost>
        <Portal>
          <Text>visible</Text>
        </Portal>
      </PortalHost>,
    )
    expect(await screen.findByText('visible')).toBeTruthy()
    rerender(
      <PortalHost>
        <Text>app</Text>
      </PortalHost>,
    )
    expect(screen.queryByText('visible')).toBeNull()
  })

  it('updates content when Portal children change', async () => {
    const { rerender } = renderWithTheme(
      <PortalHost>
        <Portal>
          <Text>first</Text>
        </Portal>
      </PortalHost>,
    )
    expect(await screen.findByText('first')).toBeTruthy()
    rerender(
      <PortalHost>
        <Portal>
          <Text>second</Text>
        </Portal>
      </PortalHost>,
    )
    expect(await screen.findByText('second')).toBeTruthy()
    expect(screen.queryByText('first')).toBeNull()
  })

  it('renders multiple Portals in mount order', async () => {
    renderWithTheme(
      <PortalHost>
        <Portal>
          <Text>first</Text>
        </Portal>
        <Portal>
          <Text>second</Text>
        </Portal>
      </PortalHost>,
    )
    expect(await screen.findByText('first')).toBeTruthy()
    expect(await screen.findByText('second')).toBeTruthy()
  })

  it('renders inline with a dev error when no PortalHost ancestor', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    renderWithTheme(
      <Portal>
        <Text>fallback</Text>
      </Portal>,
    )
    expect(screen.getByText('fallback')).toBeTruthy()
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})
