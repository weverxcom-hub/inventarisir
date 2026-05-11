"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Printer,
  FileSignature,
} from "lucide-react";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import { toPreviewUrl } from "@/lib/drive";

interface HandoverItem {
  item_id: string;
  name: string;
  category: string;
  quantity: number;
  condition: string;
}

interface HandoverData {
  bast_id: string;
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
  created_at: string;
  created_by: string;
}

export default function HandoverPrintPage() {
  const params = useParams();
  const search = useSearchParams();
  const id = params.id as string;
  const autoprint = search.get("autoprint") === "1";

  const [handover, setHandover] = useState<HandoverData | null>(null);
  const [items, setItems] = useState<HandoverItem[]>([]);
  const [letterheadUrl, setLetterheadUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/handovers/${encodeURIComponent(id)}`);
        if (!res.ok) {
          setError("Berita acara tidak ditemukan");
          return;
        }
        const data = await res.json();
        if (!mounted) return;
        setHandover(data.handover);
        setItems(data.items || []);
        setLetterheadUrl(data.settings?.letterhead_url || "");
      } catch {
        if (mounted) setError("Gagal memuat berita acara");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (autoprint && !loading && handover) {
      // Slight delay so the layout settles before the print dialog opens.
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [autoprint, loading, handover]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">Memuat berita acara...</p>
        </div>
      </div>
    );
  }

  if (error || !handover) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <FileSignature className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <h1 className="text-lg font-semibold text-gray-800">
            {error || "Berita acara tidak ditemukan"}
          </h1>
          <Link
            href="/dashboard/handovers"
            className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <ArrowLeft size={14} />
            Kembali ke Daftar BAST
          </Link>
        </div>
      </div>
    );
  }

  const dateLong = formatDateLong(handover.handover_date);

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6 print:bg-white print:p-0">
      {/* Action bar — hidden when printing */}
      <div className="mx-auto mb-4 flex w-full max-w-[210mm] items-center justify-between print:hidden">
        <Link
          href="/dashboard/handovers"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
        >
          <ArrowLeft size={14} />
          Kembali
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          <Printer size={16} />
          Cetak
        </button>
      </div>

      {/* Printable sheet — A4 dimensions */}
      <div className="mx-auto w-full max-w-[210mm] bg-white p-[18mm] text-sm leading-relaxed text-gray-900 shadow-sm print:max-w-none print:p-[18mm] print:shadow-none">
        {/* Kop */}
        {letterheadUrl ? (
          // Custom letterhead uploaded by Admin via Settings page.
          // Rendered as a single image so the official kop format stays
          // pixel-perfect regardless of how it was designed.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={toPreviewUrl(letterheadUrl, 1600)}
            alt="Kop Surat"
            className="mb-6 block w-full border-b-4 border-double border-gray-800 pb-3"
          />
        ) : (
          <header className="mb-6 flex items-center gap-4 border-b-4 border-double border-gray-800 pb-3">
            <div className="shrink-0">
              <Logo size={72} />
            </div>
            <div className="flex-1 text-center">
              <p className="text-[11px] font-semibold tracking-widest text-gray-700">
                YAYASAN PENDIDIKAN GAJAYANA
              </p>
              <h1 className="text-xl font-bold uppercase tracking-wide text-gray-900">
                Universitas Gajayana Malang
              </h1>
              <p className="text-[10px] text-gray-600">
                Jl. Mertojoyo Blok L &middot; Merjosari, Lowokwaru, Malang
                &middot; Telp. (0341) 562411
              </p>
              <p className="text-[10px] text-gray-600">
                Website: unigamalang.ac.id
              </p>
            </div>
          </header>
        )}

        {/* Title */}
        <div className="mb-5 text-center">
          <h2 className="text-base font-bold uppercase tracking-wide underline">
            Berita Acara Serah Terima Barang
          </h2>
          <p className="mt-1 text-xs text-gray-700">
            Nomor:{" "}
            <span className="font-semibold">
              {handover.nomor_surat || handover.bast_id}
            </span>
          </p>
        </div>

        {/* Body */}
        <p className="mb-3">
          Pada hari ini,{" "}
          <span className="font-semibold">{dateLong}</span>, bertempat di{" "}
          <span className="font-semibold">{handover.place}</span>, yang
          bertanda tangan di bawah ini:
        </p>

        <table className="mb-3 w-full border-collapse text-sm">
          <tbody>
            <tr>
              <td className="w-20 align-top">1.</td>
              <td className="w-32 align-top">Nama</td>
              <td className="w-3 align-top">:</td>
              <td className="font-semibold">{handover.giver_name}</td>
            </tr>
            <tr>
              <td></td>
              <td className="align-top">Jabatan</td>
              <td className="align-top">:</td>
              <td>{handover.giver_position || "-"}</td>
            </tr>
            <tr>
              <td></td>
              <td colSpan={3} className="pb-2 italic text-gray-700">
                Selanjutnya disebut sebagai{" "}
                <span className="font-semibold not-italic">PIHAK PERTAMA</span>
              </td>
            </tr>
            <tr>
              <td className="align-top">2.</td>
              <td className="align-top">Nama</td>
              <td className="align-top">:</td>
              <td className="font-semibold">{handover.receiver_name}</td>
            </tr>
            <tr>
              <td></td>
              <td className="align-top">Jabatan</td>
              <td className="align-top">:</td>
              <td>{handover.receiver_position || "-"}</td>
            </tr>
            <tr>
              <td></td>
              <td className="align-top">Unit</td>
              <td className="align-top">:</td>
              <td>{handover.receiver_unit}</td>
            </tr>
            <tr>
              <td></td>
              <td colSpan={3} className="italic text-gray-700">
                Selanjutnya disebut sebagai{" "}
                <span className="font-semibold not-italic">PIHAK KEDUA</span>
              </td>
            </tr>
          </tbody>
        </table>

        <p className="mb-3">
          PIHAK PERTAMA telah menyerahkan kepada PIHAK KEDUA, dan PIHAK KEDUA
          telah menerima dari PIHAK PERTAMA, barang inventaris milik
          Universitas Gajayana Malang dengan rincian sebagai berikut:
        </p>

        {/* Items table */}
        <table className="mb-4 w-full border-collapse border border-gray-700 text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-700 px-2 py-1 text-center">
                No.
              </th>
              <th className="border border-gray-700 px-2 py-1 text-left">
                Kode Barang
              </th>
              <th className="border border-gray-700 px-2 py-1 text-left">
                Nama Barang
              </th>
              <th className="border border-gray-700 px-2 py-1 text-left">
                Kategori
              </th>
              <th className="border border-gray-700 px-2 py-1 text-center">
                Jumlah
              </th>
              <th className="border border-gray-700 px-2 py-1 text-left">
                Kondisi
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={it.item_id}>
                <td className="border border-gray-700 px-2 py-1 text-center">
                  {idx + 1}
                </td>
                <td className="border border-gray-700 px-2 py-1 font-mono">
                  {it.item_id}
                </td>
                <td className="border border-gray-700 px-2 py-1 font-medium">
                  {it.name}
                </td>
                <td className="border border-gray-700 px-2 py-1">
                  {it.category}
                </td>
                <td className="border border-gray-700 px-2 py-1 text-center">
                  {it.quantity}
                </td>
                <td className="border border-gray-700 px-2 py-1">
                  {conditionLabel(it.condition)}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="border border-gray-700 px-2 py-2 text-center italic text-gray-500"
                >
                  Tidak ada rincian barang.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {handover.notes && (
          <div className="mb-4">
            <p className="font-semibold">Keterangan:</p>
            <p className="whitespace-pre-line text-gray-800">{handover.notes}</p>
          </div>
        )}

        <p className="mb-8">
          Demikian berita acara serah terima ini dibuat dengan sebenarnya, untuk
          dipergunakan sebagaimana mestinya.
        </p>

        {/* Signatures */}
        <div className="mt-10 grid grid-cols-2 gap-8 text-center">
          <div>
            <p className="mb-16">
              PIHAK PERTAMA
              <br />
              Yang Menyerahkan,
            </p>
            <div className="mx-auto inline-block min-w-[180px] border-b border-gray-700 pb-1">
              <p className="font-semibold">{handover.giver_name}</p>
            </div>
            <p className="text-xs text-gray-700">
              {handover.giver_position || ""}
            </p>
          </div>
          <div>
            <p className="mb-16">
              PIHAK KEDUA
              <br />
              Yang Menerima,
            </p>
            <div className="mx-auto inline-block min-w-[180px] border-b border-gray-700 pb-1">
              <p className="font-semibold">{handover.receiver_name}</p>
            </div>
            <p className="text-xs text-gray-700">
              {handover.receiver_position || ""}{" "}
              {handover.receiver_unit
                ? `— ${handover.receiver_unit}`
                : ""}
            </p>
          </div>
        </div>

        <div className="mt-10 border-t pt-2 text-center text-[10px] text-gray-400 print:text-gray-500">
          Dokumen ini diterbitkan oleh Sistem Inventaris UNIGA Malang &middot;{" "}
          {handover.bast_id}
        </div>
      </div>

      <div className="print:hidden">
        <Footer />
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          html,
          body {
            background: white;
          }
        }
      `}</style>
    </div>
  );
}

function formatDateLong(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function conditionLabel(c: string): string {
  switch (c) {
    case "Good":
      return "Baik";
    case "Repair":
      return "Perlu Perbaikan";
    case "Broken":
      return "Rusak";
    default:
      return c || "-";
  }
}
