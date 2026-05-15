"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ThemeSwitcherHighlight } from "@/components/ui/theme-switcher-highlight";

const themes = [
  {
    key: "system",
    icon: Monitor,
    label: "System theme",
  },
  {
    key: "light",
    icon: Sun,
    label: "Light theme",
  },
  {
    key: "dark",
    icon: Moon,
    label: "Dark theme",
  },
];

const unsubscribeHydration = () => undefined;
const subscribeHydration = () => unsubscribeHydration;
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

export type ThemeSwitcherProps = Omit<
  React.ComponentPropsWithoutRef<typeof RadioGroup>,
  "onValueChange" | "value"
> & {
  className?: string;
};

export const ThemeSwitcher = ({ className, ...rest }: ThemeSwitcherProps) => {
  const { theme, setTheme } = useTheme();
  const isHydrated = useSyncExternalStore(
    subscribeHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const dataTestId = (rest as Record<string, unknown>)["data-testid"] as
    | string
    | undefined;
  const selectedTheme = theme ?? "system";

  const handleThemeClick = useCallback(
    (themeKey: "light" | "dark" | "system") => {
      setTheme(themeKey);
    },
    [setTheme],
  );

  // 服务端和客户端首次渲染都返回骨架屏，避免水合不匹配
  if (!isHydrated) {
    return (
      <div
        className={cn(
          "relative isolate flex h-8 rounded-full bg-background p-1 ring-1 ring-border",
          className,
        )}
        {...rest}
        data-testid={dataTestId ?? "theme-toggle"}
      >
        {themes.map(({ key, icon: Icon, label }) => (
          <button
            aria-label={label}
            className="relative h-6 w-6 rounded-full"
            key={key}
            type="button"
            disabled
          >
            <Icon className="relative z-10 m-auto h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <RadioGroup
      className={cn(
        "relative isolate flex h-8 grid-cols-none rounded-full bg-background p-1 ring-1 ring-border",
        className,
      )}
      {...rest}
      data-testid={dataTestId ?? "theme-toggle"}
      value={selectedTheme}
      onValueChange={(value) =>
        handleThemeClick(value as "light" | "dark" | "system")
      }
    >
      {themes.map(({ key, icon: Icon, label }) => {
        const isActive = selectedTheme === key;

        return (
          <RadioGroupItem
            aria-label={label}
            className="relative h-6 w-6 rounded-full border-0 bg-transparent shadow-none data-[state=checked]:border-0 data-[state=checked]:bg-transparent"
            key={key}
            value={key}
          >
            {isActive ? <ThemeSwitcherHighlight /> : null}
            <Icon
              className={cn(
                "relative z-10 m-auto h-4 w-4",
                isActive ? "text-foreground" : "text-muted-foreground",
              )}
            />
          </RadioGroupItem>
        );
      })}
    </RadioGroup>
  );
};
