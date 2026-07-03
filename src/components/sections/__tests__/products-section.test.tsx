import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductsSection } from "@/components/sections/products-section";

async function renderAsyncComponent(
  asyncComponent: React.JSX.Element | Promise<React.JSX.Element>,
) {
  const resolvedElement = await Promise.resolve(asyncComponent);
  return render(resolvedElement);
}

describe("ProductsSection", () => {
  it("renders for the default company-site profile", async () => {
    const { container } = await renderAsyncComponent(ProductsSection());
    expect(container).not.toBeEmptyDOMElement();
  });
});
