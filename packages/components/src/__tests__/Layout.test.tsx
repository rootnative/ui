import { Motion, Stagger } from '@rootnative/inertia'
import { renderWithTheme } from '@rootnative/utils/test'
import { screen } from '@testing-library/react-native'
import { Dimensions, StyleSheet, Text } from 'react-native'
import * as Reanimated from 'react-native-reanimated'
import { Box } from '../layout/Box'
import { Column } from '../layout/Column'
import { Grid } from '../layout/Grid'
import { GridCell } from '../layout/GridCell'
import { Layout } from '../layout/Layout'
import { Row } from '../layout/Row'
import type { GridProps } from '../layout/types'
import { childrenOf, findChild, rootOf } from '../test-support/rendered-node'

describe('Box', () => {
  it('renders children', () => {
    renderWithTheme(
      <Box>
        <Text>Hello</Text>
      </Box>,
    )
    expect(screen.getByText('Hello')).toBeTruthy()
  })

  it('resolves spacing token for padding', () => {
    renderWithTheme(
      <Box testID="box" p="md">
        <Text>Content</Text>
      </Box>,
    )
    const flatStyle = StyleSheet.flatten(screen.getByTestId('box').props.style)
    expect(flatStyle.padding).toBe(16)
  })

  it('accepts a raw number for padding', () => {
    renderWithTheme(
      <Box testID="box" p={10}>
        <Text>Content</Text>
      </Box>,
    )
    const flatStyle = StyleSheet.flatten(screen.getByTestId('box').props.style)
    expect(flatStyle.padding).toBe(10)
  })

  it('applies px as paddingStart and paddingEnd', () => {
    renderWithTheme(
      <Box testID="box" px="sm">
        <Text>Content</Text>
      </Box>,
    )
    const flatStyle = StyleSheet.flatten(screen.getByTestId('box').props.style)
    expect(flatStyle.paddingStart).toBe(8)
    expect(flatStyle.paddingEnd).toBe(8)
  })

  it('applies py as paddingTop and paddingBottom', () => {
    renderWithTheme(
      <Box testID="box" py="lg">
        <Text>Content</Text>
      </Box>,
    )
    const flatStyle = StyleSheet.flatten(screen.getByTestId('box').props.style)
    expect(flatStyle.paddingTop).toBe(24)
    expect(flatStyle.paddingBottom).toBe(24)
  })

  it('applies individual padding props', () => {
    renderWithTheme(
      <Box testID="box" pt="xs" pb="sm" ps="md" pe="lg">
        <Text>Content</Text>
      </Box>,
    )
    const flatStyle = StyleSheet.flatten(screen.getByTestId('box').props.style)
    expect(flatStyle.paddingTop).toBe(4)
    expect(flatStyle.paddingBottom).toBe(8)
    expect(flatStyle.paddingStart).toBe(16)
    expect(flatStyle.paddingEnd).toBe(24)
  })

  it('applies margin tokens', () => {
    renderWithTheme(
      <Box testID="box" m="md">
        <Text>Content</Text>
      </Box>,
    )
    const flatStyle = StyleSheet.flatten(screen.getByTestId('box').props.style)
    expect(flatStyle.margin).toBe(16)
  })

  it('applies mx as marginStart and marginEnd', () => {
    renderWithTheme(
      <Box testID="box" mx="sm">
        <Text>Content</Text>
      </Box>,
    )
    const flatStyle = StyleSheet.flatten(screen.getByTestId('box').props.style)
    expect(flatStyle.marginStart).toBe(8)
    expect(flatStyle.marginEnd).toBe(8)
  })

  it('applies my as marginTop and marginBottom', () => {
    renderWithTheme(
      <Box testID="box" my="lg">
        <Text>Content</Text>
      </Box>,
    )
    const flatStyle = StyleSheet.flatten(screen.getByTestId('box').props.style)
    expect(flatStyle.marginTop).toBe(24)
    expect(flatStyle.marginBottom).toBe(24)
  })

  it('applies individual margin props', () => {
    renderWithTheme(
      <Box testID="box" mt="xs" mb="sm" ms="md" me="lg">
        <Text>Content</Text>
      </Box>,
    )
    const flatStyle = StyleSheet.flatten(screen.getByTestId('box').props.style)
    expect(flatStyle.marginTop).toBe(4)
    expect(flatStyle.marginBottom).toBe(8)
    expect(flatStyle.marginStart).toBe(16)
    expect(flatStyle.marginEnd).toBe(24)
  })

  it('applies gap token', () => {
    renderWithTheme(
      <Box testID="box" gap="md">
        <Text>A</Text>
        <Text>B</Text>
      </Box>,
    )
    const flatStyle = StyleSheet.flatten(screen.getByTestId('box').props.style)
    expect(flatStyle.gap).toBe(16)
  })

  it('applies rowGap and columnGap tokens', () => {
    renderWithTheme(
      <Box testID="box" rowGap="sm" columnGap="lg">
        <Text>A</Text>
      </Box>,
    )
    const flatStyle = StyleSheet.flatten(screen.getByTestId('box').props.style)
    expect(flatStyle.rowGap).toBe(8)
    expect(flatStyle.columnGap).toBe(24)
  })

  it('applies flex, align, justify, and bg', () => {
    renderWithTheme(
      <Box
        testID="box"
        flex={1}
        align="center"
        justify="space-between"
        bg="#FF0000"
      >
        <Text>A</Text>
      </Box>,
    )
    const flatStyle = StyleSheet.flatten(screen.getByTestId('box').props.style)
    expect(flatStyle.flex).toBe(1)
    expect(flatStyle.alignItems).toBe('center')
    expect(flatStyle.justifyContent).toBe('space-between')
    expect(flatStyle.backgroundColor).toBe('#FF0000')
  })

  it('merges the style prop with layout props', () => {
    renderWithTheme(
      <Box testID="box" p="md" style={styles.border}>
        <Text>Content</Text>
      </Box>,
    )
    const flatStyle = StyleSheet.flatten(screen.getByTestId('box').props.style)
    expect(flatStyle.padding).toBe(16)
    expect(flatStyle.borderWidth).toBe(1)
  })
})

