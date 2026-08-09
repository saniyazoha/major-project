import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Search,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { subjects } from "../../data/subjects";
import { lectures } from "../../data/lectures";

export default function StudentSubjects() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");

  const subjectProgress = useMemo(() => {
    return subjects.map((subject) => {
      const subjectLectures = lectures.filter(
        (lecture) => String(lecture.subjectId) === String(subject.id),
      );

      const completed = subjectLectures.filter(
        (lecture) => lecture.status === "Processed",
      ).length;

      const total = subject.lectures ?? subjectLectures.length;

      const progress =
        typeof subject.progress === "number"
          ? subject.progress
          : Math.round((completed / Math.max(1, total)) * 100);

      return {
        ...subject,
        completed,
        total,
        progress,
      };
    });
  }, []);

  const filteredSubjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return subjectProgress;
    }

    return subjectProgress.filter(
      (subject) =>
        subject.name?.toLowerCase().includes(query) ||
        subject.code?.toLowerCase().includes(query),
    );
  }, [searchTerm, subjectProgress]);

  return (
    <div className="page student-page">
      {/* =================================
          PAGE HEADER
      ================================= */}

      <section className="page-header">
        <div>
          <p className="eyebrow">LEARNING</p>

          <h1>Your Subjects</h1>

          <p className="muted">
            Browse your subjects and continue learning from available lectures.
          </p>
        </div>

        <button
          type="button"
          className="secondary-action-button"
          onClick={() => navigate("/student/dashboard")}
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </section>

      {/* =================================
          SEARCH
      ================================= */}

      <section className="student-subject-search">
        <div className="student-search-box">
          <Search size={17} />

          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search subjects..."
            aria-label="Search subjects"
          />

          {searchTerm && (
            <button
              type="button"
              className="student-search-clear"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </section>

      {/* =================================
          SUMMARY
      ================================= */}

      <section className="student-subject-summary">
        <div className="card student-subject-summary-card">
          <div className="student-summary-icon">
            <BookOpen size={20} />
          </div>

          <div>
            <span>Subjects</span>
            <strong>{subjectProgress.length}</strong>
          </div>
        </div>

        <div className="card student-subject-summary-card">
          <div className="student-summary-icon">
            <CheckCircle size={20} />
          </div>

          <div>
            <span>Completed Lectures</span>
            <strong>
              {subjectProgress.reduce(
                (total, subject) => total + subject.completed,
                0,
              )}
            </strong>
          </div>
        </div>

        <div className="card student-subject-summary-card">
          <div className="student-summary-icon">
            <TrendingUp size={20} />
          </div>

          <div>
            <span>Average Progress</span>

            <strong>
              {subjectProgress.length === 0
                ? 0
                : Math.round(
                    subjectProgress.reduce(
                      (total, subject) => total + subject.progress,
                      0,
                    ) / subjectProgress.length,
                  )}
              %
            </strong>
          </div>
        </div>
      </section>

      {/* =================================
          SUBJECT LIST
      ================================= */}

      <section className="student-subject-section">
        <div className="student-section-heading">
          <div>
            <p className="eyebrow">ALL SUBJECTS</p>

            <h2>Available Subjects</h2>

            <p className="muted">
              Select a subject to view its lectures and learning materials.
            </p>
          </div>
        </div>

        {filteredSubjects.length === 0 ? (
          <div className="card student-subject-empty">
            <Search size={38} />

            <h3>
              {searchTerm ? "No subjects found" : "No subjects available"}
            </h3>

            <p>
              {searchTerm
                ? "Try a different subject name or code."
                : "Your available subjects will appear here."}
            </p>

            {searchTerm && (
              <button
                type="button"
                className="secondary-action-button"
                onClick={() => setSearchTerm("")}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="student-subject-grid">
            {filteredSubjects.map((subject) => (
              <article
                key={subject.id}
                className="card student-subject-card"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/student/subjects/${subject.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();

                    navigate(`/student/subjects/${subject.id}`);
                  }
                }}
              >
                {/* Card top */}
                <div className="student-subject-card-top">
                  <div className="student-subject-icon">
                    <BookOpen size={20} />
                  </div>

                  <span className="student-subject-percentage">
                    {subject.progress}%
                  </span>
                </div>

                {/* Subject name */}
                <div>
                  <h3>{subject.name}</h3>

                  {subject.code && (
                    <p className="student-subject-code">{subject.code}</p>
                  )}
                </div>

                {/* Progress */}
                <div className="student-subject-progress">
                  <div className="student-subject-progress-label">
                    <span>Learning Progress</span>

                    <strong>{subject.progress}%</strong>
                  </div>

                  <div className="student-subject-progress-bar">
                    <div
                      className="student-subject-progress-fill"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, subject.progress),
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="student-subject-card-footer">
                  <span>
                    {subject.completed} of {subject.total} lectures completed
                  </span>

                  <span className="student-subject-view">
                    View
                    <ArrowRight size={15} />
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
