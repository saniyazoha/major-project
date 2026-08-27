/*
 * ============================================================
 * STUDENT DOUBTS / ASK DATA
 * ============================================================
 *
 * Temporary frontend data store for the Student Ask feature.
 *
 * Later, when the backend is connected, this data can be
 * replaced by API/database data without changing the UI.
 *
 * IMPORTANT:
 * Every doubt is connected to a specific:
 * - subject
 * - lecture
 * - student
 *
 * This prevents doubts from one lecture appearing in another.
 */

export const doubtsData = [
  {
    id: "doubt-1",

    subjectId: "1",
    lectureId: "1",

    studentId: "student-001",
    studentName: "Student",

    question:
      "What is the difference between process management and memory management?",

    status: "answered",

    createdAt: "Jan 15, 2026",

    answer:
      "Process management handles the creation, scheduling, execution, and termination of processes, while memory management handles the allocation and tracking of memory used by those processes.",

    answeredBy: "Dr. Ananya Sharma",

    answeredAt: "Jan 15, 2026",
  },
];

const doubtsStorageKey = "lectAI-doubts";

function readDoubts() {
  const savedDoubts = localStorage.getItem(doubtsStorageKey);

  if (!savedDoubts) {
    return doubtsData;
  }

  try {
    const parsedDoubts = JSON.parse(savedDoubts);

    return Array.isArray(parsedDoubts) ? parsedDoubts : doubtsData;
  } catch {
    return doubtsData;
  }
}

function writeDoubts(doubts) {
  localStorage.setItem(doubtsStorageKey, JSON.stringify(doubts));
}

export function addDoubt(doubt) {
  const updatedDoubts = [
    ...readDoubts(),
    {
      ...doubt,
      id: doubt.id || `doubt-${Date.now()}`,
    },
  ];

  writeDoubts(updatedDoubts);

  return updatedDoubts[updatedDoubts.length - 1];
}

export function updateDoubt(doubtId, updates) {
  const updatedDoubts = readDoubts().map((doubt) =>
    String(doubt.id) === String(doubtId) ? { ...doubt, ...updates } : doubt,
  );

  writeDoubts(updatedDoubts);

  return updatedDoubts.find((doubt) => String(doubt.id) === String(doubtId));
}

/*
 * ============================================================
 * GET DOUBTS FOR ONE LECTURE
 * ============================================================
 */

export function getDoubtsByLecture(lectureId) {
  return readDoubts().filter(
    (doubt) => String(doubt.lectureId) === String(lectureId),
  );
}

/*
 * ============================================================
 * GET DOUBTS FOR ONE STUDENT
 * ============================================================
 */

export function getDoubtsByStudent(studentId) {
  return readDoubts().filter(
    (doubt) => String(doubt.studentId) === String(studentId),
  );
}

/*
 * ============================================================
 * GET DOUBTS FOR ONE SUBJECT
 * ============================================================
 */

export function getDoubtsBySubject(subjectId) {
  return readDoubts().filter(
    (doubt) => String(doubt.subjectId) === String(subjectId),
  );
}
