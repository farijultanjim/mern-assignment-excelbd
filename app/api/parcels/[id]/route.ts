import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const parcel = await prisma.parcel.findUnique({ where: { id: params.id } });
  if (!parcel || parcel.customerId !== session.user.id) {
    return NextResponse.json({ message: "Parcel not found" }, { status: 404 });
  }
  return NextResponse.json(parcel);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const existing = await prisma.parcel.findUnique({
      where: { id: params.id },
    });
    if (!existing)
      return NextResponse.json(
        { message: "Parcel not found" },
        { status: 404 }
      );
    if (existing.customerId !== session.user.id)
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    if (existing.status !== "PENDING")
      return NextResponse.json(
        { message: "Only pending parcels can be edited" },
        { status: 400 }
      );

    const body = await req.json();
    const {
      pickupAddress,
      deliveryAddress,
      parcelType,
      paymentMethod,
      codAmount,
    } = body || {};

    if (!pickupAddress || !deliveryAddress || !parcelType || !paymentMethod) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const data: any = {
      pickupAddress,
      deliveryAddress,
      parcelType,
    };

    if (paymentMethod === "PREPAID") {
      data.prepaid = true;
      data.codAmount = null;
    } else if (paymentMethod === "COD") {
      data.prepaid = false;
      data.codAmount =
        codAmount !== undefined && codAmount !== "" ? parseFloat(codAmount) : 0;
    } else {
      return NextResponse.json(
        { message: "Invalid payment method" },
        { status: 400 }
      );
    }

    const updated = await prisma.parcel.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || "Failed to update parcel" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const existing = await prisma.parcel.findUnique({
      where: { id: params.id },
    });
    if (!existing)
      return NextResponse.json(
        { message: "Parcel not found" },
        { status: 404 }
      );
    if (existing.customerId !== session.user.id)
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    if (existing.status !== "PENDING")
      return NextResponse.json(
        { message: "Only pending parcels can be deleted" },
        { status: 400 }
      );

    await prisma.parcel.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || "Failed to delete parcel" },
      { status: 500 }
    );
  }
}
