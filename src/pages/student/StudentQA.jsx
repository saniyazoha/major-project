import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { lectureData } from "../data/lectureData";
import "../styles/LectureResources.css";

export default function QAPage() {
  const { lectureId } = useParams();
  const navigate = useNavigate();

  const lecture = lectureData[lectureId] || lectureData["lecture-04"];

  const [question, setQuestion] = useState("");

  const [messages, setMessages] = useState([
    {
      type: "ai",
      text: `Hello! I'm ready to answer questions about ${lecture.title}. What would you like to know?`,
    },
  ]);

  const askQuestion = () => {
    if (!question.trim()) return;

    const userQuestion = question;

    setMessages((previous) => [
      ...previous,
      {
        type: "user",
        text: userQuestion,
      },
      {
        type: "ai",
        text:
          `Based strictly on the lecture transcript, ` +
          `the answer to your question is related to ` +
          `the concepts discussed in this lecture. ` +
          `Please refer to the relevant transcript section ` +
          `for the detailed explanation.`,
      },
    ]);

    setQuestion("");
  };

  return (
    <div className="resource-page">
      <ResourceSidebar navigate={navigate} />

      <main className="resource-main qa-main">
        <ResourceHeader />

        <button
          className="back-link"
          onClick={() => navigate(`/student/lectures/${lectureId}`)}
        >
          ← Back to Lecture
        </button>

        <div className="qa-page-header">
          <span>{lecture.code}: INTRODUCTION TO COMPUTER SCIENCE</span>

          <h1>{lecture.shortTitle}</h1>

          <p>ⓘ Answers are based strictly on this lecture's content.</p>
        </div>

        <div className="qa-messages">
          {messages.map((message, index) => (
            <div key={index} className={`qa-message-row ${message.type}`}>
              {message.type === "ai" && <div className="ai-avatar">✦</div>}

              <div className="qa-message">
                {message.text}

                {message.type === "ai" && index > 0 && (
                  <small>▣ Referenced from lecture transcript</small>
                )}
              </div>

              {message.type === "user" && <div className="user-avatar">A</div>}
            </div>
          ))}
        </div>

        <div className="qa-input-area">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                askQuestion();
              }
            }}
            placeholder="Ask a question about this lecture..."
          />

          <button onClick={askQuestion}>➤</button>
        </div>
      </main>
    </div>
  );
}

function ResourceSidebar({ navigate }) {
  return (
    <aside className="resource-sidebar">
      <div className="resource-brand">
        <div className="resource-logo">✦</div>

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
