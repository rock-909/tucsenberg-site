import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import catalogMessages from "@messages/profiles/catalog/en/messages.json";
import { getPublicContactEmail } from "@/config/public-trust";
import { SINGLE_SITE_CONFIG, SINGLE_SITE_FACTS } from "@/config/single-site";
import { ABSORBENT_FLOOD_BAGS_PRODUCT_PAGE } from "@/constants/tucsenberg-product-page-absorbent-flood-bags";
import { ALUMINUM_FLOOD_GATES_PRODUCT_PAGE } from "@/constants/tucsenberg-product-page-aluminum-flood-gates";
import type {
  TucsenbergProductPage,
  TucsenbergProductTable,
} from "@/constants/tucsenberg-product-page-types";

const ROOT_DIR = process.cwd();
const MANIFEST_PATH =
  "scripts/quality/config/product-spec-sheets.generated.json";
const DOCUMENT_VERSION = "2026.08";
const PDF_METADATA_DATE = "20260801000000";
const APPROVED_REPLY_END = "Otherwise, we ask only for the missing essentials.";

export interface ProductSpecSheetDocument {
  id: "tb-ag" | "tb-fb";
  outputPath: string;
  html: string;
}

interface ProductSpecSheetManifest {
  version: 1;
  documents: Record<
    ProductSpecSheetDocument["id"],
    { htmlSha256: string; pdfSha256: string }
  >;
}

function cleanCopy(value: string): string {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/gu, "$1")
    .replace(/[‐‑‒–—―]/gu, "-")
    .replace(/\s+-\s+/gu, " - ");
}

