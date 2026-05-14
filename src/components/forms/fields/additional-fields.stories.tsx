import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { AdditionalFields } from "@/components/forms/fields/additional-fields";
import {
  contactFormLongChineseTranslate,
  contactFormLongEnglishTranslate,
  contactFormStoryTranslate,
} from "@/components/forms/contact-form-story-fixtures";

const meta = {
  title: "Forms/Fields/AdditionalFields",
  component: AdditionalFields,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    t: contactFormStoryTranslate,
    isPending: false,
  },
} satisfies Meta<typeof AdditionalFields>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Pending: Story = {
  args: {
    isPending: true,
  },
};

export const LongEnglishCopy: Story = {
  args: {
    t: contactFormLongEnglishTranslate,
  },
};

export const LongChineseCopy: Story = {
  args: {
    t: contactFormLongChineseTranslate,
  },
};
