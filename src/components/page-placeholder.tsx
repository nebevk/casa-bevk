import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/** Consistent "coming soon" scaffold for not-yet-built feature pages. */
export function PagePlaceholder({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Icon className="size-6" />
          </span>
          <div>
            <p className="font-medium">Coming soon</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              This section is on the roadmap and isn’t built yet — the
              foundation is in place for it.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
