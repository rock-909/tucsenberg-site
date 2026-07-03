import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  ErrorDisplay,
  StatusMessage,
} from "@/components/forms/contact-form-feedback";
import {
  contactFormApiStoryTranslate,
  contactFormNetworkErrorState,
  contactFormProcessingErrorState,
  contactFormStoryTranslate,
  contactFormValidationErrorState,
} from "@/components/forms/contact-form-story-fixtures";
import type { FormSubmissionStatus } from "@/lib/forms/form-submission-status";
import type { ServerActionResult } from "@/lib/actions/server-action-utils";
import type { ContactFormResult } from "@/components/forms/use-contact-form";

interface ContactFormFeedbackStoryProps {
  status: FormSubmissionStatus;
  state: ServerActionResult<ContactFormResult> | null;
}

function ContactFormFeedbackStory({
  status,
  state,
}: ContactFormFeedbackStoryProps) {
  return (
    <div className="w-[520px] space-y-4">
      <StatusMessage status={status} t={contactFormStoryTranslate} />
      <ErrorDisplay
        state={state}
        translateForm={contactFormStoryTranslate}
        translateApi={contactFormApiStoryTranslate}
      />
    </div>
  );
}

const meta = {
  title: "Forms/ContactFormFeedback",
  component: ContactFormFeedbackStory,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    status: "success",
    state: null,
  },
} satisfies Meta<typeof ContactFormFeedbackStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SuccessStatus: Story = {};

export const SubmittingStatus: Story = {
  args: {
    status: "submitting",
  },
};

export const ValidationError: Story = {
  args: {
    status: "error",
    state: contactFormValidationErrorState,
  },
};

export const NetworkError: Story = {
  args: {
    status: "error",
    state: contactFormNetworkErrorState,
  },
};

export const ProcessingError: Story = {
  args: {
    status: "idle",
    state: contactFormProcessingErrorState,
  },
};
