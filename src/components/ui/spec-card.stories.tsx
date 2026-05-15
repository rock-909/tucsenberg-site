import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SpecCard, SpecCardRow } from "@/components/ui/spec-card";

const meta = {
  title: "UI/SpecCard",
  component: SpecCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    children: null,
    title: "Specifications",
  },
  render: () => (
    <SpecCard title="Specifications" className="w-[420px]">
      <SpecCardRow label="Material" value="Stainless Steel 304" />
      <SpecCardRow label="Weight" value="5.2 kg" />
      <SpecCardRow label="Dimensions" value="200 x 150 x 100 mm" />
    </SpecCard>
  ),
} satisfies Meta<typeof SpecCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
