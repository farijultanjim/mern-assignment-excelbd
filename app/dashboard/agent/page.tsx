// "use client";

// import { useEffect, useState } from "react";
// import { toast } from "sonner";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";

// type Parcel = {
//   id: string;
//   trackingCode: string;
//   pickupAddress: string;
//   deliveryAddress: string;
//   parcelType: string;
//   status: "PENDING" | "IN_TRANSIT" | "DELIVERED" | "FAILED";
//   prepaid: boolean;
//   codAmount: number | null;
//   createdAt: string;
// };

// const statusOptions = ["PENDING", "IN_TRANSIT", "DELIVERED", "FAILED"];

// export default function AgentDashboardPage() {
//   const [parcels, setParcels] = useState<Parcel[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [updating, setUpdating] = useState<string | null>(null);

//   const fetchParcels = async () => {
//     setLoading(true);
//     try {
//       const res = await fetch("/api/agent/parcels");
//       if (!res.ok) throw new Error("Failed to load parcels");
//       const data = await res.json();
//       setParcels(data);
//     } catch (err: any) {
//       toast.error("Error", { description: err.message });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchParcels();
//   }, []);

//   const handleStatusChange = async (id: string, status: string) => {
//     setUpdating(id);
//     try {
//       const res = await fetch(`/api/agent/parcels/${id}`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ status }),
//       });
//       if (!res.ok) throw new Error("Failed to update status");
//       toast.success("Status updated", {
//         description: `Parcel is now ${status}`,
//       });
//       await fetchParcels();
//     } catch (err: any) {
//       toast.error("Update failed", { description: err.message });
//     } finally {
//       setUpdating(null);
//     }
//   };

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-6">Assigned Parcels</h1>

//       <div className="rounded-md border overflow-x-auto">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Tracking Code</TableHead>
//               <TableHead>Pickup</TableHead>
//               <TableHead>Delivery</TableHead>
//               <TableHead>Type</TableHead>
//               <TableHead>Payment</TableHead>
//               <TableHead>Status</TableHead>
//               <TableHead className="text-right">Update</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {loading ? (
//               <TableRow>
//                 <TableCell colSpan={7} className="text-center">
//                   Loading…
//                 </TableCell>
//               </TableRow>
//             ) : parcels.length > 0 ? (
//               parcels.map((p) => (
//                 <TableRow key={p.id}>
//                   <TableCell className="font-medium">
//                     {p.trackingCode}
//                   </TableCell>
//                   <TableCell>{p.pickupAddress}</TableCell>
//                   <TableCell>{p.deliveryAddress}</TableCell>
//                   <TableCell>{p.parcelType}</TableCell>
//                   <TableCell>
//                     {p.prepaid
//                       ? "Prepaid"
//                       : p.codAmount
//                       ? `COD: $${p.codAmount}`
//                       : "-"}
//                   </TableCell>
//                   <TableCell>
//                     <Badge
//                       variant={
//                         p.status === "DELIVERED"
//                           ? "default"
//                           : p.status === "FAILED"
//                           ? "destructive"
//                           : "secondary"
//                       }
//                     >
//                       {p.status}
//                     </Badge>
//                   </TableCell>
//                   <TableCell className="text-right">
//                     <Select
//                       disabled={updating === p.id}
//                       onValueChange={(status) =>
//                         handleStatusChange(p.id, status)
//                       }
//                       defaultValue={p.status}
//                     >
//                       <SelectTrigger className="w-[140px]">
//                         <SelectValue placeholder="Change status" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {statusOptions.map((status) => (
//                           <SelectItem key={status} value={status}>
//                             {status}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </TableCell>
//                 </TableRow>
//               ))
//             ) : (
//               <TableRow>
//                 <TableCell
//                   colSpan={7}
//                   className="text-center text-muted-foreground"
//                 >
//                   No assigned parcels
//                 </TableCell>
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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

import { SearchBox } from "@/components/search-box";
import { DateFilter } from "@/components/date-filter";
import { Pagination } from "@/components/pagination";

type Parcel = {
  id: string;
  trackingCode: string;
  pickupAddress: string;
  deliveryAddress: string;
  parcelType: "DOCUMENT" | "SMALL" | "MEDIUM" | "LARGE";
  status: "PENDING" | "IN_TRANSIT" | "DELIVERED" | "FAILED";
  prepaid: boolean;
  codAmount: number | null;
  assignedAgentId: string | null;
  createdAt: string;
  customer?: { id: string; name: string | null; email: string };
};

const statusOptions = ["PENDING", "IN_TRANSIT", "DELIVERED", "FAILED"];

export default function AgentDashboardPage() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  // filters
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchParcels = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/parcels");
      if (!res.ok) throw new Error("Failed to load parcels");
      const data = await res.json();
      // normalize (array or { parcels: [] })
      const list = Array.isArray(data) ? data : data.parcels || [];
      setParcels(list);
    } catch (e: any) {
      toast.error("Error", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParcels();
  }, []);

  // local filter + paginate (same UX as /parcels & /dashboard/admin)
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

  // metrics for agent
  const metrics = useMemo(() => {
    const today = new Date();
    const todayAssigned = parcels.filter((p) => {
      const d = new Date(p.createdAt);
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    }).length;
    const delivered = parcels.filter((p) => p.status === "DELIVERED").length;
    const failed = parcels.filter((p) => p.status === "FAILED").length;
    return { todayAssigned, delivered, failed };
  }, [parcels]);

  const canChangeStatus = (status: Parcel["status"]) =>
    !["DELIVERED", "FAILED"].includes(status);

  const updateStatus = async (id: string, status: Parcel["status"]) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/agent/parcels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Failed to update status");
      }
      toast.success("Status updated");
      await fetchParcels();
    } catch (e: any) {
      toast.error("Update failed", { description: e.message });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Agent Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          {/* Optional link to see parcel history or help */}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today’s Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.todayAssigned}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Delivered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.delivered}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.failed}</div>
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
      </div>

      {/* Table */}
      <Card>
        <ScrollArea className="w-full">
          <div className="min-w-[900px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Tracking Code</TableHead>
                  <TableHead className="w-[160px]">Customer</TableHead>
                  <TableHead className="w-[220px]">Pickup</TableHead>
                  <TableHead className="w-[220px]">Delivery</TableHead>
                  <TableHead className="w-[120px]">Type</TableHead>
                  <TableHead className="w-[120px]">Payment</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[200px] text-right">
                    Update Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : paginated.length > 0 ? (
                  paginated.map((p) => {
                    const disabled =
                      !canChangeStatus(p.status) || updating === p.id;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-sm">
                          {p.trackingCode}
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate">
                          {p.customer?.name || p.customer?.email || "-"}
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate">
                          {p.pickupAddress}
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate">
                          {p.deliveryAddress}
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate">
                          {p.parcelType}
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate">
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
                          <div className="flex justify-end">
                            <Select
                              disabled={disabled}
                              onValueChange={(next) =>
                                updateStatus(p.id, next as Parcel["status"])
                              }
                            >
                              <SelectTrigger className="w-[180px] ml-auto">
                                <SelectValue
                                  placeholder={
                                    disabled ? "No actions" : "Change status"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                         {statusOptions.map((status) => (
                           <SelectItem key={status} value={status}>
                             {status}
                           </SelectItem>
                         ))}
                       </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
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
