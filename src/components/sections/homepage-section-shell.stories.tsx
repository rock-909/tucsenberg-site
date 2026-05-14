import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { HomepageSectionShell } from "@/components/sections/homepage-section-shell";
import { Button } from "@/components/ui/button";

const meta = {
  title: "Sections/HomepageSectionShell",
  component: HomepageSectionShell,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  args: {
    title: "Reusable starter shell",
    subtitle: "Shared section framing for homepage content blocks.",
    children: (
      <div className="rounded-lg border bg-card p-6 text-sm text-card-foreground">
        Section body content goes here.
      </div>
    ),
    sectionClassName: "section-divider py-14 md:py-[72px]",
  },
} satisfies Meta<typeof HomepageSectionShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAction: Story = {
  args: {
    action: <Button variant="secondary">Review checklist</Button>,
  },
};

export const LongCopy: Story = {
  args: {
    title:
      "A long homepage section shell title for replacement, governance, visual review, and launch readiness",
    subtitle:
      "This story checks whether shared section framing stays readable when real project copy is longer than the starter default.",
  },
};

export const ChineseCopy: Story = {
  args: {
    title: "可复用首页区块外壳",
    subtitle: "用于首页内容模块的统一标题、副标题和行动入口结构。",
    action: <Button variant="secondary">查看清单</Button>,
  },
};
