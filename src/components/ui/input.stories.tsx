import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    placeholder: "name@example.com",
    type: "email",
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
  render: () => (
    <div className="w-[320px] space-y-2">
      <Label htmlFor="storybook-email">Business email</Label>
      <Input
        id="storybook-email"
        type="email"
        placeholder="procurement@example.com"
      />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    value: "Submitting...",
  },
};

export const Invalid: Story = {
  render: () => (
    <div className="w-[320px] space-y-2">
      <Label htmlFor="storybook-invalid-email">Business email</Label>
      <Input
        id="storybook-invalid-email"
        type="email"
        defaultValue="not-an-email"
        aria-invalid="true"
      />
      <p className="text-sm text-destructive">
        Please enter a valid email address.
      </p>
    </div>
  ),
};
