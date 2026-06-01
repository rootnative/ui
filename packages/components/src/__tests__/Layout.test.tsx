import { renderWithTheme } from '@rootnative/utils/test'
import { screen } from '@testing-library/react-native'
import { StyleSheet, Text } from 'react-native'
import { Box } from '../layout/Box'
import { Column } from '../layout/Column'
import { Grid } from '../layout/Grid'
import { Layout } from '../layout/Layout'
import { Row } from '../layout/Row'

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
    const root = toJSON()
    // Grid is a Row (View) containing cell wrapper Views
    const cells = root.children.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (child: any) => child.type === 'View',
    )
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
    const root = toJSON()
    const cells = root.children.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (child: any) => child.type === 'View',
    )
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
    const root = toJSON()
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
    const root = toJSON()
    const cells = root.children.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (child: any) => child.type === 'View',
    )
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
    const root = toJSON()
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
    const root = toJSON()
    const cells = root.children.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (child: any) => child.type === 'View',
    )
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
    const root = toJSON()
    const cells = root.children.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (child: any) => child.type === 'View',
    )
    expect(cells.length).toBe(2)
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
    const root = toJSON()
    const flatStyle = StyleSheet.flatten(root.props.style)
    expect(flatStyle.flex).toBe(1)
  })

  it('applies the theme background color', () => {
    const { toJSON } = renderWithTheme(
      <Layout>
        <Text>Content</Text>
      </Layout>,
    )
    const root = toJSON()
    const flatStyle = StyleSheet.flatten(root.props.style)
    expect(flatStyle.backgroundColor).toBeDefined()
  })

  it('merges the style prop', () => {
    const { toJSON } = renderWithTheme(
      <Layout style={styles.border}>
        <Text>Content</Text>
      </Layout>,
    )
    const root = toJSON()
    const flatStyle = StyleSheet.flatten(root.props.style)
    expect(flatStyle.borderWidth).toBe(1)
  })

  it('strips backgroundColor from the style prop', () => {
    const { toJSON } = renderWithTheme(
      <Layout style={styles.borderWithBackground}>
        <Text>Content</Text>
      </Layout>,
    )
    const root = toJSON()
    const flatStyle = StyleSheet.flatten(root.props.style)
    // backgroundColor should be the theme color, not the override
    expect(flatStyle.backgroundColor).not.toBe('#FF0000')
    expect(flatStyle.borderWidth).toBe(1)
  })
})

const styles = StyleSheet.create({
  border: { borderWidth: 1 },
  borderWithBackground: { backgroundColor: '#FF0000', borderWidth: 1 },
})
