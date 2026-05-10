"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Printer, Search } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { InventoryItem } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";
import { apiFetch } from "@/lib/fetcher";

type LayoutKey = "avery21" | "single-a4" | "single-small";

const LAYOUTS: Record<
  LayoutKey,
  {
    label: string;
    description: string;
    pageSize: string;
    perPage: number;
    cols: number;
    labelWidthMm: number;
    labelHeightMm: number;
    qrPx: number;
    fontSize: string;
  }
> = {
  avery21: {
    label: "Stiker A4 (21 per lembar)",
    description:
      "70 × 42,3 mm — Avery 3652 / Tom & Jerry 103 (21 stiker per kertas A4)",
    pageSize: "A4",
    perPage: 21,
    cols: 3,
    labelWidthMm: 70,
    labelHeightMm: 42.3,
    qrPx: 96,
    fontSize: "8pt",
  },
  "single-a4": {
    label: "1 stiker per A4 (besar)",
    description:
      "Cocok untuk barang besar / yang gampang. Stiker dicetak besar di tengah kertas A4.",
    pageSize: "A4",
    perPage: 1,
    cols: 1,
    labelWidthMm: 180,
    labelHeightMm: 120,
    qrPx: 320,
    fontSize: "16pt",
  },
  "single-small": {
    label: "1 stiker per lembar kecil (10 × 6 cm)",
    description:
      "Untuk yang ngeprint di printer label kecil / kertas potong sendiri.",
    pageSize: "100mm 60mm",
    perPage: 1,
    cols: 1,
    labelWidthMm: 100,
    labelHeightMm: 60,
    qrPx: 140,
    fontSize: "11pt",
  },
};

