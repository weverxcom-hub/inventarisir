"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Download,
  Printer,
  Building2,
  Package as PackageIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
} from "lucide-react";
import type { InventoryItem, ItemCondition, Unit } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import { apiFetch } from "@/lib/fetcher";

const CONDITION_LABEL: Record<ItemCondition | string, string> = {
  Good: "Baik",
  Repair: "Perlu Perbaikan",
  Broken: "Rusak",
};

const UNASSIGNED = "(Belum diatur)";

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadCsv(filename: string, items: InventoryItem[]): void {
  const headers = [
    "Item ID",
    "Nama",
    "Kategori",
    "Jumlah",
    "Lokasi",
    "Kondisi",
    "Tanggal Dibuat",
  ];
  const rows = items.map((item) => [
    item.item_id,
    item.name,
    item.category,
    String(item.quantity),
    item.location,
    item.condition,
    item.created_at,
  ]);
  const csv =
    [headers, ...rows]
      .map((row) => row.map((cell) => escapeCsv(cell ?? "")).join(","))
      .join("\n") + "\n";

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface UnitGroup {
  unit: string;
  count: number;
  qty: number;
  good: number;
  repair: number;
  broken: number;
}

interface CategoryGroup {
  category: string;
  count: number;
  qty: number;
}

export default function ReportsPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, unitsRes] = await Promise.all([
        apiFetch<{ items: InventoryItem[] }>("/api/inventory"),
        apiFetch<{ units: Unit[] }>("/api/units").catch(() => ({
          units: [] as Unit[],
        })),
      ]);
      setItems(itemsRes.items || []);
      setUnits(unitsRes.units || []);
    } catch {
      /* surfaced via toast */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const summary = useMemo(() => {
    const total = items.reduce((acc, it) => acc + (it.quantity || 0), 0);
    const good = items.filter((it) => it.condition === "Good").length;
    const repair = items.filter((it) => it.condition === "Repair").length;
    const broken = items.filter((it) => it.condition === "Broken").length;
    return { count: items.length, total, good, repair, broken };
  }, [items]);

  const unitOptions = useMemo(() => {
    const set = new Set<string>();
    units.forEach((u) => set.add(u.name));
    items.forEach((it) => {
      if (it.location) set.add(it.location);
    });
    return Array.from(set).sort();
  }, [units, items]);

  const unitGroups = useMemo<UnitGroup[]>(() => {
    const map = new Map<string, UnitGroup>();
    items.forEach((it) => {
      const key = it.location?.trim() || UNASSIGNED;
      let g = map.get(key);
      if (!g) {
        g = { unit: key, count: 0, qty: 0, good: 0, repair: 0, broken: 0 };
        map.set(key, g);
      }
      g.count += 1;
      g.qty += it.quantity || 0;
      if (it.condition === "Good") g.good += 1;
      else if (it.condition === "Repair") g.repair += 1;
      else if (it.condition === "Broken") g.broken += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [items]);

  const categoryGroups = useMemo<CategoryGroup[]>(() => {
    const map = new Map<string, CategoryGroup>();
    items.forEach((it) => {
      const key = it.category?.trim() || "(Tanpa Kategori)";
      let g = map.get(key);
      if (!g) {
        g = { category: key, count: 0, qty: 0 };
        map.set(key, g);
      }
      g.count += 1;
      g.qty += it.quantity || 0;
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [items]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      if (
        needle &&
        !item.name.toLowerCase().includes(needle) &&
        !item.item_id.toLowerCase().includes(needle) &&
        !item.category.toLowerCase().includes(needle) &&
        !item.location.toLowerCase().includes(needle)
      ) {
        return false;
      }
      if (unitFilter && item.location !== unitFilter) return false;
      if (conditionFilter && item.condition !== conditionFilter) return false;
      return true;
    });
  }, [items, search, unitFilter, conditionFilter]);

  if (loading) {
    return <LoadingSpinner fullPage text="Memuat laporan..." />;
  }

  const onPrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const csvFilename = unitFilter
    ? `inventaris-${unitFilter.replace(/[^a-zA-Z0-9-]/g, "-")}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    : `inventaris-laporan-${new Date().toISOString().slice(0, 10)}.csv`;

  return (
    <div className="print:bg-white">
      <style jsx global>{`
        @media print {
          aside,
          .no-print {
            display: none !important;
          }
          main {
            margin-left: 0 !important;
            padding: 0 !important;
          }
          body {
            background: white !important;
          }
          .print-card {
            break-inside: avoid;
          }
        }
      `}</style>

      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Laporan Inventaris</h1>
          <p className="text-sm text-gray-500">
            Ringkasan & rekap per unit dan kategori
          </p>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <button
            onClick={() => downloadCsv(csvFilename, filtered)}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            title="Unduh hasil filter sebagai CSV"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            onClick={onPrint}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            title="Cetak laporan"
          >
            <Printer size={16} />
            Cetak
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <SummaryCard
          icon={<PackageIcon size={18} />}
          label="Total Item"
          value={summary.count}
          tone="blue"
        />
        <SummaryCard
          icon={<PackageIcon size={18} />}
          label="Total Qty"
          value={summary.total}
          tone="blue"
        />
        <SummaryCard
          icon={<CheckCircle2 size={18} />}
          label="Baik"
          value={summary.good}
          tone="green"
        />
        <SummaryCard
          icon={<AlertTriangle size={18} />}
          label="Perlu Perbaikan"
          value={summary.repair}
          tone="yellow"
        />
        <SummaryCard
          icon={<XCircle size={18} />}
          label="Rusak"
          value={summary.broken}
          tone="red"
        />
      </div>

      {/* Per Unit + Per Kategori */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm print-card">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Building2 size={16} />
            Inventaris per Unit / Lokasi
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-gray-500">
                <tr>
                  <th className="py-2">Unit</th>
                  <th className="py-2 text-right">Item</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right text-green-700">Baik</th>
                  <th className="py-2 text-right text-yellow-700">Perbaikan</th>
                  <th className="py-2 text-right text-red-700">Rusak</th>
                  <th className="py-2 text-right no-print"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {unitGroups.map((g) => (
                  <tr key={g.unit} className="hover:bg-gray-50">
                    <td className="py-2 pr-2 font-medium">{g.unit}</td>
                    <td className="py-2 text-right">{g.count}</td>
                    <td className="py-2 text-right">{g.qty}</td>
                    <td className="py-2 text-right text-green-700">
                      {g.good}
                    </td>
                    <td className="py-2 text-right text-yellow-700">
                      {g.repair}
                    </td>
                    <td className="py-2 text-right text-red-700">
                      {g.broken}
                    </td>
                    <td className="py-2 text-right no-print">
                      <button
                        onClick={() => {
                          setUnitFilter(
                            g.unit === UNASSIGNED ? "" : g.unit
                          );
                          setConditionFilter("");
                          setSearch("");
                          if (typeof window !== "undefined") {
                            window.scrollTo({
                              top: document.body.scrollHeight,
                              behavior: "smooth",
                            });
                          }
                        }}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                        title="Lihat daftar item"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {unitGroups.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-6 text-center text-sm text-gray-400"
                    >
                      Belum ada data inventaris
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm print-card">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <PackageIcon size={16} />
            Inventaris per Kategori
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-gray-500">
                <tr>
                  <th className="py-2">Kategori</th>
                  <th className="py-2 text-right">Item</th>
                  <th className="py-2 text-right">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {categoryGroups.map((g) => (
                  <tr key={g.category} className="hover:bg-gray-50">
                    <td className="py-2 pr-2 font-medium">{g.category}</td>
                    <td className="py-2 text-right">{g.count}</td>
                    <td className="py-2 text-right">{g.qty}</td>
                  </tr>
                ))}
                {categoryGroups.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-6 text-center text-sm text-gray-400"
                    >
                      Belum ada data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail List with filter */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm print-card">
        <div className="border-b p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">
            Daftar Detail Inventaris
            {unitFilter && (
              <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {unitFilter}
              </span>
            )}
          </h2>
          <div className="flex flex-wrap gap-2 no-print">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama, ID, kategori, lokasi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="rounded-lg border border-gray-300 py-2 pl-9 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Semua Unit</option>
                {unitOptions.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Semua Kondisi</option>
              <option value="Good">Baik</option>
              <option value="Repair">Perlu Perbaikan</option>
              <option value="Broken">Rusak</option>
            </select>
            {(unitFilter || conditionFilter || search) && (
              <button
                onClick={() => {
                  setUnitFilter("");
                  setConditionFilter("");
                  setSearch("");
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Reset
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {filtered.length} dari {items.length} item ditampilkan
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3">Unit / Lokasi</th>
                <th className="px-4 py-3">Kondisi</th>
                <th className="px-4 py-3 no-print"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((item) => (
                <tr key={item.item_id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-2 font-mono text-xs">
                    <Link
                      href={`/item/${item.item_id}`}
                      className="text-blue-600 hover:underline"
                      title="Lihat detail item"
                    >
                      {item.item_id}
                    </Link>
                  </td>
                  <td className="px-4 py-2 font-medium">
                    <Link
                      href={`/item/${item.item_id}`}
                      className="hover:underline"
                    >
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-500">{item.category}</td>
                  <td className="px-4 py-2 text-right">{item.quantity}</td>
                  <td className="px-4 py-2 text-gray-500">{item.location}</td>
                  <td className="px-4 py-2">
                    <ConditionBadge condition={item.condition} />
                  </td>
                  <td className="px-4 py-2 no-print">
                    <Link
                      href={`/item/${item.item_id}`}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                      title="Lihat Detail"
                    >
                      <Eye size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-gray-400"
                  >
                    Tidak ada item yang cocok dengan filter.
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

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "blue" | "green" | "yellow" | "red";
}) {
  const tones: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
    red: "bg-red-50 text-red-700",
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm print-card">
      <div
        className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${tones[tone]}`}
      >
        {icon}
      </div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
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
      {CONDITION_LABEL[condition] || condition}
    </span>
  );
}
