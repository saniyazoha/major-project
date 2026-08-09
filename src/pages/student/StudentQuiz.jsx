import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { lectureData } from "../data/lectureData";
import "../styles/LectureResources.css";

export default function QuizPage() {
  const { lectureId } = useParams();
  const navigate = useNavigate();

  const lecture = lectureData[lectureId] || lectureData["lecture-04"];

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(15 * 60);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (finished) return;

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
  }, [finished]);

  const formatTime = () => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0",
    )}`;
  };

  const nextQuestion = () => {
    if (selected === lecture.quiz[current].answer) {
      setScore((previous) => previous + 1);
    }

    if (current === lecture.quiz.length - 1) {
      setFinished(true);
    } else {
      setCurrent((previous) => previous + 1);
      setSelected(null);
    }
  };

  if (finished) {
    return (
      <div className="resource-page">
        <ResourceSidebar navigate={navigate} />

        <main className="resource-main">
          <ResourceHeader />

          <div className="quiz-result-page">
            <div className="quiz-result-circle">
              {score}/{lecture.quiz.length}
            </div>

            <h1>Quiz Completed 🎉</h1>

            <p>You completed the practice quiz.</p>

            <button
              className="primary-button"
              onClick={() => navigate(`/student/lectures/${lectureId}`)}
            >
              Back to Lecture
            </button>
          </div>
        </main>
      </div>
    );
  }

  const quiz = lecture.quiz[current];

  const progress = ((current + 1) / lecture.quiz.length) * 100;

  return (
    <div className="resource-page">
      <ResourceSidebar navigate={navigate} />

      <main className="resource-main">
        <ResourceHeader />

        <div className="quiz-content">
          <div className="quiz-top">
            <div>
              <span className="badge">{lecture.code}</span>

              <span className="quiz-duration">◷ {lecture.duration}</span>

              <h1>{lecture.shortTitle}</h1>

              <p>Practice Quiz - Module 2</p>
            </div>

            <div className="quiz-timer">◷ {formatTime()}</div>
          </div>

          <div className="quiz-progress-header">
            <span>
              QUESTION {current + 1} OF {lecture.quiz.length}
            </span>

            <span>{Math.round(progress)}% Complete</span>
          </div>

          <div className="quiz-progress">
            <div
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="quiz-layout">
            <section className="quiz-question-card">
              <h2>{quiz.question}</h2>

              <div className="quiz-reference">
                Reference: "Lecture Transcript"
              </div>

              <div className="quiz-options-large">
                {quiz.options.map((option, index) => (
                  <button
                    key={index}
                    className={selected === index ? "selected" : ""}
                    onClick={() => setSelected(index)}
                  >
                    <span className="radio">
                      {selected === index ? "●" : "○"}
                    </span>

                    {option}
                  </button>
                ))}
              </div>
            </section>

            <aside className="quiz-right">
              <div className="hint-card">
                <h3>✦ LectaAI Hint</h3>

                <p>Think about the core concept discussed in this lecture.</p>

                <button>Generate New Hint</button>
              </div>

              <div className="quiz-controls">
                <button>← Previous</button>

                <button
                  className="next-button"
                  onClick={nextQuestion}
                  disabled={selected === null}
                >
                  Next →
                </button>

                <button
                  className="submit-button"
                  onClick={() => setFinished(true)}
                >
                  ▷ Submit Quiz
                </button>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function ResourceSidebar({ navigate }) {
  return (
    <aside className="resource-sidebar">
      <div className="resource-brand">
        <div className="resource-logo">L</div>

        <div>
          <h2>LectaAI</h2>
          <span>Academic Portal</span>
        </div>
      </div>

      <nav className="resource-nav">
        <button onClick={() => navigate("/dashboard")}>
          ▦ &nbsp; Dashboard
        </button>

        <button className="active" onClick={() => navigate("/subjects")}>
          ▣ &nbsp; Subjects
        </button>

        <button onClick={() => navigate("/settings")}>⚙ &nbsp; Settings</button>
      </nav>

      <button className="resource-upload" onClick={() => navigate("/upload")}>
        ↑ Upload Lecture
      </button>
    </aside>
  );
}

function ResourceHeader() {
  return (
    <header className="resource-header">
      <input className="resource-search" placeholder="Search..." />

      <div className="resource-header-icons">
        <span>♧</span>
        <span>?</span>
        <div className="resource-profile">A</div>
      </div>
    </header>
  );
}
