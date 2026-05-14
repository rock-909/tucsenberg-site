/**
 * Mock environment variables for Airtable testing
 * 测试用 Airtable 环境变量 Mock
 */
export const env = {
  AIRTABLE_API_KEY: "test-api-key",
  AIRTABLE_BASE_ID: "test-base-id",
  AIRTABLE_TABLE_NAME: "Contacts",
  NODE_ENV: "test",
};

export function getRuntimeEnvString(key: keyof typeof env): string {
  return env[key] ?? "";
}

export function getRuntimeEnvBoolean(key: keyof typeof env): boolean {
  return getRuntimeEnvString(key) === "true";
}

export function getRuntimeNodeEnv(): string {
  return env.NODE_ENV;
}

export function isRuntimePlaywright(): boolean {
  return false;
}
