import { BatchControlsBlockView } from "@/components/trust/batch-controls-block-view";
import { loadCompleteMessages } from "@/lib/i18n/load-messages";
import {
  readMessagePath,
  type MessageRecord,
} from "@/lib/i18n/read-message-path";
import type { Locale } from "@/types/content.types";

export interface BatchControlsBlockProps {
  locale: Locale;
}

function readBatchMessage(messages: MessageRecord, key: string): string {
  return readMessagePath(messages, ["trust", "batch", key], key);
}

export async function BatchControlsBlock({ locale }: BatchControlsBlockProps) {
  const messages = await loadCompleteMessages(locale);

  return (
    <BatchControlsBlockView
      title={readBatchMessage(messages, "title")}
      traceability={readBatchMessage(messages, "traceability")}
      photos={readBatchMessage(messages, "photos")}
      sample={readBatchMessage(messages, "sample")}
    />
  );
}
