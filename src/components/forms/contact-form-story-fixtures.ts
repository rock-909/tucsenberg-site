import { API_ERROR_CODES } from "@/constants/api-error-codes";
import type { ServerActionResult } from "@/lib/actions/server-action-utils";
import type { ContactFormResult } from "@/components/forms/use-contact-form";

const STORY_TIMESTAMP = "2026-05-06T00:00:00.000Z";

const defaultFormMessages = {
  acceptPrivacy: "I accept the privacy policy",
  company: "Company",
  companyPlaceholder: "Your company name",
  email: "Email",
  emailPlaceholder: "procurement@example.com",
  error: "Please check the highlighted fields.",
  fullName: "Full name",
  fullNamePlaceholder: "Jane Smith",
  marketingConsent: "Send me occasional product and resource updates",
  message: "Message",
  messagePlaceholder: "Tell us what you need, target market, and timeline.",
  optional: "optional",
  phone: "Phone",
  phonePlaceholder: "+1 555 0100",
  rateLimitMessage: "Please wait before submitting again.",
  networkError: "We could not submit the form. Please try again.",
  subject: "Subject",
  subjectPlaceholder: "Project inquiry",
  submit: "Send inquiry",
  submitError: "The form could not be submitted. Please try again.",
  submitSuccess: "Thanks. We received your message.",
  submitting: "Sending...",
} as const;

const longEnglishFormMessages = {
  ...defaultFormMessages,
  companyPlaceholder: "Example Procurement and Operations Group",
  messagePlaceholder:
    "Describe the project scope, required proof, delivery window, content that needs replacement, and any constraints the team should understand before replying.",
  subjectPlaceholder:
    "Long starter website inquiry with replacement, proof, and launch questions",
} as const;

const longChineseFormMessages = {
  acceptPrivacy: "我同意隐私政策",
  company: "公司名称",
  companyPlaceholder: "示例采购与运营团队",
  email: "邮箱",
  emailPlaceholder: "procurement@example.com",
  error: "请检查表单里的提示。",
  fullName: "姓名",
  fullNamePlaceholder: "张三",
  marketingConsent: "我愿意接收后续产品和资源更新",
  message: "询盘说明",
  messagePlaceholder:
    "请说明项目范围、需要替换的内容、证明材料、交付时间和团队回复前需要了解的限制。",
  optional: "可选",
  phone: "电话",
  phonePlaceholder: "+86 138 0000 0000",
  rateLimitMessage: "请稍后再提交。",
  networkError: "表单暂时无法提交，请稍后重试。",
  subject: "主题",
  subjectPlaceholder:
    "关于展示型网站模板替换、证明材料和上线检查的较长询盘主题",
  submit: "发送询盘",
  submitError: "表单暂时无法提交，请稍后重试。",
  submitSuccess: "已收到你的信息。",
  submitting: "发送中...",
} as const;

const apiMessages = {
  CONTACT_VALIDATION_FAILED: "Please check the form and try again.",
  CONTACT_PROCESSING_ERROR:
    "The contact request could not be processed. Please try again.",
  RATE_LIMIT_EXCEEDED: "Too many attempts. Please wait before trying again.",
  TURNSTILE_MISSING_TOKEN: "Security verification is required.",
} as const;

function translateFrom(
  messages: Record<string, string>,
): (key: string) => string {
  const messageMap = new Map(Object.entries(messages));
  return (key) => messageMap.get(key) ?? key;
}

export const contactFormStoryTranslate = translateFrom(defaultFormMessages);
export const contactFormLongEnglishTranslate = translateFrom(
  longEnglishFormMessages,
);
export const contactFormLongChineseTranslate = translateFrom(
  longChineseFormMessages,
);
export const contactFormApiStoryTranslate = translateFrom(apiMessages);

export const contactFormTurnstileStoryLabels = {
  unavailable: "Security verification is temporarily unavailable.",
  loadFailed: "Security verification failed to load.",
  devBypass: "Dev mode: Turnstile verification bypassed",
  testMode: "Bot protection disabled in test mode",
} as const;

export const contactFormValidationErrorState = {
  success: false,
  error: "Validation failed",
  errorCode: API_ERROR_CODES.CONTACT_VALIDATION_FAILED,
  details: ["errors.fullName", "errors.email", "Message is too short."],
  timestamp: STORY_TIMESTAMP,
} satisfies ServerActionResult<ContactFormResult>;

export const contactFormProcessingErrorState = {
  success: false,
  errorCode: API_ERROR_CODES.CONTACT_PROCESSING_ERROR,
  timestamp: STORY_TIMESTAMP,
} satisfies ServerActionResult<ContactFormResult>;

export const contactFormNetworkErrorState = {
  success: false,
  errorCode: "FORM_NETWORK_ERROR",
  timestamp: STORY_TIMESTAMP,
} satisfies ServerActionResult<ContactFormResult>;

export const contactFormSuccessState = {
  success: true,
  data: {
    referenceId: "story-ref-1000",
  },
  timestamp: STORY_TIMESTAMP,
} satisfies ServerActionResult<ContactFormResult>;
