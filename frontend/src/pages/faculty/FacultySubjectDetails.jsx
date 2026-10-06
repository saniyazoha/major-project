import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock,
  User,
  Loader2,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  Users,
  UserPlus,
  Search,
  UserCheck,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../../api/client";
import KnowledgeGraphView from "../../components/knowledge_graph/KnowledgeGraphView";

export default function FacultySubjectDetails() {
  const navigate = useNavigate();
  const { subjectId } = useParams();

  const [realSubject, setRealSubject] = useState(null);
  const [realLectures, setRealLectures] = useState([]);
  const [realBatches, setRealBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Batch Creation State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [newBatchName, setNewBatchName] = useState("");
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);
  const [batchFormError, setBatchFormError] = useState(null);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState(null);

  // Enrollment Modal State
  const [enrollModalBatch, setEnrollModalBatch] = useState(null);
  const [rollnoInput, setRollnoInput] = useState("");
  const [isSearchingStudent, setIsSearchingStudent] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [foundStudent, setFoundStudent] = useState(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState(null);
  const [enrollSuccessMsg, setEnrollSuccessMsg] = useState(null);

  // Enrolled students map: { [batchId]: studentArray }
  const [batchStudentsMap, setBatchStudentsMap] = useState({});

  const fetchStudentsForBatches = async (batchesList) => {
    if (!Array.isArray(batchesList) || batchesList.length === 0) return;
    try {
      const studentPromises = batchesList.map((batch) =>
        apiClient
          .get(`/batches/${batch.id}/students`)
          .then((res) => ({ batchId: batch.id, students: Array.isArray(res) ? res : [] }))
          .catch(() => ({ batchId: batch.id, students: [] }))
      );
      const results = await Promise.all(studentPromises);
      const map = {};
      results.forEach(({ batchId, students }) => {
        map[batchId] = students;
      });
      setBatchStudentsMap(map);
    } catch (err) {
      console.error("Failed to fetch batch students:", err);
    }
  };

  const fetchBatches = async () => {
    try {
      const fetched = await apiClient.get(`/subjects/${subjectId}/batches`);
      if (Array.isArray(fetched)) {
        setRealBatches(fetched);
        await fetchStudentsForBatches(fetched);
      }
    } catch (err) {
      console.error("Failed to fetch batches:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        const [fetchedSubjects, fetchedLectures, fetchedBatches] = await Promise.all([
          apiClient.get("/subjects").catch(() => []),
          apiClient.get("/lectures").catch(() => []),
          apiClient.get(`/subjects/${subjectId}/batches`).catch(() => []),
        ]);

        if (isMounted) {
          if (Array.isArray(fetchedSubjects)) {
            const found = fetchedSubjects.find(
              (item) => String(item.id) === String(subjectId)
            );
            if (found) {
              setRealSubject(found);
            }
          }

          if (Array.isArray(fetchedLectures)) {
            const filtered = fetchedLectures.filter(
              (item) => String(item.subject_id) === String(subjectId)
            );
            setRealLectures(filtered);
          }

          if (Array.isArray(fetchedBatches)) {
            setRealBatches(fetchedBatches);
            await fetchStudentsForBatches(fetchedBatches);
          }
        }
      } catch (err) {
        // Ignore fetch errors
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [subjectId]);

  /* =====================================================
     FIND SELECTED SUBJECT
  ===================================================== */

  const subject = useMemo(() => {
    if (realSubject) {
      return {
        id: realSubject.id,
        name: realSubject.name,
        code: `SUB-${realSubject.id}`,
        description: `${realSubject.name} course subject`,
      };
    }
    return null;
  }, [realSubject]);

  /* =====================================================
     FIND THIS SUBJECT'S LECTURES
  ===================================================== */

  const subjectLectures = useMemo(() => {
    if (!realLectures || realLectures.length === 0) {
      return [];
    }

    return realLectures.map((l) => ({
      id: l.id,
      subjectId: l.subject_id,
      title: l.title,
      status:
        l.status === "broadcast"
          ? "Broadcast"
          : l.status === "processing"
          ? "Processing"
          : l.status === "draft"
          ? "Draft"
          : "Uploaded",
      date: l.created_at
        ? new Date(l.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "Recently",
      duration: l.file_size
        ? `${(l.file_size / (1024 * 1024)).toFixed(1)} MB`
        : "45 mins",
      lecturer: "Faculty",
    }));
  }, [realLectures]);

  /* =====================================================
     OPEN SELECTED LECTURE
  ===================================================== */

  const openLecture = (lecture) => {
    navigate(`/faculty/lectures/${lecture.id}`);
  };

  /* =====================================================
     CREATE BATCH HANDLER
  ===================================================== */

  const handleCreateBatch = async (e) => {
    if (e) {
      e.preventDefault();
      if (typeof e.stopPropagation === "function") {
        e.stopPropagation();
      }
    }

    if (isSubmittingBatch) {
      return;
    }

    const trimmedBatchName = (newBatchName || "").trim();

    if (!trimmedBatchName) {
      setBatchFormError("Batch name cannot be empty.");
      setBatchSuccessMsg(null);
      return;
    }

    try {
      setIsSubmittingBatch(true);
      setBatchFormError(null);
      setBatchSuccessMsg(null);

      const res = await apiClient.post(`/subjects/${subjectId}/batches`, {
        batchname: trimmedBatchName,
      });

      setBatchSuccessMsg(
        `Batch "${res?.batchname || trimmedBatchName}" created successfully!`
      );
      setNewBatchName("");

      await fetchBatches();

      setTimeout(() => {
        setIsBatchModalOpen(false);
        setBatchSuccessMsg(null);
      }, 1000);
    } catch (err) {
      console.error("Failed to create batch:", err);
      setBatchFormError(err?.message || "Failed to create batch. Please try again.");
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  /* =====================================================
     ENROLLMENT MODAL HELPERS & HANDLERS
  ===================================================== */

  const openEnrollModal = (batch) => {
    setEnrollModalBatch(batch);
    setRollnoInput("");
    setIsSearchingStudent(false);
    setLookupError(null);
    setFoundStudent(null);
    setIsEnrolling(false);
    setEnrollError(null);
    setEnrollSuccessMsg(null);
  };

  const closeEnrollModal = () => {
    setEnrollModalBatch(null);
    setFoundStudent(null);
    setLookupError(null);
    setEnrollError(null);
    setEnrollSuccessMsg(null);
  };

  const handleLookupStudent = async (e) => {
    if (e) {
      e.preventDefault();
      if (typeof e.stopPropagation === "function") {
        e.stopPropagation();
      }
    }

    if (isSearchingStudent || isEnrolling) {
      return;
    }

    const trimmedRollno = (rollnoInput || "").trim();

    if (!trimmedRollno) {
      setLookupError("Please enter a student roll number.");
      setFoundStudent(null);
      setEnrollError(null);
      setEnrollSuccessMsg(null);
      return;
    }

    try {
      setIsSearchingStudent(true);
      setLookupError(null);
      setFoundStudent(null);
      setEnrollError(null);
      setEnrollSuccessMsg(null);

      const res = await apiClient.get(
        `/students/lookup?rollno=${encodeURIComponent(trimmedRollno)}`
      );

      setFoundStudent(res);
    } catch (err) {
      console.error("Student lookup error:", err);
      setFoundStudent(null);
      if (
        err?.status === 404 ||
        err?.message?.toLowerCase().includes("not found") ||
        err?.data?.detail?.toLowerCase().includes("not found")
      ) {
        setLookupError("Student not found.");
      } else {
        setLookupError(err?.message || "Failed to lookup student.");
      }
    } finally {
      setIsSearchingStudent(false);
    }
  };

  const handleConfirmEnrollment = async () => {
    if (!enrollModalBatch || !foundStudent || isEnrolling) {
      return;
    }

    try {
      setIsEnrolling(true);
      setEnrollError(null);
      setEnrollSuccessMsg(null);

      await apiClient.post(`/batches/${enrollModalBatch.id}/enrollments`, {
        student_id: foundStudent.id,
      });

      setEnrollSuccessMsg(
        `Student "${foundStudent.name}" (${foundStudent.rollno}) successfully enrolled into batch "${enrollModalBatch.batchname}"!`
      );

      if (realBatches.length > 0) {
        await fetchStudentsForBatches(realBatches);
      }
    } catch (err) {
      console.error("Enrollment error:", err);
      const errStr = (err?.message || err?.data?.detail || "").toLowerCase();
      if (
        err?.status === 400 ||
        errStr.includes("already enrolled") ||
        errStr.includes("already_enrolled")
      ) {
        setEnrollError("Student is already enrolled in this batch.");
      } else if (err?.status === 404 || errStr.includes("not found")) {
        setEnrollError("Student or batch not found.");
      } else {
        setEnrollError(err?.message || "Failed to enroll student. Please try again.");
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  /* =====================================================
     LOADING & SUBJECT NOT FOUND
  ===================================================== */

  if (isLoading) {
    return (
      <div className="page" style={{ padding: 40, textAlign: "center", color: "#667085" }}>
        <Loader2 size={28} className="animate-spin" style={{ margin: "0 auto 12px" }} />
        <p style={{ margin: 0, fontSize: 14 }}>Loading subject details...</p>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="page">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/faculty/subjects")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <ArrowLeft size={17} />
          Back to Subjects
        </button>

        <section
          className="card"
          style={{
            marginTop: 24,
            padding: 40,
            textAlign: "center",
          }}
        >
          <BookOpen size={42} />

          <h2
            style={{
              marginTop: 16,
              marginBottom: 8,
            }}
          >
            Subject Not Found
          </h2>

          <p className="muted">The selected subject could not be found.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="page faculty-subject-details">
      {/* =================================================
          BACK
      ================================================= */}

      <button
        type="button"
        className="back-button"
        onClick={() => navigate("/faculty/subjects")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <ArrowLeft size={17} />
        Back to Subjects
      </button>

      {/* =================================================
          SUBJECT HEADER
      ================================================= */}

      <section
        style={{
          marginTop: 20,
        }}
      >
        <p className="eyebrow">SUBJECT</p>

        <h1
          style={{
            marginBottom: 8,
          }}
        >
          {subject.name}
        </h1>

        {subject.code && (
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {subject.code}
          </p>
        )}

        <p
          className="muted"
          style={{
            marginTop: 8,
            marginBottom: 0,
            maxWidth: 720,
            lineHeight: 1.6,
          }}
        >
          {subject.description || `${subject.name} subject`}
        </p>
      </section>

      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <section
        style={{
          marginTop: 24,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        <div
          className="card"
          style={{
            padding: 22,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div className="upload-icon" style={{ flexShrink: 0 }}>
            <BookOpen size={22} />
          </div>
          <div>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              Total Lectures
            </p>
            <h2 style={{ margin: "4px 0 0" }}>{subjectLectures.length}</h2>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: 22,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div className="upload-icon" style={{ flexShrink: 0 }}>
            <Users size={22} />
          </div>
          <div>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              Total Batches
            </p>
            <h2 style={{ margin: "4px 0 0" }}>{realBatches.length}</h2>
          </div>
        </div>
      </section>

      {/* =================================================
          KNOWLEDGE GRAPH SECTION
      ================================================= */}
      <KnowledgeGraphView subjectId={subjectId} />

      {/* =================================================
          BATCHES HEADER & SECTION
      ================================================= */}

      <section
        style={{
          marginTop: 30,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
        }}
      >
        <div>
          <p className="eyebrow">BATCHES</p>
          <h2 style={{ marginTop: 4, marginBottom: 6 }}>
            Batches in {subject.name}
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            Manage student batches under this subject.
          </p>
        </div>

        <button
          type="button"
          className="primary-action-button"
          onClick={() => {
            setBatchFormError(null);
            setBatchSuccessMsg(null);
            setNewBatchName("");
            setIsBatchModalOpen(true);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: 9,
            background: "#2f76d2",
            color: "#ffffff",
            fontSize: 14,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(23, 59, 109, 0.18)",
            whiteSpace: "nowrap",
          }}
        >
          <Plus size={18} />
          Create Batch
        </button>
      </section>

      {realBatches.length === 0 ? (
        <section
          className="card"
          style={{
            marginTop: 18,
            padding: 36,
            textAlign: "center",
          }}
        >
          <Users size={38} style={{ color: "#64748b" }} />
          <h3 style={{ marginTop: 14, marginBottom: 8 }}>
            No Batches Available
          </h3>
          <p className="muted" style={{ margin: 0 }}>
            No batches have been created for this subject yet.
          </p>
          <button
            type="button"
            className="primary-action-button"
            onClick={() => {
              setBatchFormError(null);
              setBatchSuccessMsg(null);
              setNewBatchName("");
              setIsBatchModalOpen(true);
            }}
            style={{
              marginTop: 16,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 18px",
              borderRadius: 9,
              background: "#2f76d2",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            <Plus size={16} />
            Create Your First Batch
          </button>
        </section>
      ) : (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 14,
            marginTop: 18,
          }}
        >
          {realBatches.map((batch) => {
            const enrolledCount = batchStudentsMap[batch.id]?.length || 0;
            return (
              <div
                key={batch.id}
                className="card"
                style={{
                  padding: 18,
                  background: "var(--card-bg)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                  <div className="upload-icon" style={{ flexShrink: 0 }}>
                    <Users size={20} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
                      {batch.batchname}
                    </h4>
                    <p
                      className="muted"
                      style={{ margin: "4px 0 0", fontSize: 12 }}
                    >
                      Batch ID: {batch.id} • {enrolledCount} {enrolledCount === 1 ? "student" : "students"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openEnrollModal(batch)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 12px",
                    borderRadius: 8,
                    background: "#eef2ff",
                    color: "#2f76d2",
                    fontSize: 12,
                    fontWeight: 600,
                    border: "1px solid #c7d2fe",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  <UserPlus size={14} />
                  Enroll Student
                </button>
              </div>
            );
          })}
        </section>
      )}

      {/* =================================================
          LECTURES HEADER
      ================================================= */}

      <section
        style={{
          marginTop: 30,
        }}
      >
        <p className="eyebrow">LECTURES</p>

        <h2
          style={{
            marginTop: 4,
            marginBottom: 6,
          }}
        >
          Lectures in {subject.name}
        </h2>

        <p
          className="muted"
          style={{
            margin: 0,
          }}
        >
          Select a lecture to view its transcript, notes, flashcards, quiz,
          analytics and student progress.
        </p>
      </section>

      {/* =================================================
          NO LECTURES / LECTURE LIST
      ================================================= */}

      {subjectLectures.length === 0 ? (
        <section
          className="card"
          style={{
            marginTop: 18,
            padding: 40,
            textAlign: "center",
          }}
        >
          <BookOpen size={42} />

          <h3
            style={{
              marginTop: 16,
              marginBottom: 8,
            }}
          >
            No Lectures Available
          </h3>

          <p
            className="muted"
            style={{
              margin: 0,
            }}
          >
            No lectures have been uploaded for this subject yet.
          </p>
        </section>
      ) : (
        <section
          style={{
            display: "grid",
            gap: 14,
            marginTop: 18,
          }}
        >
          {subjectLectures.map((lecture, index) => (
            <button
              key={lecture.id}
              type="button"
              className="card"
              onClick={() => openLecture(lecture)}
              style={{
                width: "100%",
                padding: 20,
                textAlign: "left",
                cursor: "pointer",
                background: "var(--card-bg)",
                border: "1px solid var(--border-color)",
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
                {/* =====================================
                    LEFT
                ===================================== */}

                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 15,
                    minWidth: 0,
                    flex: "1 1 400px",
                  }}
                >
                  <div
                    className="upload-icon"
                    style={{
                      flexShrink: 0,
                    }}
                  >
                    <BookOpen size={21} />
                  </div>

                  <div
                    style={{
                      minWidth: 0,
                    }}
                  >
                    <p
                      className="eyebrow"
                      style={{
                        margin: 0,
                      }}
                    >
                      LECTURE {String(index + 1).padStart(2, "0")}
                    </p>

                    <h3
                      style={{
                        marginTop: 5,
                        marginBottom: 0,
                        lineHeight: 1.4,
                      }}
                    >
                      {lecture.title}
                    </h3>

                    {/* Lecturer */}

                    {lecture.lecturer && (
                      <div
                        className="muted"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginTop: 10,
                          fontSize: 13,
                        }}
                      >
                        <User size={14} />

                        <span>{lecture.lecturer}</span>
                      </div>
                    )}

                    {/* Date + Duration */}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        flexWrap: "wrap",
                        marginTop: 8,
                      }}
                    >
                      {lecture.date && (
                        <span
                          className="muted"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 12,
                          }}
                        >
                          <CalendarDays size={13} />

                          {lecture.date}
                        </span>
                      )}

                      {lecture.duration && (
                        <span
                          className="muted"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 12,
                          }}
                        >
                          <Clock size={13} />

                          {lecture.duration}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* =====================================
                    RIGHT
                ===================================== */}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    flexShrink: 0,
                  }}
                >
                  {lecture.status && (
                    <span
                      className={`lecture-status ${
                        lecture.status?.toLowerCase() || ""
                      }`}
                    >
                      {lecture.status}
                    </span>
                  )}

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    View Lecture
                    <ArrowRight size={16} />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </section>
      )}

      {/* =================================================
          CREATE BATCH MODAL
      ================================================= */}

      {isBatchModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 39, 79, 0.45)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 480,
              padding: 28,
              borderRadius: 16,
              background: "#ffffff",
              boxShadow: "0 20px 40px rgba(15, 39, 79, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div>
                <p className="eyebrow" style={{ margin: 0 }}>NEW BATCH</p>
                <h3 style={{ margin: "4px 0 0", color: "#0f274f", fontSize: 20 }}>
                  Create Batch
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                disabled={isSubmittingBatch}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: isSubmittingBatch ? "default" : "pointer",
                  color: "#64748b",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {batchFormError && (
              <div
                style={{
                  marginBottom: 16,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{batchFormError}</span>
              </div>
            )}

            {batchSuccessMsg && (
              <div
                style={{
                  marginBottom: 16,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#166534",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>{batchSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateBatch}>
              <div style={{ marginBottom: 20 }}>
                <label
                  htmlFor="batch-name-input"
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#334155",
                    marginBottom: 6,
                  }}
                >
                  Batch Name
                </label>
                <input
                  id="batch-name-input"
                  type="text"
                  placeholder="e.g. 2024-CSE-A"
                  value={newBatchName}
                  onChange={(e) => {
                    setNewBatchName(e.target.value);
                    if (batchFormError) setBatchFormError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !(newBatchName || "").trim()) {
                      e.preventDefault();
                      if (typeof e.stopPropagation === "function") {
                        e.stopPropagation();
                      }
                      setBatchFormError("Batch name cannot be empty.");
                    }
                  }}
                  disabled={isSubmittingBatch}
                  style={{
                    width: "100%",
                    height: 44,
                    padding: "0 14px",
                    borderRadius: 9,
                    border: batchFormError ? "1px solid #fecaca" : "1px solid #dce1e8",
                    fontSize: 14,
                    color: "#0f274f",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  autoFocus
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  disabled={isSubmittingBatch}
                  style={{
                    height: 40,
                    padding: "0 16px",
                    borderRadius: 8,
                    border: "1px solid #dce1e8",
                    background: "#ffffff",
                    color: "#53657d",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isSubmittingBatch ? "not-allowed" : "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingBatch || !(newBatchName || "").trim()}
                  style={{
                    height: 40,
                    padding: "0 20px",
                    borderRadius: 8,
                    border: "none",
                    background: "#2f76d2",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isSubmittingBatch || !(newBatchName || "").trim() ? "not-allowed" : "pointer",
                    opacity: isSubmittingBatch || !(newBatchName || "").trim() ? 0.6 : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {isSubmittingBatch && <Loader2 size={15} className="animate-spin" />}
                  {isSubmittingBatch ? "Creating..." : "Create Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================
          ENROLL STUDENT MODAL
      ================================================= */}

      {enrollModalBatch && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 39, 79, 0.45)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 500,
              padding: 28,
              borderRadius: 16,
              background: "#ffffff",
              boxShadow: "0 20px 40px rgba(15, 39, 79, 0.2)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div>
                <p className="eyebrow" style={{ margin: 0 }}>
                  ENROLLMENT • {enrollModalBatch.batchname}
                </p>
                <h3 style={{ margin: "4px 0 0", color: "#0f274f", fontSize: 20 }}>
                  Enroll Student
                </h3>
              </div>

              <button
                type="button"
                onClick={closeEnrollModal}
                disabled={isSearchingStudent || isEnrolling}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: isSearchingStudent || isEnrolling ? "default" : "pointer",
                  color: "#64748b",
                  padding: 4,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Error Banner */}
            {(lookupError || enrollError) && (
              <div
                style={{
                  marginBottom: 16,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{lookupError || enrollError}</span>
              </div>
            )}

            {/* Success Banner */}
            {enrollSuccessMsg && (
              <div
                style={{
                  marginBottom: 16,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  color: "#166534",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>{enrollSuccessMsg}</span>
              </div>
            )}

            {/* Step 1: Student Roll Number Lookup Form */}
            <form onSubmit={handleLookupStudent} noValidate>
              <div style={{ marginBottom: 16 }}>
                <label
                  htmlFor="student-rollno-input"
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#334155",
                    marginBottom: 6,
                  }}
                >
                  Student Roll Number / USN
                </label>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    id="student-rollno-input"
                    type="text"
                    placeholder="e.g. 1RV21CS001"
                    value={rollnoInput}
                    onChange={(e) => {
                      setRollnoInput(e.target.value);
                      if (lookupError) setLookupError(null);
                      if (enrollError) setEnrollError(null);
                      if (enrollSuccessMsg) setEnrollSuccessMsg(null);
                      if (foundStudent) setFoundStudent(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !(rollnoInput || "").trim()) {
                        e.preventDefault();
                        if (typeof e.stopPropagation === "function") {
                          e.stopPropagation();
                        }
                        setLookupError("Please enter a student roll number.");
                      }
                    }}
                    disabled={isSearchingStudent || isEnrolling}
                    style={{
                      flex: 1,
                      height: 42,
                      padding: "0 14px",
                      borderRadius: 9,
                      border: lookupError ? "1px solid #fecaca" : "1px solid #dce1e8",
                      fontSize: 14,
                      color: "#0f274f",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={isSearchingStudent || isEnrolling || !(rollnoInput || "").trim()}
                    style={{
                      height: 42,
                      padding: "0 18px",
                      borderRadius: 9,
                      border: "none",
                      background: "#2f76d2",
                      color: "#ffffff",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor:
                        isSearchingStudent || isEnrolling || !(rollnoInput || "").trim()
                          ? "not-allowed"
                          : "pointer",
                      opacity:
                        isSearchingStudent || isEnrolling || !(rollnoInput || "").trim()
                          ? 0.6
                          : 1,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isSearchingStudent ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Search size={15} />
                    )}
                    {isSearchingStudent ? "Searching..." : "Lookup Student"}
                  </button>
                </div>
              </div>
            </form>

            {/* Step 2: Matched Student Display & Confirmation */}
            {foundStudent && (
              <div
                style={{
                  marginTop: 20,
                  padding: 16,
                  borderRadius: 12,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "#e0e7ff",
                      color: "#3730a3",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <UserCheck size={22} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f274f" }}>
                      {foundStudent.name}
                    </h4>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "#64748b" }}>
                      Roll No: <strong>{foundStudent.rollno}</strong>
                      {foundStudent.username && ` • Username: @${foundStudent.username}`}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 14,
                    borderTop: "1px dashed #cbd5e1",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>
                    Ready to enroll into <strong>{enrollModalBatch.batchname}</strong>
                  </p>

                  <button
                    type="button"
                    onClick={handleConfirmEnrollment}
                    disabled={isEnrolling}
                    style={{
                      height: 38,
                      padding: "0 18px",
                      borderRadius: 8,
                      border: "none",
                      background: "#16a34a",
                      color: "#ffffff",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: isEnrolling ? "not-allowed" : "pointer",
                      opacity: isEnrolling ? 0.7 : 1,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {isEnrolling ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <UserPlus size={15} />
                    )}
                    {isEnrolling ? "Enrolling..." : `Enroll ${foundStudent.name}`}
                  </button>
                </div>
              </div>
            )}

            {/* Modal Footer (Cancel/Close) */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 20,
              }}
            >
              <button
                type="button"
                onClick={closeEnrollModal}
                disabled={isSearchingStudent || isEnrolling}
                style={{
                  height: 38,
                  padding: "0 16px",
                  borderRadius: 8,
                  border: "1px solid #dce1e8",
                  background: "#ffffff",
                  color: "#53657d",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isSearchingStudent || isEnrolling ? "not-allowed" : "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
