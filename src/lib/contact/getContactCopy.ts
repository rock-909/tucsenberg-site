import type { Locale } from "@/i18n/routing";
import { logger } from "@/lib/logger";
import { loadCompleteMessages } from "@/lib/i18n/load-messages";
import type { MessageRecord } from "@/lib/i18n/read-message-path";

interface ContactHeaderCopy {
  title: string;
  description: string;
}

interface ContactPanelContactCopy {
  title: string;
  emailLabel: string;
  emailUnavailable: string;
  phoneLabel: string;
}

interface ContactPanelHoursCopy {
  title: string;
  weekdaysLabel: string;
  saturdayLabel: string;
  sundayLabel: string;
  closedLabel: string;
}

interface ContactPanelResponseCopy {
  title: string;
  responseTimeLabel: string;
  responseTimeValue: string;
  bestForLabel: string;
  bestForValue: string;
  prepareLabel: string;
  prepareValue: string;
}

export interface ContactCopyModel {
  header: ContactHeaderCopy;
  panel: {
    contact: ContactPanelContactCopy;
    hours: ContactPanelHoursCopy;
    response: ContactPanelResponseCopy;
  };
}

const CONTACT_COPY_FALLBACKS = {
  title: "Contact",
  description:
    "Fastest route: the RFQ form asks the questions we would ask anyway.",
  "panel.contactTitle": "Email & RFQ",
  "panel.email": "Email",
  "panel.emailUnavailable": "Use the RFQ form if email is unavailable.",
  "panel.phone": "Phone",
  "panel.hoursTitle": "Time zone",
  "panel.weekdays": "China",
  "panel.saturday": "Follow-up",
  "panel.sunday": "US/EU hours",
  "panel.closed": "Closed",
  "panel.responseTitle": "What happens next",
  "panel.responseTimeLabel": "Reply within",
  "panel.responseTimeValue": "12 hours",
  "panel.bestForLabel": "Quote when",
  "panel.bestForValue": "Details are sufficient",
  "panel.prepareLabel": "Fastest route",
  "panel.prepareValue":
    "Use the RFQ form; it asks the questions we'd ask anyway.",
} satisfies Record<string, string>;

const CONTACT_MESSAGE_ROOTS = [["contact"]] as const;

function readMessageAtPath(messages: MessageRecord, pathSegments: string[]) {
  let current: unknown = messages;

  for (const segment of pathSegments) {
    if (
      typeof current !== "object" ||
      current === null ||
      !Object.prototype.hasOwnProperty.call(current, segment)
    ) {
      return null;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === "string" ? current : null;
}

function readContactMessage(messages: MessageRecord, key: string) {
  const keySegments = key.split(".");

  for (const rootSegments of CONTACT_MESSAGE_ROOTS) {
    const value = readMessageAtPath(messages, [
      ...rootSegments,
      ...keySegments,
    ]);
    if (value !== null) {
      return value;
    }
  }

  return null;
}

export function getContactCopyFromMessages(
  messages: MessageRecord,
): ContactCopyModel {
  const pick = (key: keyof typeof CONTACT_COPY_FALLBACKS) => {
    const value = readContactMessage(messages, key);
    if (value !== null) {
      return value;
    }

    logger.warn("Missing contact page copy; using fallback", { key });
    return CONTACT_COPY_FALLBACKS[key];
  };

  return {
    header: {
      title: pick("title"),
      description: pick("description"),
    },
    panel: {
      contact: {
        title: pick("panel.contactTitle"),
        emailLabel: pick("panel.email"),
        emailUnavailable: pick("panel.emailUnavailable"),
        phoneLabel: pick("panel.phone"),
      },
      hours: {
        title: pick("panel.hoursTitle"),
        weekdaysLabel: pick("panel.weekdays"),
        saturdayLabel: pick("panel.saturday"),
        sundayLabel: pick("panel.sunday"),
        closedLabel: pick("panel.closed"),
      },
      response: {
        title: pick("panel.responseTitle"),
        responseTimeLabel: pick("panel.responseTimeLabel"),
        responseTimeValue: pick("panel.responseTimeValue"),
        bestForLabel: pick("panel.bestForLabel"),
        bestForValue: pick("panel.bestForValue"),
        prepareLabel: pick("panel.prepareLabel"),
        prepareValue: pick("panel.prepareValue"),
      },
    },
  };
}

/**
 * Server-side helper to build a structured copy model for the contact page.
 *
 * Depends only on the explicit `locale` parameter and reads `contact.*`.
 */
export async function getContactCopy(
  locale: Locale,
): Promise<ContactCopyModel> {
  return getContactCopyFromMessages(await loadCompleteMessages(locale));
}
