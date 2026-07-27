"use client";

import {
  type FormEvent,
  type ReactNode,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  InquiryBuyerInterestContext,
  InquiryFormFields,
} from "@/components/forms/inquiry-form-fields";
import {
  type InquiryFormCopy,
  type InquiryFormSource,
} from "@/components/forms/inquiry-form-copy";
import { InquiryFormStatus } from "@/components/forms/inquiry-form-status";
import {
  createInquiryPayload,
  getInquiryMessageMaxLength,
} from "@/components/forms/inquiry-payload";
import {
  decodeInquirySubmitState,
  type InquirySubmitState,
} from "@/components/forms/inquiry-response";
import { LazyTurnstile } from "@/components/forms/lazy-turnstile";
import { trackGenerateLead } from "@/lib/marketing/lead-event";
import { appendAttributionToFormData } from "@/lib/marketing/utm";
import type { ValidatedInquiryContext } from "@/lib/lead-pipeline/inquiry-handoff";

export type { InquiryFormSource } from "@/components/forms/inquiry-form-copy";
export type { InquiryFormCopy } from "@/components/forms/inquiry-form-copy";

export interface InquiryFormProps {
  readonly source: InquiryFormSource;
  readonly copy: InquiryFormCopy;
  readonly fallback: ReactNode;
  readonly context: ValidatedInquiryContext;
}

const unsubscribeHydration = () => undefined;
const subscribeHydration = () => unsubscribeHydration;
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

const INQUIRY_ENDPOINT = "/api/inquiry";
const JSON_HEADERS = { "Content-Type": "application/json" } as const;

/**
 * 发一次询盘并解码结果。请求没能拿到可解码的响应（断网、CORS、超时）时降级成
 * 服务器错误，而不是把异常抛给调用方——买家要看到的是一句话，不是白屏。
 */
async function postInquiry(
  formData: FormData,
  turnstileToken: string,
  context: ValidatedInquiryContext,
): Promise<InquirySubmitState> {
  try {
    const response = await fetch(INQUIRY_ENDPOINT, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(
        createInquiryPayload(formData, turnstileToken, context),
      ),
    });
    return await decodeInquirySubmitState(response);
  } catch {
    return { status: "error", errorKind: "server" };
  }
}

/**
 * 成功后清空三个可见输入。`form.reset()` 只回到 defaultValue，估算器预填的那条
 * message 会原样回来，所以再显式清一遍。
 */
function clearSubmittedFields(form: HTMLFormElement | null) {
  if (!form) {
    return;
  }

  form.reset();
  for (const name of ["fullName", "email", "message"] as const) {
    const control = form.elements.namedItem(name);
    if (
      control instanceof HTMLInputElement ||
      control instanceof HTMLTextAreaElement
    ) {
      control.value = "";
    }
  }
}

