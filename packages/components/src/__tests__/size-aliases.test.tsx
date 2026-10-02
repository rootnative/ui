import { renderWithTheme } from '@rootnative/utils/test'
import { screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { Avatar } from '../avatar/Avatar'
import { Button } from '../button/Button'
import { IconButton } from '../icon-button/IconButton'
import { canonicalSize, resolveSize } from '../internal/size'
import { __resetWarnOnceForTests } from '../internal/warnOnce'

/**
 * The old size names stay for one release. Each one must render the same
 * frame as its current name, and warn once per component and name.
 */
describe('old size names', () => {
  let error: jest.SpyInstance

  beforeEach(() => {
    __resetWarnOnceForTests()
    error = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    error.mockRestore()
  })

  it('maps every old name to a current one', () => {
    expect(canonicalSize('xs')).toBe('extraSmall')
    expect(canonicalSize('s')).toBe('small')
    expect(canonicalSize('m')).toBe('medium')
    expect(canonicalSize('l')).toBe('large')
    expect(canonicalSize('xl')).toBe('extraLarge')
    expect(canonicalSize('xSmall')).toBe('extraSmall')
    expect(canonicalSize('xLarge')).toBe('extraLarge')
    expect(canonicalSize('medium')).toBe('medium')
  })

  it.each([
    ['xs', 'extraSmall'],
    ['s', 'small'],
    ['m', 'medium'],
    ['l', 'large'],
    ['xl', 'extraLarge'],
  ] as const)('Button size="%s" renders as "%s"', (old, current) => {
    renderWithTheme(<Button size={old}>Old</Button>)
    const oldStyle = StyleSheet.flatten(screen.getByRole('button').props.style)
    screen.unmount()
    renderWithTheme(<Button size={current}>New</Button>)
    const newStyle = StyleSheet.flatten(screen.getByRole('button').props.style)
    expect(oldStyle.minHeight).toBe(newStyle.minHeight)
    expect(oldStyle.paddingStart).toBe(newStyle.paddingStart)
  })

  it.each([
    ['xs', 'extraSmall'],
    ['s', 'small'],
    ['m', 'medium'],
    ['l', 'large'],
    ['xl', 'extraLarge'],
  ] as const)('IconButton size="%s" renders as "%s"', (old, current) => {
    renderWithTheme(
      <IconButton icon="star" size={old} accessibilityLabel="Old" />,
    )
    const oldStyle = StyleSheet.flatten(screen.getByRole('button').props.style)
    screen.unmount()
    renderWithTheme(
      <IconButton icon="star" size={current} accessibilityLabel="New" />,
    )
    const newStyle = StyleSheet.flatten(screen.getByRole('button').props.style)
    expect(oldStyle.height).toBe(newStyle.height)
    expect(oldStyle.width).toBe(newStyle.width)
  })

  it.each([
    ['xSmall', 24],
    ['xLarge', 112],
  ] as const)('Avatar size="%s" is %dpx', (old, px) => {
    renderWithTheme(<Avatar testID="avatar" size={old} />)
    const style = StyleSheet.flatten(screen.getByTestId('avatar').props.style)
    expect(style.width).toBe(px)
    expect(style.height).toBe(px)
  })

  it('warns once per component and old name, and names the current one', () => {
    renderWithTheme(
      <>
        <Button size="xs">A</Button>
        <Button size="xs">B</Button>
        <Button size="s">C</Button>
        <IconButton icon="star" size="xs" accessibilityLabel="D" />
        <Avatar size="xSmall" />
      </>,
    )
    const messages = error.mock.calls.map((call) => String(call[0]))
    expect(messages).toHaveLength(4)
    expect(messages[0]).toContain('<Button size="xs">')
    expect(messages[0]).toContain('size="extraSmall"')
    expect(messages[1]).toContain('<Button size="s">')
    expect(messages[2]).toContain('<IconButton size="xs">')
    expect(messages[3]).toContain('<Avatar size="xSmall">')
  })

  it('does not warn for a current name', () => {
    renderWithTheme(
      <>
        <Button size="extraSmall">A</Button>
        <IconButton icon="star" size="small" accessibilityLabel="B" />
        <Avatar size="extraLarge" />
      </>,
    )
    expect(resolveSize('large', 'Test')).toBe('large')
    expect(error).not.toHaveBeenCalled()
  })
})
