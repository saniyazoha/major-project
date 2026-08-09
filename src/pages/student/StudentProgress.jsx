import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Layers3,
  ChevronRight,
} from "lucide-react";

import { lectures } from "../../data/lectures";

function StudentProgress() {
  const navigate = useNavigate();

  const totalLectures = lectures.length;

  const completedLectures = lectures.filter(
    (lecture) => lecture.completed === true,
  ).length;

  const progress =
    totalLectures > 0
      ? Math.round((completedLectures / totalLectures) * 100)
      : 0;

  /*
   * Subject-wise progress
   *
   * This is calculated from the current lecture data.
   * Later, when backend progress is connected, this section
   * can use real student completion data.
   */
  const subjectProgress = useMemo(() => {
    const grouped = {};

    lectures.forEach((lecture) => {
      const subject = lecture.subject || "Unknown Subject";

      if (!grouped[subject]) {
        grouped[subject] = {
          subject,
          total: 0,
          completed: 0,
        };
      }

      grouped[subject].total += 1;

      if (lecture.completed === true) {
        grouped[subject].completed += 1;
      }
    });

    return Object.values(grouped).map((item) => ({
      ...item,
      percentage:
        item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0,
    }));
  }, []);

  /*
   * Placeholder values until quiz / flashcard activity
   * is connected to the backend.
   */
  const quizScore = 88;
  const flashcardsMastered = 450;

  /*
   * Generate a simple activity grid.
   * Later this can be replaced with actual daily activity.
   */
  const activityCells = Array.from({ length: 84 }, (_, index) => {
    const value = (index * 7 + 3) % 5;

    return {
      id: index,
      level: value,
    };
  });

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="page student-page student-progress-page">
      {/* =========================================
          HEADER
      ========================================= */}

      <div className="page-header">
        <div>
          <p className="eyebrow">ACADEMIC ANALYTICS</p>

          <h1>Study Progress</h1>

          <p className="muted">
            Track your academic performance and lecture completion.
          </p>
        </div>

        <button
          className="back-button"
          onClick={() => navigate("/student/dashboard")}
        >
          <ArrowLeft size={15} />
          Dashboard
        </button>
      </div>

      {/* =========================================
          MAIN PROGRESS AREA
      ========================================= */}

      <section className="student-progress-overview">
        {/* OVERALL PROGRESS */}

        <div className="card student-overall-progress-card">
          <div className="student-progress-card-title">
            <h3>Overall Progress</h3>
          </div>

          <div className="student-progress-circle-wrapper">
            <svg
              className="student-progress-circle"
              width="150"
              height="150"
              viewBox="0 0 150 150"
            >
              <circle
                cx="75"
                cy="75"
                r={radius}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="10"
              />

              <circle
                cx="75"
                cy="75"
                r={radius}
                fill="none"
                stroke="#0879b9"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={progressOffset}
                transform="rotate(-90 75 75)"
              />
            </svg>

            <div className="student-progress-circle-content">
              <strong>{progress}%</strong>
              <span>COMPLETED</span>
            </div>
          </div>

          <div className="student-progress-overall-stats">
            <div>
              <strong>{totalLectures}</strong>
              <span>LECTURES</span>
            </div>

            <div>
              <strong>8.5h</strong>
              <span>STUDIED</span>
            </div>
          </div>
        </div>

        {/* SUBJECT PROGRESS */}

        <div className="card student-subject-progress-card">
          <div className="student-progress-card-heading">
            <h3>Subject Progress</h3>

            <button
              className="student-progress-details-button"
              onClick={() => navigate("/student/subjects")}
            >
              View Details
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="student-subject-progress-list">
            {subjectProgress.length === 0 ? (
              <div className="student-progress-no-data">
                <BookOpen size={22} />
                <p>No subject progress available.</p>
              </div>
            ) : (
              subjectProgress.map((subject) => (
                <div
                  className="student-subject-progress-item"
                  key={subject.subject}
                >
                  <div className="student-subject-progress-item-top">
                    <div>
                      <strong>{subject.subject}</strong>

                      <span>
                        {subject.completed}/{subject.total} Lectures
                      </span>
                    </div>

                    <b>{subject.percentage}%</b>
                  </div>

                  <div className="student-subject-progress-track">
                    <div
                      className="student-subject-progress-value"
                      style={{
                        width: `${subject.percentage}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* =========================================
          STATISTICS
      ========================================= */}

      <section className="student-progress-statistics">
        {/* Lectures */}

        <div className="card student-progress-stat">
          <div className="student-progress-stat-icon">
            <CheckCircle2 size={19} />
          </div>

          <div>
            <span>LECTURES COMPLETED</span>

            <strong>
              {completedLectures}
              <small>/ {totalLectures}</small>
            </strong>
          </div>
        </div>

        {/* Quiz */}

        <div className="card student-progress-stat">
          <div className="student-progress-stat-icon">
            <ClipboardCheck size={19} />
          </div>

          <div>
            <span>AVG. QUIZ SCORE</span>

            <strong>{quizScore}%</strong>
          </div>
        </div>

        {/* Flashcards */}

        <div className="card student-progress-stat">
          <div className="student-progress-stat-icon">
            <Layers3 size={19} />
          </div>

          <div>
            <span>FLASHCARDS MASTERED</span>

            <strong>{flashcardsMastered}</strong>
          </div>
        </div>
      </section>

      {/* =========================================
          STUDY ACTIVITY
      ========================================= */}

      <section className="card student-study-activity">
        <div className="student-study-activity-header">
          <div>
            <h3>Study Activity</h3>
          </div>

          <div className="student-study-activity-legend">
            <span>Less</span>

            <i className="activity-level level-0" />
            <i className="activity-level level-1" />
            <i className="activity-level level-2" />
            <i className="activity-level level-3" />
            <i className="activity-level level-4" />

            <span>More</span>
          </div>
        </div>

        <div className="student-study-activity-grid">
          {activityCells.map((cell) => (
            <div
              key={cell.id}
              className={`activity-cell level-${cell.level}`}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default StudentProgress;
