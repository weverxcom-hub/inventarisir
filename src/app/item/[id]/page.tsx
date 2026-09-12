"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import {
  MapPin,
  Tag,
  Hash,
  Calendar,
  Printer,
  Package,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import type { InventoryItem } from "@/types";
import { apiFetch } from "@/lib/api-client";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ConditionBadge } from "@/components/Badge";

export default function ItemDetailPage() {
  const params = useParams();
  const itemId = params.id as string;
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchItem() {
      try {
        const data = await apiFetch<{ item: InventoryItem }>(
          `/api/inventory/${itemId}`
        );
        setItem(data.item);
      } catch {
        setError("Item tidak ditemukan");
      } finally {
        setLoading(false);
      }
    }
    if (itemId) fetchItem();
  }, [itemId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner text="Memuat detail item..." />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <h1 className="text-lg font-semibold text-gray-800">
            {error || "Item tidak ditemukan"}
          </h1>
          <Link
            href="/dashboard/inventory"
            className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <ArrowLeft size={14} />
            Kembali ke Inventaris
          </Link>
        </div>
      </div>
    );
  }

  const itemUrl = typeof window !== "undefined"
    ? `${window.location.origin}/item/${item.item_id}`
    : "";

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard/inventory"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <ArrowLeft size={14} />
            Kembali
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            <Printer size={16} />
            Print Label
          </button>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* QR Code */}
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <QRCodeSVG value={itemUrl} size={160} />
              </div>
              <span className="font-mono text-xs text-gray-400">
                {item.item_id}
              </span>
            </div>

            {/* Details */}
            <div className="flex-1">
              <h1 className="mb-1 text-xl font-bold text-gray-800">
                {item.name}
              </h1>
              <ConditionBadge condition={item.condition} />

              <div className="mt-4 space-y-3">
                <DetailRow
                  icon={<Tag size={16} className="text-gray-400" />}
                  label="Kategori"
                  value={item.category}
                />
                <DetailRow
                  icon={<Hash size={16} className="text-gray-400" />}
                  label="Jumlah"
                  value={String(item.quantity)}
                />
                <DetailRow
                  icon={<MapPin size={16} className="text-gray-400" />}
                  label="Lokasi"
                  value={item.location}
                />
                <DetailRow
                  icon={<Calendar size={16} className="text-gray-400" />}
                  label="Ditambahkan"
                  value={
                    item.created_at
                      ? new Date(item.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "-"
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Print Label (hidden on screen, visible on print) */}
        <div id="print-label" className="hidden">
          <div className="label-qr">
            <QRCodeSVG value={itemUrl} size={80} />
          </div>
          <div className="label-info">
            <div className="label-logo">
              <div
                style={{
                  width: "1cm",
                  height: "1cm",
                  background: "#1d4ed8",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "6pt",
                  fontWeight: 700,
                }}
              >
                UGM
              </div>
            </div>
            <div className="label-name">{item.name}</div>
            <div className="label-id">{item.item_id}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value || "-"}</p>
      </div>
    </div>
  );
}
