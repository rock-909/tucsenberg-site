import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const meta = {
  title: "UI/DropdownMenu",
  component: DropdownMenu,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof DropdownMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Choose language</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>English</DropdownMenuItem>
        <DropdownMenuItem>简体中文</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Manage languages</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const LongChineseContent: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">选择语言和地区</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem>English, global sourcing</DropdownMenuItem>
        <DropdownMenuItem>简体中文，面向采购和工程团队</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Manage language preferences</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
