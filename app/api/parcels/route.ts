import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

// create a random tracking code
function generateTrackingCode() {
  return "TRK-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const {
      pickupAddress,
      deliveryAddress,
      parcelType,
      paymentMethod,
      codAmount,
    } = await req.json();

    if (!pickupAddress || !deliveryAddress || !parcelType || !paymentMethod) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const parcel = await prisma.parcel.create({
      data: {
        trackingCode: generateTrackingCode(),
        pickupAddress,
        deliveryAddress,
        parcelType,
        codAmount: paymentMethod === "COD" ? parseFloat(codAmount) || 0 : null,
        prepaid: paymentMethod === "PREPAID",
        customerId: session.user.id,
        status: "PENDING",
      },
    });

    return NextResponse.json(parcel, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || "Failed to create parcel" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // fetch parcels for the logged-in customer
    const parcels = await prisma.parcel.findMany({
      where: { customerId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(parcels);
  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || "Failed to fetch parcels" },
      { status: 500 }
    );
  }
}
