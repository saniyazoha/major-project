import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Download, FileText, RefreshCw } from "lucide-react";
import { jsPDF } from "jspdf";

import { apiClient } from "../../api/client";

function StudentLectureDetails() {
  const { lectureId } = useParams();
  const navigate = useNavigate();

  const [lecture, setLecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLecture = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get(`/lectures/${lectureId}`);
      setLecture(data);
    } catch (err) {
      console.error("Failed to load lecture:", err);
      setError(err?.message || "Failed to load lecture.");
      setLecture(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lectureId) {
      fetchLecture();
    }
  }, [lectureId]);

  const formatDate = (isoString) => {
    if (!isoString) return "";
    try {
      return new Date(isoString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return null;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

    doc.text(lecture?.title || "Lecture", 20, 20);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");

    doc.text(
      `${formatDate(lecture?.created_at)} ${
        lecture?.file_size ? `• ${formatFileSize(lecture.file_size)}` : ""
      }`.trim(),
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

  const downloadMaterial = async (type) => {
    if (!lecture) {
      return;
    }

    try {
      const doc = new jsPDF();
      let y = 20;

      if (type === "transcript") {
        const transcript = await apiClient.get(`/lectures/${lectureId}/transcript`).catch(() => null);
        const text = transcript?.corrected_text || transcript?.raw_text || "No published transcript is available.";
        y = addPdfTitle(doc, "Transcript");
        addWrappedText(doc, text, 20, y);
      } else if (type === "notes") {
        const note = await apiClient.get(`/lectures/${lectureId}/notes`).catch(() => null);
        y = addPdfTitle(doc, "Notes & Summary");
        if (note?.summary_text) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.text("Summary:", 20, y);
          y += 8;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          y = addWrappedText(doc, note.summary_text, 20, y);
          y += 10;
        }
        if (note?.markdown_content) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.text("Detailed Notes:", 20, y);
          y += 8;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          y = addWrappedText(doc, note.markdown_content, 20, y);
        }
        if (!note?.summary_text && !note?.markdown_content) {
          addWrappedText(doc, "No published notes are available.", 20, y);
        }
      } else if (type === "flashcards") {
        const cards = await apiClient.get(`/lectures/${lectureId}/flashcards`).catch(() => []);
        y = addPdfTitle(doc, "Flashcards");
        if (Array.isArray(cards) && cards.length > 0) {
          const cardText = cards.map((c, i) => `Card ${i + 1}:\nQ: ${c.question}\nA: ${c.answer}`).join("\n\n");
          addWrappedText(doc, cardText, 20, y);
        } else {
          addWrappedText(doc, "No published flashcards are available.", 20, y);
        }
      } else if (type === "quiz") {
        const quizzes = await apiClient.get(`/lectures/${lectureId}/quizzes`).catch(() => []);
        y = addPdfTitle(doc, "Practice Quiz");
        if (Array.isArray(quizzes) && quizzes.length > 0) {
          const quizText = quizzes
            .map((q, i) => {
              let opts = "";
              try {
                const parsed = typeof q.options_json === "string" ? JSON.parse(q.options_json) : q.options_json;
                if (Array.isArray(parsed)) {
                  opts = parsed.map((opt, idx) => `  ${String.fromCharCode(65 + idx)}) ${opt}`).join("\n");
                }
              } catch {
                opts = `  Options: ${q.options_json}`;
              }
              return `Q${i + 1}: ${q.question}\n${opts}\nCorrect Answer: ${q.correct_answer}${q.explanation ? `\nExplanation: ${q.explanation}` : ""}`;
            })
            .join("\n\n");
          addWrappedText(doc, quizText, 20, y);
        } else {
          addWrappedText(doc, "No published quiz is available.", 20, y);
        }
      }

      const fileName = sanitizeFileName(lecture.title);
      doc.save(`${fileName}-${type}.pdf`);
    } catch (err) {
      console.error(`Failed to download ${type}:`, err);
    }
  };

  /* =========================================================
     FULL STUDY PACK PDF
  ========================================================= */

  const downloadFullStudyPack = async () => {
    if (!lecture) {
      return;
    }

    try {
      const [transcript, note, cards, quizzes, glossary] = await Promise.all([
        apiClient.get(`/lectures/${lectureId}/transcript`).catch(() => null),
        apiClient.get(`/lectures/${lectureId}/notes`).catch(() => null),
        apiClient.get(`/lectures/${lectureId}/flashcards`).catch(() => []),
        apiClient.get(`/lectures/${lectureId}/quizzes`).catch(() => []),
        apiClient.get(`/lectures/${lectureId}/glossary`).catch(() => []),
      ]);

      const doc = new jsPDF();
      let y = addPdfTitle(doc, "Full Study Pack");

      // Notes & Summary
      if (note?.summary_text || note?.markdown_content) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("1. Notes & Summary", 20, y);
        y += 8;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        if (note.summary_text) {
          y = addWrappedText(doc, `SUMMARY:\n${note.summary_text}`, 20, y);
          y += 6;
        }
        if (note.markdown_content) {
          y = addWrappedText(doc, `DETAILED NOTES:\n${note.markdown_content}`, 20, y);
          y += 6;
        }
      }

      // Glossary
      if (Array.isArray(glossary) && glossary.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("2. Glossary", 20, y);
        y += 8;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const glossText = glossary.map((g) => `• ${g.term}: ${g.definition}`).join("\n");
        y = addWrappedText(doc, glossText, 20, y);
        y += 6;
      }

      // Flashcards
      if (Array.isArray(cards) && cards.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("3. Flashcards", 20, y);
        y += 8;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const cardText = cards.map((c, i) => `Q${i + 1}: ${c.question}\nA: ${c.answer}`).join("\n\n");
        y = addWrappedText(doc, cardText, 20, y);
        y += 6;
      }

      // Quiz
      if (Array.isArray(quizzes) && quizzes.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("4. Practice Quiz", 20, y);
        y += 8;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const quizText = quizzes
          .map((q, i) => {
            let opts = "";
            try {
              const parsed = typeof q.options_json === "string" ? JSON.parse(q.options_json) : q.options_json;
              if (Array.isArray(parsed)) {
                opts = parsed.map((opt, idx) => `  ${String.fromCharCode(65 + idx)}) ${opt}`).join("\n");
              }
            } catch {
              opts = `  Options: ${q.options_json}`;
            }
            return `Q${i + 1}: ${q.question}\n${opts}\nAnswer: ${q.correct_answer}`;
          })
          .join("\n\n");
        y = addWrappedText(doc, quizText, 20, y);
        y += 6;
      }

      // Transcript
      const tText = transcript?.corrected_text || transcript?.raw_text;
      if (tText) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("5. Transcript", 20, y);
        y += 8;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        y = addWrappedText(doc, tText, 20, y);
      }

      const fileName = sanitizeFileName(lecture.title);
      doc.save(`${fileName}-full-study-pack.pdf`);
    } catch (err) {
      console.error("Failed to download full study pack:", err);
    }
  };

  /* =========================================================
     VALIDATION & LOADING STATES
  ========================================================= */

  if (loading) {
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
          <RefreshCw size={32} className="animate-spin" />
          <p>Loading lecture details...</p>
        </div>
      </div>
    );
  }

  if (error || !lecture) {
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
          <p>The requested lecture does not exist or has not been broadcast to your batch.</p>
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
          {lecture.created_at && (
            <span style={metaChipStyle}>{formatDate(lecture.created_at)}</span>
          )}

          {lecture.file_size && (
            <span
              style={{
                ...metaChipStyle,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Clock size={12} />
              {formatFileSize(lecture.file_size)}
            </span>
          )}

          {lecture.status && (
            <span style={{ ...metaChipStyle, textTransform: "capitalize" }}>
              {lecture.status}
            </span>
          )}
        </div>
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
            onClick={() =>
              navigate(`/student/lectures/${lecture.id}/glossary`)
            }
            style={tabButtonStyle}
          >
            Glossary
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
            Review the published learning material for {lecture.title}.
          </p>
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
