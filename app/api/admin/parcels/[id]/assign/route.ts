import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { agentId } = await req.json();
  if (!agentId)
    return NextResponse.json({ message: "Agent ID required" }, { status: 400 });

  const updated = await prisma.parcel.update({
    where: { id: params.id },
    data: { assignedAgentId: agentId },
  });

  return NextResponse.json(updated);
}
