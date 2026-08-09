import { ArrowLeft, CheckCircle, Clock, Mic, BarChart3 } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { subjects } from "../../data/subjects";
import { lectures } from "../../data/lectures";

function FacultyAnalytics() {
  const navigate = useNavigate();

  const { subjectId, lecturerId, lectureId } = useParams();

  /* =========================
     FIND SUBJECT
  ========================= */

  const subject = useMemo(() => {
    return subjects.find((item) => String(item.id) === String(subjectId));
  }, [subjectId]);

  /* =========================
     FIND SELECTED LECTURE
  ========================= */

  const lecture = useMemo(() => {
    return lectures.find((item) => String(item.id) === String(lectureId));
  }, [lectureId]);

  /* =========================
     LECTURER NAME
  ========================= */

  const lecturerName = lecture?.lecturer || "Dr. Ananya Sharma";

  /* =========================
     DEMO ANALYTICS DATA

     Each lecture has separate
     analytics.
  ========================= */

  const analytics = useMemo(() => {
    const id = String(lectureId);

    if (id === "1") {
      return {
        speakingRate: 142,
        clarity: 91,
        totalWords: 8426,
        status: "Complete",
        frequentWords: [
          { word: "software", count: 18 },
          { word: "system", count: 15 },
          { word: "design", count: 12 },
          { word: "development", count: 10 },
          { word: "architecture", count: 9 },
          { word: "testing", count: 8 },
          { word: "process", count: 7 },
          { word: "requirements", count: 6 },
        ],
      };
    }

    if (id === "2") {
      return {
        speakingRate: 136,
        clarity: 94,
        totalWords: 7982,
        status: "Complete",
        frequentWords: [
          { word: "development", count: 20 },
          { word: "system", count: 16 },
          { word: "process", count: 14 },
          { word: "testing", count: 11 },
          { word: "software", count: 10 },
          { word: "lifecycle", count: 9 },
          { word: "design", count: 8 },
          { word: "requirements", count: 7 },
        ],
      };
    }

    return {
      speakingRate: 140,
      clarity: 90,
      totalWords: 8000,
      status: "Complete",
      frequentWords: [
        { word: "software", count: 15 },
        { word: "system", count: 13 },
        { word: "design", count: 11 },
        { word: "development", count: 9 },
        { word: "process", count: 8 },
        { word: "testing", count: 7 },
      ],
    };
  }, [lectureId]);

  /* =========================
     SPEECH CLARITY CIRCLE
  ========================= */

  const clarityDegrees = analytics.clarity * 3.6;

  /* =========================
     STATUS ICON
  ========================= */

  const StatusIcon = analytics.status === "Complete" ? CheckCircle : Clock;

  return (
    <div className="page faculty-analytics">
      {/* =========================
          BACK
      ========================= */}

      <button
        type="button"
        className="back-button"
        onClick={() => navigate(`/faculty/subjects/${subjectId}`)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <ArrowLeft size={17} />
        Back to Lectures
      </button>

      {/* =========================
          HEADER
      ========================= */}

      <section
        style={{
          marginTop: 20,
        }}
      >
        <p className="eyebrow">LECTURER ANALYTICS</p>

        <h1>Lecturer Analytics</h1>

        <p
          className="muted"
          style={{
            marginTop: 6,
          }}
        >
          {subject?.name || "Subject"}
        </p>

        <div
          style={{
            marginTop: 14,
          }}
        >
          <strong>Lecturer: {lecturerName}</strong>

          <p
            className="muted"
            style={{
              margin: "5px 0 0",
            }}
          >
            Lecture: {lecture?.title || "Selected Lecture"}
          </p>
        </div>
      </section>

      {/* =========================
          ANALYTICS CARDS
      ========================= */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 16,
          marginTop: 28,
        }}
      >
        {/* Speaking Rate */}

        <div
          className="card"
          style={{
            padding: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Mic size={20} />

            <span className="muted">Speaking Rate</span>
          </div>

          <div
            style={{
              marginTop: 18,
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            {analytics.speakingRate}
            <span
              style={{
                fontSize: 15,
                fontWeight: 500,
                marginLeft: 5,
              }}
            >
              WPM
            </span>
          </div>
        </div>

        {/* Speech Clarity */}

        <div
          className="card"
          style={{
            padding: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <BarChart3 size={20} />

            <span className="muted">Speech Clarity</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 12,
            }}
          >
            <div
              style={{
                width: 82,
                height: 82,
                borderRadius: "50%",
                background: `conic-gradient(
                  #0b5cab ${clarityDegrees}deg,
                  #e6e9ef ${clarityDegrees}deg
                )`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: "50%",
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                {analytics.clarity}%
              </div>
            </div>
          </div>
        </div>

        {/* Total Words */}

        <div
          className="card"
          style={{
            padding: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Mic size={20} />

            <span className="muted">Total Words</span>
          </div>

          <div
            style={{
              marginTop: 18,
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            {analytics.totalWords.toLocaleString()}
          </div>
        </div>

        {/* Analysis Status */}

        <div
          className="card"
          style={{
            padding: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <StatusIcon size={20} />

            <span className="muted">Analysis Status</span>
          </div>

          <div
            style={{
              marginTop: 18,
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            {analytics.status}
          </div>
        </div>
      </section>

      {/* =========================
          MOST FREQUENTLY USED WORDS
      ========================= */}

      <section
        className="card"
        style={{
          marginTop: 24,
          padding: 24,
        }}
      >
        <div>
          <p className="eyebrow">WORD FREQUENCY</p>

          <h2
            style={{
              margin: "4px 0 0",
            }}
          >
            Most Frequently Used Words
          </h2>

          <p className="muted">
            Words repeated most often throughout this lecture.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 22,
          }}
        >
          {analytics.frequentWords.map((item) => (
            <div
              key={item.word}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.08)",
                background: "#f8fafc",
              }}
            >
              <strong>{item.word}</strong>

              <span
                className="muted"
                style={{
                  fontSize: 14,
                }}
              >
                ({item.count})
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* =========================
          LECTURE IDENTIFICATION
      ========================= */}

      <section
        style={{
          marginTop: 20,
          marginBottom: 20,
        }}
      >
        <p
          className="muted"
          style={{
            fontSize: 13,
          }}
        >
          Analytics shown specifically for: <strong>{subject?.name}</strong>
          {" → "}
          <strong>{lecturerName}</strong>
          {" → "}
          <strong>{lecture?.title}</strong>
        </p>
      </section>
    </div>
  );
}

export default FacultyAnalytics;
