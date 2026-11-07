# Contributing to Root Native UI

Thanks for your help. This project is a `pnpm` monorepo with shared packages and an Expo example app. Keep each change small, and make sure a reviewer can check it.

## Development Stack

| Tool | Version |
| --- | --- |
| Node.js | >= 18 |
| pnpm | 10.x |
| Expo SDK | 58 |
| React Native | 0.88.1 |
| React | 19.3.0 |
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
2. Change the source in `packages/core/src` or `packages/components/src`.
3. Build the packages with `pnpm run build`.
4. Check the change in the example app (`pnpm run example`).
5. Run `pnpm run lint` and `pnpm run format` before you open a PR.

## Useful Commands

| Command | Description |
| --- | --- |
| `pnpm run build` | Builds all packages. |
| `pnpm run typecheck` | Type-checks all packages. |
| `pnpm run test` | Runs all tests. |
| `pnpm run lint` | Lints all packages. |
| `pnpm run format` | Formats the code with Prettier. |
| `pnpm --filter @rootnative/core build` | Builds only the core package. |
| `pnpm --filter @rootnative/components build` | Builds only the components package. |

## Code Style

- No semicolons, single quotes, trailing commas (see `.prettierrc`).
- A component exports its types, its styles, and its component from separate files (`types.ts`, `styles.ts`, `ComponentName.tsx`).
- Read theme values with the `useTheme()` hook from `@rootnative/core`.
