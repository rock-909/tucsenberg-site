/**
 * React 19 Hook测试模板
 * 提供useActionState、useFormStatus、useOptimistic、use Hook的标准化测试结构
 *
 * @version 1.0.0
 * @author React 19架构升级项目
 */

import "@testing-library/jest-dom/vitest";
import _React from "react";
import {
  fireEvent as _fireEvent,
  render as _render,
  waitFor as _waitFor,
  act,
} from "@testing-library/react";
import {
  afterEach as _afterEach,
  beforeEach as _beforeEach,
  describe as _describe,
  expect as _expect,
  it as _it,
  vi,
} from "vitest";
import type {
  ActionState,
  ServerActionFunction,
  UseActionStateReturn,
  UseFormStatusReturn,
  UseOptimisticReturn,
} from "@/types/react19";

/**
 * useOptimistic Hook测试工具函数
 */
export const createOptimisticTestUtils = () => {
  const mockOptimisticUpdater = vi.fn();
  const mockSetOptimistic = vi.fn();

  return {
    mockOptimisticUpdater,
    mockSetOptimistic,
    createOptimisticState: <T>(initialState: T) => ({
      optimisticState: initialState,
      setOptimistic: mockSetOptimistic,
    }),
  };
};

/**
 * 表单测试工具函数
 */
export const createFormTestUtils = () => {
  const mockFormAction = vi.fn();
  const mockServerAction = vi.fn();

  return {
    mockFormAction,
    mockServerAction,
    createMockFormData: (data: Record<string, string>) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value);
      });
      return formData;
    },
    simulateFormSubmission: async (formElement: HTMLFormElement) => {
      const formData = new FormData(formElement);
      return mockFormAction(formData);
    },
  };
};

// 测试常量定义
const REACT19_TEST_CONSTANTS = {
  TIMEOUT: {
    ACTION_TIMEOUT: 1000,
    FORM_SUBMIT_TIMEOUT: 500,
    OPTIMISTIC_UPDATE_TIMEOUT: 100,
    PROMISE_RESOLUTION_TIMEOUT: 200,
  },
  DELAYS: {
    SHORT: 50,
    MEDIUM: 100,
    LONG: 300,
  },
  FORM_DATA: {
    SAMPLE_TEXT: "test-input-value",
    SAMPLE_EMAIL: "test@example.com",
    SAMPLE_NUMBER: "42",
  },
};

/**
 * useActionState Hook测试模板
 */
export class UseActionStateTestTemplate {
  /**
   * 生成useActionState测试套件
   */
  static generateTestSuite(hookName: string = "useActionState"): string {
    return `
describe('${hookName} Hook Tests', () => {
  // Mock Server Action
  const mockServerAction: ServerActionFunction<ActionState, unknown> = vi.fn();
  const initialState: ActionState = { isPending: false, success: false };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should return initial state and form action', () => {
      const TestComponent = () => {
        const [state, formAction, isPending] = useActionState(mockServerAction, initialState);
        return (
          <div>
            <span data-testid="state">{JSON.stringify(state)}</span>
            <span data-testid="pending">{isPending.toString()}</span>
            <form action={formAction}>
              <button type="submit">Submit</button>
            </form>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('state')).toHaveTextContent(JSON.stringify(initialState));
      expect(screen.getByTestId('pending')).toHaveTextContent('false');
    });

    it('should handle form submission with formData', async () => {
      mockServerAction.mockResolvedValue({ isPending: false, success: true });

      const TestComponent = () => {
        const [state, formAction, isPending] = useActionState(mockServerAction, initialState);
        return (
          <form action={formAction}>
            <input name="test" defaultValue="test-value" />
            <button type="submit" disabled={isPending}>
              {isPending ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        );
      };

      render(<TestComponent />);

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockServerAction).toHaveBeenCalledWith(
          initialState,
          expect.any(FormData)
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle server action errors gracefully', async () => {
      const errorState = { isPending: false, success: false, error: 'Server error' };
      mockServerAction.mockResolvedValue(errorState);

      const TestComponent = () => {
        const [state, formAction] = useActionState(mockServerAction, initialState);
        return (
          <div>
            <span data-testid="error">{state.error || 'No error'}</span>
            <form action={formAction}>
              <button type="submit">Submit</button>
            </form>
          </div>
        );
      };

      render(<TestComponent />);

      fireEvent.submit(screen.getByRole('form'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Server error');
      });
    });
  });

  describe('Performance & Optimization', () => {
    it('should not cause unnecessary re-renders', () => {
      const renderSpy = vi.fn();

      const TestComponent = () => {
        renderSpy();
        const [state, formAction] = useActionState(mockServerAction, initialState);
        return <form action={formAction}><button>Submit</button></form>;
      };

      const { rerender } = render(<TestComponent />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(<TestComponent />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });
});`;
  }

