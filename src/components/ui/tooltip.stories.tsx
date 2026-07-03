import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const meta = {
  title: "UI/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover for hint</Button>
        </TooltipTrigger>
        <TooltipContent>
          Use tooltips for short supplemental hints.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

export const LongChineseContent: Story = {
  render: () => (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">查看提示</Button>
        </TooltipTrigger>
        <TooltipContent>
          只放简短补充说明；必读信息不要只放在 Tooltip 里。
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};
