import { CustomCursor } from "@/components/custom-cursor";
import { HeroLeadParagraph } from "@/components/hero-lead-paragraph";
import { HeroPretextHeadline } from "@/components/hero-pretext-headline";
import { PretextCtaBlock } from "@/components/pretext-cta-block";
import { ScrollFadeIn } from "@/components/scroll-fade-in";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WordHoverBlock } from "@/components/word-hover-block";
import { WorkflowStages } from "@/components/workflow-stages";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDown } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <CustomCursor />
      <SiteHeader />

      <main className="flex-1">
        <section
          className="relative mx-auto max-w-6xl px-4 pt-16 pb-32 sm:px-6 sm:pt-24 sm:pb-40 lg:px-8 lg:pt-28 lg:pb-48"
          aria-labelledby="hero-heading"
        >
          <HeroPretextHeadline />
          <ScrollFadeIn className="mt-12 max-w-2xl" delay={0.15}>
            <HeroLeadParagraph />
          </ScrollFadeIn>
          <ScrollFadeIn
            className="mt-12 flex flex-wrap items-center gap-3"
            delay={0.25}
          >
            <Link
              href="/register"
              data-cursor-hover
              className={cn(buttonVariants({ size: "lg" }), "h-10 px-6")}
            >
              Register to predict
            </Link>
            <Link
              href="/login"
              data-cursor-hover
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-10 px-6"
              )}
            >
              Sign in
            </Link>
            <a
              href="#about"
              data-cursor-hover
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "link-animated h-10 gap-2 text-muted-foreground"
              )}
            >
              Learn more
              <ArrowDown className="size-4" />
            </a>
          </ScrollFadeIn>
        </section>

        <section
          id="about"
          className="scroll-mt-24 border-y border-border bg-muted/20 py-28 sm:py-40"
          aria-labelledby="about-heading"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <ScrollFadeIn>
              <h2
                id="about-heading"
                className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
              >
                Built for clinical workflows
              </h2>
              <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                This application is intended for trained providers and laboratory
                staff—not for public self-diagnosis. Models assist with
                triage-style signals; interpretation, documentation, and treatment
                decisions remain your responsibility. Production use should follow
                your institution&apos;s policies for HIPAA, GDPR, or equivalent
                frameworks.
              </p>
            </ScrollFadeIn>
            <ScrollFadeIn
              className="mt-20 grid gap-8 sm:grid-cols-2"
              delay={0.08}
            >
              <Card
                data-cursor-hover
                className="border-border/80 shadow-none transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <CardTitle className="text-base">What you upload</CardTitle>
                  <CardDescription>
                    Microscopic images prepared according to your lab protocol.
                    The product does not replace standard quality control or
                    staining review.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card
                data-cursor-hover
                className="border-border/80 shadow-none transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <CardTitle className="text-base">What you get</CardTitle>
                  <CardDescription>
                    A gated pipeline: facial detection unlocks binary scoring,
                    which can unlock a richer taxonomy with visual overlays for
                    transparency.
                  </CardDescription>
                </CardHeader>
              </Card>
            </ScrollFadeIn>
          </div>
        </section>

        <section
          id="workflow"
          className="scroll-mt-24 py-28 sm:py-40"
          aria-labelledby="workflow-heading"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <ScrollFadeIn>
              <div className="max-w-2xl space-y-4">
                <h2
                  id="workflow-heading"
                  className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
                >
                  Three-stage pipeline
                </h2>
                <WordHoverBlock
                  text="Each stage is designed to narrow uncertainty before showing detailed class predictions."
                  className="text-base leading-relaxed text-muted-foreground sm:text-lg"
                />
              </div>
            </ScrollFadeIn>
            <div className="mt-20 md:mt-28">
              <WorkflowStages />
            </div>
          </div>
        </section>

        <section
          id="clinicians"
          className="scroll-mt-24 border-t border-border bg-muted/15 py-28 sm:py-40"
          aria-labelledby="clinicians-heading"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <ScrollFadeIn>
              <h2
                id="clinicians-heading"
                className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
              >
                For clinicians
              </h2>
              <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground">
                Prediction features are available after you{" "}
                <Link
                  href="/register"
                  data-cursor-hover
                  className="link-animated font-medium text-foreground"
                >
                  register
                </Link>{" "}
                and{" "}
                <Link
                  href="/login"
                  data-cursor-hover
                  className="link-animated font-medium text-foreground"
                >
                  sign in
                </Link>
                . This landing experience is informational only—no uploads or
                inference run here.
              </p>
            </ScrollFadeIn>

            <ScrollFadeIn className="mt-20 space-y-8" delay={0.1}>
              <PretextCtaBlock />
              <p className="max-w-xl text-sm text-muted-foreground">
                When you are ready, create an account to unlock uploads and the
                full staged review flow.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/register"
                  data-cursor-hover
                  className={cn(buttonVariants({ size: "lg" }), "h-10 px-6")}
                >
                  Get started
                </Link>
                <Link
                  href="/login"
                  data-cursor-hover
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-10 px-6"
                  )}
                >
                  Sign in
                </Link>
              </div>
            </ScrollFadeIn>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
