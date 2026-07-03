import "server-only";

import {
  DAYS_PER_WEEK,
  HOURS_PER_DAY,
  MILLISECONDS_PER_HOUR,
} from "@/constants/time";
import type {
  CloudflareTrafficDashboardState,
  CloudflareTrafficDimension,
  CloudflareTrafficPoint,
  CloudflareTopCountry,
  CloudflareTopPage,
} from "@/lib/cloudflare/analytics-types";

const CLOUDFLARE_GRAPHQL_ENDPOINT =
  "https://api.cloudflare.com/client/v4/graphql";
const SERVER_ERROR_STATUS_MIN = 500;
const TRAFFIC_WINDOW_MS = DAYS_PER_WEEK * HOURS_PER_DAY * MILLISECONDS_PER_HOUR;

const TRAFFIC_QUERY = `
query TrafficDashboard($zoneTag: String!, $hostname: String!, $since: Time!, $until: Time!) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      totals: httpRequestsAdaptiveGroups(
        limit: 1
        filter: { datetime_geq: $since, datetime_leq: $until, clientRequestHTTPHost: $hostname, requestSource: "eyeball" }
      ) {
        count
        sum { visits edgeResponseBytes }
      }
      hourly: httpRequestsAdaptiveGroups(
        limit: 168
        filter: { datetime_geq: $since, datetime_leq: $until, clientRequestHTTPHost: $hostname, requestSource: "eyeball" }
        orderBy: [datetimeHour_ASC]
      ) {
        dimensions { datetimeHour }
        count
        sum { visits edgeResponseBytes }
      }
      topPaths: httpRequestsAdaptiveGroups(
        limit: 10
        filter: { datetime_geq: $since, datetime_leq: $until, clientRequestHTTPHost: $hostname, requestSource: "eyeball" }
        orderBy: [count_DESC]
      ) {
        dimensions { clientRequestPath }
        count
      }
      topCountries: httpRequestsAdaptiveGroups(
        limit: 10
        filter: { datetime_geq: $since, datetime_leq: $until, clientRequestHTTPHost: $hostname, requestSource: "eyeball" }
        orderBy: [count_DESC]
      ) {
        dimensions { clientCountryName }
        count
      }
      statusCodes: httpRequestsAdaptiveGroups(
        limit: 20
        filter: { datetime_geq: $since, datetime_leq: $until, clientRequestHTTPHost: $hostname, requestSource: "eyeball" }
        orderBy: [count_DESC]
      ) {
        dimensions { edgeResponseStatus }
        count
      }
    }
  }
}
`;

interface CloudflareTrafficInput {
  zoneId: string;
  apiToken: string;
  hostname: string;
  now?: Date;
}

interface CloudflareTrafficSum {
  visits?: number;
  edgeResponseBytes?: number;
}

interface CloudflareRequestCount {
  count?: number;
}

interface CloudflareTotalsGroup extends CloudflareRequestCount {
  sum?: CloudflareTrafficSum;
}

interface CloudflareStatusCodeGroup extends CloudflareRequestCount {
  dimensions?: {
    edgeResponseStatus?: number;
  };
}

interface CloudflarePathGroup extends CloudflareRequestCount {
  dimensions?: {
    clientRequestPath?: string;
  };
}

interface CloudflareCountryGroup extends CloudflareRequestCount {
  dimensions?: {
    clientCountryName?: string;
  };
}

interface CloudflareHourlyGroup extends CloudflareRequestCount {
  dimensions?: {
    datetimeHour?: string;
  };
  sum?: CloudflareTrafficSum;
}

interface CloudflareZoneAnalytics {
  totals?: CloudflareTotalsGroup[];
  statusCodes?: CloudflareStatusCodeGroup[];
  topPaths?: CloudflarePathGroup[];
  topCountries?: CloudflareCountryGroup[];
  hourly?: CloudflareHourlyGroup[];
}

interface CloudflareGraphqlResponse {
  data?: {
    viewer?: {
      zones?: CloudflareZoneAnalytics[];
    };
  };
  errors?: unknown[];
}

