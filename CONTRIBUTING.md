# Contributing to RootNative UI

Thanks for contributing. This project is a `pnpm` monorepo with shared packages and an Expo example app, so keeping changes scoped and verifiable is important.

## Development Stack

| Tool | Version |
| --- | --- |
| Node.js | >= 18 |
| pnpm | 9.x |
| Expo SDK | 54 |
| React Native | 0.81.5 |
| React | 19.1 |
| TypeScript | 5.x (strict) |

## Setup

```bash
git clone https://github.com/rootnative/ui.git
cd ui
pnpm install
pnpm run build
```

## Workflow

1. Create a feature branch from `main`.
2. Implement or update source in `packages/core/src` or `packages/components/src`.
3. Build packages with `pnpm run build`.
4. Validate behavior in the example app (`pnpm run example`).
5. Run `pnpm run lint` and `pnpm run format` before opening a PR.

## Useful Commands

| Command | Description |
| --- | --- |
| `pnpm run build` | Build all packages. |
| `pnpm run typecheck` | Type-check all packages. |
| `pnpm run test` | Run all tests. |
| `pnpm run lint` | Lint all packages. |
| `pnpm run format` | Format with Prettier. |
| `pnpm --filter @rootnative/core build` | Build core package only. |
| `pnpm --filter @rootnative/components build` | Build components package only. |

## Code Style

- No semicolons, single quotes, trailing commas (see `.prettierrc`).
- Components export types, styles, and component from separate files (`types.ts`, `styles.ts`, `ComponentName.tsx`).
- Theme values accessed via `useTheme()` hook from `@rootnative/core`.
