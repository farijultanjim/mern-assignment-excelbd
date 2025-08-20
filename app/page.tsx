import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          Courier & Parcel Management System
        </h1>
        <p className="text-gray-600">
          Book parcels, assign delivery agents, and track deliveries in
          real-time. A modern logistics solution built with Next.js 14.
        </p>

        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button className="px-6">Login</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" className="px-6">
              Register
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