  /**
   * 创建Mock Server Action
   */
  static createMockServerAction<TState>(
    mockImplementation?: (
      prevState: TState,
      formData: FormData,
    ) => Promise<TState>,
  ): ServerActionFunction<TState, unknown> {
    return vi.fn(mockImplementation) as ServerActionFunction<TState, unknown>;
  }
}

/**
 * useFormStatus Hook测试模板
 */
export class UseFormStatusTestTemplate {
  /**
   * 生成useFormStatus测试套件
   */
  static generateTestSuite(hookName: string = "useFormStatus"): string {
    return `
describe('${hookName} Hook Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Form Status Detection', () => {
    it('should detect form submission status in child component', () => {
      const SubmitButton = () => {
        const { pending } = useFormStatus();
        return (
          <button type="submit" disabled={pending} data-testid="submit-btn">
            {pending ? 'Submitting...' : 'Submit'}
          </button>
        );
      };

      const FormComponent = () => (
        <form action={() => {}}>
          <SubmitButton />
        </form>
      );

      render(<FormComponent />);

      const button = screen.getByTestId('submit-btn');
      expect(button).toHaveTextContent('Submit');
      expect(button).not.toBeDisabled();
    });

    it('should update pending status during form submission', async () => {
      const mockAction = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const SubmitButton = () => {
        const { pending } = useFormStatus();
        return (
          <button type="submit" disabled={pending} data-testid="submit-btn">
            {pending ? 'Submitting...' : 'Submit'}
          </button>
        );
      };

      const FormComponent = () => (
        <form action={mockAction}>
          <SubmitButton />
        </form>
      );

      render(<FormComponent />);

      const button = screen.getByTestId('submit-btn');
      fireEvent.click(button);

      // 验证pending状态变化
      await waitFor(() => {
        expect(button).toHaveTextContent('Submitting...');
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Form Data Access', () => {
    it('should provide access to form data during submission', async () => {
      let capturedFormData: FormData | null = null;

      const DataDisplay = () => {
        const { data } = useFormStatus();
        if (data) {
          capturedFormData = data;
        }
        return <div data-testid="form-data">{data ? 'Has data' : 'No data'}</div>;
      };

      const FormComponent = () => (
        <form action={() => {}}>
          <input name="test" defaultValue="test-value" />
          <DataDisplay />
          <button type="submit">Submit</button>
        </form>
      );

      render(<FormComponent />);

      fireEvent.submit(screen.getByRole('form'));

      await waitFor(() => {
        expect(capturedFormData).toBeInstanceOf(FormData);
        expect(capturedFormData?.get('test')).toBe('test-value');
      });
    });
  });
});`;
  }
}

/**
 * useOptimistic Hook测试模板
 */
