import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";

import { apiClient } from "../../api/client";

export default function StudentNotes({ initialTab = "notes" }) {
  const { lectureId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [note, setNote] = useState(null);
  const [glossaryItems, setGlossaryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorStatus(null);

      const [noteData, glossaryData] = await Promise.all([
        apiClient.get(`/lectures/${lectureId}/notes`).catch((err) => {
          if (err?.status === 404) return null;
          throw err;
        }),
        apiClient.get(`/lectures/${lectureId}/glossary`).catch((err) => {
          if (err?.status === 404) return [];
          throw err;
        }),
      ]);

      setNote(noteData);
      setGlossaryItems(Array.isArray(glossaryData) ? glossaryData : glossaryData?.data || []);
    } catch (err) {
      console.error("Failed to load student notes/glossary:", err);
      setErrorStatus(err?.status || 500);
      setError(err?.message || "Failed to load notes and glossary.");
      setNote(null);
      setGlossaryItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lectureId) {
      fetchData();
    }
  }, [lectureId]);

  if (loading) {
    return (
      <div className="page student-page">
        <div className="card student-resource-empty" style={{ marginTop: 20 }}>
          <RefreshCw size={32} className="animate-spin" />
          <p>Loading {activeTab === "glossary" ? "glossary" : "notes"}...</p>
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
          <h3>Content unavailable</h3>
          <p>The requested content for this lecture is unavailable or has not been broadcast.</p>
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
          <h3>Failed to load content</h3>
          <p>{error}</p>
          <button
            type="button"
            className="secondary-action-button"
            onClick={fetchData}
            style={{ marginTop: 12 }}
          >
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const hasNotes = note && (note.markdown_content || note.summary_text);
  const hasGlossary = glossaryItems.length > 0;

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
            style={activeTab === "notes" ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab("notes")}
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

          <button
            type="button"
            style={tabStyle}
            onClick={() => navigate(`/student/lectures/${lectureId}/quiz`)}
          >
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
            style={activeTab === "glossary" ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab("glossary")}
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

      {activeTab === "notes" ? (
        !hasNotes ? (
          <div className="card student-resource-empty" style={{ marginTop: 18 }}>
            <h3>No notes generated for this lecture</h3>
            <p>Notes will appear here once generated for this lecture.</p>
          </div>
        ) : (
          <>
            {note?.summary_text && (
              <section
                className="card"
                style={{
                  marginTop: 18,
                  padding: "28px 30px",
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
                    margin: "14px 0 0",
                    color: "#627188",
                    fontSize: 15,
                    lineHeight: 1.8,
                  }}
                >
                  {note.summary_text}
                </p>
              </section>
            )}

            {note?.markdown_content && (
              <section
                className="card"
                style={{
                  marginTop: 18,
                  padding: "28px 30px",
                  borderRadius: 15,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    color: "#0f274f",
                    fontSize: 18,
                    lineHeight: 1.4,
                  }}
                >
                  Detailed Notes
                </h3>

                <div
                  style={{
                    margin: "14px 0 0",
                    color: "#627188",
                    fontSize: 14,
                    lineHeight: 1.8,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {note.markdown_content}
                </div>
              </section>
            )}
          </>
        )
      ) : (
        /* GLOSSARY TAB CONTENT */
        !hasGlossary ? (
          <div className="card student-resource-empty" style={{ marginTop: 18 }}>
            <h3>No glossary terms generated for this lecture</h3>
            <p>Glossary terms will appear here once generated for this lecture.</p>
          </div>
        ) : (
          <section
            className="card"
            style={{
              marginTop: 18,
              padding: "28px 30px",
              borderRadius: 15,
            }}
          >
            <h3
              style={{
                margin: 0,
                color: "#0f274f",
                fontSize: 18,
              }}
            >
              Glossary
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "18px 28px",
                marginTop: 20,
              }}
            >
              {glossaryItems.map((item, index) => (
                <div key={item.id || index}>
                  <strong
                    style={{
                      display: "block",
                      color: "#0f274f",
                      fontSize: 14,
                    }}
                  >
                    {item.term}
                  </strong>

                  <p
                    style={{
                      margin: "5px 0 0",
                      color: "#627188",
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}
                  >
                    {item.definition}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )
      )}
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
