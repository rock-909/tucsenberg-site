#!/usr/bin/env bash
set -euo pipefail

cd "${CONDUCTOR_WORKSPACE_PATH:-.}"

export PATH="$HOME/.local/bin:$PATH:/opt/homebrew/bin:/usr/local/bin"

REQUIRED_NODE_VERSION="24.15.0"
if [ -f .node-version ]; then
  REQUIRED_NODE_VERSION="$(tr -d '[:space:]' < .node-version)"
elif [ -f .nvmrc ]; then
  REQUIRED_NODE_VERSION="$(tr -d '[:space:]' < .nvmrc)"
fi

if command -v fnm >/dev/null 2>&1; then
  eval "$(fnm env --shell bash)"
  fnm install "$REQUIRED_NODE_VERSION"
  fnm use "$REQUIRED_NODE_VERSION"
else
  echo "[setup] fnm not found; falling back to system node"
fi

command -v node >/dev/null 2>&1 || { echo "[setup] node not found"; exit 1; }

node <<'NODE'
const fs = require('fs');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const range = pkg.engines?.node;

if (!range) {
  process.exit(0);
}

const match = range.match(/^>=\s*([0-9]+(?:\.[0-9]+){0,2})\s*<\s*([0-9]+(?:\.[0-9]+){0,2})$/);

if (!match) {
  console.error(`[setup] unsupported engines.node format: ${range}`);
  process.exit(1);
}

function normalize(version) {
  const parts = version.split('.').map((part) => Number(part));

  while (parts.length < 3) {
    parts.push(0);
  }

  return parts;
}

function compare(a, b) {
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) {
      return a[index] - b[index];
    }
  }

  return 0;
}

const current = normalize(process.versions.node);
const min = normalize(match[1]);
const maxExclusive = normalize(match[2]);

if (compare(current, min) < 0 || compare(current, maxExclusive) >= 0) {
  console.error(
    `[setup] node ${process.versions.node} does not satisfy engines.node ${range}`,
  );
  process.exit(1);
}
NODE
echo "[setup] node: $(node -v)"

PNPM_VERSION="${PNPM_VERSION:-$(node -p "const match = require('./package.json').packageManager?.match(/^pnpm@(.+)$/); if (!match) throw new Error('pnpm packageManager is missing'); match[1]")}"

install_pnpm_via_npm() {
  echo "[setup] corepack not found; installing pnpm@$PNPM_VERSION via npm"
  command -v npm >/dev/null 2>&1 || { echo "[setup] npm not found"; exit 1; }
  npm install --global --prefix "$HOME/.local" "pnpm@$PNPM_VERSION"
  export PATH="$HOME/.local/bin:$PATH"
}

if command -v corepack >/dev/null 2>&1; then
  corepack enable
  corepack prepare "pnpm@$PNPM_VERSION" --activate
else
  if command -v pnpm >/dev/null 2>&1; then
    CURRENT_PNPM_VERSION="$(pnpm -v)"
    if [ "$CURRENT_PNPM_VERSION" != "$PNPM_VERSION" ]; then
      install_pnpm_via_npm
    else
      echo "[setup] corepack not found; using existing pnpm@$CURRENT_PNPM_VERSION"
    fi
  else
    install_pnpm_via_npm
  fi
fi

echo "[setup] pnpm: $(pnpm -v)"

pnpm install --frozen-lockfile
