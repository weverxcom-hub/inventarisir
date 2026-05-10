"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import { apiFetch } from "@/lib/fetcher";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [letterheadUrl, setLetterheadUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (session?.user?.role !== "Admin") {
      router.push("/dashboard");
      return;
    }
    (async () => {
      try {
        const data = await apiFetch<{ settings: Record<string, string> }>(
          "/api/settings"
        );
        setLetterheadUrl(data.settings?.letterhead_url || "");
      } catch {
        /* toast */
      } finally {
        setLoading(false);
      }
    })();
  }, [session, status, router]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal mengupload kop surat");
      const url: string = data.webViewLink || "";
      if (!url) throw new Error("URL kop surat tidak diterima dari Drive");
      await persist(url);
      setLetterheadUrl(url);
      toast.success("Kop surat berhasil diperbarui");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengupload kop surat"
      );
    } finally {
      setUploading(false);
    }
  };

  const persist = async (url: string) => {
    setSaving(true);
    try {
      await apiFetch("/api/settings", {
        method: "PUT",
        body: JSON.stringify({ letterhead_url: url }),
        notifyOnError: false,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/settings", {
        method: "PUT",
        body: JSON.stringify({ letterhead_url: "" }),
        successMessage: "Kop surat dihapus, kembali ke kop bawaan",
      });
      setLetterheadUrl("");
    } catch {
      /* toast */
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage text="Memuat pengaturan..." />;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pengaturan</h1>
        <p className="text-sm text-gray-500">
          Kelola kop surat dan tampilan dokumen yang dicetak.
        </p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          <ImageIcon className="mt-0.5 h-5 w-5 text-blue-600" />
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              Kop Surat (Letterhead)
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Gambar ini akan otomatis dipakai di header semua Berita Acara
              Serah Terima yang dicetak. Bisa diganti kapan saja. Kalau
              dikosongkan, sistem balik ke kop bawaan UNIGA.
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Disarankan: rasio panjang ~ 4.3 : 1 (mis. 1450 × 340 px), format
              PNG/JPG, ukuran ≤ 2 MB.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">
          {letterheadUrl ? (
            <div className="flex flex-col items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={letterheadUrl}
                alt="Kop surat saat ini"
                className="max-h-40 w-full max-w-full rounded border border-gray-200 bg-white object-contain p-2"
              />
              <a
                href={letterheadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                Lihat sumber
              </a>
            </div>
          ) : (
            <p className="text-xs italic text-gray-500">
              Belum ada kop surat di-upload — sistem pakai kop bawaan UNIGA.
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {uploading ? "Mengunggah..." : "Unggah Kop Baru"}
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              disabled={uploading || saving}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = "";
              }}
            />
          </label>
          {letterheadUrl && (
            <button
              type="button"
              onClick={handleClear}
              disabled={uploading || saving}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60"
            >
              <Trash2 size={14} />
              Pakai kop bawaan
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
