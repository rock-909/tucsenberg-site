"use client";

import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  API_ERROR_NAMESPACE,
  translateApiError,
} from "@/lib/api/translate-error-code";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldHint,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadixThemePilot } from "@/components/ui/radix-theme";
import { StatusCallout } from "@/components/ui/status-callout";
import { LazyTurnstile } from "@/components/forms/lazy-turnstile";
import {
  RFQ_MATERIALS,
  useQuoteForm,
  type QuoteContext,
  type QuoteFormValues,
} from "@/app/[locale]/quote/use-quote-form";

interface QuoteFormProps {
  prefill: Partial<QuoteFormValues>;
  context: QuoteContext;
}

const SELECT_CLASS_NAMES = cn(
  "flex h-10 w-full min-w-0 rounded-xl border border-input bg-transparent px-4 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
);

function TurnstileLabels(t: (key: string) => string) {
  return {
    unavailable: t("securityVerificationUnavailable"),
    loadFailed: t("turnstileLoadFailed"),
    devBypass: t("turnstileDevBypass"),
    testMode: t("turnstileTestMode"),
  };
}

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  type?: "text" | "email";
  required?: boolean;
}

function TextField({
  id,
  label,
  value,
  onChange,
  hint,
  type = "text",
  required = false,
}: TextFieldProps) {
  const hintId = `${id}-hint`;
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type={type}
        value={value}
        required={required}
        aria-required={required}
        {...(hint ? { "aria-describedby": hintId } : {})}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <FieldHint id={hintId}>{hint}</FieldHint> : null}
    </Field>
  );
}

interface SummaryPanelProps {
  values: QuoteFormValues;
  context: QuoteContext;
  t: (key: string) => string;
  tForm: (key: string) => string;
}

function summaryRows(
  values: QuoteFormValues,
  tForm: (key: string) => string,
): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const push = (label: string, value: string) => {
    if (value.trim().length > 0) rows.push({ label, value: value.trim() });
  };
  push(tForm("partNumbers"), values.partNumbers);
  push(tForm("quantity"), values.quantity);
  push(tForm("name"), values.fullName);
  push(tForm("email"), values.email);
  push(tForm("company"), values.company);
  push(tForm("country"), values.country);
  push(tForm("shutdownDate"), values.shutdownDate);
  return rows;
}

