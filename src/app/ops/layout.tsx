import "@/app/globals.css";

import type { ReactNode } from "react";
import { getFontClassNames } from "@/app/[locale]/layout-fonts";
import { ThemeProvider } from "@/components/theme-provider";

interface OpsLayoutProps {
  children: ReactNode;
}

export default function OpsLayout({ children }: OpsLayoutProps) {
  return (
    <html lang="en" className={getFontClassNames()} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
