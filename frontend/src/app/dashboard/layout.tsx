import { DashboardHeader } from "@/components/dashboard-header";
import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <DashboardHeader user={{ name: user.name, email: user.email }} />
      {children}
    </div>
  );
}
