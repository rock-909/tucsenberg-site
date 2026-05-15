import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

const meta = {
  title: "UI/Collapsible",
  component: Collapsible,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Collapsible>;

export default meta;

type Story = StoryObj<typeof meta>;

function CollapsibleStory() {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="w-[320px] space-y-2"
    >
      <CollapsibleTrigger asChild>
        <Button type="button" variant="outline">
          Toggle details
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="rounded-lg border p-3 text-sm text-muted-foreground">
        Radix owns the disclosure behavior while project classes own the surface
        tone.
      </CollapsibleContent>
    </Collapsible>
  );
}

export const Basic: Story = {
  render: () => <CollapsibleStory />,
};