function getRequests(group: CloudflareRequestCount | undefined) {
  return group?.count ?? 0;
}

function getBytes(sum: CloudflareTrafficSum | undefined) {
  return sum?.edgeResponseBytes ?? 0;
}

function getVisits(sum: CloudflareTrafficSum | undefined) {
  return sum?.visits ?? 0;
}

function calculateErrorRate(
  statusCodes: CloudflareStatusCodeGroup[] | undefined,
  totalRequests: number,
): number {
  if (totalRequests <= 0) {
    return 0;
  }

  const errorRequests = (statusCodes ?? []).reduce((sum, item) => {
    const status = item.dimensions?.edgeResponseStatus ?? 0;
    return status >= SERVER_ERROR_STATUS_MIN ? sum + getRequests(item) : sum;
  }, 0);

  return errorRequests / totalRequests;
}

function mapHourly(groups: CloudflareHourlyGroup[] | undefined) {
  return (groups ?? []).map<CloudflareTrafficPoint>((item) => ({
    hour: item.dimensions?.datetimeHour ?? "",
    visits: getVisits(item.sum),
    requests: getRequests(item),
    bandwidthBytes: getBytes(item.sum),
  }));
}

function mapTopPages(groups: CloudflarePathGroup[] | undefined) {
  return (groups ?? []).map<CloudflareTopPage>((item) => ({
    path: item.dimensions?.clientRequestPath ?? "/",
    requests: getRequests(item),
  }));
}

function mapTopCountries(groups: CloudflareCountryGroup[] | undefined) {
  return (groups ?? []).map<CloudflareTopCountry>((item) => ({
    country: item.dimensions?.clientCountryName ?? "Unknown",
    requests: getRequests(item),
  }));
}

function mapStatusCodes(groups: CloudflareStatusCodeGroup[] | undefined) {
  return (groups ?? []).map<CloudflareTrafficDimension>((item) => ({
    label: String(item.dimensions?.edgeResponseStatus ?? 0),
    requests: getRequests(item),
  }));
}

function buildGraphqlBody(input: CloudflareTrafficInput): string {
  const until = input.now ?? new Date();
  const since = new Date(until.getTime() - TRAFFIC_WINDOW_MS);

  return JSON.stringify({
    query: TRAFFIC_QUERY,
    variables: {
      zoneTag: input.zoneId,
      hostname: input.hostname,
      since: since.toISOString(),
      until: until.toISOString(),
    },
  });
}

function mapDashboardState(
  input: CloudflareTrafficInput,
  response: CloudflareGraphqlResponse,
): CloudflareTrafficDashboardState {
  if (response.errors && response.errors.length > 0) {
    return { configured: false, reason: "graphql-error" };
  }

  const zone = response.data?.viewer?.zones?.[0];
  if (!zone) {
    return { configured: false, reason: "empty-zone" };
  }

  const totals = zone.totals?.[0];
  const requests = getRequests(totals);

  return {
    configured: true,
    source: "cloudflare",
    hostname: input.hostname,
    lastUpdated: (input.now ?? new Date()).toISOString(),
    summary: {
      visits: getVisits(totals?.sum),
      requests,
      bandwidthBytes: getBytes(totals?.sum),
      errorRate: calculateErrorRate(zone.statusCodes, requests),
    },
    hourly: mapHourly(zone.hourly),
    topPages: mapTopPages(zone.topPaths),
    topCountries: mapTopCountries(zone.topCountries),
    statusCodes: mapStatusCodes(zone.statusCodes),
  };
}

export async function fetchCloudflareTrafficSummary(
  input: CloudflareTrafficInput,
): Promise<CloudflareTrafficDashboardState> {
  try {
    const response = await fetch(CLOUDFLARE_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiToken}`,
        "Content-Type": "application/json",
      },
      body: buildGraphqlBody(input),
    });

    if (!response.ok) {
      return { configured: false, reason: "request-failed" };
    }

    const data = (await response.json()) as CloudflareGraphqlResponse;
    return mapDashboardState(input, data);
  } catch {
    return { configured: false, reason: "request-failed" };
  }
}
