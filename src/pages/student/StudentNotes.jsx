import { useNavigate, useParams } from "react-router-dom";

import { lectures, lectureData } from "../../data/lectures";

export default function StudentNotes() {
  const { lectureId } = useParams();
  const navigate = useNavigate();

  /* =========================================================
     SELECTED LECTURE
  ========================================================= */

  const lecture = lectures.find(
    (item) => String(item.id) === String(lectureId),
  );

  const selectedLectureData = lecture ? lectureData[lecture.dataId] : null;

  const isPublished = lecture?.broadcastStatus === "Broadcast";

  /*
   * Latest published notes.
   *
   * If faculty publishing later provides publishedNotes,
   * that will automatically take priority.
   */
  const notes =
    selectedLectureData?.publishedNotes ||
    selectedLectureData?.notes ||
    selectedLectureData?.summary ||
    [];

  /*
   * Optional detailed note sections.
   *
   * If the backend later provides publishedNoteSections,
   * those will take priority.
   */
  const noteSections =
    selectedLectureData?.publishedNoteSections ||
    selectedLectureData?.noteSections ||
    selectedLectureData?.concepts ||
    [];

  /*
   * Optional glossary.
   */
  const glossary =
    selectedLectureData?.publishedGlossary ||
    selectedLectureData?.glossary ||
    [];

  /*
   * Optional edit metadata.
   */
  const editedBy =
    selectedLectureData?.notesEditedBy ||
    selectedLectureData?.editedBy ||
    selectedLectureData?.lastEditedBy ||
    selectedLectureData?.updatedBy ||
    lecture?.notesEditedBy ||
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
          <h3>Notes unavailable</h3>

          <p>Published notes could not be found for this lecture.</p>
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
          <button type="button" style={activeTabStyle}>
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

          <button type="button" style={tabStyle}>
            Ask
          </button>
        </div>
      </section>

      {/* =====================================================
          SUMMARY / NOTES INTRO
      ===================================================== */}

      <section
        className="card"
        style={{
          marginTop: 18,
          padding: "28px 30px",
          borderRadius: 15,
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#52647d",
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.11em",
          }}
        >
          Summary
        </p>

        <p
          style={{
            margin: "14px 0 0",
            color: "#627188",
            fontSize: 15,
            lineHeight: 1.8,
          }}
        >
          {Array.isArray(notes) ? notes.join(" ") : notes}
        </p>

        {noteSections.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 17,
            }}
          >
            {noteSections.map((section, index) => {
              const title =
                typeof section === "string" ? section : section.title;

              return (
                <span
                  key={`${title}-${index}`}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 999,
                    background: "#eef2f7",
                    color: "#627188",
                    fontSize: 11,
                  }}
                >
                  {title}
                </span>
              );
            })}
          </div>
        )}

        {editedBy && (
          <p
            style={{
              margin: "18px 0 0",
              color: "#64748b",
              fontSize: 11,
              fontStyle: "italic",
            }}
          >
            {formatEditorName(editedBy)}
          </p>
        )}
      </section>

      {/* =====================================================
          DETAILED NOTES
      ===================================================== */}

      {noteSections.map((section, index) => {
        const title =
          typeof section === "string" ? `Note ${index + 1}` : section.title;

        const description =
          typeof section === "string" ? section : section.description;

        const points =
          typeof section === "object" && Array.isArray(section.points)
            ? section.points
            : [];

        return (
          <section
            key={`${title}-${index}`}
            className="card"
            style={{
              marginTop: 18,
              padding: "28px 30px",
              borderRadius: 15,
            }}
          >
            <h3
              style={{
                margin: 0,
                color: "#0f274f",
                fontSize: 18,
                lineHeight: 1.4,
              }}
            >
              {title}
            </h3>

            {description && (
              <p
                style={{
                  margin: "12px 0 0",
                  color: "#627188",
                  fontSize: 14,
                  lineHeight: 1.8,
                }}
              >
                {description}
              </p>
            )}

            {points.length > 0 && (
              <ul
                style={{
                  margin: "14px 0 0",
                  paddingLeft: 22,
                  color: "#627188",
                  fontSize: 14,
                  lineHeight: 1.9,
                }}
              >
                {points.map((point, pointIndex) => (
                  <li key={pointIndex}>{point}</li>
                ))}
              </ul>
            )}

            {editedBy && (
              <p
                style={{
                  margin: "16px 0 0",
                  color: "#64748b",
                  fontSize: 11,
                  fontStyle: "italic",
                }}
              >
                {formatEditorName(editedBy)}
              </p>
            )}
          </section>
        );
      })}

      {/* =====================================================
          GLOSSARY
      ===================================================== */}

      {glossary.length > 0 && (
        <section
          className="card"
          style={{
            marginTop: 18,
            padding: "28px 30px",
            borderRadius: 15,
          }}
        >
          <h3
            style={{
              margin: 0,
              color: "#0f274f",
              fontSize: 18,
            }}
          >
            Glossary
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "18px 28px",
              marginTop: 20,
            }}
          >
            {glossary.map((item, index) => (
              <div key={index}>
                <strong
                  style={{
                    display: "block",
                    color: "#0f274f",
                    fontSize: 14,
                  }}
                >
                  {item.term}
                </strong>

                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#627188",
                    fontSize: 13,
                    lineHeight: 1.6,
                  }}
                >
                  {item.definition}
                </p>
              </div>
            ))}
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
