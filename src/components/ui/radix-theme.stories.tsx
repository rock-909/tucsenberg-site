import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RadixThemePilot } from "@/components/ui/radix-theme";
import { Button } from "@/components/ui/button";

const meta = {
  title: "UI/RadixThemePilot",
  component: RadixThemePilot,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof RadixThemePilot>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="w-80 rounded-lg border border-border bg-card p-4">
        <p className="mb-4 text-sm text-muted-foreground">
          Pilot wrapper keeps Radix Themes scoped to approved UI surfaces.
        </p>
        <Button>Local Button</Button>
      </div>
    ),
  },
};

export const StatusSurface: Story = {
  args: {
    surface: "status-callout",
    children: (
      <div className="w-80 rounded-lg border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          Status surface keeps Radix Themes scoped to approved callout UI.
        </p>
      </div>
    ),
  },
};
