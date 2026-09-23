import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  RefreshCw,
  Sparkles,
  Tag,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../../api/client";

export default function FacultyAnalytics() {
  const navigate = useNavigate();
  const routeParams = useParams();

  const lectureId = routeParams.lectureId;
  const subjectId = routeParams.subjectId;
  const lecturerId = routeParams.lecturerId;

  const [lecture, setLecture] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [statusState, setStatusState] = useState("idle"); // 'idle' | 'loaded' | 'not_generated' | 'transcript_not_ready' | 'forbidden' | 'error'
  const [errorMessage, setErrorMessage] = useState(null);

  const fetchAnalytics = async () => {
    if (!lectureId) return;

    try {
      setLoading(true);
      setErrorMessage(null);

      // Fetch lecture metadata for context header
      try {
        const lec = await apiClient.get(`/lectures/${lectureId}`);
        if (lec) setLecture(lec);
      } catch (err) {
        // Ignore header metadata fetch error
      }

      // Fetch real backend analytics
      const data = await apiClient.get(`/lectures/${lectureId}/analytics`);
      setAnalytics(data);
      setStatusState("loaded");
    } catch (err) {
      if (err.status === 404) {
        setStatusState("not_generated");
      } else if (err.status === 403) {
        setStatusState("forbidden");
        setErrorMessage(
          "Access denied. You do not have permission to view analytics for this lecture.",
        );
      } else {
        setStatusState("error");
        setErrorMessage(
          err.message || "Failed to load lecture analytics. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [lectureId]);

  const handleGenerateAnalytics = async () => {
    if (!lectureId || generating) return;

    try {
      setGenerating(true);
      setErrorMessage(null);

      const data = await apiClient.post(`/lectures/${lectureId}/analytics`);
      setAnalytics(data);
      setStatusState("loaded");
    } catch (err) {
      if (err.status === 409) {
        setStatusState("transcript_not_ready");
        setErrorMessage(
          err.message ||
            "Analytics cannot be generated because audio transcription is not completed yet.",
        );
      } else if (err.status === 403) {
        setStatusState("forbidden");
        setErrorMessage(
          "Access denied. You do not have permission to generate analytics for this lecture.",
        );
      } else {
        setStatusState("error");
        setErrorMessage(
          err.message ||
            "Failed to compute lecture analytics. Please try again.",
        );
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleBack = () => {
    if (subjectId && lecturerId && lectureId) {
      navigate(
        `/faculty/subjects/${subjectId}/lecturers/${lecturerId}/lectures/${lectureId}`,
      );
      return;
    }
    if (lectureId) {
      navigate(`/faculty/lectures/${lectureId}`);
      return;
    }
    navigate("/faculty/subjects");
  };

  // Safe parsers for JSON string fields returned by the backend
  const avgWpm = analytics?.avg_wpm ? Math.round(analytics.avg_wpm) : 0;

  const wpmSegments = useMemo(() => {
    if (!analytics?.wpm_by_segment_json) return [];
    try {
      const parsed = JSON.parse(analytics.wpm_by_segment_json);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }, [analytics]);

  const wordFrequency = useMemo(() => {
    if (!analytics?.word_frequency_json) return [];
    try {
      const parsed = JSON.parse(analytics.word_frequency_json);
      if (typeof parsed === "object" && parsed !== null) {
        return Object.entries(parsed)
          .map(([word, count]) => ({ word, count }))
          .sort((a, b) => b.count - a.count);
      }
    } catch (e) {}
    return [];
  }, [analytics]);

  const fillerWordCounts = useMemo(() => {
    if (!analytics?.filler_word_counts_json) return [];
    try {
      const parsed = JSON.parse(analytics.filler_word_counts_json);
      if (typeof parsed === "object" && parsed !== null) {
        return Object.entries(parsed)
          .map(([word, count]) => ({ word, count }))
          .sort((a, b) => b.count - a.count);
      }
    } catch (e) {}
    return [];
  }, [analytics]);

  const keywordFrequency = useMemo(() => {
    if (!analytics?.keyword_frequency_json) return [];
    try {
      const parsed = JSON.parse(analytics.keyword_frequency_json);
      if (typeof parsed === "object" && parsed !== null) {
        return Object.entries(parsed)
          .map(([word, count]) => ({ word, count }))
          .sort((a, b) => b.count - a.count);
      }
    } catch (e) {}
    return [];
  }, [analytics]);

  const maxSegmentWpm = useMemo(() => {
    if (wpmSegments.length === 0) return 200;
    return Math.max(...wpmSegments.map((s) => s.wpm || 0), 150);
  }, [wpmSegments]);

  const formatSecondsToTime = (seconds) => {
    if (typeof seconds !== "number" || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="page">
      {/* Back Button */}
      <button type="button" className="back-button" onClick={handleBack}>
        <ArrowLeft size={16} />
        Back to Lecture
      </button>

      {/* Page Header */}
      <section style={{ marginTop: 20 }}>
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
            <p className="eyebrow">FACULTY ANALYTICS</p>
            <h1 style={{ marginTop: 6, marginBottom: 7, fontSize: 31 }}>
              Lecture Analytics
            </h1>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              {lecture?.title || "Selected Lecture"}
            </p>
          </div>

          {statusState === "loaded" && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 11px",
                borderRadius: 999,
                background: "#e9f7ef",
                color: "#18794e",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <CheckCircle2 size={15} />
              Analysis Complete
            </span>
          )}
        </div>
      </section>

      {/* Main Content Area based on statusState */}

      {loading ? (
        <div
          className="card"
          style={{ marginTop: 24, padding: 40, textAlign: "center" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <RefreshCw
              size={32}
              className="animate-spin"
              style={{ color: "#1f6feb" }}
            />
          </div>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Loading lecture analytics...
          </p>
        </div>
      ) : statusState === "not_generated" ? (
        <div
          className="card"
          style={{ marginTop: 24, padding: 40, textAlign: "center" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Sparkles size={38} style={{ color: "#1f6feb" }} />
          </div>
          <h3 style={{ fontSize: 18, marginBottom: 8, color: "#0f274f" }}>
            Analytics Not Computed Yet
          </h3>
          <p
            className="muted"
            style={{
              maxWidth: 520,
              margin: "0 auto 20px",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            Analytics have not been generated for this lecture. Compute overall
            speaking pace, segment WPM, filler words, and glossary keyword
            frequencies.
          </p>
          <button
            type="button"
            className="primary-action-button"
            onClick={handleGenerateAnalytics}
            disabled={generating}
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            {generating ? (
              <>
                <RefreshCw
                  size={15}
                  style={{ animation: "spin 1.5s linear infinite" }}
                />
                Computing Analytics...
              </>
            ) : (
              <>
                <Sparkles size={15} />
                Generate Analytics
              </>
            )}
          </button>
        </div>
      ) : statusState === "transcript_not_ready" ? (
        <div
          className="card"
          style={{ marginTop: 24, padding: 40, textAlign: "center" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <AlertCircle size={38} style={{ color: "#d97706" }} />
          </div>
          <h3 style={{ fontSize: 18, marginBottom: 8, color: "#92400e" }}>
            Transcript Required First
          </h3>
          <p
            className="muted"
            style={{
              maxWidth: 520,
              margin: "0 auto 20px",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {errorMessage ||
              "Analytics computation requires a completed audio transcription. Please transcribe the lecture audio first."}
          </p>
          <button
            type="button"
            className="secondary-action-button"
            onClick={handleBack}
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <ArrowLeft size={15} />
            Back to Lecture Details
          </button>
        </div>
      ) : statusState === "forbidden" ? (
        <div
          className="card"
          style={{ marginTop: 24, padding: 40, textAlign: "center" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <AlertCircle size={38} style={{ color: "#e11d48" }} />
          </div>
          <h3 style={{ fontSize: 18, marginBottom: 8, color: "#9f1239" }}>
            Access Denied
          </h3>
          <p className="muted" style={{ margin: "0 auto 20px", fontSize: 14 }}>
            {errorMessage ||
              "You do not have permission to access analytics for this lecture."}
          </p>
          <button
            type="button"
            className="secondary-action-button"
            onClick={handleBack}
          >
            Back
          </button>
        </div>
      ) : statusState === "error" ? (
        <div
          className="card"
          style={{ marginTop: 24, padding: 40, textAlign: "center" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <AlertCircle size={38} style={{ color: "#e11d48" }} />
          </div>
          <h3 style={{ fontSize: 18, marginBottom: 8, color: "#0f274f" }}>
            Failed to Load Analytics
          </h3>
          <p
            className="muted"
            style={{
              maxWidth: 520,
              margin: "0 auto 20px",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {errorMessage || "An unexpected error occurred."}
          </p>
          <button
            type="button"
            className="secondary-action-button"
            onClick={fetchAnalytics}
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      ) : (
        /* Real Analytics Rendered (statusState === 'loaded') */
        <>
          {/* =====================================================
              1. OVERALL PACING METRIC
          ===================================================== */}
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
              marginTop: 24,
            }}
          >
            <div className="card" style={{ padding: 24 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div>
                  <p
                    className="muted"
                    style={{
                      margin: 0,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                    }}
                  >
                    OVERALL PACING
                  </p>
                  <h2
                    style={{
                      margin: "8px 0 0",
                      fontSize: 32,
                      color: "#0f274f",
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                    }}
                  >
                    {avgWpm}
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: "#64748b",
                      }}
                    >
                      WPM
                    </span>
                  </h2>
                  <p
                    className="muted"
                    style={{ margin: "6px 0 0", fontSize: 13 }}
                  >
                    Average words per minute across the entire lecture audio.
                  </p>
                </div>

                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    background: "#eef4fb",
                    color: "#1f6feb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Clock size={26} />
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================
              2. WPM BY SEGMENT (SEGMENT-LEVEL PACING)
          ===================================================== */}
          <section className="card" style={{ marginTop: 20, padding: 24 }}>
            <p className="eyebrow">SEGMENT PACING</p>
            <h2 style={{ marginTop: 5, fontSize: 19 }}>
              Speaking Rate by Segment
            </h2>
            <p className="muted" style={{ marginTop: 5, fontSize: 12 }}>
              Segment-level words per minute computed from audio timestamps.
            </p>

            {wpmSegments.length === 0 ? (
              <div
                style={{
                  padding: "24px 0",
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: 13,
                }}
              >
                No segment WPM data available.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: 14,
                  marginTop: 20,
                }}
              >
                {wpmSegments.map((seg, idx) => {
                  const width = Math.min(
                    100,
                    Math.max(5, (seg.wpm / maxSegmentWpm) * 100),
                  );

                  const startTime = formatSecondsToTime(seg.start || 0);
                  const endTime = formatSecondsToTime(seg.end || 0);

                  return (
                    <div
                      key={seg.segment_id || idx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "110px 1fr 90px",
                        gap: 14,
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          color: "#64748b",
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {startTime} – {endTime}
                      </span>

                      <div
                        style={{
                          height: 10,
                          borderRadius: 999,
                          overflow: "hidden",
                          background: "#e8edf4",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${width}%`,
                            borderRadius: 999,
                            background: "#1f6feb",
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>

                      <strong
                        style={{
                          fontSize: 12,
                          textAlign: "right",
                          color: "#0f274f",
                        }}
                      >
                        {Math.round(seg.wpm || 0)} WPM
                      </strong>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* =====================================================
              3. WORD FREQUENCY & FILLER WORDS (2-COLUMN GRID)
          ===================================================== */}
          <section
            style={{
              marginTop: 20,
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 18,
            }}
          >
            {/* Word Frequency */}
            <div className="card" style={{ padding: 24 }}>
              <p className="eyebrow">VOCABULARY</p>
              <h2 style={{ marginTop: 5, fontSize: 19 }}>
                Top Repeated Words
              </h2>

              {wordFrequency.length === 0 ? (
                <div
                  style={{
                    padding: "20px 0",
                    color: "#64748b",
                    fontSize: 13,
                  }}
                >
                  No word frequency data available.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 9, marginTop: 18 }}>
                  {wordFrequency.slice(0, 10).map((item) => (
                    <div
                      key={item.word}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 13px",
                        borderRadius: 8,
                        background: "#f7f9fc",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          color: "#334155",
                          fontWeight: 500,
                        }}
                      >
                        {item.word}
                      </span>
                      <strong style={{ fontSize: 12, color: "#1f6feb" }}>
                        {item.count}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Filler Words */}
            <div className="card" style={{ padding: 24 }}>
              <p className="eyebrow">SPEECH PATTERNS</p>
              <h2 style={{ marginTop: 5, fontSize: 19 }}>Filler Words</h2>

              {fillerWordCounts.length === 0 ? (
                <div
                  style={{
                    padding: "24px 0",
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: 13,
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 500 }}>
                    No filler words detected
                  </p>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>
                    Speech delivery was clear of common filler phrases.
                  </span>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 9, marginTop: 18 }}>
                  {fillerWordCounts.map((item) => (
                    <div
                      key={item.word}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 13px",
                        borderRadius: 8,
                        background: "#f7f9fc",
                      }}
                    >
                      <span style={{ fontSize: 13, color: "#475569" }}>
                        “{item.word}”
                      </span>
                      <strong style={{ fontSize: 12, color: "#0f274f" }}>
                        {item.count}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* =====================================================
              4. GLOSSARY KEYWORD FREQUENCY
          ===================================================== */}
          <section
            className="card"
            style={{ marginTop: 20, padding: 24, marginBottom: 24 }}
          >
            <p className="eyebrow">KEYWORD METRICS</p>
            <h2 style={{ marginTop: 5, fontSize: 19 }}>
              Glossary Keyword Frequency
            </h2>
            <p className="muted" style={{ marginTop: 5, fontSize: 12 }}>
              Frequency of generated glossary terms occurring in the lecture
              transcript.
            </p>

            {keywordFrequency.length === 0 ? (
              <div
                style={{
                  marginTop: 18,
                  padding: "28px 20px",
                  borderRadius: 10,
                  background: "#f8fafc",
                  border: "1px dashed #cbd5e1",
                  textAlign: "center",
                }}
              >
                <Tag
                  size={28}
                  style={{ margin: "0 auto 8px", color: "#94a3b8" }}
                />
                <h4
                  style={{
                    margin: "0 0 4px",
                    fontSize: 14,
                    color: "#334155",
                    fontWeight: 600,
                  }}
                >
                  No glossary terms yet
                </h4>
                <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                  Glossary keywords will appear here once glossary terms are
                  generated for this lecture.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 12,
                  marginTop: 18,
                }}
              >
                {keywordFrequency.map((item) => (
                  <div
                    key={item.word}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 15px",
                      borderRadius: 9,
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: "#1e293b",
                        fontWeight: 600,
                      }}
                    >
                      {item.word}
                    </span>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 999,
                        background: "#e0f2fe",
                        color: "#0369a1",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
