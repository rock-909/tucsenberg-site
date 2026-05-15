import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StatusCallout } from "@/components/ui/status-callout";

const meta = {
  title: "UI/StatusCallout",
  component: StatusCallout,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    children: "Your inquiry has been saved.",
    tone: "info",
  },
} satisfies Meta<typeof StatusCallout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Info: Story = {};

export const Success: Story = {
  args: {
    children: "Inquiry submitted successfully.",
    tone: "success",
  },
};

export const Warning: Story = {
  args: {
    children: "Please review the selected product family.",
    tone: "warning",
  },
};

export const Error: Story = {
  args: {
    children: "Submission failed. Please try again.",
    tone: "error",
  },
};

export const StaticNotice: Story = {
  args: {
    children: "This notice describes current page context.",
    live: false,
    tone: "info",
  },
};
