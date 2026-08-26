import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Download, FileText } from "lucide-react";

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

  const downloadMaterial = (type) => {
    if (!lecture || !selectedLectureData) {
      return;
    }

    let content = "";

    if (type === "transcript") {
      content = transcript
        ?.map((item) => `${item.time}\n${item.text}`)
        .join("\n\n");
    }

    if (type === "notes") {
      content = notes?.map((item) => `• ${item}`).join("\n");
    }

    if (type === "flashcards") {
      content = flashcards
        ?.map((item, index) => `${index + 1}. ${item.question}\n${item.answer}`)
        .join("\n\n");
    }

    if (type === "quiz") {
      content = quiz
        ?.map(
          (item, index) =>
            `${index + 1}. ${item.question}\n${item.options
              .map(
                (option, optionIndex) =>
                  `${String.fromCharCode(65 + optionIndex)}. ${option}`,
              )
              .join("\n")}`,
        )
        .join("\n\n");
    }

    const blob = new Blob([`${lecture.title}\n\n${content || ""}`], {
      type: "application/pdf",
    });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${lecture.title}-${type}.pdf`;
    anchor.click();

    URL.revokeObjectURL(url);
  };

  const downloadFullStudyPack = () => {
    if (!lecture || !selectedLectureData) {
      return;
    }

    const transcript =
      transcript?.map((item) => `${item.time} ${item.text}`).join("\n") || "";

    const notes = notes?.map((item) => `• ${item}`).join("\n") || "";

    const flashcards =
      flashcards
        ?.map((item, index) => `${index + 1}. ${item.question}\n${item.answer}`)
        .join("\n\n") || "";

    const quiz =
      quiz?.map((item, index) => `${index + 1}. ${item.question}`).join("\n") ||
      "";

    const content = `
${lecture.title}

TRANSCRIPT
${transcript}

NOTES
${notes}

FLASHCARDS
${flashcards}

QUIZ
${quiz}
`;

    const blob = new Blob([content], {
      type: "application/pdf",
    });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${lecture.title}-study-pack.pdf`;
    anchor.click();

    URL.revokeObjectURL(url);
  };

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
          <span
            style={{
              padding: "4px 9px",
              borderRadius: 999,
              background: "#eef2f7",
              color: "#627188",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {lecture.subjectCode}
          </span>

          <span
            style={{
              padding: "4px 9px",
              borderRadius: 999,
              background: "#eef2f7",
              color: "#627188",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {lecture.batch}
          </span>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 9px",
              borderRadius: 999,
              background: "#eef2f7",
              color: "#627188",
              fontSize: 11,
              fontWeight: 600,
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
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            padding: 4,
            borderRadius: 12,
            background: "#eef1f5",
          }}
        >
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
