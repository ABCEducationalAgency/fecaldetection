import { auth } from "@/lib/auth/server";
import type { NextRequest } from "next/server";

const runAuth = auth.middleware({ loginUrl: "/login" });

export async function proxy(request: NextRequest) {
  return runAuth(request);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
