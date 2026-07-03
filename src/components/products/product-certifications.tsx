import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface ProductCertificationsProps {
  /** List of certification names */
  certifications: string[];
  /** Section title */
  title?: string;
  /** Custom class name */
  className?: string;
}

/**
 * Product certifications display component.
 *
 * Renders a list of certification badges (ISO, CE, etc.).
 * Important for B2B buyers to verify compliance.
 */
export function ProductCertifications({
  certifications,
  title = "Certifications",
  className,
}: ProductCertificationsProps) {
  if (certifications.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {title !== "" && (
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      )}
      <div className="flex flex-wrap gap-2">
        {certifications.map((cert) => (
          <Badge key={cert} variant="outline" className="text-sm">
            {cert}
          </Badge>
        ))}
      </div>
    </div>
  );
}
