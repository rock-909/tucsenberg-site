import { CompatibilityProofBoxView } from "@/components/trust/compatibility-proof-box-view";
import { loadCompleteMessages } from "@/lib/i18n/load-messages";
import {
  readMessagePath,
  type MessageRecord,
} from "@/lib/i18n/read-message-path";
import type { Locale } from "@/types/content.types";

export interface CompatibilityProofBoxProps {
  locale: Locale;
  extraChecks?: readonly string[];
}

function readProofMessage(messages: MessageRecord, key: string): string {
  return readMessagePath(messages, ["trust", "proof", key], key);
}

export async function CompatibilityProofBox({
  locale,
  extraChecks,
}: CompatibilityProofBoxProps) {
  const messages = await loadCompleteMessages(locale);

  return (
    <CompatibilityProofBoxView
      title={readProofMessage(messages, "title")}
      body={readProofMessage(messages, "body")}
      {...(extraChecks ? { extraChecks } : {})}
    />
  );
}
