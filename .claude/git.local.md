---
enabled: true
# Commit Message Conventions
scopes:
  - app          # Next.js app router
  - components   # UI components
  - config       # Configuration
  - hooks        # React hooks
  - i18n         # Internationalization
  - lib          # Library utilities
  - services     # Service layer
  - content      # Content/MDX files
  - scripts      # Build/dev scripts
  - deps         # Dependencies
  - deploy       # Deployment/Cloudflare
  - test         # Unit tests
  - e2e          # End-to-end tests
  - products     # Product features
  - homepage     # Homepage features
  - ci           # CI/CD
  - docs         # Documentation
  - eslint       # ESLint configuration
  - perf         # Performance
  - a11y         # Accessibility
  - animation    # Animation features
  - motion       # Motion design
types:
  - feat
  - fix
  - docs
  - refactor
  - test
  - chore
  - perf
  - style
  - build
# Branch Naming Conventions
branch_prefixes:
  feature: feature/*
  fix: fix/*
  hotfix: hotfix/*
  refactor: refactor/*
  docs: docs/*
# .gitignore Generation Defaults
gitignore:
  os: [macos, linux, windows]
  languages: [node, typescript, react]
  frameworks: [nextjs]
  tools: [vitest, playwright, pnpm, eslint, prettier, vscode]
---

# Project-Specific Git Settings

This file configures the `@git/` plugin for this project. The settings above in the YAML frontmatter define valid scopes, types, and branch naming conventions that the plugin will enforce.

## Usage

- **Scopes**: When creating a commit with `/commit`, choose from the defined `scopes`.
- **Branching**: When creating a new branch via the `git` skill, use the defined `branch_prefixes`.
- **Gitignore**: When running `/gitignore` without arguments, the technologies listed above will be used as defaults.

## Additional Guidelines

- Always run tests before committing.
- Ensure linting passes before pushing.
- Reference issue numbers in commit footers (e.g., `Closes #123`).
- Use `BREAKING CHANGE:` prefix in the body for breaking changes.
