import type { ReactNode } from "react";

import { SectionHead } from "@/components/ui/section-head";
import { cn } from "@/lib/utils";

interface HomepageSectionShellProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  sectionClassName?: string;
  innerClassName?: string;
}

export function HomepageSectionShell({
  title,
  subtitle,
  action,
  children,
  sectionClassName,
  innerClassName,
}: HomepageSectionShellProps) {
  return (
    <section className={sectionClassName}>
      <div className={cn("mx-auto max-w-[1080px] px-6", innerClassName)}>
        <SectionHead
          title={title}
          {...(subtitle !== undefined ? { subtitle } : {})}
          {...(action !== undefined ? { action } : {})}
        />
        {children}
      </div>
    </section>
  );
}
