import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";

import { apiClient } from "../../api/client";

export default function StudentTranscript() {
  const { lectureId } = useParams();
  const navigate = useNavigate();

  const [transcriptData, setTranscriptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  const fetchTranscript = async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorStatus(null);
      const data = await apiClient.get(`/lectures/${lectureId}/transcript`);
      setTranscriptData(data);
    } catch (err) {
      console.error("Failed to load student transcript:", err);
      setErrorStatus(err?.status || 500);
      setError(err?.message || "Failed to load transcript.");
      setTranscriptData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lectureId) {
      fetchTranscript();
    }
  }, [lectureId]);

  const formatTime = (seconds) => {
    if (typeof seconds !== "number" || isNaN(seconds)) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="page student-page">
        <div className="card student-resource-empty" style={{ marginTop: 20 }}>
          <RefreshCw size={32} className="animate-spin" />
          <p>Loading transcript...</p>
        </div>
      </div>
    );
  }

  if (errorStatus === 403 || errorStatus === 404) {
    return (
      <div className="page student-page">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/student/dashboard")}
          style={{ marginBottom: 15 }}
        >
          <ArrowLeft size={15} /> Back to dashboard
        </button>
        <div className="card student-resource-empty">
          <h3>Transcript unavailable</h3>
          <p>The transcript for this lecture is unavailable or has not been broadcast.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page student-page">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/student/dashboard")}
          style={{ marginBottom: 15 }}
        >
          <ArrowLeft size={15} /> Back to dashboard
        </button>
        <div className="card student-resource-empty">
          <h3>Failed to load transcript</h3>
          <p>{error}</p>
          <button
            type="button"
            className="secondary-action-button"
            onClick={fetchTranscript}
            style={{ marginTop: 12 }}
          >
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (transcriptData?.status === "processing") {
    return (
      <div className="page student-page" style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <section>
          <div style={tabContainerStyle}>
            <button type="button" style={tabStyle} onClick={() => navigate(`/student/lectures/${lectureId}`)}>Notes</button>
            <button type="button" style={tabStyle} onClick={() => navigate(`/student/lectures/${lectureId}/flashcards`)}>Flashcards</button>
            <button type="button" style={tabStyle} onClick={() => navigate(`/student/lectures/${lectureId}/quiz`)}>Quiz</button>
            <button type="button" style={activeTabStyle}>Transcript</button>
            <button type="button" style={tabStyle} onClick={() => navigate(`/student/lectures/${lectureId}/qa`)}>Ask</button>
          </div>
        </section>
        <div className="card student-resource-empty" style={{ marginTop: 18 }}>
          <RefreshCw size={32} className="animate-spin" />
          <h3>Transcription in progress</h3>
          <p>The transcript for this lecture is currently being processed.</p>
        </div>
      </div>
    );
  }

  if (transcriptData?.status === "failed") {
    return (
      <div className="page student-page" style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <section>
          <div style={tabContainerStyle}>
            <button type="button" style={tabStyle} onClick={() => navigate(`/student/lectures/${lectureId}`)}>Notes</button>
            <button type="button" style={tabStyle} onClick={() => navigate(`/student/lectures/${lectureId}/flashcards`)}>Flashcards</button>
            <button type="button" style={tabStyle} onClick={() => navigate(`/student/lectures/${lectureId}/quiz`)}>Quiz</button>
            <button type="button" style={activeTabStyle}>Transcript</button>
            <button type="button" style={tabStyle} onClick={() => navigate(`/student/lectures/${lectureId}/qa`)}>Ask</button>
          </div>
        </section>
        <div className="card student-resource-empty" style={{ marginTop: 18 }}>
          <h3>Transcription failed</h3>
          <p>{transcriptData.error_message || "Transcript generation encountered an error."}</p>
        </div>
      </div>
    );
  }

  const textToDisplay =
    transcriptData?.corrected_text?.trim() || transcriptData?.raw_text?.trim() || "";

  let segments = [];
  if (transcriptData?.segment_timestamps_json) {
    try {
      const parsed = typeof transcriptData.segment_timestamps_json === "string"
        ? JSON.parse(transcriptData.segment_timestamps_json)
        : transcriptData.segment_timestamps_json;
      if (Array.isArray(parsed)) {
        segments = parsed;
      }
    } catch {
      segments = [];
    }
  }

  const hasContent = textToDisplay || segments.length > 0;

  return (
    <div
      className="page student-page"
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <section>
        <div style={tabContainerStyle}>
          <button
            type="button"
            style={tabStyle}
            onClick={() => navigate(`/student/lectures/${lectureId}`)}
          >
            Notes
          </button>

          <button
            type="button"
            style={tabStyle}
            onClick={() =>
              navigate(`/student/lectures/${lectureId}/flashcards`)
            }
          >
            Flashcards
          </button>

          <button
            type="button"
            style={tabStyle}
            onClick={() => navigate(`/student/lectures/${lectureId}/quiz`)}
          >
            Quiz
          </button>

          <button type="button" style={activeTabStyle}>
            Transcript
          </button>

          <button
            type="button"
            style={tabStyle}
            onClick={() =>
              navigate(`/student/lectures/${lectureId}/glossary`)
            }
          >
            Glossary
          </button>

          <button
            type="button"
            style={tabStyle}
            onClick={() => navigate(`/student/lectures/${lectureId}/qa`)}
          >
            Ask
          </button>
        </div>
      </section>

      {!hasContent ? (
        <div className="card student-resource-empty" style={{ marginTop: 18 }}>
          <h3>Transcript unavailable</h3>
          <p>No published transcript is currently available for this lecture.</p>
        </div>
      ) : segments.length > 0 ? (
        <section
          className="card"
          style={{
            marginTop: 18,
            padding: 0,
            borderRadius: 15,
            overflow: "hidden",
          }}
        >
          {segments.map((seg, index) => (
            <div
              key={index}
              style={{
                padding: "20px 24px",
                borderBottom:
                  index === segments.length - 1 ? "none" : "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  color: "#52647d",
                  fontSize: 12,
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}
              >
                {seg.time || formatTime(seg.start || seg.start_time || 0)}
              </div>

              <p
                style={{
                  margin: "8px 0 0",
                  color: "#0f274f",
                  fontSize: 15,
                  lineHeight: 1.7,
                }}
              >
                {seg.text}
              </p>
            </div>
          ))}
        </section>
      ) : (
        <section
          className="card"
          style={{
            marginTop: 18,
            padding: "28px 30px",
            borderRadius: 15,
          }}
        >
          <div
            style={{
              color: "#0f274f",
              fontSize: 15,
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
            }}
          >
            {textToDisplay}
          </div>
        </section>
      )}
    </div>
  );
}

const tabContainerStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 3,
  padding: 4,
  borderRadius: 12,
  background: "#eef1f5",
};

const tabStyle = {
  minHeight: 36,
  padding: "7px 14px",
  border: "none",
  borderRadius: 9,
  background: "transparent",
  color: "#53657d",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

const activeTabStyle = {
  ...tabStyle,
  background: "#ffffff",
  color: "#0f274f",
  fontWeight: 600,
  boxShadow: "0 1px 4px rgba(15, 39, 79, 0.12)",
};
