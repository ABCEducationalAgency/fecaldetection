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
  FlaskConical,
  ImagePlus,
  Layers,
  Microscope,
  ShieldCheck,
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
    <main className="flex-1 bg-muted/15">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="border-b border-border pb-8">
          <p className="text-sm font-medium text-muted-foreground">
            Clinician workspace
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
            Hello{user?.name ? `, ${user.name}` : ""}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Manage microscopy uploads, run staged fecal screening and binary
            classification, and review model-assisted findings in one place.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Microscope}
            label="Cases queued"
            value="—"
            hint="Connect inference API"
          />
          <StatCard
            icon={ShieldCheck}
            label="Reviewed today"
            value="—"
            hint="Manual confirmations"
          />
          <StatCard
            icon={Layers}
            label="Active models"
            value="Binary + multi-class"
            hint="From training pipeline"
          />
          <StatCard
            icon={FlaskConical}
            label="Last batch"
            value="—"
            hint="Laboratory sync"
          />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <Card className="border-border/80 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ImagePlus className="size-5 text-muted-foreground" />
                Upload & predict
              </CardTitle>
              <CardDescription>
                Drag-and-drop microscopy tiles will appear here once the
                inference service is connected to Neon.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="rounded-lg border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No uploads yet. Wire your API route to store slide metadata in
                  Postgres and trigger prediction jobs.
                </p>
                <Button className="mt-4" type="button" disabled>
                  Upload sample (soon)
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-lg">Workflow stages</CardTitle>
              <CardDescription>
                Same pipeline as the marketing site—now as checklist items.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm">
                {[
                  "Screen: fecal / non-fecal region proposal",
                  "Binary review: confirm positive fields",
                  "Multi-class overlay: localized subclass labels",
                  "Export: audit log + clinician sign-off",
                ].map((step, i) => (
                  <li
                    key={step}
                    className="flex gap-3 rounded-md border border-border/60 bg-background/80 px-3 py-2"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="text-foreground/90">{step}</span>
                  </li>
                ))}
              </ol>
              <Link
                href="/#workflow"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "mt-6 inline-flex w-full items-center justify-center",
                )}
              >
                View workflow details
              </Link>
            </CardContent>
          </Card>
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Signed in as{" "}
          <span className="font-mono text-foreground/80">{user?.email}</span>
        </p>
      </div>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="border-border/80">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p className={cn("mt-1 text-xs text-muted-foreground")}>{hint}</p>
      </CardContent>
    </Card>
  );
}
