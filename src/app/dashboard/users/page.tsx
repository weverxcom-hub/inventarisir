"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import type { UserRole } from "@/types";
import { apiFetch } from "@/lib/api-client";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorBanner from "@/components/ErrorBanner";
import Modal from "@/components/Modal";
import { FormField, TextInput, SelectInput } from "@/components/FormField";
import { RoleBadge } from "@/components/Badge";

interface UserData {
  name: string;
  email: string;
  role: UserRole;
}

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === "Admin";

  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [status, isAdmin, router]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ users: UserData[] }>("/api/users");
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat pengguna");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (email: string) => {
    if (!confirm("Hapus pengguna ini?")) return;
    setDeleting(email);
    setError("");
    try {
      await apiFetch(`/api/users?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus pengguna");
    } finally {
      setDeleting(null);
    }
  };

  const handleSubmit = async (formData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) => {
    setSaving(true);
    setError("");
    try {
      if (editUser) {
        const body: Record<string, string> = {
          email: formData.email,
          name: formData.name,
          role: formData.role,
        };
        if (formData.password) {
          body.password = formData.password;
        }
        await apiFetch("/api/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      setShowForm(false);
      setEditUser(null);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan pengguna");
    } finally {
      setSaving(false);
    }
  };

  if (loading || status === "loading" || !isAdmin) {
    return <LoadingSpinner fullPage text="Memuat pengguna..." />;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kelola Pengguna</h1>
          <p className="text-sm text-gray-500">
            {users.length} pengguna &middot; perubahan role baru berlaku
            setelah pengguna logout &amp; login kembali
          </p>
        </div>
        <button
          onClick={() => {
            setEditUser(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
        >
          <Plus size={16} />
          Tambah Pengguna
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.email} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3 text-gray-500">{user.email}</td>
                <td className="px-4 py-3">
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditUser(user);
                        setShowForm(true);
                      }}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-yellow-600"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(user.email)}
                      disabled={deleting === user.email}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 disabled:opacity-50"
                      title="Hapus"
                    >
                      {deleting === user.email ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-gray-400"
                >
                  Belum ada pengguna
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <UserFormModal
          user={editUser}
          saving={saving}
          onClose={() => {
            setShowForm(false);
            setEditUser(null);
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

function UserFormModal({
  user,
  saving,
  onClose,
  onSubmit,
}: {
  user: UserData | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) => void;
}) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(user?.role || "Staff");

  return (
    <Modal
      title={user ? "Edit Pengguna" : "Tambah Pengguna Baru"}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ name, email, password, role });
        }}
        className="space-y-4"
      >
        <FormField label="Nama">
          <TextInput
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Email">
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!!user}
            required
          />
        </FormField>
        <FormField
          label={`Password ${user ? "(kosongkan jika tidak ingin mengubah)" : ""}`}
        >
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={!user}
          />
        </FormField>
        <FormField label="Role">
          <SelectInput
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            <option value="Staff">Staff</option>
            <option value="Approver">Approver</option>
            <option value="Admin">Admin</option>
          </SelectInput>
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {user ? "Simpan" : "Tambah"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
