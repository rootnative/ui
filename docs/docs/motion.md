---
sidebar_position: 8
description: "Every animation runs on @rootnative/inertia: the theme owns the motion values, inertia owns the mechanism."
---

# Motion

Every animation in Root Native UI runs on [`@rootnative/inertia`](https://rootnative.github.io/inertia/). The theme owns the motion *values*, and inertia owns the *mechanism*. Nothing in the library calls the `Animated` API of React Native or `react-native-reanimated` directly.

Two things follow from that, and they're the whole page:

1. **Motion tokens are theme tokens.** Change `theme.motion`, and the timing of every component changes with it.
2. **Reduced motion works by default.** `ThemeProvider` opts the whole tree into the OS accessibility setting, and every animated component collapses to a hard cut when the setting is on.

## Setup

There is no setup. `ThemeProvider` already mounts the `<MotionConfig>` of inertia for you:

```tsx
import { ThemeProvider } from '@rootnative/core'

export default function App() {
  return (
    <ThemeProvider>
      {/* motion tokens registered, reduced motion respected */}
      <MyApp />
    </ThemeProvider>
  )
}
```

`@rootnative/inertia` is a **required** peer of both `@rootnative/core` and `@rootnative/components`, so npm and pnpm install it for you. With Yarn classic, add it by hand; see [Installation](./installation#peer-dependencies).

## Motion tokens

The `motion` group of the theme holds three kinds of value:

| Group | Tokens | Used for |
|-------|--------|----------|
| Durations | `durationShort1`–`durationExtraLong4` (50ms–1000ms) | Timing-based transitions |
| Easings | `easingLinear`, `easingStandard*`, `easingEmphasized*` | Cubic-bezier curves, as CSS-style strings |
| Springs | `springFastSpatial`, `springDefaultSpatial`, `springSlowSpatial`, `springFastEffects`, `springDefaultEffects`, `springSlowEffects` | Everything the components animate today |

The spring tokens follow the MD3 Expressive motion-physics scheme, pinned from androidx `ExpressiveMotionTokens.kt`. The names form a grid: **fast / default / slow** × **spatial / effects**.

- **Spatial** springs move things (position, size, corner radius, a thumb that slides). They overshoot: the damping ratio is 0.6 for fast, and 0.8 for default and slow.
- **Effects** springs change the appearance (color, opacity, state layers). They're critically damped and never overshoot.

```tsx
const theme = useTheme()

theme.motion.springFastSpatial   // { tension: 800, friction: 33.94, mass: 1 }
theme.motion.springFastEffects   // { tension: 3800, friction: 123.29, mass: 1 }
theme.motion.durationMedium2     // 300
theme.motion.easingEmphasized    // 'cubic-bezier(0.2, 0, 0, 1)'
```

`tension` / `friction` / `mass` is the react-spring vocabulary that inertia uses. `tension` is the `stiffness` of Compose, and `friction` is `dampingRatio * 2 * sqrt(tension)`.

### Named transitions

`ThemeProvider` registers each motion token with inertia under a string name. So wherever inertia accepts a transition, you can pass the name instead of the config:

| Name | Token |
|------|-------|
| `'state-hover'`, `'state-press'`, `'state-focus'` | `springFastEffects` |
| `'spring-fast-spatial'` | `springFastSpatial` |
| `'spring-default-spatial'` | `springDefaultSpatial` |
| `'spring-slow-spatial'` | `springSlowSpatial` |
| `'spring-fast-effects'` | `springFastEffects` |
| `'spring-default-effects'` | `springDefaultEffects` |
| `'spring-slow-effects'` | `springSlowEffects` |

```tsx
import { Motion } from '@rootnative/inertia'

<Motion.View animate={{ opacity: 1 }} transition="spring-default-effects" />
```

The names are also TypeScript types, so they autocomplete, and a typo is a compile error. Nest your own `<MotionConfig transitions>` to add more. Nested registries merge, and the child wins.

#### `motionTransitions` — build that registry yourself

The mapping in the table above is a pure function. It is exported for the case where you mount a `<MotionConfig>` that has no `ThemeProvider` as its parent:

```tsx
import { motionTransitions, useTheme } from '@rootnative/core'
import { MotionConfig } from '@rootnative/inertia'

function MotionIsland({ children }) {
  const theme = useTheme()
  return (
    <MotionConfig transitions={motionTransitions(theme.motion)}>
      {children}
    </MotionConfig>
  )
}
```

`motionTransitions(motion)` takes the `motion` object of a theme and returns the `NamedTransitions` of inertia: the nine names in the table, resolved against those tokens. You don't need it for normal use. `ThemeProvider` already calls it and feeds the result to its own `MotionConfig`, and a nested `MotionConfig` inherits what the parent registered. Use it in two cases: when you override `reducedMotion` on a nested config and want to carry the transitions of the theme through explicitly, or when you drive inertia outside a `ThemeProvider`.

### Retuning motion

Motion is part of the theme, so a retune is a theme override:

```tsx
import { ThemeProvider, lightTheme } from '@rootnative/core'

const calmTheme = {
  ...lightTheme,
  motion: {
    ...lightTheme.motion,
    // Critically damped — kill the Expressive overshoot everywhere.
    springDefaultSpatial: { tension: 380, friction: 39, mass: 1 },
  },
}

<ThemeProvider theme={calmTheme}>{children}</ThemeProvider>
```

Every component that references `springDefaultSpatial` picks up the new value. You thread no props through the components.

## Elevation on hover

Four components raise their shadow by one MD3 elevation level while hovered. They interpolate between the two levels, and don't swap them:

| Component | Rest → hover | Applies when |
|-----------|--------------|--------------|
| `Card` | `level1` → `level2` | `variant="elevated"`, interactive (`onPress` set), not disabled |
| `Button` | `level1` → `level2` | `variant="elevated"`, not disabled |
| `Chip` | `level1` → `level2` | `elevated`, on any variant except `input`, not disabled |
| `FAB` | `level3` → `level4` | Always (a FAB is elevated by definition), not disabled |

This is hover, so in practice it's the web, a trackpad, or a tablet with a pointer. Touch has no hover state, and nothing changes on a phone. A disabled surface stays flat at its rest level. The raise is interaction feedback, and a control that you can't interact with shouldn't offer it.

There's nothing to configure, and no prop to opt out. If you need a fixed shadow, set it in `style` on a non-interactive variant, or retune the elevation tokens of the theme. Both endpoints read `theme.elevation.*`, so a flatter theme also flattens the hover raise.

## Reduced motion

A user who sets **Reduce Motion** (iOS), **Remove animations** (Android), or `prefers-reduced-motion: reduce` (web) gets a library that still works and still changes state. It only stops the interpolation between states. A checkbox mark appears instead of a spring in, a switch thumb jumps to the other end, and the shape morph and the spin of the loading indicator both stop.

This is on by default. `ThemeProvider` mounts `<MotionConfig>` with the inertia default `reducedMotion="user"`, which reads the OS setting through the `useReducedMotion()` of Reanimated.

Every component animates something, so every component responds to the setting, except these five with no animated value at all: `Divider`, `KeyboardAvoidingWrapper`, `Layout` (`Box`, `Row`, `Column`, `Grid`), `Portal`, and `Typography`.

This includes the overlay surfaces. `Dialog`, `Menu`, `Tooltip`, `Snackbar` and `BottomSheet` all cut straight to their open state instead of a scale and a fade in. `BottomSheet` still drags: a gesture that you drive is not an animation, so reduced motion only collapses the settle after the release.

### Overriding it

Nest an inertia `<MotionConfig>` anywhere below `ThemeProvider`:

```tsx
import { MotionConfig } from '@rootnative/inertia'

// Force animations on for a subtree, ignoring the OS setting.
<MotionConfig reducedMotion="never">
  <Onboarding />
</MotionConfig>

// Force them off — useful for snapshot tests and screenshot tooling.
<MotionConfig reducedMotion="always">
  <App />
</MotionConfig>
```

| Value | Behavior |
|-------|----------|
| `'user'` | Default. Follows the OS accessibility setting. |
| `'never'` | Always animates, even when the user asked for no motion. |
| `'always'` | Never animates. |

Use `'never'` with care. It overrides an accessibility preference that the user set on purpose. It's defensible for a transition that carries a meaning nothing else conveys, and not much else.

Nested providers inherit: an omitted prop keeps the value of the ancestor.

## Animating your own components

If you build animated components beside the library, two rules keep them consistent with it.

**Use the named transitions of the theme**, not your own spring configs, so your motion retunes with the library:

```tsx
import { useAnimation } from '@rootnative/inertia'

const progress = useAnimation(open ? 1 : 0, 'spring-default-spatial')
```

**Use the hooks that gate on reduced motion.** inertia applies the gate inside `useAnimation`, `useAnimator`, `useGesture`, `useGestureLayer`, and the `Motion.*` primitives. On purpose, it does *not* gate `useSpring` / `useBooleanSpring`. Those are the raw mechanism, and a collapse there would strand a value in the middle of a drag at their gesture-smoothing call sites. So:

```tsx
// Gated — snaps under reduced motion.
const progress = useAnimation(selected ? 1 : 0, 'spring-fast-spatial')

// NOT gated — animates even when the user asked for no motion.
const progress = useBooleanSpring(selected)
```

The pure interpolators (`useInterpolatedStyle`, `useColorTransition`, `useTransform`, `useShadow`) need no gate of their own. They inherit it from the progress value that drives them.

To check your component, assert that no Reanimated primitive runs under `reducedMotion="always"`:

```tsx
import { MotionConfig } from '@rootnative/inertia'
import * as Reanimated from 'react-native-reanimated'

it('runs no animation primitive when reducedMotion="always"', () => {
  const withSpring = jest.spyOn(Reanimated, 'withSpring')

  render(
    <ThemeProvider>
      <MotionConfig reducedMotion="always">
        <MyAnimatedThing active />
      </MotionConfig>
    </ThemeProvider>,
  )

  expect(withSpring).not.toHaveBeenCalled()
})
```

That's the same invariant that the library holds itself to.