describe('Row', () => {
  it('sets flexDirection to row', () => {
    renderWithTheme(
      <Row testID="row">
        <Text>A</Text>
      </Row>,
    )
    const flatStyle = StyleSheet.flatten(screen.getByTestId('row').props.style)
    expect(flatStyle.flexDirection).toBe('row')
  })

  it('sets flexDirection to row-reverse when inverted', () => {
    renderWithTheme(
      <Row testID="row" inverted>
        <Text>A</Text>
      </Row>,
    )
    const flatStyle = StyleSheet.flatten(screen.getByTestId('row').props.style)
    expect(flatStyle.flexDirection).toBe('row-reverse')
  })

  it('sets flexWrap when wrap is true', () => {
    renderWithTheme(
      <Row testID="row" wrap>
        <Text>A</Text>
      </Row>,
    )
    const flatStyle = StyleSheet.flatten(screen.getByTestId('row').props.style)
    expect(flatStyle.flexWrap).toBe('wrap')
  })

  it('does not set flexWrap by default', () => {
    renderWithTheme(
      <Row testID="row">
        <Text>A</Text>
      </Row>,
    )
    const flatStyle = StyleSheet.flatten(screen.getByTestId('row').props.style)
    expect(flatStyle.flexWrap).toBeUndefined()
  })

  it('passes Box props through', () => {
    renderWithTheme(
      <Row testID="row" p="md" gap="sm">
        <Text>A</Text>
      </Row>,
    )
    const flatStyle = StyleSheet.flatten(screen.getByTestId('row').props.style)
    expect(flatStyle.padding).toBe(16)
    expect(flatStyle.gap).toBe(8)
  })
})

