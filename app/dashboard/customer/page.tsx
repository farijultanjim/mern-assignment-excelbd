import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function CustomerDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return <div className="p-6">Please log in.</div>;
  }

  // Optional role check if you store it on session.user.role
  if (session.user.role !== "CUSTOMER") {
    return <div className="p-6">Access denied.</div>;
  }

  const [total, pending, inTransit, delivered, failed] = await Promise.all([
    prisma.parcel.count({ where: { customerId: session.user.id } }),
    prisma.parcel.count({
      where: { customerId: session.user.id, status: "PENDING" },
    }),
    prisma.parcel.count({
      where: { customerId: session.user.id, status: "IN_TRANSIT" },
    }),
    prisma.parcel.count({
      where: { customerId: session.user.id, status: "DELIVERED" },
    }),
    prisma.parcel.count({
      where: { customerId: session.user.id, status: "FAILED" },
    }),
  ]);

  const recent = await prisma.parcel.findMany({
    where: { customerId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customer Dashboard</h1>
        <div className="flex gap-3">
          <Link href="/parcels/new">
            <Button>Book New Parcel</Button>
          </Link>
          <Link href="/parcels">
            <Button variant="outline">View All Parcels</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Total</div>
          <div className="text-2xl font-bold">{total}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Pending</div>
          <div className="text-2xl font-bold">{pending}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">In Transit</div>
          <div className="text-2xl font-bold">{inTransit}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Delivered</div>
          <div className="text-2xl font-bold">{delivered}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Failed</div>
          <div className="text-2xl font-bold">{failed}</div>
        </div>
      </div>

      {/* Recent */}
      <div className="rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Recent Parcels</h2>
        </div>
        <div className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tracking Code</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Booked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.length ? (
                recent.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      {p.trackingCode}
                    </TableCell>
                    <TableCell>{p.pickupAddress}</TableCell>
                    <TableCell>{p.deliveryAddress}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.status === "DELIVERED"
                            ? "default"
                            : p.status === "FAILED"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(p.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    No recent parcels
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
