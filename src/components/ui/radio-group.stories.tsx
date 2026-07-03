import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const meta = {
  title: "UI/RadioGroup",
  component: RadioGroup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof RadioGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="standard" aria-label="Website package">
      <div className="flex items-center gap-2">
        <RadioGroupItem id="package-starter" value="starter" />
        <Label htmlFor="package-starter">Starter</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="package-standard" value="standard" />
        <Label htmlFor="package-standard">Standard</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="package-enterprise" value="enterprise" />
        <Label htmlFor="package-enterprise">Enterprise</Label>
      </div>
    </RadioGroup>
  ),
};

export const DisabledOption: Story = {
  render: () => (
    <RadioGroup defaultValue="available" aria-label="Project capacity">
      <div className="flex items-center gap-2">
        <RadioGroupItem id="capacity-available" value="available" />
        <Label htmlFor="capacity-available">Available this month</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="capacity-reserved" value="reserved" disabled />
        <Label htmlFor="capacity-reserved">Reserved for another launch</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="capacity-custom" value="custom" />
        <Label htmlFor="capacity-custom">Discuss custom timing</Label>
      </div>
    </RadioGroup>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <RadioGroup
      defaultValue="monthly"
      aria-label="Billing cycle"
      className="flex gap-4"
    >
      <div className="flex items-center gap-2">
        <RadioGroupItem id="billing-monthly" value="monthly" />
        <Label htmlFor="billing-monthly">Monthly</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="billing-yearly" value="yearly" />
        <Label htmlFor="billing-yearly">Yearly</Label>
      </div>
    </RadioGroup>
  ),
};

export const LongChineseContent: Story = {
  render: () => (
    <RadioGroup
      defaultValue="review"
      aria-label="项目阶段"
      className="w-[360px]"
    >
      <div className="flex items-center gap-2">
        <RadioGroupItem id="stage-review" value="review" />
        <Label htmlFor="stage-review">正在整理需求，准备让团队评审</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="stage-build" value="build" />
        <Label htmlFor="stage-build">已经确认方向，需要尽快开始实施</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id="stage-support" value="support" />
        <Label htmlFor="stage-support">需要后续维护和持续优化支持</Label>
      </div>
    </RadioGroup>
  ),
};
