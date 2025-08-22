"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
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
  status: string;
  prepaid: boolean;
  codAmount: number | null;
  assignedAgentId: string | null;
  createdAt: string;
};

type Agent = {
  id: string;
  name: string | null;
  email: string;
};

export default function AdminDashboardPage() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([
        fetch("/api/admin/parcels"),
        fetch("/api/admin/agents"),
      ]);
      if (!pRes.ok || !aRes.ok) throw new Error("Failed to load data");
      const parcelsData = await pRes.json();
      const agentsData = await aRes.json();
      setParcels(parcelsData);
      setAgents(agentsData);
    } catch (err: any) {
      toast.error("Error", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async (parcelId: string, agentId: string) => {
    setAssigning(parcelId);
    try {
      const res = await fetch(`/api/admin/parcels/${parcelId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });
      if (!res.ok) throw new Error("Failed to assign agent");
      toast.success("Agent assigned successfully");
      await fetchData();
    } catch (err: any) {
      toast.error("Assignment failed", { description: err.message });
    } finally {
      setAssigning(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tracking Code</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Pickup</TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned Agent</TableHead>
              <TableHead className="text-right">Assign</TableHead>
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
                  <TableCell>{p.trackingCode}</TableCell>
                  <TableCell>{/* optional: show customer email */}</TableCell>
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
                    {p.assignedAgentId
                      ? agents.find((a) => a.id === p.assignedAgentId)?.name ||
                        "Assigned"
                      : "Not assigned"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Select
                      disabled={assigning === p.id}
                      onValueChange={(agentId) => handleAssign(p.id, agentId)}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Select agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name || agent.email}
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
                  No parcels found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
