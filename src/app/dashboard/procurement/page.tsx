"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Plus,
  Loader2,
  X,
  Upload,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import type { ProcurementRequest, ProcurementStatus } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import ConfirmDialog from "@/components/ConfirmDialog";
import { apiFetch } from "@/lib/fetcher";

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "Semua" },
  { value: "Pending", label: "Pending" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
  { value: "Completed", label: "Completed" },
];

export default function ProcurementPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "Admin";

  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completeTarget, setCompleteTarget] =
    useState<ProcurementRequest | null>(null);
  const [completing, setCompleting] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ requests: ProcurementRequest[] }>(
        "/api/procurement"
      );
      setRequests(data.requests || []);
    } catch {
      /* surfaced via toast */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filtered = useMemo(() => {
    if (!statusFilter) return requests;
    return requests.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

  const confirmComplete = async () => {
    if (!completeTarget) return;
    setCompleting(true);
    try {
      await apiFetch("/api/procurement", {
        method: "PUT",
        body: JSON.stringify({
          request_id: completeTarget.request_id,
          action: "complete",
        }),
        successMessage: "Pengadaan diselesaikan & ditambahkan ke inventaris",
      });
      setCompleteTarget(null);
      await fetchRequests();
    } catch {
      /* toast */
    } finally {
      setCompleting(false);
    }
  };

  const handleSubmit = async (formData: {
    item_name: string;
    quantity: number;
    estimated_price: number;
    nota_photo_drive_id: string;
  }) => {
    setSaving(true);
    try {
      await apiFetch("/api/procurement", {
        method: "POST",
        body: JSON.stringify(formData),
        successMessage: "Permintaan pengadaan diajukan",
      });
      setShowForm(false);
      await fetchRequests();
    } catch {
      /* toast */
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Memuat pengadaan..." />;
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pengadaan</h1>
          <p className="text-sm text-gray-500">
            {filtered.length} dari {requests.length} permintaan
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
        >
          <Plus size={16} />
          Ajukan Pengadaan
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === opt.value
                ? "bg-blue-700 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Pemohon</th>
              <th className="px-4 py-3">Nama Barang</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Estimasi Harga</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Nota</th>
              {isAdmin && <th className="px-4 py-3">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((req) => (
              <tr key={req.request_id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-blue-600">
                  {req.request_id}
                </td>
                <td className="px-4 py-3 font-medium">{req.requestor_name}</td>
                <td className="px-4 py-3">{req.item_name}</td>
                <td className="px-4 py-3">{req.quantity}</td>
                <td className="px-4 py-3">
                  Rp {Number(req.estimated_price).toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={req.status} />
                </td>
                <td className="px-4 py-3">
                  {req.nota_photo_drive_id ? (
                    <a
                      href={`https://drive.google.com/file/d/${req.nota_photo_drive_id}/view`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      <ExternalLink size={12} />
                      Lihat
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    {req.status === "Approved" && (
                      <button
                        onClick={() => setCompleteTarget(req)}
                        className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                      >
                        Selesaikan
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={isAdmin ? 8 : 7}
                  className="px-4 py-12 text-center text-gray-400"
                >
                  {requests.length === 0
                    ? "Belum ada permintaan pengadaan"
                    : "Tidak ada permintaan dengan status ini"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <ProcurementFormModal
          saving={saving}
          onClose={() => setShowForm(false)}
          onSubmit={handleSubmit}
        />
      )}

      <ConfirmDialog
        open={!!completeTarget}
        title="Selesaikan pengadaan?"
        description={
          completeTarget
            ? `Permintaan "${completeTarget.item_name}" akan ditandai selesai dan otomatis ditambahkan ke inventaris.`
            : ""
        }
        confirmLabel="Selesaikan"
        loading={completing}
        onConfirm={confirmComplete}
        onCancel={() => setCompleteTarget(null)}
      />
    </div>
  );
}

function ProcurementFormModal({
  saving,
  onClose,
  onSubmit,
}: {
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: {
    item_name: string;
    quantity: number;
    estimated_price: number;
    nota_photo_drive_id: string;
  }) => void;
}) {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [notaFileId, setNotaFileId] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
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
      if (data.fileId) {
        setNotaFileId(data.fileId);
        toast.success("Nota berhasil diupload");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengupload file"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ajukan Pengadaan Baru</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              item_name: itemName,
              quantity,
              estimated_price: estimatedPrice,
              nota_photo_drive_id: notaFileId,
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nama Barang
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Estimasi Harga (Rp)
              </label>
              <input
                type="number"
                min={0}
                value={estimatedPrice}
                onChange={(e) => setEstimatedPrice(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Foto Nota (Opsional)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                {uploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                {uploading ? "Mengupload..." : "Pilih File"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
              {notaFileId && (
                <span className="text-xs text-green-600">
                  File berhasil diupload
                </span>
              )}
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
              Ajukan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ProcurementStatus | string }) {
  const styles: Record<string, string> = {
    Pending: "bg-yellow-100 text-yellow-700",
    Approved: "bg-blue-100 text-blue-700",
    Rejected: "bg-red-100 text-red-700",
    Completed: "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status}
    </span>
  );
}
