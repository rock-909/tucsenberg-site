import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MaterialDecisionCardView } from "@/components/trust/material-decision-card-view";

const meta = {
  title: "Trust/MaterialDecisionCard",
  component: MaterialDecisionCardView,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  args: {
    title: "Which membrane material fits your basin",
    epdmLabel: "EPDM",
    epdmBody:
      "EPDM is the default starting point for municipal and standard industrial diffused aeration.",
    tpuLabel: "TPU",
    tpuBody:
      "TPU is triggered by specific conditions: oils, solvents, or aggressive industrial chemistry in the wastewater.",
  },
} satisfies Meta<typeof MaterialDecisionCardView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const EpdmDefault: Story = {
  args: {
    defaultMaterial: "epdm",
  },
};

export const TpuDefault: Story = {
  args: {
    defaultMaterial: "tpu",
  },
};
