import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RefreshCw } from "lucide-react";

import { apiClient } from "../../api/client";

export default function StudentQA() {
  const { lectureId } = useParams();
  const navigate = useNavigate();

  const [lecture, setLecture] = useState(null);
  const [doubts, setDoubts] = useState([]);
  const [aiMessages, setAiMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  /* =========================================================
     FETCH LECTURE & DOUBTS FROM BACKEND
  ========================================================= */

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorStatus(null);

      const [lecData, doubtsDataRes] = await Promise.all([
        apiClient.get(`/lectures/${lectureId}`),
        apiClient.get(`/lectures/${lectureId}/doubts`),
      ]);

      setLecture(lecData);
      setDoubts(Array.isArray(doubtsDataRes) ? doubtsDataRes : []);
    } catch (err) {
      console.error("Failed to load lecture or doubts for QA:", err);
      setErrorStatus(err?.status || 500);
      setError(err?.message || "Failed to load lecture Q&A.");
      setLecture(null);
      setDoubts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lectureId) {
      fetchData();
    }
  }, [lectureId]);

  /* =========================================================
     ASK LECTURER MESSAGES
  ========================================================= */

  const lecturerMessages = useMemo(() => {
    if (!lecture) {
      return [];
    }

    const messages = [
      {
        id: "welcome-lecturer",
        type: "ai",
        text: `Hello! I am ready to record your questions for the lecturer of "${lecture.title}". What would you like to ask?`,
        referenced: false,
      },
    ];

    doubts.forEach((doubt) => {
      messages.push({
        id: `${doubt.id}-question`,
        type: "user",
        text: doubt.question,
        referenced: false,
      });

      if (doubt.answer) {
        messages.push({
          id: `${doubt.id}-answer`,
          type: "ai",
          text: doubt.answer,
          referenced: true,
          answeredBy: doubt.answered_by ? `Faculty #${doubt.answered_by}` : "Faculty",
          answeredAt: doubt.answered_at
            ? new Date(doubt.answered_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "",
        });
      } else {
        messages.push({
          id: `${doubt.id}-pending`,
          type: "ai",
          text: "Your doubt has been sent to the faculty for this lecture.",
          referenced: false,
        });
      }
    });

    return messages;
  }, [lecture, doubts]);

  /* =========================================================
     ASK AI MESSAGES INITIALIZATION
  ========================================================= */

  useEffect(() => {
    if (lecture && aiMessages.length === 0) {
      setAiMessages([
        {
          id: "welcome-ai",
          type: "ai",
          text: `Hello! I'm ready to answer questions about ${lecture.title}. What would you like to know?`,
          referenced: false,
        },
      ]);
    }
  }, [lecture, aiMessages.length]);

  const activeMessages = mode === "lecture" ? lecturerMessages : aiMessages;

  /* =========================================================
     SUBMIT QUESTION
  ========================================================= */

  const askQuestion = async () => {
    const cleanedQuestion = question.trim();

    if (!cleanedQuestion || submitting) {
      return;
    }

    setSubmitting(true);

    if (mode === "lecture") {
      try {
        const createdDoubt = await apiClient.post(`/lectures/${lectureId}/doubts`, {
          question: cleanedQuestion,
        });
        setDoubts((previous) => [...previous, createdDoubt]);
        setQuestion("");
      } catch (err) {
        console.error("Failed to submit doubt:", err);
        alert(err?.message || "Failed to submit doubt to faculty.");
      } finally {
        setSubmitting(false);
      }
    } else if (mode === "ai") {
      const userMessage = {
        id: `user-${Date.now()}`,
        type: "user",
        text: cleanedQuestion,
        referenced: false,
      };

      setAiMessages((previous) => [...previous, userMessage]);
      setQuestion("");

      try {
        const response = await apiClient.post(`/lectures/${lectureId}/ask-ai`, {
          question: cleanedQuestion,
        });

        const aiAnswerMessage = {
          id: `ai-${Date.now()}`,
          type: "ai",
          text: response.answer,
          referenced: true,
        };

        setAiMessages((previous) => [...previous, aiAnswerMessage]);
      } catch (err) {
        console.error("Ask AI failed:", err);
        let errorText = err?.message || "Failed to get AI answer. Please try again.";

        if (err?.status === 409) {
          errorText =
            "AI answers are not available yet because this lecture transcript is still being processed.";
        }

        const errorMessage = {
          id: `ai-err-${Date.now()}`,
          type: "ai",
          text: errorText,
          referenced: false,
          isError: true,
        };

        setAiMessages((previous) => [...previous, errorMessage]);
      } finally {
        setSubmitting(false);
      }
    }
  };

  /* =========================================================
     VALIDATION & LOADING STATES
  ========================================================= */

  if (loading) {
    return (
      <div className="page student-page">
        <div className="card student-resource-empty" style={{ marginTop: 20 }}>
          <RefreshCw size={32} className="animate-spin" />
          <p style={{ marginTop: 12 }}>Loading Q&A...</p>
        </div>
      </div>
    );
  }

  if (errorStatus === 403 || errorStatus === 404 || !lecture) {
    return (
      <div className="page student-page">
        <div className="card student-resource-empty" style={{ marginTop: 20 }}>
          <h3>{errorStatus === 403 ? "Lecture Access Restricted" : "Lecture Not Found"}</h3>
          <p>{error || "The requested lecture Q&A is not accessible."}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="page student-page"
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* =====================================================
          RESOURCE TABS
      ===================================================== */}

      <section>
        <div style={tabContainerStyle}>
          <button
            type="button"
            style={tabStyle}
            onClick={() => navigate(`/student/lectures/${lecture.id}/notes`)}
          >
            Notes
          </button>

          <button
            type="button"
            style={tabStyle}
            onClick={() =>
              navigate(`/student/lectures/${lecture.id}/flashcards`)
            }
          >
            Flashcards
          </button>

          <button
            type="button"
            style={tabStyle}
            onClick={() => navigate(`/student/lectures/${lecture.id}/quiz`)}
          >
            Quiz
          </button>

          <button
            type="button"
            style={tabStyle}
            onClick={() =>
              navigate(`/student/lectures/${lecture.id}/transcript`)
            }
          >
            Transcript
          </button>

          <button type="button" style={activeTabStyle}>
            Ask
          </button>
        </div>
      </section>

      {/* =====================================================
          ASK HEADER
      ===================================================== */}

      <section
        style={{
          marginTop: 24,
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#627188",
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {lecture.subject_id ? `Subject #${lecture.subject_id}` : "LECTURE Q&A"}
        </p>

        <h1
          style={{
            margin: "7px 0 0",
            color: "#0f274f",
            fontSize: 28,
            lineHeight: 1.3,
          }}
        >
          Ask about {lecture.title}
        </h1>

        <p
          style={{
            margin: "7px 0 0",
            color: "#627188",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          Answers and doubts on this page are linked only to this lecture.
        </p>
      </section>

      {/* =====================================================
          CHAT AREA
      ===================================================== */}

      <section
        className="card"
        style={{
          marginTop: 20,
          padding: "24px 24px 18px",
          borderRadius: 15,
        }}
      >
        {!mode ? (
          <div
            style={{
              minHeight: 330,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#0f274f",
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              Choose how you want to ask
            </p>

            <p
              style={{
                margin: "8px 0 0",
                color: "#627188",
                fontSize: 14,
              }}
            >
              Select a mode before entering your question.
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 10,
                marginTop: 22,
              }}
            >
              <button
                type="button"
                className="primary-action-button"
                onClick={() => setMode("ai")}
              >
                Ask AI
              </button>

              <button
                type="button"
                onClick={() => setMode("lecture")}
                style={{
                  ...tabStyle,
                  minHeight: 42,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#53657d",
                }}
              >
                Ask Lecturer
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                minHeight: 36,
              }}
            >
              <span
                style={{
                  color: "#52647d",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Mode: {mode === "lecture" ? "Ask Lecturer" : "Ask AI"}
              </span>

              <button
                type="button"
                onClick={() => setMode(null)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#2f76d2",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Change mode
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gap: 18,
                minHeight: 294,
              }}
            >
              {activeMessages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    display: "flex",
                    justifyContent:
                      message.type === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "76%",
                      padding: "13px 15px",
                      borderRadius:
                        message.type === "user"
                          ? "14px 14px 4px 14px"
                          : "14px 14px 14px 4px",
                      background:
                        message.type === "user"
                          ? "#2f76d2"
                          : message.isError
                          ? "#fef2f2"
                          : "#eef2f7",
                      color:
                        message.type === "user"
                          ? "#ffffff"
                          : message.isError
                          ? "#991b1b"
                          : "#334155",
                      fontSize: 14,
                      lineHeight: 1.7,
                      border: message.isError ? "1px solid #fecaca" : "none",
                    }}
                  >
                    <p style={{ margin: 0 }}>{message.text}</p>

                    {message.type === "ai" && message.referenced && (
                      <small
                        style={{
                          display: "block",
                          marginTop: 9,
                          color: "#64748b",
                          fontSize: 10,
                        }}
                      >
                        Referenced from this lecture
                        {message.answeredBy
                          ? ` • Answered by ${message.answeredBy}${
                              message.answeredAt ? ` • ${message.answeredAt}` : ""
                            }`
                          : ""}
                      </small>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 22,
                paddingTop: 18,
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <input
                type="text"
                value={question}
                disabled={submitting}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    askQuestion();
                  }
                }}
                placeholder={
                  mode === "lecture"
                    ? "Ask a doubt to your lecturer..."
                    : "Ask AI about this lecture..."
                }
                style={{
                  flex: 1,
                  minHeight: 44,
                  padding: "10px 13px",
                  border: "1px solid #dce1e8",
                  borderRadius: 9,
                  outline: "none",
                  color: "#334155",
                  background: "#ffffff",
                  fontSize: 14,
                }}
              />

              <button
                type="button"
                onClick={askQuestion}
                disabled={!question.trim() || submitting}
                style={{
                  minWidth: 76,
                  minHeight: 44,
                  padding: "9px 16px",
                  border: "none",
                  borderRadius: 9,
                  background: "#2f76d2",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: question.trim() && !submitting ? "pointer" : "not-allowed",
                  opacity: question.trim() && !submitting ? 1 : 0.55,
                }}
              >
                {submitting ? "Sending..." : "Ask"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

/* =========================================================
   TAB STYLES
========================================================= */

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
