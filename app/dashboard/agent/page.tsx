"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type Parcel = {
  id: string;
  trackingCode: string;
  pickupAddress: string;
  deliveryAddress: string;
  parcelType: string;
  status: "PENDING" | "IN_TRANSIT" | "DELIVERED" | "FAILED";
  prepaid: boolean;
  codAmount: number | null;
  createdAt: string;
};

const statusOptions = ["PENDING", "IN_TRANSIT", "DELIVERED", "FAILED"];

export default function AgentDashboardPage() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchParcels = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/parcels");
      if (!res.ok) throw new Error("Failed to load parcels");
      const data = await res.json();
      setParcels(data);
    } catch (err: any) {
      toast.error("Error", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParcels();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/agent/parcels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      toast.success("Status updated", {
        description: `Parcel is now ${status}`,
      });
      await fetchParcels();
    } catch (err: any) {
      toast.error("Update failed", { description: err.message });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Assigned Parcels</h1>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tracking Code</TableHead>
              <TableHead>Pickup</TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Update</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading…
                </TableCell>
              </TableRow>
            ) : parcels.length > 0 ? (
              parcels.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {p.trackingCode}
                  </TableCell>
                  <TableCell>{p.pickupAddress}</TableCell>
                  <TableCell>{p.deliveryAddress}</TableCell>
                  <TableCell>{p.parcelType}</TableCell>
                  <TableCell>
                    {p.prepaid
                      ? "Prepaid"
                      : p.codAmount
                      ? `COD: $${p.codAmount}`
                      : "-"}
                  </TableCell>
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
                  <TableCell className="text-right">
                    <Select
                      disabled={updating === p.id}
                      onValueChange={(status) =>
                        handleStatusChange(p.id, status)
                      }
                      defaultValue={p.status}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Change status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No assigned parcels
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
