import { DashboardSignOut } from "@/components/dashboard-sign-out";
import { cn } from "@/lib/utils";
import { Microscope } from "lucide-react";
import Link from "next/link";

type DashboardHeaderProps = {
  user: {
    name: string;
    email: string;
  };
};

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border",
        "bg-background/90 backdrop-blur-md supports-backdrop-filter:bg-background/75",
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-2 text-sm font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80"
          >
            <Microscope className="size-5 shrink-0 text-primary" aria-hidden />
            <span className="truncate">Facial Classification</span>
          </Link>
          <span
            className="hidden shrink-0 rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:inline"
            aria-hidden
          >
            Dashboard
          </span>
        </div>

        <nav
          className="flex shrink-0 items-center gap-2 sm:gap-4"
          aria-label="Dashboard"
        >
          <Link
            href="/"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Marketing site
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground sm:hidden"
          >
            Home
          </Link>
          <span
            className="hidden max-w-[min(200px,28vw)] truncate text-sm text-muted-foreground md:inline"
            title={user.email}
          >
            {user.name || user.email}
          </span>
          <DashboardSignOut />
        </nav>
      </div>
    </header>
  );
}
