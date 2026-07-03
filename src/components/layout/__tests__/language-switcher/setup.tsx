import { act, screen } from "@testing-library/react";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
  KeyboardEvent,
  ReactElement,
  ReactNode,
} from "react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { TEST_COUNT_CONSTANTS } from "@/test/constants/test-constants";

// 测试常量
export const TEST_TIMEOUTS = {
  SUCCESS_TIMER: 2000,
  LOADING_DELAY: 1500,
  ANIMATION_DURATION: 4000,
  DEBOUNCE_DELAY: 300,
  FAST_TIMER: 100,
  LONG_TIMEOUT: 10000,
} as const;

// Mock next-intl hooks
vi.mock("next-intl", () => ({
  useLocale: vi.fn(() => "en"),
  useTranslations: vi.fn(() => (key: string) => {
    const translations: Record<string, string> = {
      "language.switch": "Switch language",
      "language.english": "English",
      "language.chinese": "Chinese",
      "language.current": "Current language: English",
      toggle: "toggle",
      selectLanguage: "Select language",
    };
    // 安全的属性访问，避免对象注入
    const safeTranslations = new Map(Object.entries(translations));
    return safeTranslations.get(key) || key;
  }),
}));

// Mock i18n routing
vi.mock("@/i18n/routing", () => ({
  Link: ({
    children,
    href,
    ...props
  }: {
    children?: ReactNode;
    href?: string;
  } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => "/"),
}));

// Mock UI components
vi.mock("@/components/ui/dropdown-menu", async () => {
  const React = await import("react");

  interface DropdownMenuContextValue {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  interface AsChildProps {
    asChild?: boolean;
    children?: ReactNode;
  }

  interface DropdownMenuProps extends AsChildProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  interface DropdownMenuContentProps
    extends HTMLAttributes<HTMLDivElement>, AsChildProps {
    align?: string;
  }

  interface DropdownMenuItemProps
    extends HTMLAttributes<HTMLDivElement>, AsChildProps {
    onSelect?: (event: Event) => void;
  }

  const DropdownMenuContext =
    React.createContext<DropdownMenuContextValue | null>(null);

  function isElement(child: ReactNode): child is ReactElement {
    return React.isValidElement(child);
  }

  function DropdownMenu({ children, open, onOpenChange }: DropdownMenuProps) {
    return (
      <DropdownMenuContext.Provider value={{ open, onOpenChange }}>
        <div data-testid="dropdown-menu" data-open={open}>
          {children}
        </div>
      </DropdownMenuContext.Provider>
    );
  }

  function DropdownMenuTrigger({ children, asChild }: AsChildProps) {
    const context = React.useContext(DropdownMenuContext);
    const triggerProps: ButtonHTMLAttributes<HTMLButtonElement> = {
      "aria-expanded": context?.open,
      "aria-haspopup": "menu",
      onClick: () => context?.onOpenChange?.(!context.open),
      onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key !== "Enter" && event.key !== " ") return;

        event.preventDefault();
        context?.onOpenChange?.(!context?.open);
      },
    };

    if (asChild && isElement(children)) {
      return React.cloneElement(children, {
        ...triggerProps,
        ...children.props,
        onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
          triggerProps.onClick?.(event);
          children.props.onClick?.(event);
        },
        onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
          triggerProps.onKeyDown?.(event);
          children.props.onKeyDown?.(event);
        },
      });
    }

    return (
      <button data-testid="dropdown-trigger" type="button" {...triggerProps}>
        {children}
      </button>
    );
  }

  function DropdownMenuContent({
    children,
    align,
    className,
    asChild,
    ...props
  }: DropdownMenuContentProps) {
    const context = React.useContext(DropdownMenuContext);

    if (!context?.open) return null;

    const contentProps: HTMLAttributes<HTMLDivElement> = {
      "data-align": align,
      className,
      role: "menu",
      ...props,
    };

    if (asChild && isElement(children)) {
      return React.cloneElement(children, {
        ...contentProps,
        ...children.props,
      });
    }

    return <div {...contentProps}>{children}</div>;
  }

  function DropdownMenuItem({
    children,
    onClick,
    onSelect,
    asChild,
    ...props
  }: DropdownMenuItemProps) {
    const itemProps: HTMLAttributes<HTMLElement> = {
      role: "menuitem",
      ...props,
      onClick: (event) => {
        onClick?.(event);
        onSelect?.(event.nativeEvent);
      },
    };

    if (asChild && isElement(children)) {
      return React.cloneElement(children, {
        ...itemProps,
        ...children.props,
        onClick: (event: React.MouseEvent<HTMLElement>) => {
          itemProps.onClick?.(event);
          children.props.onClick?.(event);
        },
      });
    }

    return <div {...itemProps}>{children}</div>;
  }

  return {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuGroup: ({ children }: AsChildProps) => <div>{children}</div>,
    DropdownMenuPortal: ({ children }: AsChildProps) => <>{children}</>,
    DropdownMenuItem,
    DropdownMenuSeparator: (props: HTMLAttributes<HTMLHRElement>) => (
      <hr {...props} />
    ),
  };
});

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    variant,
    size,
    className,
    ...props
  }: {
    children?: ReactNode;
    variant?: string;
    size?: string;
    className?: string;
  } & ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button
      data-testid="language-button"
      data-variant={variant}
      data-size={size}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock Lucide icons
