import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Download, FileText } from "lucide-react";
import { jsPDF } from "jspdf";

import { lectures, lectureData } from "../../data/lectures";

function StudentLectureDetails() {
  const { lectureId } = useParams();
  const navigate = useNavigate();

  const lecture = lectures.find(
    (item) => String(item.id) === String(lectureId),
  );

  const selectedLectureData = lecture ? lectureData[lecture.dataId] : null;

  const isPublished = lecture?.broadcastStatus === "Broadcast";

  const transcript =
    selectedLectureData?.publishedTranscript ||
    selectedLectureData?.transcript ||
    [];

  const notes =
    selectedLectureData?.publishedNotes ||
    selectedLectureData?.notes ||
    selectedLectureData?.summary ||
    [];

  const flashcards =
    selectedLectureData?.publishedFlashcards ||
    selectedLectureData?.flashcards ||
    [];

  const quiz =
    selectedLectureData?.publishedQuiz || selectedLectureData?.quiz || [];

  const editedBy =
    selectedLectureData?.notesEditedBy ||
    selectedLectureData?.flashcardsEditedBy ||
    selectedLectureData?.transcriptEditedBy ||
    selectedLectureData?.quizEditedBy ||
    selectedLectureData?.editedBy ||
    selectedLectureData?.lastEditedBy ||
    selectedLectureData?.updatedBy ||
    lecture?.notesEditedBy ||
    lecture?.flashcardsEditedBy ||
    lecture?.transcriptEditedBy ||
    lecture?.quizEditedBy ||
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
     PDF HELPERS
  ========================================================= */

  const sanitizeFileName = (value) => {
    return String(value || "lecture")
      .replace(/[<>:"/\\|?*]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  };

  const addWrappedText = (doc, text, x, y, maxWidth = 170, lineHeight = 7) => {
    const lines = doc.splitTextToSize(String(text || ""), maxWidth);

    lines.forEach((line) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }

      doc.text(line, x, y);
      y += lineHeight;
    });

    return y;
  };

  const addPdfTitle = (doc, resourceTitle) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);

    doc.text(lecture.title, 20, 20);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    doc.text(
      `${lecture.subjectCode || ""} ${lecture.batch || ""}`.trim(),
      20,
      28,
    );

    doc.text(
      `${lecture.date || ""} ${
        lecture.duration ? `• ${formatDuration(lecture.duration)}` : ""
      }`,
      20,
      35,
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);

    doc.text(resourceTitle, 20, 48);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    return 58;
  };

  /* =========================================================
     DOWNLOAD INDIVIDUAL MATERIAL
  ========================================================= */

  const downloadMaterial = (type) => {
    if (!lecture || !selectedLectureData) {
      return;
    }

    const doc = new jsPDF();
    let y = 20;

    if (type === "transcript") {
      y = addPdfTitle(doc, "Transcript");

      if (transcript.length === 0) {
        addWrappedText(doc, "No published transcript is available.", 20, y);
      } else {
        transcript.forEach((item) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }

          doc.setFont("helvetica", "bold");
          doc.text(String(item.time || ""), 20, y);

          doc.setFont("helvetica", "normal");

          y = addWrappedText(doc, item.text || "", 38, y, 150);

          y += 5;
        });
      }
    }

    if (type === "notes") {
      y = addPdfTitle(doc, "Notes");

      if (notes.length === 0) {
        addWrappedText(doc, "No published notes are available.", 20, y);
      } else {
        notes.forEach((item, index) => {
          y = addWrappedText(doc, `${index + 1}. ${item}`, 20, y);

          y += 4;
        });
      }

      if (selectedLectureData?.concepts?.length > 0) {
        y += 5;

        if (y > 265) {
          doc.addPage();
          y = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text("Key Concepts", 20, y);

        y += 10;

        doc.setFontSize(11);

        selectedLectureData.concepts.forEach((concept) => {
          if (y > 260) {
            doc.addPage();
            y = 20;
          }

          doc.setFont("helvetica", "bold");
          y = addWrappedText(doc, concept.title || "", 20, y);

          doc.setFont("helvetica", "normal");
          y = addWrappedText(doc, concept.description || "", 20, y);

          y += 5;
        });
      }
    }

    if (type === "flashcards") {
      y = addPdfTitle(doc, "Flashcards");

      if (flashcards.length === 0) {
        addWrappedText(doc, "No published flashcards are available.", 20, y);
      } else {
        flashcards.forEach((item, index) => {
          if (y > 250) {
            doc.addPage();
            y = 20;
          }

          doc.setFont("helvetica", "bold");

          y = addWrappedText(
            doc,
            `${index + 1}. Question: ${item.question}`,
            20,
            y,
          );

          doc.setFont("helvetica", "normal");

          y = addWrappedText(doc, `Answer: ${item.answer}`, 20, y);

          y += 7;
        });
      }
    }

    if (type === "quiz") {
      y = addPdfTitle(doc, "Practice Quiz");

      if (quiz.length === 0) {
        addWrappedText(doc, "No published quiz is available.", 20, y);
      } else {
        quiz.forEach((item, index) => {
          if (y > 235) {
            doc.addPage();
            y = 20;
          }

          doc.setFont("helvetica", "bold");

          y = addWrappedText(doc, `${index + 1}. ${item.question}`, 20, y);

          doc.setFont("helvetica", "normal");

          item.options?.forEach((option, optionIndex) => {
            y = addWrappedText(
              doc,
              `${String.fromCharCode(65 + optionIndex)}. ${option}`,
              28,
              y,
              160,
            );
          });

          if (typeof item.answer === "number" && item.options?.[item.answer]) {
            y += 2;

            doc.setFont("helvetica", "bold");

            y = addWrappedText(
              doc,
              `Answer: ${String.fromCharCode(
                65 + item.answer,
              )}. ${item.options[item.answer]}`,
              28,
              y,
              160,
            );

            doc.setFont("helvetica", "normal");
          }

          y += 7;
        });
      }
    }

    if (editedBy) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);

      doc.text(formatEditorName(editedBy), 20, y + 8);
    }

    const fileName = sanitizeFileName(lecture.title);

    doc.save(`${fileName}-${type}.pdf`);
  };

  /* =========================================================
     FULL STUDY PACK PDF
  ========================================================= */

  const downloadFullStudyPack = () => {
    if (!lecture || !selectedLectureData) {
      return;
    }

    const doc = new jsPDF();

    let y = addPdfTitle(doc, "Full Study Pack");

    /* =========================
       TRANSCRIPT
    ========================= */

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);

    doc.text("Transcript", 20, y);

    y += 10;

    doc.setFontSize(11);

    transcript.forEach((item) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.text(String(item.time || ""), 20, y);

      doc.setFont("helvetica", "normal");

      y = addWrappedText(doc, item.text || "", 38, y, 150);

      y += 4;
    });

    /* =========================
       NOTES
    ========================= */

    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);

    doc.text("Notes", 20, y);

    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    notes.forEach((item, index) => {
      y = addWrappedText(doc, `${index + 1}. ${item}`, 20, y);

      y += 3;
    });

    /* =========================
       FLASHCARDS
    ========================= */

    if (y > 245) {
      doc.addPage();
      y = 20;
    }

    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);

    doc.text("Flashcards", 20, y);

    y += 10;

    doc.setFontSize(11);

    flashcards.forEach((item, index) => {
      if (y > 245) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");

      y = addWrappedText(doc, `${index + 1}. ${item.question}`, 20, y);

      doc.setFont("helvetica", "normal");

      y = addWrappedText(doc, `Answer: ${item.answer}`, 20, y);

      y += 5;
    });

    /* =========================
       QUIZ
    ========================= */

    if (y > 235) {
      doc.addPage();
      y = 20;
    }

    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);

    doc.text("Practice Quiz", 20, y);

    y += 10;

    doc.setFontSize(11);

    quiz.forEach((item, index) => {
      if (y > 225) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "bold");

      y = addWrappedText(doc, `${index + 1}. ${item.question}`, 20, y);

      doc.setFont("helvetica", "normal");

      item.options?.forEach((option, optionIndex) => {
        y = addWrappedText(
          doc,
          `${String.fromCharCode(65 + optionIndex)}. ${option}`,
          28,
          y,
          160,
        );
      });

      y += 5;
    });

    if (editedBy) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);

      doc.text(formatEditorName(editedBy), 20, y + 8);
    }

    const fileName = sanitizeFileName(lecture.title);

    doc.save(`${fileName}-full-study-pack.pdf`);
  };

  /* =========================================================
     VALIDATION
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
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/student/dashboard")}
        >
          <ArrowLeft size={15} />
          Back to dashboard
        </button>

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
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/student/dashboard")}
        >
          <ArrowLeft size={15} />
          Back to dashboard
        </button>

        <div className="card student-resource-empty" style={{ marginTop: 20 }}>
          <h3>Lecture material unavailable</h3>
          <p>
            Published learning material could not be found for this lecture.
          </p>
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
      <button
        type="button"
        onClick={() => navigate("/student/dashboard")}
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
        Back to dashboard
      </button>

      <section style={{ marginTop: 22 }}>
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
            onClick={downloadFullStudyPack}
          >
            <Download size={16} />
            Full study pack
          </button>

          <button
            type="button"
            onClick={() => downloadMaterial("transcript")}
            style={materialButtonStyle}
          >
            <FileText size={16} />
            Transcript PDF
          </button>

          <button
            type="button"
            onClick={() => downloadMaterial("notes")}
            style={materialButtonStyle}
          >
            <FileText size={16} />
            Notes & summary PDF
          </button>

          <button
            type="button"
            onClick={() => downloadMaterial("flashcards")}
            style={materialButtonStyle}
          >
            <FileText size={16} />
            Flashcards PDF
          </button>

          <button
            type="button"
            onClick={() => downloadMaterial("quiz")}
            style={materialButtonStyle}
          >
            <FileText size={16} />
            Practice quiz PDF
          </button>
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <div style={tabContainerStyle}>
          <button
            type="button"
            onClick={() => navigate(`/student/lectures/${lecture.id}/notes`)}
            style={activeTabButtonStyle}
          >
            Notes
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(`/student/lectures/${lecture.id}/flashcards`)
            }
            style={tabButtonStyle}
          >
            Flashcards
          </button>

          <button
            type="button"
            onClick={() => navigate(`/student/lectures/${lecture.id}/quiz`)}
            style={tabButtonStyle}
          >
            Quiz
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(`/student/lectures/${lecture.id}/transcript`)
            }
            style={tabButtonStyle}
          >
            Transcript
          </button>

          <button
            type="button"
            onClick={() => navigate(`/student/lectures/${lecture.id}/qa`)}
            style={tabButtonStyle}
          >
            Ask
          </button>
        </div>

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

          <p
            style={{
              margin: "13px 0 0",
              color: "#627188",
              fontSize: 14,
              lineHeight: 1.8,
            }}
          >
            {notes?.[0] ||
              `Review the published learning material for ${lecture.title}.`}
          </p>

          {selectedLectureData.concepts?.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 15,
              }}
            >
              {selectedLectureData.concepts.map((concept) => (
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
      </section>
    </div>
  );
}

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

const tabButtonStyle = {
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

const activeTabButtonStyle = {
  ...tabButtonStyle,
  background: "#ffffff",
  color: "#0f274f",
  fontWeight: 600,
  boxShadow: "0 1px 4px rgba(15, 39, 79, 0.12)",
};

export default StudentLectureDetails;
