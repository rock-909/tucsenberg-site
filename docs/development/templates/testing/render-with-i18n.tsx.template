import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messagesFixture from "./fixtures/messages.min.json";

interface I18nOptions {
  locale?: "en" | "zh";
  messages?: Record<string, any>;
  renderOptions?: RenderOptions;
}

export function renderWithI18nAndLocale(
  ui: React.ReactElement,
  {
    locale = "en",
    messages = messagesFixture,
    renderOptions,
  }: I18nOptions = {},
) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {ui}
    </NextIntlClientProvider>,
    renderOptions,
  );
}

export type { I18nOptions };
