"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NewParcelPage() {
  const [form, setForm] = useState({
    pickupAddress: "",
    deliveryAddress: "",
    parcelType: "",
    codAmount: "",
    prepaid: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onChange =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({
        ...form,
        [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
      });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!form.pickupAddress || !form.deliveryAddress || !form.parcelType) {
      toast.error("Missing fields", {
        description: "Please fill in all required fields.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/parcels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Failed to create parcel");
      }

      toast.success("Parcel booked", {
        description: "You can track it in your dashboard.",
      });
      router.push("/dashboard/customer");
    } catch (err: any) {
      toast.error("Error", { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Book a Parcel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="pickupAddress">Pickup Address</Label>
              <Input
                id="pickupAddress"
                placeholder="Enter pickup address"
                value={form.pickupAddress}
                onChange={onChange("pickupAddress")}
              />
            </div>
            <div>
              <Label htmlFor="deliveryAddress">Delivery Address</Label>
              <Input
                id="deliveryAddress"
                placeholder="Enter delivery address"
                value={form.deliveryAddress}
                onChange={onChange("deliveryAddress")}
              />
            </div>
            <div>
              <Label htmlFor="parcelType">Parcel Type / Size</Label>
              <Input
                id="parcelType"
                placeholder="e.g. Small Box, Document"
                value={form.parcelType}
                onChange={onChange("parcelType")}
              />
            </div>
            <div>
              <Label htmlFor="codAmount">Cash on Delivery (optional)</Label>
              <Input
                id="codAmount"
                type="number"
                placeholder="Enter amount or leave empty"
                value={form.codAmount}
                onChange={onChange("codAmount")}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="prepaid"
                type="checkbox"
                checked={form.prepaid}
                onChange={onChange("prepaid")}
                className="h-4 w-4 border-gray-300 rounded"
              />
              <Label htmlFor="prepaid">Prepaid</Label>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Booking…
                </span>
              ) : (
                "Book Parcel"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-sm text-gray-500 text-center">
          Your parcel will be visible in booking history.
        </CardFooter>
      </Card>
    </div>
  );
}
