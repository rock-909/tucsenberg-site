import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { JsonLdGraphScript } from "@/components/seo/json-ld-script";
import { LegalContentRenderer } from "@/components/content/legal-content-renderer";
import type { HeadingItem } from "@/lib/content/legal-page";
import { buildLegalPageSchema } from "@/lib/structured-data-generators";
import type { LegalPageMetadata, Locale } from "@/types/content.types";

interface LegalPageShellProps {
  metadata: LegalPageMetadata;
  content: string;
  headings: HeadingItem[];
  locale: string;
  schemaType: "PrivacyPolicy" | "WebPage";
  schemaAdditionalType?: string;
}

export async function LegalPageShell({
  metadata,
  content,
  headings,
  locale,
  schemaType,
  schemaAdditionalType,
}: LegalPageShellProps): Promise<ReactNode> {
  const t = await getTranslations({ locale, namespace: "legal" });

  const schema = buildLegalPageSchema({
    schemaType,
    ...(schemaAdditionalType ? { additionalType: schemaAdditionalType } : {}),
    locale,
    name: metadata.seo?.title ?? metadata.title,
    publishedAt: metadata.publishedAt,
    modifiedAt:
      metadata.updatedAt ?? metadata.lastReviewed ?? metadata.publishedAt,
    ...(metadata.seo?.description ?? metadata.description
      ? { description: metadata.seo?.description ?? metadata.description }
      : {}),
  });

  const tocHeadings = headings.filter((heading) => heading.level === 2);
  const hasToc = tocHeadings.length > 0;

  return (
    <>
      <JsonLdGraphScript locale={locale as Locale} data={[schema]} />

      <div className="mx-auto max-w-[720px] px-6 py-8 md:py-12">
        <header className="mb-6 md:mb-8">
          <h1 className="text-heading mb-4">{metadata.title}</h1>
          {metadata.description && (
            <p className="text-body max-w-2xl text-muted-foreground">
              {metadata.description}
            </p>
          )}
        </header>

        <section className="mb-8 flex flex-wrap gap-4 text-xs text-muted-foreground sm:text-sm">
          {metadata.publishedAt !== undefined && (
            <div>
              <span className="font-medium">{t("effectiveDate")}:</span>{" "}
              <span>{metadata.publishedAt}</span>
            </div>
          )}
          {metadata.updatedAt !== undefined && (
            <div>
              <span className="font-medium">{t("lastUpdated")}:</span>{" "}
              <span>{metadata.updatedAt}</span>
            </div>
          )}
        </section>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,1.2fr)]">
          <article className="min-w-0">
            <LegalContentRenderer content={content} />
          </article>

          {hasToc && (
            <aside className="order-first surface-card p-4 text-sm lg:order-none">
              <h2 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {t("tableOfContents")}
              </h2>
              <nav aria-label={t("tableOfContents")}>
                <ol className="space-y-2">
                  {tocHeadings.map((heading) => (
                    <li key={heading.id}>
                      <a
                        href={`#${heading.id}`}
                        className="inline-flex text-xs text-muted-foreground transition-colors hover:text-foreground sm:text-sm"
                      >
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </aside>
          )}
        </div>
      </div>
    </>
  );
}
