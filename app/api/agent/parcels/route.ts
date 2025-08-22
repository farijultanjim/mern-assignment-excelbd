// app/api/agent/parcels/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "AGENT")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const parcels = await prisma.parcel.findMany({
    where: { assignedAgentId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(parcels);
}
