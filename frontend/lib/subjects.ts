import type { Semester } from "./api";

// UVCE is an autonomous college — subjects vary by branch and are
// user-typed. The dropdowns in the chat and upload UIs are now
// text inputs. This file only provides semester labels for the
// chrome (titles, tags) — keep the export so existing imports work.

export const SUBJECTS: Record<Semester, { code: string; name: string }[]> = {
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  6: [],
  7: [],
  8: [],
};

export const SEMESTER_LABELS: Record<Semester, string> = {
  1: "First Year · Semester I",
  2: "First Year · Semester II",
  3: "Computer Science · Semester III",
  4: "Computer Science · Semester IV",
  5: "Computer Science · Semester V",
  6: "Computer Science · Semester VI",
  7: "Computer Science · Semester VII",
  8: "Computer Science · Semester VIII",
};
