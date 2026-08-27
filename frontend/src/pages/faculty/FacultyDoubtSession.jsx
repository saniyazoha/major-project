import { ArrowLeft, CircleHelp } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { lectures } from "../../data/lectures";
import { getDoubtsByLecture } from "../../data/doubtsData";

export default function FacultyDoubtSession() {
  const navigate = useNavigate();
  const { lectureId } = useParams();

  const lecture = useMemo(
    () => lectures.find((item) => String(item.id) === String(lectureId)),
    [lectureId],
  );
  const doubts = lecture ? getDoubtsByLecture(lecture.id) : [];

  if (!lecture) {
    return (
      <div className="page">
        <div className="card" style={{ padding: 30 }}>
          <h2>Lecture not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <button
        type="button"
        className="back-button"
        onClick={() => navigate(`/faculty/lectures/${lecture.id}`)}
      >
        <ArrowLeft size={16} />
        Back to Lecture
      </button>

      <section style={{ marginTop: 20 }}>
        <p className="eyebrow">DOUBT SESSION</p>
        <h1 style={{ marginTop: 6, marginBottom: 0, fontSize: 31 }}>
          {lecture.title}
        </h1>
      </section>

      <section
        className="card"
        style={{ marginTop: 20, padding: 0, overflow: "hidden" }}
      >
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid #e7ebf0",
          }}
        >
          <p className="eyebrow">STUDENT QUESTIONS</p>
          <h3 style={{ margin: "4px 0 0" }}>{doubts.length} doubts</h3>
        </div>

        {doubts.length === 0 ? (
          <div style={{ padding: 28, color: "#667085", fontSize: 14 }}>
            No doubts have been submitted for this lecture yet.
          </div>
        ) : (
          doubts.map((doubt) => (
            <button
              key={doubt.id}
              type="button"
              onClick={() =>
                navigate(`/faculty/lectures/${lecture.id}/doubts/${doubt.id}`)
              }
              style={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto",
                gap: 18,
                padding: "18px 22px",
                border: "none",
                borderBottom: "1px solid #e7ebf0",
                background: "#ffffff",
                color: "#344054",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span>
                <strong style={{ display: "block", color: "#172b4d" }}>
                  {doubt.studentName || "Student"}
                </strong>
                <span
                  style={{
                    display: "block",
                    marginTop: 4,
                    color: "#667085",
                    fontSize: 12,
                  }}
                >
                  USN: {doubt.usn || "Not available"}
                </span>
                <span
                  style={{
                    display: "block",
                    marginTop: 9,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: 14,
                  }}
                >
                  {doubt.question}
                </span>
                <span
                  style={{
                    display: "block",
                    marginTop: 6,
                    color: "#98a2b3",
                    fontSize: 11,
                  }}
                >
                  {doubt.createdAt}
                </span>
              </span>

              <span
                style={{
                  alignSelf: "start",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 9px",
                  borderRadius: 999,
                  background:
                    doubt.status === "answered" ? "#e9f7ef" : "#fff4e5",
                  color: doubt.status === "answered" ? "#18794e" : "#a15c00",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "capitalize",
                }}
              >
                <CircleHelp size={13} />
                {doubt.status || "pending"}
              </span>
            </button>
          ))
        )}
      </section>
    </div>
  );
}
