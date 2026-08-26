import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { lectures, lectureData } from "../../data/lectures";
import { users } from "../../data/users";

import {
  addDoubt,
  getDoubtsByLecture,
  updateDoubt,
} from "../../data/doubtsData";
import { useAuthContext } from "../../context/AuthContext";

const ignoredQuestionWords = new Set([
  "about",
  "does",
  "from",
  "how",
  "that",
  "the",
  "this",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "with",
]);

function questionKeywords(question) {
  return String(question)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !ignoredQuestionWords.has(word));
}

function getLectureGroundedAnswer(question, selectedLectureData) {
  const keywords = questionKeywords(question);
  const sources = [];
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

  transcript.forEach((item) => {
    sources.push({
      text: item.text,
      searchableText: item.text,
    });
  });

  notes.forEach((item) => {
    const text = typeof item === "string" ? item : item.description;

    if (text) {
      sources.push({
        text,
        searchableText: text,
      });
    }
  });

  flashcards.forEach((item) => {
    sources.push({
      text: item.answer,
      searchableText: `${item.question} ${item.answer}`,
    });
  });

  quiz.forEach((item) => {
    const correctOption = item.options?.[item.answer];

    sources.push({
      text: correctOption
        ? `${item.question} Answer: ${correctOption}`
        : item.question,
      searchableText: `${item.question} ${item.options?.join(" ") || ""}`,
    });
  });

  const matches = sources
    .map((source, index) => {
      const sourceWords = new Set(questionKeywords(source.searchableText));
      const score = keywords.reduce(
        (total, keyword) => total + (sourceWords.has(keyword) ? 1 : 0),
        0,
      );

      return { ...source, score, index };
    })
    .filter((source) => source.score > 0)
    .sort(
      (first, second) =>
        second.score - first.score || first.index - second.index,
    );

  if (matches.length === 0) {
    return {
      text: "This lecture does not contain enough information to answer that question.",
      referenced: false,
    };
  }

  return {
    text: matches
      .slice(0, 2)
      .map((source) => source.text)
      .join(" "),
    referenced: true,
  };
}

function getAiAnswer() {
  return {
    text:
      "Your question has been recorded for the general AI assistant. " +
      "A connected AI service is required to generate a response.",
    referenced: false,
  };
}

