"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { SearchBox } from "@/components/search-box";
import { DateFilter } from "@/components/date-filter";
import { Pagination } from "@/components/pagination";
import { exportToCsv } from "@/lib/exportToCsv";
import { FileDownIcon } from "lucide-react";

type Parcel = {
  id: string;
  trackingCode: string;
  pickupAddress: string;
  deliveryAddress: string;
  parcelType: string;
  status: "PENDING" | "IN_TRANSIT" | "DELIVERED" | "FAILED";
  prepaid: boolean;
  codAmount: number | null;
  assignedAgentId: string | null;
  createdAt: string;
  customer?: { id: string; name: string | null; email: string };
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

  // filters
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [page, setPage] = useState(1);
  const pageSize = 20;

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

      setParcels(
        Array.isArray(parcelsData) ? parcelsData : parcelsData.parcels || []
      );
      setAgents(
        Array.isArray(agentsData) ? agentsData : agentsData.agents || []
      );
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

  // filter + paginate
  const filtered = useMemo(() => {
    return parcels.filter((p) => {
      const matchesSearch = p.trackingCode
        .toLowerCase()
        .includes(search.toLowerCase());
      const created = new Date(p.createdAt);
      const afterStart =
        !dateRange.startDate || created >= new Date(dateRange.startDate);
      const beforeEnd =
        !dateRange.endDate || created <= new Date(dateRange.endDate);
      return matchesSearch && afterStart && beforeEnd;
    });
  }, [parcels, search, dateRange]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // metrics
  const metrics = useMemo(() => {
    const dailyBookings = parcels.filter((p) => {
      const today = new Date();
      const created = new Date(p.createdAt);
      return (
        created.getDate() === today.getDate() &&
        created.getMonth() === today.getMonth() &&
        created.getFullYear() === today.getFullYear()
      );
    }).length;

    const failedDeliveries = parcels.filter(
      (p) => p.status === "FAILED"
    ).length;

    const totalCOD = parcels
      .filter((p) => !p.prepaid)
      .reduce((sum, p) => sum + (p.codAmount || 0), 0);

    return { dailyBookings, failedDeliveries, totalCOD };
  }, [parcels]);

  const handleExport = () => {
    exportToCsv(
      "parcels-report.csv",
      parcels.map((p) => ({
        TrackingCode: p.trackingCode,
        Customer: p.customer?.name || p.customer?.email || "N/A",
        Agent: p.assignedAgent?.name || p.assignedAgent?.email || "Unassigned",
        Status: p.status,
        PaymentType: p.prepaid ? "PREPAID" : "COD",
        CODAmount: p.prepaid ? 0 : p.codAmount ?? 0,
        CreatedAt: new Date(p.createdAt).toLocaleString(),
      }))
    );
  };

  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Daily Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.dailyBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failed Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.failedDeliveries}</div>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total COD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ৳ {metrics.totalCOD.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="flex-1 min-w-0">
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Search by tracking code"
            />
          </div>
          <div className="flex-shrink-0">
            <DateFilter
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onChange={setDateRange}
            />
          </div>
        </div>
        <Button onClick={handleExport} className="gap-2 flex-shrink-0">
          <FileDownIcon className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Table */}
      <Card>
        <ScrollArea className="w-full">
          <div className="min-w-[800px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Tracking Code</TableHead>
                  <TableHead className="w-[150px]">Customer</TableHead>
                  <TableHead className="w-[200px]">Pickup</TableHead>
                  <TableHead className="w-[200px]">Delivery</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[140px]">Assigned Agent</TableHead>
                  <TableHead className="w-[180px] text-right">Assign</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : paginated.length > 0 ? (
                  paginated.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">
                        {p.trackingCode}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {p.customer?.name || p.customer?.email || "-"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {p.pickupAddress}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {p.deliveryAddress}
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
                      <TableCell className="max-w-[140px] truncate">
                        {p.assignedAgentId
                          ? agents.find((a) => a.id === p.assignedAgentId)
                              ?.name || "Assigned"
                          : "Not assigned"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          disabled={assigning === p.id}
                          onValueChange={(agentId) =>
                            handleAssign(p.id, agentId)
                          }
                        >
                          <SelectTrigger className="w-[160px] ml-auto">
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
                      className="text-center text-muted-foreground py-8"
                    >
                      No parcels found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
