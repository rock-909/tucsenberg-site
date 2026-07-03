import type { ReactNode } from "react";
import {
  createStaticMarkdownContent,
  parseHeadingId,
} from "@/lib/content/render-static-markdown-content";

export { parseHeadingId };

export function createLegalContent(content: string): ReactNode {
  return createStaticMarkdownContent(content);
}
