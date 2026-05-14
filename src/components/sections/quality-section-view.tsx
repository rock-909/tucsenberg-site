import {
  type StaticIconComponent,
  StaticBuildingIcon,
  StaticCheckIcon,
  StaticClockIcon,
  StaticFileTextIcon,
  StaticLayoutGridIcon,
  StaticPackageIcon,
  StaticUserIcon,
} from "@/components/icons/static-icons";
import { HomepageSectionShell } from "@/components/sections/homepage-section-shell";

interface QualityCommitmentItem {
  key: string;
  title: string;
  description: string;
}

export type QualityStandardStatus = "certified" | "applying" | "compliant";

interface QualityStandardItem {
  key: string;
  label: string;
  status: QualityStandardStatus;
}

export interface QualityProofItem {
  key: string;
  value: string;
  label: string;
}

export interface QualitySectionContent {
  title: string;
  subtitle: string;
  commitments: QualityCommitmentItem[];
  certificationsTitle: string;
  certificationName: string;
  certificationNumber: string;
  certifiedLabel: string;
  applyingLabel: string;
  compliantLabel: string;
  standards: QualityStandardItem[];
  proofTitle: string;
  proofNote: string;
  proofItems: QualityProofItem[];
}

export interface QualitySectionViewProps {
  content: QualitySectionContent;
}

const COMMITMENT_ICONS: Partial<Record<string, StaticIconComponent>> = {
  commitment1: StaticClockIcon,
  commitment2: StaticFileTextIcon,
  commitment3: StaticPackageIcon,
  commitment4: StaticUserIcon,
  commitment5: StaticLayoutGridIcon,
  response: StaticClockIcon,
  proof: StaticFileTextIcon,
  reuse: StaticPackageIcon,
  contact: StaticUserIcon,
};

const STANDARD_STATUS_BADGE_CLASS_NAMES = {
  certified:
    "rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary",
  applying:
    "rounded bg-[var(--warning-muted)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--warning-foreground)]",
  compliant: "rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground",
} satisfies Record<QualityStandardStatus, string>;

function CommitmentList({ items }: { items: QualityCommitmentItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-2">
      {items.map((item) => {
        const Icon = COMMITMENT_ICONS[item.key] ?? StaticLayoutGridIcon;
        return (
          <div
            key={item.key}
            className="flex items-start gap-4 bg-card px-6 py-5 transition-colors duration-150 hover:bg-[var(--primary-50)]"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-light)] text-primary">
              <Icon size={20} />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold">{item.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CertificationBlock({ content }: { content: QualitySectionContent }) {
  return (
    <div className="mt-8">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {content.certificationsTitle}
      </h3>
      <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <StaticCheckIcon size={16} className="text-primary" />
        </div>
        <div>
          <span className="font-semibold">{content.certificationName}</span>
          <span className="ml-2 text-xs text-muted-foreground">
            <span aria-hidden>#</span>
            {content.certificationNumber}
          </span>
        </div>
        <span className="ml-auto rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {content.certifiedLabel}
        </span>
      </div>
    </div>
  );
}

function StandardsCompliance({ content }: { content: QualitySectionContent }) {
  const statusLabels = {
    certified: content.certifiedLabel,
    applying: content.applyingLabel,
    compliant: content.compliantLabel,
  } satisfies Record<QualityStandardStatus, string>;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      {content.standards.map((standard) => (
        <div
          key={standard.key}
          className="flex items-center gap-1.5 rounded-md bg-muted/50 px-3 py-1.5 text-[13px] font-medium"
        >
          <span>{standard.label}</span>
          <span className={STANDARD_STATUS_BADGE_CLASS_NAMES[standard.status]}>
            {statusLabels[standard.status]}
          </span>
        </div>
      ))}
    </div>
  );
}

function ProofStrip({ items }: { items: QualityProofItem[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 text-center md:min-w-[320px]">
      {items.map((item) => (
        <div key={item.key} className="rounded-md bg-muted/60 px-3 py-2">
          <div className="text-sm font-semibold text-foreground">
            {item.value}
          </div>
          <div className="text-[11px] text-muted-foreground">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function ProofBlock({ content }: { content: QualitySectionContent }) {
  return (
    <div className="mt-8 rounded-lg border bg-card px-5 py-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <StaticBuildingIcon size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {content.proofTitle}
            </p>
            <p className="text-xs text-muted-foreground">{content.proofNote}</p>
          </div>
        </div>

        <ProofStrip items={content.proofItems} />
      </div>
    </div>
  );
}

export function QualitySectionView({ content }: QualitySectionViewProps) {
  return (
    <HomepageSectionShell
      sectionClassName="py-14 md:py-[72px]"
      title={content.title}
      subtitle={content.subtitle}
    >
      <CommitmentList items={content.commitments} />
      <CertificationBlock content={content} />
      <StandardsCompliance content={content} />
      <ProofBlock content={content} />
    </HomepageSectionShell>
  );
}
