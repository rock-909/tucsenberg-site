interface CloudflareAnalyticsConfig {
  configured: true;
  zoneId: string;
  apiToken: string;
  hostname: string;
}

interface CloudflareAnalyticsNotConfigured {
  configured: false;
  reason:
    | "missing-credentials"
    | "request-failed"
    | "graphql-error"
    | "empty-zone";
}

export type CloudflareAnalyticsConfigState =
  | CloudflareAnalyticsConfig
  | CloudflareAnalyticsNotConfigured;

interface CloudflareTrafficSummary {
  visits: number;
  requests: number;
  bandwidthBytes: number;
  errorRate: number;
}

export interface CloudflareTrafficPoint {
  hour: string;
  visits: number;
  requests: number;
  bandwidthBytes: number;
}

export interface CloudflareTrafficDimension {
  label: string;
  requests: number;
}

export interface CloudflareTopPage {
  path: string;
  requests: number;
}

export interface CloudflareTopCountry {
  country: string;
  requests: number;
}

export interface CloudflareTrafficDashboardData {
  configured: true;
  source: "cloudflare";
  hostname: string;
  lastUpdated: string;
  summary: CloudflareTrafficSummary;
  hourly: CloudflareTrafficPoint[];
  topPages: CloudflareTopPage[];
  topCountries: CloudflareTopCountry[];
  statusCodes: CloudflareTrafficDimension[];
}

export type CloudflareTrafficDashboardState =
  | CloudflareTrafficDashboardData
  | CloudflareAnalyticsNotConfigured;
