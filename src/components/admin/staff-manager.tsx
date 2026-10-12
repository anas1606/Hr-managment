"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Eye,
  EyeOff,
  FileText,
  Pencil,
  Trash2,
  Upload,
  UserPlus,
  WalletCards,
} from "lucide-react";

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
  user: { id: string; name: string; username: string };
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
  const [slipStaffId, setSlipStaffId] = useState("");
  const [slipMonth, setSlipMonth] = useState(String(new Date().getMonth() + 1));
  const [slipYear, setSlipYear] = useState(String(new Date().getFullYear()));
  const [slipNetPay, setSlipNetPay] = useState("");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipBusy, setSlipBusy] = useState(false);
  const [slipMsg, setSlipMsg] = useState("");
  const [docStaffId, setDocStaffId] = useState("");
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docMsg, setDocMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/staff");
    const json = await res.json();
    setStaff(json.staff || []);
  }, []);

  const loadDocuments = useCallback(async () => {
    setDocsLoading(true);
    setDocMsg("");
    const params = docStaffId ? `?userId=${encodeURIComponent(docStaffId)}` : "";
    const res = await fetch(`/api/admin/documents${params}`);
    const json = await res.json();
    setDocsLoading(false);
    if (!res.ok) {
      setDocMsg(json.error || "Failed to load documents");
      setDocuments([]);
      return;
    }
    setDocuments(json.documents || []);
  }, [docStaffId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

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
    setDocMsg("");
    const res = await fetch(`/api/admin/documents?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!res.ok) {
      setDocMsg(json.error || "Failed to delete document");
      return;
    }
    setDocMsg("Document deleted");
    loadDocuments();
  }

  async function uploadSlip(e: FormEvent) {
    e.preventDefault();
    if (!slipStaffId || !slipFile) {
      setSlipMsg("Select staff and a file");
      return;
    }
    setSlipBusy(true);
    setSlipMsg("");
    const formData = new FormData();
    formData.set("userId", slipStaffId);
    formData.set("month", slipMonth);
    formData.set("year", slipYear);
    if (slipNetPay) formData.set("netPay", slipNetPay);
    formData.set("file", slipFile);
    const res = await fetch("/api/admin/salary-slips", {
      method: "POST",
      body: formData,
    });
    const json = await res.json();
    setSlipBusy(false);
    if (!res.ok) {
      setSlipMsg(json.error || "Upload failed");
      return;
    }
    setSlipFile(null);
    setSlipNetPay("");
    setSlipMsg("Salary slip uploaded for staff profile");
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

      <section className="liquid-glass space-y-4 rounded-[24px] p-4 sm:rounded-[28px] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-soft-blue text-primary">
              <FileText className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">Staff documents</p>
              <p className="text-xs text-subtext">
                View or delete files uploaded by staff
              </p>
            </div>
          </div>
          <select
            value={docStaffId}
            onChange={(e) => setDocStaffId(e.target.value)}
            className="field-input w-auto min-w-[180px]"
          >
            <option value="">All staff</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {docMsg ? <p className="text-sm text-primary">{docMsg}</p> : null}

        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-soft-blue-2/70 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{doc.title}</p>
                <p className="truncate text-xs text-subtext">
                  {doc.user.name} · {doc.fileName} ·{" "}
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
                  onClick={() => removeDocument(doc.id)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger hover:text-white"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </li>
          ))}
          {!docsLoading && documents.length === 0 ? (
            <li className="rounded-2xl bg-soft-blue-2/40 px-4 py-8 text-center text-sm text-subtext">
              No staff documents found
            </li>
          ) : null}
          {docsLoading ? (
            <li className="rounded-2xl px-4 py-6 text-center text-sm text-subtext">
              Loading documents...
            </li>
          ) : null}
        </ul>
      </section>

      <form
        onSubmit={uploadSlip}
        className="liquid-glass grid grid-cols-1 gap-3 rounded-[24px] p-4 sm:rounded-[28px] sm:p-5 md:grid-cols-2"
      >
        <div className="mb-1 flex items-center gap-2 md:col-span-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-soft-blue text-primary">
            <WalletCards className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Upload salary slip</p>
            <p className="text-xs text-subtext">
              Appears under staff Profile → Salary slips
            </p>
          </div>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-subtext">
            Staff
          </span>
          <select
            required
            value={slipStaffId}
            onChange={(e) => setSlipStaffId(e.target.value)}
            className="field-input"
          >
            <option value="">Select staff</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-subtext">
            Net pay (optional)
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={slipNetPay}
            onChange={(e) => setSlipNetPay(e.target.value)}
            className="field-input"
            placeholder="e.g. 45000"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-subtext">
            Month
          </span>
          <select
            value={slipMonth}
            onChange={(e) => setSlipMonth(e.target.value)}
            className="field-input"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(2026, m - 1, 1).toLocaleString("en", {
                  month: "long",
                })}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-subtext">
            Year
          </span>
          <input
            type="number"
            required
            min="2000"
            value={slipYear}
            onChange={(e) => setSlipYear(e.target.value)}
            className="field-input"
          />
        </label>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/30 bg-soft-blue/40 px-4 py-5 text-center transition hover:bg-soft-blue md:col-span-2">
          <Upload className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-primary">
            {slipFile ? slipFile.name : "Choose PDF or image"}
          </span>
          <input
            type="file"
            accept=".pdf,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
          />
        </label>
        {slipMsg ? (
          <p className="text-sm text-primary md:col-span-2">{slipMsg}</p>
        ) : null}
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={slipBusy}
            className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            {slipBusy ? "Uploading..." : "Upload salary slip"}
          </button>
        </div>
      </form>

      <div className="liquid-glass overflow-hidden rounded-[24px] sm:rounded-[28px]">
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
              {staff.map((s) => (
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
              {staff.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-subtext"
                  >
                    No staff accounts yet
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
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
