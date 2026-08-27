import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Download, FileText } from "lucide-react";

import { lectures, lectureData } from "../../data/lectures";

export default function StudentSummary() {
  const { lectureId } = useParams();
  const navigate = useNavigate();

  /* =========================================================
     SELECT EXACT LECTURE
  ========================================================= */

  const lecture = lectures.find(
    (item) => String(item.id) === String(lectureId),
  );

  /*
   * IMPORTANT:
   * Never use fallback lecture data here.
   *
   * The selected lecture must load only its own published
   * learning material.
   */
  const selectedLectureData = lecture ? lectureData[lecture.dataId] : null;

  /*
   * Students can access only broadcast/published lectures.
   */
  const isPublished = lecture?.broadcastStatus === "Broadcast";

  /* =========================================================
     EDITED CONTENT INFORMATION
  ========================================================= */

  const editedBy =
    lecture?.editedBy ||
    lecture?.lastEditedBy ||
    lecture?.updatedBy ||
    selectedLectureData?.editedBy ||
    selectedLectureData?.lastEditedBy ||
    selectedLectureData?.updatedBy ||
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

  const formatDuration = (duration) => {
    if (!duration) {
      return "";
    }

    if (String(duration).includes(":")) {
      const [minutes] = String(duration).split(":");

      return `${minutes} mins`;
    }

    return duration;
  };

  /* =========================================================
     FACULTY-PUBLISHED NOTES
  ========================================================= */

  /*
   * For now, the existing project stores the faculty notes
   * inside "summary".
   *
   * Later, when the backend provides a dedicated published
   * notes field, this can directly use:
   *
   * selectedLectureData.notes
   *
   * This fallback keeps the current frontend data working.
   */
  const publishedNotes =
    selectedLectureData?.notes || selectedLectureData?.summary || [];

  /* =========================================================
     STUDENT SUMMARY
  ========================================================= */

  /*
   * The Student Summary must come from the published notes.
   *
   * If an AI-generated summary is already stored for the
   * lecture, use it.
   *
   * Otherwise, create a frontend preview from the published
   * notes until backend AI-summary generation is connected.
   *
   * IMPORTANT:
   * No other lecture data is used here.
   */
  const generatedSummary =
    selectedLectureData?.studentSummary ||
    selectedLectureData?.generatedSummary ||
    publishedNotes.slice(0, 3);

  const summaryItems = Array.isArray(generatedSummary)
    ? generatedSummary
    : generatedSummary
      ? [generatedSummary]
      : [];

  /* =========================================================
     KEY CONCEPTS
  ========================================================= */

  const concepts = selectedLectureData?.concepts || [];

  /* =========================================================
     DOWNLOAD SUMMARY
  ========================================================= */

  const downloadSummary = () => {
    if (!lecture || !selectedLectureData) {
      return;
    }

    const summaryContent =
      summaryItems.length > 0
        ? summaryItems.map((item) => `• ${item}`).join("\n")
        : "No summary is available.";

    const conceptsContent =
      concepts.length > 0
        ? concepts
            .map((concept) => `${concept.title}\n${concept.description}`)
            .join("\n\n")
        : "No key concepts are available.";

    const content = `
${lecture.title}

SUMMARY

${summaryContent}

KEY CONCEPTS

${conceptsContent}

${editedBy ? formatEditorName(editedBy) : ""}
`.trim();

    const blob = new Blob([content], {
      type: "text/plain",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `${lecture.title}-Summary.txt`;

    link.click();

    URL.revokeObjectURL(url);
  };

  /* =========================================================
     LECTURE NOT FOUND
  ========================================================= */

  if (!lecture) {
    return (
      <div className="page student-page">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/student/dashboard")}
        >
          <ArrowLeft size={15} />
          Back to dashboard
        </button>

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

  /* =========================================================
     LECTURE NOT PUBLISHED
  ========================================================= */

  if (!isPublished) {
    return (
      <div className="page student-page">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/student/dashboard")}
        >
          <ArrowLeft size={15} />
          Back to dashboard
        </button>

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

  /* =========================================================
     PUBLISHED MATERIAL NOT FOUND
  ========================================================= */

  if (!selectedLectureData) {
    return (
      <div className="page student-page">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/student/dashboard")}
        >
          <ArrowLeft size={15} />
          Back to dashboard
        </button>

        <div
          className="card student-resource-empty"
          style={{
            marginTop: 20,
          }}
        >
          <h3>Summary unavailable</h3>

          <p>
            Published learning material could not be found for this lecture.
          </p>
        </div>
      </div>
    );
  }

  /* =========================================================
     PUBLISHED NOTES NOT FOUND
  ========================================================= */

  if (publishedNotes.length === 0) {
    return (
      <div className="page student-page">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate(`/student/lectures/${lecture.id}`)}
        >
          <ArrowLeft size={15} />
          Back to lecture
        </button>

        <div
          className="card student-resource-empty"
          style={{
            marginTop: 20,
          }}
        >
          <h3>Summary unavailable</h3>

          <p>Published notes are not available for this lecture yet.</p>
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
          BACK
      ===================================================== */}

      <button
        type="button"
        onClick={() => navigate(`/student/lectures/${lecture.id}`)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: 0,
          border: "none",
          background: "transparent",
          color: "#627188",
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        <ArrowLeft size={17} />
        Back to lecture
      </button>

      {/* =====================================================
          LECTURE TITLE
      ===================================================== */}

      <section
        style={{
          marginTop: 22,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: 34,
            color: "#0f274f",
            letterSpacing: "-0.6px",
          }}
        >
          {lecture.title}
        </h1>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 9,
            marginTop: 10,
          }}
        >
          <span style={metaChipStyle}>{lecture.subjectCode}</span>

          <span style={metaChipStyle}>{lecture.batch}</span>

          <span
            style={{
              ...metaChipStyle,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Clock size={12} />

            {formatDuration(lecture.duration)}
          </span>
        </div>

        {editedBy && (
          <p
            style={{
              margin: "10px 0 0",
              color: "#64748b",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {formatEditorName(editedBy)}
          </p>
        )}
      </section>

      {/* =====================================================
          DOWNLOAD PUBLISHED MATERIAL
      ===================================================== */}

      <section
        className="card"
        style={{
          marginTop: 24,
          padding: "22px 20px",
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
            letterSpacing: "0.12em",
          }}
        >
          Download Published Material
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 9,
            marginTop: 14,
          }}
        >
          <button
            type="button"
            className="primary-action-button"
            onClick={() => navigate(`/student/lectures/${lecture.id}`)}
          >
            <Download size={16} />
            Full study pack
          </button>

          <button
            type="button"
            style={materialButtonStyle}
            onClick={() =>
              navigate(`/student/lectures/${lecture.id}/transcript`)
            }
          >
            <FileText size={16} />
            Transcript PDF
          </button>

          <button
            type="button"
            style={materialButtonStyle}
            onClick={() => navigate(`/student/lectures/${lecture.id}/notes`)}
          >
            <FileText size={16} />
            Notes PDF
          </button>

          <button
            type="button"
            style={materialButtonStyle}
            onClick={downloadSummary}
          >
            <FileText size={16} />
            Summary PDF
          </button>

          <button
            type="button"
            style={materialButtonStyle}
            onClick={() =>
              navigate(`/student/lectures/${lecture.id}/flashcards`)
            }
          >
            <FileText size={16} />
            Flashcards PDF
          </button>

          <button
            type="button"
            style={materialButtonStyle}
            onClick={() => navigate(`/student/lectures/${lecture.id}/quiz`)}
          >
            <FileText size={16} />
            Practice quiz PDF
          </button>
        </div>
      </section>

      {/* =====================================================
          RESOURCE TABS
      ===================================================== */}

      <section
        style={{
          marginTop: 28,
        }}
      >
        <div style={tabContainerStyle}>
          {/* NOTES */}

          <button
            type="button"
            style={tabStyle}
            onClick={() => navigate(`/student/lectures/${lecture.id}/notes`)}
          >
            Notes
          </button>

          {/* SUMMARY */}

          <button type="button" style={activeTabStyle}>
            Summary
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

          {/* TRANSCRIPT */}

          <button
            type="button"
            style={tabStyle}
            onClick={() =>
              navigate(`/student/lectures/${lecture.id}/transcript`)
            }
          >
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

        {/* ===================================================
            AI SUMMARY
        =================================================== */}

        <div
          className="card"
          style={{
            marginTop: 18,
            padding: 22,
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

          <div
            style={{
              marginTop: 13,
            }}
          >
            {summaryItems.map((item, index) => (
              <p
                key={index}
                style={{
                  margin: index === 0 ? 0 : "10px 0 0",
                  color: "#627188",
                  fontSize: 14,
                  lineHeight: 1.8,
                }}
              >
                {item}
              </p>
            ))}
          </div>

          {concepts.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 15,
              }}
            >
              {concepts.map((concept) => (
                <span
                  key={concept.title}
                  style={{
                    padding: "5px 10px",
                    borderRadius: 999,
                    background: "#eef2f7",
                    color: "#627188",
                    fontSize: 11,
                  }}
                >
                  {concept.title}
                </span>
              ))}
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
        </div>

        {/* ===================================================
            IMPORTANT CONCEPTS
        =================================================== */}

        {concepts.map((concept) => (
          <div
            key={concept.title}
            className="card"
            style={{
              marginTop: 18,
              padding: 22,
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
              {concept.title}
            </h3>

            <p
              style={{
                margin: "10px 0 0",
                color: "#627188",
                fontSize: 14,
                lineHeight: 1.8,
              }}
            >
              {concept.description}
            </p>

            {editedBy && (
              <p
                style={{
                  margin: "14px 0 0",
                  color: "#64748b",
                  fontSize: 11,
                  fontStyle: "italic",
                }}
              >
                {formatEditorName(editedBy)}
              </p>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

/* =========================================================
   STYLES
========================================================= */

const metaChipStyle = {
  padding: "4px 9px",
  borderRadius: 999,
  background: "#eef2f7",
  color: "#627188",
  fontSize: 11,
  fontWeight: 600,
};

const materialButtonStyle = {
  minHeight: 38,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  padding: "8px 13px",
  border: "none",
  borderRadius: 9,
  background: "#e4efff",
  color: "#0f3d75",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

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
