"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Application,
  ApplicationEvent,
  ApplicationStatus,
  Contact,
  CptPeriod,
  Profile,
  STATUS_LABELS,
} from "./types";
import { todayISO, uid } from "./utils";

// Default profile tuned for: USC MSCS (AI), graduating May 2027, targeting
// SDE roles on fintech/payments-infra teams (AWS fintech style).
export const DEFAULT_PROFILE: Profile = {
  graduationDate: "2027-05-14",
  programStart: "2025-08-25",
  targetTitle: "SDE — fintech / payments infrastructure",
  fitKeywords: [
    { word: "fintech", weight: 15 },
    { word: "payment", weight: 12 },
    { word: "aws", weight: 12 },
    { word: "backend", weight: 10 },
    { word: "distributed", weight: 8 },
    { word: "cloud", weight: 6 },
    { word: "infrastructure", weight: 6 },
    { word: "sde", weight: 5 },
    { word: "microservice", weight: 5 },
    { word: "java", weight: 4 },
    { word: "typescript", weight: 4 },
    { word: "go", weight: 3 },
  ],
  cptPeriods: [
    {
      id: "cpt-amazon-f26",
      label: "Amazon SDE co-op (AWS FinTech) — Fall 2026",
      start: "2026-08-31",
      end: "2026-12-11",
      fullTime: true,
    },
  ],
  weeklyGoal: 10,
};

const SEED_APPLICATIONS: Application[] = [
  {
    id: "seed-amazon-f26",
    company: "Amazon",
    role: "SDE Intern (Fall) — AWS FinTech",
    location: "Seattle, WA",
    workMode: "onsite",
    roleType: "co-op",
    term: "Fall 2026",
    status: "accepted",
    sponsorship: "yes",
    excitement: 5,
    source: "Company site",
    tags: ["aws", "fintech", "big tech"],
    notes:
      "Fall SDE internship on the AWS FinTech team — the exact profile to target for new grad. Build relationships for a return offer.",
    appliedDate: "2026-02-10",
    events: [
      {
        id: "seed-ev-1",
        date: "2026-02-10",
        type: "status",
        status: "applied",
        text: "Applied",
      },
      {
        id: "seed-ev-2",
        date: "2026-03-02",
        type: "status",
        status: "oa",
        text: "Online Assessment",
      },
      {
        id: "seed-ev-3",
        date: "2026-04-15",
        type: "status",
        status: "interview",
        text: "Final loop",
      },
      {
        id: "seed-ev-4",
        date: "2026-05-20",
        type: "status",
        status: "offer",
        text: "Offer — AWS FinTech team match",
      },
      {
        id: "seed-ev-5",
        date: "2026-06-01",
        type: "status",
        status: "accepted",
        text: "Accepted",
      },
    ],
    createdAt: "2026-02-10T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  },
];

export interface JobPulseState {
  applications: Application[];
  contacts: Contact[];
  profile: Profile;
  hydrated: boolean;
  setHydrated: () => void;

  addApplication: (
    app: Omit<Application, "id" | "events" | "createdAt" | "updatedAt">
  ) => Application;
  updateApplication: (id: string, patch: Partial<Application>) => void;
  setStatus: (id: string, status: ApplicationStatus, note?: string) => void;
  deleteApplication: (id: string) => void;
  addEvent: (appId: string, event: Omit<ApplicationEvent, "id">) => void;

  addContact: (contact: Omit<Contact, "id" | "createdAt">) => void;
  updateContact: (id: string, patch: Partial<Contact>) => void;
  deleteContact: (id: string) => void;

  updateProfile: (patch: Partial<Profile>) => void;
  addCptPeriod: (period: Omit<CptPeriod, "id">) => void;
  deleteCptPeriod: (id: string) => void;

  importData: (data: {
    applications?: Application[];
    contacts?: Contact[];
    profile?: Profile;
  }) => void;
  resetAll: () => void;
}

export const useJobPulse = create<JobPulseState>()(
  persist(
    (set) => ({
      applications: SEED_APPLICATIONS,
      contacts: [],
      profile: DEFAULT_PROFILE,
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),

      addApplication: (app) => {
        const now = new Date().toISOString();
        const events: ApplicationEvent[] = [
          {
            id: uid(),
            date: app.appliedDate ?? todayISO(),
            type: "status",
            status: app.status,
            text: STATUS_LABELS[app.status],
          },
        ];
        const full: Application = {
          ...app,
          id: uid(),
          events,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ applications: [full, ...s.applications] }));
        return full;
      },

      updateApplication: (id, patch) =>
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === id
              ? { ...a, ...patch, updatedAt: new Date().toISOString() }
              : a
          ),
        })),

      setStatus: (id, status, note) => {
        const now = new Date().toISOString();
        set((s) => ({
          applications: s.applications.map((a) => {
            if (a.id !== id || a.status === status) return a;
            const event: ApplicationEvent = {
              id: uid(),
              date: todayISO(),
              type: "status",
              status,
              text: note || STATUS_LABELS[status],
            };
            return {
              ...a,
              status,
              appliedDate:
                status === "applied" && !a.appliedDate
                  ? todayISO()
                  : a.appliedDate,
              events: [...a.events, event],
              updatedAt: now,
            };
          }),
        }));
      },

      deleteApplication: (id) =>
        set((s) => ({
          applications: s.applications.filter((a) => a.id !== id),
        })),

      addEvent: (appId, event) =>
        set((s) => ({
          applications: s.applications.map((a) =>
            a.id === appId
              ? {
                  ...a,
                  events: [...a.events, { ...event, id: uid() }],
                  updatedAt: new Date().toISOString(),
                }
              : a
          ),
        })),

      addContact: (contact) =>
        set((s) => ({
          contacts: [
            { ...contact, id: uid(), createdAt: new Date().toISOString() },
            ...s.contacts,
          ],
        })),

      updateContact: (id, patch) =>
        set((s) => ({
          contacts: s.contacts.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        })),

      deleteContact: (id) =>
        set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),

      updateProfile: (patch) =>
        set((s) => ({ profile: { ...s.profile, ...patch } })),

      addCptPeriod: (period) =>
        set((s) => ({
          profile: {
            ...s.profile,
            cptPeriods: [...s.profile.cptPeriods, { ...period, id: uid() }],
          },
        })),

      deleteCptPeriod: (id) =>
        set((s) => ({
          profile: {
            ...s.profile,
            cptPeriods: s.profile.cptPeriods.filter((p) => p.id !== id),
          },
        })),

      importData: (data) =>
        set((s) => ({
          applications: data.applications ?? s.applications,
          contacts: data.contacts ?? s.contacts,
          profile: data.profile ?? s.profile,
        })),

      resetAll: () =>
        set({
          applications: SEED_APPLICATIONS,
          contacts: [],
          profile: DEFAULT_PROFILE,
        }),
    }),
    {
      name: "jobpulse-v1",
      partialize: (s) => ({
        applications: s.applications,
        contacts: s.contacts,
        profile: s.profile,
      }),
    }
  )
);
