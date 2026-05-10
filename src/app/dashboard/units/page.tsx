"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Loader2, X, Building2 } from "lucide-react";
import type { Unit } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import ConfirmDialog from "@/components/ConfirmDialog";
import { apiFetch } from "@/lib/fetcher";

interface UnitFormData {
  name: string;
  code: string;
  description: string;
}

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUnit, setEditUnit] = useState<Unit | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ units: Unit[] }>("/api/units");
      setUnits(data.units || []);
    } catch {
      /* surfaced via toast */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(
        `/api/units/${encodeURIComponent(deleteTarget.unit_id)}`,
        {
          method: "DELETE",
          successMessage: "Unit dihapus",
        }
      );
      setDeleteTarget(null);
      await fetchUnits();
    } catch {
      /* toast */
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (formData: UnitFormData) => {
    setSaving(true);
    try {
      if (editUnit) {
        await apiFetch(`/api/units/${encodeURIComponent(editUnit.unit_id)}`, {
          method: "PUT",
          body: JSON.stringify(formData),
          successMessage: "Unit diperbarui",
        });
      } else {
        await apiFetch("/api/units", {
          method: "POST",
          body: JSON.stringify(formData),
          successMessage: "Unit ditambahkan",
        });
      }
      setShowForm(false);
      setEditUnit(null);
      await fetchUnits();
    } catch {
      /* toast */
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage text="Memuat unit..." />;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kelola Unit</h1>
          <p className="text-sm text-gray-500">
            {units.length} unit (Fakultas / Bagian / Biro)
          </p>
        </div>
        <button
          onClick={() => {
            setEditUnit(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
        >
          <Plus size={16} />
          Tambah Unit
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Nama Unit</th>
              <th className="px-4 py-3">Kode</th>
              <th className="px-4 py-3">Keterangan</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {units.map((unit) => (
              <tr key={unit.unit_id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-blue-600">
                  {unit.unit_id}
                </td>
                <td className="px-4 py-3 font-medium">{unit.name}</td>
                <td className="px-4 py-3 text-gray-500">{unit.code || "-"}</td>
                <td className="px-4 py-3 text-gray-500">
                  {unit.description || "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditUnit(unit);
                        setShowForm(true);
                      }}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-yellow-600"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(unit)}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {units.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-gray-400"
                >
                  <Building2 className="mx-auto mb-2 h-10 w-10 text-gray-300" />
                  Belum ada unit. Klik &ldquo;Tambah Unit&rdquo; untuk mulai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <UnitFormModal
          unit={editUnit}
          saving={saving}
          onClose={() => {
            setShowForm(false);
            setEditUnit(null);
          }}
          onSubmit={handleSubmit}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus unit ini?"
        description={
          deleteTarget
            ? `Unit "${deleteTarget.name}" akan dihapus. Data inventaris yang sudah memakai nama unit ini tetap aman, tapi tidak lagi muncul di dropdown.`
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

function UnitFormModal({
  unit,
  saving,
  onClose,
  onSubmit,
}: {
  unit: Unit | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: UnitFormData) => void;
}) {
  const [name, setName] = useState(unit?.name || "");
  const [code, setCode] = useState(unit?.code || "");
  const [description, setDescription] = useState(unit?.description || "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {unit ? "Edit Unit" : "Tambah Unit Baru"}
          </h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              name: name.trim(),
              code: code.trim(),
              description: description.trim(),
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nama Unit
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="contoh: Fakultas Hukum"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Kode{" "}
              <span className="text-xs font-normal text-gray-400">
                (opsional)
              </span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="contoh: FH"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Keterangan{" "}
              <span className="text-xs font-normal text-gray-400">
                (opsional)
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
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
              {unit ? "Simpan" : "Tambah"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
