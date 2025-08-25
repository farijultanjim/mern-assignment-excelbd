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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// parcel type options
const parcelOptions = [
  { value: "DOCUMENT", label: "Documents" },
  { value: "SMALL", label: "500g (Very Small Parcel)" },
  { value: "MEDIUM", label: "1-2kg (Medium Parcel)" },
  { value: "LARGE", label: "3-5kg (Large Parcel)" },
];

export default function NewParcelPage() {
  const [form, setForm] = useState({
    pickupAddress: "",
    deliveryAddress: "",
    parcelType: "",
    paymentMethod: "", // "COD" | "PREPAID"
    codAmount: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (key: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (
      !form.pickupAddress ||
      !form.deliveryAddress ||
      !form.parcelType ||
      !form.paymentMethod
    ) {
      toast.error("Missing fields", {
        description: "Please fill in all required fields.",
      });
      return;
    }

    if (form.paymentMethod === "COD" && !form.codAmount) {
      toast.error("Missing COD amount", {
        description: "Enter COD amount for cash on delivery.",
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
            {/* Pickup */}
            <div>
              <Label htmlFor="pickupAddress">Pickup Address</Label>
              <Input
                id="pickupAddress"
                placeholder="Enter pickup address"
                value={form.pickupAddress}
                onChange={(e) => handleChange("pickupAddress", e.target.value)}
              />
            </div>

            {/* Delivery */}
            <div>
              <Label htmlFor="deliveryAddress">Delivery Address</Label>
              <Input
                id="deliveryAddress"
                placeholder="Enter delivery address"
                value={form.deliveryAddress}
                onChange={(e) =>
                  handleChange("deliveryAddress", e.target.value)
                }
              />
            </div>

            {/* Parcel Type Dropdown (Shadcn Select) */}
            <div>
              <Label>Parcel Type / Size</Label>
              <Select
                value={form.parcelType}
                onValueChange={(value) => handleChange("parcelType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parcel type" />
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

            {/* Payment Method (RadioGroup) */}
            <div>
              <Label>Payment Method</Label>
              <RadioGroup
                value={form.paymentMethod}
                onValueChange={(value) => handleChange("paymentMethod", value)}
                className="flex gap-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PREPAID" id="prepaid" />
                  <Label htmlFor="prepaid">Prepaid</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="COD" id="cod" />
                  <Label htmlFor="cod">Cash on Delivery (COD)</Label>
                </div>
              </RadioGroup>
            </div>

            {/* COD Amount (conditional) */}
            {form.paymentMethod === "COD" && (
              <div>
                <Label htmlFor="codAmount">COD Amount</Label>
                <Input
                  id="codAmount"
                  type="number"
                  placeholder="Enter COD amount"
                  value={form.codAmount}
                  onChange={(e) => handleChange("codAmount", e.target.value)}
                />
              </div>
            )}

            {/* Submit */}
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
