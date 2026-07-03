"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

export interface RouteErrorViewProps {
  error: Error & { digest?: string };
  reset: () => void;
  logContext: string;
  translationFn: (key: string) => string;
}

export function RouteErrorView({
  error,
  reset,
  logContext,
  translationFn,
}: RouteErrorViewProps) {
  useEffect(() => {
    logger.error(`${logContext} route error`, error);
  }, [error, logContext]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <h2 className="text-2xl font-semibold">{translationFn("title")}</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          {translationFn("description")}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" onClick={reset}>
            {translationFn("tryAgain")}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">{translationFn("goHome")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
