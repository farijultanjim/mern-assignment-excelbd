import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface ParcelPageProps {
  params: { id: string };
}

export default async function ParcelPage({ params }: ParcelPageProps) {
  const parcel = await prisma.parcel.findUnique({
    where: { id: params.id },
  });

  if (!parcel) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Parcel Details</h1>
      <div className="space-y-4">
        <p>
          <strong>Tracking Code:</strong> {parcel.trackingCode}
        </p>
        <p>
          <strong>Pickup Address:</strong> {parcel.pickupAddress}
        </p>
        <p>
          <strong>Delivery Address:</strong> {parcel.deliveryAddress}
        </p>
        <p>
          <strong>Parcel Type:</strong> {parcel.parcelType}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <Badge
            variant={
              parcel.status === "DELIVERED"
                ? "default"
                : parcel.status === "FAILED"
                ? "destructive"
                : "secondary"
            }
          >
            {parcel.status}
          </Badge>
        </p>
        <p>
          <strong>Payment:</strong>{" "}
          {parcel.prepaid
            ? "Prepaid"
            : parcel.codAmount
            ? `COD: $${parcel.codAmount}`
            : "-"}
        </p>
        <p>
          <strong>Created At:</strong>{" "}
          {new Date(parcel.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
