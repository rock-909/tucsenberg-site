import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  DataCard,
  DataCardContent,
  DataCardDescription,
  DataCardHeader,
  DataCardTitle,
} from "@/components/ui/data-card";

const meta = {
  title: "UI/DataCard",
  component: DataCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    children: "Material: Stainless Steel 304",
  },
  render: () => (
    <DataCard className="w-[360px]">
      <DataCardHeader>
        <DataCardTitle>Specification surface</DataCardTitle>
        <DataCardDescription>
          For repeated data, controls, metadata, and spec blocks.
        </DataCardDescription>
      </DataCardHeader>
      <DataCardContent>Material: Stainless Steel 304</DataCardContent>
    </DataCard>
  ),
} satisfies Meta<typeof DataCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
