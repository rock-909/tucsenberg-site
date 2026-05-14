import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Locale } from "@/types/i18n";
import {
  getContactCopy,
  getContactCopyFromMessages,
} from "@/lib/contact/getContactCopy";

const { mockLoadCompleteMessages, mockLoggerWarn } = vi.hoisted(() => ({
  mockLoadCompleteMessages: vi.fn(),
  mockLoggerWarn: vi.fn(),
}));

vi.mock("@/lib/i18n/load-messages", () => ({
  loadCompleteMessages: mockLoadCompleteMessages,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: mockLoggerWarn,
  },
}));

describe("getContactCopy", () => {
  const defaultTranslations = {
    title: "Contact Us",
    description: "Get in touch with our team",
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
  } as const;

  const defaultMessages = {
    contact: {
      title: defaultTranslations.title,
      description: defaultTranslations.description,
      panel: {
        contactTitle: defaultTranslations["panel.contactTitle"],
        email: defaultTranslations["panel.email"],
        emailUnavailable: defaultTranslations["panel.emailUnavailable"],
        phone: defaultTranslations["panel.phone"],
        hoursTitle: defaultTranslations["panel.hoursTitle"],
        weekdays: defaultTranslations["panel.weekdays"],
        saturday: defaultTranslations["panel.saturday"],
        sunday: defaultTranslations["panel.sunday"],
        closed: defaultTranslations["panel.closed"],
        responseTitle: defaultTranslations["panel.responseTitle"],
        responseTimeLabel: defaultTranslations["panel.responseTimeLabel"],
        responseTimeValue: defaultTranslations["panel.responseTimeValue"],
        bestForLabel: defaultTranslations["panel.bestForLabel"],
        bestForValue: defaultTranslations["panel.bestForValue"],
        prepareLabel: defaultTranslations["panel.prepareLabel"],
        prepareValue: defaultTranslations["panel.prepareValue"],
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadCompleteMessages.mockResolvedValue(defaultMessages);
  });

  it("loads contact copy from the top-level contact namespace", async () => {
    const locale: Locale = "en";

    const copy = await getContactCopy(locale);

    expect(mockLoadCompleteMessages).toHaveBeenCalledWith(locale);

    expect(copy.header.title).toBe("Contact Us");
    expect(copy.header.description).toBe("Get in touch with our team");
    expect(copy.panel.contact.title).toBe("Contact Methods");
    expect(copy.panel.response.prepareValue).toBe(
      "Share product type, size/standard, quantity, destination market, and timeline",
    );
    expect(mockLoggerWarn).not.toHaveBeenCalled();
  });

  it("prefers the top-level contact namespace over the legacy contact copy path", () => {
    const copy = getContactCopyFromMessages({
      contact: {
        title: "Top-level contact",
        description: "Top-level description",
        panel: {
          contactTitle: "Top-level methods",
          email: "Top-level email",
          emailUnavailable: "Top-level email unavailable",
          phone: "Top-level phone",
          hoursTitle: "Top-level hours",
          weekdays: "Top-level weekdays",
          saturday: "Top-level saturday",
          sunday: "Top-level sunday",
          closed: "Top-level closed",
          responseTitle: "Top-level response",
          responseTimeLabel: "Top-level response label",
          responseTimeValue: "Top-level response value",
          bestForLabel: "Top-level best for",
          bestForValue: "Top-level best value",
          prepareLabel: "Top-level prepare label",
          prepareValue: "Top-level prepare value",
        },
      },
      underConstruction: {
        pages: {
          contact: {
            title: "Legacy contact",
            description: "Legacy description",
            panel: {
              contactTitle: "Legacy methods",
              email: "Legacy email",
              emailUnavailable: "Legacy email unavailable",
              phone: "Legacy phone",
              hoursTitle: "Legacy hours",
              weekdays: "Legacy weekdays",
              saturday: "Legacy saturday",
              sunday: "Legacy sunday",
              closed: "Legacy closed",
              responseTitle: "Legacy response",
              responseTimeLabel: "Legacy response label",
              responseTimeValue: "Legacy response value",
              bestForLabel: "Legacy best for",
              bestForValue: "Legacy best value",
              prepareLabel: "Legacy prepare label",
              prepareValue: "Legacy prepare value",
            },
          },
        },
      },
    });

    expect(copy.header.title).toBe("Top-level contact");
    expect(copy.header.description).toBe("Top-level description");
    expect(copy.panel.contact.title).toBe("Top-level methods");
    expect(copy.panel.response.prepareValue).toBe("Top-level prepare value");
  });

  it("does not read the legacy underConstruction contact namespace as a production fallback", () => {
    const copy = getContactCopyFromMessages({
      underConstruction: {
        pages: {
          contact: {
            title: "Legacy contact",
            description: "Legacy description",
            panel: {
              contactTitle: "Legacy methods",
              email: "Legacy email",
              emailUnavailable: "Legacy email unavailable",
              phone: "Legacy phone",
              hoursTitle: "Legacy hours",
              weekdays: "Legacy weekdays",
              saturday: "Legacy saturday",
              sunday: "Legacy sunday",
              closed: "Legacy closed",
              responseTitle: "Legacy response",
              responseTimeLabel: "Legacy response label",
              responseTimeValue: "Legacy response value",
              bestForLabel: "Legacy best for",
              bestForValue: "Legacy best value",
              prepareLabel: "Legacy prepare label",
              prepareValue: "Legacy prepare value",
            },
          },
        },
      },
    });

    expect(copy.header.title).toBe("Contact Us");
    expect(copy.header.description).toBe(
      "Get in touch with our team for inquiries, support, or partnership opportunities.",
    );

    expect(copy.panel.contact.title).toBe("Contact Methods");
    expect(copy.panel.contact.emailLabel).toBe("Email");
    expect(copy.panel.contact.phoneLabel).toBe("Phone");

    expect(copy.panel.hours.title).toBe("Business Hours");
    expect(copy.panel.hours.weekdaysLabel).toBe("Mon - Fri");
    expect(copy.panel.hours.saturdayLabel).toBe("Saturday");
    expect(copy.panel.hours.sundayLabel).toBe("Sunday");
    expect(copy.panel.hours.closedLabel).toBe("Closed");
    expect(copy.panel.response.title).toBe("What to expect");
    expect(copy.panel.response.responseTimeValue).toBe(
      "Within 24 business hours",
    );
    expect(copy.panel.response.bestForLabel).toBe("Best for");
    expect(copy.panel.response.prepareLabel).toBe("Helpful details");
    expect(mockLoggerWarn).toHaveBeenCalled();
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      "Missing contact page copy; using fallback",
      { key: "title" },
    );
  });

  it("falls back to user-readable copy when static messages miss keys", () => {
    const copy = getContactCopyFromMessages({});

    expect(copy.header.title).toBe("Contact Us");
    expect(copy.header.description).toContain("Get in touch");
    expect(copy.panel.hours.closedLabel).toBe("Closed");
    expect(mockLoggerWarn).toHaveBeenCalled();
  });
});
