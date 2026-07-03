import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { FORM_FIELD_REQUIRED_CLASS_NAME } from "@/components/forms/form-status-styles";

// Legacy field helper for stories/tests. The main contact form path is
// config-driven through src/components/forms/contact-form-fields.tsx.

/**
 * Checkbox fields component - React 19 Native Form Version
 * 使用原生 HTML 表单属性，配合 route handler 提交链路处理
 */
interface CheckboxFieldsProps {
  /** 国际化翻译函数 */
  t: (_key: string) => string;
  /** 表单提交状态（来自useActionState的isPending） */
  isPending: boolean;
}

export function CheckboxFields({ t, isPending }: CheckboxFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            aria-label={t("acceptPrivacy")}
            id="acceptPrivacy"
            name="acceptPrivacy"
            type="checkbox"
            disabled={isPending}
            required
            className="size-4 rounded border border-input"
          />
          <Label
            htmlFor="acceptPrivacy"
            className={cn("text-sm", FORM_FIELD_REQUIRED_CLASS_NAME)}
          >
            {t("acceptPrivacy")}
          </Label>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            aria-label={t("marketingConsent")}
            id="marketingConsent"
            name="marketingConsent"
            type="checkbox"
            disabled={isPending}
            className="size-4 rounded border border-input"
          />
          <Label htmlFor="marketingConsent" className="text-sm">
            {t("marketingConsent")}
          </Label>
        </div>
      </div>
    </div>
  );
}
