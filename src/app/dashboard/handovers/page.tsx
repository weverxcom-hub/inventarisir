"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Plus,
  Loader2,
  X,
  FileSignature,
  Eye,
  Printer,
  Search,
} from "lucide-react";
import type { Handover, InventoryItem, Unit } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import { apiFetch } from "@/lib/fetcher";

export default function HandoversPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "Admin";

  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [h, i, u] = await Promise.all([
        apiFetch<{ handovers: Handover[] }>("/api/handovers"),
        apiFetch<{ items: InventoryItem[] }>("/api/inventory"),
        apiFetch<{ units: Unit[] }>("/api/units"),
      ]);
      setHandovers(h.handovers || []);
      setItems(i.items || []);
      setUnits(u.units || []);
    } catch {
      /* toast */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return handovers;
    return handovers.filter(
      (h) =>
        h.bast_id.toLowerCase().includes(needle) ||
        h.receiver_name.toLowerCase().includes(needle) ||
        h.receiver_unit.toLowerCase().includes(needle) ||
        h.giver_name.toLowerCase().includes(needle)
    );
  }, [handovers, search]);

  const handleSubmit = async (data: HandoverFormData) => {
    setSaving(true);
    try {
      await apiFetch("/api/handovers", {
        method: "POST",
        body: JSON.stringify(data),
        successMessage: "Berita acara berhasil dibuat",
      });
      setShowForm(false);
      await refresh();
    } catch {
      /* toast */
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage text="Memuat berita acara..." />;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Berita Acara Serah Terima
          </h1>
          <p className="text-sm text-gray-500">
            {handovers.length} dokumen BAST
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
          >
            <Plus size={16} />
            Buat BAST Baru
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nomor BAST, penerima, unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nomor BAST</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Penerima</th>
              <th className="px-4 py-3">Unit Penerima</th>
              <th className="px-4 py-3">Jumlah Barang</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((h) => (
              <tr key={h.bast_id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-blue-700">
                  {h.bast_id}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {formatDate(h.handover_date)}
                </td>
                <td className="px-4 py-3 font-medium">{h.receiver_name}</td>
                <td className="px-4 py-3 text-gray-500">{h.receiver_unit}</td>
                <td className="px-4 py-3">{h.item_ids.length}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/handover/${h.bast_id}`}
                      target="_blank"
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                      title="Lihat / Cetak"
                    >
                      <Eye size={16} />
                    </Link>
                    <Link
                      href={`/handover/${h.bast_id}?autoprint=1`}
                      target="_blank"
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-green-600"
                      title="Cetak Langsung"
                    >
                      <Printer size={16} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-gray-400"
                >
                  <FileSignature className="mx-auto mb-2 h-10 w-10 text-gray-300" />
                  {handovers.length === 0
                    ? "Belum ada berita acara. Klik 'Buat BAST Baru' untuk mulai."
                    : "Tidak ada BAST yang cocok dengan pencarian."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <HandoverFormModal
          items={items}
          units={units}
          giverDefault={session?.user?.name || ""}
          saving={saving}
          onClose={() => setShowForm(false)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

interface HandoverFormData {
  handover_date: string;
  place: string;
  giver_name: string;
  giver_position: string;
  receiver_name: string;
  receiver_position: string;
  receiver_unit: string;
  item_ids: string[];
  notes: string;
  nomor_surat: string;
  update_inventory_location: boolean;
}

function HandoverFormModal({
  items,
  units,
  giverDefault,
  saving,
  onClose,
  onSubmit,
}: {
  items: InventoryItem[];
  units: Unit[];
  giverDefault: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: HandoverFormData) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [handoverDate, setHandoverDate] = useState(today);
  const [place, setPlace] = useState("Malang");
  const [giverName, setGiverName] = useState(giverDefault);
  const [giverPosition, setGiverPosition] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPosition, setReceiverPosition] = useState("");
  const [receiverUnit, setReceiverUnit] = useState("");
  const [receiverUnitCustom, setReceiverUnitCustom] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [nomorSurat, setNomorSurat] = useState("");
  const [updateInventoryLocation, setUpdateInventoryLocation] = useState(true);
  const [itemSearch, setItemSearch] = useState("");

  const filteredItems = useMemo(() => {
    const needle = itemSearch.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (it) =>
        it.name.toLowerCase().includes(needle) ||
        it.item_id.toLowerCase().includes(needle) ||
        it.category.toLowerCase().includes(needle) ||
        it.location.toLowerCase().includes(needle)
    );
  }, [items, itemSearch]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const finalUnit =
    receiverUnit === "__custom__" ? receiverUnitCustom.trim() : receiverUnit;

  const canSubmit =
    handoverDate &&
    place.trim() &&
    giverName.trim() &&
    receiverName.trim() &&
    finalUnit &&
    selected.size > 0 &&
    nomorSurat.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-4 shadow-xl max-h-[92vh] overflow-y-auto sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Buat Berita Acara Serah Terima</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSubmit) return;
            onSubmit({
              handover_date: handoverDate,
              place: place.trim(),
              giver_name: giverName.trim(),
              giver_position: giverPosition.trim(),
              receiver_name: receiverName.trim(),
              receiver_position: receiverPosition.trim(),
              receiver_unit: finalUnit,
              item_ids: Array.from(selected),
              notes: notes.trim(),
              nomor_surat: nomorSurat.trim(),
              update_inventory_location: updateInventoryLocation,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nomor Surat <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nomorSurat}
              onChange={(e) => setNomorSurat(e.target.value)}
              placeholder="02/UNIGA/BERITA-ACARA/V/2026"
              maxLength={120}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <p className="mt-1 text-xs text-gray-500">
              Pakai format penomoran resmi kampus (mis.
              <span className="font-mono"> 02/UNIGA/BERITA-ACARA/V/2026</span>).
              Wajib diisi.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tanggal Serah Terima
              </label>
              <input
                type="date"
                value={handoverDate}
                onChange={(e) => setHandoverDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tempat
              </label>
              <input
                type="text"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
          </div>

          <fieldset className="rounded-lg border border-gray-200 p-3">
            <legend className="px-2 text-xs font-semibold uppercase text-gray-500">
              Pihak yang Menyerahkan
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nama
                </label>
                <input
                  type="text"
                  value={giverName}
                  onChange={(e) => setGiverName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Jabatan{" "}
                  <span className="text-xs font-normal text-gray-400">
                    (opsional)
                  </span>
                </label>
                <input
                  type="text"
                  value={giverPosition}
                  onChange={(e) => setGiverPosition(e.target.value)}
                  placeholder="contoh: Kepala BAUK"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="rounded-lg border border-gray-200 p-3">
            <legend className="px-2 text-xs font-semibold uppercase text-gray-500">
              Pihak yang Menerima
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nama
                </label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Jabatan{" "}
                  <span className="text-xs font-normal text-gray-400">
                    (opsional)
                  </span>
                </label>
                <input
                  type="text"
                  value={receiverPosition}
                  onChange={(e) => setReceiverPosition(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Unit Penerima
              </label>
              <select
                value={receiverUnit}
                onChange={(e) => setReceiverUnit(e.target.value)}
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
              {receiverUnit === "__custom__" && (
                <input
                  type="text"
                  value={receiverUnitCustom}
                  onChange={(e) => setReceiverUnitCustom(e.target.value)}
                  placeholder="Ketik nama unit"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              )}
            </div>
          </fieldset>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Daftar Barang ({selected.size} dipilih)
              </label>
              <input
                type="text"
                placeholder="Cari barang..."
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                className="w-48 rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2 w-8"></th>
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Nama</th>
                    <th className="px-3 py-2">Lokasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredItems.map((it) => (
                    <tr
                      key={it.item_id}
                      className="cursor-pointer hover:bg-blue-50"
                      onClick={() => toggle(it.item_id)}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selected.has(it.item_id)}
                          onChange={() => toggle(it.item_id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-blue-600">
                        {it.item_id}
                      </td>
                      <td className="px-3 py-2 font-medium">{it.name}</td>
                      <td className="px-3 py-2 text-gray-500">
                        {it.location || "-"}
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-6 text-center text-gray-400"
                      >
                        Tidak ada barang yang cocok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Keterangan{" "}
              <span className="text-xs font-normal text-gray-400">
                (opsional)
              </span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={updateInventoryLocation}
              onChange={(e) => setUpdateInventoryLocation(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Otomatis pindahkan lokasi inventaris ke unit penerima
          </label>

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
              disabled={saving || !canSubmit}
              className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Buat BAST
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
