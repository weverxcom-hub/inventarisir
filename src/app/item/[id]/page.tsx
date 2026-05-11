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
  Loader2,
  Package,
  ArrowLeft,
  ImageIcon,
  Receipt,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import type { InventoryItem } from "@/types";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";

export default function ItemDetailPage() {
  const params = useParams();
  const itemId = params.id as string;
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchItem() {
      try {
        const res = await fetch(`/api/inventory/${itemId}`);
        if (!res.ok) {
          setError("Item tidak ditemukan");
          return;
        }
        const data = await res.json();
        setItem(data.item);
      } catch {
        setError("Gagal memuat data item");
      } finally {
        setLoading(false);
      }
    }
    if (itemId) fetchItem();
  }, [itemId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Memuat detail item...</p>
        </div>
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

  const conditionStyles: Record<string, { bg: string; text: string; label: string }> = {
    Good: { bg: "bg-green-100", text: "text-green-700", label: "Baik" },
    Repair: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Perlu Perbaikan" },
    Broken: { bg: "bg-red-100", text: "text-red-700", label: "Rusak" },
  };

  const cond = conditionStyles[item.condition] || conditionStyles.Good;

  const photoSrc = toPreviewUrl(item.photo_url);
  const receiptSrc = toPreviewUrl(item.receipt_url);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 px-4 py-8">
      <div className="mx-auto w-full max-w-3xl flex-1">
        {/* Brand header */}
        <div className="mb-6 flex items-center justify-center gap-3">
          <Logo size={36} />
          <div className="text-center">
            <p className="text-sm font-bold text-blue-800">
              Universitas Gajayana Malang
            </p>
            <p className="text-[11px] text-gray-500">
              Sistem Inventaris &amp; Pengadaan
            </p>
          </div>
        </div>

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
              <span
                className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${cond.bg} ${cond.text}`}
              >
                {cond.label}
              </span>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  label="Lokasi / Unit"
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

        {/* Photo + Nota */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <AssetCard
            title="Foto Item"
            icon={<ImageIcon size={16} />}
            previewSrc={photoSrc}
            originalUrl={item.photo_url}
            emptyLabel="Belum ada foto item diunggah."
          />
          <AssetCard
            title="Nota Pembelian"
            icon={<Receipt size={16} />}
            previewSrc={receiptSrc}
            originalUrl={item.receipt_url}
            emptyLabel="Belum ada foto nota diunggah."
          />
        </div>

        {/* Print Label (hidden on screen, visible on print) */}
        <div id="print-label" className="hidden">
          <div className="label-qr">
            <QRCodeSVG value={itemUrl} size={80} />
          </div>
          <div className="label-info">
            <div className="label-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-uniga.png"
                alt="UNIGA"
                style={{ width: "1cm", height: "1cm" }}
              />
            </div>
            <div className="label-name">{item.name}</div>
            <div className="label-id">{item.item_id}</div>
          </div>
        </div>
      </div>
      <Footer />
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

/**
 * Convert a Google Drive `webViewLink` (https://drive.google.com/file/d/{id}/view)
 * into an inline-renderable thumbnail URL. For non-Drive URLs, return as-is.
 */
function toPreviewUrl(url: string): string {
  if (!url) return "";
  const driveMatch = url.match(/\/file\/d\/([^/]+)/);
  if (driveMatch) {
    return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w800`;
  }
  return url;
}

function AssetCard({
  title,
  icon,
  previewSrc,
  originalUrl,
  emptyLabel,
}: {
  title: string;
  icon: React.ReactNode;
  previewSrc: string;
  originalUrl: string;
  emptyLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          {icon}
          {title}
        </h2>
        {originalUrl && (
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
            title="Buka di tab baru"
          >
            <ExternalLink size={12} />
            Buka
          </a>
        )}
      </div>
      {originalUrl ? (
        <a
          href={originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewSrc}
            alt={title}
            className="aspect-video w-full bg-white object-contain"
            onError={(e) => {
              const t = e.currentTarget;
              t.onerror = null;
              t.style.display = "none";
              const fallback = t.parentElement?.querySelector(
                "[data-fallback]"
              ) as HTMLElement | null;
              if (fallback) fallback.style.display = "flex";
            }}
          />
          <div
            data-fallback
            style={{ display: "none" }}
            className="aspect-video w-full items-center justify-center bg-gray-50 text-xs text-gray-400"
          >
            Pratinjau tidak tersedia — klik untuk buka file asli
          </div>
        </a>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-xs text-gray-400">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}
