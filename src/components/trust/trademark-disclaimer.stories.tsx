import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TrademarkDisclaimerView } from "@/components/trust/trademark-disclaimer-view";

const meta = {
  title: "Trust/TrademarkDisclaimer",
  component: TrademarkDisclaimerView,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TrademarkDisclaimerView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Footer: Story = {
  args: {
    variant: "footer",
    text: "All referenced OEM names and part numbers (Sanitaire, EDI, SSI Aeration) are trademarks of their respective owners. Tucsenberg is an independent aftermarket manufacturer and is not affiliated with or endorsed by these companies.",
  },
};

export const BrandNotice: Story = {
  args: {
    variant: "brand-notice",
    text: "Sanitaire is a trademark of its respective owner. Tucsenberg is an independent aftermarket manufacturer and is not affiliated with Sanitaire.",
  },
};

export const Inline: Story = {
  args: {
    variant: "inline",
    text: "OEM names are trademarks of their owners; Tucsenberg is an independent aftermarket manufacturer.",
  },
};