export class UseOptimisticTestTemplate {
  /**
   * 生成useOptimistic测试套件
   */
  static generateTestSuite(hookName: string = "useOptimistic"): string {
    return `
describe('${hookName} Hook Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Optimistic Updates', () => {
    it('should provide optimistic state updates', () => {
      const initialMessages = [{ id: 1, text: 'Hello' }];

      const TestComponent = () => {
        const [optimisticMessages, addOptimisticMessage] = useOptimistic(
          initialMessages,
          (state, newMessage) => [...state, { ...newMessage, sending: true }]
        );

        return (
          <div>
            <div data-testid="message-count">{optimisticMessages.length}</div>
            <button
              onClick={() => addOptimisticMessage({ id: 2, text: 'New message' })}
              data-testid="add-btn"
            >
              Add Message
            </button>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('message-count')).toHaveTextContent('1');

      fireEvent.click(screen.getByTestId('add-btn'));

      expect(screen.getByTestId('message-count')).toHaveTextContent('2');
    });

    it('should work with startTransition for async operations', async () => {
      const TestComponent = () => {
        const [messages, setMessages] = React.useState([{ id: 1, text: 'Hello' }]);
        const [optimisticMessages, addOptimisticMessage] = useOptimistic(
          messages,
          (state, newMessage) => [...state, newMessage]
        );
        const [isPending, startTransition] = React.useTransition();

        const handleAddMessage = () => {
          const newMessage = { id: Date.now(), text: 'Optimistic message' };
          addOptimisticMessage(newMessage);

          startTransition(async () => {
            // 模拟异步操作
            await new Promise(resolve => setTimeout(resolve, 100));
            setMessages(prev => [...prev, newMessage]);
          });
        };

        return (
          <div>
            <div data-testid="message-count">{optimisticMessages.length}</div>
            <div data-testid="pending">{isPending.toString()}</div>
            <button onClick={handleAddMessage} data-testid="add-btn">
              Add Message
            </button>
          </div>
        );
      };

      render(<TestComponent />);

      fireEvent.click(screen.getByTestId('add-btn'));

      // 立即显示乐观更新
      expect(screen.getByTestId('message-count')).toHaveTextContent('2');

      // 等待异步操作完成
      await waitFor(() => {
        expect(screen.getByTestId('pending')).toHaveTextContent('false');
      });
    });
  });
});`;
  }
}

/**
 * use Hook测试模板
 */
export class UseHookTestTemplate {
  /**
   * 生成use Hook测试套件
   */
  static generateTestSuite(hookName: string = "use"): string {
    return `
describe('${hookName} Hook Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Promise Handling', () => {
    it('should handle Promise resolution', async () => {
      const testPromise = Promise.resolve('Test data');

      const TestComponent = () => {
        const data = use(testPromise);
        return <div data-testid="data">{data}</div>;
      };

      const WrappedComponent = () => (
        <React.Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <TestComponent />
        </React.Suspense>
      );

      render(<WrappedComponent />);

      // 初始显示loading
      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // 等待Promise解析
      await waitFor(() => {
        expect(screen.getByTestId('data')).toHaveTextContent('Test data');
      });
    });

    it('should handle conditional Promise reading', async () => {
      const testPromise = Promise.resolve('Conditional data');

      const TestComponent = ({ shouldLoad }: { shouldLoad: boolean }) => {
        if (shouldLoad) {
          const data = use(testPromise);
          return <div data-testid="data">{data}</div>;
        }
        return <div data-testid="no-data">No data</div>;
      };

      const WrappedComponent = ({ shouldLoad }: { shouldLoad: boolean }) => (
        <React.Suspense fallback={<div data-testid="loading">Loading...</div>}>
          <TestComponent shouldLoad={shouldLoad} />
        </React.Suspense>
      );

      const { rerender } = render(<WrappedComponent shouldLoad={false} />);

      expect(screen.getByTestId('no-data')).toBeInTheDocument();

      rerender(<WrappedComponent shouldLoad={true} />);

      await waitFor(() => {
        expect(screen.getByTestId('data')).toHaveTextContent('Conditional data');
      });
    });
  });

  describe('Context Reading', () => {
    it('should read context values conditionally', () => {
      const TestContext = React.createContext('default-value');

      const TestComponent = ({ useContext: shouldUseContext }: { useContext: boolean }) => {
        if (shouldUseContext) {
          const value = use(TestContext);
          return <div data-testid="context-value">{value}</div>;
        }
        return <div data-testid="no-context">No context</div>;
      };

      const WrappedComponent = ({ useContext }: { useContext: boolean }) => (
        <TestContext.Provider value="test-context-value">
          <TestComponent useContext={useContext} />
        </TestContext.Provider>
      );

      const { rerender } = render(<WrappedComponent useContext={false} />);

      expect(screen.getByTestId('no-context')).toBeInTheDocument();

      rerender(<WrappedComponent useContext={true} />);

      expect(screen.getByTestId('context-value')).toHaveTextContent('test-context-value');
    });
  });
});`;
  }
}

