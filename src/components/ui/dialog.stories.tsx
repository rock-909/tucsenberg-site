import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const meta = {
  title: "UI/Dialog",
  component: Dialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm changes</DialogTitle>
          <DialogDescription>
            Review the starter content and replace it with the real project
            scope before publishing.
          </DialogDescription>
        </DialogHeader>
        <div className="px-4 text-sm text-muted-foreground">
          Add short guidance, a compact form, or a focused decision here.
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const DefaultOpen: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="outline">Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open dialog preview</DialogTitle>
          <DialogDescription>
            This story keeps the dialog open so layout can be reviewed without
            clicking first.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  ),
};

export const LongChineseContent: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">打开确认对话框</Button>
      </DialogTrigger>
      <DialogContent closeLabel="关闭对话框">
        <DialogHeader>
          <DialogTitle>发布前确认</DialogTitle>
          <DialogDescription>
            用于检查较长中文标题和描述在模态对话框中的换行、间距和关闭按钮位置。
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  ),
};

export const LongScrollableContent: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="outline">Open long dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review every checklist item</DialogTitle>
          <DialogDescription>
            Scrollable body keeps the close button reachable on small viewports.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 px-4 text-sm text-muted-foreground">
          {Array.from({ length: 24 }, (_, index) => (
            <p key={index}>
              Checklist item {index + 1}: replace starter copy with the final
              project scope, owners, and approval notes before publishing.
            </p>
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Confirm</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
