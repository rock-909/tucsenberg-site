import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FORM_FIELD_REQUIRED_CLASS_NAME } from "@/components/forms/form-status-styles";

interface MessageFieldProps {
  t: (_key: string) => string;
  isPending: boolean;
}

export function MessageField({ t, isPending }: MessageFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="message" className={FORM_FIELD_REQUIRED_CLASS_NAME}>
        {t("message")}
      </Label>
      <Textarea
        id="message"
        name="message"
        placeholder={t("messagePlaceholder")}
        disabled={isPending}
        required
        rows={4}
        aria-describedby="message-error"
      />
    </div>
  );
}
