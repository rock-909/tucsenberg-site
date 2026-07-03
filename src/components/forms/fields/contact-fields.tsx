import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FORM_FIELD_REQUIRED_CLASS_NAME } from "@/components/forms/form-status-styles";

// Legacy field helper for stories/tests. The main contact form path is
// config-driven through src/components/forms/contact-form-fields.tsx.

/**
 * Contact fields component - React 19 Native Form Version
 * 使用原生 HTML 表单属性，配合 route handler 提交链路处理
 */
interface ContactFieldsProps {
  /** 国际化翻译函数 */
  t: (_key: string) => string;
  /** 表单提交状态（来自useActionState的isPending） */
  isPending: boolean;
}

export function ContactFields({ t, isPending }: ContactFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="email" className={FORM_FIELD_REQUIRED_CLASS_NAME}>
          {t("email")}
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={t("emailPlaceholder")}
          disabled={isPending}
          required
          aria-describedby="email-error"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">{t("company")}</Label>
        <Input
          id="company"
          name="company"
          type="text"
          placeholder={t("companyPlaceholder")}
          disabled={isPending}
          aria-describedby="company-error"
        />
      </div>
    </div>
  );
}
