"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  CheckSquare,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["Staff", "Approver", "Admin"],
  },
  {
    label: "Inventaris",
    href: "/dashboard/inventory",
    icon: Package,
    roles: ["Staff", "Approver", "Admin"],
  },
  {
    label: "Pengadaan",
    href: "/dashboard/procurement",
    icon: ShoppingCart,
    roles: ["Staff", "Approver", "Admin"],
  },
  {
    label: "Persetujuan",
    href: "/dashboard/approvals",
    icon: CheckSquare,
    roles: ["Approver", "Admin"],
  },
  {
    label: "Pengguna",
    href: "/dashboard/users",
    icon: Users,
    roles: ["Admin"],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const role = session?.user?.role || "Staff";

  const filtered = navItems.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden rounded-lg bg-blue-700 p-2 text-white shadow-lg"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 flex h-full w-64 transform flex-col bg-blue-800 text-white transition-transform duration-200 ease-in-out md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex shrink-0 items-center gap-3 border-b border-blue-700 px-6 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white p-1 shadow-sm">
            <Logo size={36} priority />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight">UNIGA MALANG</h1>
            <p className="text-[11px] text-blue-200">Inventaris &amp; Pengadaan</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto px-3">
          {filtered.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-900 text-white"
                    : "text-blue-100 hover:bg-blue-700/60"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info & logout */}
        <div className="shrink-0 border-t border-blue-700 p-4">
          <div className="mb-3 text-xs">
            <p className="font-medium text-white truncate">
              {session?.user?.name || "User"}
            </p>
            <p className="text-blue-300 truncate">
              {session?.user?.email}
            </p>
            <span className="mt-1 inline-block rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold uppercase">
              {role}
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-blue-200 transition-colors hover:bg-blue-700"
          >
            <LogOut size={16} />
            Keluar
          </button>
          <div className="mt-2 border-t border-blue-700/60 pt-2">
            <Footer variant="dark" />
          </div>
        </div>
      </aside>
    </>
  );
}
