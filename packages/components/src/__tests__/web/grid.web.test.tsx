/**
 * DOM-level regression net for **Grid on web**.
 *
 * Why this file exists: `Grid` writes its cell geometry as
 * `flexBasis: \`${100 / columns}%\` as unknown as number`. That cast turns
 * TypeScript off, and the native suite asserts on the React prop — so nothing
 * before this file proved react-native-web emits a real `flex-basis: 50%` to
 * the DOM. These tests read the DOM RNW actually produced.
 *
 * **What RNW does to the gutter, observed against RNW 0.21 rather than taken
 * on trust.** The cell and row styles are dynamic (`useMemo` objects), so RNW
 * takes the *inline* path, not the `StyleSheet`-class path — and the inline
 * path resolves logical properties to **physical** ones at render time against
 * RNW's locale context (LTR by default): the DOM shows `padding-left`, never
 * `padding-inline-start`. The logical-property emission documented for RNW
 * applies to class-based styles only.
 *
 * The consequence: the gutter's direction-correctness on web does NOT come
 * from logical CSS reaching the browser. It comes from the gutter being
 * **symmetric** — `paddingStart === paddingEnd` and `marginStart === marginEnd`
 * — which makes the physical resolution direction-invariant. That symmetry is
 * therefore the load-bearing invariant this file pins, together with the
 * padding/margin cancellation (a drift between the two is a horizontal
 * overflow bug on web). The native suite keeps asserting the logical *source*
 * keys, which is what native platforms consume.
 *
 * Styles are read off `node.style` (the inline attribute), not
 * `getComputedStyle`: jsdom returns `''` for shorthand-expanded computed
 * paddings here, while the inline reader sees exactly what RNW wrote.
 * `flex-basis` is additionally read through `getComputedStyle` because it
 * survives both readers and that is the one a browser lays out from.
 */
import { Dimensions, Text } from 'react-native'
import { Grid } from '../../layout'
import { renderWeb } from './render-web'

function renderGrid(ui: Parameters<typeof renderWeb>[0]) {
  const { container } = renderWeb(ui)
  const row = container.querySelector('[data-testid="grid"]') as HTMLElement
  expect(row).toBeTruthy()
  return { row, cells: Array.from(row.children) as HTMLElement[] }
}

describe('cell flex-basis reaches the DOM as a real percentage', () => {
  it('emits flex-basis: 50% for two columns', () => {
    const { cells } = renderGrid(
      <Grid testID="grid" columns={2}>
        <Text>A</Text>
        <Text>B</Text>
      </Grid>,
    )
    expect(cells[0].style.flexBasis).toBe('50%')
    expect(getComputedStyle(cells[0]).flexBasis).toBe('50%')
  })

  it('emits flex-basis: 25% for four columns', () => {
    const { cells } = renderGrid(
      <Grid testID="grid" columns={4}>
        <Text>A</Text>
      </Grid>,
    )
    expect(cells[0].style.flexBasis).toBe('25%')
  })

  it('resolves a breakpoint map against the window width', () => {
    // RNW's Dimensions reads layout values jsdom does not implement (it
    // reports width 0 → `compact`), so pin the width explicitly. 1024px is
    // the `expanded` size class (840–1199).
    jest
      .spyOn(Dimensions, 'get')
      .mockReturnValue({ width: 1024, height: 768, scale: 1, fontScale: 1 })
    try {
      const { cells } = renderGrid(
        <Grid testID="grid" columns={{ compact: 1, expanded: 4 }}>
          <Text>A</Text>
        </Grid>,
      )
      expect(cells[0].style.flexBasis).toBe('25%')
    } finally {
      jest.restoreAllMocks()
    }
  })
})

describe('cell structure', () => {
  it('wraps each non-null child in exactly one cell', () => {
    const { cells } = renderGrid(
      <Grid testID="grid" columns={2}>
        <Text>A</Text>
        {null}
        <Text>B</Text>
        <Text>C</Text>
      </Grid>,
    )
    expect(cells.length).toBe(3)
  })
})

describe('the gutter is symmetric and cancels exactly', () => {
  function renderGutterGrid() {
    // gap="md" resolves to 16, so the half-gap is 8.
    return renderGrid(
      <Grid testID="grid" columns={2} gap="md">
        <Text>A</Text>
        <Text>B</Text>
      </Grid>,
    )
  }

  it('gives every cell equal padding on both sides', () => {
    const { cells } = renderGutterGrid()
    for (const cell of cells) {
      expect(cell.style.paddingLeft).toBe('8px')
      expect(cell.style.paddingRight).toBe('8px')
    }
  })

  it('gives the row equal negative margin on both sides', () => {
    const { row } = renderGutterGrid()
    expect(row.style.marginLeft).toBe('-8px')
    expect(row.style.marginRight).toBe('-8px')
  })

  /**
   * The overflow invariant: the row's negative margin must be the exact
   * negation of the cell padding. If the two drift, either the outer cells
   * stop sitting flush with the parent edge, or the row overhangs its parent
   * and a web scroll container grows a horizontal scrollbar.
   */
  it('row margin is the exact negation of the cell padding', () => {
    const { row, cells } = renderGutterGrid()
    expect(parseFloat(row.style.marginLeft)).toBe(
      -parseFloat(cells[0].style.paddingLeft),
    )
    expect(parseFloat(row.style.marginRight)).toBe(
      -parseFloat(cells[0].style.paddingRight),
    )
  })

  it('emits no gutter at all when gap is unset', () => {
    const { row, cells } = renderGrid(
      <Grid testID="grid" columns={2}>
        <Text>A</Text>
        <Text>B</Text>
      </Grid>,
    )
    // "0px", "-0px" and "" are all a zero gutter; a non-zero value is the
    // bug. Math.abs folds -0 into 0, which Object.is would keep apart.
    expect(Math.abs(parseFloat(cells[0].style.paddingLeft) || 0)).toBe(0)
    expect(Math.abs(parseFloat(row.style.marginLeft) || 0)).toBe(0)
  })
})