function escapeHtml(value: string): string {
  return cleanCopy(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getTable(
  page: TucsenbergProductPage,
  title: string,
): TucsenbergProductTable {
  const section = page.sections.find(
    (candidate) => candidate.title === title && "table" in candidate,
  );
  if (!section || !("table" in section)) {
    throw new Error(`Missing product table: ${page.slug} / ${title}`);
  }
  return section.table;
}

function getFaqAnswer(page: TucsenbergProductPage, question: string): string {
  const faq = page.faqs.find((candidate) => candidate.question === question);
  if (!faq) {
    throw new Error(`Missing product FAQ: ${page.slug} / ${question}`);
  }
  return faq.answer;
}

function getSectionBullets(
  page: TucsenbergProductPage,
  title: string,
): readonly string[] {
  const section = page.sections.find(
    (candidate) => candidate.title === title && !("table" in candidate),
  );
  if (!section || "table" in section || !section.bullets) {
    throw new Error(`Missing product bullets: ${page.slug} / ${title}`);
  }
  return section.bullets;
}

function getSectionParagraphs(
  page: TucsenbergProductPage,
  title: string,
): readonly string[] {
  const section = page.sections.find(
    (candidate) => candidate.title === title && !("table" in candidate),
  );
  if (!section || "table" in section || !section.paragraphs) {
    throw new Error(`Missing product paragraphs: ${page.slug} / ${title}`);
  }
  return section.paragraphs;
}

function getSentenceContaining(source: string, fragment: string): string {
  const sentence = source
    .split(/(?<=[.!?])\s+/u)
    .find((candidate) => candidate.includes(fragment));
  if (!sentence) throw new Error(`Missing sentence containing: ${fragment}`);
  return sentence;
}

function getMatchedValue(
  source: string,
  pattern: RegExp,
  label: string,
): string {
  const value = pattern.exec(source)?.[1];
  if (!value) throw new Error(`Missing ${label}: ${source}`);
  return value;
}

function getApprovedReplyCopy(page: TucsenbergProductPage): string {
  const source = page.rfqNote ?? "";
  const start = source.indexOf("We reply within 12 hours.");
  const end = source.indexOf(APPROVED_REPLY_END);
  if (start < 0 || end < start) {
    throw new Error(`Missing approved reply contract: ${page.slug}`);
  }
  return source.slice(start, end + APPROVED_REPLY_END.length);
}

function getTableValue(table: TucsenbergProductTable, label: string): string {
  const row = table.rows.find(([candidate]) => candidate === label);
  const value = row?.[1];
  if (!value) throw new Error(`Missing specification row: ${label}`);
  return value;
}

function renderTable(table: TucsenbergProductTable): string {
  const header = table.columns
    .map((column) => `<th>${escapeHtml(column)}</th>`)
    .join("");
  const rows = table.rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
    )
    .join("");
  return `<table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table>`;
}

function renderBullets(items: readonly string[]): string {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderStats(
  stats: readonly { value: string; label: string }[],
): string {
  return `<div class="stats">${stats
    .map(
      ({ value, label }) =>
        `<div><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`,
    )
    .join("")}</div>`;
}

function renderSheet({
  title,
  series,
  code,
  subtitle,
  stats,
  intro,
  alert,
  table,
  lowerContent,
  ordering,
  closing,
}: {
  title: string;
  series: string;
  code: string;
  subtitle: string;
  stats: readonly { value: string; label: string }[];
  intro: string;
  alert?: string;
  table: TucsenbergProductTable;
  lowerContent: string;
  ordering: readonly string[];
  closing?: string;
}): string {
  const companyName = SINGLE_SITE_FACTS.company.name.replace(
    " (trading as Tucsenberg)",
    "",
  );
  const email = getPublicContactEmail();
  if (!email) throw new Error("Public contact email is not configured.");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)} - Specification</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 210mm; min-height: 297mm; }
    body { color: #252a34; background: #fff; font-family: Arial, Helvetica, sans-serif; }
    .sheet { width: 210mm; min-height: 297mm; padding: 14mm 16mm 11mm; display: flex; flex-direction: column; }
    .kicker { color: #0b3a78; font-family: Georgia, serif; font-size: 8pt; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
    .header { display: grid; grid-template-columns: 1fr auto; gap: 8mm; align-items: end; margin-top: 4mm; }
    h1 { margin: 0; font-family: Georgia, serif; font-size: 20pt; font-weight: 500; line-height: 1.08; }
    .subtitle { margin: 2.2mm 0 0; color: #4b5563; font-family: Georgia, serif; font-size: 9pt; line-height: 1.35; }
    .document-id { color: #667085; font-family: Georgia, serif; font-size: 7.5pt; line-height: 1.45; text-align: right; white-space: nowrap; }
    .rule { height: 1px; margin: 3mm 0; background: #dfe4ea; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); border-bottom: 1px solid #dfe4ea; }
    .stats div { min-width: 0; padding: 1.2mm 2mm 2.5mm 0; }
    .stats strong { display: block; color: #0b3a78; font-family: Georgia, serif; font-size: 18pt; font-weight: 500; line-height: 1; }
    .stats span { display: block; margin-top: 1mm; color: #535a66; font-family: Georgia, serif; font-size: 7.3pt; line-height: 1.25; }
    .intro { margin: 3mm 0 2.5mm; font-family: Georgia, serif; font-size: 8.6pt; line-height: 1.42; }
    .alert { margin: 1.5mm 0 3mm; padding: 2.4mm 3mm; border-left: 2px solid #b42318; background: #fff8f7; color: #4b2a26; font-family: Georgia, serif; font-size: 7.8pt; line-height: 1.4; }
    h2 { margin: 2.5mm 0 1.5mm; font-family: Georgia, serif; font-size: 12pt; font-weight: 500; }
    .hint { color: #7b8492; font-family: Georgia, serif; font-size: 7pt; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; font-family: Georgia, serif; font-size: 6.8pt; line-height: 1.25; }
    th { padding: 1.2mm 2mm; border-bottom: 1px solid #cfd6df; color: #3f4855; font-weight: 500; text-align: left; }
    td { padding: 1.15mm 2mm; vertical-align: top; overflow-wrap: anywhere; }
    tbody tr:nth-child(even) { background: #f2f4f7; }
    th:first-child, td:first-child { width: 31%; }
    .columns { display: grid; grid-template-columns: 1fr 1fr; gap: 7mm; margin-top: 2mm; }
    .columns h2 { margin-top: 0; }
    ul { margin: 0; padding-left: 4mm; font-family: Georgia, serif; font-size: 7.3pt; line-height: 1.35; }
    li { margin-bottom: 1mm; }
    .ordering { margin-top: 1.5mm; }
    .closing { margin-top: 2.5mm; padding: 2.5mm 3mm; border-left: 2px solid #0b3a78; color: #4b5563; font-family: Georgia, serif; font-size: 7.4pt; line-height: 1.4; }
    footer { display: grid; grid-template-columns: 1fr auto; gap: 8mm; margin-top: auto; padding-top: 2.5mm; border-top: 1px solid #e3e7ec; color: #7b8492; font-family: Georgia, serif; font-size: 6.5pt; line-height: 1.35; }
    footer div:last-child { text-align: right; }
  </style>
</head>
<body>
  <main class="sheet">
    <div class="kicker">Product specification</div>
    <div class="header">
      <div>
        <h1>${escapeHtml(title)}</h1>
        <p class="subtitle">${escapeHtml(series)} - ${escapeHtml(subtitle)}</p>
      </div>
      <div class="document-id">${escapeHtml(SINGLE_SITE_CONFIG.name)}<br>${DOCUMENT_VERSION}<br>${escapeHtml(code)} - v2</div>
    </div>
    <div class="rule"></div>
    ${renderStats(stats)}
    <p class="intro">${escapeHtml(intro)}</p>
    ${alert ? `<div class="alert">${escapeHtml(alert)}</div>` : ""}
    <h2>Specifications <span class="hint">confirmed at quotation</span></h2>
    ${renderTable(table)}
    <div class="columns">${lowerContent}</div>
    <div class="ordering">
      <h2>Ordering</h2>
      ${renderBullets(ordering)}
    </div>
    ${closing ? `<div class="closing">${escapeHtml(closing)}</div>` : ""}
    <footer>
      <div>${escapeHtml(SINGLE_SITE_CONFIG.name)} - ${escapeHtml(companyName)} - ${escapeHtml(SINGLE_SITE_FACTS.company.location.city)}, China</div>
      <div>tucsenberg.com<br>${escapeHtml(email)}</div>
    </footer>
  </main>
</body>
</html>`;
}

function buildAluminumSheet(): ProductSpecSheetDocument {
  const page = ALUMINUM_FLOOD_GATES_PRODUCT_PAGE;
  const specifications = getTable(page, "Specifications");
  const replyCopy = getApprovedReplyCopy(page);
  const standardHeight = getMatchedValue(
    getTableValue(specifications, "Standard protection height"),
    /\b(\d+(?:\.\d+)?\s*m)\b/u,
    "standard protection height",
  );
  const replyHours = getMatchedValue(
    replyCopy,
    /\bwithin\s+(\d+)\s+hours\b/iu,
    "reply target",
  );

  return {
    id: "tb-ag",
    outputPath: "public/downloads/spec-sheet-tb-ag.pdf",
    html: renderSheet({
      title: "Aluminum Flood Gates & Demountable Barriers",
      series: page.catalog.standardLabel,
      code: "TB-AG-SPEC",
      subtitle:
        "stacked planks, EPDM seals, three post types, custom-cut to your opening schedule",
      stats: [
        {
          value: getTableValue(specifications, "Plank profile height"),
          label: "plank profile height",
        },
        {
          value: getTableValue(specifications, "Alloy / temper"),
          label: "alloy / temper",
        },
        {
          value: standardHeight,
          label: "standard stacked height",
        },
        { value: `${replyHours} h`, label: "reply target" },
      ],
      intro: page.lead,
      table: specifications,
      lowerContent: `
        <section><h2>Custom-cut, always</h2>${renderBullets([
          getSectionBullets(page, "Configurations")[3] ?? "",
          ...getSectionBullets(page, "For dealers and installers").slice(0, 2),
        ])}</section>
        <section><h2>Honest boundaries</h2>${renderBullets([
          getSentenceContaining(
            page.leadNote ?? "",
            "protects a defined opening",
          ),
          getSentenceContaining(page.leadNote ?? "", "rain can still fall"),
        ])}</section>`,
      ordering: [
        page.rfqNote?.split("We reply within 12 hours.")[0]?.trim() ?? "",
        catalogMessages.home.faq.items.paymentTerms.answer,
        getFaqAnswer(page, "What's the warranty?"),
        getFaqAnswer(page, "Lead time?"),
      ],
      closing: replyCopy,
    }),
  };
}

function buildFloodBagSheet(): ProductSpecSheetDocument {
  const page = ABSORBENT_FLOOD_BAGS_PRODUCT_PAGE;
  const specifications = getTable(page, "Specifications");
  const usage = getTable(page, "How many bags does a job take?");
  const minimumOrderAndLeadTime = getFaqAnswer(
    page,
    "Minimum order and lead time?",
  );
  const [moq, ...leadTimeSentences] = minimumOrderAndLeadTime.split(". ");
  const dryWeight = getMatchedValue(
    getTableValue(specifications, "Dry weight"),
    /^([\d.]+)\s*kg\b/u,
    "TB-FB400 dry weight",
  );
  const deployedWeight = getMatchedValue(
    getTableValue(specifications, "Deployed weight"),
    /^([\d.]+\s*kg)\b/u,
    "TB-FB400 deployed weight",
  );
  const shelfLife = getMatchedValue(
    getTableValue(specifications, "Shelf life"),
    /^(\d+\s+years?)\b/iu,
    "shelf life",
  );
  const minimumOrder = getMatchedValue(
    moq ?? "",
    /\b(\d+)\s+bags\b/iu,
    "minimum order",
  );

  return {
    id: "tb-fb",
    outputPath: "public/downloads/spec-sheet-tb-fb.pdf",
    html: renderSheet({
      title: "Absorbent Flood Bags (Sandless Sandbags)",
      series: page.catalog.standardLabel,
      code: "TB-FB-SPEC",
      subtitle:
        "water-activated SAP core, vacuum-packed, private label from the first order",
      stats: [
        {
          value: `${dryWeight} to ${deployedWeight}`,
          label: "TB-FB400 dry to deployed",
        },
        {
          value: getTableValue(specifications, "Activation time"),
          label: "activation in fresh water",
        },
        { value: shelfLife, label: "shelf life, vacuum-packed" },
        { value: minimumOrder, label: "bags MOQ" },
      ],
      intro: page.lead,
      alert:
        "Fresh water only. SAP cores do not activate properly in salt or brackish water. Bags are single-event products and remain swollen after activation.",
      table: specifications,
      lowerContent: `
        <section><h2>How many bags per job</h2>${renderTable(usage)}</section>
        <section><h2>Honest boundaries</h2>${renderBullets([
          getSentenceContaining(
            getSectionBullets(page, "After the flood")[0] ?? "",
            "single-event product",
          ),
          getSentenceContaining(
            getSectionParagraphs(
              page,
              "Honest limits — read before you order",
            )[1] ?? "",
            "low-level water",
          ),
        ])}</section>`,
      ordering: [
        `${moq}. ${getSentenceContaining(
          catalogMessages.home.faq.items.minimumOrder.answer,
          "carton count",
        )}`,
        getSectionBullets(page, "Built for resale")[2] ?? "",
        getFaqAnswer(page, "Sample policy?"),
        catalogMessages.home.faq.items.paymentTerms.answer,
        leadTimeSentences.join(". "),
      ],
      closing: getApprovedReplyCopy(page),
    }),
  };
}

export function getProductSpecSheetDocuments(): ProductSpecSheetDocument[] {
  return [buildAluminumSheet(), buildFloodBagSheet()];
}

export function validateProductSpecSheetContracts(): string[] {
  const findings: string[] = [];
  for (const document of getProductSpecSheetDocuments()) {
    if (/quoted within 12 hours/iu.test(document.html)) {
      findings.push(`${document.id}: promises a quote within 12 hours`);
    }
    if (/custom cut lists? within 48/iu.test(document.html)) {
      findings.push(
        `${document.id}: promises a custom cut list within 48 hours`,
      );
    }
    if (/six cartons/iu.test(document.html)) {
      findings.push(`${document.id}: equates the shared MOQ with six cartons`);
    }
  }
  return findings;
}

function normalizePdfMetadata(pdf: Buffer): Buffer {
  let replacements = 0;
  const normalized = pdf
    .toString("latin1")
    .replace(
      /\/(CreationDate|ModDate) \(D:\d{14}\+00'00'\)/gu,
      (_match, field: string) => {
        replacements += 1;
        return `/${field} (D:${PDF_METADATA_DATE}+00'00')`;
      },
    );
  if (replacements !== 2) {
    throw new Error(
      `Expected two Chromium PDF timestamps, found ${replacements}`,
    );
  }
  return Buffer.from(normalized, "latin1");
}

async function sha256File(relativePath: string): Promise<string> {
  return createHash("sha256")
    .update(await readFile(resolve(ROOT_DIR, relativePath)))
    .digest("hex");
}

function sha256Text(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function renderProductSpecSheets(): Promise<
  { document: ProductSpecSheetDocument; pdf: Buffer }[]
> {
  const findings = validateProductSpecSheetContracts();
  if (findings.length > 0) throw new Error(findings.join("\n"));

  const documents = getProductSpecSheetDocuments();
  const browser = await chromium.launch({ headless: true });
  try {
    const rendered = [];
    for (const document of documents) {
      const page = await browser.newPage();
      await page.setContent(document.html, { waitUntil: "load" });
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true,
        tagged: true,
        outline: true,
      });
      await page.close();
      rendered.push({ document, pdf: normalizePdfMetadata(pdf) });
    }
    return rendered;
  } finally {
    await browser.close();
  }
}

async function generateProductSpecSheets(): Promise<void> {
  const rendered = await renderProductSpecSheets();
  for (const { document, pdf } of rendered) {
    const outputPath = resolve(ROOT_DIR, document.outputPath);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, pdf);
  }
  const manifest: ProductSpecSheetManifest = {
    version: 1,
    documents: Object.fromEntries(
      await Promise.all(
        rendered.map(async ({ document }) => [
          document.id,
          {
            htmlSha256: sha256Text(document.html),
            pdfSha256: await sha256File(document.outputPath),
          },
        ]),
      ),
    ) as ProductSpecSheetManifest["documents"],
  };
  const manifestPath = resolve(ROOT_DIR, MANIFEST_PATH);
  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`[product-spec-sheets] generated ${rendered.length} PDF(s)`);
}

async function checkProductSpecSheets(): Promise<void> {
  const findings = validateProductSpecSheetContracts();
  const documents = getProductSpecSheetDocuments();
  let manifest: ProductSpecSheetManifest | undefined;
  try {
    manifest = JSON.parse(
      await readFile(resolve(ROOT_DIR, MANIFEST_PATH), "utf8"),
    ) as ProductSpecSheetManifest;
  } catch (error) {
    findings.push(
      `manifest: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  for (const document of documents) {
    try {
      const entry = manifest?.documents[document.id];
      if (!entry) {
        findings.push(`${document.id}: missing freshness manifest entry`);
        continue;
      }
      if (entry.htmlSha256 !== sha256Text(document.html)) {
        findings.push(`${document.id}: rendered source changed; rebuild PDF`);
      }
      if (entry.pdfSha256 !== (await sha256File(document.outputPath))) {
        findings.push(`${document.id}: committed PDF changed; rebuild`);
      }
    } catch (error) {
      findings.push(
        `${document.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  if (findings.length > 0) {
    throw new Error(findings.join("\n"));
  }
  console.log(`[product-spec-sheets] passed: ${documents.length} PDF(s) fresh`);
}

const entryPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (entryPath === fileURLToPath(import.meta.url)) {
  const command = process.argv[2] ?? "--build";
  const run =
    command === "--check" ? checkProductSpecSheets : generateProductSpecSheets;
  run().catch((error: unknown) => {
    console.error(
      `[product-spec-sheets] failed\n${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  });
}
