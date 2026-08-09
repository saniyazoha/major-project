import { BookOpen, Clock, UploadCloud, Users, ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { lectures } from "../../data/lectures";
import { subjects } from "../../data/subjects";

function FacultyDashboard() {
  const navigate = useNavigate();

  /*
   * Build recently uploaded subjects from lectures.
   * A subject is shown only once.
   */
  const recentSubjects = useMemo(() => {
    const subjectMap = new Map();

    lectures.forEach((lecture) => {
      let subject = null;

      if (lecture.subjectId) {
        subject = subjects.find(
          (item) => String(item.id) === String(lecture.subjectId),
        );
      }

      if (!subject && lecture.subject) {
        subject = subjects.find(
          (item) => item.name?.toLowerCase() === lecture.subject?.toLowerCase(),
        );
      }

      if (!subject) {
        subject = {
          id: lecture.subjectId || lecture.subject,
          name: lecture.subject || "Unknown Subject",
          code: "",
        };
      }

      if (!subjectMap.has(String(subject.id))) {
        subjectMap.set(String(subject.id), {
          ...subject,
          lectureCount: 0,
          latestDate: lecture.date,
        });
      }

      const existing = subjectMap.get(String(subject.id));

      existing.lectureCount += 1;

      if (lecture.date) {
        existing.latestDate = lecture.date;
      }
    });

    return Array.from(subjectMap.values()).slice(0, 6);
  }, []);

  const processedLectures = lectures.filter(
    (lecture) => lecture.status === "Processed",
  ).length;

  return (
    <div className="page">
      {/* =========================
          HEADER
      ========================= */}

      <section>
        <p className="eyebrow">FACULTY DASHBOARD</p>

        <h1>Welcome back</h1>

        <p className="muted">
          Manage your subjects, lectures, uploads, and lecture analytics.
        </p>
      </section>

      {/* =========================
          QUICK STATS
      ========================= */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 16,
          marginTop: 24,
        }}
      >
        <div className="card" style={{ padding: 20 }}>
          <BookOpen size={23} />

          <p className="muted">Total Lectures</p>

          <h2 style={{ margin: 0 }}>{lectures.length}</h2>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <UploadCloud size={23} />

          <p className="muted">Processed</p>

          <h2 style={{ margin: 0 }}>{processedLectures}</h2>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <Users size={23} />

          <p className="muted">Subjects</p>

          <h2 style={{ margin: 0 }}>{recentSubjects.length}</h2>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <Clock size={23} />

          <p className="muted">Pending</p>

          <h2 style={{ margin: 0 }}>{lectures.length - processedLectures}</h2>
        </div>
      </section>

      {/* =========================
          RECENTLY UPLOADED SUBJECTS
      ========================= */}

      <section style={{ marginTop: 32 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p className="eyebrow">RECENTLY UPLOADED</p>

            <h2>Recently Uploaded Subjects</h2>

            <p className="muted">
              Select a subject to view the lecturers associated with it.
            </p>
          </div>

          <button
            className="secondary-action-button"
            type="button"
            onClick={() => navigate("/faculty/subjects")}
          >
            View All Subjects
          </button>
        </div>

        {recentSubjects.length === 0 ? (
          <div
            className="card"
            style={{
              marginTop: 18,
              padding: 32,
              textAlign: "center",
            }}
          >
            <BookOpen size={40} />

            <h3>No subjects available</h3>

            <p className="muted">Upload a lecture to create subject content.</p>

            <button
              className="primary-action-button"
              type="button"
              onClick={() => navigate("/faculty/uploads/new")}
            >
              Upload Lecture
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 16,
              marginTop: 18,
            }}
          >
            {recentSubjects.map((subject) => (
              <button
                key={subject.id}
                type="button"
                className="card"
                onClick={() => navigate(`/faculty/subjects/${subject.id}`)}
                style={{
                  textAlign: "left",
                  padding: 20,
                  cursor: "pointer",
                  border: "1px solid var(--border-color)",
                  background: "var(--card-bg)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <div className="upload-icon">
                    <BookOpen size={22} />
                  </div>

                  <ArrowRight size={18} />
                </div>

                <h3 style={{ marginTop: 18 }}>{subject.name}</h3>

                {subject.code && <p className="muted">{subject.code}</p>}

                <p className="muted">
                  {subject.lectureCount} lecture
                  {subject.lectureCount !== 1 ? "s" : ""}
                </p>

                <span
                  style={{
                    display: "inline-flex",
                    marginTop: 8,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  View Lecturers →
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default FacultyDashboard;
