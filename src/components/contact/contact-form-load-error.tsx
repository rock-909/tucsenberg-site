import { Button } from "@/components/ui/button";
import { StatusCallout } from "@/components/ui/status-callout";

interface ContactFormLoadErrorProps {
  errorMessage: string;
  onRetry: () => void;
  retryLabel: string;
}

export function ContactFormLoadError({
  errorMessage,
  onRetry,
  retryLabel,
}: ContactFormLoadErrorProps) {
  return (
    <StatusCallout className="p-6" tone="error">
      <p>{errorMessage}</p>
      <Button
        className="mt-4"
        onClick={onRetry}
        size="sm"
        type="button"
        variant="outline"
      >
        {retryLabel}
      </Button>
    </StatusCallout>
  );
}
