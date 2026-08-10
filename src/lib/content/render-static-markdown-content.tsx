/**
 * Static Markdown Content Renderer
 *
 * Renders lightweight static markdown content into React elements.
 * Supports headings, lists, tables, inline bold text, and links.
 */

import type { ReactNode } from "react";
import { InlineMarkdown } from "@/lib/content/inline-markdown";

const H2_PREFIX_LENGTH = 3;
const H3_PREFIX_LENGTH = 4;

function isTableRow(line: string): boolean {
  return line.startsWith("|") && line.endsWith("|");
}

function parseTableRow(line: string): string[] {
  return line
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  return parseTableRow(line).every((cell) => /^:?-+:?$/.test(cell));
}

export function slugifyHeading(text: string): string {
  const trimmed = text.trim();
  if (trimmed === "") {
    return "";
  }

  return trimmed
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff\s-]/g, "")
    .replace(/\s+/g, "-");
}

function createParagraph(text: string, key: string): ReactNode {
  return (
    <p
      key={key}
      className="mt-3 max-w-[72ch] whitespace-pre-line text-base leading-7 text-muted-foreground"
    >
      <InlineMarkdown text={text} />
    </p>
  );
}

function createList(lines: string[], ordered: boolean, key: string): ReactNode {
  const className =
    "mt-3 max-w-[72ch] list-inside space-y-1 text-base leading-7 text-muted-foreground";
  const items = lines.map((line) => (
    <li key={`${key}-${line}`}>
      <InlineMarkdown text={line.replace(ordered ? /^\d+\.\s/ : /^-\s/, "")} />
    </li>
  ));

  return ordered ? (
    <ol key={key} className={`${className} list-decimal`}>
      {items}
    </ol>
  ) : (
    <ul key={key} className={`${className} list-disc`}>
      {items}
    </ul>
  );
}

function createTable(lines: string[], key: string): ReactNode {
  const headers = parseTableRow(lines[0] ?? "");
  const rows = lines.slice(2).map(parseTableRow);

  return (
    <div key={key} className="relative mt-4">
      <div
        aria-hidden
        className="from-background pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l to-transparent md:hidden"
      />
      <div
        aria-label={headers.filter(Boolean).join(", ")}
        className="overflow-x-auto [scrollbar-width:thin] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        data-scrollable-table="true"
        role="region"
        tabIndex={0}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {headers.map((header) => (
                <th
                  key={`header-${header || "row-heading"}`}
                  className="px-3 py-2 text-left font-medium text-foreground"
                >
                  <InlineMarkdown text={header} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`} className="border-b last:border-0">
                {headers.map((_header, cellIndex) => (
                  <td
                    key={`cell-${rowIndex}-${cellIndex}`}
                    className="px-3 py-2 text-muted-foreground"
                  >
                    <InlineMarkdown text={row[cellIndex] ?? ""} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface MarkdownBlock {
  readonly consumedLines: number;
  readonly element: ReactNode;
}

function collectLines(
  lines: string[],
  startIndex: number,
  matches: (line: string) => boolean,
): string[] {
  const collected: string[] = [];
  for (let index = startIndex; matches(lines[index] ?? ""); index += 1) {
    collected.push(lines[index] ?? "");
  }
  return collected;
}

function createHeading(line: string, index: number): ReactNode | null {
  if (line.startsWith("### ")) {
    const text = line.slice(H3_PREFIX_LENGTH).trim();
    const id = slugifyHeading(text);
    return (
      <h3
        key={`h3-${id || index}`}
        id={id || undefined}
        className="mt-6 scroll-mt-24 text-lg font-semibold text-foreground"
      >
        {text}
      </h3>
    );
  }

  if (!line.startsWith("## ")) return null;

  const text = line.slice(H2_PREFIX_LENGTH).trim();
  const id = slugifyHeading(text);
  return (
    <h2
      key={`h2-${id || index}`}
      id={id || undefined}
      className="text-section mt-10 scroll-mt-24 text-foreground first:mt-0"
    >
      {text}
    </h2>
  );
}

function parseBlock(lines: string[], index: number): MarkdownBlock | null {
  const line = lines[index] ?? "";
  if (!line) return null;

  const nextLine = lines[index + 1] ?? "";
  if (isTableRow(line) && isTableSeparator(nextLine)) {
    const rows = collectLines(lines, index + 2, isTableRow);
    return {
      consumedLines: rows.length + 2,
      element: createTable([line, nextLine, ...rows], `table-${index}`),
    };
  }

  const ordered = /^\d+\.\s/.test(line);
  if (ordered || line.startsWith("- ")) {
    const pattern = ordered ? /^\d+\.\s/ : /^-\s/;
    const listLines = collectLines(lines, index, (candidate) =>
      pattern.test(candidate),
    );
    return {
      consumedLines: listLines.length,
      element: createList(listLines, ordered, `list-${index}`),
    };
  }

  return {
    consumedLines: 1,
    element: createHeading(line, index) ?? createParagraph(line, `p-${index}`),
  };
}

export function createStaticMarkdownContent(content: string): ReactNode {
  const lines = content.split("\n").map((line) => line.trim());
  const elements: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const block = parseBlock(lines, index);
    if (block) elements.push(block.element);
    index += block?.consumedLines ?? 1;
  }

  return <>{elements}</>;
}
