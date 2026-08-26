import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/auth/Login";
import ProtectedRoute from "./ProtectedRoute";

import FacultyLayout from "../components/layout/FacultyLayout";
import StudentLayout from "../components/layout/StudentLayout";

/* =========================
   FACULTY PAGES
========================= */

import FacultyDashboard from "../pages/faculty/FacultyDashboard";
import FacultyUploads from "../pages/faculty/FacultyUploads";
import FacultyUploadLecture from "../pages/faculty/FacultyUploadLecture";
import FacultySubjects from "../pages/faculty/FacultySubjects";
import FacultySubjectDetails from "../pages/faculty/FacultySubjectDetails";
import FacultyLectureDetails from "../pages/faculty/FacultyLectureDetails";
import FacultyAnalytics from "../pages/faculty/FacultyAnalytics";
import FacultySettings from "../pages/faculty/FacultySettings";
import FacultyDoubtSession from "../pages/faculty/FacultyDoubtSession";
import FacultyDoubtDetails from "../pages/faculty/FacultyDoubtDetails";

import FacultyStudentProgress from "../pages/faculty/StudentProgress";
import StudentProgressDetails from "../pages/faculty/StudentProgressDetails";

/* =========================
   STUDENT PAGES
========================= */

import StudentDashboard from "../pages/student/StudentDashboard";
import StudentSubjects from "../pages/student/StudentSubjects";
import SubjectLectures from "../pages/student/SubjectLectures";
import StudentLectureDetails from "../pages/student/StudentLectureDetails";

import StudentNotes from "../pages/student/StudentNotes";
import StudentTranscript from "../pages/student/StudentTranscript";
import StudentFlashcards from "../pages/student/StudentFlashcards";
import StudentQuiz from "../pages/student/StudentQuiz";
import StudentQA from "../pages/student/StudentQA";

import StudentProgress from "../pages/student/StudentProgress";
import StudentSettings from "../pages/student/StudentSettings";

function AppRoutes() {
  return (
    <Routes>
      {/* =========================
          HOME
      ========================= */}

      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* =========================
          LOGIN
      ========================= */}

      <Route path="/login" element={<Login />} />

      {/* =====================================================
          FACULTY
      ===================================================== */}

      <Route
        path="/faculty"
        element={
          <ProtectedRoute role="faculty">
            <FacultyLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={<FacultyDashboard />} />

        <Route path="uploads" element={<FacultyUploads />} />

        <Route path="uploads/new" element={<FacultyUploadLecture />} />

        <Route path="subjects" element={<FacultySubjects />} />

        <Route path="subjects/:subjectId" element={<FacultySubjectDetails />} />

        <Route path="lectures/:lectureId" element={<FacultyLectureDetails />} />

        <Route
          path="lectures/:lectureId/doubts"
          element={<FacultyDoubtSession />}
        />

        <Route
          path="lectures/:lectureId/doubts/:doubtId"
          element={<FacultyDoubtDetails />}
        />

        <Route
          path="subjects/:subjectId/lecturers/:lecturerId"
          element={<FacultyLectureDetails />}
        />

        <Route
          path="subjects/:subjectId/lecturers/:lecturerId/lectures/:lectureId"
          element={<FacultyLectureDetails />}
        />

        <Route
          path="subjects/:subjectId/lecturers/:lecturerId/lectures/:lectureId/analytics"
          element={<FacultyAnalytics />}
        />

        <Route
          path="analytics/:subjectId/:lecturerId/:lectureId"
          element={<FacultyAnalytics />}
        />

        <Route path="student-progress" element={<FacultyStudentProgress />} />

        <Route
          path="student-progress/:usn"
          element={<StudentProgressDetails />}
        />

        <Route path="settings" element={<FacultySettings />} />
      </Route>

      {/* =====================================================
          STUDENT
      ===================================================== */}

      <Route
        path="/student"
        element={
          <ProtectedRoute role="student">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route path="dashboard" element={<StudentDashboard />} />

        <Route path="subjects" element={<StudentSubjects />} />

        <Route path="subjects/:subjectId" element={<SubjectLectures />} />

        <Route path="lectures/:lectureId" element={<StudentLectureDetails />} />

        {/* =========================
            STUDENT NOTES
        ========================= */}

        <Route path="lectures/:lectureId/notes" element={<StudentNotes />} />

        {/* =========================
            STUDENT TRANSCRIPT
        ========================= */}

        <Route
          path="lectures/:lectureId/transcript"
          element={<StudentTranscript />}
        />

        {/* =========================
            STUDENT FLASHCARDS
        ========================= */}

        <Route
          path="lectures/:lectureId/flashcards"
          element={<StudentFlashcards />}
        />

        {/* =========================
            STUDENT QUIZ
        ========================= */}

        <Route path="lectures/:lectureId/quiz" element={<StudentQuiz />} />

        {/* =========================
            STUDENT Q&A
        ========================= */}

        <Route path="lectures/:lectureId/qa" element={<StudentQA />} />

        <Route
          path="subjects/:subjectId/lecturers"
          element={<SubjectLectures />}
        />

        <Route
          path="subjects/:subjectId/lecturers/:lecturerId"
          element={<SubjectLectures />}
        />

        <Route path="progress" element={<StudentProgress />} />

        <Route path="settings" element={<StudentSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;
