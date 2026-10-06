import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";

import { apiClient } from "../../api/client";

export default function StudentFlashcards() {
  const { lectureId } = useParams();
  const navigate = useNavigate();

  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const fetchFlashcards = async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorStatus(null);
      const data = await apiClient.get(`/lectures/${lectureId}/flashcards/review`);
      const list = Array.isArray(data) ? data : data?.data || [];
      setFlashcards(list);
      setCurrent(0);
      setFlipped(false);
    } catch (err) {
      console.error("Failed to load flashcards:", err);
      setErrorStatus(err?.status || 500);
      setError(err?.message || "Failed to load flashcards.");
      setFlashcards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lectureId) {
      fetchFlashcards();
    }
  }, [lectureId]);

  const handleReview = async (quality) => {
    const currentCard = flashcards[current];
    if (!currentCard || reviewing) return;

    try {
      setReviewing(true);
      const updatedProgress = await apiClient.post(`/flashcards/${currentCard.id}/review`, { quality });

      setFlashcards((prev) =>
        prev.map((fc, idx) =>
          idx === current ? { ...fc, progress: updatedProgress } : fc
        )
      );

      if (current < flashcards.length - 1) {
        setCurrent((prev) => prev + 1);
        setFlipped(false);
      } else {
        setFlipped(true);
      }
    } catch (err) {
      console.error("Failed to record flashcard review:", err);
    } finally {
      setReviewing(false);
    }
  };

  const next = () => {
    if (current < flashcards.length - 1) {
      setCurrent((value) => value + 1);
      setFlipped(false);
    }
  };

  const previous = () => {
    if (current > 0) {
      setCurrent((value) => value - 1);
      setFlipped(false);
    }
  };

  if (loading) {
    return (
      <div className="page student-page">
        <div className="card student-resource-empty" style={{ marginTop: 20 }}>
          <RefreshCw size={32} className="animate-spin" />
          <p>Loading flashcards...</p>
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
          <h3>Flashcards unavailable</h3>
          <p>The flashcards for this lecture are unavailable or have not been broadcast.</p>
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
          <h3>Failed to load flashcards</h3>
          <p>{error}</p>
          <button
            type="button"
            className="secondary-action-button"
            onClick={fetchFlashcards}
            style={{ marginTop: 12 }}
          >
            <RefreshCw size={15} /> Retry
          </button>
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
      {/* RESOURCE TABS */}

      <section>
        <div style={tabContainerStyle}>
          <button
            type="button"
            style={tabStyle}
            onClick={() => navigate(`/student/lectures/${lectureId}`)}
          >
            Notes
          </button>

          <button type="button" style={activeTabStyle}>
            Flashcards
          </button>

          <button
            type="button"
            style={tabStyle}
            onClick={() => navigate(`/student/lectures/${lectureId}/quiz`)}
          >
            Quiz
          </button>

          <button
            type="button"
            style={tabStyle}
            onClick={() =>
              navigate(`/student/lectures/${lectureId}/transcript`)
            }
          >
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

      {flashcards.length === 0 ? (
        <div className="card student-resource-empty" style={{ marginTop: 18 }}>
          <h3>No flashcards generated for this lecture</h3>
          <p>
            Flashcards will appear here once generated for this lecture.
          </p>
        </div>
      ) : (
        <>
          {/* FLASHCARD */}
          {flashcards[current] && (
            <div>
              <section
                className="card"
                onClick={() => setFlipped((value) => !value)}
                style={{
                  marginTop: 18,
                  minHeight: 285,
                  padding: "36px 30px",
                  borderRadius: 15,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                {flashcards[current].progress ? (
                  <span
                    style={{
                      position: "absolute",
                      top: 16,
                      right: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "3px 9px",
                      borderRadius: 12,
                      background: "#e0f2fe",
                      color: "#0369a1",
                    }}
                  >
                    Next Review: {flashcards[current].progress.next_review_date}
                  </span>
                ) : (
                  <span
                    style={{
                      position: "absolute",
                      top: 16,
                      right: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "3px 9px",
                      borderRadius: 12,
                      background: "#fef3c7",
                      color: "#92400e",
                    }}
                  >
                    New Card
                  </span>
                )}

                <div>
                  <h2
                    style={{
                      margin: 0,
                      color: "#0f274f",
                      fontSize: 23,
                      lineHeight: 1.5,
                      fontWeight: 600,
                    }}
                  >
                    {flipped ? flashcards[current].answer : flashcards[current].question}
                  </h2>

                  {!flipped && (
                    <p
                      style={{
                        margin: "18px 0 0",
                        color: "#627188",
                        fontSize: 14,
                      }}
                    >
                      Click to reveal answer
                    </p>
                  )}
                </div>
              </section>

              {/* SM-2 SELF-RATING BUTTONS */}
              {flipped && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: 12,
                    marginTop: 16,
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReview(1);
                    }}
                    disabled={reviewing}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 8,
                      border: "none",
                      background: "#ef4444",
                      color: "#ffffff",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Again (1)
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReview(3);
                    }}
                    disabled={reviewing}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 8,
                      border: "none",
                      background: "#f59e0b",
                      color: "#ffffff",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Hard (3)
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReview(4);
                    }}
                    disabled={reviewing}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 8,
                      border: "none",
                      background: "#2563eb",
                      color: "#ffffff",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Good (4)
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReview(5);
                    }}
                    disabled={reviewing}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 8,
                      border: "none",
                      background: "#10b981",
                      color: "#ffffff",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Easy (5)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* NAVIGATION */}
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              gap: 16,
              marginTop: 18,
            }}
          >
            <div>
              <button
                type="button"
                onClick={previous}
                disabled={current === 0}
                style={{
                  ...navigationButtonStyle,
                  opacity: current === 0 ? 0.5 : 1,
                  cursor: current === 0 ? "not-allowed" : "pointer",
                }}
              >
                Previous
              </button>
            </div>

            <span
              style={{
                color: "#53657d",
                fontSize: 14,
              }}
            >
              {current + 1} / {flashcards.length}
            </span>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={next}
                disabled={current === flashcards.length - 1}
                style={{
                  minHeight: 42,
                  padding: "9px 20px",
                  border: "none",
                  borderRadius: 9,
                  background: "#2f76d2",
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor:
                    current === flashcards.length - 1
                      ? "not-allowed"
                      : "pointer",
                  opacity: current === flashcards.length - 1 ? 0.55 : 1,
                }}
              >
                Next
              </button>
            </div>
          </section>
        </>
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

const navigationButtonStyle = {
  minHeight: 42,
  padding: "9px 18px",
  border: "1px solid #e2e8f0",
  borderRadius: 9,
  background: "#ffffff",
  color: "#53657d",
  fontSize: 14,
  fontWeight: 500,
};
