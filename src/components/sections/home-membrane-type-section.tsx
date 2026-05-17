import {
  canonicalProductSlugForVariantId,
  getFeaturedProductFacts,
} from "@/data/product-compatibility";
import {
  HomeMembraneTypeSectionView,
  type HomeMembraneTypeCard,
} from "@/components/sections/home-membrane-type-section-view";
import { loadCompleteMessages } from "@/lib/i18n/load-messages";
import {
  readMessagePath,
  type MessageRecord,
} from "@/lib/i18n/read-message-path";
import type { Locale } from "@/types/content.types";

export interface HomeMembraneTypeSectionProps {
  locale: Locale;
}

const TUBE_VARIANT_ID = "tuc-t62-epdm";

function readType(messages: MessageRecord, path: string[]): string {
  const fullPath = ["home", "membraneType", ...path];
  return readMessagePath(messages, fullPath, fullPath.join("."));
}

export async function HomeMembraneTypeSection({
  locale,
}: HomeMembraneTypeSectionProps) {
  const messages = await loadCompleteMessages(locale);

  const discSlug = getFeaturedProductFacts().canonicalSlug;
  const tubeSlug = canonicalProductSlugForVariantId(TUBE_VARIANT_ID);

  if (!tubeSlug) {
    throw new Error(
      `HomeMembraneTypeSection: no canonical slug for tube variant "${TUBE_VARIANT_ID}"`,
    );
  }

  const cards: HomeMembraneTypeCard[] = [
    {
      key: "disc",
      name: readType(messages, ["disc", "name"]),
      body: readType(messages, ["disc", "body"]),
      href: `/membranes/${discSlug}`,
    },
    {
      key: "tube",
      name: readType(messages, ["tube", "name"]),
      body: readType(messages, ["tube", "body"]),
      href: `/membranes/${tubeSlug}`,
    },
  ];

  return (
    <HomeMembraneTypeSectionView
      overline={readType(messages, ["overline"])}
      title={readType(messages, ["title"])}
      cta={readType(messages, ["cta"])}
      cards={cards}
    />
  );
}
