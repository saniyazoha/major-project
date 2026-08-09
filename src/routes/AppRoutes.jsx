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

/* =========================
   STUDENT PAGES
========================= */

import StudentDashboard from "../pages/student/StudentDashboard";
import StudentSubjects from "../pages/student/StudentSubjects";
import StudentSubjectDetails from "../pages/student/StudentSubjectDetails";
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

        {/* /faculty/dashboard */}
        <Route path="dashboard" element={<FacultyDashboard />} />

        {/* =========================
            FACULTY UPLOADS
        ========================= */}

        {/* /faculty/uploads */}
        <Route path="uploads" element={<FacultyUploads />} />

        {/* /faculty/uploads/new */}
        <Route path="uploads/new" element={<FacultyUploadLecture />} />

        {/* =========================
            FACULTY SUBJECTS
        ========================= */}

        {/* /faculty/subjects */}
        <Route path="subjects" element={<FacultySubjects />} />

        {/* =================================================
            SUBJECT → LECTURERS
           
            Example:
            /faculty/subjects/software-engineering
        ================================================= */}

        <Route path="subjects/:subjectId" element={<FacultySubjectDetails />} />

        {/* =================================================
            LECTURE DETAILS
           
            Example:
            /faculty/lectures/lecture-1
        ================================================= */}

        <Route path="lectures/:lectureId" element={<FacultyLectureDetails />} />

        {/* =================================================
            LECTURER → LECTURES
           
            Example:
            /faculty/subjects/software-engineering/lecturers/john
        ================================================= */}

        <Route
          path="subjects/:subjectId/lecturers/:lecturerId"
          element={<FacultyLectureDetails />}
        />

        {/* =================================================
            INDIVIDUAL LECTURE ANALYTICS

            Example:
            /faculty/subjects/software-engineering/lecturers/john/lectures/lecture-1/analytics

            This allows different lecturers and different
            lectures to have completely separate analytics.
        ================================================= */}

        <Route
          path="subjects/:subjectId/lecturers/:lecturerId/lectures/:lectureId/analytics"
          element={<FacultyAnalytics />}
        />

        {/* =================================================
            SHORT ANALYTICS ROUTE

            Useful when clicking View Analytics from Uploads.

            Example:
            /faculty/analytics/software-engineering/john/lecture-1
        ================================================= */}

        <Route
          path="analytics/:subjectId/:lecturerId/:lectureId"
          element={<FacultyAnalytics />}
        />

        {/* =========================
            FACULTY SETTINGS
        ========================= */}

        {/* /faculty/settings */}
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

        {/* /student/dashboard */}
        <Route path="dashboard" element={<StudentDashboard />} />

        {/* =========================
            STUDENT SUBJECTS
        ========================= */}

        {/* /student/subjects */}
        <Route path="subjects" element={<StudentSubjects />} />

        {/* /student/subjects/:subjectId */}
        <Route path="subjects/:subjectId" element={<StudentSubjectDetails />} />

        {/* =========================
            STUDENT LECTURES
        ========================= */}

        {/* /student/lectures/:id */}
        <Route path="lectures/:id" element={<StudentLectureDetails />} />

        {/* =========================
            STUDENT LECTURE RESOURCES
        ========================= */}

        {/* /student/lectures/:id/transcript */}
        <Route path="lectures/:id/transcript" element={<StudentTranscript />} />

        {/* /student/lectures/:id/summary */}
        <Route path="lectures/:id/summary" element={<StudentSummary />} />

        {/* /student/lectures/:id/key-concepts */}
        <Route
          path="lectures/:id/key-concepts"
          element={<StudentKeyConcepts />}
        />

        {/* /student/lectures/:id/flashcards */}
        <Route path="lectures/:id/flashcards" element={<StudentFlashcards />} />

        {/* /student/lectures/:id/quiz */}
        <Route path="lectures/:id/quiz" element={<StudentQuiz />} />

        {/* /student/lectures/:id/qa */}
        <Route path="lectures/:id/qa" element={<StudentQA />} />

        {/* =========================
            STUDENT PROGRESS
        ========================= */}

        {/* /student/progress */}
        <Route path="progress" element={<StudentProgress />} />

        {/* =========================
            STUDENT SETTINGS
        ========================= */}

        {/* /student/settings */}
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
