"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Building2,
  Download,
  Eye,
  EyeOff,
  FileText,
  Pencil,
  Search,
  Trash2,
  UserPlus,
  WalletCards,
  X,
} from "lucide-react";
import { UserAvatar } from "@/components/staff/user-avatar";

type Staff = {
  id: string;
  name: string;
  username: string;
  employeeId: string;
  phone: string;
  department: string;
  isActive: boolean;
};

type StaffDocument = {
  id: string;
  title: string;
  fileName: string;
  filePath: string;
  createdAt: string;
  user?: { id: string; name: string; username: string };
};

type SalarySlip = {
  id: string;
  month: number;
  year: number;
  fileName: string;
  filePath: string;
  netPay: number | null;
  createdAt: string;
};

type StaffDetail = Staff & {
  avatarPath: string | null;
  bankAccountHolder: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  documents: StaffDocument[];
  slips: SalarySlip[];
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
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<StaffDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/staff");
    const json = await res.json();
    setStaff(json.staff || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetailError("");
    const res = await fetch(`/api/staff/${id}`);
    const json = await res.json();
    setDetailLoading(false);
    if (!res.ok) {
      setDetail(null);
      setDetailError(json.error || "Failed to load staff details");
      return;
    }
    setDetail(json.staff || null);
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const filteredStaff = staff.filter((s) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [s.name, s.username, s.employeeId, s.phone, s.department]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

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

  async function removeDocument(id: string) {
    if (!confirm("Delete this staff document? This cannot be undone.")) return;
    setDetailError("");
    const res = await fetch(`/api/admin/documents?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok) {
      setDetailError(json.error || "Failed to delete document");
      return;
    }
    if (selectedId) loadDetail(selectedId);
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Staff
        </h1>
        <p className="mt-1 text-sm text-subtext">
          Add and manage staff accounts
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="liquid-glass grid grid-cols-1 gap-3 rounded-[24px] p-4 sm:rounded-[28px] sm:p-5 md:grid-cols-2"
      >
        <div className="mb-1 flex items-center gap-2 md:col-span-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-soft-blue text-primary">
            <UserPlus className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">
              {editingId ? "Edit staff" : "Add staff"}
            </p>
            <p className="text-xs text-subtext">
              {editingId
                ? "Update account details below"
                : "Create a new staff login"}
            </p>
          </div>
        </div>

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
            className="h-4 w-4 rounded border-border text-primary"
          />
          Active
        </label>
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger md:col-span-2">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {loading
              ? "Saving..."
              : editingId
                ? "Update staff"
                : "Add staff"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={reset}
              className="rounded-2xl border border-border bg-white/70 px-5 py-2.5 text-sm font-medium transition hover:bg-white"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="liquid-glass overflow-hidden rounded-[24px] sm:rounded-[28px]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/60 px-4 py-4">
          <div>
            <p className="text-sm font-semibold">Staff list</p>
            <p className="text-xs text-subtext">
              Search a person, then open their profile, documents, and bank details
            </p>
          </div>
          <label className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtext" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, ID, phone..."
              className="field-input pl-9"
            />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-white/60 bg-soft-blue-2/70 text-left text-xs uppercase tracking-wide text-subtext">
                <th className="px-4 py-3.5 font-semibold">Name</th>
                <th className="px-4 py-3.5 font-semibold">Username</th>
                <th className="px-4 py-3.5 font-semibold">Employee ID</th>
                <th className="px-4 py-3.5 font-semibold">Department</th>
                <th className="px-4 py-3.5 font-semibold">Status</th>
                <th className="px-4 py-3.5 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((s) => (
                <tr
                  key={s.id}
                  className="border-t border-white/50 transition hover:bg-white/40"
                >
                  <td className="px-4 py-3.5 font-medium">{s.name}</td>
                  <td className="px-4 py-3.5 text-subtext">@{s.username}</td>
                  <td className="px-4 py-3.5">{s.employeeId || "—"}</td>
                  <td className="px-4 py-3.5">{s.department || "—"}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={
                        s.isActive
                          ? "inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                          : "inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-subtext"
                      }
                    >
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedId(s.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-soft-blue px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Details
                      </button>
                      <button
                        onClick={() => startEdit(s)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-soft-blue px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => remove(s.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger hover:text-white"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStaff.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-subtext"
                  >
                    {staff.length === 0
                      ? "No staff accounts yet"
                      : "No staff match that search"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {selectedId ? (
        <StaffDetailPanel
          detail={detail}
          loading={detailLoading}
          error={detailError}
          onClose={() => setSelectedId(null)}
          onDeleteDocument={removeDocument}
        />
      ) : null}
    </div>
  );
}

function StaffDetailPanel({
  detail,
  loading,
  error,
  onClose,
  onDeleteDocument,
}: {
  detail: StaffDetail | null;
  loading: boolean;
  error: string;
  onClose: () => void;
  onDeleteDocument: (id: string) => void;
}) {
  const bankRows = detail
    ? [
        ["Account holder", detail.bankAccountHolder],
        ["Bank", detail.bankName],
        ["Account number", detail.accountNumber],
        ["IFSC", detail.ifscCode],
        ["Branch", detail.branchName],
      ]
    : [];
  const hasBank = bankRows.some(([, value]) => value);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-3 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="liquid-glass max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-[28px] p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar
              name={detail?.name}
              avatarPath={detail?.avatarPath}
              className="h-14 w-14 shrink-0 rounded-2xl"
              textClassName="font-heading text-xl"
            />
            <div className="min-w-0">
              <p className="truncate font-heading text-xl font-semibold">
                {detail?.name || "Staff details"}
              </p>
              <p className="truncate text-sm text-subtext">
                {detail
                  ? `@${detail.username} · ${detail.employeeId || "No employee ID"}`
                  : "Loading profile"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/70 p-2 text-subtext transition hover:text-primary"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        {loading && !detail ? (
          <p className="py-10 text-center text-sm text-subtext">
            Loading staff details...
          </p>
        ) : null}

        {detail ? (
          <div className="space-y-4">
            <section className="rounded-[22px] border border-white/70 bg-white/50 p-4">
              <p className="mb-3 text-sm font-semibold">Profile</p>
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  ["Phone", detail.phone],
                  ["Department", detail.department],
                  ["Employee ID", detail.employeeId],
                  ["Status", detail.isActive ? "Active" : "Inactive"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl bg-soft-blue-2/80 px-4 py-3"
                  >
                    <dt className="text-[11px] font-medium uppercase tracking-wide text-subtext">
                      {label}
                    </dt>
                    <dd className="mt-1 break-all text-sm font-medium">
                      {value || "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-[22px] border border-white/70 bg-white/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Bank details</p>
              </div>
              {hasBank ? (
                <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {bankRows.map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl bg-soft-blue-2/80 px-4 py-3"
                    >
                      <dt className="text-[11px] font-medium uppercase tracking-wide text-subtext">
                        {label}
                      </dt>
                      <dd className="mt-1 break-all text-sm font-medium">
                        {value || "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="rounded-2xl bg-soft-blue-2/50 px-4 py-6 text-center text-sm text-subtext">
                  No bank details saved
                </p>
              )}
            </section>

            <section className="rounded-[22px] border border-white/70 bg-white/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Documents</p>
              </div>
              <ul className="space-y-2">
                {detail.documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-soft-blue-2/70 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{doc.title}</p>
                      <p className="truncate text-xs text-subtext">
                        {doc.fileName} ·{" "}
                        {format(new Date(doc.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={doc.filePath}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-soft-blue px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </a>
                      <button
                        type="button"
                        onClick={() => onDeleteDocument(doc.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger hover:text-white"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
                {detail.documents.length === 0 ? (
                  <li className="rounded-2xl bg-soft-blue-2/50 px-4 py-6 text-center text-sm text-subtext">
                    No documents uploaded
                  </li>
                ) : null}
              </ul>
            </section>

            <section className="rounded-[22px] border border-white/70 bg-white/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <WalletCards className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Salary slips</p>
              </div>
              <ul className="space-y-2">
                {detail.slips.map((slip) => (
                  <li
                    key={slip.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-soft-blue-2/70 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {format(new Date(slip.year, slip.month - 1, 1), "MMMM yyyy")}
                      </p>
                      <p className="truncate text-xs text-subtext">
                        {slip.netPay != null
                          ? `Net pay · ₹${slip.netPay.toLocaleString("en-IN")}`
                          : slip.fileName}
                      </p>
                    </div>
                    <a
                      href={slip.filePath}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-soft-blue px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                  </li>
                ))}
                {detail.slips.length === 0 ? (
                  <li className="rounded-2xl bg-soft-blue-2/50 px-4 py-6 text-center text-sm text-subtext">
                    No salary slips uploaded
                  </li>
                ) : null}
              </ul>
            </section>
          </div>
        ) : null}
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
      <label className="mb-1.5 block text-xs font-medium text-subtext">
        {label}
      </label>
      <div className="relative">
        <input
          type={isPassword && visible ? "text" : type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`field-input ${isPassword ? "pr-11" : ""}`}
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
