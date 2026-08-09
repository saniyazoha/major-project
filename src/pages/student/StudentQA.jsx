import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Send, Sparkles, User } from "lucide-react";
import { lectures } from "../../data/lectures";

function StudentQA() {
  const { id } = useParams();
  const navigate = useNavigate();

  const lecture = lectures.find((item) => item.id === Number(id));

  const [question, setQuestion] = useState("");

  const [messages, setMessages] = useState([
    {
      type: "ai",
      text: `Hello! I'm ready to answer questions about ${lecture?.title || "this lecture"}. What would you like to know?`,
    },
    {
      type: "user",
      text: "Can you explain the main concepts covered in this lecture?",
    },
    {
      type: "ai",
      text: "Based on the lecture content, the main concepts are introduced through the explanations and examples discussed during the session. Review the transcript and summary for the complete context.",
      reference: "Referenced from this lecture's transcript",
    },
  ]);

  if (!lecture) {
    return (
      <div className="page student-page">
        <button
          className="back-button"
          onClick={() => navigate("/student/subjects")}
        >
          <ArrowLeft size={15} />
          Back to Subjects
        </button>

        <div className="card student-resource-empty">
          <h3>Lecture not found</h3>
          <p>The requested lecture does not exist.</p>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) return;

    setMessages((previous) => [
      ...previous,
      {
        type: "user",
        text: trimmedQuestion,
      },
      {
        type: "ai",
        text: "I can answer questions based on this lecture's available learning content. AI-generated responses will be connected to the lecture transcript when the backend AI service is integrated.",
        reference: "Based on this lecture's content",
      },
    ]);

    setQuestion("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="page student-page student-qa-page">
      {/* Back */}
      <button
        className="back-button"
        onClick={() => navigate(`/student/lectures/${lecture.id}`)}
      >
        <ArrowLeft size={15} />
        Back to Lecture
      </button>

      {/* Lecture Header */}
      <section className="student-qa-header">
        <div className="student-qa-header-main">
          <div className="student-qa-header-icon">
            <BookOpen size={20} />
          </div>

          <div>
            <p className="eyebrow">{lecture.subject}</p>

            <h1>{lecture.title} Q&A</h1>

            <p className="muted">
              Ask questions about this lecture and get answers based on its
              learning content.
            </p>
          </div>
        </div>
      </section>

      {/* Chat */}
      <section className="student-qa-chat card">
        <div className="student-qa-chat-notice">
          <Sparkles size={14} />
          Answers are based strictly on this lecture's content.
        </div>

        <div className="student-qa-messages">
          {messages.map((message, index) => (
            <div
              className={`student-chat-row ${
                message.type === "user"
                  ? "student-chat-row-user"
                  : "student-chat-row-ai"
              }`}
              key={index}
            >
              {message.type === "ai" && (
                <div className="student-chat-avatar ai-avatar">
                  <Sparkles size={15} />
                </div>
              )}

              <div
                className={`student-chat-bubble ${
                  message.type === "user"
                    ? "student-chat-user"
                    : "student-chat-ai"
                }`}
              >
                <p>{message.text}</p>

                {message.reference && (
                  <div className="student-chat-reference">
                    <BookOpen size={12} />
                    {message.reference}
                  </div>
                )}
              </div>

              {message.type === "user" && (
                <div className="student-chat-avatar user-avatar">
                  <User size={15} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Question Input */}
        <div className="student-qa-input-area">
          <div className="student-qa-input">
            <input
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about this lecture..."
            />

            <button
              type="button"
              className="student-qa-send"
              onClick={handleSend}
              disabled={!question.trim()}
              aria-label="Send question"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default StudentQA;
