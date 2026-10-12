"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import {
  Building2,
  Camera,
  Download,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Phone,
  Upload,
  UserRound,
  WalletCards,
} from "lucide-react";
import { UserAvatar } from "@/components/staff/user-avatar";
import { cn } from "@/lib/utils";

type TabId = "overview" | "documents" | "salary" | "bank";

type Profile = {
  employeeId: string | null;
  phone: string | null;
  department: string | null;
  avatarPath: string | null;
};

type DocumentRow = {
  id: string;
  title: string;
  fileName: string;
  filePath: string;
  createdAt: string;
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

type BankForm = {
  bankAccountHolder: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
};

const TABS: Array<{ id: TabId; label: string; icon: typeof UserRound }> = [
  { id: "overview", label: "Overview", icon: UserRound },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "salary", label: "Salary slips", icon: WalletCards },
  { id: "bank", label: "Bank account", icon: Building2 },
];

const emptyBank: BankForm = {
  bankAccountHolder: "",
  bankName: "",
  accountNumber: "",
  ifscCode: "",
  branchName: "",
};

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    throw new Error(res.ok ? "Empty response" : `Request failed (${res.status})`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Invalid server response");
  }
}

export default function StaffProfilePage() {
  const { data } = useSession();
  const [tab, setTab] = useState<TabId>("overview");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [phone, setPhone] = useState("");
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [slips, setSlips] = useState<SalarySlip[]>([]);
  const [bank, setBank] = useState<BankForm>(emptyBank);
  const [docTitle, setDocTitle] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docBusy, setDocBusy] = useState(false);
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [bankBusy, setBankBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/me");
      const json = await readJson<{ user?: Profile & { phone?: string } }>(res);
      setProfile(json.user || null);
      setPhone(json.user?.phone || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load profile");
    }
  }, []);

  const loadDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/me/documents");
      const json = await readJson<{ documents?: DocumentRow[]; error?: string }>(
        res
      );
      if (!res.ok) {
        setError(json.error || "Failed to load documents");
        setDocuments([]);
        return;
      }
      setDocuments(json.documents || []);
    } catch (e) {
      setDocuments([]);
      setError(e instanceof Error ? e.message : "Failed to load documents");
    }
  }, []);

  const loadSlips = useCallback(async () => {
    try {
      const res = await fetch("/api/me/salary-slips");
      const json = await readJson<{ slips?: SalarySlip[]; error?: string }>(res);
      if (!res.ok) {
        setError(json.error || "Failed to load salary slips");
        setSlips([]);
        return;
      }
      setSlips(json.slips || []);
    } catch (e) {
      setSlips([]);
      setError(e instanceof Error ? e.message : "Failed to load salary slips");
    }
  }, []);

  const loadBank = useCallback(async () => {
    try {
      const res = await fetch("/api/me/bank");
      const json = await readJson<{ bank?: BankForm; error?: string }>(res);
      if (!res.ok) {
        setError(json.error || "Failed to load bank details");
        return;
      }
      if (json.bank) setBank(json.bank);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load bank details");
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (tab === "documents") loadDocuments();
    if (tab === "salary") loadSlips();
    if (tab === "bank") loadBank();
  }, [tab, loadDocuments, loadSlips, loadBank]);

  async function savePhone(e: FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "").slice(0, 10);
    if (digits && digits.length !== 10) {
      setError("Phone number must be exactly 10 digits");
      return;
    }
    setPhoneBusy(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: digits }),
    });
    const json = await res.json();
    setPhoneBusy(false);
    if (!res.ok) {
      setError(json.error || "Could not update phone");
      return;
    }
    setProfile(json.user || null);
    setPhone(json.user?.phone || "");
    setMessage("Phone number updated");
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordBusy(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/me/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword,
      }),
    });
    const json = await readJson<{ error?: string }>(res).catch(() => ({
      error: "Could not change password",
    }));
    setPasswordBusy(false);
    if (!res.ok) {
      setError(json.error || "Could not change password");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setMessage("Password changed successfully");
  }

  async function uploadAvatar(file: File | null) {
    if (!file) return;
    setAvatarBusy(true);
    setError("");
    setMessage("");
    const form = new FormData();
    form.set("file", file);
    const res = await fetch("/api/me/avatar", { method: "POST", body: form });
    const json = await res.json();
    setAvatarBusy(false);
    if (!res.ok) {
      setError(json.error || "Could not upload photo");
      return;
    }
    setProfile((p) =>
      p
        ? { ...p, avatarPath: json.avatarPath }
        : {
            employeeId: null,
            phone: null,
            department: null,
            avatarPath: json.avatarPath,
          }
    );
    setMessage("Profile photo updated");
  }

  async function uploadDocument(e: FormEvent) {
    e.preventDefault();
    if (!docFile) {
      setError("Choose a file to upload");
      return;
    }
    setDocBusy(true);
    setError("");
    setMessage("");
    const form = new FormData();
    form.set("title", docTitle);
    form.set("file", docFile);
    const res = await fetch("/api/me/documents", { method: "POST", body: form });
    const json = await res.json();
    setDocBusy(false);
    if (!res.ok) {
      setError(json.error || "Upload failed");
      return;
    }
    setDocTitle("");
    setDocFile(null);
    setMessage("Document uploaded");
    loadDocuments();
  }

  async function saveBank(e: FormEvent) {
    e.preventDefault();
    setBankBusy(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/me/bank", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bank),
    });
    const json = await res.json();
    setBankBusy(false);
    if (!res.ok) {
      setError(json.error || "Could not save bank details");
      return;
    }
    setBank(json.bank);
    setMessage("Bank account saved");
  }

  const monthLabel = useMemo(
    () => (month: number, year: number) =>
      format(new Date(year, month - 1, 1), "MMMM yyyy"),
    []
  );

  return (
    <div className="fade-up flex h-full min-h-0 w-full flex-1 flex-col gap-3 md:gap-4">
      <div className="liquid-glass flex shrink-0 items-center gap-3 rounded-[22px] px-4 py-3.5 sm:gap-4 sm:rounded-[26px] sm:px-5 sm:py-4">
        <label className="group relative h-14 w-14 shrink-0 cursor-pointer sm:h-16 sm:w-16">
          <UserAvatar
            name={data?.user?.name}
            avatarPath={profile?.avatarPath}
            className="h-full w-full rounded-2xl shadow-md shadow-primary/25"
            textClassName="font-heading text-xl sm:text-2xl"
          />
          <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-primary/55 text-white opacity-0 transition group-hover:opacity-100">
            <Camera className="h-5 w-5" />
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={avatarBusy}
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              e.target.value = "";
              uploadAvatar(file);
            }}
          />
        </label>
        <div className="min-w-0">
          <h1 className="truncate font-heading text-lg font-semibold tracking-tight sm:text-xl md:text-2xl">
            {data?.user?.name}
          </h1>
          <p className="truncate text-xs text-subtext sm:text-sm">
            @{data?.user?.username} · Your staff account
          </p>
          <p className="mt-1 text-[11px] text-primary">
            {avatarBusy ? "Uploading photo..." : "Click photo to change"}
          </p>
        </div>
      </div>

      <div className="liquid-glass-strong flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] sm:rounded-[28px]">
        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/60 p-2 sm:p-2.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                setError("");
                setMessage("");
              }}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition",
                tab === id
                  ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/20"
                  : "text-foreground/70 hover:bg-white/70 hover:text-primary"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-5 lg:p-6">
          {message ? (
            <p className="mb-4 shrink-0 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="mb-4 shrink-0 rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          {tab === "overview" ? (
            <div className="mx-auto grid w-full max-w-4xl grid-cols-1 items-stretch gap-4 lg:grid-cols-2 lg:gap-5">
              <form
                onSubmit={savePhone}
                className="flex h-full flex-col rounded-[22px] border border-white/70 bg-white/50 p-4 sm:p-5"
              >
                <div className="mb-4 flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-soft-blue text-primary">
                    <Phone className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Account details</p>
                    <p className="mt-0.5 text-xs text-subtext">
                      View your profile and update your phone number
                    </p>
                  </div>
                </div>

                <div className="mb-4 space-y-2.5">
                  {[
                    ["Employee ID", profile?.employeeId || "—"],
                    ["Department", profile?.department || "—"],
                    ["Role", "Staff"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-2xl bg-soft-blue-2/80 px-4 py-3 text-sm"
                    >
                      <span className="text-subtext">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}

                  <label className="block rounded-2xl bg-soft-blue-2/80 px-4 py-3">
                    <span className="mb-1.5 block text-xs font-medium text-subtext">
                      Phone number
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                      }
                      placeholder="10-digit mobile number"
                      className="field-input"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={phoneBusy}
                  className="mt-auto w-full rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
                >
                  {phoneBusy ? "Saving..." : "Save phone number"}
                </button>
              </form>

              <form
                onSubmit={changePassword}
                className="flex h-full flex-col rounded-[22px] border border-white/70 bg-white/50 p-4 sm:p-5"
              >
                <div className="mb-4 flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-soft-blue text-primary">
                    <KeyRound className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Change password</p>
                    <p className="mt-0.5 text-xs text-subtext">
                      Use a new password with at least 6 characters
                    </p>
                  </div>
                </div>

                <div className="mb-4 space-y-3">
                  <PasswordField
                    label="Current password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    visible={showCurrent}
                    onToggle={() => setShowCurrent((v) => !v)}
                    autoComplete="current-password"
                  />
                  <PasswordField
                    label="New password"
                    value={newPassword}
                    onChange={setNewPassword}
                    visible={showNew}
                    onToggle={() => setShowNew((v) => !v)}
                    autoComplete="new-password"
                  />
                  <PasswordField
                    label="Confirm new password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    visible={showConfirm}
                    onToggle={() => setShowConfirm((v) => !v)}
                    autoComplete="new-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordBusy}
                  className="mt-auto w-full rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
                >
                  {passwordBusy ? "Updating..." : "Update password"}
                </button>
              </form>
            </div>
          ) : null}

          {tab === "documents" ? (
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
              <form
                onSubmit={uploadDocument}
                className="flex flex-col gap-3 rounded-[22px] border border-white/70 bg-white/50 p-4 sm:p-5"
              >
                <div>
                  <p className="text-sm font-semibold">Upload document</p>
                  <p className="mt-0.5 text-xs text-subtext">
                    ID proof, offer letter, certificates — PDF or image, max 8MB
                  </p>
                </div>
                <input
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Document title"
                  className="field-input"
                />
                <label className="flex min-h-[160px] flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/30 bg-soft-blue/40 px-4 py-8 text-center transition hover:bg-soft-blue">
                  <Upload className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    {docFile ? docFile.name : "Choose file"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  />
                </label>
                <button
                  type="submit"
                  disabled={docBusy}
                  className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60"
                >
                  {docBusy ? "Uploading..." : "Upload document"}
                </button>
              </form>

              <section className="flex min-h-[240px] flex-col rounded-[22px] border border-white/70 bg-white/50 p-4 sm:p-5">
                <p className="mb-3 text-sm font-semibold">Your documents</p>
                <ul className="flex flex-1 flex-col gap-2 overflow-y-auto">
                  {documents.map((doc) => (
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
                      <a
                        href={doc.filePath}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-soft-blue px-2.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </a>
                    </li>
                  ))}
                  {documents.length === 0 ? (
                    <li className="flex flex-1 items-center justify-center rounded-2xl bg-soft-blue-2/50 px-4 py-10 text-center text-sm text-subtext">
                      No documents uploaded yet
                    </li>
                  ) : null}
                </ul>
              </section>
            </div>
          ) : null}

          {tab === "salary" ? (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="rounded-[22px] border border-white/70 bg-white/50 px-4 py-3 sm:px-5">
                <p className="text-sm font-semibold">Salary slips</p>
                <p className="mt-0.5 text-xs text-subtext">
                  Slips uploaded by HR appear here for download
                </p>
              </div>
              <ul className="grid flex-1 grid-cols-1 content-start gap-3 md:grid-cols-2 xl:grid-cols-3">
                {slips.map((slip) => (
                  <li
                    key={slip.id}
                    className="flex items-center justify-between gap-3 rounded-[22px] border border-white/70 bg-white/50 px-4 py-4"
                  >
                    <div>
                      <p className="font-medium">
                        {monthLabel(slip.month, slip.year)}
                      </p>
                      <p className="text-xs text-subtext">
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
                {slips.length === 0 ? (
                  <li className="col-span-full flex min-h-[240px] flex-1 items-center justify-center rounded-[22px] border border-dashed border-primary/20 bg-soft-blue-2/40 px-4 text-center text-sm text-subtext">
                    No salary slips yet
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}

          {tab === "bank" ? (
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr] lg:gap-5">
              <form
                onSubmit={saveBank}
                className="flex flex-col gap-4 rounded-[22px] border border-white/70 bg-white/50 p-4 sm:p-5 lg:p-6"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-soft-blue text-primary">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Bank account details</p>
                    <p className="mt-0.5 text-xs text-subtext">
                      Keep your salary account details up to date for payouts
                    </p>
                  </div>
                </div>
                <div className="grid flex-1 grid-cols-1 content-start gap-3 sm:grid-cols-2">
                  <Field
                    label="Account holder"
                    value={bank.bankAccountHolder}
                    onChange={(v) =>
                      setBank((b) => ({ ...b, bankAccountHolder: v }))
                    }
                    required
                  />
                  <Field
                    label="Bank name"
                    value={bank.bankName}
                    onChange={(v) => setBank((b) => ({ ...b, bankName: v }))}
                    required
                  />
                  <Field
                    label="Account number"
                    value={bank.accountNumber}
                    onChange={(v) =>
                      setBank((b) => ({ ...b, accountNumber: v }))
                    }
                    required
                  />
                  <Field
                    label="IFSC code"
                    value={bank.ifscCode}
                    onChange={(v) =>
                      setBank((b) => ({ ...b, ifscCode: v.toUpperCase() }))
                    }
                    required
                  />
                  <div className="sm:col-span-2">
                    <Field
                      label="Branch (optional)"
                      value={bank.branchName}
                      onChange={(v) =>
                        setBank((b) => ({ ...b, branchName: v }))
                      }
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={bankBusy}
                  className="w-full rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:opacity-60 sm:w-auto"
                >
                  {bankBusy ? "Saving..." : "Save bank account"}
                </button>
              </form>

              <aside className="flex flex-col gap-3 rounded-[22px] border border-white/70 bg-gradient-to-br from-soft-blue/70 via-white/60 to-white/40 p-4 sm:p-5 lg:p-6">
                <p className="text-sm font-semibold">Saved summary</p>
                <p className="text-xs text-subtext">
                  This is what HR will use for salary transfers.
                </p>
                <dl className="mt-1 flex flex-1 flex-col justify-center gap-3 text-sm">
                  {[
                    ["Holder", bank.bankAccountHolder || "—"],
                    ["Bank", bank.bankName || "—"],
                    ["Account", bank.accountNumber || "—"],
                    ["IFSC", bank.ifscCode || "—"],
                    ["Branch", bank.branchName || "—"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl bg-white/70 px-4 py-3"
                    >
                      <dt className="text-[11px] font-medium uppercase tracking-wide text-subtext">
                        {label}
                      </dt>
                      <dd className="mt-1 break-all font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </aside>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-subtext">
        {label}
      </span>
      <input
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field-input"
      />
    </label>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  onToggle: () => void;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-subtext">
        {label}
      </span>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="field-input pr-11"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-subtext transition hover:text-primary"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </label>
  );
}
