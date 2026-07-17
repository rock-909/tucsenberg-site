"use client";

import { useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { ProductFamilyContextNotice } from "@/components/contact/product-family-context-notice";
import { parseProductFamilyContactContext } from "@/lib/contact/product-family-context";

function searchParamsToRecord(
  searchParams: ReadonlyURLSearchParams,
): Record<string, string | string[] | undefined> {
  const record: Record<string, string | string[] | undefined> = {};

  for (const key of new Set(searchParams.keys())) {
    const values = searchParams.getAll(key);
    record[key] = values.length > 1 ? values : values[0];
  }

  return record;
}

export function ProductFamilyContextNoticeClient({
  label,
  messages,
}: {
  label: string;
  messages: Record<string, unknown>;
}) {
  const searchParams = useSearchParams();
  const context = parseProductFamilyContactContext({
    searchParams: searchParamsToRecord(searchParams),
    messages,
  });

  return <ProductFamilyContextNotice context={context} label={label} />;
}
