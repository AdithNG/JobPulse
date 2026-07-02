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

// Default profile: general new-grad SWE/SDE (think Google L3, Amazon SDE-I)
// with a mild fintech lean. Paste a resume in Settings to personalize —
// keywords are then extracted from what you've actually worked with.
export const DEFAULT_PROFILE: Profile = {
  graduationDate: "2027-05-14",
  programStart: "2025-08-25",
  targetTitle: "New Grad SWE / SDE (L3, SDE-I)",
  fitKeywords: [
    { word: "backend", weight: 10 },
    { word: "distributed", weight: 9 },
    { word: "aws", weight: 8 },
    { word: "fintech", weight: 8 },
    { word: "cloud", weight: 6 },
    { word: "infrastructure", weight: 6 },
    { word: "payment", weight: 6 },
    { word: "microservice", weight: 5 },
    { word: "sde", weight: 5 },
    { word: "java", weight: 5 },
    { word: "python", weight: 5 },
    { word: "typescript", weight: 4 },
    { word: "full stack", weight: 4 },
    { word: "go", weight: 3 },
  ],
  cptPeriods: [],
  weeklyGoal: 10,
};

// New visitors start with an empty tracker — data is per-browser.
const SEED_APPLICATIONS: Application[] = [];

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
