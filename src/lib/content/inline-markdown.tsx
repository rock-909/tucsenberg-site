import type { ReactNode } from "react";

const BOLD_WRAPPER_LENGTH = 2;

interface InlineMarkdownProps {
  readonly text: string;
}

function InlineMarkdownPart({ part }: { readonly part: string }): ReactNode {
  if (part.startsWith("**") && part.endsWith("**")) {
    return (
      <strong className="font-medium text-foreground">
        {part.slice(BOLD_WRAPPER_LENGTH, -BOLD_WRAPPER_LENGTH)}
      </strong>
    );
  }

  return part;
}

export function InlineMarkdown({ text }: InlineMarkdownProps): ReactNode {
  let cursor = 0;

  return text.split(/(\*\*[^*]+\*\*)/g).flatMap((part) => {
    const key = `${cursor}-${part}`;
    cursor += part.length;

    if (part.length === 0) {
      return [];
    }

    return <InlineMarkdownPart key={key} part={part} />;
  });
}
