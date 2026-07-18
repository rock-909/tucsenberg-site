import type { ReactNode } from "react";
import { type InquiryFormCopy } from "@/components/forms/inquiry-form-copy";
import { InquiryForm } from "@/components/forms/inquiry-form";
import { resolveInquiryContext } from "@/lib/lead-pipeline/inquiry-handoff";

interface RequestQuoteInquiryFormProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  inquiryCopy: InquiryFormCopy;
  inquiryFallback: ReactNode;
}

export async function RequestQuoteInquiryForm({
  searchParams,
  inquiryCopy,
  inquiryFallback,
}: RequestQuoteInquiryFormProps) {
  const resolvedSearchParams = await searchParams;
  const inquiryContext = resolveInquiryContext(resolvedSearchParams);

  return (
    <InquiryForm
      context={inquiryContext}
      copy={inquiryCopy}
      fallback={inquiryFallback}
      source="request-quote"
    />
  );
}