function SummaryPanel({ values, context, t, tForm }: SummaryPanelProps) {
  const rows = summaryRows(values, tForm);
  const hasContext = Boolean(context.brand || context.model);
  const isEmpty = rows.length === 0 && !hasContext;

  return (
    <aside
      data-testid="quote-summary"
      className="rounded-[8px] border border-border bg-card p-6 md:sticky md:top-24"
    >
      <p className="font-mono text-[12px] font-semibold tracking-[1.4px] text-muted-foreground uppercase">
        {t("title")}
      </p>

      {isEmpty ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <dl className="mt-4 space-y-3">
          {hasContext ? (
            <div className="space-y-1 border-b border-border pb-3">
              {context.brand ? (
                <p className="text-sm text-foreground">{context.brand}</p>
              ) : null}
              {context.model ? (
                <p className="text-sm text-foreground">{context.model}</p>
              ) : null}
            </div>
          ) : null}
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col">
              <dt className="text-xs tracking-[0.4px] text-muted-foreground uppercase">
                {row.label}
              </dt>
              <dd className="text-sm text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-6 space-y-3 border-t border-border pt-4">
        <div>
          <p className="text-xs tracking-[0.4px] text-muted-foreground uppercase">
            {t("leadTime")}
          </p>
          <p className="text-sm text-foreground">{t("leadTimeValue")}</p>
        </div>
        <div>
          <p className="text-xs tracking-[0.4px] text-muted-foreground uppercase">
            {t("responseTime")}
          </p>
          <p className="text-sm text-foreground">{t("responseTimeValue")}</p>
        </div>
      </div>
    </aside>
  );
}

interface FileZoneProps {
  label: string;
  hint: string;
  file: File | null;
  fileError: boolean;
  accept: string;
  onSelect: (file: File | null) => void;
}

function FileZone({
  label,
  hint,
  file,
  fileError,
  accept,
  onSelect,
}: FileZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileId = useId();

  return (
    <Field>
      <FieldLabel htmlFor={fileId}>{label}</FieldLabel>
      <div
        className={cn(
          "rounded-[6px] border border-dashed border-input bg-card p-5 text-center transition-colors",
          dragOver ? "border-ring bg-accent/10" : null,
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          onSelect(event.dataTransfer.files[0] ?? null);
        }}
      >
        <input
          ref={inputRef}
          id={fileId}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(event) => onSelect(event.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          {label}
        </Button>
        {file ? (
          <p className="mt-2 text-sm text-foreground">{file.name}</p>
        ) : null}
      </div>
      <FieldHint>{hint}</FieldHint>
      {fileError ? <FieldError>{hint}</FieldError> : null}
    </Field>
  );
}

type Translator = (key: string, values?: Record<string, string>) => string;

interface QuoteFieldsProps {
  baseId: string;
  t: Translator;
  form: ReturnType<typeof useQuoteForm>;
}

function MaterialField({ baseId, t, form }: QuoteFieldsProps) {
  const materialId = `${baseId}-material`;
  return (
    <Field>
      <FieldLabel htmlFor={materialId}>{t("material")}</FieldLabel>
      <select
        id={materialId}
        className={SELECT_CLASS_NAMES}
        value={form.values.material}
        onChange={(event) => form.setField("material", event.target.value)}
      >
        <option value="">{t("materialOptions.notSure")}</option>
        {RFQ_MATERIALS.filter((material) => material !== "not-sure").map(
          (material) => (
            <option key={material} value={material}>
              {material === "epdm"
                ? t("materialOptions.epdm")
                : t("materialOptions.tpu")}
            </option>
          ),
        )}
        <option value="not-sure">{t("materialOptions.notSure")}</option>
      </select>
    </Field>
  );
}

function QuoteFields({ baseId, t, form }: QuoteFieldsProps) {
  const { values, setField } = form;
  const notesId = `${baseId}-notes`;
  return (
    <>
      <TextField
        id={`${baseId}-part`}
        label={t("partNumbers")}
        value={values.partNumbers}
        onChange={(value) => setField("partNumbers", value)}
        hint={t("partNumbersHint")}
        required
      />
      <TextField
        id={`${baseId}-qty`}
        label={t("quantity")}
        value={values.quantity}
        onChange={(value) => setField("quantity", value)}
        hint={t("quantityHint")}
      />
      <TextField
        id={`${baseId}-name`}
        label={t("name")}
        value={values.fullName}
        onChange={(value) => setField("fullName", value)}
        required
      />
      <TextField
        id={`${baseId}-email`}
        label={t("email")}
        type="email"
        value={values.email}
        onChange={(value) => setField("email", value)}
        required
      />
      <TextField
        id={`${baseId}-company`}
        label={t("company")}
        value={values.company}
        onChange={(value) => setField("company", value)}
      />
      <TextField
        id={`${baseId}-country`}
        label={t("country")}
        value={values.country}
        onChange={(value) => setField("country", value)}
      />
      <MaterialField baseId={baseId} t={t} form={form} />
      <TextField
        id={`${baseId}-shutdown`}
        label={t("shutdownDate")}
        value={values.shutdownDate}
        onChange={(value) => setField("shutdownDate", value)}
        hint={t("shutdownDateHint")}
      />
      <Field>
        <FieldLabel htmlFor={notesId}>{t("notes")}</FieldLabel>
        <Textarea
          id={notesId}
          value={values.notes}
          onChange={(event) => setField("notes", event.target.value)}
        />
      </Field>
      <FileZone
        label={t("fileUpload")}
        hint={t("fileUploadHint")}
        file={form.file}
        fileError={form.fileError}
        accept={form.acceptedUploadTypes}
        onSelect={form.selectFile}
      />
    </>
  );
}

function resolveErrorMessage(
  form: ReturnType<typeof useQuoteForm>,
  tApi: Translator,
  tErrors: Translator,
): string | undefined {
  const { submitState } = form;
  if (submitState.status !== "error") return undefined;
  if (submitState.errorCode === "FORM_NETWORK_ERROR") {
    return tErrors("networkError");
  }
  return submitState.errorCode
    ? translateApiError(tApi, submitState.errorCode)
    : tErrors("generic");
}

export function QuoteForm({ prefill, context }: QuoteFormProps) {
  const t = useTranslations("quote.form");
  const tSummary = useTranslations("quote.summary");
  const tSuccess = useTranslations("quote.success");
  const tApi = useTranslations(API_ERROR_NAMESPACE);
  const tErrors = useTranslations("errors");
  const tA11y = useTranslations("accessibility");
  const baseId = useId();
  const form = useQuoteForm(prefill);
  const { values, submitState, canSubmit } = form;

  if (submitState.status === "success") {
    return (
      <StatusCallout tone="success" data-testid="quote-success">
        <p className="font-medium">{tSuccess("title")}</p>
        <p className="mt-1 text-sm">
          {tSuccess("description", { email: values.email })}
        </p>
      </StatusCallout>
    );
  }

  const errorMessage = resolveErrorMessage(form, tApi, tErrors);

  return (
    <RadixThemePilot className="grid gap-10 md:grid-cols-[minmax(0,1fr)_320px]">
      <form
        data-testid="quote-form"
        className="space-y-6"
        onSubmit={form.handleSubmit}
        noValidate
      >
        {errorMessage ? (
          <StatusCallout tone="error" data-testid="quote-error">
            {errorMessage}
          </StatusCallout>
        ) : null}

        <QuoteFields baseId={baseId} t={t} form={form} />

        <LazyTurnstile
          action="rfq_quote"
          labels={TurnstileLabels(tA11y)}
          onSuccess={form.setTurnstileToken}
          onError={() => form.setTurnstileToken("")}
          onExpire={() => form.setTurnstileToken("")}
          onLoad={() => form.setTurnstileToken("")}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={!canSubmit}
          aria-disabled={!canSubmit}
          aria-busy={submitState.status === "submitting"}
        >
          {submitState.status === "submitting" ? t("submitting") : t("submit")}
        </Button>
      </form>

      <SummaryPanel values={values} context={context} t={tSummary} tForm={t} />
    </RadixThemePilot>
  );
}
