/**
 * DOM-level net for **Container on web**. The native suite reads the React
 * prop. This file reads the inline style react-native-web wrote, because the
 * width rule is a dynamic `useMemo` object and takes RNW's inline path.
 */
import { Text } from 'react-native'
import { Container } from '../../layout'
import { renderWeb } from './render-web'

function renderContainer(ui: Parameters<typeof renderWeb>[0]) {
  const { container } = renderWeb(ui)
  const node = container.querySelector(
    '[data-testid="container"]',
  ) as HTMLElement
  expect(node).toBeTruthy()
  return node
}

describe('the width rule reaches the DOM', () => {
  it('writes max-width, width and align-self for the default band', () => {
    const node = renderContainer(
      <Container testID="container">
        <Text>A</Text>
      </Container>,
    )
    expect(node.style.maxWidth).toBe('600px')
    expect(node.style.width).toBe('100%')
    expect(node.style.alignSelf).toBe('center')
  })

  it('writes the band the width prop names', () => {
    const node = renderContainer(
      <Container testID="container" width="large">
        <Text>A</Text>
      </Container>,
    )
    expect(node.style.maxWidth).toBe('1200px')
  })

  it('keeps the padding inside the limit', () => {
    const node = renderContainer(
      <Container testID="container" p="lg">
        <Text>A</Text>
      </Container>,
    )
    expect(node.style.maxWidth).toBe('600px')
    expect(node.style.paddingTop).toBe('24px')
    expect(node.style.paddingLeft).toBe('24px')
  })
})
