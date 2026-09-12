"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Plus, Loader2, Upload, ExternalLink } from "lucide-react";
import type { ProcurementRequest } from "@/types";
import { apiFetch } from "@/lib/api-client";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorBanner from "@/components/ErrorBanner";
import Modal from "@/components/Modal";
import { FormField, TextInput } from "@/components/FormField";
import { StatusBadge } from "@/components/Badge";

export default function ProcurementPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "Admin";

  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ requests: ProcurementRequest[] }>(
        "/api/procurement"
      );
      setRequests(data.requests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat pengadaan");
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
    setError("");
    try {
      await apiFetch("/api/procurement", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId, action: "complete" }),
      });
      await fetchRequests();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menyelesaikan pengadaan"
      );
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
    setError("");
    try {
      await apiFetch("/api/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setShowForm(false);
      await fetchRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengajukan pengadaan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Memuat pengadaan..." />;
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

      {error && <ErrorBanner message={error} />}

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
                      href={`/api/drive-file/${req.nota_photo_drive_id}`}
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
  const [uploadError, setUploadError] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const data = await apiFetch<{ fileId?: string }>("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (data.fileId) {
        setNotaFileId(data.fileId);
      }
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Gagal mengupload file"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal title="Ajukan Pengadaan Baru" onClose={onClose}>
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
        <FormField label="Nama Barang">
          <TextInput
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            required
          />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Jumlah">
            <TextInput
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
            />
          </FormField>
          <FormField label="Estimasi Harga (Rp)">
            <TextInput
              type="number"
              min={0}
              value={estimatedPrice}
              onChange={(e) => setEstimatedPrice(Number(e.target.value))}
              required
            />
          </FormField>
        </div>
        <FormField label="Foto Nota (Opsional)">
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
          {uploadError && (
            <p className="mt-1.5 text-xs text-red-600">{uploadError}</p>
          )}
        </FormField>

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
    </Modal>
  );
}
