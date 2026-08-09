import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { lectureData } from "../data/lectureData";
import "../styles/LectureResources.css";

export default function FlashcardsPage() {
  const { lectureId } = useParams();
  const navigate = useNavigate();

  const lecture = lectureData[lectureId] || lectureData["lecture-04"];

  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = lecture.flashcards[current];

  const next = () => {
    if (current < lecture.flashcards.length - 1) {
      setCurrent(current + 1);
      setFlipped(false);
    }
  };

  const previous = () => {
    if (current > 0) {
      setCurrent(current - 1);
      setFlipped(false);
    }
  };

  return (
    <div className="resource-page">
      <ResourceSidebar navigate={navigate} />

      <main className="resource-main">
        <ResourceHeader />

        <div className="flashcards-content">
          <button
            className="back-link"
            onClick={() => navigate(`/student/lectures/${lectureId}`)}
          >
            ← Back to Lecture
          </button>

          <div className="flashcard-heading">
            <div>
              <div className="resource-meta">
                <span className="badge">{lecture.code}</span>

                <span>Module 2</span>
              </div>

              <h1>{lecture.shortTitle}</h1>
            </div>

            <span>
              Card {current + 1} of {lecture.flashcards.length}
            </span>
          </div>

          <div className="flashcard-progress">
            <div
              style={{
                width: `${((current + 1) / lecture.flashcards.length) * 100}%`,
              }}
            />
          </div>

          <div className="large-flashcard" onClick={() => setFlipped(!flipped)}>
            <div>
              <span className="flashcard-label">
                {flipped ? "ANSWER" : "QUESTION"}
              </span>

              <h2>{flipped ? card.answer : card.question}</h2>

              {!flipped && <p>Click the card to reveal answer</p>}
            </div>
          </div>

          <div className="difficulty-row">
            <button onClick={() => next()}>
              <strong>Again</strong>
              <small>&lt; 1m</small>
            </button>

            <button onClick={() => next()}>
              <strong>Hard</strong>
              <small>6m</small>
            </button>

            <button onClick={() => next()}>
              <strong>Good</strong>
              <small>10m</small>
            </button>

            <button onClick={() => next()}>
              <strong>Easy</strong>
              <small>4d</small>
            </button>
          </div>

          <div className="flashcard-navigation">
            <button onClick={previous} disabled={current === 0}>
              ← Previous
            </button>

            <button className="shuffle-button">⤨</button>

            <button
              onClick={next}
              disabled={current === lecture.flashcards.length - 1}
            >
              Next →
            </button>
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
