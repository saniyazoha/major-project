import { ArrowLeft, ChevronRight, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const students = [
  {
    id: 1,
    usn: "1CS21CS001",
    name: "Aarav Deshpande",
    batch: "Batch 2024-A",
    attendance: 92,
  },
  {
    id: 2,
    usn: "1CS21CS007",
    name: "Bhavana Kulkarni",
    batch: "Batch 2024-A",
    attendance: 97,
  },
  {
    id: 3,
    usn: "1CS21CS012",
    name: "Chetan Rao",
    batch: "Batch 2024-A",
    attendance: 78,
  },
  {
    id: 4,
    usn: "1CS21CS019",
    name: "Divya Patil",
    batch: "Batch 2024-A",
    attendance: 88,
  },
  {
    id: 5,
    usn: "1CS21CS024",
    name: "Faizan Ahmed",
    batch: "Batch 2023-B",
    attendance: 81,
  },
  {
    id: 6,
    usn: "1CS21CS031",
    name: "Gagana Shetty",
    batch: "Batch 2023-B",
    attendance: 94,
  },
  {
    id: 7,
    usn: "1CS21CS038",
    name: "Harsh Vardhan",
    batch: "Batch 2024-A",
    attendance: 69,
  },
  {
    id: 8,
    usn: "1CS21CS042",
    name: "Ishita Sharma",
    batch: "Batch 2024-A",
    attendance: 91,
  },
  {
    id: 9,
    usn: "1CS21CS048",
    name: "Karan Mehta",
    batch: "Batch 2023-B",
    attendance: 86,
  },
  {
    id: 10,
    usn: "1CS21CS053",
    name: "Lavanya Rao",
    batch: "Batch 2024-A",
    attendance: 89,
  },
  {
    id: 11,
    usn: "1CS21CS057",
    name: "Manoj Kumar",
    batch: "Batch 2023-B",
    attendance: 83,
  },
  {
    id: 12,
    usn: "1CS21CS061",
    name: "Nisha Patel",
    batch: "Batch 2024-A",
    attendance: 95,
  },
];

export default function StudentProgress() {
  const navigate = useNavigate();

  return (
    <div className="page">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          border: "none",
          background: "transparent",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          padding: 0,
          fontSize: 15,
          color: "#5f6f86",
        }}
      >
        <ArrowLeft size={18} />
        Back to dashboard
      </button>

      {/* Header */}
      <section
        style={{
          marginTop: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 38,
              lineHeight: 1.15,
            }}
          >
            Student progress
          </h1>

          <p
            className="muted"
            style={{
              marginTop: 7,
              marginBottom: 0,
              fontSize: 16,
            }}
          >
            Select a USN to view that student's quizzes, attendance and study
            hours.
          </p>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "7px 12px",
            borderRadius: 999,
            background: "#eef2f7",
            color: "#506176",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <Users size={16} />
          {students.length} students
        </div>
      </section>

      {/* Student List */}
      <section
        className="card"
        style={{
          marginTop: 32,
          padding: 0,
          overflow: "hidden",
        }}
      >
        {students.map((student, index) => (
          <button
            key={student.id}
            type="button"
            onClick={() => navigate(`/faculty/student-progress/${student.usn}`)}
            style={{
              width: "100%",
              border: "none",
              borderBottom:
                index !== students.length - 1
                  ? "1px solid var(--border-color)"
                  : "none",
              background: "transparent",
              padding: "22px 24px",
              display: "grid",
              gridTemplateColumns: "44px 1fr auto 24px",
              alignItems: "center",
              gap: 16,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            {/* Row number */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "#eef2f7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#64748b",
                fontWeight: 600,
              }}
            >
              {index + 1}
            </div>

            {/* Student information */}
            <div
              style={{
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#0f274f",
                }}
              >
                {student.usn}
              </div>

              <div
                style={{
                  marginTop: 4,
                  color: "#627188",
                  fontSize: 14,
                }}
              >
                {student.name} · {student.batch}
              </div>
            </div>

            {/* Attendance */}
            <div
              style={{
                color: "#627188",
                fontSize: 14,
                whiteSpace: "nowrap",
              }}
            >
              {student.attendance}% attendance
            </div>

            <ChevronRight
              size={20}
              style={{
                color: "#6c7c90",
              }}
            />
          </button>
        ))}
      </section>
    </div>
  );
}
