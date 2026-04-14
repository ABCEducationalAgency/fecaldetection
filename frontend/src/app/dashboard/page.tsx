import { DashboardAnimations } from "./dashboard-animations";
import { PipelineStepper } from "@/components/pipeline-stepper";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth/server";
import { cn } from "@/lib/utils";
import {
  Activity,
  Bug,
  ClipboardList,
  ImagePlus,
  Layers,
  Microscope,
  ScanSearch,
  Upload,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentType } from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Clinician workspace for fecal microscopy classification.",
};

export default async function DashboardPage() {
  const { data: session } = await auth.getSession();
  const user = session?.user;

  return (
    <main className="flex-1 bg-muted/10">
      <DashboardAnimations>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          {/* Page header */}
          <div className="pb-8" data-animate="fade-up" data-delay="0">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground [&_svg]:text-primary">
                  <Activity className="size-3.5" aria-hidden />
                  Clinician workspace
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Welcome back{user?.name ? `, ${user.name}` : ""}
                </h1>
              </div>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Upload microscopy slides, run the 3-phase fecal screening pipeline,
              and review model-assisted findings — all in one place.
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={ClipboardList}
              label="Total predictions"
              value="0"
              hint="All-time scans"
              accent="text-chart-5 dark:text-chart-1"
              accentBg="bg-chart-1 dark:bg-chart-5/25"
            />
            <StatCard
              icon={Microscope}
              label="Fecal detected"
              value="0"
              hint="Phase 1 positives"
              accent="text-primary dark:text-primary-foreground"
              accentBg="bg-primary/12 dark:bg-primary/30"
            />
            <StatCard
              icon={Layers}
              label="Helminths found"
              value="0"
              hint="Phase 2 positives"
              accent="text-chart-4 dark:text-chart-2"
              accentBg="bg-chart-2/40 dark:bg-chart-4/35"
            />
            <StatCard
              icon={Bug}
              label="Species identified"
              value="0"
              hint="Unique Phase 3 species"
              accent="text-chart-3 dark:text-chart-1"
              accentBg="bg-chart-2/25 dark:bg-chart-3/30"
            />
          </div>

          {/* Main content grid */}
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {/* Upload card + pipeline stepper */}
            <div className="space-y-6 lg:col-span-2">
              <Card className="border-border/80 shadow-sm transition-shadow duration-300 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ImagePlus className="size-5 text-primary" />
                    Upload &amp; predict
                  </CardTitle>
                  <CardDescription>
                    Drag-and-drop microscopy tiles to start the staged pipeline.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="group flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-border bg-gradient-to-b from-muted/10 to-muted/30 px-6 py-14 text-center transition-all duration-300 hover:border-primary/40 hover:from-primary/[0.02] hover:to-primary/[0.06]">
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                      <Upload className="size-8" aria-hidden />
                    </div>
                    <div>
                      <p className="text-base font-medium text-foreground">
                        Drop slide images here
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        PNG, JPG, or TIFF up to 50 MB each
                      </p>
                    </div>
                    <Button className="mt-2 h-10" type="button" disabled>
                      Browse files (coming soon)
                    </Button>
                  </div>

                  {/* Pipeline progress stepper */}
                  <div className="rounded-xl border border-border/60 bg-gradient-to-b from-background to-muted/20 p-5">
                    <p className="mb-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      Pipeline progress
                    </p>
                    <PipelineStepper />
                  </div>
                </CardContent>
              </Card>

              {/* Prediction history */}
              <Card className="border-border/80 shadow-sm transition-shadow duration-300 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ClipboardList className="size-5 text-muted-foreground" />
                    Prediction history
                  </CardTitle>
                  <CardDescription>
                    Results from past slides appear here.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-gradient-to-b from-muted/5 to-muted/15 px-6 py-14 text-center">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/40">
                      <ScanSearch
                        className="size-7 text-muted-foreground/40"
                        aria-hidden
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        No predictions yet
                      </p>
                      <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground/70">
                        Upload a slide to get started. Each result will show the
                        slide thumbnail, pipeline outcome, and any detected
                        species.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Workflow sidebar */}
            <Card className="border-border/80 shadow-sm transition-shadow duration-300 hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Pipeline stages</CardTitle>
                <CardDescription>
                  Your 3-phase prediction pipeline at a glance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm">
                  {[
                    {
                      label: "Fecal detection",
                      detail: "7-model ensemble vote",
                      icon: Microscope,
                      accent:
                        "bg-chart-1 text-chart-5 dark:bg-chart-5/35 dark:text-chart-1",
                    },
                    {
                      label: "Helminth screening",
                      detail: "Binary classifier",
                      icon: Layers,
                      accent:
                        "bg-chart-2/45 text-chart-5 dark:bg-chart-4/40 dark:text-chart-2",
                    },
                    {
                      label: "Species identification",
                      detail: "11-class detection",
                      icon: ScanSearch,
                      accent:
                        "bg-primary/15 text-primary dark:bg-primary/28 dark:text-primary-foreground",
                    },
                    {
                      label: "Review",
                      detail: "Annotated image + bounding boxes",
                      icon: ClipboardList,
                      accent:
                        "bg-muted text-primary dark:bg-muted dark:text-primary-foreground",
                    },
                  ].map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <li
                        key={step.label}
                        className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/80 px-3.5 py-3 transition-all duration-200 hover:bg-muted/30 hover:shadow-sm"
                      >
                        <span
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                            step.accent
                          )}
                        >
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 text-sm font-medium text-foreground/90">
                            <Icon
                              className="size-3.5 shrink-0 text-muted-foreground"
                              aria-hidden
                            />
                            {step.label}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {step.detail}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
                <Link
                  href="/#workflow"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "mt-6 inline-flex w-full items-center justify-center"
                  )}
                >
                  View pipeline details
                </Link>
              </CardContent>
            </Card>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Signed in as{" "}
            <span className="font-mono text-foreground/80">{user?.email}</span>
          </p>
        </div>
      </DashboardAnimations>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  accentBg,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  accent?: string;
  accentBg?: string;
}) {
  return (
    <Card className="border-border/80 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            accentBg ?? "bg-muted"
          )}
        >
          <Icon className={cn("size-4", accent ?? "text-muted-foreground")} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
