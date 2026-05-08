"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Plus,
  Loader2,
  X,
  Upload,
  ExternalLink,
} from "lucide-react";
import type { ProcurementRequest, ProcurementStatus } from "@/types";

export default function ProcurementPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "Admin";

  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/procurement");
      const data = await res.json();
      setRequests(data.requests || []);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleComplete = async (requestId: string) => {
    if (!confirm("Selesaikan pengadaan ini dan tambahkan ke inventaris?"))
      return;
    setCompleting(requestId);
    try {
      await fetch("/api/procurement", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId, action: "complete" }),
      });
      await fetchRequests();
    } finally {
      setCompleting(null);
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
      await fetch("/api/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setShowForm(false);
      await fetchRequests();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Memuat pengadaan...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pengadaan</h1>
          <p className="text-sm text-gray-500">
            {requests.length} permintaan pengadaan
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
            {requests.map((req) => (
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
                        onClick={() => handleComplete(req.request_id)}
                        disabled={completing === req.request_id}
                        className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                      >
                        {completing === req.request_id && (
                          <Loader2 size={12} className="animate-spin" />
                        )}
                        Selesaikan
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td
                  colSpan={isAdmin ? 8 : 7}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  Belum ada permintaan pengadaan
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
      if (data.fileId) {
        setNotaFileId(data.fileId);
      }
    } catch {
      alert("Gagal mengupload file");
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
