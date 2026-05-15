import type { Metadata } from "next";
import { cookies } from "next/headers";
import { fetchCloudflareTrafficSummary } from "@/lib/cloudflare/analytics-client";
import { getCachedCloudflareTrafficSummary } from "@/lib/cloudflare/analytics-cache";
import { getCloudflareAnalyticsConfig } from "@/lib/cloudflare/analytics-config";
import type { CloudflareTrafficDashboardData } from "@/lib/cloudflare/analytics-types";
import { getRuntimeEnvString } from "@/lib/env";
import {
  OPS_TRAFFIC_ACCESS_COOKIE_NAME,
  verifyOpsAccessCookieValue,
} from "@/lib/ops/access-cookie";
import { Button } from "@/components/ui/button";
import { Field, FieldControl, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusCallout } from "@/components/ui/status-callout";

export function generateMetadata(): Metadata {
  return {
    robots: {
      index: false,
      follow: false,
    },
  };
}

function UnconfiguredState() {
  return (
    <main className="mx-auto max-w-[960px] px-6 py-16">
      <h1 className="text-3xl font-bold">Traffic dashboard</h1>
      <StatusCallout className="mt-4" live={false} tone="info">
        Traffic dashboard is not configured
      </StatusCallout>
      <p className="mt-3 text-sm text-muted-foreground">
        Add Cloudflare analytics credentials on the server to enable real
        traffic data.
      </p>
    </main>
  );
}

function AccessForm({ denied }: { denied: boolean }) {
  return (
    <main className="mx-auto max-w-[480px] px-6 py-16">
      <h1 className="text-3xl font-bold">Owner traffic dashboard</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Enter the owner access key to view Cloudflare traffic data.
      </p>
      {denied ? (
        <StatusCallout className="mt-4" tone="error">
          Access key was not accepted.
        </StatusCallout>
      ) : null}
      <form
        className="mt-6 grid gap-3"
        method="post"
        action="/ops/traffic/access"
      >
        <Field>
          <FieldLabel htmlFor="accessKey">Access key</FieldLabel>
          <FieldControl>
            <Input
              id="accessKey"
              name="accessKey"
              type="password"
              autoComplete="current-password"
            />
          </FieldControl>
        </Field>
        <Button type="submit">View dashboard</Button>
      </form>
    </main>
  );
}

function Dashboard({ data }: { data: CloudflareTrafficDashboardData }) {
  return (
    <main className="mx-auto max-w-[1080px] px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.04em] text-primary">
        Cloudflare analytics
      </p>
      <h1 className="mt-3 text-3xl font-bold">Owner traffic dashboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Hostname: {data.hostname}. Last updated: {data.lastUpdated}.
      </p>
      <dl className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard
          label="Visits in the last 7 days"
          value={data.summary.visits}
        />
        <MetricCard label="Requests" value={data.summary.requests} />
        <MetricCard label="Bandwidth" value={data.summary.bandwidthBytes} />
        <MetricCard
          label="Error rate"
          value={`${(data.summary.errorRate * 100).toFixed(2)}%`}
        />
      </dl>
    </main>
  );
}

export default async function OpsTrafficPage({
  searchParams,
}: {
  searchParams?: Promise<{ access?: string }>;
}) {
  const config = getCloudflareAnalyticsConfig();
  if (!config.configured) {
    return <UnconfiguredState />;
  }

  const cookieStore = await cookies();
  const accessCookie = cookieStore.get(OPS_TRAFFIC_ACCESS_COOKIE_NAME)?.value;
  const hasAccess = await verifyOpsAccessCookieValue({
    cookieValue: accessCookie,
    secret: getRuntimeEnvString("OPS_DASHBOARD_ACCESS_KEY"),
  });

  if (!hasAccess) {
    const params = searchParams ? await searchParams : {};
    return <AccessForm denied={params.access === "denied"} />;
  }

  const data = await getCachedCloudflareTrafficSummary({
    cacheKey: config.hostname,
    loader: () => fetchCloudflareTrafficSummary(config),
  });

  if (!data.configured) {
    return <UnconfiguredState />;
  }

  return <Dashboard data={data} />;
}
