import type { ReactNode } from "react";
import {
  createInquiryFormCopy,
  type InquiryFormCopy,
} from "@/components/forms/inquiry-form-copy";
import { InquiryForm } from "@/components/forms/inquiry-form";
import { resolveInquiryContext } from "@/lib/lead-pipeline/inquiry-handoff";
import { getTranslations } from "next-intl/server";

interface RequestQuoteInquiryFormProps {
  locale: string;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
  inquiryCopy?: InquiryFormCopy;
  inquiryFallback?: ReactNode;
}

export async function RequestQuoteInquiryForm({
  locale,
  searchParams,
  inquiryCopy: inquiryCopyOverride,
  inquiryFallback,
}: RequestQuoteInquiryFormProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const inquiryContext = resolveInquiryContext(resolvedSearchParams);
  let inquiryCopy = inquiryCopyOverride;

  if (!inquiryCopy) {
    const tInquiryForm = await getTranslations({
      locale,
      namespace: "inquiry.form",
    });
    inquiryCopy = createInquiryFormCopy((key) =>
      tInquiryForm(key as Parameters<typeof tInquiryForm>[0]),
    );
  }

  return (
    <InquiryForm
      context={inquiryContext}
      copy={inquiryCopy}
      fallback={inquiryFallback ?? null}
      source="request-quote"
    />
  );
}
