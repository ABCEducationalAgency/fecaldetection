"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button-variants";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { signUpWithEmail, type RegisterFormState } from "./actions";

export function RegisterForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    RegisterFormState,
    FormData
  >(signUpWithEmail, null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const success = state != null && "success" in state && state.success === true;

  useEffect(() => {
    if (!success) return;

    void authClient.signOut().catch(() => {});

    redirectTimerRef.current = setTimeout(() => {
      router.push("/login");
    }, 3000);

    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, [success, router]);

  return (
    <Card className="w-full max-w-md border-border/80 shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Create your account
        </CardTitle>
        <CardDescription>
          Register to access the clinician dashboard, uploads, and staged
          prediction workflow.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {success ? (
          <div
            className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/30 px-6 py-10 text-center"
            role="status"
          >
            <CheckCircle2
              className="size-12 text-emerald-600 dark:text-emerald-500"
              aria-hidden
            />
            <p className="text-base font-medium text-foreground">
              Account created successfully
            </p>
            <p className="text-sm text-muted-foreground">
              You will be redirected to sign in in a few seconds. Use your new
              email and password to log in.
            </p>
            <p className="text-xs text-muted-foreground">
              <Link href="/login" className="font-medium underline-offset-4 hover:underline">
                Go to sign in now
              </Link>
            </p>
          </div>
        ) : (
          <form className="space-y-4" action={formAction}>
            <div className="space-y-2">
              <Label htmlFor="reg-name">Full name</Label>
              <Input
                id="reg-name"
                name="name"
                autoComplete="name"
                placeholder="Dr. Jane Smith"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Work email</Label>
              <Input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@hospital.org"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Password</Label>
              <Input
                id="reg-password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
            {state != null && "error" in state ? (
              <p className="text-sm text-destructive" role="alert">
                {state.error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Creating account…" : "Create account"}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-4 border-t border-border pt-6">
        {!success ? (
          <>
            <p className="text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <Link
                href="/login"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "inline-flex w-full items-center justify-center",
              )}
            >
              Back to home
            </Link>
          </>
        ) : null}
      </CardFooter>
    </Card>
  );
}
