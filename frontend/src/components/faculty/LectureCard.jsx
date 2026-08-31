import {
  BookOpen,
  CalendarDays,
  Clock,
  ChevronRight,
  CheckCircle,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { subjects } from "../../data/subjects";

function LectureCard({ lecture }) {
  const navigate = useNavigate();

  const subject = subjects.find(
    (item) => String(item.id) === String(lecture.subjectId),
  );

  const status = lecture.status || "Processed";

  const getStatusIcon = () => {
    if (status === "Processed") {
      return <CheckCircle size={15} />;
    }

    if (status === "Processing") {
      return <LoaderCircle size={15} />;
    }

    if (status === "Failed") {
      return <AlertCircle size={15} />;
    }

    return <CheckCircle size={15} />;
  };

  const getStatusClass = () => {
    if (status === "Processed") {
      return "lecture-status processed";
    }

    if (status === "Processing") {
      return "lecture-status processing";
    }

    if (status === "Failed") {
      return "lecture-status failed";
    }

    return "lecture-status";
  };

  const handleOpenLecture = () => {
    navigate(`/student/lectures/${lecture.id}`);
  };

  return (
    <article
      className="card lecture-card"
      onClick={handleOpenLecture}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpenLecture();
        }
      }}
    >
      {/* Top row */}
      <div className="lecture-card-top">
        <div className="lecture-card-icon">
          <BookOpen size={22} />
        </div>

        <span className={getStatusClass()}>
          {getStatusIcon()}
          {status}
        </span>
      </div>

      {/* Subject */}
      <p className="lecture-card-subject">{subject?.name || "Subject"}</p>

      {/* Title */}
      <h3 className="lecture-card-title">{lecture.title}</h3>

      {/* Lecture information */}
      <div className="lecture-card-meta">
        {lecture.date && (
          <span>
            <CalendarDays size={15} />
            {lecture.date}
          </span>
        )}

        {lecture.duration && (
          <span>
            <Clock size={15} />
            {lecture.duration}
          </span>
        )}

        {lecture.lecturer && <span>{lecture.lecturer}</span>}
      </div>

      {/* Footer */}
      <div className="lecture-card-footer">
        <span className="lecture-card-action">
          View lecture
          <ChevronRight size={16} />
        </span>
      </div>
    </article>
  );
}

export default LectureCard;
