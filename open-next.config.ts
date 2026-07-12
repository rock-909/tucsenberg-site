import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const cloudflareConfig = defineCloudflareConfig({});

// This is the lower-layer OpenNext aws-layer `default.minify` flag, a
// build-and-preview-gated setting only. It does NOT drive production worker
// minification: `pnpm website:build:cf` minifies the shipped Cloudflare worker
// by default (owner 2026-07-12 decision), and `pnpm website:build:cf:debug`
// keeps the `--noMinify` variant for CPU profiling. Wrangler-level minification
// stays in wrangler.jsonc. See `.claude/rules/cloudflare.md` (Build ownership).
cloudflareConfig.default.minify = false;

export default cloudflareConfig;
