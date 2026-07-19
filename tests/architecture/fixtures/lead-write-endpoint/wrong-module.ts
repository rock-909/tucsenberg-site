/* eslint-disable react-hooks/rules-of-hooks -- architecture negative fixture is not a React component */
import { useLeadFormSubmission } from "./fake-lead-form-submission";

useLeadFormSubmission({ endpoint: "/api/inquiry" });
