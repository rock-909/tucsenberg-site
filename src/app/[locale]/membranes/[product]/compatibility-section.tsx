import { getTranslations } from "next-intl/server";
import type { ProductCompatibilityEntry } from "@/data/product-compatibility";
import {
  CONFIDENCE_TONE,
  FIT_STATUS_TONE,
  StatusBadge,
} from "@/components/compatibility/status-badge";
import { localizeText } from "@/lib/i18n/localize-text";

type CompatibilityTranslator = Awaited<ReturnType<typeof getTranslations>>;

interface BrandDisclaimer {
  brandId: string;
  brandName: string;
  trademarkDisclaimer: string;
}

function ModelRow({
  model,
  locale,
  t,
}: {
  model: ProductCompatibilityEntry["compatibleOemModels"][number];
  locale: string;
  t: CompatibilityTranslator;
}) {
  const checks = model.requiredChecks.map((check) =>
    localizeText(check, locale),
  );
  return (
    <tr className="border-b border-border align-top">
      <td className="p-4">
        <span className="block text-sm font-medium text-foreground">
          {model.modelName}
        </span>
        <span className="text-xs text-muted-foreground">{model.brandName}</span>
      </td>
      <td className="p-4">
        <span className="font-mono text-[14px] tabular-nums text-foreground">
          {model.oemPartNumbers.join(" · ")}
        </span>
      </td>
      <td className="p-4">
        <StatusBadge tone={FIT_STATUS_TONE[model.fitStatus] ?? "neutral"}>
          {t(`compatibility.fitStatus.${model.fitStatus}`)}
        </StatusBadge>
      </td>
      <td className="p-4">
        <StatusBadge tone={CONFIDENCE_TONE[model.confidence] ?? "neutral"}>
          {t(`compatibility.confidence.${model.confidence}`)}
        </StatusBadge>
      </td>
      <td className="p-4">
        {checks.length > 0 ? (
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-[var(--color-brand-accent)]">
              {t("compatibility.requiredChecks")}
            </summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              {checks.map((check) => (
                <li key={check}>{check}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              {localizeText(model.disclaimer, locale)}
            </p>
          </details>
        ) : (
          <span className="text-sm text-muted-foreground">
            {t("compatibility.noChecksRequired")}
          </span>
        )}
      </td>
    </tr>
  );
}

export async function CompatibilitySection({
  entry,
  locale,
}: {
  entry: ProductCompatibilityEntry;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "membraneProduct" });

  const brandDisclaimers = entry.compatibleOemModels.reduce<BrandDisclaimer[]>(
    (acc, model) => {
      if (acc.some((item) => item.brandId === model.brandId)) return acc;
      acc.push({
        brandId: model.brandId,
        brandName: model.brandName,
        trademarkDisclaimer: localizeText(model.trademarkDisclaimer, locale),
      });
      return acc;
    },
    [],
  );

  return (
    <section className="bg-card px-6 py-16 md:py-20">
      <div className="mx-auto max-w-[1080px]">
        <h2 className="text-[28px] leading-tight font-light tracking-[-0.01em] text-foreground md:text-[32px]">
          {t("compatibility.title")}
        </h2>
        <p className="mt-3 max-w-[70ch] text-muted-foreground">
          {t("compatibility.description")}
        </p>

        <div className="mt-9 overflow-x-auto rounded-[8px] border border-border">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-background">
                {(
                  [
                    "modelColumn",
                    "partNumbersColumn",
                    "fitColumn",
                    "confidenceColumn",
                    "checksColumn",
                  ] as const
                ).map((key) => (
                  <th
                    key={key}
                    className="px-4 py-3 font-mono text-[12px] font-semibold tracking-[0.6px] text-muted-foreground uppercase"
                  >
                    {t(`compatibility.${key}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entry.compatibleOemModels.map((model) => (
                <ModelRow
                  key={model.modelId}
                  model={model}
                  locale={locale}
                  t={t}
                />
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          {t("compatibility.crossRefNote")}
        </p>

        <div className="mt-8 space-y-2 border-t border-border pt-6">
          {brandDisclaimers.map((brand) => (
            <p
              key={brand.brandId}
              className="text-xs leading-5 text-muted-foreground"
            >
              {brand.trademarkDisclaimer}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
