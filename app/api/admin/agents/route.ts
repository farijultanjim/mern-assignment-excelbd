import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const agents = await prisma.user.findMany({
    where: { role: "AGENT" },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json(agents);
}
