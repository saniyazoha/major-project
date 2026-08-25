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

import FacultyStudentProgress from "../pages/faculty/StudentProgress";
import StudentProgressDetails from "../pages/faculty/StudentProgressDetails";

/* =========================
   STUDENT PAGES
========================= */

import StudentDashboard from "../pages/student/StudentDashboard";
import StudentSubjects from "../pages/student/StudentSubjects";
import SubjectLectures from "../pages/student/SubjectLectures";
import StudentLectureDetails from "../pages/student/StudentLectureDetails";

import StudentTranscript from "../pages/student/StudentTranscript";
import StudentSummary from "../pages/student/StudentSummary";
import StudentKeyConcepts from "../pages/student/StudentKeyConcepts";
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
        {/* /faculty */}

        <Route index element={<Navigate to="dashboard" replace />} />

        {/* =========================
            FACULTY DASHBOARD
        ========================= */}

        <Route path="dashboard" element={<FacultyDashboard />} />

        {/* =========================
            FACULTY UPLOADS
        ========================= */}

        <Route path="uploads" element={<FacultyUploads />} />

        <Route path="uploads/new" element={<FacultyUploadLecture />} />

        {/* =========================
            FACULTY SUBJECTS
        ========================= */}

        <Route path="subjects" element={<FacultySubjects />} />

        {/* =========================
            SUBJECT DETAILS
        ========================= */}

        <Route path="subjects/:subjectId" element={<FacultySubjectDetails />} />

        {/* =========================
            SHORT LECTURE DETAILS
        ========================= */}

        <Route path="lectures/:lectureId" element={<FacultyLectureDetails />} />

        {/* =========================
            LECTURER PAGE
        ========================= */}

        <Route
          path="subjects/:subjectId/lecturers/:lecturerId"
          element={<FacultyLectureDetails />}
        />

        {/* =================================================
            FULL LECTURE DETAILS

            Example:
            /faculty/subjects/1/lecturers/ada-lovelace/lectures/1
        ================================================= */}

        <Route
          path="subjects/:subjectId/lecturers/:lecturerId/lectures/:lectureId"
          element={<FacultyLectureDetails />}
        />

        {/* =================================================
            INDIVIDUAL LECTURE ANALYTICS
        ================================================= */}

        <Route
          path="subjects/:subjectId/lecturers/:lecturerId/lectures/:lectureId/analytics"
          element={<FacultyAnalytics />}
        />

        {/* =========================
            SHORT ANALYTICS ROUTE
        ========================= */}

        <Route
          path="analytics/:subjectId/:lecturerId/:lectureId"
          element={<FacultyAnalytics />}
        />

        {/* =========================
            FACULTY STUDENT PROGRESS
        ========================= */}

        <Route path="student-progress" element={<FacultyStudentProgress />} />

        {/* =================================================
            INDIVIDUAL STUDENT PROGRESS

            Example:
            /faculty/student-progress/1CS21CS001
        ================================================= */}

        <Route
          path="student-progress/:usn"
          element={<StudentProgressDetails />}
        />

        {/* =========================
            FACULTY SETTINGS
        ========================= */}

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
        {/* /student */}

        <Route index element={<Navigate to="dashboard" replace />} />

        {/* =========================
            STUDENT DASHBOARD
        ========================= */}

        <Route path="dashboard" element={<StudentDashboard />} />

        {/* =========================
            STUDENT SUBJECTS
        ========================= */}

        <Route path="subjects" element={<StudentSubjects />} />

        <Route path="subjects/:subjectId" element={<SubjectLectures />} />

        {/* =========================
            STUDENT LECTURES
        ========================= */}

        <Route path="lectures/:lectureId" element={<StudentLectureDetails />} />

        {/* =========================
            STUDENT TRANSCRIPT
        ========================= */}

        <Route
          path="lectures/:lectureId/transcript"
          element={<StudentTranscript />}
        />

        {/* =========================
            STUDENT SUMMARY
        ========================= */}

        <Route
          path="lectures/:lectureId/summary"
          element={<StudentSummary />}
        />

        {/* =========================
            STUDENT KEY CONCEPTS
        ========================= */}

        <Route
          path="lectures/:lectureId/key-concepts"
          element={<StudentKeyConcepts />}
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

        {/* =========================
            SUBJECT → LECTURERS
        ========================= */}

        <Route
          path="subjects/:subjectId/lecturers"
          element={<SubjectLectures />}
        />

        <Route
          path="subjects/:subjectId/lecturers/:lecturerId"
          element={<SubjectLectures />}
        />

        {/* =========================
            STUDENT PROGRESS
        ========================= */}

        <Route path="progress" element={<StudentProgress />} />

        {/* =========================
            STUDENT SETTINGS
        ========================= */}

        <Route path="settings" element={<StudentSettings />} />
      </Route>

      {/* =========================
          INVALID URL
      ========================= */}

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;
