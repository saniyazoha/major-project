import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock3,
  GraduationCap,
  TrendingUp,
  UserRound,
} from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";

const students = [
  {
    usn: "1CS21CS001",
    name: "Aarav Deshpande",
    batch: "Batch 2024-A",
    classesAttended: 18,
    totalClasses: 20,
    quizzesAttended: 12,
    totalQuizzes: 14,
    averageQuizScore: 82,
    lectureProgress: 88,
    studyHours: 26,
  },
  {
    usn: "1CS21CS007",
    name: "Bhavana Kulkarni",
    batch: "Batch 2024-A",
    classesAttended: 19,
    totalClasses: 20,
    quizzesAttended: 14,
    totalQuizzes: 14,
    averageQuizScore: 91,
    lectureProgress: 96,
    studyHours: 31,
  },
  {
    usn: "1CS21CS012",
    name: "Chetan Rao",
    batch: "Batch 2024-A",
    classesAttended: 15,
    totalClasses: 20,
    quizzesAttended: 10,
    totalQuizzes: 14,
    averageQuizScore: 74,
    lectureProgress: 72,
    studyHours: 20,
  },
  {
    usn: "1CS21CS019",
    name: "Divya Patil",
    batch: "Batch 2024-A",
    classesAttended: 17,
    totalClasses: 20,
    quizzesAttended: 12,
    totalQuizzes: 14,
    averageQuizScore: 85,
    lectureProgress: 84,
    studyHours: 24,
  },
  {
    usn: "1CS21CS024",
    name: "Faizan Ahmed",
    batch: "Batch 2023-B",
    classesAttended: 16,
    totalClasses: 20,
    quizzesAttended: 11,
    totalQuizzes: 14,
    averageQuizScore: 79,
    lectureProgress: 78,
    studyHours: 22,
  },
];

