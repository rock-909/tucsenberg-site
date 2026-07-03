import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  ContactFormTextarea,
  ContactFormTextInput,
} from "@/components/ui/contact-form-control";
import { RadixThemePilot } from "@/components/ui/radix-theme";

const meta = {
  title: "UI/ContactFormControl",
  component: ContactFormTextInput,
  parameters: {
    layout: "centered",
  },
  render: () => (
    <RadixThemePilot className="w-[420px]">
      <div className="space-y-4">
        <ContactFormTextInput
          id="story-email"
          name="email"
          placeholder="Email"
          type="email"
        />
        <ContactFormTextInput
          id="story-disabled"
          name="disabled"
          placeholder="Disabled"
          disabled
          type="text"
        />
        <ContactFormTextarea
          id="story-message"
          name="message"
          placeholder="Message"
          rows={4}
        />
      </div>
    </RadixThemePilot>
  ),
} satisfies Meta<typeof ContactFormTextInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
