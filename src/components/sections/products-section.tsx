import { getTranslations } from "next-intl/server";
import type { LinkHref } from "@/lib/i18n/route-parsing";
import {
  ProductsSectionView,
  type ProductsSectionProductItem,
} from "@/components/sections/products-section-view";
import { getActiveStaticPageTypes } from "@/config/pages.config";
import { HOMEPAGE_SECTION_LINKS } from "@/components/sections/homepage-section-links";

const PRODUCT_COUNT = 3;
const SPECS_PER_PRODUCT = 3;

export async function ProductsSection() {
  if (!getActiveStaticPageTypes().includes("products")) {
    return null;
  }

  const t = await getTranslations("home");
  const translateHome = (key: string) => t(key as Parameters<typeof t>[0]);
  const productsCtaHref = HOMEPAGE_SECTION_LINKS.products;

  if (productsCtaHref === undefined) {
    return null;
  }

  const products = Array.from({ length: PRODUCT_COUNT }, (_, i) => {
    const key = `item${String(i + 1)}`;
    return {
      id: key,
      tag: translateHome(`products.${key}.tag`),
      title: translateHome(`products.${key}.title`),
      specs: Array.from({ length: SPECS_PER_PRODUCT }, (_unused, j) =>
        translateHome(`products.${key}.spec${String(j + 1)}`),
      ),
      meta: translateHome(`products.${key}.standard`),
      link: translateHome(`products.${key}.link`) as LinkHref,
    };
  }) satisfies ProductsSectionProductItem[];

  return (
    <ProductsSectionView
      title={t("products.title")}
      subtitle={t("products.subtitle")}
      ctaLabel={t("products.cta")}
      ctaHref={productsCtaHref}
      products={products}
    />
  );
}
