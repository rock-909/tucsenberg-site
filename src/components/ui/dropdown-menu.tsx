"use client";

import type { ComponentPropsWithoutRef, ElementRef, Ref } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

function DropdownMenu({
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuTrigger({
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  );
}

/** @public shadcn wrapper API surface — kept for complete DropdownMenu primitive set */
export function DropdownMenuGroup({
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  );
}

/** @public shadcn wrapper API surface — kept for complete DropdownMenu primitive set */
export function DropdownMenuPortal({
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  );
}

interface DropdownMenuContentProps extends ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Content
> {
  ref?: Ref<ElementRef<typeof DropdownMenuPrimitive.Content>> | undefined;
}

interface DropdownMenuItemProps extends ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Item
> {
  ref?: Ref<ElementRef<typeof DropdownMenuPrimitive.Item>> | undefined;
}

interface DropdownMenuSeparatorProps extends ComponentPropsWithoutRef<
  typeof DropdownMenuPrimitive.Separator
> {
  ref?: Ref<ElementRef<typeof DropdownMenuPrimitive.Separator>> | undefined;
}

function DropdownMenuContent({
  className,
  ref,
  sideOffset = 4,
  ...props
}: DropdownMenuContentProps) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "border-border bg-popover text-popover-foreground data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1 z-50 min-w-40 overflow-hidden rounded-[12px] border p-1 shadow-md outline-none data-[state=closed]:duration-150 data-[state=open]:duration-200",
          className,
        )}
        {...props}
        data-slot="dropdown-menu-content"
      />
    </DropdownMenuPrimitive.Portal>
  );
}

DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

function DropdownMenuItem({ className, ref, ...props }: DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        "focus:bg-accent focus:text-foreground active:bg-muted relative flex cursor-default items-center gap-2 rounded-[6px] px-2 py-1.5 text-sm transition-[background-color,color] duration-150 ease-out outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
      data-slot="dropdown-menu-item"
    />
  );
}

DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

function DropdownMenuSeparator({
  className,
  ref,
  ...props
}: DropdownMenuSeparatorProps) {
  return (
    <DropdownMenuPrimitive.Separator
      ref={ref}
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
      data-slot="dropdown-menu-separator"
    />
  );
}

DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
