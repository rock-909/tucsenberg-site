import type { Locale } from "@/types/i18n";
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
  title: "Contact Us",
  description:
    "Get in touch with our team for inquiries, support, or partnership opportunities.",
  "panel.contactTitle": "Contact Methods",
  "panel.email": "Email",
  "panel.emailUnavailable":
    "Use the form on this page; configure a real receiver before public launch.",
  "panel.phone": "Phone",
  "panel.hoursTitle": "Business Hours",
  "panel.weekdays": "Mon - Fri",
  "panel.saturday": "Saturday",
  "panel.sunday": "Sunday",
  "panel.closed": "Closed",
  "panel.responseTitle": "What to expect",
  "panel.responseTimeLabel": "Typical response",
  "panel.responseTimeValue": "Within 24 business hours",
  "panel.bestForLabel": "Best for",
  "panel.bestForValue":
    "RFQs, product specs, MOQ, samples, and lead-time questions",
  "panel.prepareLabel": "Helpful details",
  "panel.prepareValue":
    "Share product type, size/standard, quantity, destination market, and timeline",
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
