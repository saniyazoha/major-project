import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  PlayCircle,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { apiClient } from "../../api/client";

export default function SubjectLectures() {
  const { subjectId } = useParams();
  const navigate = useNavigate();

  const [subject, setSubject] = useState(null);
  const [batches, setBatches] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch subjects list to find current subject details
      const subjectsRes = await apiClient.get("/subjects");
      const subjectsList = Array.isArray(subjectsRes)
        ? subjectsRes
        : subjectsRes?.data || [];
      const currentSubject = subjectsList.find(
        (s) => String(s.id) === String(subjectId),
      );
      setSubject(currentSubject || null);

      if (!currentSubject) {
        setLoading(false);
        return;
      }

      // 2. Fetch enrolled batches for this subject
      const batchesRes = await apiClient.get(`/subjects/${subjectId}/batches`);
      const enrolledBatches = Array.isArray(batchesRes)
        ? batchesRes
        : batchesRes?.data || [];
      setBatches(enrolledBatches);

      if (enrolledBatches.length === 0) {
        setLectures([]);
        setLoading(false);
        return;
      }

      // 3. Fetch lectures for each enrolled batch
      const lecturePromises = enrolledBatches.map((b) =>
        apiClient.get(`/lectures?batch_id=${b.id}`),
      );
      const lectureResponses = await Promise.all(lecturePromises);

      // Combine lectures from all enrolled batches
      const allLectures = [];
      const seenIds = new Set();
      for (const res of lectureResponses) {
        const batchLectures = Array.isArray(res) ? res : res?.data || [];
        for (const lecture of batchLectures) {
          if (!seenIds.has(lecture.id)) {
            seenIds.add(lecture.id);
            allLectures.push(lecture);
          }
        }
      }

      // Render the lectures returned by the backend DIRECTLY
      setLectures(allLectures);
    } catch (err) {
      console.error("Failed to load subject lectures:", err);
      setError(
        err.message ||
          "Failed to load lectures. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subjectId) {
      fetchData();
    }
  }, [subjectId]);

  const formatDate = (isoString) => {
    if (!isoString) return "";
    try {
      return new Date(isoString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return null;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="page">
        <section className="details-page-header">
          <div>
            <p className="eyebrow">SUBJECT</p>
            <h1>Loading Subject...</h1>
          </div>
          <button
            className="secondary-button"
            onClick={() => navigate("/student/subjects")}
          >
            <ArrowLeft size={17} /> Back
          </button>
        </section>
        <div className="details-empty-state">
          <RefreshCw size={32} className="animate-spin" />
          <p>Loading lectures...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <section className="details-page-header">
          <div>
            <p className="eyebrow">SUBJECT</p>
            <h1>Error Loading Subject</h1>
            <p className="muted">{error}</p>
          </div>
          <button
            className="secondary-button"
            onClick={() => navigate("/student/subjects")}
          >
            <ArrowLeft size={17} /> Back
          </button>
        </section>
        <div className="details-empty-state">
          <AlertCircle size={38} />
          <h3>Failed to load lectures</h3>
          <p>{error}</p>
          <button
            type="button"
            className="secondary-action-button"
            onClick={fetchData}
          >
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">SUBJECT</p>
            <h1>Subject Not Found</h1>
            <p className="muted">The requested subject could not be found or you are not enrolled.</p>
          </div>

          <button
            className="secondary-button"
            onClick={() => navigate("/student/subjects")}
          >
            <ArrowLeft size={17} /> Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="details-page-header">
        <div>
          <p className="eyebrow">SUBJECT</p>
          <h1>{subject.name}</h1>
          <p className="muted">
            {subject.code ? `${subject.code} • ` : ""}View lectures and track
            your learning progress.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() => navigate("/student/subjects")}
        >
          <ArrowLeft size={17} />
          Back
        </button>
      </section>

      <section className="details-lectures-section">
        <div className="details-section-header">
          <div>
            <p className="eyebrow">LECTURES</p>
            <h2>Available Lectures</h2>
            <p className="muted">
              Select a lecture to view its learning materials.
            </p>
          </div>
        </div>

        {batches.length === 0 ? (
          <div className="details-empty-state">
            <BookOpen size={38} />
            <h3>No enrolled batches</h3>
            <p>You are not currently enrolled in any active batch for this subject.</p>
          </div>
        ) : lectures.length === 0 ? (
          <div className="details-empty-state">
            <BookOpen size={38} />
            <h3>No lectures available</h3>
            <p>
              Broadcast lectures for this subject will appear here when they are
              available.
            </p>
          </div>
        ) : (
          <div className="details-lecture-list">
            {lectures.map((lecture) => (
              <button
                type="button"
                className="details-lecture-card"
                key={lecture.id}
                onClick={() => navigate(`/student/lectures/${lecture.id}`)}
              >
                <div className="details-lecture-main">
                  <div className="details-lecture-icon">
                    <PlayCircle size={20} />
                  </div>

                  <div className="details-lecture-content">
                    <div className="details-lecture-top">
                      <span className="details-lecture-label">Lecture</span>

                      {lecture.status && (
                        <span className="details-status processed">
                          {lecture.status}
                        </span>
                      )}
                    </div>

                    <h3>{lecture.title}</h3>

                    <div className="details-lecture-meta">
                      {lecture.created_at && (
                        <span>{formatDate(lecture.created_at)}</span>
                      )}
                      {lecture.file_size && (
                        <>
                          <span className="meta-separator">•</span>
                          <span className="meta-with-icon">
                            <Clock size={14} />
                            {formatFileSize(lecture.file_size)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="details-lecture-arrow">
                  <ArrowRight size={18} />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
