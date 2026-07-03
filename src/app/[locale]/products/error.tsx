"use client";

import { useTranslations } from "next-intl";
import { RouteErrorView } from "@/components/errors/route-error-view";

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProductsRouteError({ error, reset }: RouteErrorProps) {
  const t = useTranslations("errors.products");
  const translateError = (key: string) => t(key as Parameters<typeof t>[0]);

  return (
    <RouteErrorView
      error={error}
      reset={reset}
      logContext="Products"
      translationFn={translateError}
    />
  );
}
