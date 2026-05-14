import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    placeholder: "Tell us your target market, sizes, and expected quantity.",
  },
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
  render: () => (
    <div className="w-[360px] space-y-2">
      <Label htmlFor="storybook-message">Message</Label>
      <Textarea
        id="storybook-message"
        placeholder="Tell us your target market, sizes, and expected quantity."
      />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: "Submitting inquiry...",
  },
};

export const LongChineseContent: Story = {
  render: () => (
    <div className="w-[360px] space-y-2">
      <Label htmlFor="storybook-zh-message">询盘说明</Label>
      <Textarea
        id="storybook-zh-message"
        defaultValue="我们需要确认展示页面结构、核心内容、项目范围、上线时间以及后续由谁接收询盘。"
      />
    </div>
  ),
};
