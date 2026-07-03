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
      <p className="mt-4 rounded-lg border p-4 text-sm text-muted-foreground">
        Traffic dashboard is not configured
      </p>
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
        <p className="mt-4 rounded-lg border border-destructive p-3 text-sm">
          Access key was not accepted.
        </p>
      ) : null}
      <form
        className="mt-6 grid gap-3"
        method="post"
        action="/ops/traffic/access"
      >
        <label className="text-sm font-medium" htmlFor="accessKey">
          Access key
        </label>
        <input
          aria-label="Access key"
          id="accessKey"
          name="accessKey"
          type="password"
          className="rounded-md border px-3 py-2"
          autoComplete="current-password"
        />
        <button
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          type="submit"
        >
          View dashboard
        </button>
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
        <div className="rounded-xl border p-4">
          <dt className="text-sm text-muted-foreground">
            Visits in the last 7 days
          </dt>
          <dd className="mt-2 text-2xl font-bold">{data.summary.visits}</dd>
        </div>
        <div className="rounded-xl border p-4">
          <dt className="text-sm text-muted-foreground">Requests</dt>
          <dd className="mt-2 text-2xl font-bold">{data.summary.requests}</dd>
        </div>
        <div className="rounded-xl border p-4">
          <dt className="text-sm text-muted-foreground">Bandwidth</dt>
          <dd className="mt-2 text-2xl font-bold">
            {data.summary.bandwidthBytes}
          </dd>
        </div>
        <div className="rounded-xl border p-4">
          <dt className="text-sm text-muted-foreground">Error rate</dt>
          <dd className="mt-2 text-2xl font-bold">
            {(data.summary.errorRate * 100).toFixed(2)}%
          </dd>
        </div>
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