export default function PrintStickersPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [layout, setLayout] = useState<LayoutKey>("avery21");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ items: InventoryItem[] }>("/api/inventory");
      setItems(data.items || []);
    } catch {
      /* toast */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (it) =>
        it.name.toLowerCase().includes(needle) ||
        it.item_id.toLowerCase().includes(needle) ||
        it.category.toLowerCase().includes(needle) ||
        it.location.toLowerCase().includes(needle)
    );
  }, [items, search]);

  const selectedItems = useMemo(
    () => items.filter((it) => selected.has(it.item_id)),
    [items, selected]
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(filtered.map((it) => it.item_id)));
  };

  const clearAll = () => {
    setSelected(new Set());
  };

  const cfg = LAYOUTS[layout];

  if (loading) return <LoadingSpinner fullPage text="Memuat inventaris..." />;

  return (
    <div className="print:bg-white">
      {/* Top bar — hidden when printing */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <Link
            href="/dashboard/inventory"
            className="mb-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <ArrowLeft size={14} />
            Kembali ke Inventaris
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Cetak Stiker QR</h1>
          <p className="text-sm text-gray-500">
            Pilih barang &amp; format stiker, lalu klik Cetak.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          disabled={selected.size === 0}
          className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Printer size={16} />
          Cetak {selected.size > 0 ? `(${selected.size})` : ""}
        </button>
      </div>

      {/* Layout chooser */}
      <div className="mb-4 grid gap-3 sm:grid-cols-3 print:hidden">
        {(Object.keys(LAYOUTS) as LayoutKey[]).map((k) => {
          const l = LAYOUTS[k];
          const active = k === layout;
          return (
            <button
              key={k}
              type="button"
              onClick={() => setLayout(k)}
              className={`rounded-xl border-2 px-4 py-3 text-left text-sm transition-colors ${
                active
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <p className="font-semibold text-gray-800">{l.label}</p>
              <p className="mt-1 text-xs text-gray-500">{l.description}</p>
            </button>
          );
        })}
      </div>

      {/* Item picker */}
      <div className="mb-4 flex flex-wrap gap-2 print:hidden">
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
        <button
          type="button"
          onClick={selectAll}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Pilih semua ({filtered.length})
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          disabled={selected.size === 0}
        >
          Bersihkan
        </button>
      </div>

      <div className="mb-6 max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-sm print:hidden">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="w-10 px-3 py-2"></th>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Nama</th>
              <th className="px-3 py-2">Kategori</th>
              <th className="px-3 py-2">Lokasi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((it) => (
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
                <td className="px-3 py-2 text-gray-500">{it.category}</td>
                <td className="px-3 py-2 text-gray-500">{it.location || "-"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-400">
                  Tidak ada barang yang cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mb-2 text-xs text-gray-500 print:hidden">
        Pratinjau {selectedItems.length} stiker —{" "}
        <span className="font-semibold">{cfg.label}</span>. Cetak browser:{" "}
        <kbd className="rounded border bg-gray-100 px-1">Ctrl/Cmd + P</kbd>.
      </div>

      {/* Sticker sheet — preview + printable */}
      <div className="sticker-sheet-wrap">
        {selectedItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-400 print:hidden">
            Belum ada barang dipilih untuk dicetak.
          </div>
        ) : (
          <div className={`sticker-sheet sticker-sheet-${layout}`}>
            {selectedItems.map((it) => (
              <Sticker
                key={it.item_id}
                item={it}
                origin={origin}
                qrPx={cfg.qrPx}
                fontSize={cfg.fontSize}
              />
            ))}
          </div>
        )}
      </div>

      {/* Print CSS — calibrated per layout */}
      <style jsx global>{`
        @media screen {
          .sticker-sheet-wrap {
            background: #f8fafc;
            padding: 12px;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
          }
          .sticker-sheet {
            display: grid;
            gap: 4mm;
            justify-content: center;
          }
        }
        .sticker-sheet-avery21 {
          grid-template-columns: repeat(3, ${LAYOUTS.avery21.labelWidthMm}mm);
        }
        .sticker-sheet-single-a4,
        .sticker-sheet-single-small {
          grid-template-columns: 1fr;
          justify-items: center;
        }
        .sticker {
          box-sizing: border-box;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          padding: 2mm 3mm;
          display: flex;
          align-items: center;
          gap: 3mm;
          width: ${cfg.labelWidthMm}mm;
          height: ${cfg.labelHeightMm}mm;
          overflow: hidden;
        }
        .sticker-qr {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sticker-info {
          flex: 1;
          min-width: 0;
        }
        .sticker-brand {
          display: flex;
          align-items: center;
          gap: 2mm;
          font-size: 6.5pt;
          font-weight: 600;
          color: #1e3a8a;
          margin-bottom: 1mm;
        }
        .sticker-name {
          font-weight: 700;
          color: #111827;
          line-height: 1.15;
          margin-bottom: 1mm;
          word-break: break-word;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .sticker-id {
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-size: 0.85em;
          color: #2563eb;
        }
        .sticker-meta {
          font-size: 0.75em;
          color: #6b7280;
          margin-top: 1mm;
        }

        @media print {
          @page {
            size: ${cfg.pageSize};
            margin: ${
              layout === "avery21"
                ? "15.1mm 7mm"
                : layout === "single-a4"
                ? "0"
                : "0"
            };
          }
          html,
          body {
            background: white !important;
          }
          /* Hide everything that isn't the sticker sheet on print */
          body * {
            visibility: hidden !important;
          }
          .sticker-sheet-wrap,
          .sticker-sheet-wrap * {
            visibility: visible !important;
          }
          .sticker-sheet-wrap {
            position: absolute;
            inset: 0;
            background: white !important;
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .sticker-sheet {
            display: grid;
            gap: 0 !important;
          }
          .sticker-sheet-avery21 {
            grid-template-columns: repeat(3, 70mm);
            grid-auto-rows: 42.3mm;
          }
          .sticker-sheet-single-a4 {
            justify-items: center;
            align-content: center;
            height: 100%;
          }
          .sticker-sheet-single-small {
            justify-items: center;
            align-content: center;
            height: 100%;
          }
          .sticker {
            border: none !important;
            border-radius: 0 !important;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .sticker-sheet-single-a4 .sticker,
          .sticker-sheet-single-small .sticker {
            page-break-after: always;
            break-after: page;
          }
        }
      `}</style>
    </div>
  );
}

function Sticker({
  item,
  origin,
  qrPx,
  fontSize,
}: {
  item: InventoryItem;
  origin: string;
  qrPx: number;
  fontSize: string;
}) {
  const url = origin ? `${origin}/item/${item.item_id}` : `/item/${item.item_id}`;
  return (
    <div className="sticker" style={{ fontSize }}>
      <div className="sticker-qr">
        {origin ? (
          <QRCodeSVG value={url} size={qrPx} />
        ) : (
          <div
            style={{ width: qrPx, height: qrPx, background: "#f3f4f6" }}
          >
            <Loader2 className="h-full w-full animate-spin text-gray-300" />
          </div>
        )}
      </div>
      <div className="sticker-info">
        <div className="sticker-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-uniga.png"
            alt="UNIGA"
            style={{ width: "8mm", height: "8mm", objectFit: "contain" }}
          />
          <span>UNIGA MALANG</span>
        </div>
        <div className="sticker-name">{item.name}</div>
        <div className="sticker-id">{item.item_id}</div>
        {item.location && (
          <div className="sticker-meta">{item.location}</div>
        )}
      </div>
    </div>
  );
}
