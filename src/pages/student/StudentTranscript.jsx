import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { lectureData } from "../data/lectureData";
import "../styles/LectureResources.css";

export default function TranscriptPage() {
  const { lectureId } = useParams();
  const navigate = useNavigate();

  const lecture = lectureData[lectureId] || lectureData["lecture-04"];

  const downloadTranscript = () => {
    const content = lecture.transcript
      .map((item) => `${item.time}\n${item.text}`)
      .join("\n\n");

    const blob = new Blob([content], {
      type: "text/plain",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${lecture.title}-Transcript.txt`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="resource-page">
      <ResourceSidebar navigate={navigate} />

      <main className="resource-main">
        <ResourceHeader />

        <div className="resource-content">
          <button
            className="back-link"
            onClick={() => navigate(`/student/lectures/${lectureId}`)}
          >
            ← Back to Lecture
          </button>

          <div className="resource-title-row">
            <div className="resource-title">
              <div className="resource-meta">
                <span className="badge">{lecture.code}</span>
                <span>{lecture.week}</span>
              </div>

              <h1>{lecture.title}</h1>

              <div className="resource-meta">
                <span>♟ {lecture.lecturer}</span>
                <span>▣ {lecture.date}</span>
                <span>◷ {lecture.duration}</span>
              </div>
            </div>

            <button className="primary-button" onClick={downloadTranscript}>
              ↓ Download Transcript
            </button>
          </div>

          <div className="transcript-layout">
            <section className="transcript-panel">
              <div className="audio-bar">
                <button>▶</button>

                <div className="audio-progress">
                  <div />
                </div>

                <span>14:32 / 1:15:00</span>

                <span>1×</span>
                <span>⚙</span>
              </div>

              <div className="transcript-list">
                {lecture.transcript.map((item, index) => (
                  <div
                    className={`transcript-item ${
                      index === 2 ? "transcript-active" : ""
                    }`}
                    key={index}
                  >
                    <span className="transcript-time">{item.time}</span>

                    <p>{item.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <aside className="transcript-side">
              <div className="side-card">
                <h3>✦ AI Summary</h3>

                {lecture.summary.map((item, index) => (
                  <p key={index}>• {item}</p>
                ))}
              </div>

              <div className="side-card">
                <h3>♧ Key Terms</h3>

                {lecture.concepts.slice(0, 2).map((concept) => (
                  <div className="key-term" key={concept.title}>
                    <strong>{concept.title}</strong>

                    <small>{concept.description}</small>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

/* Shared sidebar */
function ResourceSidebar({ navigate }) {
  return (
    <aside className="resource-sidebar">
      <div className="resource-brand">
        <div className="resource-logo">L</div>

        <div>
          <h2>LectaAI</h2>
          <span>ACADEMIC PORTAL</span>
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

/* Header */

function ResourceHeader() {
  return (
    <header className="resource-header">
      <input className="resource-search" placeholder="Search lectures..." />

      <div className="resource-header-icons">
        <span>♧</span>
        <span>?</span>
        <div className="resource-profile">A</div>
      </div>
    </header>
  );
}
