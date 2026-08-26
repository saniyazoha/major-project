import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { lectures, lectureData } from "../../data/lectures";

export default function StudentFlashcards() {
  const { lectureId } = useParams();
  const navigate = useNavigate();

  const lecture = lectures.find(
    (item) => String(item.id) === String(lectureId),
  );

  const selectedLectureData = lecture ? lectureData[lecture.dataId] : null;

  const isPublished = lecture?.broadcastStatus === "Broadcast";

  const flashcards =
    selectedLectureData?.publishedFlashcards ||
    selectedLectureData?.flashcards ||
    [];

  const editedBy =
    selectedLectureData?.flashcardsEditedBy ||
    selectedLectureData?.editedBy ||
    selectedLectureData?.lastEditedBy ||
    selectedLectureData?.updatedBy ||
    lecture?.flashcardsEditedBy ||
    lecture?.editedBy ||
    lecture?.lastEditedBy ||
    lecture?.updatedBy ||
    "";

  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const formatEditorName = (name) => {
    if (!name) {
      return "";
    }

    const cleanedName = String(name)
      .replace(/^Ms\.\s*/i, "")
      .replace(/^Mrs\.\s*/i, "")
      .replace(/^Dr\.\s*/i, "")
      .trim();

    return `Edited by Ms. ${cleanedName}`;
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

  if (!lecture) {
    return (
      <div className="page student-page">
        <div className="card student-resource-empty" style={{ marginTop: 20 }}>
          <h3>Lecture not found</h3>
          <p>The requested lecture does not exist.</p>
        </div>
      </div>
    );
  }

  if (!isPublished) {
    return (
      <div className="page student-page">
        <div className="card student-resource-empty" style={{ marginTop: 20 }}>
          <h3>Lecture not available</h3>
          <p>This lecture has not been published to students yet.</p>
        </div>
      </div>
    );
  }

  if (!selectedLectureData) {
    return (
      <div className="page student-page">
        <div className="card student-resource-empty" style={{ marginTop: 20 }}>
          <h3>Flashcards unavailable</h3>
          <p>Published flashcards could not be found for this lecture.</p>
        </div>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="page student-page">
        <section>
          <div style={tabContainerStyle}>
            <button
              type="button"
              style={tabStyle}
              onClick={() => navigate(`/student/lectures/${lecture.id}/notes`)}
            >
              Notes
            </button>

            <button type="button" style={activeTabStyle}>
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

            <button type="button" style={tabStyle}>
              Ask
            </button>
          </div>
        </section>

        <div className="card student-resource-empty" style={{ marginTop: 18 }}>
          <h3>Flashcards unavailable</h3>
          <p>
            No published flashcards are currently available for this lecture.
          </p>
        </div>
      </div>
    );
  }

  const card = flashcards[current];

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
            onClick={() => navigate(`/student/lectures/${lecture.id}/notes`)}
          >
            Notes
          </button>

          <button type="button" style={activeTabStyle}>
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

          <button type="button" style={tabStyle}>
            Ask
          </button>
        </div>
      </section>

      {editedBy && (
        <p
          style={{
            margin: "12px 0 0",
            color: "#64748b",
            fontSize: 11,
            fontStyle: "italic",
          }}
        >
          {formatEditorName(editedBy)}
        </p>
      )}

      {/* FLASHCARD */}

      <section
        className="card"
        onClick={() => setFlipped((value) => !value)}
        style={{
          marginTop: 18,
          minHeight: 285,
          padding: "36px 30px",
          borderRadius: 15,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          cursor: "pointer",
        }}
      >
        <div>
          {card.category && (
            <span
              style={{
                display: "inline-flex",
                padding: "5px 10px",
                borderRadius: 999,
                background: "#eef2f7",
                color: "#53657d",
                fontSize: 11,
              }}
            >
              {card.category}
            </span>
          )}

          <h2
            style={{
              margin: card.category ? "20px 0 0" : 0,
              color: "#0f274f",
              fontSize: 23,
              lineHeight: 1.5,
              fontWeight: 600,
            }}
          >
            {flipped ? card.answer : card.question}
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
                current === flashcards.length - 1 ? "not-allowed" : "pointer",
              opacity: current === flashcards.length - 1 ? 0.55 : 1,
            }}
          >
            Next
          </button>
        </div>
      </section>
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
