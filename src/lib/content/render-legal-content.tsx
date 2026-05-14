/**
 * Legal Content Renderer
 *
 * Renders MDX legal content (Terms, Privacy) into React elements.
 * Supports headings, lists, tables, and inline bold text.
 */

import type { ReactNode } from 'react';

/** Magic number: slice offset for removing ** wrapper from bold text */
const BOLD_WRAPPER_LENGTH = 2;
const H2_PREFIX_LENGTH = 3;
const H3_PREFIX_LENGTH = 4;
const LIST_ITEM_PREFIX_LENGTH = 2;
const EXPLICIT_ID_PATTERN = /\s*\\?\{#([a-z0-9-]+)\\?\}\s*$/;

function slugifyHeading(text: string): string {
  const trimmed = text.trim();
  if (trimmed === '') {
    return '';
  }

  return trimmed
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff\s-]/g, '')
    .replace(/\s+/g, '-');
}

export function parseHeadingId(text: string): { displayText: string; id: string } {
  const match = EXPLICIT_ID_PATTERN.exec(text);
  if (match) {
    return { displayText: text.slice(0, match.index).trim(), id: match[1] ?? "" };
  }
  return { displayText: text, id: slugifyHeading(text) };
}

interface RenderState {
  elements: ReactNode[];
  listItems: ReactNode[];
  listType: "ordered" | "unordered" | null;
  tableRows: string[][];
  tableHeaders: string[];
  inTable: boolean;
  index: number;
}

function createListElement(state: RenderState): ReactNode | null {
  if (state.listItems.length === 0) return null;

  const className =
    'mt-3 list-inside space-y-1 text-sm text-muted-foreground';
  if (state.listType === "ordered") {
    return (
      <ol key={`ol-${state.index}`} className={`${className} list-decimal`}>
        {state.listItems.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ol>
    );
  }

  return (
    <ul
      key={`ul-${state.index}`}
      className={`${className} list-disc`}
    >
      {state.listItems.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function createTableElement(state: RenderState): ReactNode | null {
  if (state.tableRows.length === 0 || state.tableHeaders.length === 0) {
    return null;
  }

  return (
    <div key={`table-${state.index}`} className='mt-4 overflow-x-auto'>
      <table className='w-full text-sm'>
        <thead>
          <tr className='border-b'>
            {state.tableHeaders.map((header, i) => (
              <th
                key={i}
                className='px-3 py-2 text-left font-medium text-foreground'
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {state.tableRows.map((row, rowIndex) => (
            <tr key={rowIndex} className='border-b last:border-0'>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className='px-3 py-2 text-muted-foreground'
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function flushList(state: RenderState): void {
  const el = createListElement(state);
  if (el) {
    state.elements.push(el);
    state.listItems = [];
    state.listType = null;
  }
}

function flushTable(state: RenderState): void {
  const el = createTableElement(state);
  if (el) {
    state.elements.push(el);
    state.tableHeaders = [];
    state.tableRows = [];
  }
  state.inTable = false;
}

function parseTableRow(line: string): string[] {
  return line
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim());
}

function isTableSeparator(cells: string[]): boolean {
  return cells.every((cell) => /^-+$/.test(cell));
}

function renderInlineMarkdownParts(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className='font-medium text-foreground'>
          {part.slice(BOLD_WRAPPER_LENGTH, -BOLD_WRAPPER_LENGTH)}
        </strong>
      );
    }
    return part;
  });
}

function renderInlineBold(text: string, index: number): ReactNode {
  return (
    <p
      key={`p-${index}`}
      className='mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground'
    >
      {renderInlineMarkdownParts(text)}
    </p>
  );
}

/** Process table row syntax */
function handleTableLine(state: RenderState, trimmed: string): boolean {
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) {
    return false;
  }

  flushList(state);
  const cells = parseTableRow(trimmed);

  if (isTableSeparator(cells)) {
    state.inTable = true;
    return true;
  }

  if (!state.inTable && state.tableHeaders.length === 0) {
    state.tableHeaders = cells;
  } else {
    state.tableRows.push(cells);
  }
  return true;
}

/** Process list item syntax */
function handleListLine(state: RenderState, trimmed: string): boolean {
  // Ordered list
  if (/^\d+\.\s/.test(trimmed)) {
    if (state.listType === "unordered") {
      flushList(state);
    }
    const text = trimmed.replace(/^\d+\.\s/, '');
    state.listType = "ordered";
    state.listItems.push(renderInlineMarkdownParts(text));
    return true;
  }

  // Unordered list
  if (trimmed.startsWith('- ')) {
    if (state.listType === "ordered") {
      flushList(state);
    }
    const text = trimmed.slice(LIST_ITEM_PREFIX_LENGTH);
    state.listType = "unordered";
    state.listItems.push(renderInlineMarkdownParts(text));
    return true;
  }

  return false;
}

/** Render H2 heading */
function renderH2(state: RenderState, trimmed: string): void {
  const raw = trimmed.slice(H2_PREFIX_LENGTH).trim();
  const { displayText, id } = parseHeadingId(raw);
  state.elements.push(
    <h2
      key={`h2-${id || state.index}`}
      id={id || undefined}
      className='mt-8 scroll-mt-24 text-xl font-semibold tracking-tight text-foreground first:mt-0'
    >
      {displayText}
    </h2>,
  );
  state.index += 1;
}

/** Render H3 heading */
function renderH3(state: RenderState, trimmed: string): void {
  const raw = trimmed.slice(H3_PREFIX_LENGTH).trim();
  const { displayText, id } = parseHeadingId(raw);
  state.elements.push(
    <h3
      key={`h3-${id || state.index}`}
      id={id || undefined}
      className='mt-6 scroll-mt-24 text-base font-semibold text-foreground'
    >
      {displayText}
    </h3>,
  );
  state.index += 1;
}

/** Render bold paragraph */
function renderBoldParagraph(state: RenderState, trimmed: string): void {
  const text = trimmed.slice(BOLD_WRAPPER_LENGTH, -BOLD_WRAPPER_LENGTH);
  state.elements.push(
    <p key={`em-${state.index}`} className='mt-3 text-sm font-medium text-foreground'>
      {text}
    </p>,
  );
  state.index += 1;
}

/** Process heading and paragraph syntax */
function handleTextLine(state: RenderState, trimmed: string): void {
  flushList(state);
  flushTable(state);

  if (trimmed.startsWith('## ')) {
    renderH2(state, trimmed);
    return;
  }

  if (trimmed.startsWith('### ')) {
    renderH3(state, trimmed);
    return;
  }

  if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
    renderBoldParagraph(state, trimmed);
    return;
  }

  state.elements.push(renderInlineBold(trimmed, state.index));
  state.index += 1;
}

/**
 * Renders legal MDX content into React elements
 */
export function renderLegalContent(content: string): ReactNode {
  const lines = content.split('\n');
  const state: RenderState = {
    elements: [],
    listItems: [],
    listType: null,
    tableRows: [],
    tableHeaders: [],
    inTable: false,
    index: 0,
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '') {
      flushList(state);
      if (!state.inTable) {
        flushTable(state);
      }
      continue;
    }

    // Try table syntax first
    if (handleTableLine(state, trimmed)) {
      continue;
    }

    // Exit table mode if not a table line
    if (state.inTable) {
      flushTable(state);
    }

    // Try list syntax
    if (handleListLine(state, trimmed)) {
      continue;
    }

    // Handle text (headings, paragraphs)
    handleTextLine(state, trimmed);
  }

  flushList(state);
  flushTable(state);

  return <>{state.elements}</>;
}
