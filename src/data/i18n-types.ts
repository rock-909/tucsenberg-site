import { z } from "zod";

export const i18nTextSchema = z.object({
  en: z.string().min(1),
  es: z.string().min(1),
  zh: z.string().min(1),
});

export type I18nText = z.infer<typeof i18nTextSchema>;
