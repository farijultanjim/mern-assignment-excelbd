"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <header className="w-full border-b bg-white shadow-sm px-6 py-3 flex items-center justify-between">
      <div>
        <h2 className="font-semibold">{session.user.name || "Unnamed User"}</h2>
        <p className="text-sm text-gray-500 capitalize">
          {session.user.role.toLowerCase()}
        </p>
      </div>
      <Button
        variant="outline"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        Logout
      </Button>
    </header>
  );
}
