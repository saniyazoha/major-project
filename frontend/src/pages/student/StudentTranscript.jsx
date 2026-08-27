import { useNavigate, useParams } from "react-router-dom";

import { lectures, lectureData } from "../../data/lectures";

export default function StudentTranscript() {
  const { lectureId } = useParams();
  const navigate = useNavigate();

  /* =========================================================
     SELECTED LECTURE
  ========================================================= */

  const lecture = lectures.find(
    (item) => String(item.id) === String(lectureId),
  );

  /*
   * IMPORTANT:
   * Load data ONLY through the selected lecture's dataId.
   *
   * Example:
   *
   * lecture.id = 1
   * lecture.dataId = "lecture-1"
   *
   * Student sees only:
   * lectureData["lecture-1"]
   */
  const selectedLectureData = lecture ? lectureData[lecture.dataId] : null;

  /*
   * Students may view only broadcast/published lectures.
   */
  const isPublished = lecture?.broadcastStatus === "Broadcast";

  /*
   * Latest published transcript.
   *
   * This also supports a future publishedTranscript field.
   * Once faculty publishing is connected to the backend,
   * publishedTranscript should contain the latest approved
   * published version.
   */
  const transcript =
    selectedLectureData?.publishedTranscript ||
    selectedLectureData?.transcript ||
    [];

  /*
   * Optional editor information.
   */
  const editedBy =
    selectedLectureData?.transcriptEditedBy ||
    selectedLectureData?.editedBy ||
    selectedLectureData?.lastEditedBy ||
    selectedLectureData?.updatedBy ||
    lecture?.transcriptEditedBy ||
    lecture?.editedBy ||
    lecture?.lastEditedBy ||
    lecture?.updatedBy ||
    "";

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

  /* =========================================================
     VALIDATION
  ========================================================= */

  if (!lecture) {
    return (
      <div className="page student-page">
        <div
          className="card student-resource-empty"
          style={{
            marginTop: 20,
          }}
        >
          <h3>Lecture not found</h3>

          <p>The requested lecture does not exist.</p>
        </div>
      </div>
    );
  }

  if (!isPublished) {
    return (
      <div className="page student-page">
        <div
          className="card student-resource-empty"
          style={{
            marginTop: 20,
          }}
        >
          <h3>Lecture not available</h3>

          <p>This lecture has not been published to students yet.</p>
        </div>
      </div>
    );
  }

  if (!selectedLectureData) {
    return (
      <div className="page student-page">
        <div
          className="card student-resource-empty"
          style={{
            marginTop: 20,
          }}
        >
          <h3>Transcript unavailable</h3>

          <p>The published transcript for this lecture could not be found.</p>
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

          Ask opens the lecture-specific Q&A page.
      ===================================================== */}

      <section>
        <div style={tabContainerStyle}>
          {/* NOTES */}
          <button
            type="button"
            style={tabStyle}
            onClick={() => navigate(`/student/lectures/${lecture.id}`)}
          >
            Notes
          </button>

          {/* FLASHCARDS */}
          <button
            type="button"
            style={tabStyle}
            onClick={() =>
              navigate(`/student/lectures/${lecture.id}/flashcards`)
            }
          >
            Flashcards
          </button>

          {/* QUIZ */}
          <button
            type="button"
            style={tabStyle}
            onClick={() => navigate(`/student/lectures/${lecture.id}/quiz`)}
          >
            Quiz
          </button>

          {/* TRANSCRIPT - ACTIVE */}
          <button type="button" style={activeTabStyle}>
            Transcript
          </button>

          <button
            type="button"
            style={tabStyle}
            onClick={() => navigate(`/student/lectures/${lecture.id}/qa`)}
          >
            Ask
          </button>
        </div>
      </section>

      {/* =====================================================
          EDIT INFORMATION
      ===================================================== */}

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

      {/* =====================================================
          TRANSCRIPT
      ===================================================== */}

      {transcript.length === 0 ? (
        <div
          className="card student-resource-empty"
          style={{
            marginTop: 18,
          }}
        >
          <h3>Transcript unavailable</h3>

          <p>
            No published transcript is currently available for this lecture.
          </p>
        </div>
      ) : (
        <section
          className="card"
          style={{
            marginTop: 18,
            padding: 0,
            borderRadius: 15,
            overflow: "hidden",
          }}
        >
          {transcript.map((item, index) => (
            <div
              key={`${item.time}-${index}`}
              style={{
                padding: "20px 24px",
                borderBottom:
                  index === transcript.length - 1
                    ? "none"
                    : "1px solid #e2e8f0",
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
                {item.time}
              </div>

              <p
                style={{
                  margin: "8px 0 0",
                  color: "#0f274f",
                  fontSize: 15,
                  lineHeight: 1.7,
                }}
              >
                {item.text}
              </p>
            </div>
          ))}
        </section>
      )}
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
