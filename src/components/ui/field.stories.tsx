import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  ErrorSummary,
  Field,
  FieldControl,
  FieldError,
  FieldHint,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const meta = {
  title: "UI/Field",
  component: Field,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  render: () => (
    <div className="w-[360px] space-y-6">
      <Field>
        <FieldLabel htmlFor="story-email">Business email</FieldLabel>
        <FieldControl>
          <Input
            id="story-email"
            name="email"
            type="email"
            placeholder="procurement@example.com"
            aria-describedby="story-email-hint story-email-error"
          />
        </FieldControl>
        <FieldHint id="story-email-hint">
          Use the address you want us to reply to.
        </FieldHint>
        <FieldError id="story-email-error">
          Email is required for inquiry follow-up.
        </FieldError>
      </Field>
      <ErrorSummary tabIndex={-1}>
        Please fix the highlighted fields.
      </ErrorSummary>
    </div>
  ),
} satisfies Meta<typeof Field>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
