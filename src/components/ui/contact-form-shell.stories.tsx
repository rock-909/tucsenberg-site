import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ContactFormShell } from "@/components/ui/contact-form-shell";

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
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="story-email">
            Email
          </label>
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-2"
            id="story-email"
            name="email"
            type="email"
          />
        </div>
        <button
          className="w-full rounded-xl bg-primary px-4 py-2 text-primary-foreground"
          type="button"
        >
          Send inquiry
        </button>
      </form>
    </ContactFormShell>
  ),
};
