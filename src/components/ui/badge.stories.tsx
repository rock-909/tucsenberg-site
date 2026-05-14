import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "@/components/ui/badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline"],
    },
  },
  args: {
    children: "ISO 9001",
    variant: "default",
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge>ISO 9001</Badge>
      <Badge variant="secondary">Starter ready</Badge>
      <Badge variant="outline">UL listed</Badge>
      <Badge variant="destructive">Action required</Badge>
    </div>
  ),
};

export const LongContent: Story = {
  render: () => (
    <div className="max-w-sm">
      <Badge>出口包装与批次追溯已确认</Badge>
    </div>
  ),
};