/**
 * React 19 Hook测试工具函数
 */
export const React19TestUtils = {
  /**
   * 创建测试用的FormData
   */
  createTestFormData: (data: Record<string, string>): FormData => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    return formData;
  },

  /**
   * 创建测试用的Promise
   */
  createTestPromise: <T>(value: T, delay: number = 0): Promise<T> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(value), delay);
    });
  },

  /**
   * 创建测试用的Server Action
   */
  createTestServerAction: <TState>(
    implementation: (prevState: TState, formData: FormData) => Promise<TState>,
  ): ServerActionFunction<TState, unknown> => {
    return vi.fn(implementation) as ServerActionFunction<TState, unknown>;
  },

  /**
   * 等待React 19异步操作完成
   */
  waitForReact19Async: async (
    timeout: number = REACT19_TEST_CONSTANTS.TIMEOUT.ACTION_TIMEOUT,
  ) => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, timeout));
    });
  },

  /**
   * 创建useOptimistic Hook测试组件的代码模板
   */
  createOptimisticTestComponentTemplate: `
    function OptimisticTestComponent({ onOptimisticUpdate }) {
      const [optimisticState, setOptimistic] = React.useOptimistic(
        initialState,
        optimisticUpdater
      );

      React.useEffect(() => {
        onOptimisticUpdate?.(optimisticState);
      }, [optimisticState, onOptimisticUpdate]);

      return (
        <div data-testid="optimistic-state">
          {JSON.stringify(optimisticState)}
          <button
            data-testid="update-optimistic"
            onClick={() => setOptimistic(optimisticState)}
          >
            Update Optimistic
          </button>
        </div>
      );
    }
  `,

  /**
   * 创建表单测试组件的代码模板（集成useActionState + useOptimistic）
   */
  createFormTestComponentTemplate: `
    function FormTestComponent() {
      const [state, formAction, isPending] = React.useActionState(
        serverAction,
        null
      );

      const [optimisticState, setOptimistic] = React.useOptimistic(
        state,
        (currentState, optimisticValue) => optimisticValue
      );

      const handleSubmit = (formData) => {
        if (enableOptimistic) {
          setOptimistic({ status: 'submitting', message: 'Submitting...' });
        }
        formAction(formData);
      };

      const currentState = enableOptimistic ? optimisticState : state;

      return (
        <form action={handleSubmit} data-testid="test-form">
          <input name="name" data-testid="name-input" />
          <input name="email" type="email" data-testid="email-input" />
          <button type="submit" disabled={isPending} data-testid="submit-button">
            {isPending ? 'Submitting...' : 'Submit'}
          </button>
          {currentState && (
            <div data-testid="form-state">
              {JSON.stringify(currentState)}
            </div>
          )}
        </form>
      );
    }
  `,
};

export {
  REACT19_TEST_CONSTANTS,
  type UseActionStateReturn,
  type UseFormStatusReturn,
  type UseOptimisticReturn,
  type ServerActionFunction,
  type ActionState,
};
