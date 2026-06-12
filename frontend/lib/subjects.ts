import type { Semester } from "./api";

export const SUBJECTS: Record<
  Semester,
  { code: string; name: string }[]
> = {
  1: [
    { code: "BSC101", name: "Engineering Mathematics-I" },
    { code: "BSC102", name: "Engineering Physics" },
    { code: "ESC101", name: "Problem Solving with C" },
    { code: "ESC102", name: "Basic Electrical Engineering" },
  ],

  2: [
    { code: "BSC201", name: "Engineering Mathematics-II" },
    { code: "BSC202", name: "Engineering Chemistry" },
    { code: "ESC201", name: "Python Programming" },
    { code: "ESC202", name: "Basic Electronics" },
  ],

  3: [
    { code: "BCS301", name: "Data Structures" },
    { code: "BCS302", name: "Discrete Mathematical Structures" },
    { code: "BCS303", name: "Digital Computer Organization" },
    { code: "BCS304", name: "OOP with Java" },
  ],

  4: [
    { code: "BCS401", name: "Operating Systems" },
    { code: "BCS402", name: "Design and Analysis of Algorithms" },
    { code: "BCS403", name: "Database Management Systems" },
    { code: "BCS404", name: "Microprocessor and Microcontroller" },
  ],

  5: [
    { code: "BCS501", name: "Computer Networks" },
    { code: "BCS502", name: "Theory of Computation" },
    { code: "BCS503", name: "Software Engineering" },
    { code: "BCS504", name: "Machine Learning" },
  ],

  6: [
    { code: "BCS601", name: "Cloud Computing" },
    { code: "BCS602", name: "Compiler Design" },
    { code: "BCS603", name: "Information Security" },
    { code: "BCS604", name: "Web Technologies" },
  ],

  7: [
    { code: "BCS701", name: "Artificial Intelligence" },
    { code: "BCS702", name: "Distributed Systems" },
    { code: "BCS703", name: "Deep Learning" },
    { code: "BCS704", name: "Project Phase-I" },
  ],

  8: [
    { code: "BCS801", name: "Internet of Things" },
    { code: "BCS802", name: "Blockchain Technology" },
    { code: "BCS803", name: "Project Phase-II" },
    { code: "BCS804", name: "Internship" },
  ],
};

export const SEMESTER_SUBJECTS: Record<Semester, string[]> = {
  1: SUBJECTS[1].map((s) => s.name),
  2: SUBJECTS[2].map((s) => s.name),
  3: SUBJECTS[3].map((s) => s.name),
  4: SUBJECTS[4].map((s) => s.name),
  5: SUBJECTS[5].map((s) => s.name),
  6: SUBJECTS[6].map((s) => s.name),
  7: SUBJECTS[7].map((s) => s.name),
  8: SUBJECTS[8].map((s) => s.name),
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