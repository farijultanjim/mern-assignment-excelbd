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

  if (session.user.role !== "AGENT")
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { status } = await req.json();

  if (!["PENDING", "IN_TRANSIT", "DELIVERED", "FAILED"].includes(status)) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }

  const parcel = await prisma.parcel.findUnique({
    where: { id: params.id },
  });

  if (!parcel || parcel.assignedAgentId !== session.user.id) {
    return NextResponse.json({ message: "Parcel not found" }, { status: 404 });
  }

  const updated = await prisma.parcel.update({
    where: { id: params.id },
    data: { status },
  });

  return NextResponse.json(updated);
}
