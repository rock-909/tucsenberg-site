import { Card } from "@/components/ui/card";
import { readRequiredMessagePath } from "@/lib/i18n/read-message-path";

function pickContactFormCopy(messages: Record<string, unknown>, key: string) {
  return readRequiredMessagePath(messages, ["contact", "form", key]);
}

export function ContactFormStaticFallback({
  messages,
}: {
  messages: Record<string, unknown>;
}) {
  const pick = (key: string) => pickContactFormCopy(messages, key);

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <form
        aria-busy="true"
        aria-label={pick("title")}
        className="space-y-6 p-6"
        data-contact-form-fallback="static"
        noValidate
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm" htmlFor="fullName">
              <span translate="no">{pick("fullName")}</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              disabled
              required
              autoComplete="name"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm" htmlFor="email">
              <span translate="no">{pick("email")}</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              disabled
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm" htmlFor="company">
              <span translate="no">{pick("company")}</span>
              <span
                className="ml-1 text-xs text-muted-foreground"
                data-contact-form-field-optional="company"
                translate="no"
              >
                {pick("optional")}
              </span>
            </label>
            <input
              id="company"
              name="company"
              type="text"
              disabled
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm" htmlFor="message">
            <span translate="no">{pick("message")}</span>
          </label>
          <textarea
            id="message"
            name="message"
            disabled
            required
            rows={4}
            className="flex min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            id="acceptPrivacy"
            name="acceptPrivacy"
            type="checkbox"
            disabled
            required
            className="h-4 w-4 rounded border border-input"
          />
          <label className="text-sm" htmlFor="acceptPrivacy">
            <span translate="no">{pick("acceptPrivacy")}</span>
          </label>
        </div>
        <button
          aria-disabled="true"
          className="inline-flex h-10 w-full items-center justify-center rounded-[6px] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground opacity-60"
          disabled
          type="submit"
        >
          <span translate="no">{pick("submit")}</span>
        </button>
      </form>
    </Card>
  );
}
