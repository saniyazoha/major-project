import {
  Plus,
  Search,
  UploadCloud,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { lectures } from "../../data/lectures";
import { subjects } from "../../data/subjects";

function FacultyUploads() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  const filteredLectures = useMemo(() => {
    return lectures.filter((lecture) => {
      const search = searchTerm.trim().toLowerCase();

      const matchesSearch =
        !search ||
        lecture.title?.toLowerCase().includes(search) ||
        lecture.lecturer?.toLowerCase().includes(search) ||
        lecture.subject?.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" || lecture.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  const processedCount = lectures.filter(
    (lecture) => lecture.status === "Processed",
  ).length;

  const processingCount = lectures.filter(
    (lecture) => lecture.status === "Processing",
  ).length;

  const failedCount = lectures.filter(
    (lecture) => lecture.status === "Failed",
  ).length;

  const getSubjectId = (lecture) => {
    if (lecture.subjectId) {
      return lecture.subjectId;
    }

    const subject = subjects.find(
      (item) => item.name?.toLowerCase() === lecture.subject?.toLowerCase(),
    );

    return subject?.id;
  };

  const handleViewLecture = (lecture) => {
    const subjectId = getSubjectId(lecture);

    if (!subjectId) {
      alert("This lecture is not associated with a valid subject.");
      return;
    }

    navigate(`/faculty/subjects/${subjectId}/lectures/${lecture.id}/analytics`);
  };

  return (
    <div className="page">
      {/* =========================
          HEADER
      ========================= */}

      <section>
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
            <p className="eyebrow">LECTURES</p>

            <h1>Uploads</h1>

            <p className="muted">
              Manage uploaded lecture recordings and view their analytics.
            </p>
          </div>

          <button
            type="button"
            className="primary-action-button"
            onClick={() => navigate("/faculty/uploads/new")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Plus size={18} />
            Upload New Lecture
          </button>
        </div>
      </section>

      {/* =========================
          STATISTICS
      ========================= */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginTop: 20,
        }}
      >
        <div className="card" style={{ padding: 20 }}>
          <UploadCloud size={23} />

          <p className="muted">Total Uploads</p>

          <h2 style={{ margin: 0 }}>{lectures.length}</h2>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <CheckCircle size={23} />

          <p className="muted">Processed</p>

          <h2 style={{ margin: 0 }}>{processedCount}</h2>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <Clock size={23} />

          <p className="muted">Processing</p>

          <h2 style={{ margin: 0 }}>{processingCount}</h2>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <AlertCircle size={23} />

          <p className="muted">Failed</p>

          <h2 style={{ margin: 0 }}>{failedCount}</h2>
        </div>
      </section>

      {/* =========================
          SEARCH
      ========================= */}

      <section
        className="card"
        style={{
          marginTop: 20,
          padding: 20,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(220px, 1fr) 180px",
            gap: 12,
          }}
        >
          <div
            style={{
              position: "relative",
            }}
          >
            <Search
              size={18}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search lectures, subjects, or lecturers..."
              style={{
                width: "100%",
                paddingLeft: 40,
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All Statuses</option>

            <option value="Processed">Processed</option>

            <option value="Processing">Processing</option>

            <option value="Failed">Failed</option>
          </select>
        </div>
      </section>

      {/* =========================
          LECTURES
      ========================= */}

      <section style={{ marginTop: 26 }}>
        <div>
          <p className="eyebrow">YOUR UPLOADS</p>

          <h2>Lecture Recordings</h2>

          <p className="muted">
            Select View Lecture to open the analytics for that subject and
            lecture.
          </p>
        </div>

        {filteredLectures.length === 0 ? (
          <div
            className="card"
            style={{
              marginTop: 16,
              padding: 32,
              textAlign: "center",
            }}
          >
            <UploadCloud size={42} />

            <h3>No lectures found</h3>

            <p className="muted">Try changing your search or status filter.</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 12,
              marginTop: 16,
            }}
          >
            {filteredLectures.map((lecture) => (
              <div
                key={lecture.id}
                className="card"
                style={{
                  padding: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 18,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 14,
                      alignItems: "center",
                      minWidth: 0,
                    }}
                  >
                    <div className="upload-icon">
                      <UploadCloud size={21} />
                    </div>

                    <div>
                      <p
                        className="eyebrow"
                        style={{
                          margin: 0,
                        }}
                      >
                        {lecture.subject}
                      </p>

                      <h3
                        style={{
                          margin: "4px 0",
                        }}
                      >
                        {lecture.title}
                      </h3>

                      <p
                        className="muted"
                        style={{
                          margin: 0,
                        }}
                      >
                        Lecturer: {lecture.lecturer}
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <span
                      className={`lecture-status ${lecture.status?.toLowerCase()}`}
                    >
                      {lecture.status}
                    </span>

                    <button
                      type="button"
                      className="primary-action-button"
                      onClick={() => handleViewLecture(lecture)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                      }}
                    >
                      View Lecture
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default FacultyUploads;