describe('Column', () => {
  it('sets flexDirection to column', () => {
    renderWithTheme(
      <Column testID="col">
        <Text>A</Text>
      </Column>,
    )
    const flatStyle = StyleSheet.flatten(screen.getByTestId('col').props.style)
    expect(flatStyle.flexDirection).toBe('column')
  })

  it('sets flexDirection to column-reverse when inverted', () => {
    renderWithTheme(
      <Column testID="col" inverted>
        <Text>A</Text>
      </Column>,
    )
    const flatStyle = StyleSheet.flatten(screen.getByTestId('col').props.style)
    expect(flatStyle.flexDirection).toBe('column-reverse')
  })

  it('passes Box props through', () => {
    renderWithTheme(
      <Column testID="col" p="lg" gap="xs">
        <Text>A</Text>
      </Column>,
    )
    const flatStyle = StyleSheet.flatten(screen.getByTestId('col').props.style)
    expect(flatStyle.padding).toBe(24)
    expect(flatStyle.gap).toBe(4)
  })
})

describe('Grid', () => {
  it('renders children', () => {
    renderWithTheme(
      <Grid columns={2}>
        <Text>A</Text>
        <Text>B</Text>
      </Grid>,
    )
    expect(screen.getByText('A')).toBeTruthy()
    expect(screen.getByText('B')).toBeTruthy()
  })

  it('wraps children in cells with correct flex basis', () => {
    const { toJSON } = renderWithTheme(
      <Grid columns={3}>
        <Text>A</Text>
        <Text>B</Text>
        <Text>C</Text>
      </Grid>,
    )
    const root = rootOf(toJSON())
    // Grid is a Row (View) containing cell wrapper Views
    const cells = childrenOf(root).filter((child) => child.type === 'View')
    expect(cells.length).toBe(3)
    const cellStyle = StyleSheet.flatten(cells[0].props.style)
    // 100 / 3 ≈ 33.333...%
    expect(cellStyle.flexBasis).toMatch(/^33\.3/)
  })

  it('uses paddingStart/paddingEnd (not paddingLeft/paddingRight) for RTL-safe cell gaps', () => {
    const { toJSON } = renderWithTheme(
      <Grid columns={2} gap="md">
        <Text>A</Text>
        <Text>B</Text>
      </Grid>,
    )
    const root = rootOf(toJSON())
    const cells = childrenOf(root).filter((child) => child.type === 'View')
    const cellStyle = StyleSheet.flatten(cells[0].props.style)
    expect(cellStyle.paddingStart).toBeDefined()
    expect(cellStyle.paddingEnd).toBeDefined()
    expect(cellStyle.paddingLeft).toBeUndefined()
    expect(cellStyle.paddingRight).toBeUndefined()
  })

  it('uses marginStart/marginEnd (not marginLeft/marginRight) for RTL-safe row offset', () => {
    const { toJSON } = renderWithTheme(
      <Grid columns={2} gap="md">
        <Text>A</Text>
        <Text>B</Text>
      </Grid>,
    )
    const root = rootOf(toJSON())
    const rowStyle = StyleSheet.flatten(root.props.style)
    expect(rowStyle.marginStart).toBeDefined()
    expect(rowStyle.marginEnd).toBeDefined()
    expect(rowStyle.marginLeft).toBeUndefined()
    expect(rowStyle.marginRight).toBeUndefined()
  })

  it('cell paddingStart equals half of the resolved column gap', () => {
    const { toJSON } = renderWithTheme(
      <Grid columns={2} gap="md">
        <Text>A</Text>
        <Text>B</Text>
      </Grid>,
    )
    const root = rootOf(toJSON())
    const cells = childrenOf(root).filter((child) => child.type === 'View')
    const cellStyle = StyleSheet.flatten(cells[0].props.style)
    // "md" spacing token = 16, half = 8
    expect(cellStyle.paddingStart).toBe(8)
    expect(cellStyle.paddingEnd).toBe(8)
  })

  it('row marginStart is negative half of the resolved column gap', () => {
    const { toJSON } = renderWithTheme(
      <Grid columns={2} gap="md">
        <Text>A</Text>
        <Text>B</Text>
      </Grid>,
    )
    const root = rootOf(toJSON())
    const rowStyle = StyleSheet.flatten(root.props.style)
    // "md" spacing token = 16, half = 8, negative = -8
    expect(rowStyle.marginStart).toBe(-8)
    expect(rowStyle.marginEnd).toBe(-8)
  })

  it('applies no padding or margin offset when gap is not set', () => {
    const { toJSON } = renderWithTheme(
      <Grid columns={2}>
        <Text>A</Text>
        <Text>B</Text>
      </Grid>,
    )
    const root = rootOf(toJSON())
    const cells = childrenOf(root).filter((child) => child.type === 'View')
    const cellStyle = StyleSheet.flatten(cells[0].props.style)
    const rowStyle = StyleSheet.flatten(root.props.style)
    expect(cellStyle.paddingStart).toBe(0)
    expect(cellStyle.paddingEnd).toBe(0)
    expect(rowStyle.marginStart).toBe(-0)
    expect(rowStyle.marginEnd).toBe(-0)
  })

  it('skips null children', () => {
    const { toJSON } = renderWithTheme(
      <Grid columns={2}>
        <Text>A</Text>
        {null}
        <Text>B</Text>
      </Grid>,
    )
    const root = rootOf(toJSON())
    const cells = childrenOf(root).filter((child) => child.type === 'View')
    expect(cells.length).toBe(2)
  })

  describe('responsive columns', () => {
    // useWindowDimensions seeds from Dimensions.get('window'), and the
    // Dimensions instance is shared, so this spy reaches the hook. A spy on
    // a namespace import would not: Babel's interop hands the test a copy.
    const mockWidth = (width: number) =>
      jest
        .spyOn(Dimensions, 'get')
        .mockReturnValue({ width, height: 800, scale: 2, fontScale: 1 })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    const firstCellBasis = (columns: GridProps['columns']) => {
      const { toJSON } = renderWithTheme(
        <Grid columns={columns}>
          <Text>A</Text>
          <Text>B</Text>
        </Grid>,
      )
      const cells = childrenOf(rootOf(toJSON())).filter(
        (child) => child.type === 'View',
      )
      return StyleSheet.flatten(cells[0].props.style).flexBasis
    }

    it('picks the value for the current breakpoint from a map', () => {
      mockWidth(900) // expanded (>= 840)
      expect(firstCellBasis({ compact: 1, medium: 2, expanded: 4 })).toBe('25%')
    })

    it('uses the compact value below 600dp', () => {
      mockWidth(400) // compact (< 600)
      expect(firstCellBasis({ compact: 1, medium: 2, expanded: 4 })).toBe(
        '100%',
      )
    })

    it('cascades down to the nearest smaller breakpoint', () => {
      mockWidth(1300) // large (>= 1200), map has no large key
      expect(firstCellBasis({ compact: 1, medium: 2 })).toBe('50%')
    })

    it('keeps a plain number constant across breakpoints', () => {
      mockWidth(400)
      expect(firstCellBasis(3)).toMatch(/^33\.3/)
      jest.restoreAllMocks()
      mockWidth(1300)
      expect(firstCellBasis(3)).toMatch(/^33\.3/)
    })
  })

  describe('Grid.Cell', () => {
    const cellBasis = (testID: string) =>
      StyleSheet.flatten(screen.getByTestId(testID).props.style).flexBasis

    it('is exposed as a namespace property and a named export', () => {
      expect(Grid.Cell).toBe(GridCell)
    })

    it('spans the given fraction of the columns', () => {
      renderWithTheme(
        <Grid columns={12}>
          <Grid.Cell testID="main" span={8}>
            <Text>main</Text>
          </Grid.Cell>
          <Grid.Cell testID="aside" span={4}>
            <Text>aside</Text>
          </Grid.Cell>
        </Grid>,
      )
      expect(cellBasis('main')).toMatch(/^66\.6/)
      expect(cellBasis('aside')).toMatch(/^33\.3/)
    })

    it('is not wrapped in a default cell', () => {
      const { toJSON } = renderWithTheme(
        <Grid columns={2}>
          <Grid.Cell testID="cell">
            <Text>A</Text>
          </Grid.Cell>
        </Grid>,
      )
      // The cell's own View must be a direct child of the row — a wrapper
      // would pin the cell back to the default single-column basis.
      const root = rootOf(toJSON())
      expect(childrenOf(root).length).toBe(1)
      expect(childrenOf(root)[0].props.testID).toBe('cell')
    })

    it('defaults to a span of one column', () => {
      renderWithTheme(
        <Grid columns={4}>
          <Grid.Cell testID="cell">
            <Text>A</Text>
          </Grid.Cell>
        </Grid>,
      )
      expect(cellBasis('cell')).toBe('25%')
    })

    it('clamps an oversized span to the column count', () => {
      renderWithTheme(
        <Grid columns={4}>
          <Grid.Cell testID="cell" span={9}>
            <Text>A</Text>
          </Grid.Cell>
        </Grid>,
      )
      expect(cellBasis('cell')).toBe('100%')
    })

    it('clamps a zero span up to one column', () => {
      renderWithTheme(
        <Grid columns={4}>
          <Grid.Cell testID="cell" span={0}>
            <Text>A</Text>
          </Grid.Cell>
        </Grid>,
      )
      expect(cellBasis('cell')).toBe('25%')
    })

    it('takes half the column gap as padding, like a default cell', () => {
      renderWithTheme(
        <Grid columns={2} gap="md">
          <Grid.Cell testID="cell">
            <Text>A</Text>
          </Grid.Cell>
        </Grid>,
      )
      const flat = StyleSheet.flatten(screen.getByTestId('cell').props.style)
      // "md" spacing token = 16, half = 8
      expect(flat.paddingStart).toBe(8)
      expect(flat.paddingEnd).toBe(8)
    })

    it('mixes with plain children, which keep the default basis', () => {
      const { toJSON } = renderWithTheme(
        <Grid columns={4}>
          <Grid.Cell testID="wide" span={2}>
            <Text>wide</Text>
          </Grid.Cell>
          <Text>plain</Text>
        </Grid>,
      )
      expect(cellBasis('wide')).toBe('50%')
      // The plain child is wrapped in a default single-column cell — the row
      // child that is not the spanned one.
      const root = rootOf(toJSON())
      const wrapper = findChild(root, (child) => child.props.testID !== 'wide')
      expect(StyleSheet.flatten(wrapper.props.style).flexBasis).toBe('25%')
    })

    it('resolves a breakpoint-map span against the window width', () => {
      jest
        .spyOn(Dimensions, 'get')
        .mockReturnValue({ width: 900, height: 800, scale: 2, fontScale: 1 })
      try {
        renderWithTheme(
          <Grid columns={4}>
            <Grid.Cell testID="cell" span={{ compact: 4, expanded: 2 }}>
              <Text>A</Text>
            </Grid.Cell>
          </Grid>,
        )
        // 900dp → expanded → span 2 of 4
        expect(cellBasis('cell')).toBe('50%')
      } finally {
        jest.restoreAllMocks()
      }
    })

    it('warns and renders full-width outside a Grid', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
      try {
        renderWithTheme(
          <GridCell testID="stray">
            <Text>A</Text>
          </GridCell>,
        )
        expect(cellBasis('stray')).toBe('100%')
        expect(spy).toHaveBeenCalledWith(
          expect.stringContaining('<Grid.Cell> must be a direct child'),
        )
      } finally {
        spy.mockRestore()
      }
    })
  })
})

