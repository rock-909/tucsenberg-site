import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const meta = {
  title: "UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <Card className="w-[360px]">
      <CardHeader>
        <CardTitle>Showcase offer card</CardTitle>
        <CardDescription>
          Replace this with the real product, service, or offer name.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Use this space for a short buyer-facing summary and key details.
        </p>
      </CardContent>
    </Card>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Card className="w-[380px]">
      <CardHeader>
        <CardTitle>Launch-ready service</CardTitle>
        <CardDescription>
          Review scope before confirming the next step.
        </CardDescription>
        <CardAction>
          <Badge variant="secondary">Ready</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>Replaceable scope item</li>
          <li>Brand adaptation support</li>
          <li>Clear handoff notes</li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button size="sm">Request specs</Button>
      </CardFooter>
    </Card>
  ),
};

export const LongChineseContent: Story = {
  render: () => (
    <Card className="w-[360px]">
      <CardHeader>
        <CardTitle>可替换展示卡片</CardTitle>
        <CardDescription>
          用于检查中文标题、描述和按钮组合在卡片中的换行表现。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          用于检查中文长文案、重点信息和卡片布局在不同宽度下的表现。
        </p>
      </CardContent>
    </Card>
  ),
};