vi.mock("lucide-react", () => ({
  Languages: ({
    className,
    ...props
  }: {
    className?: string;
  } & HTMLAttributes<HTMLSpanElement>) => (
    <span data-testid="languages-icon" className={className} {...props}>
      🌐
    </span>
  ),
  ChevronDown: ({
    className,
    ...props
  }: {
    className?: string;
  } & HTMLAttributes<HTMLSpanElement>) => (
    <span data-testid="chevron-down-icon" className={className} {...props}>
      ⌄
    </span>
  ),
  Check: ({
    className,
    ...props
  }: {
    className?: string;
  } & HTMLAttributes<HTMLSpanElement>) => (
    <span data-testid="check-icon" className={className} {...props}>
      ✓
    </span>
  ),
}));

// Mock analytics
export const mockAnalytics = {
  track: vi.fn(),
  identify: vi.fn(),
  page: vi.fn(),
};

vi.mock("@/lib/analytics", () => ({
  analytics: mockAnalytics,
}));

// Mock router
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => mockRouter),
  usePathname: vi.fn(() => "/"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock localStorage
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(global, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

// Mock matchMedia
export const mockMatchMedia = vi.fn();
Object.defineProperty(window, "matchMedia", {
  value: mockMatchMedia,
  writable: true,
});

// Mock ResizeObserver
export const mockResizeObserver = vi.fn();
mockResizeObserver.mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
Object.defineProperty(window, "ResizeObserver", {
  value: mockResizeObserver,
  writable: true,
});

// Mock IntersectionObserver
export const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
Object.defineProperty(window, "IntersectionObserver", {
  value: mockIntersectionObserver,
  writable: true,
});

// Setup function for language switcher tests
export function setupLanguageSwitcherTest() {
  vi.clearAllMocks();

  // Reset localStorage mock
  mockLocalStorage.getItem.mockReturnValue(null);
  mockLocalStorage.setItem.mockImplementation(() => {});
  mockLocalStorage.removeItem.mockImplementation(() => {});
  mockLocalStorage.clear.mockImplementation(() => {});

  // Reset matchMedia mock
  mockMatchMedia.mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  // Reset analytics mock
  mockAnalytics.track.mockClear();
  mockAnalytics.identify.mockClear();
  mockAnalytics.page.mockClear();

  // Reset router mock
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.back.mockClear();
  mockRouter.forward.mockClear();
  mockRouter.refresh.mockClear();
  mockRouter.prefetch.mockClear();

  // Reset observer mocks
  mockResizeObserver.mockClear();
  mockIntersectionObserver.mockClear();
}

// Cleanup function for tests
export function cleanupLanguageSwitcherTest() {
  vi.restoreAllMocks();
}

// Helper function to simulate user interaction
export async function simulateLanguageSwitch(targetLanguage: string) {
  const user = userEvent.setup();

  // Click the language switcher button
  const button = screen.getByTestId("language-button");
  await user.click(button);

  // Wait for dropdown to open
  await act(async () => {
    await new Promise((resolve) =>
      setTimeout(resolve, TEST_TIMEOUTS.FAST_TIMER),
    );
  });

  // Click the target language option
  const option = screen.getByText(targetLanguage);
  await user.click(option);

  // Wait for language switch to complete
  await act(async () => {
    await new Promise((resolve) =>
      setTimeout(resolve, TEST_TIMEOUTS.DEBOUNCE_DELAY),
    );
  });
}

// Helper function to simulate keyboard navigation
export async function simulateKeyboardNavigation(key: string) {
  const user = userEvent.setup();
  const button = screen.getByTestId("language-button");

  button.focus();
  await user.keyboard(key);

  await act(async () => {
    await new Promise((resolve) =>
      setTimeout(resolve, TEST_TIMEOUTS.FAST_TIMER),
    );
  });
}

// Export test utilities
export { act, screen, TEST_COUNT_CONSTANTS, userEvent };
