import "server-only";
import { generateJSONLD } from "@/lib/structured-data";
import { generatePageStructuredData } from "@/lib/page-structured-data";
import type { Locale } from "@/types/content.types";

interface JsonLdScriptProps {
  readonly data: unknown;
}

interface JsonLdGraphScriptProps {
  readonly locale: Locale;
  readonly data?: readonly unknown[];
}

function stripSchemaContext(value: Record<string, unknown>) {
  const { "@context": _context, ...node } = value;
  return node;
}

function collectGraphNodes(
  data: readonly unknown[],
): Record<string, unknown>[] {
  const nodes: Record<string, unknown>[] = [];

  for (const item of data) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      continue;
    }

    const record = item as Record<string, unknown>;
    const graph = record["@graph"];

    if (Array.isArray(graph)) {
      nodes.push(...collectGraphNodes(graph));
      continue;
    }

    nodes.push(stripSchemaContext(record));
  }

  return nodes;
}

export function createJsonLdGraphData(data: readonly unknown[]) {
  return {
    "@context": "https://schema.org",
    "@graph": collectGraphNodes(data),
  };
}

/**
 * Server Component for rendering JSON-LD structured data.
 *
 * Encapsulates the dangerouslySetInnerHTML usage in a single,
 * auditable location with proper XSS escaping via generateJSONLD.
 *
 * Security: generateJSONLD escapes < to \u003c to prevent script injection.
 *
 * @see https://nextjs.org/docs/app/guides/json-ld
 */
export function JsonLdScript({ data }: JsonLdScriptProps) {
  let jsonLd: string;

  try {
    jsonLd = generateJSONLD(data);
  } catch {
    // Silently fail - structured data is enhancement, not critical
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: jsonLd,
      }}
    />
  );
}

export async function JsonLdGraphScript({
  locale,
  data = [],
}: JsonLdGraphScriptProps) {
  let identity: Awaited<ReturnType<typeof generatePageStructuredData>>;

  try {
    identity = await generatePageStructuredData(locale);
  } catch {
    return null;
  }

  const { organizationData, websiteData } = identity;

  return (
    <JsonLdScript
      data={createJsonLdGraphData([organizationData, websiteData, ...data])}
    />
  );
}
