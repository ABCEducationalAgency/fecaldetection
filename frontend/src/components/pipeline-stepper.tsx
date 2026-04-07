"use client";

import { cn } from "@/lib/utils";
import { Check, Layers, Microscope, ScanSearch } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type StepStatus = "idle" | "active" | "complete" | "skipped";

type PipelineStepperProps = {
  steps?: { status: StepStatus }[];
  className?: string;
};

const STEPS: { label: string; subtitle: string; icon: LucideIcon }[] = [
  { label: "Fecal detection", subtitle: "7 models voting", icon: Microscope },
  { label: "Helminth screening", subtitle: "Binary classifier", icon: Layers },
  { label: "Species ID", subtitle: "11 classes", icon: ScanSearch },
];

export function PipelineStepper({ steps, className }: PipelineStepperProps) {
  const statuses: StepStatus[] = steps
    ? steps.map((s) => s.status)
    : ["idle", "idle", "idle"];

  return (
    <div className={cn("flex items-start gap-0", className)}>
      {STEPS.map((step, i) => {
        const status = statuses[i] ?? "idle";
        const Icon = step.icon;
        const isLast = i === STEPS.length - 1;

        return (
          <div key={step.label} className="flex min-w-0 flex-1 items-start">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  status === "complete" &&
                    "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500",
                  status === "active" &&
                    "border-primary bg-primary text-primary-foreground",
                  status === "idle" &&
                    "border-border bg-muted text-muted-foreground",
                  status === "skipped" &&
                    "border-border bg-muted/50 text-muted-foreground/50",
                )}
              >
                {status === "complete" ? (
                  <Check className="size-4" aria-hidden />
                ) : (
                  <Icon className="size-4" aria-hidden />
                )}
              </div>
              <div className="text-center">
                <p
                  className={cn(
                    "text-xs font-medium leading-tight",
                    status === "skipped"
                      ? "text-muted-foreground/50"
                      : "text-foreground",
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {step.subtitle}
                </p>
              </div>
            </div>
            {!isLast && (
              <div className="mt-[18px] h-0.5 min-w-4 flex-1 mx-1.5">
                <div
                  className={cn(
                    "h-full rounded-full transition-colors",
                    statuses[i + 1] === "complete" || status === "complete"
                      ? "bg-emerald-600 dark:bg-emerald-500"
                      : status === "active"
                        ? "bg-primary/40"
                        : "bg-border",
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
