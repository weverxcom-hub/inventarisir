"use client";

import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  text?: string;
  fullPage?: boolean;
}

export default function LoadingSpinner({
  text = "Memuat...",
  fullPage = false,
}: LoadingSpinnerProps) {
  if (fullPage) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-500">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{text}</span>
    </div>
  );
}
