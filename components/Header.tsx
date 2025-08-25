"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ChevronDown, LogOut, Package } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function Header() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const userInitials =
    session.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() ||
    session.user?.email?.[0]?.toUpperCase() ||
    "U";

  const displayName =
    session.user?.name || session.user?.email?.split("@")[0] || "User";

  return (
    <header className="bg-white/70 backdrop-blur-md border-b border-slate-200/60 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center justify-center w-6 h-6 bg-slate-900 rounded-lg">
              <Package className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-medium text-slate-900 tracking-wider text-xl">
              ParcelX
            </h1>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {/* Welcome Message - Hidden on Mobile */}
            <div className="hidden md:block text-sm text-slate-600">
              Hello,{" "}
              <span className="font-medium text-slate-900">{displayName}</span>
            </div>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 h-auto p-2 hover:bg-slate-100/80 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-medium border-2 border-slate-200">
                    {userInitials}
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-56 bg-white/95 backdrop-blur-sm border-slate-200 shadow-lg"
              >
                {/* User Info */}
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-medium border-2 border-slate-200">
                      {userInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        <span className="font-medium text-lg">
                          {session.user?.name || "User"}
                        </span>{" "}
                        <span className="text-xs text-slate-500">
                          ({session.user?.role})
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {session.user?.email}
                      </p>
                    </div>
                  </div>
                </div>

                <DropdownMenuItem
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-red-50 text-red-600 focus:bg-red-50 focus:text-red-600"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
