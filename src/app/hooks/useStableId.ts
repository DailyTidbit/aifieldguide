// src/app/hooks/useStableId.ts
"use client";

import { useId } from "react";

/** SSR-safe id for labels/inputs etc. Prefer over Math.random() in markup. */
export function useStableId(prefix = "id") {
  const id = useId(); // stable across SSR/CSR for identical trees
  return `${prefix}-${id}`;
}
