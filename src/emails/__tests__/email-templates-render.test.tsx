import { render } from "react-email";
import { describe, expect, it } from "vitest";
import type { EmailTemplateData } from "@/lib/email/email-data-schema";
import { ConfirmationEmail } from "@/emails/ConfirmationEmail";
import { ContactFormEmail } from "@/emails/ContactFormEmail";

const contactEmailData: EmailTemplateData = {
  firstName: "Jane",
  lastName: "Smith",
  email: "jane.smith@example.com",
  company: "Smith Industries",
  phone: "+1 555 0100",
  subject: "showcase offer example quote",
  message: "Need a distributor quote.\nPlease include MOQ and lead time.",
  submittedAt: "2026-04-29T12:00:00.000Z",
  marketingConsent: true,
};

describe("contact email templates", () => {
  describe("ContactFormEmail", () => {
    it("renders the admin notification as HTML", async () => {
      const html = await render(<ContactFormEmail {...contactEmailData} />);

      expect(html).toContain("New Contact Form Submission");
      expect(html).toContain("Jane Smith");
      expect(html).toContain("jane.smith@example.com");
      expect(html).toContain("Need a distributor quote.");
      expect(html).toContain("MOQ and lead time");
    });

    it("renders the admin notification as plain text", async () => {
      const text = await render(<ContactFormEmail {...contactEmailData} />, {
        plainText: true,
      });

      expect(text).toContain("Jane Smith");
      expect(text).toContain("showcase offer example quote");
      expect(text).toContain("Need a distributor quote.");
    });

    it("preserves duplicate and empty message lines", async () => {
      const text = await render(
        <ContactFormEmail
          {...contactEmailData}
          message={"Repeat line\n\nRepeat line"}
        />,
        { plainText: true },
      );

      expect(text.match(/Repeat line/g)).toHaveLength(2);
    });
  });

  describe("ConfirmationEmail", () => {
    it("renders the customer confirmation as HTML", async () => {
      const html = await render(<ConfirmationEmail {...contactEmailData} />);

      expect(html).toContain("Thank You for Contacting Us");
      expect(html).toContain("Dear");
      expect(html).toContain("Jane");
      expect(html).toContain("Smith Industries");
      expect(html).toContain("We have received your message");
    });

    it("renders the customer confirmation as plain text", async () => {
      const text = await render(<ConfirmationEmail {...contactEmailData} />, {
        plainText: true,
      });

      expect(text).toContain("Dear Jane");
      expect(text).toContain("Smith Industries");
      expect(text).toContain("get back to you within 24 hours");
    });
  });
});
