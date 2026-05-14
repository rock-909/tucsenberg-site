import { Link } from "@/i18n/routing";
import type { LinkHref } from "@/lib/i18n/route-parsing";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export interface CatalogBreadcrumbViewProps {
  homeLabel: string;
  productsLabel: string;
  productsHref: LinkHref;
  marketLabel?: string;
}

export function CatalogBreadcrumbView({
  homeLabel,
  productsLabel,
  productsHref,
  marketLabel,
}: CatalogBreadcrumbViewProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">{homeLabel}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        <BreadcrumbItem>
          {marketLabel ? (
            <BreadcrumbLink asChild>
              <Link href={productsHref}>{productsLabel}</Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>{productsLabel}</BreadcrumbPage>
          )}
        </BreadcrumbItem>

        {marketLabel ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{marketLabel}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
