import { act, screen } from "@testing-library/react";
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
    children?: React.ReactNode;
    href?: string;
    [key: string]: any;
  }) => (
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
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({
    children,
    open,
    onOpenChange,
  }: {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => (
    <div
      aria-expanded={open}
      data-testid="dropdown-menu"
      data-open={open}
      onClick={() => onOpenChange?.(!open)}
      onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== "Enter" && event.key !== " ") return;

        event.preventDefault();
        onOpenChange?.(!open);
      }}
      role="button"
      tabIndex={0}
    >
      {children}
    </div>
  ),
  DropdownMenuContent: ({
    children,
    align,
    className,
    ...props
  }: {
    children?: React.ReactNode;
    align?: string;
    className?: string;
    [key: string]: any;
  }) => (
    <div
      data-testid="dropdown-content"
      data-align={align}
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
  DropdownMenuTrigger: ({
    children,
    asChild,
  }: {
    children?: React.ReactNode;
    asChild?: boolean;
  }) => {
    if (asChild) {
      return children;
    }
    return <div data-testid="dropdown-trigger">{children}</div>;
  },
  DropdownMenuItem: ({
    children,
    onClick,
    ...props
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    [key: string]: any;
  }) => (
    <button
      data-testid="dropdown-item"
      onClick={onClick}
      role="menuitem"
      type="button"
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    variant,
    size,
    className,
    ...props
  }: {
    children?: React.ReactNode;
    variant?: string;
    size?: string;
    className?: string;
    [key: string]: any;
  }) => (
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
    [key: string]: any;
  }) => (
    <span data-testid="languages-icon" className={className} {...props}>
      🌐
    </span>
  ),
  ChevronDown: ({
    className,
    ...props
  }: {
    className?: string;
    [key: string]: any;
  }) => (
    <span data-testid="chevron-down-icon" className={className} {...props}>
      ⌄
    </span>
  ),
  Check: ({
    className,
    ...props
  }: {
    className?: string;
    [key: string]: any;
  }) => (
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
