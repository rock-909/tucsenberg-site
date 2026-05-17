import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BatchControlsBlockView } from "@/components/trust/batch-controls-block-view";

const meta = {
  title: "Trust/BatchControlsBlock",
  component: BatchControlsBlockView,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  args: {
    title: "How each production batch is controlled",
    traceability:
      "Every batch is logged against its OEM compatibility mapping and material spec.",
    photos:
      "Pre-shipment photos of the produced membranes are shared on request.",
    sample: "A reference sample can be sent before a full order is committed.",
  },
} satisfies Meta<typeof BatchControlsBlockView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
