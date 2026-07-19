/* eslint-disable @typescript-eslint/no-unused-vars -- architecture negative fixture keeps import for symbol shadowing proof */
import { useLeadFormSubmission } from "@/lib/forms/use-lead-form-submission";

function Component() {
  function useLeadFormSubmission(config: { endpoint: string }) {
    return config;
  }

  useLeadFormSubmission({ endpoint: "/api/inquiry" });
}
