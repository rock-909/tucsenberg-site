import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  DataCard,
  DataCardContent,
  DataCardDescription,
  DataCardHeader,
  DataCardTitle,
} from "@/components/ui/data-card";

const meta = {
  title: "UI/DataCard",
  component: DataCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof DataCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DataCard className="w-[420px]">
      <DataCardHeader>
        <DataCardTitle>Structured data</DataCardTitle>
        <DataCardDescription>
          Wrapper-level surface for specs, parameters, and reference facts.
        </DataCardDescription>
      </DataCardHeader>
      <DataCardContent>
        <dl className="divide-y divide-border text-sm">
          <div className="grid grid-cols-[1fr_2fr] gap-4 py-3">
            <dt className="font-medium text-muted-foreground">Label</dt>
            <dd className="text-foreground">Value</dd>
          </div>
          <div className="grid grid-cols-[1fr_2fr] gap-4 py-3">
            <dt className="font-medium text-muted-foreground">Label</dt>
            <dd className="text-foreground">Value</dd>
          </div>
          <div className="grid grid-cols-[1fr_2fr] gap-4 py-3">
            <dt className="font-medium text-muted-foreground">Label</dt>
            <dd className="text-foreground">Value</dd>
          </div>
        </dl>
      </DataCardContent>
    </DataCard>
  ),
};

export const LongChineseContent: Story = {
  render: () => (
    <DataCard className="w-[420px]">
      <DataCardHeader>
        <DataCardTitle>结构化数据卡片</DataCardTitle>
        <DataCardDescription>
          用于检查较长中文标题、描述和键值内容在 DataCard 中的换行与间距。
        </DataCardDescription>
      </DataCardHeader>
      <DataCardContent>
        <dl className="divide-y divide-border text-sm">
          <div className="grid grid-cols-[1fr_2fr] gap-4 py-3">
            <dt className="font-medium text-muted-foreground">字段名称</dt>
            <dd className="text-foreground">
              用于检查较长中文值在表格列中的换行表现
            </dd>
          </div>
        </dl>
      </DataCardContent>
    </DataCard>
  ),
};
