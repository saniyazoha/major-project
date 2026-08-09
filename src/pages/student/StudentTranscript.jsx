import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Clock, User, FileText } from "lucide-react";

import { lectures } from "../../data/lectures";

function StudentTranscript() {
  const { id } = useParams();
  const navigate = useNavigate();

  const lecture = lectures.find((item) => item.id === Number(id));

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

        <div className="card student-resource-empty" style={{ marginTop: 20 }}>
          <h3>Lecture not found</h3>
          <p>The requested lecture does not exist.</p>
        </div>
      </div>
    );
  }

  const resourcePath = (resource = "") =>
    `/student/lectures/${lecture.id}${resource ? `/${resource}` : ""}`;

  return (
    <div className="page student-page">
      {/* Back */}
      <button
        className="back-button"
        onClick={() => navigate(`/student/lectures/${lecture.id}`)}
      >
        <ArrowLeft size={15} />
        Back to Lecture
      </button>

      {/* Lecture Information */}
      <section className="card student-lecture-info-card">
        <div className="student-lecture-info-main">
          <div className="student-lecture-large-icon">
            <BookOpen size={24} />
          </div>

          <div>
            <p className="eyebrow">{lecture.subject}</p>

            <h2>{lecture.title}</h2>

            <div className="student-lecture-info-meta">
              <span>
                <User size={14} />
                {lecture.lecturer}
              </span>

              <span>
                <Clock size={14} />
                {lecture.duration}
              </span>

              <span>{lecture.date}</span>
            </div>
          </div>
        </div>

        <span className={`lecture-status ${lecture.status.toLowerCase()}`}>
          {lecture.status}
        </span>
      </section>

      {/* Transcript Section */}
      <section className="student-transcript-section">
        <div className="student-material-header">
          <div>
            <p className="eyebrow">Lecture Resource</p>

            <h2>Transcript</h2>

            <p className="muted">
              Read the AI-generated transcript of this lecture.
            </p>
          </div>
        </div>

        {/* Resource Tabs */}
        <div className="student-material-tabs">
          <button
            type="button"
            className="student-material-tab"
            onClick={() => navigate(resourcePath())}
          >
            <BookOpen size={15} />
            Overview
          </button>

          <button type="button" className="student-material-tab active">
            <FileText size={15} />
            Transcript
          </button>

          <button
            type="button"
            className="student-material-tab"
            onClick={() => navigate(resourcePath("summary"))}
          >
            Summary
          </button>

          <button
            type="button"
            className="student-material-tab"
            onClick={() => navigate(resourcePath("key-concepts"))}
          >
            Key Concepts
          </button>

          <button
            type="button"
            className="student-material-tab"
            onClick={() => navigate(resourcePath("flashcards"))}
          >
            Flashcards
          </button>

          <button
            type="button"
            className="student-material-tab"
            onClick={() => navigate(resourcePath("quiz"))}
          >
            Quiz
          </button>

          <button
            type="button"
            className="student-material-tab"
            onClick={() => navigate(resourcePath("qa"))}
          >
            Q&A
          </button>
        </div>

        {/* Transcript Card */}
        <div className="card student-transcript-card">
          <div className="student-transcript-header">
            <div className="student-transcript-header-icon">
              <FileText size={20} />
            </div>

            <div>
              <p className="eyebrow">AI Generated Transcript</p>

              <h3>{lecture.title}</h3>

              <p className="muted">Full lecture transcript</p>
            </div>
          </div>

          {/* Transcript Content */}
          <div className="student-transcript-content">
            <div className="student-transcript-block">
              <div className="student-transcript-time">00:00</div>

              <div>
                <h4>Introduction</h4>

                <p>
                  Welcome to today's lecture on{" "}
                  <strong>{lecture.subject}</strong>. In this session, we will
                  introduce the important concepts related to{" "}
                  <strong>{lecture.title}</strong>.
                </p>
              </div>
            </div>

            <div className="student-transcript-block">
              <div className="student-transcript-time">05:20</div>

              <div>
                <h4>Main Topic</h4>

                <p>
                  The lecture explains the fundamental ideas and concepts that
                  students need to understand. These concepts form an important
                  foundation for further study in this subject.
                </p>
              </div>
            </div>

            <div className="student-transcript-block">
              <div className="student-transcript-time">18:45</div>

              <div>
                <h4>Key Discussion</h4>

                <p>
                  The lecturer discusses the major points covered in the session
                  and explains how these ideas can be applied when studying
                  related topics.
                </p>
              </div>
            </div>

            <div className="student-transcript-block">
              <div className="student-transcript-time">32:10</div>

              <div>
                <h4>Important Points</h4>

                <p>
                  Students should focus on understanding the relationships
                  between the concepts discussed during the lecture and remember
                  the key definitions and explanations.
                </p>
              </div>
            </div>

            <div className="student-transcript-block">
              <div className="student-transcript-time">42:30</div>

              <div>
                <h4>Conclusion</h4>

                <p>
                  To conclude, today's lecture provided an overview of the
                  important concepts. Students can use the summary, key
                  concepts, flashcards, and quiz resources for revision.
                </p>
              </div>
            </div>
          </div>

          {/* Backend Note */}
          <div className="student-transcript-note">
            This is sample transcript content for the frontend. The actual
            transcript will be populated from the processed lecture when the
            backend and AI pipeline are connected.
          </div>
        </div>
      </section>
    </div>
  );
}

export default StudentTranscript;
