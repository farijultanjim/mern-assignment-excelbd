"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { SearchBox } from "@/components/search-box";
import { DateFilter } from "@/components/date-filter";
import { Pagination } from "@/components/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";

type Parcel = {
  id: string;
  trackingCode: string;
  pickupAddress: string;
  deliveryAddress: string;
  parcelType: "DOCUMENT" | "SMALL" | "MEDIUM" | "LARGE";
  status: "PENDING" | "IN_TRANSIT" | "DELIVERED" | "FAILED";
  prepaid: boolean;
  codAmount: number | null;
  createdAt: string;
};

const parcelOptions = [
  { value: "DOCUMENT", label: "Documents" },
  { value: "SMALL", label: "500g (Very Small Parcel)" },
  { value: "MEDIUM", label: "1-2kg (Medium Parcel)" },
  { value: "LARGE", label: "3-5kg (Large Parcel)" },
];

export default function CustomerDashboardPage() {
  const { data: session } = useSession();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // edit/delete
  const [selected, setSelected] = useState<Parcel | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editForm, setEditForm] = useState({
    pickupAddress: "",
    deliveryAddress: "",
    parcelType: "",
    paymentMethod: "",
    codAmount: "",
  });

  useEffect(() => {
    if (!session?.user) return;
    fetchParcels();
  }, [session]);

  const fetchParcels = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/parcels");
      const data = await res.json();
      setParcels(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load parcels");
    } finally {
      setLoading(false);
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

  // helpers
  const openEdit = (p: Parcel) => {
    if (p.status !== "PENDING") return;
    setSelected(p);
    setEditForm({
      pickupAddress: p.pickupAddress,
      deliveryAddress: p.deliveryAddress,
      parcelType: p.parcelType,
      paymentMethod: p.prepaid ? "PREPAID" : "COD",
      codAmount: p.prepaid ? "" : String(p.codAmount || ""),
    });
    setEditOpen(true);
  };

  const openDelete = (p: Parcel) => {
    if (p.status !== "PENDING") return;
    setSelected(p);
    setDeleteOpen(true);
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/parcels/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error("Failed to update parcel");
      toast.success("Parcel updated");
      setEditOpen(false);
      await fetchParcels();
    } catch (err: any) {
      toast.error("Update failed", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/parcels/${selected.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete parcel");
      toast.success("Parcel deleted");
      setDeleteOpen(false);
      await fetchParcels();
    } catch (err: any) {
      toast.error("Delete failed", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // metrics
  const metrics = useMemo(() => {
    return {
      total: parcels.length,
      pending: parcels.filter((p) => p.status === "PENDING").length,
      inTransit: parcels.filter((p) => p.status === "IN_TRANSIT").length,
      delivered: parcels.filter((p) => p.status === "DELIVERED").length,
      failed: parcels.filter((p) => p.status === "FAILED").length,
    };
  }, [parcels]);

  if (!session?.user) return <div className="p-6">Please log in.</div>;
  if (session.user.role !== "CUSTOMER")
    return <div className="p-6">Access denied.</div>;

  return (
    <div className="container mx-auto max-w-7xl p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Customer Dashboard</h1>
        <Link href="/dashboard/customer/parcels/new">
          <Button>Book New Parcel</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-5">
        {Object.entries(metrics).map(([key, value]) => (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium capitalize text-muted-foreground">
                {key === "inTransit" ? "In Transit" : key}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
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
                  <TableHead className="w-[200px]">Pickup</TableHead>
                  <TableHead className="w-[200px]">Delivery</TableHead>
                  <TableHead className="w-[120px]">Type</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[140px]">Payment</TableHead>
                  <TableHead className="w-[180px]">Booked</TableHead>
                  <TableHead className="text-right w-[100px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : paginated.length ? (
                  paginated.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">
                        {p.trackingCode}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {p.pickupAddress}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {p.deliveryAddress}
                      </TableCell>
                      <TableCell>{p.parcelType}</TableCell>
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
                        {p.prepaid
                          ? "Prepaid"
                          : p.codAmount
                          ? `COD: ৳${p.codAmount}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {new Date(p.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              disabled={p.status !== "PENDING"}
                              onClick={() => openEdit(p)}
                            >
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={p.status !== "PENDING"}
                              onClick={() => openDelete(p)}
                              className="text-red-600"
                            >
                              <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
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

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Parcel</DialogTitle>
            <DialogDescription>
              Only pending parcels can be edited.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Pickup Address</Label>
              <Input
                value={editForm.pickupAddress}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, pickupAddress: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Delivery Address</Label>
              <Input
                value={editForm.deliveryAddress}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    deliveryAddress: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Parcel Type</Label>
              <Select
                value={editForm.parcelType}
                onValueChange={(v) =>
                  setEditForm((f) => ({ ...f, parcelType: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {parcelOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Payment Method</Label>
              <RadioGroup
                value={editForm.paymentMethod}
                onValueChange={(v) =>
                  setEditForm((f) => ({ ...f, paymentMethod: v }))
                }
                className="flex gap-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PREPAID" id="prepaid" />
                  <Label htmlFor="prepaid">Prepaid</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="COD" id="cod" />
                  <Label htmlFor="cod">COD</Label>
                </div>
              </RadioGroup>
            </div>
            {editForm.paymentMethod === "COD" && (
              <div>
                <Label>COD Amount</Label>
                <Input
                  type="number"
                  value={editForm.codAmount}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, codAmount: e.target.value }))
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={submitting}>
              {submitting ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete parcel?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Only PENDING parcels can be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={submitting}
            >
              {submitting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
