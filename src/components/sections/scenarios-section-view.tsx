import {
  StaticArrowUpRightIcon,
  StaticCableIcon,
  StaticShieldCheckIcon,
  StaticWorkspaceIcon,
  type StaticIconComponent,
} from "@/components/icons/static-icons";
import { HomepageSectionShell } from "@/components/sections/homepage-section-shell";

export interface ScenarioSectionItem {
  key: string;
  iconKey: ScenarioSectionIconKey;
  eyebrow: string;
  badge: string;
  title: string;
  description: string;
  proofLabel: string;
  quote: string;
}

export type ScenarioSectionIconKey =
  | "product"
  | "service"
  | "custom"
  | "default";

export interface ScenariosSectionViewProps {
  title: string;
  subtitle: string;
  items: ScenarioSectionItem[];
}

const SCENARIO_ICON_MAP = {
  product: StaticCableIcon,
  service: StaticWorkspaceIcon,
  custom: StaticShieldCheckIcon,
  default: StaticShieldCheckIcon,
} as const satisfies Record<ScenarioSectionIconKey, StaticIconComponent>;

function ScenarioCard({ item }: { item: ScenarioSectionItem }) {
  const Icon = SCENARIO_ICON_MAP[item.iconKey] ?? StaticShieldCheckIcon;

  return (
    <div className="group surface-card overflow-hidden transition-transform duration-150 hover:-translate-y-0.5">
      <div className="showcase-scenario-surface relative h-40 overflow-hidden">
        <div className="showcase-scenario-grid absolute inset-0 opacity-30" />
        <div className="relative flex h-full flex-col justify-between p-5 transition-transform duration-300 group-hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/12 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-primary-foreground/80">
              <Icon size={14} />
              {item.eyebrow}
            </div>
            <div className="rounded-full border border-primary-foreground/20 px-2.5 py-1 text-xs text-primary-foreground/75">
              {item.badge}
            </div>
          </div>
          <div>
            <p className="max-w-[18rem] text-lg font-semibold leading-snug">
              {item.title}
            </p>
            <div className="mt-3 inline-flex items-center gap-1 text-xs text-primary-foreground/75">
              {item.proofLabel}
              <StaticArrowUpRightIcon size={14} />
            </div>
          </div>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-[18px] font-bold leading-snug">{item.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>

        <div className="mt-4 border-t border-border pt-3">
          <p className="text-[13px] italic text-muted-foreground">
            {item.quote}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ScenariosSectionView({
  title,
  subtitle,
  items,
}: ScenariosSectionViewProps) {
  return (
    <HomepageSectionShell
      sectionClassName="py-14 md:py-[72px]"
      title={title}
      subtitle={subtitle}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.map((item) => (
          <ScenarioCard key={item.key} item={item} />
        ))}
      </div>
    </HomepageSectionShell>
  );
}
