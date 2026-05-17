import {
  HomeConfirmSectionView,
  type HomeConfirmPoint,
} from "@/components/sections/home-confirm-section-view";
import { loadCompleteMessages } from "@/lib/i18n/load-messages";
import {
  readMessagePath,
  type MessageRecord,
} from "@/lib/i18n/read-message-path";
import type { Locale } from "@/types/content.types";

export interface HomeConfirmSectionProps {
  locale: Locale;
}

const POINT_KEYS = ["compatibility", "material", "fit"] as const;

function readConfirm(messages: MessageRecord, path: string[]): string {
  const fullPath = ["home", "confirm", ...path];
  return readMessagePath(messages, fullPath, fullPath.join("."));
}

export async function HomeConfirmSection({ locale }: HomeConfirmSectionProps) {
  const messages = await loadCompleteMessages(locale);

  const points: HomeConfirmPoint[] = POINT_KEYS.map((key) => ({
    key,
    title: readConfirm(messages, ["points", key, "title"]),
    body: readConfirm(messages, ["points", key, "body"]),
  }));

  return (
    <HomeConfirmSectionView
      overline={readConfirm(messages, ["overline"])}
      title={readConfirm(messages, ["title"])}
      body={readConfirm(messages, ["body"])}
      points={points}
    />
  );
}
