import { useRef, useState } from "react";
import {
  ArrowLeft,
  UploadCloud,
  FileAudio,
  X,
  BookOpen,
  CalendarDays,
  FileText,
  CheckCircle,
  Music2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { subjects } from "../../data/subjects";

function FacultyUploadLecture() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("audio/")) {
      setError("Please select a valid audio file.");
      setSelectedFile(null);
      return;
    }

    setError("");
    setSelectedFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("audio/")) {
      setError("Please select a valid audio file.");
      return;
    }

    setError("");
    setSelectedFile(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const removeFile = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = (event) => {
    event.preventDefault();

    setError("");

    if (!selectedFile) {
      setError("Please select a lecture audio file.");
      return;
    }

    if (!subjectId) {
      setError("Please select a subject.");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a lecture title.");
      return;
    }

    if (!date) {
      setError("Please select the lecture date.");
      return;
    }

    setIsUploading(true);

    // Demo upload simulation
    setTimeout(() => {
      setIsUploading(false);

      alert("Lecture uploaded successfully in demo mode.");

      navigate("/faculty/uploads");
    }, 1000);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) {
      return "0 KB";
    }

    const sizeInMB = bytes / (1024 * 1024);

    if (sizeInMB >= 1) {
      return `${sizeInMB.toFixed(2)} MB`;
    }

    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  };

  return (
    <div className="faculty-upload-page">
      {/* =========================
          BACK BUTTON
      ========================= */}
      <button
        type="button"
        className="back-button"
        onClick={() => navigate(-1)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* =========================
          PAGE HEADER
      ========================= */}
      <section
        style={{
          marginTop: 20,
        }}
      >
        <p className="eyebrow">LECTURES</p>

        <h1>Upload Lecture</h1>

        <p className="muted">
          Upload a lecture recording and provide the information needed to
          process it.
        </p>
      </section>

      {/* =========================
          UPLOAD FORM
      ========================= */}
      <form
        className="upload-form-card"
        onSubmit={handleUpload}
        style={{
          marginTop: 24,
        }}
      >
        {/* =========================
            ERROR
        ========================= */}
        {error && (
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: 14,
              marginBottom: 20,
              borderRadius: 10,
              background: "#fff1f1",
              border: "1px solid #f0b5b5",
              color: "#a12626",
            }}
          >
            <X
              size={18}
              style={{
                marginTop: 1,
              }}
            />

            <span>{error}</span>
          </div>
        )}

        {/* =========================
            AUDIO UPLOAD
        ========================= */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#e8f1ff",
                color: "#1769aa",
                flexShrink: 0,
              }}
            >
              <Music2 size={21} />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginBottom: 2,
                }}
              >
                Lecture Audio
              </label>

              <p
                className="muted"
                style={{
                  margin: 0,
                  fontSize: 13,
                }}
              >
                Upload the audio recording of your lecture.
              </p>
            </div>
          </div>

          {!selectedFile ? (
            <div
              className="upload-drop-zone"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              style={{
                cursor: "pointer",
              }}
            >
              <div className="upload-icon">
                <Music2 size={30} />
              </div>

              <h3>Upload lecture audio</h3>

              <p className="muted">
                Drag and drop your audio file here or click to browse.
              </p>

              <p
                className="muted"
                style={{
                  fontSize: 13,
                  marginTop: 8,
                }}
              >
                Supported audio files only
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                style={{
                  display: "none",
                }}
              />
            </div>
          ) : (
            <div
              className="card"
              style={{
                padding: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  minWidth: 0,
                }}
              >
                <div className="upload-icon">
                  <FileAudio size={22} />
                </div>

                <div
                  style={{
                    minWidth: 0,
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {selectedFile.name}
                  </strong>

                  <span className="muted">
                    {formatFileSize(selectedFile.size)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={removeFile}
                title="Remove file"
                aria-label="Remove selected file"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: 6,
                }}
              >
                <X size={20} />
              </button>
            </div>
          )}
        </div>

        {/* =========================
            SUBJECT
        ========================= */}
        <div
          className="upload-form-field"
          style={{
            marginTop: 24,
          }}
        >
          <label
            htmlFor="subject"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            <BookOpen size={15} />
            Subject
          </label>

          <select
            id="subject"
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
          >
            <option value="">Select subject</option>

            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
                {subject.code ? ` (${subject.code})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* =========================
            LECTURE TITLE
        ========================= */}
        <div
          className="upload-form-field"
          style={{
            marginTop: 20,
          }}
        >
          <label
            htmlFor="lecture-title"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            <FileText size={15} />
            Lecture Title
          </label>

          <input
            id="lecture-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Enter lecture title"
          />
        </div>

        {/* =========================
            LECTURE DATE
        ========================= */}
        <div
          className="upload-form-field"
          style={{
            marginTop: 20,
          }}
        >
          <label
            htmlFor="lecture-date"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            <CalendarDays size={15} />
            Lecture Date
          </label>

          <input
            id="lecture-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>

        {/* =========================
            UPLOAD INFORMATION
        ========================= */}
        <div
          style={{
            marginTop: 24,
            padding: 16,
            borderRadius: 10,
            border: "1px solid var(--border-color, #e5e7eb)",
            background: "var(--surface-muted, #fafafa)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <CheckCircle size={18} />

            <div>
              <strong>What happens after upload?</strong>

              <p
                className="muted"
                style={{
                  margin: "5px 0 0",
                  lineHeight: 1.6,
                }}
              >
                Your lecture recording will be added to your uploads and can
                then be processed to generate learning resources.
              </p>
            </div>
          </div>
        </div>

        {/* =========================
            ACTIONS
        ========================= */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            marginTop: 28,
            paddingTop: 20,
            borderTop: "1px solid var(--border-color, #e5e7eb)",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="back-button"
            onClick={() => navigate("/faculty/uploads")}
            disabled={isUploading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="primary-action-button"
            disabled={isUploading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <UploadCloud size={18} />

            {isUploading ? "Uploading..." : "Upload Lecture"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default FacultyUploadLecture;
