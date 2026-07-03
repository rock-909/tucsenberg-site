import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Legacy field helper for stories/tests. The main contact form path is
// config-driven through src/components/forms/contact-form-fields.tsx.

/**
 * Additional fields component - React 19 Native Form Version
 * 使用原生 HTML 表单属性，配合 route handler 提交链路处理
 */
interface AdditionalFieldsProps {
  /** 国际化翻译函数 */
  t: (_key: string) => string;
  /** 表单提交状态（来自useActionState的isPending） */
  isPending: boolean;
}

export function AdditionalFields({ t, isPending }: AdditionalFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">{t("phone")}</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder={t("phonePlaceholder")}
            disabled={isPending}
            aria-describedby="phone-error"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">{t("subject")}</Label>
          <Input
            id="subject"
            name="subject"
            type="text"
            placeholder={t("subjectPlaceholder")}
            disabled={isPending}
            aria-describedby="subject-error"
          />
        </div>
      </div>
    </>
  );
}
