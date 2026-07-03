import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { NameFields } from "@/components/forms/fields/name-fields";
import {
  contactFormLongChineseTranslate,
  contactFormLongEnglishTranslate,
  contactFormStoryTranslate,
} from "@/components/forms/contact-form-story-fixtures";

const meta = {
  title: "Forms/Fields/NameFields",
  component: NameFields,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    t: contactFormStoryTranslate,
    isPending: false,
  },
} satisfies Meta<typeof NameFields>;

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
