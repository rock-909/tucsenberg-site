import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MetricCard } from "@/components/ui/metric-card";

const meta = {
  title: "UI/MetricCard",
  component: MetricCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    label: "Visits in the last 7 days",
    value: "320",
    description: "Cloudflare analytics",
  },
} satisfies Meta<typeof MetricCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
