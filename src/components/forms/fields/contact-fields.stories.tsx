import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ContactFields } from "@/components/forms/fields/contact-fields";
import {
  contactFormLongChineseTranslate,
  contactFormLongEnglishTranslate,
  contactFormStoryTranslate,
} from "@/components/forms/contact-form-story-fixtures";

const meta = {
  title: "Forms/Fields/ContactFields",
  component: ContactFields,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    t: contactFormStoryTranslate,
    isPending: false,
  },
} satisfies Meta<typeof ContactFields>;

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
