import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Monitor, Moon, Sun } from "lucide-react";
import { ThemeSwitcherHighlight } from "@/components/ui/theme-switcher-highlight";

const meta = {
  title: "UI/ThemeSwitcherHighlight",
  component: ThemeSwitcherHighlight,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ThemeSwitcherHighlight>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="relative h-6 w-6 rounded-full">
      <ThemeSwitcherHighlight />
      <Sun className="relative z-10 m-auto h-4 w-4 translate-y-1 text-foreground" />
    </div>
  ),
};

export const InSwitcherTrack: Story = {
  render: () => (
    <div className="relative isolate flex h-8 rounded-full bg-background p-1 ring-1 ring-border">
      <button
        aria-label="System theme"
        className="relative h-6 w-6 rounded-full"
        type="button"
      >
        <Monitor className="relative z-10 m-auto h-4 w-4 translate-y-1 text-muted-foreground" />
      </button>
      <button
        aria-label="Light theme"
        className="relative h-6 w-6 rounded-full"
        type="button"
      >
        <ThemeSwitcherHighlight />
        <Sun className="relative z-10 m-auto h-4 w-4 translate-y-1 text-foreground" />
      </button>
      <button
        aria-label="Dark theme"
        className="relative h-6 w-6 rounded-full"
        type="button"
      >
        <Moon className="relative z-10 m-auto h-4 w-4 translate-y-1 text-muted-foreground" />
      </button>
    </div>
  ),
};

export const OnDarkBackground: Story = {
  parameters: {
    backgrounds: { default: "Dark" },
  },
  render: () => (
    <div className="rounded-xl bg-[var(--neutral-11)] p-6">
      <div className="relative h-6 w-6 rounded-full bg-background">
        <ThemeSwitcherHighlight />
      </div>
    </div>
  ),
};
