"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Email atau password salah");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-blue-800 shadow-lg">
            UGM
          </div>
          <h1 className="text-2xl font-bold text-white">
            Universitas Gajayana Malang
          </h1>
          <p className="mt-1 text-sm text-blue-200">
            Sistem Inventaris & Pengadaan
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-8 shadow-2xl"
        >
          <h2 className="mb-6 text-center text-lg font-semibold text-gray-800">
            Masuk ke Akun Anda
          </h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="nama@unigamalang.ac.id"
              required
            />
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn size={16} />
            )}
            {loading ? "Memproses..." : "Masuk"}
          </button>

          {process.env.NEXT_PUBLIC_SSO_LOGIN_URL && (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400">atau</span>
                </div>
              </div>
              <a
                href={process.env.NEXT_PUBLIC_SSO_LOGIN_URL}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
              >
                Masuk dengan UNIGA SSO
              </a>
            </>
          )}
        </form>

        <p className="mt-6 text-center text-xs text-blue-300">
          &copy; {new Date().getFullYear()} Universitas Gajayana Malang
        </p>
      </div>
    </div>
  );
}
