"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type Staff = {
  id: string;
  name: string;
  username: string;
  employeeId: string;
  phone: string;
  department: string;
  isActive: boolean;
};

const emptyForm = {
  name: "",
  username: "",
  password: "",
  employeeId: "",
  phone: "",
  department: "",
  isActive: true,
};

export function StaffManager() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/staff");
    const json = await res.json();
    setStaff(json.staff || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(s: Staff) {
    setEditingId(s.id);
    setForm({
      name: s.name,
      username: s.username,
      password: "",
      employeeId: s.employeeId,
      phone: s.phone,
      department: s.department,
      isActive: s.isActive,
    });
  }

  function reset() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = editingId ? `/api/staff/${editingId}` : "/api/staff";
    const method = editingId ? "PATCH" : "POST";
    const payload = { ...form };
    if (editingId && !payload.password) {
      delete (payload as { password?: string }).password;
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error || "Failed to save");
      return;
    }

    reset();
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this staff member?")) return;
    await fetch(`/api/staff/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Staff</h1>
        <p className="text-sm text-subtext">Add and manage staff accounts</p>
      </div>

      <form
        onSubmit={onSubmit}
        className="bg-white rounded-[28px] card-shadow p-5 grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        <Field
          label="Name"
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v }))}
          required
        />
        <Field
          label="Username"
          value={form.username}
          onChange={(v) => setForm((f) => ({ ...f, username: v }))}
          required
        />
        <Field
          label={editingId ? "New password (optional)" : "Password"}
          type="password"
          value={form.password}
          onChange={(v) => setForm((f) => ({ ...f, password: v }))}
          required={!editingId}
        />
        <Field
          label="Employee ID"
          value={form.employeeId}
          onChange={(v) => setForm((f) => ({ ...f, employeeId: v }))}
        />
        <Field
          label="Phone"
          value={form.phone}
          onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
        />
        <Field
          label="Department"
          value={form.department}
          onChange={(v) => setForm((f) => ({ ...f, department: v }))}
        />
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) =>
              setForm((f) => ({ ...f, isActive: e.target.checked }))
            }
          />
          Active
        </label>
        {error ? (
          <p className="text-sm text-danger md:col-span-2">{error}</p>
        ) : null}
        <div className="flex gap-2 md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-primary text-white px-5 py-2.5 font-medium"
          >
            {editingId ? "Update staff" : "Add staff"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={reset}
              className="rounded-2xl border border-border px-5 py-2.5"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="bg-white rounded-[28px] card-shadow overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-soft-blue-2 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Employee ID</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3">{s.username}</td>
                <td className="px-4 py-3">{s.employeeId || "—"}</td>
                <td className="px-4 py-3">{s.department || "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      s.isActive
                        ? "text-emerald-700"
                        : "text-subtext"
                    }
                  >
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    onClick={() => startEdit(s)}
                    className="text-primary font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove(s.id)}
                    className="text-danger font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="relative mt-1">
        <input
          type={isPassword && visible ? "text" : type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-2xl border border-border bg-soft-blue-2 py-2.5 pl-3 ${
            isPassword ? "pr-11" : "pr-3"
          }`}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-subtext transition hover:text-primary"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}
