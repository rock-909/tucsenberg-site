import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/components/ui/button";
import { ContactFormShell } from "@/components/ui/contact-form-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const meta = {
  title: "UI/ContactFormShell",
  component: ContactFormShell,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof ContactFormShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: null,
  },
  render: () => (
    <ContactFormShell>
      <form className="space-y-4 p-6" aria-label="Example contact form">
        <div className="space-y-2">
          <Label htmlFor="story-email">Email</Label>
          <Input id="story-email" name="email" type="email" />
        </div>
        <Button className="w-full" type="button">
          Send inquiry
        </Button>
      </form>
    </ContactFormShell>
  ),
};
