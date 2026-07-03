function slugifyBlogSectionHeading(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Assigns unique, URL-safe anchor ids for a blog article's section headings.
 * Empty headings fall back to `section-{n}`; duplicate slugs get `-2`, `-3`, …
 */
export function createBlogSectionIds(headings: readonly string[]): string[] {
  const seen = new Map<string, number>();

  return headings.map((heading, index) => {
    const slug = slugifyBlogSectionHeading(heading);
    const base = slug.length > 0 ? slug : `section-${index + 1}`;
    const occurrence = seen.get(base) ?? 0;
    seen.set(base, occurrence + 1);

    if (occurrence === 0) {
      return base;
    }

    return `${base}-${occurrence + 1}`;
  });
}

export function createBlogSectionId(heading: string): string {
  return createBlogSectionIds([heading])[0] ?? `section-1`;
}
