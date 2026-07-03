import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const meta = {
  title: "UI/Popover",
  component: Popover,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open details</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="grid gap-2">
          <p className="text-sm font-medium">Compact panel</p>
          <p className="text-sm text-muted-foreground">
            Use popovers for small non-modal panels, not blocking decisions.
          </p>
          <PopoverClose asChild>
            <Button size="sm">Close</Button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const LongChineseContent: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">查看说明</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="grid gap-2">
          <p className="text-sm font-medium">非阻塞小面板</p>
          <p className="text-sm text-muted-foreground">
            用于简短说明或小型操作，不替代 Dialog、Sheet 或正文内容。
          </p>
          <PopoverClose asChild>
            <Button size="sm">关闭</Button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  ),
};
