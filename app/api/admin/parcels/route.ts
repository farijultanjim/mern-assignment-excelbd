// app/api/admin/parcels/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.trackingCode = { contains: search, mode: "insensitive" };
  }
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = toDate;
    }
  }

  const [parcels, totalCount, dailyBookings, failedDeliveries, codSum] =
    await Promise.all([
      prisma.parcel.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, email: true } },
          assignedAgent: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.parcel.count({ where }),
      prisma.parcel.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.parcel.count({ where: { status: "FAILED" } }),
      prisma.parcel.aggregate({
        _sum: { codAmount: true },
        where: { prepaid: false },
      }),
    ]);

  return NextResponse.json({
    parcels,
    metrics: {
      dailyBookings,
      failedDeliveries,
      totalCOD: codSum._sum.codAmount ?? 0,
    },
    totalPages: Math.ceil(totalCount / limit),
  });
}
