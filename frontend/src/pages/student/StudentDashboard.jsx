import { CalendarDays, Clock, LogOut } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { lectures } from "../../data/lectures";

export default function StudentDashboard() {
  const navigate = useNavigate();

  const username = localStorage.getItem("username") || "Kee";
  const firstName = username.trim().split(" ")[0] || "Kee";

  const broadcastLectures = useMemo(() => {
    return lectures.filter(
      (lecture) => lecture.broadcastStatus === "Broadcast",
    );
  }, []);

  const completedLectures = useMemo(() => {
    return broadcastLectures.filter((lecture) => lecture.status === "Processed")
      .length;
  }, [broadcastLectures]);

  const totalLectures = broadcastLectures.length;

  const overallProgress =
    totalLectures === 0
      ? 0
      : Math.round((completedLectures / totalLectures) * 100);

  const averageQuizScore = 88;

  const pendingReviews = Math.max(
    0,
    broadcastLectures.length - completedLectures,
  );

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("role");
    localStorage.removeItem("username");

    navigate("/login", { replace: true });
  };

  const formatDuration = (duration) => {
    if (!duration) return "45 mins";

    if (duration.includes(":")) {
      const [minutes] = duration.split(":");
      return `${minutes} mins`;
    }

    return duration;
  };

  return (
    <div
      className="page"
      style={{
        maxWidth: "1280px",
        margin: "0 auto",
        paddingTop: 10,
      }}
    >
      {/* =====================================================
          WELCOME HEADER
      ===================================================== */}

      <section>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                color: "#0f274f",
                fontSize: 34,
                lineHeight: 1.2,
                fontWeight: 700,
                letterSpacing: "-0.7px",
              }}
            >
              Welcome back, {firstName}
            </h1>

            <p
              style={{
                margin: "5px 0 0",
                color: "#68778d",
                fontSize: 15,
                lineHeight: 1.6,
              }}
            >
              Here's what your faculty has released recently.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
            style={{
              width: 38,
              height: 38,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: "1px solid #e2e8f0",
              borderRadius: 9,
              background: "#ffffff",
              color: "#64748b",
              cursor: "pointer",
            }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </section>

      {/* =====================================================
          STAT CARDS
      ===================================================== */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 14,
          marginTop: 25,
        }}
      >
        <div
          className="card"
          style={{
            minHeight: 102,
            padding: "20px 20px 18px",
            borderRadius: 15,
            background: "#ffffff",
            border: "1px solid #e1e7ef",
            boxShadow: "0 8px 22px rgba(15, 39, 79, 0.07)",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#566782",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.11em",
              textTransform: "uppercase",
            }}
          >
            Overall Progress
          </p>

          <strong
            style={{
              display: "block",
              marginTop: 9,
              color: "#0f274f",
              fontSize: 28,
              lineHeight: 1,
              fontWeight: 700,
            }}
          >
            {overallProgress}%
          </strong>
        </div>

        <div
          className="card"
          style={{
            minHeight: 102,
            padding: "20px 20px 18px",
            borderRadius: 15,
            background: "#ffffff",
            border: "1px solid #e1e7ef",
            boxShadow: "0 8px 22px rgba(15, 39, 79, 0.07)",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#566782",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.11em",
              textTransform: "uppercase",
            }}
          >
            Lectures Completed
          </p>

          <strong
            style={{
              display: "block",
              marginTop: 9,
              color: "#0f274f",
              fontSize: 28,
              lineHeight: 1,
              fontWeight: 700,
            }}
          >
            {completedLectures}/{totalLectures}
          </strong>
        </div>

        <div
          className="card"
          style={{
            minHeight: 102,
            padding: "20px 20px 18px",
            borderRadius: 15,
            background: "#ffffff",
            border: "1px solid #e1e7ef",
            boxShadow: "0 8px 22px rgba(15, 39, 79, 0.07)",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#566782",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.11em",
              textTransform: "uppercase",
            }}
          >
            Avg. Quiz Score
          </p>

          <strong
            style={{
              display: "block",
              marginTop: 9,
              color: "#0f274f",
              fontSize: 28,
              lineHeight: 1,
              fontWeight: 700,
            }}
          >
            {averageQuizScore}%
          </strong>
        </div>

        <div
          className="card"
          style={{
            minHeight: 102,
            padding: "20px 20px 18px",
            borderRadius: 15,
            background: "#ffffff",
            border: "1px solid #e1e7ef",
            boxShadow: "0 8px 22px rgba(15, 39, 79, 0.07)",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#566782",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.11em",
              textTransform: "uppercase",
            }}
          >
            Pending Reviews
          </p>

          <strong
            style={{
              display: "block",
              marginTop: 9,
              color: "#0f274f",
              fontSize: 28,
              lineHeight: 1,
              fontWeight: 700,
            }}
          >
            {pendingReviews}
          </strong>
        </div>
      </section>

      {/* =====================================================
          AVAILABLE LECTURES
      ===================================================== */}

      <section
        style={{
          marginTop: 39,
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "#0f274f",
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          Available lectures
        </h2>

        {broadcastLectures.length === 0 ? (
          <div
            className="card"
            style={{
              marginTop: 14,
              padding: 32,
              borderRadius: 15,
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#68778d",
                fontSize: 14,
              }}
            >
              No broadcast lectures are currently available.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 13,
              marginTop: 14,
            }}
          >
            {broadcastLectures.map((lecture) => (
              <div
                key={lecture.id}
                className="card"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/student/lectures/${lecture.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    navigate(`/student/lectures/${lecture.id}`);
                  }
                }}
                style={{
                  width: "100%",
                  minHeight: 132,
                  padding: "22px 24px",
                  background: "#ffffff",
                  border: "1px solid #e1e7ef",
                  borderRadius: 15,
                  boxShadow: "0 10px 26px rgba(15, 39, 79, 0.07)",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 20,
                  }}
                >
                  <div
                    style={{
                      minWidth: 0,
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        color: "#1f6feb",
                        fontSize: 17,
                        lineHeight: 1.4,
                        fontWeight: 700,
                      }}
                    >
                      {lecture.title}
                    </h3>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 8,
                        marginTop: 8,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          minHeight: 23,
                          padding: "3px 9px",
                          borderRadius: 999,
                          background: "#eef2f7",
                          color: "#64748b",
                          fontSize: 11,
                          fontWeight: 500,
                        }}
                      >
                        {lecture.subjectCode}
                      </span>

                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          minHeight: 23,
                          padding: "3px 9px",
                          borderRadius: 999,
                          background: "#eef2f7",
                          color: "#64748b",
                          fontSize: 11,
                          fontWeight: 500,
                        }}
                      >
                        {lecture.batch}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      flexShrink: 0,
                      padding: "5px 10px",
                      borderRadius: 999,
                      background: "#e9f7ef",
                      color: "#179253",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#27a568",
                      }}
                    />

                    {lecture.broadcastStatus}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 17,
                    marginTop: 14,
                    color: "#68778d",
                    fontSize: 12,
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                    }}
                  >
                    <CalendarDays size={14} />
                    {lecture.date}
                  </span>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                    }}
                  >
                    <Clock size={14} />
                    {formatDuration(lecture.duration)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
