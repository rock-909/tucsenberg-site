import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CatalogBreadcrumbView } from "@/components/products/catalog-breadcrumb-view";

const meta = {
  title: "Products/CatalogBreadcrumb",
  component: CatalogBreadcrumbView,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    homeLabel: "Home",
    productsLabel: "Products",
    productsHref: "/products",
  },
} satisfies Meta<typeof CatalogBreadcrumbView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ProductsRoot: Story = {};

export const MarketDetail: Story = {
  args: {
    marketLabel: "Starter market example",
  },
};

export const LongMarketLabel: Story = {
  args: {
    marketLabel:
      "Long starter market label for product, service, and project replacement review",
  },
};

export const WithoutJsonLd: Story = {
  args: {
    marketLabel: "Breadcrumb UI without structured-data script",
  },
};
