import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const meta = {
  title: "UI/RadioGroup",
  component: RadioGroup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof RadioGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

function RadioGroupStory() {
  const [value, setValue] = useState("system");

  return (
    <RadioGroup value={value} onValueChange={setValue}>
      {["system", "light", "dark"].map((theme) => (
        <div key={theme} className="flex items-center gap-2">
          <RadioGroupItem id={`theme-${theme}`} value={theme} />
          <Label htmlFor={`theme-${theme}`} className="capitalize">
            {theme}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

export const Basic: Story = {
  render: () => <RadioGroupStory />,
};
