import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { Role } from "@prisma/client";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireSession(roles?: Role[]) {
  const session = await getSession();
  if (!session?.user) {
    return { error: "Unauthorized" as const, status: 401 as const, session: null };
  }
  if (roles && !roles.includes(session.user.role)) {
    return { error: "Forbidden" as const, status: 403 as const, session: null };
  }
  return { error: null, status: 200 as const, session };
}
