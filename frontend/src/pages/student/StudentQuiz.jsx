import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";

import { apiClient } from "../../api/client";

export default function StudentQuiz() {
  const { lectureId } = useParams();
  const navigate = useNavigate();

  const [lectureTitle, setLectureTitle] = useState("");
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(15 * 60);
  const [finished, setFinished] = useState(false);

  const parseOptions = (options_json) => {
    if (!options_json) return [];
    if (Array.isArray(options_json)) return options_json;
    try {
      const parsed = typeof options_json === "string" ? JSON.parse(options_json) : options_json;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const checkAnswer = (item, selectedIdx, optionsList) => {
    if (selectedIdx === null || selectedIdx === undefined || !item) return false;
    const selectedText = optionsList[selectedIdx];
    const target = item.correct_answer;
    if (target === undefined || target === null) return false;

    if (selectedText && String(selectedText).trim() === String(target).trim()) return true;
    if (String(selectedIdx) === String(target).trim()) return true;
    if (typeof target === "string" && target.length === 1) {
      const code = target.toUpperCase().charCodeAt(0) - 65;
      if (code === selectedIdx) return true;
    }
    return false;
  };

  const fetchQuizData = async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorStatus(null);

      const [lecData, quizData] = await Promise.all([
        apiClient.get(`/lectures/${lectureId}`).catch(() => null),
        apiClient.get(`/lectures/${lectureId}/quizzes`),
      ]);

      if (lecData?.title) {
        setLectureTitle(lecData.title);
      }

      const list = Array.isArray(quizData) ? quizData : quizData?.data || [];
      setQuizQuestions(list);
      setCurrent(0);
      setSelected(null);
      setScore(0);
      setFinished(false);
      setTime(15 * 60);
    } catch (err) {
      console.error("Failed to load quiz data:", err);
      setErrorStatus(err?.status || 500);
      setError(err?.message || "Failed to load quiz.");
      setQuizQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lectureId) {
      fetchQuizData();
    }
  }, [lectureId]);

  useEffect(() => {
    if (finished || loading || error || quizQuestions.length === 0) {
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
  }, [finished, loading, error, quizQuestions.length]);

  const formatTime = () => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0",
    )}`;
  };

  const registerCurrentAnswer = () => {
    const currentQ = quizQuestions[current];
    if (!currentQ) return;
    const opts = parseOptions(currentQ.options_json);
    if (checkAnswer(currentQ, selected, opts)) {
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

  if (loading) {
    return (
      <div className="page student-page">
        <div className="card student-resource-empty" style={{ marginTop: 20 }}>
          <RefreshCw size={32} className="animate-spin" />
          <p>Loading practice quiz...</p>
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
          <h3>Quiz unavailable</h3>
          <p>The practice quiz for this lecture is unavailable or has not been broadcast.</p>
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
          <h3>Failed to load quiz</h3>
          <p>{error}</p>
          <button
            type="button"
            className="secondary-action-button"
            onClick={fetchQuizData}
            style={{ marginTop: 12 }}
          >
            <RefreshCw size={15} /> Retry
          </button>
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
              onClick={() => navigate(`/student/lectures/${lectureId}`)}
            >
              Notes
            </button>

            <button
              type="button"
              style={tabStyle}
              onClick={() =>
                navigate(`/student/lectures/${lectureId}/flashcards`)
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
                navigate(`/student/lectures/${lectureId}/transcript`)
              }
            >
              Transcript
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

        <div className="card student-resource-empty" style={{ marginTop: 18 }}>
          <h3>No quizzes generated for this lecture</h3>
          <p>Practice quizzes will appear here once generated for this lecture.</p>
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
              onClick={() => navigate(`/student/lectures/${lectureId}`)}
            >
              Notes
            </button>

            <button
              type="button"
              style={tabStyle}
              onClick={() =>
                navigate(`/student/lectures/${lectureId}/flashcards`)
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
                navigate(`/student/lectures/${lectureId}/transcript`)
              }
            >
              Transcript
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
            onClick={() => navigate(`/student/lectures/${lectureId}`)}
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
  const options = parseOptions(question?.options_json);
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
            onClick={() => navigate(`/student/lectures/${lectureId}`)}
          >
            Notes
          </button>

          <button
            type="button"
            style={tabStyle}
            onClick={() =>
              navigate(`/student/lectures/${lectureId}/flashcards`)
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
            {lectureTitle || "Lecture Quiz"}
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

      {question && (
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
            {options.map((option, index) => (
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
      )}

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
