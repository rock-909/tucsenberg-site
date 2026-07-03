import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const meta = {
  title: "UI/Select",
  component: Select,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-[320px] space-y-2">
      <Label htmlFor="storybook-select-package">Website package</Label>
      <Select defaultValue="standard">
        <SelectTrigger id="storybook-select-package">
          <SelectValue placeholder="Choose package" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="starter">Starter</SelectItem>
          <SelectItem value="standard">Standard</SelectItem>
          <SelectItem value="enterprise">Enterprise</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const Grouped: Story = {
  render: () => (
    <div className="w-[320px] space-y-2">
      <Label htmlFor="storybook-select-region">Primary market</Label>
      <Select>
        <SelectTrigger id="storybook-select-region">
          <SelectValue placeholder="Choose market" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Asia Pacific</SelectLabel>
            <SelectItem value="cn">China</SelectItem>
            <SelectItem value="au">Australia</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Americas</SelectLabel>
            <SelectItem value="us">United States</SelectItem>
            <SelectItem value="ca">Canada</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const DisabledOption: Story = {
  render: () => (
    <div className="w-[320px] space-y-2">
      <Label htmlFor="storybook-select-capacity">Capacity</Label>
      <Select defaultValue="available">
        <SelectTrigger id="storybook-select-capacity">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="available">Available this month</SelectItem>
          <SelectItem value="reserved" disabled>
            Reserved for another launch
          </SelectItem>
          <SelectItem value="custom">Discuss custom timing</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const LongChineseContent: Story = {
  render: () => (
    <div className="w-[360px] space-y-2">
      <Label htmlFor="storybook-select-zh">项目阶段</Label>
      <Select defaultValue="review">
        <SelectTrigger id="storybook-select-zh">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="review">正在整理需求，准备让团队评审</SelectItem>
          <SelectItem value="build">已经确认方向，需要尽快开始实施</SelectItem>
          <SelectItem value="support">需要后续维护和持续优化支持</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};
