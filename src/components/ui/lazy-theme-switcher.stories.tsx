import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ThemeProvider } from "@/components/theme-provider";
import { LazyThemeSwitcher } from "@/components/ui/lazy-theme-switcher";

const meta = {
  title: "UI/LazyThemeSwitcher",
  component: LazyThemeSwitcher,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Story />
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof LazyThemeSwitcher>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="space-y-3 text-center">
      <LazyThemeSwitcher />
      <p className="text-sm text-muted-foreground">
        Renders after the browser is idle; it stays quiet while loading.
      </p>
    </div>
  ),
};

export const OnDarkBackground: Story = {
  parameters: {
    backgrounds: { default: "Dark" },
  },
  render: () => (
    <div className="rounded-xl bg-[var(--neutral-11)] p-6">
      <LazyThemeSwitcher className="bg-background" />
    </div>
  ),
};
