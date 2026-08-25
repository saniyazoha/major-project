import {
  BookOpen,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  LogOut,
} from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { subjects } from "../../data/subjects";
import { lectures } from "../../data/lectures";

export default function StudentDashboard() {
  const navigate = useNavigate();

  const recentLectures = useMemo(() => {
    return lectures.slice(0, 4);
  }, []);

  const completedLectures = useMemo(() => {
    return lectures.filter((lecture) => lecture.status === "Processed").length;
  }, []);

  const totalLectures = lectures.length;

  const remainingLectures = Math.max(0, totalLectures - completedLectures);

  const overallProgress =
    totalLectures === 0
      ? 0
      : Math.round((completedLectures / totalLectures) * 100);

  const subjectProgress = useMemo(() => {
    return subjects.map((subject) => {
      const subjectLectures = lectures.filter(
        (lecture) => String(lecture.subjectId) === String(subject.id),
      );

      const completed = subjectLectures.filter(
        (lecture) => lecture.status === "Processed",
      ).length;

      const total =
        typeof subject.lectures === "number"
          ? subject.lectures
          : subjectLectures.length;

      const calculatedProgress =
        total === 0 ? 0 : Math.round((completed / total) * 100);

      const progress =
        typeof subject.progress === "number"
          ? subject.progress
          : calculatedProgress;

      return {
        ...subject,
        total,
        completed,
        progress: Math.min(100, Math.max(0, progress)),
      };
    });
  }, []);

  /*
   * Frontend-only logout.
   *
   * The existing Login page stores authentication information
   * in localStorage using these keys:
   *
   * isAuthenticated
   * role
   * username
   *
   * Remove all of them and return to the existing Login page.
   */
  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("role");
    localStorage.removeItem("username");

    navigate("/login", { replace: true });
  };

  return (
    <div className="page">
      {/* Page Header */}
      <section className="student-dashboard-header">
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
            <p className="eyebrow">LEARNING</p>

            <h1>Student Dashboard</h1>

            <p className="muted">
              Continue learning and track your progress across your subjects.
            </p>
          </div>

          <button
            type="button"
            className="secondary-action-button"
            onClick={handleLogout}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </section>

      {/* Overview Cards */}
      <section
        className="student-dashboard-stats"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 16,
          marginTop: 24,
        }}
      >
        <div
          className="card student-stat-card"
          style={{
            padding: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#eef4ff",
              }}
            >
              <BookOpen size={21} />
            </div>
          </div>

          <p
            className="muted"
            style={{
              marginTop: 16,
              marginBottom: 6,
            }}
          >
            Total Lectures
          </p>

          <h2
            style={{
              margin: 0,
              fontSize: 28,
            }}
          >
            {totalLectures}
          </h2>
        </div>

        <div
          className="card student-stat-card"
          style={{
            padding: 20,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#eef4ff",
            }}
          >
            <CheckCircle size={21} />
          </div>

          <p
            className="muted"
            style={{
              marginTop: 16,
              marginBottom: 6,
            }}
          >
            Completed
          </p>

          <h2
            style={{
              margin: 0,
              fontSize: 28,
            }}
          >
            {completedLectures}
          </h2>
        </div>

        <div
          className="card student-stat-card"
          style={{
            padding: 20,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#eef4ff",
            }}
          >
            <TrendingUp size={21} />
          </div>

          <p
            className="muted"
            style={{
              marginTop: 16,
              marginBottom: 6,
            }}
          >
            Overall Progress
          </p>

          <h2
            style={{
              margin: 0,
              fontSize: 28,
            }}
          >
            {overallProgress}%
          </h2>
        </div>

        <div
          className="card student-stat-card"
          style={{
            padding: 20,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#eef4ff",
            }}
          >
            <Clock size={21} />
          </div>

          <p
            className="muted"
            style={{
              marginTop: 16,
              marginBottom: 6,
            }}
          >
            Remaining
          </p>

          <h2
            style={{
              margin: 0,
              fontSize: 28,
            }}
          >
            {remainingLectures}
          </h2>
        </div>
      </section>

      {/* Overall Progress */}
      <section
        className="card student-progress-card"
        style={{
          marginTop: 24,
          padding: 24,
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
            <p className="eyebrow">YOUR PROGRESS</p>

            <h2
              style={{
                margin: 0,
              }}
            >
              Overall Learning Progress
            </h2>

            <p
              className="muted"
              style={{
                marginTop: 6,
                marginBottom: 0,
              }}
            >
              {completedLectures} of {totalLectures} lectures completed
            </p>
          </div>

          <strong
            style={{
              fontSize: 30,
              lineHeight: 1,
            }}
          >
            {overallProgress}%
          </strong>
        </div>

        <div
          style={{
            marginTop: 20,
            height: 10,
            background: "#e6eef8",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${overallProgress}%`,
              height: "100%",
              background: "#1f6feb",
              borderRadius: 999,
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <button
          type="button"
          className="primary-action-button"
          onClick={() => navigate("/student/progress")}
          style={{
            marginTop: 18,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          View Detailed Progress
          <ArrowRight size={16} />
        </button>
      </section>

      {/* Subjects */}
      <section
        className="student-dashboard-section"
        style={{
          marginTop: 28,
        }}
      >
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
            <p className="eyebrow">SUBJECTS</p>

            <h2
              style={{
                margin: 0,
              }}
            >
              Your Subjects
            </h2>
          </div>

          <button
            type="button"
            className="secondary-action-button"
            onClick={() => navigate("/student/subjects")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
            }}
          >
            View All
            <ArrowRight size={15} />
          </button>
        </div>

        {subjectProgress.length === 0 ? (
          <div
            className="card empty-state"
            style={{
              marginTop: 16,
              padding: 32,
              textAlign: "center",
            }}
          >
            <BookOpen size={42} />

            <h3>No subjects available</h3>

            <p className="muted">
              Your subjects will appear here when they are available.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
              marginTop: 16,
            }}
          >
            {subjectProgress.slice(0, 4).map((subject) => (
              <div
                key={subject.id}
                className="card student-subject-card"
                role="button"
                tabIndex={0}
                style={{
                  padding: 20,
                  cursor: "pointer",
                }}
                onClick={() => navigate(`/student/subjects/${subject.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    navigate(`/student/subjects/${subject.id}`);
                  }
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 14,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                      }}
                    >
                      {subject.name}
                    </h3>

                    {subject.code && (
                      <p
                        className="muted"
                        style={{
                          marginTop: 5,
                          marginBottom: 0,
                        }}
                      >
                        {subject.code}
                      </p>
                    )}
                  </div>

                  <strong>{subject.progress}%</strong>
                </div>

                <div
                  style={{
                    marginTop: 18,
                    height: 9,
                    background: "#e6eef8",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${subject.progress}%`,
                      height: "100%",
                      background: "#1f6feb",
                      borderRadius: 999,
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                    marginTop: 10,
                  }}
                >
                  <span className="muted">
                    {subject.completed} of {subject.total} completed
                  </span>

                  <ArrowRight size={16} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Lectures */}
      <section
        className="student-dashboard-section"
        style={{
          marginTop: 30,
        }}
      >
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
            <p className="eyebrow">RECENT</p>

            <h2
              style={{
                margin: 0,
              }}
            >
              Recent Lectures
            </h2>
          </div>

          <button
            type="button"
            className="secondary-action-button"
            onClick={() => navigate("/student/subjects")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
            }}
          >
            Browse Subjects
            <ArrowRight size={15} />
          </button>
        </div>

        {recentLectures.length === 0 ? (
          <div
            className="card empty-state"
            style={{
              marginTop: 16,
              padding: 32,
              textAlign: "center",
            }}
          >
            <BookOpen size={42} />

            <h3>No lectures available</h3>

            <p className="muted">
              Lectures will appear here once they are available.
            </p>
          </div>
        ) : (
          <div
            className="lecture-list"
            style={{
              marginTop: 16,
              display: "grid",
              gap: 12,
            }}
          >
            {recentLectures.map((lecture) => (
              <div
                key={lecture.id}
                className="card student-lecture-card"
                role="button"
                tabIndex={0}
                style={{
                  padding: 20,
                  cursor: "pointer",
                }}
                onClick={() => navigate(`/student/lectures/${lecture.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    navigate(`/student/lectures/${lecture.id}`);
                  }
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      minWidth: 0,
                    }}
                  >
                    <p
                      className="muted"
                      style={{
                        margin: 0,
                      }}
                    >
                      {lecture.status || "Processed"}
                    </p>

                    <h3
                      style={{
                        marginTop: 6,
                        marginBottom: 0,
                      }}
                    >
                      {lecture.title}
                    </h3>
                  </div>

                  <div
                    style={{
                      flexShrink: 0,
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ArrowRight size={18} />
                  </div>
                </div>

                <p
                  className="muted"
                  style={{
                    marginTop: 12,
                    marginBottom: 0,
                  }}
                >
                  {lecture.date}
                  {lecture.duration ? ` • ${lecture.duration}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
