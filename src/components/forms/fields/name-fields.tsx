import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FORM_FIELD_REQUIRED_CLASS_NAME } from "@/components/forms/form-status-styles";

/**
 * Name fields component - React 19 Native Form Version
 * 使用原生 HTML 表单属性，配合 route handler 提交链路处理
 */
interface NameFieldsProps {
  /** 国际化翻译函数 */
  t: (_key: string) => string;
  /** 表单提交状态（来自useActionState的isPending） */
  isPending: boolean;
}

export function NameFields({ t, isPending }: NameFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="fullName" className={FORM_FIELD_REQUIRED_CLASS_NAME}>
          {t("fullName")}
        </Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          placeholder={t("fullNamePlaceholder")}
          disabled={isPending}
          required
          autoComplete="name"
          autoCapitalize="words"
          aria-describedby="fullName-error"
        />
      </div>
    </div>
  );
}
