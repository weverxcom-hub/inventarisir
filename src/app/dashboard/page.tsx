"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Package, ShoppingCart, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import type { InventoryItem, ProcurementRequest } from "@/types";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [procurement, setProcurement] = useState<ProcurementRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [invRes, procRes] = await Promise.all([
          fetch("/api/inventory"),
          fetch("/api/procurement"),
        ]);
        const invData = await invRes.json();
        const procData = await procRes.json();
        setInventory(invData.items || []);
        setProcurement(procData.requests || []);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalItems = inventory.length;
  const goodItems = inventory.filter((i) => i.condition === "Good").length;
  const needRepair = inventory.filter((i) => i.condition === "Repair").length;
  const pendingRequests = procurement.filter((p) => p.status === "Pending").length;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Selamat datang, {session?.user?.name || "User"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Package className="h-6 w-6 text-blue-600" />}
          label="Total Inventaris"
          value={totalItems}
          color="blue"
        />
        <StatCard
          icon={<CheckCircle className="h-6 w-6 text-green-600" />}
          label="Kondisi Baik"
          value={goodItems}
          color="green"
        />
        <StatCard
          icon={<AlertTriangle className="h-6 w-6 text-yellow-600" />}
          label="Perlu Perbaikan"
          value={needRepair}
          color="yellow"
        />
        <StatCard
          icon={<ShoppingCart className="h-6 w-6 text-purple-600" />}
          label="Pengadaan Menunggu"
          value={pendingRequests}
          color="purple"
        />
      </div>

      {/* Recent inventory */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Inventaris Terbaru
        </h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Kondisi</th>
                <th className="px-4 py-3">Lokasi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inventory.slice(0, 5).map((item) => (
                <tr key={item.item_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">
                    {item.item_id}
                  </td>
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500">{item.category}</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3">
                    <ConditionBadge condition={item.condition} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.location}</td>
                </tr>
              ))}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Belum ada data inventaris
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  const bgColors: Record<string, string> = {
    blue: "bg-blue-50",
    green: "bg-green-50",
    yellow: "bg-yellow-50",
    purple: "bg-purple-50",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${bgColors[color] || "bg-gray-50"}`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ConditionBadge({ condition }: { condition: string }) {
  const styles: Record<string, string> = {
    Good: "bg-green-100 text-green-700",
    Repair: "bg-yellow-100 text-yellow-700",
    Broken: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        styles[condition] || "bg-gray-100 text-gray-700"
      }`}
    >
      {condition}
    </span>
  );
}
