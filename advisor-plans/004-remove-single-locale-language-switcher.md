# Plan 004: Remove the single-locale language switcher UI (a control with no reachable second state)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a35dee1..HEAD -- src/components/layout src/config/language-display.ts src/config/paths/locales-config.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (touches header + mobile nav render paths and several test files)
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `a35dee1`, 2026-07-07

## Why this matters

The site has exactly one public locale (`en`), yet every page ships a
globe-icon language dropdown whose menu contains a single, permanently-checked
item ("English"). It can never switch anything. It costs a lazy JS chunk, an
activation state machine, a second copy for mobile, and ~600 lines of
component + test code — all maintaining a control with no reachable second
state. Removing it simplifies the header, shrinks the client surface, and
deletes dead test weight. The translation-key i18n runtime and `LOCALES_CONFIG`
are hard project constraints and are **not** touched — if a second locale ever
returns, the switcher is trivially reconstructable from git history.

## Current state

- `src/config/paths/locales-config.ts:6` — `locales: Object.freeze(["en"] as const)`.
  Proof the control is dead: `LANGUAGE_OPTIONS` below always has length 1.

- `src/components/layout/header-language-menu.tsx` (312 lines) — desktop
  dropdown. Key excerpt:

  ```ts
  // header-language-menu.tsx:41-47
  const LANGUAGE_OPTIONS: Array<{
    locale: HeaderLanguageLocale;
    label: string;
  }> = LOCALES_CONFIG.locales.map((locale) => ({
    locale,
    label: LANGUAGE_OPTION_LABELS[locale],
  }));
  ```

- `src/components/layout/header-client.tsx` — mounts it:
  - `:20-24` lazy import of `HeaderLanguageMenu`;
  - `:44-…` `LanguageToggleTrigger` (the globe button fallback);
  - `:142-171` `LanguageToggleIsland` (activation state machine + Suspense).

- `src/components/layout/header.tsx:216-218` — desktop slot:

  ```tsx
  <div className="header-full-desktop-only flex h-10 shrink-0 items-center">
    <LanguageToggleIsland locale={locale} />
  </div>
  ```

- `src/components/layout/mobile-language-switcher.tsx` (112 lines) — mobile
  copy, mounted at `src/components/layout/mobile-navigation-interactive.tsx:210-216`
  (with `isLanguageExpanded` state, `handleLanguageExpandedChange`, and a
  `languageLabel` prop threaded from messages), preceded by a
  `<Separator className="my-4" />`.

- `src/config/language-display.ts` (11 lines) — label re-exports consumed by
  the components above; `SiteLanguage` type is also used in
  `header-client.tsx` prop interfaces.

- Test surface referencing the control (from
  `grep -rln "LanguageToggle\|LanguageMenu\|LanguageSwitcher\|language-toggle" src tests`):
  - `src/components/layout/__tests__/header-language-menu.test.tsx` (delete)
  - `src/components/layout/__tests__/language-switcher/setup.tsx` (438-line harness; delete)
  - `src/components/layout/__tests__/header-client.test.tsx` (prune)
  - `src/components/layout/__tests__/header.test.tsx` (prune)
  - `src/components/layout/__tests__/mobile-navigation.test.tsx` (prune language sections)
  - `tests/integration/components/header.test.tsx` (prune)
  - `tests/integration/i18n-components.test.tsx` (prune)
  - `tests/e2e/navigation.spec.ts`, `tests/e2e/i18n-redirect-validation.spec.ts`,
    `tests/e2e/i18n.spec.ts` (prune switcher interactions ONLY — see step 5 caution)

- Repo conventions that apply:
  - `.claude/rules/conventions.md`: "Add future languages through
    `LOCALES_CONFIG`, not scattered route/header literals" — keep
    `LOCALES_CONFIG` fully intact, including `retiredLocales`.
  - Behavior contract `docs/项目基础/行为合约.md` BC-004 (root serves English
    without locale prefix) is middleware behavior, **independent** of this UI.
  - Messages: `languageLabel` and switcher-related message keys live in the
    governed `messages/` pipeline — leave all message packs and generated JSON
    untouched; an unused key is acceptable.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `pnpm install` | exit 0 |
| Typecheck | `pnpm type-check` | exit 0 |
| Layout tests | `pnpm exec vitest run src/components/layout tests/integration/components/header.test.tsx tests/integration/i18n-components.test.tsx` | all pass |
| Lint | `pnpm lint:check` | exit 0, zero warnings |
| Full suite | `pnpm test` | all pass |
| Build | `pnpm build` | exit 0 |
| E2E (if browsers installed) | `pnpm exec playwright test tests/e2e/navigation.spec.ts tests/e2e/i18n.spec.ts tests/e2e/i18n-redirect-validation.spec.ts` | all pass |

## Scope

**In scope**:
- Delete: `src/components/layout/header-language-menu.tsx`,
  `src/components/layout/mobile-language-switcher.tsx`,
  `src/components/layout/__tests__/header-language-menu.test.tsx`,
  `src/components/layout/__tests__/language-switcher/` (whole dir)
- Edit: `src/components/layout/header-client.tsx`,
  `src/components/layout/header.tsx`,
  `src/components/layout/mobile-navigation-interactive.tsx`,
  the six remaining test files listed above
- Possibly delete `src/config/language-display.ts` (step 4)
- `advisor-plans/README.md` (status row)

