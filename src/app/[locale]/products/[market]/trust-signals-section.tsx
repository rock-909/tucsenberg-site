import {
  ProductCertifications,
  ProductSpecs,
  ProductTradeInfo,
} from "@/components/products/product-specs";
import type { MarketTrustSignalsViewModel } from "@/app/[locale]/products/[market]/market-spec-presenter";

export function TrustSignalsSection({
  translatedTechnical,
  certifications,
  translatedTrade,
  technicalTitle,
  certificationsTitle,
  tradeTitle,
  tradeLabels,
}: MarketTrustSignalsViewModel) {
  return (
    <div className="mt-16 space-y-8">
      <ProductSpecs specs={translatedTechnical} title={technicalTitle} />
      <ProductCertifications
        certifications={certifications}
        title={certificationsTitle}
      />
      <ProductTradeInfo
        moq={translatedTrade.moq}
        leadTime={translatedTrade.leadTime}
        supplyCapacity={translatedTrade.supplyCapacity}
        packaging={translatedTrade.packaging}
        portOfLoading={translatedTrade.portOfLoading}
        title={tradeTitle}
        labels={tradeLabels}
      />
    </div>
  );
}
