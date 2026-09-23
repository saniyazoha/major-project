import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  RefreshCw,
  Search,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiClient } from "../../api/client";

export default function StudentSubjects() {
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get("/subjects");
      setSubjects(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error("Failed to load student subjects:", err);
      setError(
        err.message ||
          "Failed to load enrolled subjects. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const filteredSubjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return subjects;
    }

    return subjects.filter(
      (subject) =>
        subject.name?.toLowerCase().includes(query) ||
        subject.code?.toLowerCase().includes(query),
    );
  }, [searchTerm, subjects]);

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
            Browse your enrolled subjects and view available lectures.
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
            <span>Enrolled Subjects</span>
            <strong>{subjects.length}</strong>
          </div>
        </div>

        <div className="card student-subject-summary-card">
          <div className="student-summary-icon">
            <CheckCircle size={20} />
          </div>

          <div>
            <span>Completed Lectures</span>
            <strong>0</strong>
          </div>
        </div>

        <div className="card student-subject-summary-card">
          <div className="student-summary-icon">
            <TrendingUp size={20} />
          </div>

          <div>
            <span>Average Progress</span>
            <strong>0%</strong>
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

        {loading ? (
          <div className="card student-subject-empty">
            <RefreshCw size={32} className="animate-spin" />
            <p>Loading enrolled subjects...</p>
          </div>
        ) : error ? (
          <div className="card student-subject-empty">
            <AlertCircle size={38} />
            <h3>Failed to load subjects</h3>
            <p>{error}</p>
            <button
              type="button"
              className="secondary-action-button"
              onClick={fetchSubjects}
            >
              <RefreshCw size={15} /> Retry
            </button>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="card student-subject-empty">
            <Search size={38} />

            <h3>
              {searchTerm ? "No subjects found" : "No subjects available"}
            </h3>

            <p>
              {searchTerm
                ? "Try a different subject name or code."
                : "You are not currently enrolled in any subjects."}
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
                <div className="student-subject-card-top">
                  <div className="student-subject-icon">
                    <BookOpen size={20} />
                  </div>

                  <span className="student-subject-percentage">
                    Enrolled
                  </span>
                </div>

                <div>
                  <h3>{subject.name}</h3>

                  {subject.code && (
                    <p className="student-subject-code">{subject.code}</p>
                  )}
                </div>

                <div
                  className="student-subject-card-footer"
                  style={{ marginTop: "auto", paddingTop: "1rem" }}
                >
                  <span>View Lectures</span>

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
