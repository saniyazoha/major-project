import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  Layers3,
  Mic2,
  NotebookText,
  Radio,
  Users,
} from "lucide-react";

import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { subjects } from "../../data/subjects";
import { lectures } from "../../data/lectures";

function FacultyAnalytics() {
  const navigate = useNavigate();

  const { subjectId, lecturerId, lectureId } = useParams();

  /* =====================================================
     SUBJECT
  ===================================================== */

  const subject = useMemo(() => {
    return subjects.find((item) => String(item.id) === String(subjectId));
  }, [subjectId]);

  /* =====================================================
     LECTURE
  ===================================================== */

  const lecture = useMemo(() => {
    return lectures.find((item) => String(item.id) === String(lectureId));
  }, [lectureId]);

  const lecturerName = lecture?.lecturer || "Dr. Ananya Sharma";

  /* =====================================================
     FRONTEND ANALYTICS DATA
  ===================================================== */

  const analytics = useMemo(() => {
    const id = String(lectureId);

    if (id === "1") {
      return {
        speakingRate: 142,
        clarity: 91,
        fillerRatio: 3.8,
        averageSpeakingRate: 145,
        totalWords: 8426,
        status: "Complete",

        speakingIntervals: [
          {
            time: "0–10 min",
            rate: 138,
          },
          {
            time: "10–20 min",
            rate: 145,
          },
          {
            time: "20–30 min",
            rate: 149,
          },
          {
            time: "30–40 min",
            rate: 141,
          },
          {
            time: "40–45 min",
            rate: 146,
          },
        ],

        fillerWords: [
          {
            word: "um",
            count: 12,
          },
          {
            word: "okay",
            count: 9,
          },
          {
            word: "so",
            count: 8,
          },
          {
            word: "actually",
            count: 5,
          },
        ],

        repeatedWords: [
          {
            word: "system",
            count: 15,
          },
          {
            word: "process",
            count: 12,
          },
          {
            word: "memory",
            count: 11,
          },
          {
            word: "management",
            count: 10,
          },
          {
            word: "operating",
            count: 9,
          },
        ],

        quizSubmissions: 38,
        enrolledStudents: 42,
        averageQuizScore: 78,
        quizCompletion: 90,

        learningMaterials: [
          {
            id: 1,
            title: "Complete Transcript",
            description: "Faculty-reviewed lecture transcript.",
            icon: FileText,
          },
          {
            id: 2,
            title: "Lecture Notes",
            description: "AI-generated notes prepared for review.",
            icon: NotebookText,
          },
          {
            id: 3,
            title: "Flashcards",
            description: "Generated revision cards for the lecture.",
            icon: Layers3,
          },
          {
            id: 4,
            title: "Quiz",
            description: "Generated quiz questions and answers.",
            icon: CheckCircle2,
          },
        ],
      };
    }

    return {
      speakingRate: 140,
      clarity: 90,
      fillerRatio: 4.2,
      averageSpeakingRate: 143,
      totalWords: 8000,
      status: "Complete",

      speakingIntervals: [
        {
          time: "0–10 min",
          rate: 136,
        },
        {
          time: "10–20 min",
          rate: 141,
        },
        {
          time: "20–30 min",
          rate: 146,
        },
        {
          time: "30–40 min",
          rate: 143,
        },
        {
          time: "40–50 min",
          rate: 149,
        },
      ],

      fillerWords: [
        {
          word: "um",
          count: 10,
        },
        {
          word: "so",
          count: 8,
        },
        {
          word: "okay",
          count: 6,
        },
        {
          word: "basically",
          count: 4,
        },
      ],

      repeatedWords: [
        {
          word: "software",
          count: 15,
        },
        {
          word: "system",
          count: 13,
        },
        {
          word: "design",
          count: 11,
        },
        {
          word: "development",
          count: 9,
        },
        {
          word: "process",
          count: 8,
        },
      ],

      quizSubmissions: 34,
      enrolledStudents: 40,
      averageQuizScore: 76,
      quizCompletion: 85,

      learningMaterials: [
        {
          id: 1,
          title: "Complete Transcript",
          description: "Faculty-reviewed lecture transcript.",
          icon: FileText,
        },
        {
          id: 2,
          title: "Lecture Notes",
          description: "AI-generated notes prepared for review.",
          icon: NotebookText,
        },
        {
          id: 3,
          title: "Flashcards",
          description: "Generated revision cards for the lecture.",
          icon: Layers3,
        },
        {
          id: 4,
          title: "Quiz",
          description: "Generated quiz questions and answers.",
          icon: CheckCircle2,
        },
      ],
    };
  }, [lectureId]);

  /* =====================================================
     CLARITY CIRCLE
  ===================================================== */

  const clarityDegrees = analytics.clarity * 3.6;

  /* =====================================================
     MAX RATE
  ===================================================== */

  const maxRate = Math.max(
    ...analytics.speakingIntervals.map((item) => item.rate),
  );

  /* =====================================================
     BACK
  ===================================================== */

  const handleBack = () => {
    if (subjectId && lecturerId && lectureId) {
      navigate(
        `/faculty/subjects/${subjectId}/lecturers/${lecturerId}/lectures/${lectureId}`,
      );

      return;
    }

    navigate("/faculty/subjects");
  };

  return (
    <div className="page">
      {/* =====================================================
          BACK
      ===================================================== */}

      <button type="button" className="back-button" onClick={handleBack}>
        <ArrowLeft size={16} />
        Back to Lecture
      </button>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section
        style={{
          marginTop: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p className="eyebrow">LECTURE ANALYTICS</p>

            <h1
              style={{
                marginTop: 6,
                marginBottom: 7,
                fontSize: 31,
              }}
            >
              Analytics
            </h1>

            <p
              className="muted"
              style={{
                margin: 0,
                fontSize: 13,
              }}
            >
              {subject?.name || "Subject"}
              {" • "}
              {lecture?.title || "Selected Lecture"}
            </p>

            <p
              className="muted"
              style={{
                marginTop: 5,
                fontSize: 13,
              }}
            >
              Lecturer: <strong>{lecturerName}</strong>
            </p>
          </div>

          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 11px",
              borderRadius: 999,
              background: "#e9f7ef",
              color: "#18794e",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <CheckCircle2 size={15} />
            Analysis Complete
          </span>
        </div>
      </section>

      {/* =====================================================
          MAIN METRICS
      ===================================================== */}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 16,
          marginTop: 26,
        }}
      >
        {/* Speaking Rate */}

        <div
          className="card"
          style={{
            padding: 20,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 10,
              background: "#eef4fb",
              color: "#173b6d",
            }}
          >
            <Mic2 size={20} />
          </div>

          <p
            className="muted"
            style={{
              marginTop: 15,
              marginBottom: 4,
              fontSize: 12,
            }}
          >
            Speaking Rate
          </p>

          <h2
            style={{
              margin: 0,
              fontSize: 27,
            }}
          >
            {analytics.speakingRate}
            <span
              style={{
                fontSize: 13,
                marginLeft: 5,
                fontWeight: 500,
                color: "#667085",
              }}
            >
              WPM
            </span>
          </h2>
        </div>

        {/* Clarity */}

        <div
          className="card"
          style={{
            padding: 20,
          }}
        >
          <p
            className="muted"
            style={{
              margin: 0,
              fontSize: 12,
            }}
          >
            Clarity Score
          </p>

          <div
            style={{
              marginTop: 10,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: "50%",
                background: `conic-gradient(
                  #1f6feb ${clarityDegrees}deg,
                  #e6ebf2 ${clarityDegrees}deg
                )`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#102a43",
                }}
              >
                {analytics.clarity}%
              </div>
            </div>
          </div>
        </div>

        {/* Filler Ratio */}

        <div
          className="card"
          style={{
            padding: 20,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 10,
              background: "#eef4fb",
              color: "#173b6d",
            }}
          >
            <BarChart3 size={20} />
          </div>

          <p
            className="muted"
            style={{
              marginTop: 15,
              marginBottom: 4,
              fontSize: 12,
            }}
          >
            Filler Ratio
          </p>

          <h2
            style={{
              margin: 0,
              fontSize: 27,
            }}
          >
            {analytics.fillerRatio}%
          </h2>
        </div>

        {/* Average Pace */}

        <div
          className="card"
          style={{
            padding: 20,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 10,
              background: "#eef4fb",
              color: "#173b6d",
            }}
          >
            <Clock3 size={20} />
          </div>

          <p
            className="muted"
            style={{
              marginTop: 15,
              marginBottom: 4,
              fontSize: 12,
            }}
          >
            Average Speaking Pace
          </p>

          <h2
            style={{
              margin: 0,
              fontSize: 27,
            }}
          >
            {analytics.averageSpeakingRate}
            <span
              style={{
                marginLeft: 5,
                fontSize: 13,
                color: "#667085",
                fontWeight: 500,
              }}
            >
              WPM
            </span>
          </h2>
        </div>
      </section>

      {/* =====================================================
          SPEAKING RATE INTERVALS
      ===================================================== */}

      <section
        className="card"
        style={{
          marginTop: 20,
          padding: 24,
        }}
      >
        <p className="eyebrow">SPEAKING RATE</p>

        <h2
          style={{
            marginTop: 5,
          }}
        >
          Speaking Rate by Interval
        </h2>

        <p
          className="muted"
          style={{
            marginTop: 5,
            fontSize: 12,
          }}
        >
          Average words per minute across different parts of the lecture.
        </p>

        <div
          style={{
            display: "grid",
            gap: 15,
            marginTop: 22,
          }}
        >
          {analytics.speakingIntervals.map((item) => {
            const width = (item.rate / maxRate) * 100;

            return (
              <div
                key={item.time}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr 70px",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: "#64748b",
                    fontSize: 12,
                  }}
                >
                  {item.time}
                </span>

                <div
                  style={{
                    height: 9,
                    borderRadius: 999,
                    overflow: "hidden",
                    background: "#e8edf4",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${width}%`,
                      borderRadius: 999,
                      background: "#1f6feb",
                    }}
                  />
                </div>

                <strong
                  style={{
                    fontSize: 12,
                    textAlign: "right",
                  }}
                >
                  {item.rate} WPM
                </strong>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================
          FILLER + REPEATED WORDS
      ===================================================== */}

      <section
        style={{
          marginTop: 20,
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 18,
        }}
      >
        {/* Fillers */}

        <div
          className="card"
          style={{
            padding: 24,
          }}
        >
          <p className="eyebrow">SPEECH PATTERNS</p>

          <h2
            style={{
              marginTop: 5,
              fontSize: 19,
            }}
          >
            Filler Words
          </h2>

          <div
            style={{
              display: "grid",
              gap: 10,
              marginTop: 18,
            }}
          >
            {analytics.fillerWords.map((item) => (
              <div
                key={item.word}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "11px 13px",
                  borderRadius: 8,
                  background: "#f7f9fc",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: "#475569",
                  }}
                >
                  “{item.word}”
                </span>

                <strong
                  style={{
                    fontSize: 12,
                  }}
                >
                  {item.count}
                </strong>
              </div>
            ))}
          </div>
        </div>

        {/* Repeated */}

        <div
          className="card"
          style={{
            padding: 24,
          }}
        >
          <p className="eyebrow">WORD FREQUENCY</p>

          <h2
            style={{
              marginTop: 5,
              fontSize: 19,
            }}
          >
            Repeated Words
          </h2>

          <div
            style={{
              display: "grid",
              gap: 10,
              marginTop: 18,
            }}
          >
            {analytics.repeatedWords.map((item) => (
              <div
                key={item.word}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 13px",
                  borderRadius: 8,
                  background: "#f7f9fc",
                }}
              >
                <span
                  style={{
                    color: "#475569",
                    fontSize: 13,
                  }}
                >
                  {item.word}
                </span>

                <strong
                  style={{
                    fontSize: 12,
                  }}
                >
                  {item.count}
                </strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          QUIZ PERFORMANCE
      ===================================================== */}

      <section
        className="card"
        style={{
          marginTop: 20,
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p className="eyebrow">STUDENT PERFORMANCE</p>

            <h2
              style={{
                marginTop: 5,
              }}
            >
              Quiz Performance
            </h2>
          </div>

          <button
            type="button"
            className="secondary-action-button"
            onClick={() => navigate("/faculty/student-progress")}
          >
            <Users size={16} />
            Student Progress
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 16,
            marginTop: 22,
          }}
        >
          <div
            style={{
              padding: 18,
              borderRadius: 10,
              background: "#f7f9fc",
            }}
          >
            <p
              className="muted"
              style={{
                margin: 0,
                fontSize: 12,
              }}
            >
              Quiz Submissions
            </p>

            <h2
              style={{
                marginTop: 7,
                marginBottom: 0,
              }}
            >
              {analytics.quizSubmissions}
              <span
                style={{
                  marginLeft: 4,
                  color: "#667085",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                / {analytics.enrolledStudents}
              </span>
            </h2>
          </div>

          <div
            style={{
              padding: 18,
              borderRadius: 10,
              background: "#f7f9fc",
            }}
          >
            <p
              className="muted"
              style={{
                margin: 0,
                fontSize: 12,
              }}
            >
              Average Quiz Score
            </p>

            <h2
              style={{
                marginTop: 7,
                marginBottom: 0,
              }}
            >
              {analytics.averageQuizScore}%
            </h2>
          </div>

          <div
            style={{
              padding: 18,
              borderRadius: 10,
              background: "#f7f9fc",
            }}
          >
            <p
              className="muted"
              style={{
                margin: 0,
                fontSize: 12,
              }}
            >
              Completion
            </p>

            <h2
              style={{
                marginTop: 7,
                marginBottom: 0,
              }}
            >
              {analytics.quizCompletion}%
            </h2>
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            height: 9,
            borderRadius: 999,
            background: "#e7edf5",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${analytics.quizCompletion}%`,
              height: "100%",
              borderRadius: 999,
              background: "#1f6feb",
            }}
          />
        </div>
      </section>

      {/* =====================================================
          LEARNING MATERIALS
      ===================================================== */}

      <section
        className="card"
        style={{
          marginTop: 20,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <p className="eyebrow">GENERATED MATERIALS</p>

        <h2
          style={{
            marginTop: 5,
          }}
        >
          Lecture Learning Materials
        </h2>

        <p
          className="muted"
          style={{
            marginTop: 5,
            fontSize: 12,
          }}
        >
          Review the generated learning resources before publishing them to
          students.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 14,
            marginTop: 20,
          }}
        >
          {analytics.learningMaterials.map((material) => {
            const Icon = material.icon;

            return (
              <div
                key={material.id}
                style={{
                  padding: 17,
                  border: "1px solid #e4e9f1",
                  borderRadius: 10,
                  background: "#ffffff",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#eef4fb",
                    color: "#173b6d",
                  }}
                >
                  <Icon size={18} />
                </div>

                <h3
                  style={{
                    marginTop: 14,
                    marginBottom: 0,
                    fontSize: 15,
                  }}
                >
                  {material.title}
                </h3>

                <p
                  className="muted"
                  style={{
                    marginTop: 6,
                    fontSize: 11,
                    lineHeight: 1.6,
                  }}
                >
                  {material.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default FacultyAnalytics;
