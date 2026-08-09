import { BookOpen, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { subjects } from "../../data/subjects";
import { lectures } from "../../data/lectures";

function FacultySubjects() {
  const navigate = useNavigate();

  const getLectureCount = (subject) => {
    return lectures.filter((lecture) => {
      if (
        lecture.subjectId &&
        String(lecture.subjectId) === String(subject.id)
      ) {
        return true;
      }

      return lecture.subject?.toLowerCase() === subject.name?.toLowerCase();
    }).length;
  };

  return (
    <div className="page">
      <section>
        <p className="eyebrow">SUBJECTS</p>

        <h1>Subjects</h1>

        <p className="muted">
          Select a subject to view the lecturers and lectures available under
          it.
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 16,
          marginTop: 24,
        }}
      >
        {subjects.map((subject) => {
          const lectureCount = getLectureCount(subject);

          return (
            <button
              key={subject.id}
              type="button"
              className="card"
              onClick={() => navigate(`/faculty/subjects/${subject.id}`)}
              style={{
                textAlign: "left",
                padding: 22,
                cursor: "pointer",
                background: "var(--card-bg)",
                border: "1px solid var(--border-color)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
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
                {lectureCount} lecture
                {lectureCount !== 1 ? "s" : ""}
              </p>

              <strong>View Lecturers →</strong>
            </button>
          );
        })}
      </section>
    </div>
  );
}

export default FacultySubjects;