**Out of scope** (do NOT touch):
- `src/config/paths/locales-config.ts` — locale truth, stays whole.
- `src/middleware.ts` and locale-redirect behavior — BC-004 territory.
- `messages/**` (all packs and generated JSON) and `src/lib/i18n/**`.
- `next-intl` setup, `src/i18n/**`.
- Any visual redesign of the header beyond removing the slot — frontend design
  work is explicitly deferred by the owner.

Deletion mechanics: use `git rm` on a feature branch (history-recoverable) —
do not use plain `rm`.

## Git workflow

- Branch from `main`: `advisor/004-remove-language-switcher`
- Commit style: `refactor: remove single-locale language switcher ui`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Remove the desktop control

In `header-client.tsx`: delete the `HeaderLanguageMenu` lazy import (:20-24),
`LanguageToggleTrigger`, `LanguageToggleIsland` (:142-171), the
`LanguageToggleIslandProps`/`LanguageToggleTriggerProps` interfaces, and the
now-unused imports from `@/config/language-display`. In `header.tsx`, delete
the slot `<div className="header-full-desktop-only ...">…</div>` (:216-218)
and the `LanguageToggleIsland` import (:13).

**Verify**: `pnpm type-check` → exit 0.

### Step 2: Remove the mobile control

`git rm src/components/layout/mobile-language-switcher.tsx`. In
`mobile-navigation-interactive.tsx`: remove its import (:20), the mount block
(:210-216) **and the `<Separator className="my-4" />` directly above it**, the
`isLanguageExpanded` state and `handleLanguageExpandedChange` handler, and the
`languageLabel` prop from this component's props. Then follow the
`languageLabel` prop chain upward (`header-client.tsx`
`MobileNavigationIslandProps`, `header.tsx` where the label is read from
messages) and remove the dead threading — but leave the message key itself in
`messages/**` untouched.

**Verify**: `pnpm type-check` → exit 0.

### Step 3: Delete the desktop menu component

`git rm src/components/layout/header-language-menu.tsx`.

**Verify**: `grep -rn "HeaderLanguageMenu\|MobileLanguageSwitcher\|LanguageToggle" src --include='*.ts' --include='*.tsx'` → only hits (if any) are in test files still to be pruned.

### Step 4: Resolve `language-display.ts`

`grep -rn "language-display" src tests` — if the only remaining consumers were
the deleted components, `git rm src/config/language-display.ts`; if
`SiteLanguage` is still referenced (e.g. in `header-client.tsx` prop types),
replace those references with `ConfiguredLocale` from
`@/config/paths/locales-config` and then delete the file.

**Verify**: `pnpm type-check` → exit 0.

### Step 5: Prune the tests

- `git rm src/components/layout/__tests__/header-language-menu.test.tsx` and
  `git rm -r src/components/layout/__tests__/language-switcher/`.
- In each remaining listed test file, remove only the describe/it blocks and
  helpers that exercise the language toggle/menu/switcher. **Caution for the
  three e2e specs**: they also prove locale-redirect and `html[lang]` behavior
  (BC-004) — keep every assertion about URL redirects, `html[lang]`, retired
  locale prefixes, and 404s; remove only interactions with
  `language-toggle-button` / globe menu UI. If a single test conflates both
  concerns inseparably → STOP condition.

**Verify**: layout-tests command → all pass; `pnpm exec vitest run tests/integration` → all pass.

### Step 6: Full proof

**Verify**: `pnpm lint:check` → exit 0; `pnpm test` → all pass; `pnpm build`
→ exit 0. If Playwright browsers are installed, run the e2e command; if not,
note that in your report — CI runs the smoke suite.

## Test plan

No new tests. The deletions shrink the suite; remaining header/mobile-nav
tests (e.g. `mobile-navigation.test.tsx` drawer behavior) are the regression
net for the edited render paths. After step 5, run the full `pnpm test` to
prove no orphaned imports of the deleted harness remain.

## Done criteria

- [ ] `grep -rn "HeaderLanguageMenu\|MobileLanguageSwitcher\|LanguageToggle\|language-toggle-button" src tests --include='*.ts' --include='*.tsx'` → zero hits
- [ ] `pnpm type-check`, `pnpm lint:check`, `pnpm test`, `pnpm build` all exit 0
- [ ] `LOCALES_CONFIG` and `messages/**` are byte-identical to before (`git diff --stat` shows no changes there)
- [ ] `git status` shows no modified files outside the in-scope list
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `LOCALES_CONFIG.locales` no longer equals `["en"]` — a second locale was
  added since planning; this whole plan is then invalid.
- An e2e spec inseparably mixes switcher interaction with locale-redirect
  proof (step 5 caution) — report which spec and stop.
- Removing the header slot visibly breaks header layout in the header tests
  beyond the expected removed element (e.g. snapshot diffs in unrelated areas).
- Anything requires editing `messages/**`, `src/middleware.ts`, or
  `locales-config.ts`.

## Maintenance notes

- If a second public locale is ever added: restore the two components from git
  history (`git log --diff-filter=D --name-only`), re-add the mounts, and the
  `LOCALES_CONFIG`-driven options array will populate automatically.
- Reviewer should scrutinize: mobile drawer spacing after the Separator
  removal, and that no `usePathname`-related behavior in `header-client.tsx`
  was removed beyond the toggle island.
- Docs mention the language switcher as a *pattern example* in
  `.claude/rules/ui.md` ("Header and shared island state") — the guidance
  stays valid generically; no doc edit required. Optional follow-up: drop the
  stale example mention next time that rule file is edited.
