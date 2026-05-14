import { getTranslations } from "next-intl/server";
import { HOMEPAGE_SECTION_LINKS } from "@/components/sections/homepage-section-links";
import { SampleCTAView } from "@/components/sections/sample-cta-view";

export async function SampleCTA() {
  const t = await getTranslations("home");

  return (
    <SampleCTAView
      content={{
        title: t("sample.title"),
        description: t("sample.description"),
        cta: {
          label: t("sample.cta"),
          href: HOMEPAGE_SECTION_LINKS.contact,
        },
      }}
    />
  );
}
