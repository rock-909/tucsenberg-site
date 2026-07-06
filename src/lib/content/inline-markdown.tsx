import type { ReactNode } from "react";
import { Link } from "@/i18n/routing";
import { createInternalLinkPattern } from "@/lib/content/inline-markdown-text";

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

function BoldText({ text }: InlineMarkdownProps): ReactNode {
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

export function InlineMarkdown({ text }: InlineMarkdownProps): ReactNode {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(createInternalLinkPattern())) {
    const [fullMatch, label = "", href = ""] = match;
    const { index } = match;

    if (index > lastIndex) {
      const plain = text.slice(lastIndex, index);
      nodes.push(<BoldText key={`text-${lastIndex}`} text={plain} />);
    }

    nodes.push(
      <Link
        key={`link-${index}`}
        href={href}
        className="text-primary font-medium underline underline-offset-4 hover:no-underline"
      >
        {label}
      </Link>,
    );

    lastIndex = index + fullMatch.length;
  }

  if (lastIndex === 0) {
    return <BoldText text={text} />;
  }

  if (lastIndex < text.length) {
    nodes.push(<BoldText key={`text-${lastIndex}`} text={text.slice(lastIndex)} />);
  }

  return nodes;
}
