/* eslint-disable react-hooks/rules-of-hooks -- architecture negative fixture is not a React component */
function useLeadFormSubmission(config: { endpoint: string }) {
  return config;
}

useLeadFormSubmission({ endpoint: "/api/inquiry" });
