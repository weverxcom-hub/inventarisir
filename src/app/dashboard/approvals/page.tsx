"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import type { ProcurementRequest } from "@/types";
import { apiFetch } from "@/lib/api-client";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorBanner from "@/components/ErrorBanner";
import { StatusBadge } from "@/components/Badge";

export default function ApprovalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const canApprove =
    session?.user?.role === "Approver" || session?.user?.role === "Admin";

  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && !canApprove) {
      router.replace("/dashboard");
    }
  }, [status, canApprove, router]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ requests: ProcurementRequest[] }>(
        "/api/procurement"
      );
      setRequests(data.requests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat persetujuan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (
    requestId: string,
    status: "Approved" | "Rejected"
  ) => {
    setActing(requestId);
    setError("");
    try {
      await apiFetch("/api/procurement", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId, status }),
      });
      await fetchRequests();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memproses persetujuan"
      );
    } finally {
      setActing(null);
    }
  };

  const pending = requests.filter((r) => r.status === "Pending");
  const processed = requests.filter((r) => r.status !== "Pending");

  if (loading || status === "loading" || !canApprove) {
    return <LoadingSpinner fullPage text="Memuat persetujuan..." />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Persetujuan Pengadaan</h1>
        <p className="text-sm text-gray-500">
          {pending.length} permintaan menunggu persetujuan
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

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
                          href={`/api/drive-file/${req.nota_photo_drive_id}`}
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
                  <th className="px-4 py-3">Diproses Oleh</th>
                  <th className="px-4 py-3">Pada</th>
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
                    <td className="px-4 py-3 text-gray-500">
                      {req.updated_by || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {req.updated_at
                        ? new Date(req.updated_at).toLocaleString("id-ID")
                        : "-"}
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
