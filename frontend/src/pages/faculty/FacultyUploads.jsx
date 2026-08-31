import {
  AlertCircle,
  CheckCircle2,
  FileAudio,
  FileText,
  Languages,
  UploadCloud,
  X,
} from "lucide-react";

import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { subjects } from "../../data/subjects";

function FacultyUploads() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  /* =====================================================
     FORM STATE
  ===================================================== */

  const [lectureTitle, setLectureTitle] = useState("");

  const [subjectBatch, setSubjectBatch] = useState("");

  const [languageMix, setLanguageMix] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);

  const [error, setError] = useState("");

  const [isTranscribing, setIsTranscribing] = useState(false);

  /* =====================================================
     EXISTING SUBJECT + BATCH OPTIONS

     Subjects come from the existing subjects data.
     Batches use the confirmed frontend batches already
     shown in the existing LectAI UI.
  ===================================================== */

  const batchBySubjectId = {
    1: "Batch 2024-A",
    2: "Batch 2024-A",
    3: "Batch 2023-B",
    4: "Batch 2023-B",
    5: "Batch 2024-A",
  };

  const subjectBatchOptions = subjects.map((subject) => ({
    subjectId: subject.id,
    subjectName: subject.name,
    subjectCode: subject.code,
    batch: batchBySubjectId[String(subject.id)] || "Batch 2024-A",
  }));

  /* =====================================================
     LANGUAGE OPTIONS
  ===================================================== */

  const languageOptions = [
    "English",
    "Kannada",
    "English + Kannada",
    "English + Hindi",
    "Kannada + English",
    "Hindi + English",
  ];

  /* =====================================================
     FILE VALIDATION
  ===================================================== */

  const MAX_FILE_SIZE = 200 * 1024 * 1024;

  const allowedExtensions = [".mp3", ".wav", ".m4a"];

  const validateFile = (file) => {
    if (!file) {
      return false;
    }

    const lowerName = file.name.toLowerCase();

    const validExtension = allowedExtensions.some((extension) =>
      lowerName.endsWith(extension),
    );

    if (!validExtension) {
      setError(
        "Unsupported audio format. Please select an .mp3, .wav, or .m4a file.",
      );

      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("The selected file exceeds the maximum size of 200 MB.");

      return false;
    }

    setError("");

    return true;
  };

  /* =====================================================
     FILE SELECTION
  ===================================================== */

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!validateFile(file)) {
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    setSelectedFile(file);
  };

  /* =====================================================
     DRAG AND DROP
  ===================================================== */

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    if (!validateFile(file)) {
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  /* =====================================================
     REMOVE FILE
  ===================================================== */

  const removeFile = () => {
    setSelectedFile(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* =====================================================
     FILE SIZE FORMATTER
  ===================================================== */

  const formatFileSize = (bytes) => {
    if (!bytes) {
      return "0 MB";
    }

    const sizeInMB = bytes / (1024 * 1024);

    if (sizeInMB >= 1) {
      return `${sizeInMB.toFixed(2)} MB`;
    }

    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  };

  /* =====================================================
     FORM VALIDATION
  ===================================================== */

  const isFormComplete =
    lectureTitle.trim() &&
    subjectBatch &&
    languageMix &&
    selectedFile &&
    !isTranscribing;

  /* =====================================================
     CLEAR FORM
  ===================================================== */

  const clearForm = () => {
    setLectureTitle("");
    setSubjectBatch("");
    setLanguageMix("");
    setSelectedFile(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* =====================================================
     CANCEL
  ===================================================== */

  const handleCancel = () => {
    const hasEnteredData =
      lectureTitle.trim() || subjectBatch || languageMix || selectedFile;

    if (hasEnteredData) {
      clearForm();
      return;
    }

    navigate("/faculty/dashboard");
  };

  /* =====================================================
     START TRANSCRIPTION
  ===================================================== */

  const handleStartTranscription = (event) => {
    event.preventDefault();

    setError("");

    if (!lectureTitle.trim()) {
      setError("Please enter the lecture title.");
      return;
    }

    if (!subjectBatch) {
      setError("Please select a subject and batch.");
      return;
    }

    if (!languageMix) {
      setError("Please select the primary language mix.");
      return;
    }

    if (!selectedFile) {
      setError("Please select a lecture audio file.");
      return;
    }

    if (!validateFile(selectedFile)) {
      return;
    }

    setIsTranscribing(true);

    /*
     * FRONTEND-ONLY TRANSCRIPTION FLOW
     *
     * This keeps the existing demo-style processing flow.
     * Backend transcription can later replace this block.
     *
     * Generated content is NOT automatically published.
     * Faculty must review/edit it before publishing.
     */

    setTimeout(() => {
      setIsTranscribing(false);

      alert(
        "Lecture uploaded successfully. Transcription processing has started in demo mode. Generated content must be reviewed before publishing.",
      );

      clearForm();

      navigate("/faculty/dashboard");
    }, 1200);
  };

  /* =====================================================
     SELECTED SUBJECT INFORMATION
  ===================================================== */

  const selectedSubjectBatch = subjectBatchOptions.find(
    (item) => `${item.subjectId}|${item.batch}` === subjectBatch,
  );

  return (
    <div className="page">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <section>
        <p className="eyebrow">LECTURE PROCESSING</p>

        <h1
          style={{
            marginBottom: 8,
          }}
        >
          Upload Lecture
        </h1>

        <p
          className="muted"
          style={{
            margin: 0,
            maxWidth: 700,
            lineHeight: 1.65,
          }}
        >
          Upload a lecture recording to begin transcription and generate
          learning resources for faculty review.
        </p>
      </section>

      {/* =====================================================
          FORM
      ===================================================== */}

      <form
        className="card"
        onSubmit={handleStartTranscription}
        style={{
          marginTop: 24,
          padding: 26,
          maxWidth: 920,
        }}
      >
        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: 13,
              marginBottom: 22,
              borderRadius: 9,
              border: "1px solid #f4c7c7",
              background: "#fff4f4",
              color: "#a12626",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            <AlertCircle
              size={18}
              style={{
                flexShrink: 0,
                marginTop: 1,
              }}
            />

            <span>{error}</span>
          </div>
        )}

        {/* =================================================
            LECTURE TITLE
        ================================================= */}

        <div className="upload-form-field">
          <label
            htmlFor="faculty-upload-title"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontWeight: 600,
            }}
          >
            <FileText size={16} />
            Lecture Title
          </label>

          <input
            id="faculty-upload-title"
            type="text"
            value={lectureTitle}
            onChange={(event) => {
              setLectureTitle(event.target.value);
              setError("");
            }}
            placeholder="Enter lecture title"
            disabled={isTranscribing}
          />
        </div>

        {/* =================================================
            SUBJECT + LANGUAGE
        ================================================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 18,
            marginTop: 20,
          }}
        >
          {/* Subject + Batch */}

          <div className="upload-form-field">
            <label htmlFor="faculty-subject-batch">Subject and Batch</label>

            <select
              id="faculty-subject-batch"
              value={subjectBatch}
              onChange={(event) => {
                setSubjectBatch(event.target.value);
                setError("");
              }}
              disabled={isTranscribing}
            >
              <option value="">Select subject and batch</option>

              {subjectBatchOptions.map((item) => (
                <option
                  key={`${item.subjectId}-${item.batch}`}
                  value={`${item.subjectId}|${item.batch}`}
                >
                  {item.subjectName}
                  {item.subjectCode ? ` (${item.subjectCode})` : ""}
                  {" — "}
                  {item.batch}
                </option>
              ))}
            </select>
          </div>

          {/* Language */}

          <div className="upload-form-field">
            <label
              htmlFor="faculty-language-mix"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <Languages size={16} />
              Primary Language Mix
            </label>

            <select
              id="faculty-language-mix"
              value={languageMix}
              onChange={(event) => {
                setLanguageMix(event.target.value);
                setError("");
              }}
              disabled={isTranscribing}
            >
              <option value="">Select language mix</option>

              {languageOptions.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* =================================================
            SELECTED SUBJECT INFORMATION
        ================================================= */}

        {selectedSubjectBatch && (
          <div
            style={{
              marginTop: 14,
              padding: "10px 12px",
              borderRadius: 8,
              background: "#f7f9fc",
              color: "#607087",
              fontSize: 12,
            }}
          >
            Selected:{" "}
            <strong>
              {selectedSubjectBatch.subjectName} — {selectedSubjectBatch.batch}
            </strong>
          </div>
        )}

        {/* =================================================
            AUDIO FILE
        ================================================= */}

        <div
          className="upload-form-field"
          style={{
            marginTop: 24,
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              marginBottom: 10,
            }}
          >
            <FileAudio size={16} />
            Lecture Audio
          </label>

          {!selectedFile ? (
            <div
              className="upload-drop-zone"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => {
                if (!isTranscribing) {
                  fileInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (
                  !isTranscribing &&
                  (event.key === "Enter" || event.key === " ")
                ) {
                  event.preventDefault();

                  fileInputRef.current?.click();
                }
              }}
              style={{
                cursor: isTranscribing ? "not-allowed" : "pointer",
                padding: "38px 22px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  margin: "0 auto",
                  borderRadius: "50%",
                  background: "#eaf2ff",
                  color: "#1769aa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UploadCloud size={26} />
              </div>

              <h3
                style={{
                  marginTop: 15,
                  marginBottom: 6,
                }}
              >
                Drag and drop your lecture audio
              </h3>

              <p
                className="muted"
                style={{
                  margin: 0,
                  fontSize: 13,
                }}
              >
                or click to browse from your device
              </p>

              <p
                className="muted"
                style={{
                  marginTop: 12,
                  marginBottom: 0,
                  fontSize: 12,
                }}
              >
                Supported formats: .mp3, .wav, .m4a
              </p>

              <p
                className="muted"
                style={{
                  marginTop: 4,
                  marginBottom: 0,
                  fontSize: 12,
                }}
              >
                Maximum file size: 200 MB
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/x-m4a,audio/mp4"
                onChange={handleFileChange}
                disabled={isTranscribing}
                style={{
                  display: "none",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                border: "1px solid #e1e7ef",
                borderRadius: 10,
                padding: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
                background: "#ffffff",
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
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 9,
                    background: "#eaf2ff",
                    color: "#1769aa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <FileAudio size={21} />
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

                  <span
                    className="muted"
                    style={{
                      display: "block",
                      marginTop: 3,
                      fontSize: 12,
                    }}
                  >
                    {formatFileSize(selectedFile.size)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={removeFile}
                disabled={isTranscribing}
                aria-label="Remove selected file"
                title="Remove selected file"
                style={{
                  width: 34,
                  height: 34,
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: isTranscribing ? "not-allowed" : "pointer",
                  flexShrink: 0,
                }}
              >
                <X size={17} />
              </button>
            </div>
          )}
        </div>

        {/* =================================================
            PROCESSING INFORMATION
        ================================================= */}

        <div
          style={{
            marginTop: 24,
            padding: 16,
            borderRadius: 10,
            background: "#f5f9ff",
            border: "1px solid #d7e6f8",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 11,
            }}
          >
            <CheckCircle2
              size={19}
              style={{
                color: "#1769aa",
                flexShrink: 0,
                marginTop: 1,
              }}
            />

            <div>
              <strong
                style={{
                  fontSize: 13,
                }}
              >
                What happens after transcription starts?
              </strong>

              <p
                className="muted"
                style={{
                  margin: "6px 0 0",
                  fontSize: 12,
                  lineHeight: 1.65,
                }}
              >
                LectAI will process the recording and prepare the transcript and
                generated learning resources. The content will not be
                automatically published to students. Faculty must review and
                edit the generated transcript and learning materials before
                publishing or re-publishing the lecture.
              </p>
            </div>
          </div>
        </div>

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div
          style={{
            marginTop: 26,
            paddingTop: 20,
            borderTop: "1px solid #e7ebf0",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="secondary-action-button"
            onClick={handleCancel}
            disabled={isTranscribing}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="primary-action-button"
            disabled={!isFormComplete}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: isFormComplete ? 1 : 0.55,
              cursor: isFormComplete ? "pointer" : "not-allowed",
            }}
          >
            <UploadCloud size={17} />

            {isTranscribing
              ? "Starting Transcription..."
              : "Start Transcription"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default FacultyUploads;
