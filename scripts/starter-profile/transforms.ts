import {
  getStarterProfile,
  type StarterProfileId,
} from "../../src/config/starter-profiles";
import { getMessagePackIdsForProfile } from "../../src/lib/i18n/message-pack-config";
import {
  profileOwnsShowcaseFull,
  SHOWCASE_FULL_MDX_SLUGS,
} from "./dependency-closure";
import { rewriteMessagePackSourcesForProfile } from "./message-pack-source-gen";

function removeShowcaseFullMdxImporterLines(content: string): string {
  const lines = content.split("\n");
  const filtered = lines.filter((line) => {
    if (!line.includes("profile-fixtures/showcase-full")) {
      return true;
    }

    return !SHOWCASE_FULL_MDX_SLUGS.some((slug) => line.includes(`'${slug}'`));
  });

  return filtered.join("\n");
}

interface ContentManifestEntry {
  type: string;
  locale: string;
  slug: string;
  source?: string;
  relativePath?: string;
}

function shouldKeepManifestEntry(
  entry: ContentManifestEntry,
  profileId: StarterProfileId,
): boolean {
  if (profileOwnsShowcaseFull(profileId)) {
    return true;
  }

  if (entry.source === "profile-fixture") {
    return false;
  }

  if (entry.relativePath?.startsWith("profile-fixtures/")) {
    return false;
  }

  return true;
}

function pruneContentManifest(
  content: string,
  profileId: StarterProfileId,
): string {
  if (profileOwnsShowcaseFull(profileId)) {
    return content;
  }

  const marker = "const _entries: ContentEntry[] = [";
  const start = content.indexOf(marker);
  if (start === -1) {
    return content;
  }

  const arrayStart = content.indexOf("= [", start);
  if (arrayStart === -1) {
    return content;
  }

  const bracketStart = arrayStart + 2;
  const arrayEnd = content.indexOf("];", bracketStart);
  if (arrayEnd === -1) {
    return content;
  }

  const entries = JSON.parse(
    content.slice(bracketStart, arrayEnd + 1),
  ) as ContentManifestEntry[];
  const kept = entries.filter((entry) =>
    shouldKeepManifestEntry(entry, profileId),
  );

  const byKeyIndex = Object.fromEntries(
    kept.map((entry, index) => [
      `${entry.type}/${entry.locale}/${entry.slug}`,
      index,
    ]),
  );

  const header = content.slice(0, bracketStart);
  const entriesBlock = JSON.stringify(kept, null, 2);
  const footer = `;

const _byKeyIndex: Record<string, number> = ${JSON.stringify(byKeyIndex, null, 2)};

const _byKey: Record<string, ContentEntry> = Object.fromEntries(
  Object.entries(_byKeyIndex).map(([key, idx]) => [key, _entries[idx]!]),
);

export const CONTENT_MANIFEST: ContentManifest = {
  entries: _entries,
  byKey: _byKey,
} as const;
`;

  return `${header}${entriesBlock}${footer}`;
}

function pruneSingleSiteSeoMarketImports(
  content: string,
  profileId: StarterProfileId,
): string {
  if (getStarterProfile(profileId).dynamicSurfaces.includes("productMarket")) {
    return content;
  }

  return content
    .replace(
      'import { getCanonicalPath, getProductMarketPath } from "@/config/paths/utils";',
      'import { getCanonicalPath } from "@/config/paths/utils";',
    )
    .replace(
      'import { getAllMarketSlugs } from "@/constants/product-catalog";\n',
      "",
    )
    .replace(
      'import { getMarketSpecsBySlug } from "@/constants/product-specs/market-spec-registry";\n',
      "",
    )
    .replace(
      'const SINGLE_SITE_STATIC_LASTMOD_ISO = "2026-04-26T00:00:00Z";\n\n',
      "",
    )
    .replace(
      /function buildSingleSiteProductMarketLastmod\(\): Record<string, string> \{[\s\S]*?\n\}/u,
      "function buildSingleSiteProductMarketLastmod(): Record<string, string> {\n  return {};\n}",
    );
}

export function transformMaterializedFileContent(
  relativePath: string,
  content: string,
  profileId: StarterProfileId,
): string {
  const normalizedPath = relativePath.replaceAll("\\", "/");

  if (normalizedPath === "src/lib/mdx-importers.generated.ts") {
    return removeShowcaseFullMdxImporterLines(content);
  }

  if (normalizedPath === "src/lib/content-manifest.generated.ts") {
    return pruneContentManifest(content, profileId);
  }

  if (normalizedPath === "src/config/active-starter-profile.ts") {
    return content.replace(
      '"showcase-full" satisfies StarterProfileId',
      `"${profileId}" satisfies StarterProfileId`,
    );
  }

  if (normalizedPath === "src/config/single-site-seo.ts") {
    return pruneSingleSiteSeoMarketImports(content, profileId);
  }

  const packIds = getMessagePackIdsForProfile(profileId);
  return rewriteMessagePackSourcesForProfile(
    profileId,
    packIds,
    normalizedPath,
    content,
  );
}
