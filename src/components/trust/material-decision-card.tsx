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

function readMaterialMessage(
  messages: MessageRecord,
  path: readonly string[],
): string {
  const fallback = path[path.length - 1] ?? "";
  return readMessagePath(messages, ["trust", "material", ...path], fallback);
}

export async function MaterialDecisionCard({
  locale,
  defaultMaterial = "epdm",
}: MaterialDecisionCardProps) {
  const messages = await loadCompleteMessages(locale);

  return (
    <MaterialDecisionCardView
      title={readMaterialMessage(messages, ["title"])}
      epdmLabel={readMaterialMessage(messages, ["epdm", "label"])}
      epdmCondition={readMaterialMessage(messages, ["epdm", "condition"])}
      tpuLabel={readMaterialMessage(messages, ["tpu", "label"])}
      tpuCondition={readMaterialMessage(messages, ["tpu", "condition"])}
      note={readMaterialMessage(messages, ["note"])}
      defaultMaterial={defaultMaterial}
    />
  );
}
