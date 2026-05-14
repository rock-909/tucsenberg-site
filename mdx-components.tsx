import React from "react";
import Image, { type ImageProps } from "next/image";
import type { MDXComponents } from "mdx/types";
import { getBlurPlaceholder } from "@/lib/image";

// This file allows you to provide custom React components
// to be used in MDX files. You can import and use any
// React component you want, including inline styles,
// components from other libraries, and more.

const headingComponents = {
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="mb-6 text-4xl font-bold text-foreground">{children}</h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="mb-4 text-3xl font-semibold text-foreground">{children}</h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="mb-3 text-2xl font-medium text-foreground">{children}</h3>
  ),
};

const textComponents = {
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="mb-4 leading-relaxed text-muted-foreground">{children}</p>
  ),
  a: ({ children, href }: { children: React.ReactNode; href?: string }) => {
    const SAFE_PROTOCOLS = ["https:", "http:", "mailto:", "tel:"];
    const isSafe =
      !href ||
      href.startsWith("/") ||
      href.startsWith("#") ||
      SAFE_PROTOCOLS.some((p) => href.startsWith(p));
    const safeHref = isSafe ? href : "#";
    return (
      <a
        href={safeHref}
        className="text-primary underline underline-offset-4 hover:text-primary/80"
      >
        {children}
      </a>
    );
  },
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="mb-4 rounded-lg border border-border bg-muted/40 px-4 py-3 text-muted-foreground italic">
      {children}
    </blockquote>
  ),
};

const listComponents = {
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="mb-4 list-inside list-disc space-y-2 text-muted-foreground">
      {children}
    </ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="mb-4 list-inside list-decimal space-y-2 text-muted-foreground">
      {children}
    </ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="text-muted-foreground">{children}</li>
  ),
};

const codeComponents = {
  code: ({ children }: { children: React.ReactNode }) => (
    <code className="rounded bg-muted px-2 py-1 font-mono text-sm text-foreground">
      {children}
    </code>
  ),
  pre: ({ children }: { children: React.ReactNode }) => (
    <pre className="mb-4 overflow-x-auto rounded-lg bg-muted p-4 text-foreground">
      {children}
    </pre>
  ),
};

const mediaComponents = {
  img: (props: ImageProps) => {
    // 安全地处理 props，确保关键属性不被覆盖
    const { alt, className, style, ...safeProps } = props;

    return (
      <Image
        sizes="100vw"
        style={{ width: "100%", height: "auto", ...style }}
        className={`rounded-lg shadow-md ${className || ""}`}
        {...safeProps}
        {...getBlurPlaceholder("neutral")}
        alt={alt || ""} // 确保 alt 属性始终存在且不能被覆盖
      />
    );
  },
  hr: () => <hr className="my-8 border-border" />,
};

const tableComponents = {
  table: ({ children }: { children: React.ReactNode }) => (
    <div className="mb-4 overflow-x-auto">
      <table className="min-w-full border-collapse border border-border">
        {children}
      </table>
    </div>
  ),
  th: ({ children }: { children: React.ReactNode }) => (
    <th className="border border-border bg-muted px-4 py-2 text-left font-semibold text-foreground">
      {children}
    </th>
  ),
  td: ({ children }: { children: React.ReactNode }) => (
    <td className="border border-border px-4 py-2 text-muted-foreground">
      {children}
    </td>
  ),
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...headingComponents,
    ...textComponents,
    ...listComponents,
    ...codeComponents,
    ...mediaComponents,
    ...tableComponents,
    ...components,
  };
}
