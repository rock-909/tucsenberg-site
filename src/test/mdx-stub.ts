/**
 * MDX Stub for Test Environment
 *
 * This stub prevents Vite from attempting to resolve @content/* imports
 * during test runs. MDX files are not needed in unit/integration tests
 * as content is mocked at the content-query layer.
 */

export default function MDXStub() {
  return null;
}

export const frontmatter = {};
