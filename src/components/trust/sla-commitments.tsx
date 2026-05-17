import {
  SlaCommitmentsView,
  type SlaCommitmentsLayout,
} from "@/components/trust/sla-commitments-view";
import { loadCompleteMessages } from "@/lib/i18n/load-messages";
import {
  readMessagePath,
  type MessageRecord,
} from "@/lib/i18n/read-message-path";
import type { Locale } from "@/types/content.types";

export interface SlaCommitmentsProps {
  locale: Locale;
  layout: SlaCommitmentsLayout;
}

const SLA_KEYS = ["review", "standardRfq", "urgent"] as const;

function readSlaMessage(messages: MessageRecord, key: string): string {
  return readMessagePath(messages, ["trust", "sla", key], key);
}

export async function SlaCommitments({ locale, layout }: SlaCommitmentsProps) {
  const messages = await loadCompleteMessages(locale);
  const commitments = SLA_KEYS.map((key) => readSlaMessage(messages, key));

  return <SlaCommitmentsView layout={layout} commitments={commitments} />;
}
