import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SlaCommitmentsView } from "@/components/trust/sla-commitments-view";

const commitments = [
  "Compatibility review answered within one business day.",
  "Standard RFQ quoted on the published schedule.",
  "Urgent line-down requests flagged for priority handling.",
];

const meta = {
  title: "Trust/SlaCommitments",
  component: SlaCommitmentsView,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  args: {
    commitments,
  },
} satisfies Meta<typeof SlaCommitmentsView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ribbon: Story = {
  args: {
    layout: "ribbon",
  },
};

export const Stacked: Story = {
  args: {
    layout: "stacked",
  },
};
