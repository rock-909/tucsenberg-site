import {
  HomeRisksSectionView,
  type HomeRiskItem,
} from "@/components/sections/home-risks-section-view";
import { loadCompleteMessages } from "@/lib/i18n/load-messages";
import {
  readMessagePath,
  type MessageRecord,
} from "@/lib/i18n/read-message-path";
import type { Locale } from "@/types/content.types";

export interface HomeRisksSectionProps {
  locale: Locale;
}

const RISK_KEYS = [
  "wrongFit",
  "wrongMaterial",
  "blindOrder",
  "shutdownSlip",
] as const;

function readRisk(messages: MessageRecord, path: string[]): string {
  const fullPath = ["home", "risks", ...path];
  return readMessagePath(messages, fullPath, fullPath.join("."));
}

export async function HomeRisksSection({ locale }: HomeRisksSectionProps) {
  const messages = await loadCompleteMessages(locale);

  const items: HomeRiskItem[] = RISK_KEYS.map((key) => ({
    key,
    title: readRisk(messages, ["items", key, "title"]),
    body: readRisk(messages, ["items", key, "body"]),
  }));

  return (
    <HomeRisksSectionView
      overline={readRisk(messages, ["overline"])}
      title={readRisk(messages, ["title"])}
      body={readRisk(messages, ["body"])}
      items={items}
    />
  );
}
