import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const meta = {
  title: "UI/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="storybook-checkbox-default" />
      <Label htmlFor="storybook-checkbox-default">
        Receive product updates
      </Label>
    </div>
  ),
};

export const RequiredConsent: Story = {
  render: () => (
    <form className="space-y-2">
      <div className="flex items-start gap-2">
        <Checkbox id="storybook-checkbox-required" name="terms" required />
        <Label htmlFor="storybook-checkbox-required" className="text-sm">
          I understand this option is required before continuing.
        </Label>
      </div>
      <p className="text-xs text-muted-foreground">
        Wrapper example only. Contact-form privacy consent still needs a
        migration-specific no-JS proof before using this wrapper.
      </p>
    </form>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="storybook-checkbox-disabled" disabled defaultChecked />
      <Label htmlFor="storybook-checkbox-disabled">
        Required system setting
      </Label>
    </div>
  ),
};

export const Indeterminate: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="storybook-checkbox-indeterminate" checked="indeterminate" />
      <Label htmlFor="storybook-checkbox-indeterminate">
        Some child options selected
      </Label>
    </div>
  ),
};

export const LongChineseContent: Story = {
  render: () => (
    <div className="flex max-w-[360px] items-start gap-2">
      <Checkbox id="storybook-checkbox-zh" />
      <Label htmlFor="storybook-checkbox-zh" className="text-sm leading-6">
        我希望接收与项目进度、交付风险和后续维护有关的更新，并理解这些信息可能需要团队进一步确认。
      </Label>
    </div>
  ),
};
