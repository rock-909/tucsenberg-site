import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const cloudflareConfig = defineCloudflareConfig({});

// Keep OpenNext worker minification disabled until native Cloudflare build and
// preview have fresh proof. Wrangler-level minification remains in wrangler.jsonc.
cloudflareConfig.default.minify = false;

export default cloudflareConfig;
