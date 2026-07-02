"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Linkedin,
  Mail,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Modal from "@/components/Modal";
import { useJobPulse } from "@/lib/store";
import { daysUntil } from "@/lib/terms";
import { Contact } from "@/lib/types";
import { cn, formatDate, todayISO } from "@/lib/utils";

interface ContactForm {
  name: string;
  company: string;
  title: string;
  linkedin: string;
  email: string;
  relationship: string;
  lastTouch: string;
  notes: string;
}

const EMPTY: ContactForm = {
  name: "",
  company: "",
  title: "",
  linkedin: "",
  email: "",
  relationship: "",
  lastTouch: "",
  notes: "",
};

export default function ContactsPage() {
  const contacts = useJobPulse((s) => s.contacts);
  const applications = useJobPulse((s) => s.applications);
  const hydrated = useJobPulse((s) => s.hydrated);
  const addContact = useJobPulse((s) => s.addContact);
  const updateContact = useJobPulse((s) => s.updateContact);
  const deleteContact = useJobPulse((s) => s.deleteContact);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ContactForm>(EMPTY);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return contacts.filter((c) =>
      `${c.name} ${c.company} ${c.title ?? ""} ${c.relationship ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [contacts, query]);

  const companiesInPipeline = useMemo(
    () => new Set(applications.map((a) => a.company.toLowerCase())),
    [applications]
  );

  const startAdd = () => {
    setEditingId(null);
    setForm(EMPTY);
    setOpen(true);
  };

  const startEdit = (c: Contact) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      company: c.company,
      title: c.title ?? "",
      linkedin: c.linkedin ?? "",
      email: c.email ?? "",
      relationship: c.relationship ?? "",
      lastTouch: c.lastTouch ?? "",
      notes: c.notes,
    });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      company: form.company.trim(),
      title: form.title.trim() || undefined,
      linkedin: form.linkedin.trim() || undefined,
      email: form.email.trim() || undefined,
      relationship: form.relationship.trim() || undefined,
      lastTouch: form.lastTouch || undefined,
      notes: form.notes,
    };
    if (editingId) updateContact(editingId, payload);
    else addContact(payload);
    setOpen(false);
  };

  const set = <K extends keyof ContactForm>(k: K, v: ContactForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  if (!hydrated) return <div className="card h-64 animate-pulse" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
          <p className="text-sm text-zinc-400">
            Referrals move applications — keep your network warm.
          </p>
        </div>
        <button onClick={startAdd} className="btn-primary">
          <Plus className="h-4 w-4" /> Add contact
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          className="input pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, company..."
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <p className="max-w-sm text-sm text-zinc-400">
            No contacts yet. Add recruiters, alumni, and referrers — a warm
            referral beats 100 cold applications.
          </p>
          <button onClick={startAdd} className="btn-primary">
            <Plus className="h-4 w-4" /> Add your first contact
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const cold =
              !c.lastTouch || daysUntil(c.lastTouch) <= -30;
            const inPipeline = companiesInPipeline.has(c.company.toLowerCase());
            return (
              <div key={c.id} className="card group relative p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-zinc-100">{c.name}</p>
                    <p className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Building2 className="h-3 w-3" />
                      {c.title ? `${c.title} · ` : ""}
                      {c.company}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => startEdit(c)}
                      className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                      aria-label="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete contact ${c.name}?`))
                          deleteContact(c.id);
                      }}
                      className="rounded p-1.5 text-zinc-400 hover:bg-red-950 hover:text-red-400"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  {c.relationship && (
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300">
                      {c.relationship}
                    </span>
                  )}
                  {inPipeline && (
                    <span className="rounded-full bg-indigo-950/70 px-2 py-0.5 text-[11px] text-indigo-300">
                      company in pipeline
                    </span>
                  )}
                  {cold && (
                    <span className="rounded-full bg-amber-950/70 px-2 py-0.5 text-[11px] text-amber-300">
                      {c.lastTouch ? "gone cold — nudge" : "never contacted"}
                    </span>
                  )}
                </div>

                {c.notes && (
                  <p className="mb-3 line-clamp-2 text-xs text-zinc-500">
                    {c.notes}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {c.linkedin && (
                      <a
                        href={c.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-sky-400"
                        aria-label="LinkedIn"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {c.email && (
                      <a
                        href={`mailto:${c.email}`}
                        className="rounded p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-sky-400"
                        aria-label="Email"
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => updateContact(c.id, { lastTouch: todayISO() })}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-xs transition",
                      cold
                        ? "border-amber-800 text-amber-300 hover:bg-amber-950/50"
                        : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                    )}
                    title="Mark as contacted today"
                  >
                    {c.lastTouch
                      ? `Touched ${formatDate(c.lastTouch)}`
                      : "Mark contacted"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? "Edit contact" : "Add contact"}
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Name *</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Company *</label>
              <input
                className="input"
                required
                value={form.company}
                onChange={(e) => set("company", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Title</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="SDE II"
              />
            </div>
            <div>
              <label className="label">Relationship</label>
              <input
                className="input"
                value={form.relationship}
                onChange={(e) => set("relationship", e.target.value)}
                placeholder="USC alum, recruiter, teammate..."
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">LinkedIn URL</label>
              <input
                className="input"
                type="url"
                value={form.linkedin}
                onChange={(e) => set("linkedin", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Last touch</label>
            <input
              className="input"
              type="date"
              value={form.lastTouch}
              onChange={(e) => set("lastTouch", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input resize-y"
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="How you met, what you talked about..."
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-zinc-800 pt-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingId ? "Save changes" : "Add contact"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
