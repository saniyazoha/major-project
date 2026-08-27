import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { lectures, lectureData } from "../../data/lectures";

export default function StudentQuiz() {
  const { lectureId } = useParams();
  const navigate = useNavigate();

  const lecture = lectures.find(
    (item) => String(item.id) === String(lectureId),
  );

  const selectedLectureData = lecture ? lectureData[lecture.dataId] : null;

  const isPublished = lecture?.broadcastStatus === "Broadcast";

  const quizQuestions =
    selectedLectureData?.publishedQuiz || selectedLectureData?.quiz || [];

  const editedBy =
    selectedLectureData?.quizEditedBy ||
    selectedLectureData?.editedBy ||
    selectedLectureData?.lastEditedBy ||
    selectedLectureData?.updatedBy ||
    lecture?.quizEditedBy ||
    lecture?.editedBy ||
    lecture?.lastEditedBy ||
    lecture?.updatedBy ||
    "";

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(15 * 60);
  const [finished, setFinished] = useState(false);

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

  useEffect(() => {
    if (finished || !lecture || !isPublished || quizQuestions.length === 0) {
      return;
    }

    const timer = setInterval(() => {
      setTime((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          setFinished(true);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [finished, lecture, isPublished, quizQuestions.length]);

  const formatTime = () => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0",
    )}`;
  };

  const registerCurrentAnswer = () => {
    if (selected !== null && selected === quizQuestions[current]?.answer) {
      setScore((previous) => previous + 1);
    }
  };

  const nextQuestion = () => {
    if (selected === null) {
      return;
    }

    registerCurrentAnswer();

    if (current === quizQuestions.length - 1) {
      setFinished(true);
      return;
    }

    setCurrent((previous) => previous + 1);
    setSelected(null);
  };

  const previousQuestion = () => {
    if (current === 0) {
      return;
    }

    setCurrent((previous) => previous - 1);
    setSelected(null);
  };

  const submitQuiz = () => {
    if (selected !== null) {
      registerCurrentAnswer();
    }

    setFinished(true);
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
          <h3>Quiz unavailable</h3>
          <p>Published quiz content could not be found for this lecture.</p>
        </div>
      </div>
    );
  }

  if (quizQuestions.length === 0) {
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

            <button type="button" style={activeTabStyle}>
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

            <button
              type="button"
              style={tabStyle}
              onClick={() => navigate(`/student/lectures/${lecture.id}/qa`)}
            >
              Ask
            </button>
          </div>
        </section>

        <div className="card student-resource-empty" style={{ marginTop: 18 }}>
          <h3>Quiz unavailable</h3>
          <p>No published quiz is currently available for this lecture.</p>
        </div>
      </div>
    );
  }

  if (finished) {
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

            <button type="button" style={activeTabStyle}>
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

            <button
              type="button"
              style={tabStyle}
              onClick={() => navigate(`/student/lectures/${lecture.id}/qa`)}
            >
              Ask
            </button>
          </div>
        </section>

        <section
          className="card"
          style={{
            marginTop: 18,
            minHeight: 330,
            padding: 30,
            borderRadius: 15,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 112,
              height: 112,
              borderRadius: "50%",
              background: "#e8f3ed",
              color: "#087044",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            {score}/{quizQuestions.length}
          </div>

          <h2
            style={{
              margin: "22px 0 0",
              color: "#0f274f",
              fontSize: 24,
            }}
          >
            Quiz Completed
          </h2>

          <p
            style={{
              margin: "8px 0 0",
              color: "#627188",
              fontSize: 14,
            }}
          >
            You completed the practice quiz.
          </p>

          <button
            type="button"
            className="primary-action-button"
            onClick={() => navigate(`/student/lectures/${lecture.id}`)}
            style={{
              marginTop: 20,
            }}
          >
            Back to Lecture
          </button>
        </section>
      </div>
    );
  }

  const question = quizQuestions[current];

  const progress = ((current + 1) / quizQuestions.length) * 100;

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

          <button
            type="button"
            style={tabStyle}
            onClick={() =>
              navigate(`/student/lectures/${lecture.id}/flashcards`)
            }
          >
            Flashcards
          </button>

          <button type="button" style={activeTabStyle}>
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

          <button
            type="button"
            style={tabStyle}
            onClick={() => navigate(`/student/lectures/${lecture.id}/qa`)}
          >
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

      {/* QUIZ HEADER */}

      <section
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 20,
          marginTop: 22,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              color: "#627188",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Practice Quiz
          </p>

          <h1
            style={{
              margin: "6px 0 0",
              color: "#0f274f",
              fontSize: 27,
              lineHeight: 1.3,
            }}
          >
            {lecture.title}
          </h1>
        </div>

        <div
          className="card"
          style={{
            padding: "10px 16px",
            borderRadius: 9,
            color: "#0f274f",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {formatTime()}
        </div>
      </section>

      {/* PROGRESS */}

      <section
        style={{
          marginTop: 22,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            color: "#627188",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          <span>
            QUESTION {current + 1} OF {quizQuestions.length}
          </span>

          <span>{Math.round(progress)}% Complete</span>
        </div>

        <div
          style={{
            height: 5,
            marginTop: 9,
            borderRadius: 999,
            overflow: "hidden",
            background: "#e2e8f0",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              borderRadius: 999,
              background: "#1687c9",
            }}
          />
        </div>
      </section>

      {/* QUESTION */}

      <section
        className="card"
        style={{
          marginTop: 20,
          padding: "26px 28px",
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
            letterSpacing: "0.08em",
          }}
        >
          Question {current + 1}
        </p>

        <h2
          style={{
            margin: "12px 0 0",
            color: "#0f274f",
            fontSize: 21,
            lineHeight: 1.5,
          }}
        >
          {question.question}
        </h2>

        <div
          style={{
            display: "grid",
            gap: 10,
            marginTop: 22,
          }}
        >
          {question.options.map((option, index) => (
            <button
              key={`${option}-${index}`}
              type="button"
              onClick={() => setSelected(index)}
              style={{
                width: "100%",
                minHeight: 48,
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 14px",
                border:
                  selected === index
                    ? "1px solid #84aee0"
                    : "1px solid #dce1e8",
                borderRadius: 9,
                background: selected === index ? "#dce9fb" : "#ffffff",
                color: "#475569",
                fontSize: 14,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  fontSize: 17,
                  color: "#173b6d",
                }}
              >
                {selected === index ? "●" : "○"}
              </span>

              {option}
            </button>
          ))}
        </div>
      </section>

      {/* CONTROLS */}

      <section
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginTop: 18,
        }}
      >
        <button
          type="button"
          onClick={previousQuestion}
          disabled={current === 0}
          style={{
            ...secondaryButtonStyle,
            opacity: current === 0 ? 0.5 : 1,
            cursor: current === 0 ? "not-allowed" : "pointer",
          }}
        >
          Previous
        </button>

        <div
          style={{
            display: "flex",
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={submitQuiz}
            style={secondaryButtonStyle}
          >
            Submit Quiz
          </button>

          <button
            type="button"
            onClick={nextQuestion}
            disabled={selected === null}
            style={{
              minHeight: 42,
              padding: "9px 20px",
              border: "none",
              borderRadius: 9,
              background: "#2f76d2",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              cursor: selected === null ? "not-allowed" : "pointer",
              opacity: selected === null ? 0.55 : 1,
            }}
          >
            {current === quizQuestions.length - 1 ? "Finish" : "Next"}
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

const secondaryButtonStyle = {
  minHeight: 42,
  padding: "9px 18px",
  border: "1px solid #dce1e8",
  borderRadius: 9,
  background: "#ffffff",
  color: "#53657d",
  fontSize: 14,
  fontWeight: 500,
};
