import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  ContactFormContainerView,
  type ContactFormContainerViewProps,
} from "@/components/forms/contact-form-container-view";
import {
  contactFormApiStoryTranslate,
  contactFormTurnstileStoryLabels,
  contactFormStoryTranslate,
  contactFormValidationErrorState,
} from "@/components/forms/contact-form-story-fixtures";

const storyFormAction = () => undefined;
const storyTokenHandler = () => undefined;
const storyStatusHandler = () => undefined;

const defaultArgs = {
  state: null,
  formAction: storyFormAction,
  isPending: false,
  submitStatus: "idle",
  turnstileToken: "storybook-token",
  isRateLimited: false,
  translateForm: contactFormStoryTranslate,
  translateApi: contactFormApiStoryTranslate,
  turnstileLabels: contactFormTurnstileStoryLabels,
  onTurnstileSuccess: storyTokenHandler,
  onTurnstileError: storyStatusHandler,
  onTurnstileExpire: storyStatusHandler,
  onTurnstileLoad: storyStatusHandler,
} satisfies ContactFormContainerViewProps;

const meta = {
  title: "Forms/ContactForm",
  component: ContactFormContainerView,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: defaultArgs,
} satisfies Meta<typeof ContactFormContainerView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Pending: Story = {
  args: {
    isPending: true,
    submitStatus: "submitting",
  },
};

export const ValidationError: Story = {
  args: {
    state: contactFormValidationErrorState,
    submitStatus: "error",
  },
};
