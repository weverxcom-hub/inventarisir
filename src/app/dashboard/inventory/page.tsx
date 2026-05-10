"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
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
  Upload,
  Download,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import type { InventoryItem, ItemCondition, Unit } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import ConfirmDialog from "@/components/ConfirmDialog";
import { apiFetch } from "@/lib/fetcher";

const CONDITION_LABEL: Record<ItemCondition | string, string> = {
  Good: "Baik",
  Repair: "Perlu Perbaikan",
  Broken: "Rusak",
};

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadCsv(items: InventoryItem[]): void {
  const headers = [
    "Item ID",
    "Nama",
    "Kategori",
    "Jumlah",
    "Lokasi",
    "Kondisi",
    "Foto",
    "Nota",
    "Tanggal Dibuat",
  ];
  const rows = items.map((item) => [
    item.item_id,
    item.name,
    item.category,
    String(item.quantity),
    item.location,
    item.condition,
    item.photo_url,
    item.receipt_url,
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
  link.download = `inventaris-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function InventoryPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "Admin";

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
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
    fetchItems();
  }, [fetchItems]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => {
      if (it.category) set.add(it.category);
    });
    return Array.from(set).sort();
  }, [items]);

  const unitOptions = useMemo(() => {
    const set = new Set<string>();
    units.forEach((u) => set.add(u.name));
    items.forEach((it) => {
      if (it.location) set.add(it.location);
    });
    return Array.from(set).sort();
  }, [units, items]);

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
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (conditionFilter && item.condition !== conditionFilter) return false;
      if (unitFilter && item.location !== unitFilter) return false;
      return true;
    });
  }, [items, search, categoryFilter, conditionFilter, unitFilter]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/inventory/${encodeURIComponent(deleteTarget.item_id)}`, {
        method: "DELETE",
        successMessage: "Item dihapus",
      });
      setDeleteTarget(null);
      await fetchItems();
    } catch {
      /* toast already shown */
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (formData: {
    name: string;
    category: string;
    quantity: number;
    location: string;
    condition: ItemCondition;
    photo_url: string;
    receipt_url: string;
  }) => {
    setSaving(true);
    try {
      if (editItem) {
        await apiFetch(
          `/api/inventory/${encodeURIComponent(editItem.item_id)}`,
          {
            method: "PUT",
            body: JSON.stringify(formData),
            successMessage: "Item diperbarui",
          }
        );
      } else {
        await apiFetch("/api/inventory", {
          method: "POST",
          body: JSON.stringify(formData),
          successMessage: "Item ditambahkan",
        });
      }
      setShowForm(false);
      setEditItem(null);
      await fetchItems();
    } catch {
      /* toast already shown */
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Memuat inventaris..." />;
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventaris</h1>
          <p className="text-sm text-gray-500">
            {filtered.length} dari {items.length} item ditampilkan
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => downloadCsv(filtered)}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            title="Unduh sebagai CSV"
          >
            <Download size={16} />
            Export CSV
          </button>
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

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[240px]">
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
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-gray-300 py-2 pl-9 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
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
        {(search || categoryFilter || conditionFilter || unitFilter) && (
          <button
            onClick={() => {
              setSearch("");
              setCategoryFilter("");
              setConditionFilter("");
              setUnitFilter("");
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Reset
          </button>
        )}
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
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                  <Link
                    href={`/item/${item.item_id}`}
                    className="text-blue-600 hover:underline"
                    title="Lihat detail item"
                  >
                    {item.item_id}
                  </Link>
                </td>
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/item/${item.item_id}`}
                    className="hover:underline"
                  >
                    {item.name}
                  </Link>
                </td>
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
                          onClick={() => setDeleteTarget(item)}
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
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
                  className="px-4 py-12 text-center text-gray-400"
                >
                  {items.length === 0
                    ? "Belum ada data inventaris. Klik 'Tambah Item' untuk mulai."
                    : "Tidak ada item yang cocok dengan filter."}
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
          units={units}
          existingCategories={categories}
          saving={saving}
          onClose={() => {
            setShowForm(false);
            setEditItem(null);
          }}
          onSubmit={handleSubmit}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus item ini?"
        description={
          deleteTarget
            ? `Item "${deleteTarget.name}" (${deleteTarget.item_id}) akan dihapus permanen dari inventaris.`
            : ""
        }
        destructive
        confirmLabel="Hapus"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

interface ItemFormSubmit {
  name: string;
  category: string;
  quantity: number;
  location: string;
  condition: ItemCondition;
  photo_url: string;
  receipt_url: string;
}

function ItemFormModal({
  item,
  units,
  existingCategories,
  saving,
  onClose,
  onSubmit,
}: {
  item: InventoryItem | null;
  units: Unit[];
  existingCategories: string[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: ItemFormSubmit) => void;
}) {
  const knownUnitNames = useMemo(() => units.map((u) => u.name), [units]);
  const [name, setName] = useState(item?.name || "");
  const [category, setCategory] = useState(item?.category || "");
  const [quantity, setQuantity] = useState(item?.quantity || 1);
  const initialLocationKnown =
    item?.location && knownUnitNames.includes(item.location);
  const [locationMode, setLocationMode] = useState<"unit" | "custom">(
    initialLocationKnown ? "unit" : item?.location ? "custom" : "unit"
  );
  const [location, setLocation] = useState(item?.location || "");
  const [condition, setCondition] = useState<ItemCondition>(
    item?.condition || "Good"
  );
  const [photoUrl, setPhotoUrl] = useState(item?.photo_url || "");
  const [receiptUrl, setReceiptUrl] = useState(item?.receipt_url || "");
  const [uploadingField, setUploadingField] = useState<
    "photo" | "receipt" | null
  >(null);

  const upload = async (
    field: "photo" | "receipt",
    file: File
  ): Promise<void> => {
    setUploadingField(field);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Gagal mengupload file");
      }
      const link = data.webViewLink || "";
      if (field === "photo") setPhotoUrl(link);
      else setReceiptUrl(link);
      toast.success("File berhasil diupload");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengupload file"
      );
    } finally {
      setUploadingField(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-xl max-h-[90vh] overflow-y-auto sm:p-6">
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
            // For new items, foto + nota are required (per UNIGA policy).
            // Edit keeps the existing values so legacy data is not blocked.
            if (!item) {
              if (!photoUrl) {
                toast.error("Foto item wajib diunggah");
                return;
              }
              if (!receiptUrl) {
                toast.error("Foto nota pembelian wajib diunggah");
                return;
              }
            }
            onSubmit({
              name: name.trim(),
              category: category.trim(),
              quantity,
              location: location.trim(),
              condition,
              photo_url: photoUrl,
              receipt_url: receiptUrl,
            });
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Kategori
              </label>
              <input
                type="text"
                list="categories-suggest"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Elektronik, Mebel, ATK, ..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
              <datalist id="categories-suggest">
                {existingCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Lokasi / Unit
              </label>
              {locationMode === "unit" && units.length > 0 ? (
                <select
                  value={location}
                  onChange={(e) => {
                    if (e.target.value === "__custom__") {
                      setLocationMode("custom");
                      setLocation("");
                    } else {
                      setLocation(e.target.value);
                    }
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                >
                  <option value="">Pilih unit...</option>
                  {units.map((u) => (
                    <option key={u.unit_id} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                  <option value="__custom__">Lainnya (ketik manual)…</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ruang / Unit"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                  {units.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setLocationMode("unit");
                        setLocation("");
                      }}
                      className="rounded-lg border border-gray-300 px-3 text-xs text-gray-600 hover:bg-gray-50"
                      title="Pakai daftar unit"
                    >
                      Pilih
                    </button>
                  )}
                </div>
              )}
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
                {(["Good", "Repair", "Broken"] as const).map((c) => (
                  <option key={c} value={c}>
                    {CONDITION_LABEL[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <UploadField
            label="Foto Item"
            url={photoUrl}
            uploading={uploadingField === "photo"}
            disabled={!!uploadingField}
            required={!item}
            onChange={(file) => upload("photo", file)}
            onClear={() => setPhotoUrl("")}
          />

          <UploadField
            label="Foto Nota Pembelian"
            url={receiptUrl}
            uploading={uploadingField === "receipt"}
            disabled={!!uploadingField}
            required={!item}
            onChange={(file) => upload("receipt", file)}
            onClear={() => setReceiptUrl("")}
          />

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
              disabled={saving || !!uploadingField}
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

function UploadField({
  label,
  url,
  uploading,
  disabled,
  required = false,
  onChange,
  onClear,
}: {
  label: string;
  url: string;
  uploading: boolean;
  disabled: boolean;
  required?: boolean;
  onChange: (file: File) => void;
  onClear: () => void;
}) {
  const missing = required && !url && !uploading;
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}{" "}
        {required ? (
          <span className="text-xs font-semibold text-red-600">*wajib</span>
        ) : (
          <span className="text-xs font-normal text-gray-400">(opsional)</span>
        )}
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <label
          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 ${
            missing ? "border-red-400 bg-red-50" : "border-gray-300"
          }`}
        >
          {uploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Upload size={16} />
          )}
          {uploading ? "Mengupload..." : "Pilih File"}
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            disabled={disabled}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onChange(file);
              e.target.value = "";
            }}
          />
        </label>
        {url && (
          <div className="flex items-center gap-2 text-xs">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Lihat file
            </a>
            <button
              type="button"
              onClick={onClear}
              className="text-gray-400 hover:text-red-600"
              title="Hapus"
            >
              <X size={14} />
            </button>
          </div>
        )}
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
      {CONDITION_LABEL[condition] || condition}
    </span>
  );
}