export default function StudentProgressDetails() {
  const navigate = useNavigate();

  const { usn } = useParams();

  const student =
    students.find(
      (item) => item.usn.toLowerCase() === String(usn || "").toLowerCase(),
    ) || students[0];

  const attendancePercentage =
    student.totalClasses === 0
      ? 0
      : Math.round((student.classesAttended / student.totalClasses) * 100);

  const quizCompletion =
    student.totalQuizzes === 0
      ? 0
      : Math.round((student.quizzesAttended / student.totalQuizzes) * 100);

  return (
    <div className="page">
      {/* =========================
          BACK
      ========================= */}

      <button
        type="button"
        className="back-button"
        onClick={() => navigate("/faculty/student-progress")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
        }}
      >
        <ArrowLeft size={16} />
        Back to Student Progress
      </button>

      {/* =========================
          STUDENT HEADER
      ========================= */}

      <section
        style={{
          marginTop: 22,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p className="eyebrow">STUDENT PROGRESS</p>

            <h1
              style={{
                marginTop: 6,
                marginBottom: 6,
                fontSize: 32,
              }}
            >
              {student.name}
            </h1>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
                color: "#667085",
                fontSize: 13,
              }}
            >
              <span>{student.usn}</span>

              <span>•</span>

              <span>{student.batch}</span>
            </div>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 999,
              background: "#eef4fb",
              color: "#173b6d",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <UserRound size={16} />
            Student
          </div>
        </div>
      </section>

      {/* =========================
          MAIN SUMMARY CARDS
      ========================= */}

      <section
        style={{
          marginTop: 24,
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 16,
        }}
      >
        <div
          className="card"
          style={{
            padding: 20,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#eef4fb",
              color: "#173b6d",
            }}
          >
            <BookOpen size={20} />
          </div>

          <p
            className="muted"
            style={{
              marginTop: 14,
              marginBottom: 5,
              fontSize: 12,
            }}
          >
            Classes Attended
          </p>

          <h2
            style={{
              margin: 0,
              fontSize: 25,
            }}
          >
            {student.classesAttended}/{student.totalClasses}
          </h2>
        </div>

        <div
          className="card"
          style={{
            padding: 20,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#eef4fb",
              color: "#173b6d",
            }}
          >
            <ClipboardList size={20} />
          </div>

          <p
            className="muted"
            style={{
              marginTop: 14,
              marginBottom: 5,
              fontSize: 12,
            }}
          >
            Quizzes Attended
          </p>

          <h2
            style={{
              margin: 0,
              fontSize: 25,
            }}
          >
            {student.quizzesAttended}/{student.totalQuizzes}
          </h2>
        </div>

        <div
          className="card"
          style={{
            padding: 20,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#eef4fb",
              color: "#173b6d",
            }}
          >
            <TrendingUp size={20} />
          </div>

          <p
            className="muted"
            style={{
              marginTop: 14,
              marginBottom: 5,
              fontSize: 12,
            }}
          >
            Average Quiz Score
          </p>

          <h2
            style={{
              margin: 0,
              fontSize: 25,
            }}
          >
            {student.averageQuizScore}%
          </h2>
        </div>

        <div
          className="card"
          style={{
            padding: 20,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#eef4fb",
              color: "#173b6d",
            }}
          >
            <Clock3 size={20} />
          </div>

          <p
            className="muted"
            style={{
              marginTop: 14,
              marginBottom: 5,
              fontSize: 12,
            }}
          >
            Study Hours
          </p>

          <h2
            style={{
              margin: 0,
              fontSize: 25,
            }}
          >
            {student.studyHours} hrs
          </h2>
        </div>
      </section>

      {/* =========================
          ATTENDANCE
      ========================= */}

      <section
        className="card"
        style={{
          marginTop: 20,
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p className="eyebrow">ATTENDANCE</p>

            <h2
              style={{
                marginTop: 6,
                marginBottom: 0,
                fontSize: 20,
              }}
            >
              Attendance Progress
            </h2>

            <p
              className="muted"
              style={{
                marginTop: 5,
                fontSize: 12,
              }}
            >
              {student.classesAttended} of {student.totalClasses} classes
              attended
            </p>
          </div>

          <strong
            style={{
              fontSize: 28,
              color: "#173b6d",
            }}
          >
            {attendancePercentage}%
          </strong>
        </div>

        <div
          style={{
            marginTop: 18,
            width: "100%",
            height: 10,
            borderRadius: 999,
            overflow: "hidden",
            background: "#e7edf5",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${attendancePercentage}%`,
              borderRadius: 999,
              background: "#1f6feb",
            }}
          />
        </div>
      </section>

      {/* =========================
          QUIZ + LECTURE PROGRESS
      ========================= */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 18,
          marginTop: 20,
        }}
      >
        {/* Quiz */}

        <div
          className="card"
          style={{
            padding: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 9,
                background: "#eef4fb",
                color: "#173b6d",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircle2 size={19} />
            </div>

            <div>
              <p className="eyebrow">QUIZ PROGRESS</p>

              <h3
                style={{
                  margin: "4px 0 0",
                }}
              >
                Quiz Completion
              </h3>
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              className="muted"
              style={{
                fontSize: 12,
              }}
            >
              {student.quizzesAttended} of {student.totalQuizzes} completed
            </span>

            <strong>{quizCompletion}%</strong>
          </div>

          <div
            style={{
              height: 8,
              marginTop: 10,
              borderRadius: 999,
              overflow: "hidden",
              background: "#e7edf5",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${quizCompletion}%`,
                borderRadius: 999,
                background: "#1f6feb",
              }}
            />
          </div>

          <div
            style={{
              marginTop: 18,
              paddingTop: 16,
              borderTop: "1px solid #eef1f5",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              className="muted"
              style={{
                fontSize: 12,
              }}
            >
              Average score
            </span>

            <strong
              style={{
                color: "#18794e",
              }}
            >
              {student.averageQuizScore}%
            </strong>
          </div>
        </div>

        {/* Lecture progress */}

        <div
          className="card"
          style={{
            padding: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 9,
                background: "#eef4fb",
                color: "#173b6d",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <GraduationCap size={19} />
            </div>

            <div>
              <p className="eyebrow">LECTURE PROGRESS</p>

              <h3
                style={{
                  margin: "4px 0 0",
                }}
              >
                Learning Completion
              </h3>
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              className="muted"
              style={{
                fontSize: 12,
              }}
            >
              Overall lecture progress
            </span>

            <strong>{student.lectureProgress}%</strong>
          </div>

          <div
            style={{
              height: 8,
              marginTop: 10,
              borderRadius: 999,
              overflow: "hidden",
              background: "#e7edf5",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${student.lectureProgress}%`,
                borderRadius: 999,
                background: "#1f6feb",
              }}
            />
          </div>

          <div
            style={{
              marginTop: 18,
              padding: 14,
              borderRadius: 9,
              background: "#f7f9fc",
            }}
          >
            <p
              className="muted"
              style={{
                margin: 0,
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              Progress is based on lecture access, viewed materials, quizzes
              completed, and overall activity.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
