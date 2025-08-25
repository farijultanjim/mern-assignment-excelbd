"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, 
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { MoreHorizontal, Pencil, Trash } from "lucide-react";

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
  createdAt: string;
};

const parcelOptions = [
  { value: "DOCUMENT", label: "Documents" },
  { value: "SMALL", label: "500g (Very Small Parcel)" },
  { value: "MEDIUM", label: "1-2kg (Medium Parcel)" },
  { value: "LARGE", label: "3-5kg (Large Parcel)" },
];

export default function ParcelsPage() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);

  // search + filter
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // edit/delete UI state
  const [selected, setSelected] = useState<Parcel | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // edit form state
  const [editForm, setEditForm] = useState({
    pickupAddress: "",
    deliveryAddress: "",
    parcelType: "",
    paymentMethod: "", // "PREPAID" | "COD"
    codAmount: "",
  });

  const fetchParcels = async () => {
    setLoading(true);
    const res = await fetch("/api/parcels");
    const data = await res.json();
    setParcels(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchParcels();
  }, []);

  // filter + paginate
  const filtered = useMemo(() => {
    return parcels.filter((p) => {
      const matchesSearch = p.trackingCode.toLowerCase().includes(search.toLowerCase());
      const created = new Date(p.createdAt);
      const afterStart = !dateRange.startDate || created >= new Date(dateRange.startDate);
      const beforeEnd = !dateRange.endDate || created <= new Date(dateRange.endDate);
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
    if (!editForm.pickupAddress || !editForm.deliveryAddress || !editForm.parcelType || !editForm.paymentMethod) {
      toast.error("Missing fields", { description: "Please fill all required fields." });
      return;
    }
    if (editForm.paymentMethod === "COD" && !editForm.codAmount) {
      toast.error("Missing COD amount", { description: "Enter COD amount for COD payment." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/parcels/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Failed to update parcel");
      }
      toast.success("Parcel updated");
      setEditOpen(false);
      await fetchParcels();
    } catch (e: any) {
      toast.error("Update failed", { description: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/parcels/${selected.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Failed to delete parcel");
      }
      toast.success("Parcel deleted");
      setDeleteOpen(false);
      // if we deleted the last item on the last page, move to previous page
      await fetchParcels();
      setPage((p) => Math.min(Math.max(1, p), Math.ceil((filtered.length - 1) / pageSize) || 1));
    } catch (e: any) {
      toast.error("Delete failed", { description: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Parcels</h1>
        <Link href="/parcels/new">
          <Button>Add New Parcel</Button>
        </Link>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-4 mb-6">
        <SearchBox value={search} onChange={setSearch} placeholder="Search by tracking code" />
        <DateFilter startDate={dateRange.startDate} endDate={dateRange.endDate} onChange={setDateRange} />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tracking Code</TableHead>
              <TableHead>Pickup</TableHead>
              <TableHead>Delivery</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Booked</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">Loading…</TableCell>
              </TableRow>
            ) : paginated.length > 0 ? (
              paginated.map((p) => {
                const pending = p.status === "PENDING";
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.trackingCode}</TableCell>
                    <TableCell>{p.pickupAddress}</TableCell>
                    <TableCell>{p.deliveryAddress}</TableCell>
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
                      {p.prepaid ? "Prepaid" : p.codAmount ? `COD: $${p.codAmount}` : "-"}
                    </TableCell>
                    <TableCell>{new Date(p.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/parcels/${p.id}`}>
                          <Button size="sm" variant="outline">View</Button>
                        </Link>

                        {/* Actions dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              disabled={!pending}
                              onClick={() => pending && openEdit(p)}
                              className={!pending ? "opacity-50 pointer-events-none" : ""}
                            >
                              <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={!pending}
                              onClick={() => pending && openDelete(p)}
                              className={!pending ? "opacity-50 pointer-events-none text-muted-foreground" : "text-red-600"}
                            >
                              <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-500">No parcels found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Parcel</DialogTitle>
            <DialogDescription>Only pending parcels can be edited.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="pickupAddress">Pickup Address</Label>
              <Input
                id="pickupAddress"
                value={editForm.pickupAddress}
                onChange={(e) => setEditForm((f) => ({ ...f, pickupAddress: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="deliveryAddress">Delivery Address</Label>
              <Input
                id="deliveryAddress"
                value={editForm.deliveryAddress}
                onChange={(e) => setEditForm((f) => ({ ...f, deliveryAddress: e.target.value }))}
              />
            </div>

            <div>
              <Label>Parcel Type</Label>
              <Select
                value={editForm.parcelType}
                onValueChange={(v) => setEditForm((f) => ({ ...f, parcelType: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {parcelOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Payment Method</Label>
              <RadioGroup
                value={editForm.paymentMethod}
                onValueChange={(v) => setEditForm((f) => ({ ...f, paymentMethod: v }))}
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
                <Label htmlFor="codAmount">COD Amount</Label>
                <Input
                  id="codAmount"
                  type="number"
                  value={editForm.codAmount}
                  onChange={(e) => setEditForm((f) => ({ ...f, codAmount: e.target.value }))}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
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
