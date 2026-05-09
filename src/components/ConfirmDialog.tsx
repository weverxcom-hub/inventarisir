"use client";

import { ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  loading = false,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              destructive ? "bg-red-100" : "bg-blue-100"
            }`}
          >
            <AlertTriangle
              size={20}
              className={destructive ? "text-red-600" : "text-blue-700"}
            />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-gray-800">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-gray-600">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-60 ${
              destructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-700 hover:bg-blue-800"
            }`}
          >
            {loading ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