function InquiryFormLive({
  source,
  copy,
  context,
}: {
  source: InquiryFormSource;
  copy: InquiryFormCopy;
  context: ValidatedInquiryContext;
}) {
  const visibleContext =
    context.kind === "catalog-context"
      ? context.displayLabel
      : context.buyerInterest;
  const { initialMessage } = context;
  const formRef = useRef<HTMLFormElement>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [displayState, setDisplayState] = useState<InquirySubmitState>({
    status: "idle",
  });
  // 提交锁用 ref 而不是上面的状态：状态更新是异步的，同一轮里连发两次提交会
  // 都读到 idle。ref 是同步的。
  const isSubmittingRef = useRef(false);
  const turnstileResetRef = useRef<(() => void) | null>(null);

  // 登记 widget 的 reset 回调，返回注销函数，remount 后不留下失效的引用。
  const registerTurnstileReset = (reset: () => void) => {
    turnstileResetRef.current = reset;
    return () => {
      if (turnstileResetRef.current === reset) {
        turnstileResetRef.current = null;
      }
    };
  };

  const clearTurnstileToken = () => setTurnstileToken("");

  // 令牌是一次性的：每次提交落定（成功或失败）都要清掉并让 widget 重新出题。
  // `turnstileResetRef.current?.()` 是那条重置链路的起点，断了买家会卡在一个
  // 永远禁用的提交按钮前。
  const clearTurnstileAfterSettlement = () => {
    setTurnstileToken("");
    turnstileResetRef.current?.();
  };

  const submit = async (formData: FormData) => {
    // 请求进行中忽略重复提交：按钮是禁用的，但回车照样能提交表单。
    if (isSubmittingRef.current) {
      return;
    }
    isSubmittingRef.current = true;
    setDisplayState({ status: "submitting" });
    appendAttributionToFormData(formData);

    try {
      const decoded = await postInquiry(formData, turnstileToken, context);
      setDisplayState(decoded);
      if (decoded.status === "success") {
        trackGenerateLead(source === "contact" ? "contact" : "rfq");
        clearSubmittedFields(formRef.current);
      }
    } finally {
      isSubmittingRef.current = false;
      clearTurnstileAfterSettlement();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 没验证过就绝不发请求。按钮此时是禁用的，但回车能绕过按钮。
    if (!turnstileToken) {
      setDisplayState({ status: "error", errorKind: "security" });
      return;
    }

    submit(new FormData(event.currentTarget)).catch(() => undefined);
  };

  const ariaLabel =
    source === "contact" ? copy.contactAriaLabel : copy.requestQuoteAriaLabel;
  const fieldDetails =
    displayState.status === "error" && displayState.errorKind === "field"
      ? displayState.fieldDetails
      : undefined;

  return (
    <section className="surface-card p-6 md:p-8">
      <form
        ref={formRef}
        aria-label={ariaLabel}
        className="space-y-6"
        data-analytics-event={
          source === "contact" ? "contact_submit" : "rfq_submit"
        }
        data-lead-path="api-inquiry"
        data-testid="inquiry-form"
        onSubmit={handleSubmit}
      >
        {visibleContext ? (
          <InquiryBuyerInterestContext
            buyerInterest={visibleContext}
            copy={copy}
          />
        ) : null}

        <InquiryFormFields
          copy={copy}
          messageMaxLength={getInquiryMessageMaxLength()}
          {...(fieldDetails ? { fieldDetails } : {})}
          {...(initialMessage ? { initialMessage } : {})}
        />

        <LazyTurnstile
          labels={copy.turnstile}
          onError={clearTurnstileToken}
          onExpire={clearTurnstileToken}
          onSuccess={setTurnstileToken}
          onReadyRef={registerTurnstileReset}
        />

        <InquiryFormStatus
          copy={copy}
          displayState={displayState}
          isSubmitting={displayState.status === "submitting"}
          turnstileReady={Boolean(turnstileToken)}
        />
      </form>
    </section>
  );
}

export function InquiryForm({
  source,
  copy,
  fallback,
  context,
}: InquiryFormProps) {
  const isHydrated = useSyncExternalStore(
    subscribeHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );

  if (!isHydrated) {
    // The static card is ~160px; the live form is ~470-700px depending on
    // width. Without reserved space the swap pushes everything below it down
    // (measured CLS 0.203 on /request-quote). The bands track the live form's
    // measured height per breakpoint; tests/e2e/layout-stability.spec.ts fails
    // if they drift far enough to move the page.
    return (
      <div
        data-inquiry-form-reserve
        className="min-h-[660px] min-[390px]:min-h-[600px] sm:min-h-[560px] md:min-h-[480px]"
      >
        {/* Without JavaScript the swap never happens, so reserving space would
            leave a permanent gap under the card. */}
        <noscript>
          <style>{"[data-inquiry-form-reserve]{min-height:0}"}</style>
        </noscript>
        {fallback}
      </div>
    );
  }

  return <InquiryFormLive copy={copy} context={context} source={source} />;
}
