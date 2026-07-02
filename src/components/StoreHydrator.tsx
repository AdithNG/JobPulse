"use client";

import { useEffect } from "react";
import { useJobPulse } from "@/lib/store";

// Zustand's persist middleware rehydrates from localStorage synchronously on
// the client, so by the time this effect runs the data is loaded. Flipping
// `hydrated` after mount keeps server and first client render identical
// (skeletons) and avoids hydration mismatches.
export default function StoreHydrator() {
  const setHydrated = useJobPulse((s) => s.setHydrated);
  useEffect(() => {
    setHydrated();
  }, [setHydrated]);
  return null;
}
