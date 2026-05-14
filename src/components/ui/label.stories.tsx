import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const meta = {
  title: "UI/Label",
  component: Label,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    children: "Business email",
  },
} satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithInput: Story = {
  render: () => (
    <div className="w-[320px] space-y-2">
      <Label htmlFor="storybook-company">Company</Label>
      <Input
        id="storybook-company"
        placeholder="Example Showcase Company contact"
      />
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div className="w-[320px] space-y-2">
      <Label
        htmlFor="storybook-required"
        className="after:ml-0.5 after:text-destructive after:content-['*']"
      >
        Message
      </Label>
      <Input id="storybook-required" placeholder="Required field" />
    </div>
  ),
};

export const DisabledPeer: Story = {
  render: () => (
    <div className="w-[320px] space-y-2">
      <Input id="storybook-disabled" disabled value="Locked field" />
      <Label htmlFor="storybook-disabled" className="peer-disabled:opacity-50">
        Disabled field label
      </Label>
    </div>
  ),
};
