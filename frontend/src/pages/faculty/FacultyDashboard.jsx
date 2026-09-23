import { CalendarDays, Clock3, Plus, SlidersHorizontal, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/client";

function FacultyDashboard() {
  const navigate = useNavigate();

  const [recentUploads, setRecentUploads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [broadcastCount, setBroadcastCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchLectures() {
      try {
        setIsLoading(true);
        setError("");
        const data = await apiClient.get("/lectures");

        if (isMounted && Array.isArray(data)) {
          setTotalCount(data.length);
          setBroadcastCount(data.filter((l) => l.status === "broadcast").length);

          const mapped = data.map((lecture) => {
            const formattedDate = lecture.created_at
              ? new Date(lecture.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Recently";

            const rawStatus = (lecture.status || "uploaded").toLowerCase();
            let displayStatus = "Uploaded";
            if (rawStatus === "broadcast") displayStatus = "Broadcast";
            else if (rawStatus === "processing") displayStatus = "Processing";
            else if (rawStatus === "draft") displayStatus = "Draft";

            const formattedSize = lecture.file_size
              ? `${(lecture.file_size / (1024 * 1024)).toFixed(1)} MB`
              : "45 mins";

            return {
              id: lecture.id,
              subjectId: lecture.subject_id,
              batchId: lecture.batch_id,
              lecturerId: "faculty",
              title: lecture.title,
              code: `SUB-${lecture.subject_id}`,
              batch: `Batch ${lecture.batch_id}`,
              date: formattedDate,
              duration: formattedSize,
              status: displayStatus,
              rawStatus,
            };
          });

          setRecentUploads(mapped);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || "Failed to load recent lectures.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchLectures();

    return () => {
      isMounted = false;
    };
  }, []);

  const dashboardStats = [
    {
      id: 1,
      label: "LECTURES UPLOADED",
      value: String(totalCount),
    },
    {
      id: 2,
      label: "BROADCAST THIS TERM",
      value: String(broadcastCount),
    },
    {
      id: 3,
      label: "AVG. QUIZ SCORE",
      value: "78%",
    },
    {
      id: 4,
      label: "AVG. SPEAKING RATE",
      value: "145 WPM",
    },
  ];

  const getStatusStyle = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "broadcast") {
      return {
        background: "#dcf3e6",
        color: "#16935b",
        dot: "#20a766",
      };
    }

    if (s === "processing") {
      return {
        background: "#fff0cf",
        color: "#805500",
        dot: "#805500",
      };
    }

    if (s === "uploaded") {
      return {
        background: "#eaf2ff",
        color: "#1769aa",
        dot: "#1769aa",
      };
    }

    return {
      background: "#eef1f5",
      color: "#667085",
      dot: "#7f8b9b",
    };
  };

  const handleLectureOpen = (lecture) => {
    navigate(`/faculty/lectures/${lecture.id}`);
  };

  return (
    <div
      className="page"
      style={{
        paddingTop: 4,
      }}
    >
      {/* =====================================================
          DASHBOARD HEADER
      ===================================================== */}

      <section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 34,
                lineHeight: 1.15,
                letterSpacing: "-0.8px",
              }}
            >
              Faculty Dashboard
            </h1>

            <p
              className="muted"
              style={{
                marginTop: 7,
                marginBottom: 0,
                fontSize: 16,
              }}
            >
              Manage your recent lectures and analyse your delivery.
            </p>
          </div>

          <button
            type="button"
            className="primary-action-button"
            onClick={() => navigate("/faculty/uploads/new")}
            style={{
              minHeight: 46,
              padding: "0 21px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              fontSize: 15,
              fontWeight: 700,
              borderRadius: 10,
            }}
          >
            <Plus size={20} />
            Upload New Lecture
          </button>
        </div>
      </section>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 16,
          marginTop: 28,
        }}
      >
        {dashboardStats.map((stat) => (
          <div
            key={stat.id}
            className="card"
            style={{
              minHeight: 112,
              padding: "24px 20px",
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#526985",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "1.6px",
              }}
            >
              {stat.label}
            </p>

            <h2
              style={{
                marginTop: 13,
                marginBottom: 0,
                fontSize: 29,
                lineHeight: 1,
                letterSpacing: "-0.5px",
              }}
            >
              {stat.value}
            </h2>
          </div>
        ))}
      </section>

      {/* =====================================================
          RECENT UPLOADS
      ===================================================== */}

      <section
        className="card"
        style={{
          marginTop: 30,
          padding: 0,
          overflow: "hidden",
          borderRadius: 16,
        }}
      >
        {/* Recent uploads heading */}

        <div
          style={{
            minHeight: 82,
            padding: "0 26px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 19,
            }}
          >
            Recent Uploads
          </h2>

          <button
            type="button"
            aria-label="Recent upload filters"
            style={{
              width: 36,
              height: 36,
              padding: 0,
              border: "none",
              background: "transparent",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#0b1f3f",
            }}
          >
            <SlidersHorizontal size={19} />
          </button>
        </div>

        {/* Lecture list */}

        <div>
          {isLoading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#667085" }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 8px" }} />
              <p style={{ margin: 0, fontSize: 14 }}>Loading lectures...</p>
            </div>
          ) : error ? (
            <div style={{ padding: "24px", color: "#b91c1c", background: "#fef2f2", display: "flex", alignItems: "center", gap: 10 }}>
              <AlertCircle size={18} />
              <span style={{ fontSize: 14 }}>{error}</span>
            </div>
          ) : recentUploads.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#667085" }}>
              <p style={{ margin: 0, fontSize: 14 }}>No recent lecture uploads found.</p>
            </div>
          ) : (
            recentUploads.map((lecture, index) => {
              const statusStyle = getStatusStyle(lecture.status);

            return (
              <button
                key={lecture.id}
                type="button"
                onClick={() => handleLectureOpen(lecture)}
                style={{
                  width: "100%",
                  border: "none",
                  borderBottom:
                    index !== recentUploads.length - 1
                      ? "1px solid var(--border-color)"
                      : "none",
                  background: "#ffffff",
                  padding: "22px 26px",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "block",
                }}
              >
                {/* Title and status */}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
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
                        color: "#2168d5",
                        fontSize: 18,
                        lineHeight: 1.35,
                        fontWeight: 700,
                      }}
                    >
                      {lecture.title}
                    </h3>

                    {/* Tags */}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginTop: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: "#f0f2f5",
                          color: "#596a80",
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {lecture.code}
                      </span>

                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: "#f0f2f5",
                          color: "#596a80",
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {lecture.batch}
                      </span>
                    </div>
                  </div>

                  {/* Status */}

                  <span
                    style={{
                      flexShrink: 0,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "6px 12px",
                      borderRadius: 999,
                      background: statusStyle.background,
                      color: statusStyle.color,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: statusStyle.dot,
                      }}
                    />

                    {lecture.status}
                  </span>
                </div>

                {/* Date and duration */}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    marginTop: 14,
                    flexWrap: "wrap",
                    color: "#66758a",
                    fontSize: 14,
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                    }}
                  >
                    <CalendarDays size={16} />

                    {lecture.date}
                  </span>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                    }}
                  >
                    <Clock3 size={16} />

                    {lecture.duration}
                  </span>
                </div>
              </button>
            );
          }))}
        </div>
      </section>
    </div>
  );
}

export default FacultyDashboard;
