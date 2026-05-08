"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import type { ProcurementRequest } from "@/types";

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

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

  const handleAction = async (requestId: string, status: "Approved" | "Rejected") => {
    setActing(requestId);
    try {
      await fetch("/api/procurement", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId, status }),
      });
      await fetchRequests();
    } finally {
      setActing(null);
    }
  };

  const pending = requests.filter((r) => r.status === "Pending");
  const processed = requests.filter((r) => r.status !== "Pending");

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Memuat persetujuan...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Persetujuan Pengadaan</h1>
        <p className="text-sm text-gray-500">
          {pending.length} permintaan menunggu persetujuan
        </p>
      </div>

      {/* Pending Requests */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">
            Menunggu Persetujuan
          </h2>
          <div className="space-y-3">
            {pending.map((req) => (
              <div
                key={req.request_id}
                className="rounded-xl border border-yellow-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-blue-600">
                        {req.request_id}
                      </span>
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">
                        Pending
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-semibold text-gray-800">
                      {req.item_name}
                    </h3>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span>Pemohon: {req.requestor_name}</span>
                      <span>Qty: {req.quantity}</span>
                      <span>
                        Rp {Number(req.estimated_price).toLocaleString("id-ID")}
                      </span>
                      {req.nota_photo_drive_id && (
                        <a
                          href={`https://drive.google.com/file/d/${req.nota_photo_drive_id}/view`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <ExternalLink size={12} />
                          Lihat Nota
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(req.request_id, "Approved")}
                      disabled={acting === req.request_id}
                      className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      {acting === req.request_id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle size={14} />
                      )}
                      Setujui
                    </button>
                    <button
                      onClick={() => handleAction(req.request_id, "Rejected")}
                      disabled={acting === req.request_id}
                      className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {acting === req.request_id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <XCircle size={14} />
                      )}
                      Tolak
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && (
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-400" />
          <p className="text-gray-500">
            Tidak ada permintaan yang menunggu persetujuan
          </p>
        </div>
      )}

      {/* Processed Requests */}
      {processed.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase text-gray-500">
            Riwayat
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Nama Barang</th>
                  <th className="px-4 py-3">Pemohon</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {processed.map((req) => (
                  <tr key={req.request_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">
                      {req.request_id}
                    </td>
                    <td className="px-4 py-3 font-medium">{req.item_name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {req.requestor_name}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={req.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
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
