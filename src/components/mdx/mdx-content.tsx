/**
 * MDX Content Renderer
 *
 * A React Server Component that renders MDX content securely without innerHTML.
 */

import type { ReactNode } from "react";
import type { ContentType, Locale } from "@/types/content.types";
import { getMDXComponent } from "@/lib/mdx-loader";

interface MDXContentProps {
  type: ContentType;
  locale: Locale;
  slug: string;
  className?: string;
}

export async function MDXContent({
  type,
  locale,
  slug,
  className,
}: MDXContentProps): Promise<ReactNode> {
  const Content = await getMDXComponent(type, locale, slug);

  if (Content === null) {
    return null;
  }

  return (
    <div className={className}>
      <Content />
    </div>
  );
}
