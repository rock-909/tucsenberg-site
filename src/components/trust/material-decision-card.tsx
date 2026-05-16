import {
  MaterialDecisionCardView,
  type MaterialDecisionDefault,
} from "@/components/trust/material-decision-card-view";
import { loadCompleteMessages } from "@/lib/i18n/load-messages";
import {
  readMessagePath,
  type MessageRecord,
} from "@/lib/i18n/read-message-path";
import type { Locale } from "@/types/content.types";

export interface MaterialDecisionCardProps {
  locale: Locale;
  defaultMaterial?: MaterialDecisionDefault;
}

function readMaterialMessage(messages: MessageRecord, key: string): string {
  return readMessagePath(messages, ["trust", "material", key], key);
}

export async function MaterialDecisionCard({
  locale,
  defaultMaterial = "epdm",
}: MaterialDecisionCardProps) {
  const messages = await loadCompleteMessages(locale);

  return (
    <MaterialDecisionCardView
      title={readMaterialMessage(messages, "title")}
      epdmLabel={readMaterialMessage(messages, "epdmLabel")}
      epdmBody={readMaterialMessage(messages, "epdmBody")}
      tpuLabel={readMaterialMessage(messages, "tpuLabel")}
      tpuBody={readMaterialMessage(messages, "tpuBody")}
      defaultMaterial={defaultMaterial}
    />
  );
}
