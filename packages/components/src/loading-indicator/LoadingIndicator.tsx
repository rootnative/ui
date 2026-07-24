import { useTheme } from '@rootnative/core'
import { cubicBezier, useAnimation, useSpring } from '@rootnative/inertia'
import { Animated, useAnimatedProps } from '@rootnative/inertia/reanimated'
import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import {
  DETERMINATE_POINTS,
  INDETERMINATE_POINTS,
  pointsToPath,
  SAMPLE_COUNT,
} from './shapes'
import {
  createStyles,
  getLoadingIndicatorColors,
  LOADING_INDICATOR_ACTIVE_RATIO,
  LOADING_INDICATOR_SIZE,
} from './styles'
import type { LoadingIndicatorProps } from './types'

const AnimatedPath = Animated.createAnimatedComponent(Path)

// MD3 pinned motion constants (androidx LoadingIndicator.kt) — component
// constants, not theme tokens.
const MORPH_INTERVAL_MS = 650
const GLOBAL_ROTATION_MS = 4666
const QUARTER_ROTATION = 90
// The morph spring: spring(dampingRatio 0.6, stiffness 200). Not one of the
// theme's named tokens (fast-spatial is 800/0.6, slow-spatial 200/0.8), so
// it's expressed inline. friction = 0.6 * 2 * sqrt(200) ≈ 16.97.
const MORPH_SPRING = { tension: 200, friction: 16.97, mass: 1 } as const

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max)

export function LoadingIndicator({
  progress,
  contained = false,
  size = LOADING_INDICATOR_SIZE,
  indicatorColor,
  containerColor,
  style,
  accessibilityLabel,
  ...rest
}: LoadingIndicatorProps) {
  const theme = useTheme()
  const indeterminate = progress === undefined
  const styles = useMemo(() => createStyles(size), [size])
  const colors = useMemo(
    () =>
      getLoadingIndicatorColors(
        theme,
        contained,
        indicatorColor,
        containerColor,
      ),
    [theme, contained, indicatorColor, containerColor],
  )

  const shapes = indeterminate ? INDETERMINATE_POINTS : DETERMINATE_POINTS
  const shapeCount = shapes.length
  // Flatten the point loops into plain number arrays so the worklet reads
  // them without object access on the UI thread.
  const flatShapes = useMemo(
    () => shapes.map((pts) => pts.flatMap((p) => [p.x, p.y])),
    [shapes],
  )
  const center = size / 2
  const scale = (size * LOADING_INDICATOR_ACTIVE_RATIO) / 2

  // --- Morph position -------------------------------------------------------
  // Indeterminate: `morphStep` steps 0,1,2,… every MORPH_INTERVAL_MS (JS
  // state, so `useSpring` takes its clean plain-number path) and a spring
  // chases it, easing the polygon from shape to shape. Determinate: the
  // position is progress * (shapeCount - 1), driven directly.
  const [morphStep, setMorphStep] = useState(0)
  const determinateValue = indeterminate
    ? 0
    : clamp(progress as number, 0, 1) * (shapeCount - 1)
  const morphSpring = useSpring(morphStep, MORPH_SPRING)

  useEffect(() => {
    if (!indeterminate) return
    const id = setInterval(() => setMorphStep((s) => s + 1), MORPH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [indeterminate])

  // --- Global spin ----------------------------------------------------------
  // Indeterminate: a linear 0→1 phase looping every GLOBAL_ROTATION_MS (one
  // full turn). Reduced motion pins it to 1 (no spin) via useAnimation.
  // Determinate: no global spin.
  const spinTransition = useMemo(
    () => ({
      type: 'timing' as const,
      duration: GLOBAL_ROTATION_MS,
      easing: cubicBezier('linear'),
      repeat: { count: 'infinite' as const, alternate: false },
    }),
    [],
  )
  const spinPhase = useAnimation(indeterminate ? 1 : 0, spinTransition)

  // Both the shape morph and the rotation are folded into the single animated
  // `d` string (via pointsToPath's rotation arg) — no SVG group transform,
  // which react-native-svg-web maps poorly. Rotation = global spin (2π*phase)
  // + per-morph +90° kick (indeterminate), or -progress*180° (determinate).
  const animatedPathProps = useAnimatedProps(() => {
    const n = SAMPLE_COUNT
    const count = flatShapes.length
    const pos = indeterminate ? morphSpring.value : determinateValue
    const from = ((Math.floor(pos) % count) + count) % count
    const to = (from + 1) % count
    const frac = pos - Math.floor(pos)
    const a = flatShapes[from]
    const b = flatShapes[to]
    const pts = []
    for (let i = 0; i < n; i++) {
      const x = a[i * 2] + (b[i * 2] - a[i * 2]) * frac
      const y = a[i * 2 + 1] + (b[i * 2 + 1] - a[i * 2 + 1]) * frac
      pts.push({ x, y })
    }
    const deg = indeterminate
      ? spinPhase.value * 360 + pos * QUARTER_ROTATION
      : -pos * 180
    return { d: pointsToPath(pts, scale, center, (deg * Math.PI) / 180) }
  }, [flatShapes, scale, center, indeterminate, determinateValue])

  const accessibilityValue = indeterminate
    ? undefined
    : {
        min: 0,
        max: 100,
        now: Math.round(clamp(progress as number, 0, 1) * 100),
      }

  const renderIndicator = () => (
    <Svg width={size} height={size}>
      <AnimatedPath animatedProps={animatedPathProps} fill={colors.indicator} />
    </Svg>
  )

  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: colors.container }],
    [styles.container, colors.container],
  )

  const body = contained ? (
    <View style={containerStyle}>{renderIndicator()}</View>
  ) : (
    renderIndicator()
  )

  return (
    <View
      {...rest}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={accessibilityValue}
      style={[styles.root, style]}
    >
      {body}
    </View>
  )
}
