import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const cloudflareConfig = defineCloudflareConfig({});

// This lower-layer flag does not control the shipped Cloudflare worker.
// Keep it disabled unless a build-and-preview change proves it safe.
cloudflareConfig.default.minify = false;

export default cloudflareConfig;
