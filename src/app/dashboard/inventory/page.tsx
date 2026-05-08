"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  X,
} from "lucide-react";
import type { InventoryItem, ItemCondition } from "@/types";

export default function InventoryPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "Admin";

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filtered = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.item_id.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (itemId: string) => {
    if (!confirm("Hapus item ini?")) return;
    setDeleting(itemId);
    try {
      await fetch(`/api/inventory?item_id=${itemId}`, { method: "DELETE" });
      await fetchItems();
    } finally {
      setDeleting(null);
    }
  };

  const handleSubmit = async (formData: {
    name: string;
    category: string;
    quantity: number;
    location: string;
    condition: ItemCondition;
  }) => {
    setSaving(true);
    try {
      if (editItem) {
        await fetch("/api/inventory", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_id: editItem.item_id, ...formData }),
        });
      } else {
        await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      setShowForm(false);
      setEditItem(null);
      await fetchItems();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Memuat inventaris...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventaris</h1>
          <p className="text-sm text-gray-500">{items.length} item tercatat</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                setEditItem(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
            >
              <Plus size={16} />
              Tambah Item
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Lokasi</th>
              <th className="px-4 py-3">Kondisi</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((item) => (
              <tr key={item.item_id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-blue-600">
                  {item.item_id}
                </td>
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-gray-500">{item.category}</td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3 text-gray-500">{item.location}</td>
                <td className="px-4 py-3">
                  <ConditionBadge condition={item.condition} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/item/${item.item_id}`}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                      title="Lihat Detail"
                    >
                      <Eye size={16} />
                    </Link>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => {
                            setEditItem(item);
                            setShowForm(true);
                          }}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-yellow-600"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.item_id)}
                          disabled={deleting === item.item_id}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 disabled:opacity-50"
                          title="Hapus"
                        >
                          {deleting === item.item_id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  {search ? "Tidak ada item yang cocok" : "Belum ada data inventaris"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {showForm && (
        <ItemFormModal
          item={editItem}
          saving={saving}
          onClose={() => {
            setShowForm(false);
            setEditItem(null);
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

function ItemFormModal({
  item,
  saving,
  onClose,
  onSubmit,
}: {
  item: InventoryItem | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    category: string;
    quantity: number;
    location: string;
    condition: ItemCondition;
  }) => void;
}) {
  const [name, setName] = useState(item?.name || "");
  const [category, setCategory] = useState(item?.category || "");
  const [quantity, setQuantity] = useState(item?.quantity || 1);
  const [location, setLocation] = useState(item?.location || "");
  const [condition, setCondition] = useState<ItemCondition>(
    item?.condition || "Good"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {item ? "Edit Item" : "Tambah Item Baru"}
          </h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ name, category, quantity, location, condition });
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nama Item
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Kategori
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Jumlah
              </label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Lokasi
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Kondisi
              </label>
              <select
                value={condition}
                onChange={(e) =>
                  setCondition(e.target.value as ItemCondition)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Good">Baik</option>
                <option value="Repair">Perlu Perbaikan</option>
                <option value="Broken">Rusak</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {item ? "Simpan" : "Tambah"}
            </button>
          </div>
        </form>
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
