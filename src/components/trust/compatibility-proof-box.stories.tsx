import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { CompatibilityProofBoxView } from "@/components/trust/compatibility-proof-box-view";

const meta = {
  title: "Trust/CompatibilityProofBox",
  component: CompatibilityProofBoxView,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  args: {
    title: "How we confirm the part matches",
    body: "We map your OEM model and part number against the documented compatibility table before quoting.",
  },
} satisfies Meta<typeof CompatibilityProofBoxView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithExtraChecks: Story = {
  args: {
    extraChecks: [
      "Dimensional spec sheet on request",
      "Bubble pattern reference for the OEM model",
    ],
  },
};
