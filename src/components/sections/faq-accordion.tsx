import { InlineMarkdown } from "@/lib/content/inline-markdown";

interface FaqAccordionProps {
  items: Array<{
    key: string;
    question: string;
    answer: string;
  }>;
}

function FaqChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      className="text-muted-foreground size-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  return (
    <div
      className="bg-card shadow-card divide-y-0 rounded-lg border-0"
      data-testid="faq-accordion"
    >
      {items.map((item) => (
        <details
          key={item.key}
          className="group border-border border-t border-b-0 first:border-t-0"
        >
          <summary className="text-muted-foreground hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-background group-open:text-foreground flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-left text-[15px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
            <span data-testid={`faq-question-${item.key}`} translate="no">
              {item.question}
            </span>
            <FaqChevronIcon />
          </summary>
          <div className="px-6 pb-4">
            <p
              className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line"
              data-testid={`faq-answer-${item.key}`}
            >
              <InlineMarkdown text={item.answer} />
            </p>
          </div>
        </details>
      ))}
    </div>
  );
}
