import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FORM_FIELD_REQUIRED_CLASS_NAME } from "@/components/forms/form-status-styles";

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
          <Checkbox
            id="acceptPrivacy"
            name="acceptPrivacy"
            disabled={isPending}
            required
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
          <Checkbox
            id="marketingConsent"
            name="marketingConsent"
            disabled={isPending}
          />
          <Label htmlFor="marketingConsent" className="text-sm">
            {t("marketingConsent")}
          </Label>
        </div>
      </div>
    </div>
  );
}
