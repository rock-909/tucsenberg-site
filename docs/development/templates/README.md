# Development Templates

These files are examples for future implementation work. They intentionally use
the `.template` suffix and live outside `src/` so production source scans,
type-checking, security scans, and bundle analysis do not treat template-only
code as live application code.

Current groups:

- `block/` — block component starter examples.
- `react19/` — React 19 form and Server Action starter examples.
- `testing/` — test scaffolding examples.

When using a template, copy it into the relevant `src/` folder, remove the
`.template` suffix, then replace the placeholder names, content, and imports
before committing.

Some testing examples depend on companion helpers in this same directory. Copy
the helper template next to the example or replace the import with the current
project test utility before enabling it as live test code.