export default function StudentQA() {
  const { lectureId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const storedUsername = localStorage.getItem("username");
  const currentUser =
    user || users.find((item) => item.username === storedUsername) || null;

  /* =========================================================
     SELECT THE EXACT LECTURE
  ========================================================= */

  const lecture = lectures.find(
    (item) => String(item.id) === String(lectureId),
  );

  /*
   * Load content ONLY for the selected lecture.
   *
   * No fallback to lecture-04 or any other lecture.
   */
  const selectedLectureData = lecture ? lectureData[lecture.dataId] : null;

  /*
   * Students should only access Ask for published lectures.
   */
  const isPublished = lecture?.broadcastStatus === "Broadcast";

  /* =========================================================
     EXISTING LECTURE-SPECIFIC DOUBTS
  ========================================================= */

  const existingDoubts = useMemo(() => {
    if (!lecture) {
      return [];
    }

    return getDoubtsByLecture(lecture.id);
  }, [lecture]);

  /* =========================================================
     CHAT MESSAGES
  ========================================================= */

  const initialMessages = useMemo(() => {
    if (!lecture) {
      return [];
    }

    const messages = [
      {
        id: "welcome",
        type: "ai",
        text: `Hello! I'm ready to answer questions about ${lecture.title}. What would you like to know?`,
        referenced: false,
      },
    ];

    existingDoubts.forEach((doubt) => {
      messages.push({
        id: `${doubt.id}-question`,
        type: "user",
        text: doubt.question,
        referenced: false,
      });

      if (doubt.answer) {
        messages.push({
          id: `${doubt.id}-answer`,
          type: "ai",
          text: doubt.answer,
          referenced: true,
          answeredBy: doubt.answeredBy || "",
          answeredAt: doubt.answeredAt || "",
        });
      }
    });

    return messages;
  }, [lecture, existingDoubts]);

  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState(null);

  const [messages, setMessages] = useState(initialMessages);

  useEffect(() => {
    setMessages(initialMessages);
    setQuestion("");
  }, [initialMessages, mode]);

  const hasUnreadReply = existingDoubts.some(
    (doubt) =>
      doubt.studentUnread &&
      String(doubt.studentId) ===
        String(currentUser?.id || currentUser?.username || storedUsername),
  );
  const [unreadReply, setUnreadReply] = useState(hasUnreadReply);

  useEffect(() => {
    if (mode !== "lecture" || !currentUser) {
      return;
    }

    existingDoubts.forEach((doubt) => {
      if (
        doubt.studentUnread &&
        String(doubt.studentId) ===
          String(currentUser.id || currentUser.username)
      ) {
        updateDoubt(doubt.id, { studentUnread: false });
      }
    });

    if (hasUnreadReply) {
      setUnreadReply(false);
    }
  }, [existingDoubts, hasUnreadReply, mode, currentUser]);

  /* =========================================================
     ASK QUESTION
  ========================================================= */

  const askQuestion = () => {
    const cleanedQuestion = question.trim();

    if (!cleanedQuestion) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      text: cleanedQuestion,
      referenced: false,
    };

    if (mode === "lecture") {
      const savedDoubt = addDoubt({
        subjectId: lecture.subjectId,
        lectureId: lecture.id,
        studentId:
          currentUser?.id ||
          currentUser?.username ||
          storedUsername ||
          "student",
        studentName:
          currentUser?.name ||
          currentUser?.username ||
          storedUsername ||
          "Student",
        usn: currentUser?.usn || currentUser?.username || storedUsername || "",
        question: cleanedQuestion,
        createdAt: new Date().toLocaleString(),
        status: "pending",
        answer: "",
        answeredBy: "",
        answeredAt: "",
        studentUnread: false,
      });

      setMessages((previous) => [
        ...previous,
        userMessage,
        {
          id: `${savedDoubt.id}-pending`,
          type: "ai",
          text: "Your doubt has been sent to the faculty for this lecture.",
          referenced: false,
        },
      ]);
    } else {
      setMessages((previous) => [
        ...previous,
        userMessage,
        {
          id: `ai-${Date.now()}`,
          type: "ai",
          ...getAiAnswer(cleanedQuestion),
        },
      ]);
    }

    setQuestion("");
  };

  /* =========================================================
     VALIDATION
  ========================================================= */

  if (!lecture) {
    return (
      <div className="page student-page">
        <div
          className="card student-resource-empty"
          style={{
            marginTop: 20,
          }}
        >
          <h3>Lecture not found</h3>

          <p>The requested lecture does not exist.</p>
        </div>
      </div>
    );
  }

  if (!isPublished) {
    return (
      <div className="page student-page">
        <div
          className="card student-resource-empty"
          style={{
            marginTop: 20,
          }}
        >
          <h3>Lecture not available</h3>

          <p>This lecture has not been published to students yet.</p>
        </div>
      </div>
    );
  }

  if (!selectedLectureData) {
    return (
      <div className="page student-page">
        <div
          className="card student-resource-empty"
          style={{
            marginTop: 20,
          }}
        >
          <h3>Ask unavailable</h3>

          <p>Published lecture content could not be found for this lecture.</p>
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
      {/* =====================================================
          RESOURCE TABS
      ===================================================== */}

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

          <button
            type="button"
            style={tabStyle}
            onClick={() => navigate(`/student/lectures/${lecture.id}/quiz`)}
          >
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

          <button type="button" style={activeTabStyle}>
            Ask
          </button>
        </div>
      </section>

      {/* =====================================================
          ASK HEADER
      ===================================================== */}

      <section
        style={{
          marginTop: 24,
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#627188",
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {lecture.subjectCode}
        </p>

        <h1
          style={{
            margin: "7px 0 0",
            color: "#0f274f",
            fontSize: 28,
            lineHeight: 1.3,
          }}
        >
          Ask about {lecture.title}
        </h1>

        <p
          style={{
            margin: "7px 0 0",
            color: "#627188",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          Answers and doubts on this page are linked only to this lecture.
        </p>
      </section>

      {/* =====================================================
          CHAT AREA
      ===================================================== */}

      <section
        className="card"
        style={{
          marginTop: 20,
          padding: "24px 24px 18px",
          borderRadius: 15,
        }}
      >
        {!mode ? (
          <div
            style={{
              minHeight: 330,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#0f274f",
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              Choose how you want to ask
            </p>

            <p
              style={{
                margin: "8px 0 0",
                color: "#627188",
                fontSize: 14,
              }}
            >
              Select a mode before entering your question.
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 10,
                marginTop: 22,
              }}
            >
              {unreadReply && (
                <p
                  style={{
                    margin: "0 0 14px",
                    color: "#18794e",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  New reply
                </p>
              )}

              <button
                type="button"
                className="primary-action-button"
                onClick={() => setMode("ai")}
              >
                Ask AI
              </button>

              <button
                type="button"
                onClick={() => setMode("lecture")}
                style={{
                  ...tabStyle,
                  minHeight: 42,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#53657d",
                }}
              >
                Ask Lecture
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                minHeight: 36,
              }}
            >
              <span
                style={{
                  color: "#52647d",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Mode: {mode === "lecture" ? "Ask Lecture" : "Ask AI"}
              </span>

              <button
                type="button"
                onClick={() => setMode(null)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#2f76d2",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Change mode
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gap: 18,
                minHeight: 294,
              }}
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    display: "flex",
                    justifyContent:
                      message.type === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "76%",
                      padding: "13px 15px",
                      borderRadius:
                        message.type === "user"
                          ? "14px 14px 4px 14px"
                          : "14px 14px 14px 4px",
                      background:
                        message.type === "user" ? "#2f76d2" : "#eef2f7",
                      color: message.type === "user" ? "#ffffff" : "#334155",
                      fontSize: 14,
                      lineHeight: 1.7,
                    }}
                  >
                    <p style={{ margin: 0 }}>{message.text}</p>

                    {message.type === "ai" && message.referenced && (
                      <small
                        style={{
                          display: "block",
                          marginTop: 9,
                          color: "#64748b",
                          fontSize: 10,
                        }}
                      >
                        Referenced from this lecture
                        {message.answeredBy
                          ? ` • Answered by ${message.answeredBy}${
                              message.answeredAt
                                ? ` • ${message.answeredAt}`
                                : ""
                            }`
                          : ""}
                      </small>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 22,
                paddingTop: 18,
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <input
                type="text"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    askQuestion();
                  }
                }}
                placeholder="Ask a question about this lecture..."
                style={{
                  flex: 1,
                  minHeight: 44,
                  padding: "10px 13px",
                  border: "1px solid #dce1e8",
                  borderRadius: 9,
                  outline: "none",
                  color: "#334155",
                  background: "#ffffff",
                  fontSize: 14,
                }}
              />

              <button
                type="button"
                onClick={askQuestion}
                disabled={!question.trim()}
                style={{
                  minWidth: 76,
                  minHeight: 44,
                  padding: "9px 16px",
                  border: "none",
                  borderRadius: 9,
                  background: "#2f76d2",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: question.trim() ? "pointer" : "not-allowed",
                  opacity: question.trim() ? 1 : 0.55,
                }}
              >
                Ask
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

/* =========================================================
   TAB STYLES
========================================================= */

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
