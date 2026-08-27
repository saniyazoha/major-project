import { ArrowLeft, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { lectures } from "../../data/lectures";
import { users } from "../../data/users";
import { getDoubtsByLecture, updateDoubt } from "../../data/doubtsData";
import { useAuthContext } from "../../context/AuthContext";

export default function FacultyDoubtDetails() {
  const navigate = useNavigate();
  const { lectureId, doubtId } = useParams();
  const { user } = useAuthContext();
  const storedUsername = localStorage.getItem("username");
  const currentUser =
    user || users.find((item) => item.username === storedUsername) || null;

  const lecture = useMemo(
    () => lectures.find((item) => String(item.id) === String(lectureId)),
    [lectureId],
  );
  const doubt = lecture
    ? getDoubtsByLecture(lecture.id).find(
        (item) => String(item.id) === String(doubtId),
      )
    : null;
  const [reply, setReply] = useState("");
  const [savedDoubt, setSavedDoubt] = useState(doubt);

  const sendReply = () => {
    const cleanedReply = reply.trim();

    if (!savedDoubt || !cleanedReply) {
      return;
    }

    const updatedDoubt = updateDoubt(savedDoubt.id, {
      status: "answered",
      answer: cleanedReply,
      answeredBy:
        currentUser?.name ||
        currentUser?.username ||
        storedUsername ||
        "Faculty",
      answeredAt: new Date().toLocaleString(),
      studentUnread: true,
    });

    setSavedDoubt(updatedDoubt);
    setReply("");
  };

  if (!lecture || !savedDoubt) {
    return (
      <div className="page">
        <div className="card" style={{ padding: 30 }}>
          <h2>Doubt not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <button
        type="button"
        className="back-button"
        onClick={() => navigate(`/faculty/lectures/${lecture.id}/doubts`)}
      >
        <ArrowLeft size={16} />
        Back to Doubt Session
      </button>

      <section style={{ marginTop: 20 }}>
        <p className="eyebrow">DOUBT DETAILS</p>
        <h1 style={{ marginTop: 6, marginBottom: 0, fontSize: 31 }}>
          {lecture.title}
        </h1>
      </section>

      <section className="card" style={{ marginTop: 20, padding: 22 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p className="eyebrow">STUDENT</p>
            <h3 style={{ margin: "4px 0 0" }}>
              {savedDoubt.studentName || "Student"}
            </h3>
            <p className="muted" style={{ margin: "5px 0 0", fontSize: 12 }}>
              USN: {savedDoubt.usn || "Not available"}
            </p>
          </div>
          <div style={{ color: "#667085", fontSize: 12 }}>
            <strong style={{ color: "#344054" }}>Status:</strong>{" "}
            <span style={{ textTransform: "capitalize" }}>
              {savedDoubt.status || "pending"}
            </span>
            <br />
            <strong style={{ color: "#344054" }}>Submitted:</strong>{" "}
            {savedDoubt.createdAt}
          </div>
        </div>

        <div
          style={{
            marginTop: 20,
            paddingTop: 18,
            borderTop: "1px solid #e7ebf0",
          }}
        >
          <p className="eyebrow">QUESTION</p>
          <p style={{ margin: "8px 0 0", color: "#344054", lineHeight: 1.7 }}>
            {savedDoubt.question}
          </p>
        </div>
      </section>

      <section className="card" style={{ marginTop: 18, padding: 22 }}>
        <p className="eyebrow">CONVERSATION</p>
        <div
          style={{
            marginTop: 14,
            padding: "13px 15px",
            borderRadius: "14px 14px 14px 4px",
            background: "#eef2f7",
            color: "#334155",
            fontSize: 14,
            lineHeight: 1.7,
          }}
        >
          {savedDoubt.question}
        </div>

        {savedDoubt.answer && (
          <div
            style={{
              maxWidth: "76%",
              margin: "14px 0 0 auto",
              padding: "13px 15px",
              borderRadius: "14px 14px 4px 14px",
              background: "#2f76d2",
              color: "#ffffff",
              fontSize: 14,
              lineHeight: 1.7,
            }}
          >
            {savedDoubt.answer}
            <small style={{ display: "block", marginTop: 8, opacity: 0.8 }}>
              {savedDoubt.answeredBy} • {savedDoubt.answeredAt}
            </small>
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 20,
            paddingTop: 18,
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <input
            type="text"
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                sendReply();
              }
            }}
            placeholder="Write a reply..."
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
            className="primary-action-button"
            onClick={sendReply}
            disabled={!reply.trim()}
          >
            <Send size={15} />
            Send
          </button>
        </div>
      </section>
    </div>
  );
}
