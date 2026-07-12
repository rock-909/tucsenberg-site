---
paths:
  - "src/**/*.{ts,tsx}"
  - "tests/**/*.{ts,tsx}"
  - "scripts/**/*.{js,mjs,ts}"
  - "*config.{js,ts,mjs,mts}"
  - "eslint.config.mjs"
---

# Coding Standards

## TypeScript

- Keep `strict: true` and `noImplicitAny: true`.
- No `any` in production code.
- Default to `interface` for object shapes.
- Use `type` for unions, tuples, mapped types, and utility-heavy compositions.
- Prefer `const` objects plus union types over `enum`. `erasableSyntaxOnly` is
  on in `tsconfig.json`, so the compiler rejects non-erasable syntax (`enum`,
  `namespace`, constructor parameter properties) — this is enforced, not just a
  preference.
- Use `satisfies` for typed object literals.

With `exactOptionalPropertyTypes`, omit optional properties instead of passing
explicit `undefined`.

## Naming

| Type | Convention |
| --- | --- |
| Components | `PascalCase` |
| Hooks | `useSomething` |
| Utilities | `camelCase` |
| Constants | `SCREAMING_SNAKE` |
| Directories | `kebab-case` |
| Booleans | `is/has/can/should` |
| Event handlers | `handleSomething` |

## Imports

- Use the `@/` alias for app imports.
- Avoid deep relative imports except within the same small module folder.
- Treat boundary-safe modules as part of the import contract. Middleware,
  route handlers, and server-only modules must not import browser-only helpers
  through convenience barrels.
- Keep import order readable:
  1. React
  2. Next.js
  3. third-party packages
  4. `@/types`
  5. `@/lib`
  6. `@/components`
  7. `@/app`
  8. other `@/` aliases
  9. relative imports

## Logging

Production code uses the structured logger:

```typescript
import { logger } from "@/lib/logger";
logger.warn("Rate limit approaching", { remaining });
```

Server and client production code import `logger` from `@/lib/logger`; PII
sanitizers are server-use helpers and must not be called from Client Components.

No bare `console.*` in production code unless the file is explicitly a logger,
script, or test utility.

## Runtime assumptions

- Use Web standard APIs where they work across Next.js, Cloudflare, Vitest, and
  browser code.
- Node-only APIs belong behind explicit server/runtime boundaries.
- Do not add webpack-only behavior to application code. The current Next.js path
  is Turbopack-first; webpack configuration is a fallback boundary, not the
  source of truth for normal app behavior.

## User-facing text

All buyer-visible text belongs in content files or i18n messages, not inline
component literals, unless the string is a technical fallback that cannot be
translated safely.
