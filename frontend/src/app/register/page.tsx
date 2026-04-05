import { SiteHeader } from "@/components/site-header";
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
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a Facial Classification account for microscopy predictions.",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
        <Card className="w-full max-w-md border-border/80 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Create your account
            </CardTitle>
            <CardDescription>
              Registration will unlock uploads and the staged prediction workflow.
              Backend integration is still pending—fields are disabled for now.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" aria-label="Register (preview)">
              <div className="space-y-2">
                <Label htmlFor="reg-name">Full name</Label>
                <Input
                  id="reg-name"
                  name="name"
                  autoComplete="name"
                  placeholder="Dr. Jane Smith"
                  disabled
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
                  disabled
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
                  disabled
                />
              </div>
              <Button type="button" className="w-full" disabled>
                Create account (coming soon)
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t border-border pt-6">
            <p className="text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <Link
                href="/login"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
            <Button variant="ghost" className="w-full" render={<Link href="/" />}>
              Back to home
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