describe('Layout', () => {
  it('renders children', () => {
    renderWithTheme(
      <Layout>
        <Text>Content</Text>
      </Layout>,
    )
    expect(screen.getByText('Content')).toBeTruthy()
  })

  it('applies flex 1 to the root', () => {
    const { toJSON } = renderWithTheme(
      <Layout>
        <Text>Content</Text>
      </Layout>,
    )
    const root = rootOf(toJSON())
    const flatStyle = StyleSheet.flatten(root.props.style)
    expect(flatStyle.flex).toBe(1)
  })

  it('applies the theme background color', () => {
    const { toJSON } = renderWithTheme(
      <Layout>
        <Text>Content</Text>
      </Layout>,
    )
    const root = rootOf(toJSON())
    const flatStyle = StyleSheet.flatten(root.props.style)
    expect(flatStyle.backgroundColor).toBeDefined()
  })

  it('merges the style prop', () => {
    const { toJSON } = renderWithTheme(
      <Layout style={styles.border}>
        <Text>Content</Text>
      </Layout>,
    )
    const root = rootOf(toJSON())
    const flatStyle = StyleSheet.flatten(root.props.style)
    expect(flatStyle.borderWidth).toBe(1)
  })

  it('strips backgroundColor from the style prop', () => {
    const { toJSON } = renderWithTheme(
      <Layout style={styles.borderWithBackground}>
        <Text>Content</Text>
      </Layout>,
    )
    const root = rootOf(toJSON())
    const flatStyle = StyleSheet.flatten(root.props.style)
    // backgroundColor should be the theme color, not the override
    expect(flatStyle.backgroundColor).not.toBe('#FF0000')
    expect(flatStyle.borderWidth).toBe(1)
  })
})

