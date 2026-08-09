import { ArrowRight } from "lucide-react";

function SubjectCard({ subject, onView }) {
  const status = subject.progress >= 100 ? "Completed" : "In Progress";

  return (
    <article className="subject-card" role="button">
      <div className="subject-card-top">
        <div>
          <p className="subject-card-title">{subject.name}</p>
          {subject.code && <p className="subject-card-code">{subject.code}</p>}
          <p className="subject-card-meta">
            {subject.lectures ?? 0} lectures
            {typeof subject.completedLectures !== "undefined" && (
              <span> · {subject.completedLectures} completed</span>
            )}
          </p>
        </div>
        <div className="subject-card-right">
          <span className="subject-card-badge">{subject.progress ?? 0}%</span>
          <p className="subject-card-status">{status}</p>
        </div>
      </div>

      {subject.summary && (
        <p className="subject-card-summary">{subject.summary}</p>
      )}

      <div className="subject-progress">
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${Math.max(0, Math.min(100, subject.progress ?? 0))}%`,
            }}
          />
        </div>
      </div>

      <div className="subject-card-footer">
        <button type="button" className="text-button" onClick={onView}>
          View Subject
          <ArrowRight size={16} />
        </button>
      </div>
    </article>
  );
}

export default SubjectCard;
