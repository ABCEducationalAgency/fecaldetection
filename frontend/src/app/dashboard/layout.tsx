import { DashboardHeader } from "@/components/dashboard-header";
import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user: { name: string; email: string } | null = null;
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      redirect("/login");
    }
    user = session.user;
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <DashboardHeader user={{ name: user.name, email: user.email }} />
      {children}
    </div>
  );
}
