import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const meta = {
  title: "UI/Tabs",
  component: Tabs,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[420px]">
      <TabsList aria-label="Product sections">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="specs">Specs</TabsTrigger>
        <TabsTrigger value="delivery">Delivery</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        Use tabs for related content panels that belong on the same page.
      </TabsContent>
      <TabsContent value="specs">
        Keep specifications short and scannable inside each panel.
      </TabsContent>
      <TabsContent value="delivery">
        Link to deeper pages when the content becomes long.
      </TabsContent>
    </Tabs>
  ),
};

export const LongChineseContent: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[420px]">
      <TabsList aria-label="产品内容分组">
        <TabsTrigger value="overview">概览</TabsTrigger>
        <TabsTrigger value="specs">规格</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        用于检查较长中文内容在标签面板中的换行、间距和可读性。
      </TabsContent>
      <TabsContent value="specs">
        面板内容应保持简短；如果信息很多，应拆到正文区或详情页。
      </TabsContent>
    </Tabs>
  ),
};
