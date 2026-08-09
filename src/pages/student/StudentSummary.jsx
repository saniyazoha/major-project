import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { lectureData } from "../data/lectureData";
import "../styles/LectureResources.css";

export default function SummaryPage() {
  const { lectureId } = useParams();
  const navigate = useNavigate();

  const lecture = lectureData[lectureId] || lectureData["lecture-04"];

  const downloadSummary = () => {
    const content =
      `${lecture.title}\n\nAI EXECUTIVE SUMMARY\n\n` +
      lecture.summary.map((item) => `• ${item}`).join("\n");

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
                <span>{lecture.lecturer}</span>
                <span>{lecture.duration} duration</span>
              </div>
            </div>

            <button className="primary-button" onClick={downloadSummary}>
              ↓ Download Summary
            </button>
          </div>

          <section className="summary-page-grid">
            <div>
              <div className="resource-card-large executive-summary">
                <h2>✦ AI Executive Summary</h2>

                <p>
                  This lecture introduces the core concepts covered during the
                  lecture, including machine learning models, optimization
                  techniques and gradient-based learning.
                </p>
              </div>

              <h2 className="section-heading">Key Takeaways</h2>

              <div className="takeaway-grid">
                {lecture.concepts.map((concept, index) => (
                  <div className="takeaway-card" key={concept.title}>
                    <small>Concept {index + 1}</small>

                    <h3>{concept.title}</h3>

                    <p>{concept.description}</p>
                  </div>
                ))}
              </div>

              <div className="resource-card-large outline-card">
                <h2>Structured Outline</h2>

                {lecture.summary.map((item, index) => (
                  <div className="outline-item" key={index}>
                    <span>{index + 1}</span>

                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside>
              <div className="resource-card-large summary-actions">
                <button className="primary-button" onClick={downloadSummary}>
                  ↓ Download PDF Notes
                </button>

                <button
                  className="action-button"
                  onClick={() =>
                    navigate(`/student/lectures/${lectureId}/flashcards`)
                  }
                >
                  ✦ Generate Flashcards
                </button>
              </div>
            </aside>
          </section>
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
