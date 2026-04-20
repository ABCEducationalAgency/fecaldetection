import { DashboardAnimations } from "./dashboard-animations";
import { HelminthPredictPanel } from "@/components/dashboard/helminth-predict-panel";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSessionInServerAction } from "@/lib/auth/route-session";
import { getPipelineDashboardStats, listPipelineHistory } from "@/lib/pipeline-db";
import { createPredictionApiDelegateToken } from "@/lib/prediction-api-token";
import { getStorableUserId } from "@/lib/session-user";
import { cn } from "@/lib/utils";
import {
  Activity,
  Bug,
  ClipboardList,
  ImagePlus,
  Layers,
  Microscope,
  ScanSearch,
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
  const { data: session } = await getSessionInServerAction();
  const user = session?.user;
  const userId = user ? getStorableUserId(user) : null;

  let initialHistory: Awaited<ReturnType<typeof listPipelineHistory>> = [];
  let stats = { totalPredictions: 0, helminthPositivePhase2: 0 };
  let predictionApiDelegateToken: string | null = null;
  if (userId) {
    try {
      initialHistory = await listPipelineHistory(userId, 20);
      stats = await getPipelineDashboardStats(userId);
    } catch {
      /* Missing migration or DATABASE_URL — panel still works for upload attempt */
    }
    try {
      predictionApiDelegateToken = createPredictionApiDelegateToken(userId);
    } catch {
      predictionApiDelegateToken = null;
    }
  }

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
              Stage 1 fecal detection now gates Stage 2 helminth screening:
              upload once, watch live progress, and review complete pipeline
              history in your workspace.
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={ClipboardList}
              label="Total predictions"
              value={String(stats.totalPredictions)}
              hint="Finished Stage 1→2 pipeline runs"
              accent="text-chart-5 dark:text-chart-1"
              accentBg="bg-chart-1 dark:bg-chart-5/25"
            />
            <StatCard
              icon={Microscope}
              label="Fecal detected"
              value="Live"
              hint="Stage 1 majority-vote gate enabled"
              accent="text-primary dark:text-primary-foreground"
              accentBg="bg-primary/12 dark:bg-primary/30"
            />
            <StatCard
              icon={Layers}
              label="Helminths found"
              value={String(stats.helminthPositivePhase2)}
              hint="Phase 2: any model predicted class 1"
              accent="text-chart-4 dark:text-chart-2"
              accentBg="bg-chart-2/40 dark:bg-chart-4/35"
            />
            <StatCard
              icon={Bug}
              label="Species identified"
              value="—"
              hint="Phase 3 not connected yet"
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
                    Two-stage pipeline with conditional Stage 2 execution, live
                    WebSocket updates, and saved history (no images stored).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <HelminthPredictPanel
                    initialHistory={initialHistory}
                    predictionApiDelegateToken={predictionApiDelegateToken}
                  />
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
