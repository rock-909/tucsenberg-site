import { getTranslations } from "next-intl/server";
import type { LinkHref } from "@/lib/i18n/route-parsing";
import {
  ProductsSectionView,
  type ProductsSectionProductItem,
} from "@/components/sections/products-section-view";
import { HOMEPAGE_SECTION_LINKS } from "@/components/sections/homepage-section-links";

const PRODUCT_COUNT = 3;
const SPECS_PER_PRODUCT = 3;

export async function ProductsSection() {
  const t = await getTranslations("home");

  const products = Array.from({ length: PRODUCT_COUNT }, (_, i) => {
    const key = `item${String(i + 1)}`;
    return {
      id: key,
      tag: t(`products.${key}.tag`),
      title: t(`products.${key}.title`),
      specs: Array.from({ length: SPECS_PER_PRODUCT }, (_unused, j) =>
        t(`products.${key}.spec${String(j + 1)}`),
      ),
      meta: t(`products.${key}.standard`),
      link: t(`products.${key}.link`) as LinkHref,
    };
  }) satisfies ProductsSectionProductItem[];

  return (
    <ProductsSectionView
      title={t("products.title")}
      subtitle={t("products.subtitle")}
      ctaLabel={t("products.cta")}
      ctaHref={HOMEPAGE_SECTION_LINKS.products}
      products={products}
    />
  );
}