/**
 * `<Stagger>` composing through `<Grid>`.
 *
 * `Stagger` renders a fragment of context providers and no host view, and
 * `React.Children.map` does not descend into a fragment. So a stagger
 * wrapping N cards reached `Grid` as one child and every card landed in a
 * single cell — a one-column grid, on the page the grid exists for.
 *
 * The delays were never the problem, and that is the part worth pinning:
 * `Stagger` assigns them per child, so they came out correct even while the
 * layout was collapsed. A test that only asserted on delays would have gone
 * green throughout. Both halves are checked below.
 */
describe('Grid + Stagger', () => {
  const cells = () => childrenOf(rootOf(screen.toJSON()))

  it('gives each staggered child its own cell', () => {
    renderWithTheme(
      <Grid columns={3}>
        <Stagger interval={50}>
          <Text>A</Text>
          <Text>B</Text>
          <Text>C</Text>
        </Stagger>
      </Grid>,
    )
    expect(cells()).toHaveLength(3)
    expect(screen.getByText('A')).toBeTruthy()
    expect(screen.getByText('C')).toBeTruthy()
  })

  it('gives those cells the same flex basis as plain children', () => {
    renderWithTheme(
      <Grid columns={2}>
        <Stagger interval={50}>
          <Text>A</Text>
          <Text>B</Text>
        </Stagger>
      </Grid>,
    )
    // Assert the count first: with the collapse, `cells()` is a single cell
    // that still reads 50%, so a loop on its own passes vacuously.
    expect(cells()).toHaveLength(2)
    for (const cell of cells()) {
      expect(StyleSheet.flatten(cell.props.style)).toMatchObject({
        flexBasis: '50%',
      })
    }
  })

  it('keeps the cascade intact through the cells', () => {
    const withDelay = jest.spyOn(Reanimated, 'withDelay')
    renderWithTheme(
      <Grid columns={3}>
        <Stagger interval={50}>
          <Motion.View initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
          <Motion.View initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
          <Motion.View initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
        </Stagger>
      </Grid>,
    )
    // Child 0's delay is 0, which `applyDelay` passes through, so only
    // children 1 and 2 reach `withDelay`.
    expect(withDelay.mock.calls.map((c) => c[0])).toEqual([50, 100])
    withDelay.mockRestore()
  })

  it('still honours a Grid.Cell span inside the stagger', () => {
    renderWithTheme(
      <Grid columns={4}>
        <Stagger interval={50}>
          <GridCell span={2}>
            <Text>wide</Text>
          </GridCell>
          <Text>narrow</Text>
        </Stagger>
      </Grid>,
    )
    const [wide, narrow] = cells()
    expect(StyleSheet.flatten(wide.props.style)).toMatchObject({
      flexBasis: '50%',
    })
    expect(StyleSheet.flatten(narrow.props.style)).toMatchObject({
      flexBasis: '25%',
    })
  })

  it('mixes staggered and plain children in one grid', () => {
    renderWithTheme(
      <Grid columns={2}>
        <Text>plain</Text>
        <Stagger interval={50}>
          <Text>A</Text>
          <Text>B</Text>
        </Stagger>
      </Grid>,
    )
    expect(cells()).toHaveLength(3)
  })
})

const styles = StyleSheet.create({
  border: { borderWidth: 1 },
  borderWithBackground: { backgroundColor: '#FF0000', borderWidth: 1 },
})
