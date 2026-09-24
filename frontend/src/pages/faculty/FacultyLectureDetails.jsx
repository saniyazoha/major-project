import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  NotebookText,
  Layers3,
  CircleHelp,
  BarChart3,
  Users,
  Radio,
  RefreshCw,
  Pencil,
  Save,
  X,
  CheckCircle,
  Plus,
  Trash2,
  MessageCircleQuestion,
  Sparkles,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../../api/client";

import { lectures } from "../../data/lectures";
import { subjects } from "../../data/subjects";

function formatSecondsToTime(seconds) {
  if (typeof seconds !== "number" || isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const mm = String(mins).padStart(2, "0");
  const ss = String(secs).padStart(2, "0");
  return `${mm}:${ss}`;
}

function getCorrectOptionIndex(options, correctAnswerStr) {
  if (!options || !Array.isArray(options)) return 0;
  if (typeof correctAnswerStr === "number") return correctAnswerStr;
  if (!correctAnswerStr) return 0;

  const str = String(correctAnswerStr).trim();
  const idx = options.findIndex(
    (opt) => String(opt).trim().toLowerCase() === str.toLowerCase()
  );
  if (idx !== -1) return idx;

  const num = parseInt(str, 10);
  if (!isNaN(num) && num >= 0 && num < options.length) return num;

  if (str.length === 1) {
    const charCode = str.toUpperCase().charCodeAt(0) - 65;
    if (charCode >= 0 && charCode < options.length) return charCode;
  }

  return 0;
}

function parseTranscriptToSegments(transcript) {
  if (!transcript) return [];

  const primaryText = transcript.corrected_text || transcript.raw_text || "";

  let segments = [];
  if (transcript.segment_timestamps_json) {
    try {
      const parsed = JSON.parse(transcript.segment_timestamps_json);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (transcript.corrected_text) {
          const lines = transcript.corrected_text
            .split(/\n\n|\n/)
            .map((s) => s.trim())
            .filter(Boolean);

          if (lines.length === parsed.length) {
            segments = parsed.map((seg, idx) => ({
              id: idx + 1,
              time: formatSecondsToTime(seg.start || 0),
              text: lines[idx],
              highlighted: false,
            }));
          } else if (lines.length > 1) {
            segments = lines.map((line, idx) => ({
              id: idx + 1,
              time: formatSecondsToTime(idx * 30),
              text: line,
              highlighted: false,
            }));
          } else {
            segments = parsed.map((seg, idx) => ({
              id: idx + 1,
              time: formatSecondsToTime(seg.start || 0),
              text: seg.text || "",
              highlighted: false,
            }));
            if (segments.length === 1 && primaryText) {
              segments[0].text = primaryText;
            }
          }
        } else {
          segments = parsed.map((seg, idx) => ({
            id: idx + 1,
            time: formatSecondsToTime(seg.start || 0),
            text: seg.text || "",
            highlighted: false,
          }));
        }
      }
    } catch (e) {
      // ignore JSON parse error, fallback to text splitting
    }
  }

  if (segments.length === 0 && primaryText) {
    const paragraphs = primaryText
      .split(/\n\n|\n/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (paragraphs.length > 0) {
      segments = paragraphs.map((p, idx) => ({
        id: idx + 1,
        time: formatSecondsToTime(idx * 30),
        text: p,
        highlighted: false,
      }));
    } else {
      segments = [
        {
          id: 1,
          time: "00:00",
          text: primaryText,
          highlighted: false,
        },
      ];
    }
  }

  return segments;
}

function FacultyLectureDetails() {
  const navigate = useNavigate();

  const { subjectId, lecturerId, lectureId } = useParams();

  const [activeTab, setActiveTab] = useState("transcript");

  const [realBackendLecture, setRealBackendLecture] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (lectureId) {
      apiClient
        .get(`/lectures/${lectureId}`)
        .then((data) => {
          if (isMounted && data) {
            setRealBackendLecture(data);
          }
        })
        .catch(() => {
          // Ignore fetch error, fallback to mock data
        });
    }
    return () => {
      isMounted = false;
    };
  }, [lectureId]);

  /* =====================================================
     RESOLVE LECTURE
  ===================================================== */

  const lecture = useMemo(() => {
    if (realBackendLecture) {
      const formattedDate = realBackendLecture.created_at
        ? new Date(realBackendLecture.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "Recently";

      const rawStatus = (realBackendLecture.status || "uploaded").toLowerCase();
      let displayStatus = "Uploaded";
      if (rawStatus === "broadcast") displayStatus = "Broadcast";
      else if (rawStatus === "processing") displayStatus = "Processing";
      else if (rawStatus === "draft") displayStatus = "Draft";

      return {
        id: realBackendLecture.id,
        subjectId: realBackendLecture.subject_id,
        batchId: realBackendLecture.batch_id,
        title: realBackendLecture.title,
        status: displayStatus,
        rawStatus,
        date: formattedDate,
        duration: realBackendLecture.file_size
          ? `${(realBackendLecture.file_size / (1024 * 1024)).toFixed(1)} MB`
          : "45 mins",
        lecturer: "Faculty",
        lecturerId: "faculty",
      };
    }

    if (lectureId) {
      return lectures.find((item) => String(item.id) === String(lectureId));
    }

    if (subjectId && lecturerId) {
      return lectures.find((item) => {
        const sameSubject = String(item.subjectId) === String(subjectId);

        const lectureLecturer = String(
          item.lecturerId || item.lecturer || "",
        ).toLowerCase();

        const selectedLecturer = String(lecturerId).toLowerCase();

        return (
          sameSubject &&
          (lectureLecturer === selectedLecturer ||
            lectureLecturer.includes(selectedLecturer) ||
            selectedLecturer.includes(lectureLecturer))
        );
      });
    }

    return null;
  }, [realBackendLecture, lectureId, lecturerId, subjectId]);

  /* =====================================================
     RESOLVE SUBJECT
  ===================================================== */

  const subject = useMemo(() => {
    const resolvedSubjectId = subjectId || lecture?.subjectId;

    if (resolvedSubjectId) {
      const byId = subjects.find(
        (item) => String(item.id) === String(resolvedSubjectId),
      );

      if (byId) {
        return byId;
      }
    }

    if (lecture?.subject) {
      return subjects.find(
        (item) => item.name?.toLowerCase() === lecture.subject?.toLowerCase(),
      );
    }

    return null;
  }, [lecture, subjectId]);

  /* =====================================================
     PUBLICATION STATE (REAL BACKEND INTEGRATION - B3.2)
  ===================================================== */

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");

  const rawLectureStatus = (realBackendLecture?.status || "uploaded").toLowerCase();

  const publicationStatus = useMemo(() => {
    if (rawLectureStatus === "broadcast") return "Broadcast";
    if (rawLectureStatus === "draft") return "Draft (Ready to Broadcast)";
    if (rawLectureStatus === "processing") return "Processing";
    if (rawLectureStatus === "generation_failed") return "Generation Failed";
    return "Not Published";
  }, [rawLectureStatus]);

  const handleBroadcastLecture = async () => {
    if (!lectureId || isPublishing) return;

    if (rawLectureStatus === "broadcast") {
      setPublishMessage("Lecture is already broadcasted to enrolled students.");
      return;
    }

    if (rawLectureStatus !== "draft") {
      setPublishMessage("Content generation must be completed before broadcasting to students.");
      return;
    }

    setIsPublishing(true);
    setPublishMessage("");

    try {
      const updatedLecture = await apiClient.post(`/lectures/${lectureId}/broadcast`);
      setRealBackendLecture(updatedLecture);
      setPublishMessage("Lecture has been successfully broadcasted to enrolled students.");
    } catch (err) {
      if (err.status === 409) {
        setPublishMessage(
          err.message || "Lecture cannot be broadcasted in its current state."
        );
      } else if (err.status === 403) {
        setPublishMessage("Access denied. You do not have permission to broadcast this lecture.");
      } else if (err.status === 404) {
        setPublishMessage("Lecture record not found.");
      } else {
        setPublishMessage(
          err.message || "Failed to broadcast lecture. Please try again."
        );
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleWithdrawBroadcast = () => {
    setPublishMessage(
      "Note: The backend API does not currently support withdrawing a broadcast once published."
    );
  };

  /* =====================================================
     TRANSCRIPT STATE (REAL BACKEND INTEGRATION)
  ===================================================== */

  const [realTranscript, setRealTranscript] = useState(null);
  const [transcriptStatus, setTranscriptStatus] = useState("idle"); // 'idle' | 'uploaded' | 'processing' | 'completed' | 'failed'
  const [transcriptError, setTranscriptError] = useState(null);
  const [isTranscribeLoading, setIsTranscribeLoading] = useState(false);
  const [isSavingCorrection, setIsSavingCorrection] = useState(false);
  const [correctionValidationError, setCorrectionValidationError] = useState(null);

  const [transcriptSegments, setTranscriptSegments] = useState([]);
  const [draftTranscriptSegments, setDraftTranscriptSegments] = useState([]);
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);

  // Initial fetch of transcript state
  useEffect(() => {
    let isMounted = true;
    if (!lectureId) return;

    apiClient
      .get(`/lectures/${lectureId}/transcript`)
      .then((data) => {
        if (!isMounted) return;
        setRealTranscript(data);
        const status = data.status || "completed";
        setTranscriptStatus(status);
        if (data.error_message) {
          setTranscriptError(data.error_message);
        } else {
          setTranscriptError(null);
        }
        const segs = parseTranscriptToSegments(data);
        setTranscriptSegments(segs);
      })
      .catch((err) => {
        if (!isMounted) return;
        if (err.status === 404) {
          setRealTranscript(null);
          setTranscriptStatus("uploaded");
          setTranscriptSegments([]);
          setTranscriptError(null);
        } else {
          setTranscriptStatus("failed");
          setTranscriptError(err.message || "Failed to fetch transcript");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [lectureId]);

  // Polling loop when status is 'processing'
  useEffect(() => {
    let isMounted = true;
    let intervalId = null;

    if (lectureId && transcriptStatus === "processing" && !isSavingCorrection) {
      intervalId = setInterval(async () => {
        if (!isMounted) return;

        apiClient
          .get(`/lectures/${lectureId}`)
          .then((data) => {
            if (isMounted && data) {
              setRealBackendLecture(data);
            }
          })
          .catch(() => {});

        try {
          const data = await apiClient.get(`/lectures/${lectureId}/transcript`);
          if (!isMounted) return;

          setRealTranscript(data);
          const currentStatus = data.status || "processing";
          setTranscriptStatus(currentStatus);

          if (currentStatus === "completed" || currentStatus === "failed") {
            if (data.error_message) {
              setTranscriptError(data.error_message);
            }
            const segs = parseTranscriptToSegments(data);
            setTranscriptSegments(segs);
          }
        } catch (err) {
          if (!isMounted) return;
          if (err.status !== 404) {
            setTranscriptStatus("failed");
            setTranscriptError(err.message || "Error polling transcript status");
          }
        }
      }, 2500);
    }

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [lectureId, transcriptStatus, isSavingCorrection]);

  /* =====================================================
     GENERATED CONTENT STATE & API INTEGRATION (B3.1)
  ===================================================== */

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [packageLoaded, setPackageLoaded] = useState(false);
  const [glossaryItems, setGlossaryItems] = useState([]);

  const [notes, setNotes] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const [flashcards, setFlashcards] = useState([]);
  const [draftFlashcards, setDraftFlashcards] = useState([]);
  const [isEditingFlashcards, setIsEditingFlashcards] = useState(false);

  const [quizQuestions, setQuizQuestions] = useState([]);
  const [draftQuizQuestions, setDraftQuizQuestions] = useState([]);
  const [isEditingQuiz, setIsEditingQuiz] = useState(false);

  // Fetch real generated learning package from backend
  const fetchGeneratedPackage = async (lecId) => {
    if (!lecId) return;

    try {
      // 1. Fetch Notes
      try {
        const noteData = await apiClient.get(`/lectures/${lecId}/notes`);
        if (noteData && noteData.markdown_content) {
          setNotes(noteData.markdown_content);
          setDraftNotes(noteData.markdown_content);
        }
      } catch (err) {
        // Notes missing
      }

      // 2. Fetch Flashcards
      try {
        const fcData = await apiClient.get(`/lectures/${lecId}/flashcards`);
        if (Array.isArray(fcData)) {
          const mappedFc = fcData.map((item) => ({
            id: item.id,
            question: item.question,
            answer: item.answer,
          }));
          setFlashcards(mappedFc);
          setDraftFlashcards(mappedFc);
        }
      } catch (err) {
        // Flashcards missing
      }

      // 3. Fetch Quizzes (endpoint: GET /lectures/{id}/quizzes)
      try {
        const qData = await apiClient.get(`/lectures/${lecId}/quizzes`);
        if (Array.isArray(qData)) {
          const mappedQuiz = qData.map((item) => {
            let options = [];
            if (item.options_json) {
              try {
                options = JSON.parse(item.options_json);
              } catch (e) {
                options = [item.options_json];
              }
            }
            const correctIdx = getCorrectOptionIndex(options, item.correct_answer);
            return {
              id: item.id,
              question: item.question,
              options,
              correctAnswer: correctIdx,
              explanation: item.explanation || "",
            };
          });
          setQuizQuestions(mappedQuiz);
          setDraftQuizQuestions(mappedQuiz);
        }
      } catch (err) {
        // Quizzes missing
      }

      // 4. Fetch Glossary
      try {
        const gData = await apiClient.get(`/lectures/${lecId}/glossary`);
        if (Array.isArray(gData)) {
          setGlossaryItems(gData);
        }
      } catch (err) {
        // Glossary missing
      }

      setPackageLoaded(true);
    } catch (err) {
      // General error
    }
  };

  // Auto-fetch package if lecture status is 'draft' or 'broadcast'
  useEffect(() => {
    if (realBackendLecture && lectureId) {
      const rawStatus = (realBackendLecture.status || "").toLowerCase();
      if ((rawStatus === "draft" || rawStatus === "broadcast") && !packageLoaded) {
        fetchGeneratedPackage(lectureId);
      }
    }
  }, [realBackendLecture, lectureId, packageLoaded]);

  // Generation trigger handler (POST /lectures/{id}/generate)
  const handleTriggerGeneration = async () => {
    if (!lectureId || isGenerating) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      await apiClient.post(`/lectures/${lectureId}/generate`);
      // 202 Accepted, polling will pick up status transition
    } catch (err) {
      setIsGenerating(false);
      if (err.status === 409) {
        if (err.message && err.message.toLowerCase().includes("transcript")) {
          setGenerationError("Transcript must be completed before generating content.");
        } else {
          apiClient
            .get(`/lectures/${lectureId}`)
            .then((lecData) => {
              setRealBackendLecture(lecData);
              const currentStatus = (lecData.status || "").toLowerCase();
              if (currentStatus === "draft" || currentStatus === "broadcast") {
                fetchGeneratedPackage(lectureId);
              }
            })
            .catch(() => {});
        }
      } else {
        setGenerationError(
          err.message || "Failed to trigger content generation. Please try again."
        );
      }
    }
  };

  // Generation Polling Loop
  useEffect(() => {
    let isMounted = true;
    let intervalId = null;

    const rawStatus = (realBackendLecture?.status || "").toLowerCase();

    if (lectureId && (isGenerating || rawStatus === "processing_generation")) {
      intervalId = setInterval(async () => {
        if (!isMounted) return;

        try {
          const lecData = await apiClient.get(`/lectures/${lectureId}`);
          if (!isMounted) return;

          setRealBackendLecture(lecData);
          const currentStatus = (lecData.status || "").toLowerCase();

          if (currentStatus === "draft" || currentStatus === "broadcast") {
            setIsGenerating(false);
            setGenerationError(null);
            if (intervalId) clearInterval(intervalId);
            fetchGeneratedPackage(lectureId);
          } else if (currentStatus === "generation_failed") {
            setIsGenerating(false);
            setGenerationError(
              lecData.generation_error_message || "LLM content generation failed."
            );
            if (intervalId) clearInterval(intervalId);
          }
        } catch (err) {
          if (!isMounted) return;
          setGenerationError(err.message || "Error polling generation status");
          setIsGenerating(false);
          if (intervalId) clearInterval(intervalId);
        }
      }, 2500);
    }

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [lectureId, isGenerating, realBackendLecture?.status]);

  // Render generation state card (Processing / Failure / Prompt)
  const renderGenerationStateCard = (tabTitle) => {
    const rawStatus = (realBackendLecture?.status || "").toLowerCase();

    if (isGenerating || rawStatus === "processing_generation") {
      return (
        <div className="card" style={{ marginTop: 18, padding: 40, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <RefreshCw size={36} style={{ color: "#1f6feb", animation: "spin 1.5s linear infinite" }} />
          </div>
          <h3 style={{ fontSize: 18, marginBottom: 8 }}>Generating AI Learning Package...</h3>
          <p className="muted" style={{ maxWidth: 520, margin: "0 auto", fontSize: 13, lineHeight: 1.6 }}>
            Groq AI is analyzing the transcript to generate structured Notes, Flashcards, Quiz questions, and Glossary terms. This takes 15–30 seconds.
          </p>
        </div>
      );
    }

    if (rawStatus === "generation_failed" || generationError) {
      return (
        <div className="card" style={{ marginTop: 18, padding: 40, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <X size={38} style={{ color: "#b42318", background: "#fef3f2", borderRadius: "50%", padding: 6 }} />
          </div>
          <h3 style={{ fontSize: 18, marginBottom: 8, color: "#b42318" }}>Content Generation Failed</h3>
          <p className="muted" style={{ maxWidth: 520, margin: "0 auto 20px", fontSize: 13, lineHeight: 1.6 }}>
            {generationError || realBackendLecture?.generation_error_message || "An unexpected error occurred during content generation."}
          </p>
          <div>
            <button
              type="button"
              className="primary-action-button"
              onClick={handleTriggerGeneration}
              disabled={isGenerating}
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <RefreshCw size={15} />
              Retry Generation
            </button>
          </div>
        </div>
      );
    }

    if (rawStatus !== "draft" && rawStatus !== "broadcast" && !packageLoaded) {
      const isTranscriptReady = transcriptStatus === "completed";

      return (
        <div className="card" style={{ marginTop: 18, padding: 40, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <Sparkles size={38} style={{ color: isTranscriptReady ? "#1f6feb" : "#94a3b8" }} />
          </div>
          <h3 style={{ fontSize: 18, marginBottom: 8 }}>
            {isTranscriptReady ? "AI Learning Package Not Generated Yet" : "Transcript Required First"}
          </h3>
          <p className="muted" style={{ maxWidth: 520, margin: "0 auto 20px", fontSize: 13, lineHeight: 1.6 }}>
            {isTranscriptReady
              ? "The transcript is ready! Trigger AI content generation to produce structured Notes, Flashcards, Quiz questions, and Glossary terms."
              : "Audio transcription must be completed before AI content generation can be triggered."}
          </p>
          {isTranscriptReady && (
            <div>
              <button
                type="button"
                className="primary-action-button"
                onClick={handleTriggerGeneration}
                disabled={isGenerating}
                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <Sparkles size={15} />
                Generate Learning Package
              </button>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  /* =====================================================
     TABS
  ===================================================== */

  const tabs = [
    {
      id: "transcript",
      label: "Transcript",
      icon: FileText,
    },
    {
      id: "notes",
      label: "Notes",
      icon: NotebookText,
    },
    {
      id: "flashcards",
      label: "Flashcards",
      icon: Layers3,
    },
    {
      id: "quiz",
      label: "Quiz",
      icon: CircleHelp,
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
    },
  ];

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const handleBack = () => {
    if (subject?.id) {
      navigate(`/faculty/subjects/${subject.id}`);

      return;
    }

    navigate("/faculty/subjects");
  };

  /* =====================================================
     TRANSCRIPT ACTIONS & API INTEGRATION
  ===================================================== */

  const handleTriggerTranscribe = async () => {
    if (!lectureId || isTranscribeLoading) return;

    setIsTranscribeLoading(true);
    setTranscriptError(null);

    try {
      await apiClient.post(`/lectures/${lectureId}/transcribe`);
      setTranscriptStatus("processing");
    } catch (err) {
      if (err.status === 409) {
        try {
          const data = await apiClient.get(`/lectures/${lectureId}/transcript`);
          setRealTranscript(data);
          setTranscriptStatus(data.status || "completed");
          const segs = parseTranscriptToSegments(data);
          setTranscriptSegments(segs);
        } catch (fetchErr) {
          setTranscriptError(err.message || "Transcription conflict.");
        }
      } else {
        setTranscriptError(
          err.message || "Failed to trigger transcription. Please try again."
        );
      }
    } finally {
      setIsTranscribeLoading(false);
    }
  };

  const handleEditTranscript = () => {
    setCorrectionValidationError(null);
    setDraftTranscriptSegments(
      transcriptSegments.map((segment) => ({
        ...segment,
      })),
    );
    setIsEditingTranscript(true);
  };

  const handleTranscriptChange = (id, value) => {
    setDraftTranscriptSegments((current) =>
      current.map((segment) =>
        segment.id === id
          ? {
              ...segment,
              text: value,
            }
          : segment,
      ),
    );
  };

  const handleSaveTranscript = async () => {
    setCorrectionValidationError(null);

    const fullText = draftTranscriptSegments
      .map((s) => s.text)
      .join("\n\n");

    if (!fullText || !fullText.trim()) {
      setCorrectionValidationError("Transcript text cannot be empty or whitespace only.");
      return;
    }

    setIsSavingCorrection(true);

    try {
      const updatedTranscript = await apiClient.patch(
        `/lectures/${lectureId}/transcript`,
        {
          corrected_text: fullText.trim(),
        }
      );

      setRealTranscript(updatedTranscript);
      const updatedSegs = parseTranscriptToSegments(updatedTranscript);
      setTranscriptSegments(updatedSegs);
      setIsEditingTranscript(false);
      setPublishMessage("Transcript correction saved.");
    } catch (err) {
      if (err.status === 422) {
        setCorrectionValidationError("Invalid transcript text provided.");
      } else if (err.status === 409) {
        setCorrectionValidationError(
          err.message || "Transcript correction is not allowed for this lecture state."
        );
      } else if (err.status === 404) {
        setCorrectionValidationError("Transcript record not found.");
      } else {
        setCorrectionValidationError(
          err.message || "Failed to save transcript correction. Please try again."
        );
      }
    } finally {
      setIsSavingCorrection(false);
    }
  };

  const handleCancelTranscript = () => {
    setCorrectionValidationError(null);
    setDraftTranscriptSegments(
      transcriptSegments.map((segment) => ({
        ...segment,
      })),
    );
    setIsEditingTranscript(false);
  };

  /* =====================================================
     NOTES ACTIONS
  ===================================================== */

  const handleEditNotes = () => {
    setDraftNotes(notes);
    setIsEditingNotes(true);
  };

  const handleSaveNotes = () => {
    setNotes(draftNotes);
    setIsEditingNotes(false);

    setPublishMessage(
      "Notes updated. Re-publish the lecture to make this version available to students.",
    );
  };

  const handleCancelNotes = () => {
    setDraftNotes(notes);
    setIsEditingNotes(false);
  };

  /* =====================================================
     FLASHCARD ACTIONS
  ===================================================== */

  const handleEditFlashcards = () => {
    setDraftFlashcards(
      flashcards.map((card) => ({
        ...card,
      })),
    );

    setIsEditingFlashcards(true);
  };

  const handleSaveFlashcards = () => {
    setFlashcards(
      draftFlashcards.map((card) => ({
        ...card,
      })),
    );

    setIsEditingFlashcards(false);

    setPublishMessage(
      "Flashcards updated. Re-publish the lecture to make this version available to students.",
    );
  };

  const handleCancelFlashcards = () => {
    setDraftFlashcards(
      flashcards.map((card) => ({
        ...card,
      })),
    );

    setIsEditingFlashcards(false);
  };

  const handleFlashcardChange = (id, field, value) => {
    setDraftFlashcards((current) =>
      current.map((card) =>
        card.id === id
          ? {
              ...card,
              [field]: value,
            }
          : card,
      ),
    );
  };

  const handleAddFlashcard = () => {
    setDraftFlashcards((current) => [
      ...current,
      {
        id: Date.now(),
        question: "New flashcard question",
        answer: "New flashcard answer",
      },
    ]);
  };

  const handleDeleteFlashcard = (id) => {
    setDraftFlashcards((current) => current.filter((card) => card.id !== id));
  };

  /* =====================================================
     QUIZ ACTIONS
  ===================================================== */

  const handleEditQuiz = () => {
    setDraftQuizQuestions(
      quizQuestions.map((question) => ({
        ...question,
        options: [...question.options],
      })),
    );

    setIsEditingQuiz(true);
  };

  const handleSaveQuiz = () => {
    setQuizQuestions(
      draftQuizQuestions.map((question) => ({
        ...question,
        options: [...question.options],
      })),
    );

    setIsEditingQuiz(false);

    setPublishMessage(
      "Quiz updated. Re-publish the lecture to make this version available to students.",
    );
  };

  const handleCancelQuiz = () => {
    setDraftQuizQuestions(
      quizQuestions.map((question) => ({
        ...question,
        options: [...question.options],
      })),
    );

    setIsEditingQuiz(false);
  };

  const handleQuizQuestionChange = (id, value) => {
    setDraftQuizQuestions((current) =>
      current.map((question) =>
        question.id === id
          ? {
              ...question,
              question: value,
            }
          : question,
      ),
    );
  };

  const handleQuizOptionChange = (questionId, optionIndex, value) => {
    setDraftQuizQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId) {
          return question;
        }

        const updatedOptions = [...question.options];

        updatedOptions[optionIndex] = value;

        return {
          ...question,
          options: updatedOptions,
        };
      }),
    );
  };

  const handleCorrectAnswerChange = (questionId, optionIndex) => {
    setDraftQuizQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              correctAnswer: optionIndex,
            }
          : question,
      ),
    );
  };

  const handleAddQuizQuestion = () => {
    setDraftQuizQuestions((current) => [
      ...current,
      {
        id: Date.now(),
        question: "New quiz question",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: 0,
      },
    ]);
  };

  const handleDeleteQuizQuestion = (id) => {
    setDraftQuizQuestions((current) =>
      current.filter((question) => question.id !== id),
    );
  };

  /* =====================================================
     TRANSCRIPT RENDER
  ===================================================== */

  const renderTranscript = () => {
    if (transcriptStatus === "processing") {
      return (
        <div className="card" style={{ marginTop: 18, padding: 40, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <RefreshCw size={36} style={{ color: "#1687c9", animation: "spin 1.5s linear infinite" }} />
          </div>
          <h3 style={{ fontSize: 18, marginBottom: 8 }}>Transcribing Lecture Audio...</h3>
          <p className="muted" style={{ maxWidth: 520, margin: "0 auto", fontSize: 13, lineHeight: 1.6 }}>
            Audio is being transcribed using Groq AI. This usually takes a few seconds. The page updates automatically when complete.
          </p>
        </div>
      );
    }

    if (transcriptStatus === "uploaded" || (transcriptStatus === "idle" && transcriptSegments.length === 0)) {
      return (
        <div className="card" style={{ marginTop: 18, padding: 40, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <FileText size={38} style={{ color: "#64748b" }} />
          </div>
          <h3 style={{ fontSize: 18, marginBottom: 8 }}>Transcript Not Available Yet</h3>
          <p className="muted" style={{ maxWidth: 520, margin: "0 auto 20px", fontSize: 13, lineHeight: 1.6 }}>
            The lecture audio is uploaded. Click below to start AI transcription.
          </p>
          {transcriptError && (
            <div style={{ color: "#b42318", fontSize: 12, marginBottom: 16, background: "#fef3f2", padding: "8px 12px", borderRadius: 6, display: "inline-block" }}>
              {transcriptError}
            </div>
          )}
          <div>
            <button
              type="button"
              className="primary-action-button"
              onClick={handleTriggerTranscribe}
              disabled={isTranscribeLoading}
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              {isTranscribeLoading ? (
                <>
                  <RefreshCw size={15} style={{ animation: "spin 1.5s linear infinite" }} />
                  Initiating Transcription...
                </>
              ) : (
                <>
                  <FileText size={15} />
                  Transcribe Audio
                </>
              )}
            </button>
          </div>
        </div>
      );
    }

    if (transcriptStatus === "failed") {
      return (
        <div className="card" style={{ marginTop: 18, padding: 40, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <X size={38} style={{ color: "#b42318", background: "#fef3f2", borderRadius: "50%", padding: 6 }} />
          </div>
          <h3 style={{ fontSize: 18, marginBottom: 8, color: "#b42318" }}>Transcription Failed</h3>
          <p className="muted" style={{ maxWidth: 520, margin: "0 auto 20px", fontSize: 13, lineHeight: 1.6 }}>
            {transcriptError || "An unexpected error occurred while processing the audio transcription."}
          </p>
          <div>
            <button
              type="button"
              className="primary-action-button"
              onClick={handleTriggerTranscribe}
              disabled={isTranscribeLoading}
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              {isTranscribeLoading ? (
                <>
                  <RefreshCw size={15} style={{ animation: "spin 1.5s linear infinite" }} />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw size={15} />
                  Retry Transcription
                </>
              )}
            </button>
          </div>
        </div>
      );
    }

    const segmentsToRender = isEditingTranscript
      ? draftTranscriptSegments
      : transcriptSegments;

    return (
      <div
        className="card"
        style={{
          marginTop: 18,
          padding: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            minHeight: 66,
            padding: "0 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            borderBottom: "1px solid #e8edf3",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p className="eyebrow">COMPLETE TRANSCRIPT</p>

            <h3
              style={{
                margin: "3px 0 0",
                fontSize: 16,
              }}
            >
              Lecture Transcript
            </h3>
          </div>

          {!isEditingTranscript ? (
            <button
              type="button"
              className="secondary-action-button"
              onClick={handleEditTranscript}
            >
              <Pencil size={15} />
              Edit Transcript
            </button>
          ) : (
            <div
              style={{
                display: "flex",
                gap: 8,
              }}
            >
              <button
                type="button"
                className="secondary-action-button"
                onClick={handleCancelTranscript}
                disabled={isSavingCorrection}
              >
                <X size={15} />
                Cancel
              </button>

              <button
                type="button"
                className="primary-action-button"
                onClick={handleSaveTranscript}
                disabled={isSavingCorrection}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                {isSavingCorrection ? (
                  <>
                    <RefreshCw size={15} style={{ animation: "spin 1.5s linear infinite" }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {correctionValidationError && (
          <div
            style={{
              margin: "14px 22px 0",
              padding: "10px 14px",
              borderRadius: 6,
              background: "#fef3f2",
              border: "1px solid #fda29b",
              color: "#b42318",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {correctionValidationError}
          </div>
        )}

        <div
          style={{
            padding: "8px 14px 14px",
          }}
        >
          {segmentsToRender.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#64748b", fontSize: 13 }}>
              No transcript segments available.
            </div>
          ) : (
            segmentsToRender.map((segment) => (
              <div
                key={segment.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "62px minmax(0, 1fr)",
                  gap: 14,
                  padding: "17px 16px",
                  marginTop: 5,
                  borderRadius: 7,
                  borderLeft: segment.highlighted
                    ? "3px solid #1687c9"
                    : "3px solid transparent",
                  background: segment.highlighted ? "#eaf4ff" : "transparent",
                }}
              >
                <span
                  style={{
                    paddingTop: isEditingTranscript ? 10 : 2,
                    color: segment.highlighted ? "#1578b4" : "#738094",
                    fontSize: 11,
                    fontWeight: segment.highlighted ? 700 : 600,
                  }}
                >
                  {segment.time}
                </span>

                {isEditingTranscript ? (
                  <textarea
                    value={segment.text}
                    onChange={(event) =>
                      handleTranscriptChange(segment.id, event.target.value)
                    }
                    style={{
                      minHeight: 88,
                      resize: "vertical",
                      fontSize: 12,
                      lineHeight: 1.7,
                    }}
                  />
                ) : (
                  <p
                    style={{
                      margin: 0,
                      color: "#454f5d",
                      fontSize: 12,
                      lineHeight: 1.75,
                    }}
                  >
                    {segment.text}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  /* =====================================================
     NOTES
  ===================================================== */

  const renderNotes = () => {
    const generationCard = renderGenerationStateCard("Notes");
    if (generationCard) return generationCard;

    return (
      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 280px",
          gap: 18,
        }}
      >
        <div
          className="card"
          style={{
            padding: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              minHeight: 68,
              padding: "0 22px",
              borderBottom: "1px solid #e7ebf0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <p className="eyebrow">AI GENERATED NOTES</p>

              <h3
                style={{
                  margin: "3px 0 0",
                }}
              >
                Lecture Notes
              </h3>
            </div>

            {!isEditingNotes ? (
              <button
                type="button"
                className="secondary-action-button"
                onClick={handleEditNotes}
              >
                <Pencil size={15} />
                Edit Notes
              </button>
            ) : (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  className="secondary-action-button"
                  onClick={handleCancelNotes}
                >
                  <X size={15} />
                  Cancel
                </button>

                <button
                  type="button"
                  className="primary-action-button"
                  onClick={handleSaveNotes}
                >
                  <Save size={15} />
                  Save Changes
                </button>
              </div>
            )}
          </div>

          <div style={{ padding: 24 }}>
            {isEditingNotes ? (
              <textarea
                value={draftNotes}
                onChange={(event) => setDraftNotes(event.target.value)}
                style={{
                  minHeight: 560,
                  resize: "vertical",
                  lineHeight: 1.8,
                }}
              />
            ) : (
              <div
                style={{
                  whiteSpace: "pre-line",
                  color: "#475569",
                  fontSize: 14,
                  lineHeight: 1.85,
                }}
              >
                {notes || "No notes generated yet."}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: 14,
          }}
        >
          <div className="card" style={{ padding: 20 }}>
            <p className="eyebrow">FACULTY REVIEW</p>

            <h3
              style={{
                marginTop: 7,
              }}
            >
              Notes status
            </h3>

            <div
              style={{
                marginTop: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#18794e",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              <CheckCircle size={17} />
              Ready for review
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <p className="eyebrow">KEY TOPICS & GLOSSARY</p>

            <div
              style={{
                display: "grid",
                gap: 8,
                marginTop: 14,
              }}
            >
              {glossaryItems.length > 0
                ? glossaryItems.map((item) => (
                    <div
                      key={item.id || item.term}
                      style={{
                        padding: "10px 12px",
                        background: "#f5f7fa",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    >
                      <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: 3 }}>
                        {item.term}
                      </div>
                      <div style={{ color: "#64748b", fontSize: 11, lineHeight: 1.5 }}>
                        {item.definition}
                      </div>
                    </div>
                  ))
                : [
                    "Operating Systems",
                    "Process Management",
                    "Memory Management",
                    "File Management",
                    "Device Management",
                    "System Security",
                  ].map((topic) => (
                    <div
                      key={topic}
                      style={{
                        padding: "9px 11px",
                        background: "#f5f7fa",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    >
                      {topic}
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* =====================================================
     FLASHCARDS
  ===================================================== */

  const renderFlashcards = () => {
    const generationCard = renderGenerationStateCard("Flashcards");
    if (generationCard) return generationCard;

    const cardsToRender = isEditingFlashcards ? draftFlashcards : flashcards;

    return (
      <div
        className="card"
        style={{
          marginTop: 18,
          padding: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            minHeight: 70,
            padding: "0 22px",
            borderBottom: "1px solid #e7ebf0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p className="eyebrow">AI GENERATED FLASHCARDS</p>

            <h3
              style={{
                margin: "3px 0 0",
              }}
            >
              Lecture Flashcards
            </h3>
          </div>

          {!isEditingFlashcards ? (
            <button
              type="button"
              className="secondary-action-button"
              onClick={handleEditFlashcards}
            >
              <Pencil size={15} />
              Edit Flashcards
            </button>
          ) : (
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className="secondary-action-button"
                onClick={handleAddFlashcard}
              >
                <Plus size={15} />
                Add Flashcard
              </button>

              <button
                type="button"
                className="secondary-action-button"
                onClick={handleCancelFlashcards}
              >
                <X size={15} />
                Cancel
              </button>

              <button
                type="button"
                className="primary-action-button"
                onClick={handleSaveFlashcards}
              >
                <Save size={15} />
                Save Changes
              </button>
            </div>
          )}
        </div>

        <div style={{ padding: 22 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 16,
            }}
          >
            {cardsToRender.map((card, index) => (
              <div
                key={card.id}
                className="card"
                style={{
                  padding: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "#eaf2ff",
                      color: "#173b6d",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {index + 1}
                  </span>

                  {isEditingFlashcards && (
                    <button
                      type="button"
                      onClick={() => handleDeleteFlashcard(card.id)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#b42318",
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {isEditingFlashcards ? (
                  <>
                    <textarea
                      value={card.question}
                      onChange={(event) =>
                        handleFlashcardChange(
                          card.id,
                          "question",
                          event.target.value,
                        )
                      }
                      style={{
                        marginTop: 16,
                        minHeight: 80,
                      }}
                    />

                    <textarea
                      value={card.answer}
                      onChange={(event) =>
                        handleFlashcardChange(
                          card.id,
                          "answer",
                          event.target.value,
                        )
                      }
                      style={{
                        marginTop: 12,
                        minHeight: 100,
                      }}
                    />
                  </>
                ) : (
                  <>
                    <h3
                      style={{
                        marginTop: 18,
                        lineHeight: 1.5,
                      }}
                    >
                      {card.question}
                    </h3>

                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 14,
                        borderTop: "1px solid #eef1f5",
                      }}
                    >
                      <span className="eyebrow">ANSWER</span>

                      <p
                        style={{
                          marginTop: 7,
                          color: "#64748b",
                          fontSize: 13,
                          lineHeight: 1.7,
                        }}
                      >
                        {card.answer}
                      </p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* =====================================================
     QUIZ
  ===================================================== */

  const renderQuiz = () => {
    const generationCard = renderGenerationStateCard("Quiz");
    if (generationCard) return generationCard;

    const questionsToRender = isEditingQuiz
      ? draftQuizQuestions
      : quizQuestions;

    return (
      <div
        className="card"
        style={{
          marginTop: 18,
          padding: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            minHeight: 72,
            padding: "0 22px",
            borderBottom: "1px solid #e7ebf0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p className="eyebrow">AI GENERATED QUIZ</p>

            <h3
              style={{
                margin: "3px 0 0",
              }}
            >
              Lecture Quiz
            </h3>
          </div>

          {!isEditingQuiz ? (
            <button
              type="button"
              className="secondary-action-button"
              onClick={handleEditQuiz}
            >
              <Pencil size={15} />
              Edit Quiz
            </button>
          ) : (
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className="secondary-action-button"
                onClick={handleAddQuizQuestion}
              >
                <Plus size={15} />
                Add Question
              </button>

              <button
                type="button"
                className="secondary-action-button"
                onClick={handleCancelQuiz}
              >
                <X size={15} />
                Cancel
              </button>

              <button
                type="button"
                className="primary-action-button"
                onClick={handleSaveQuiz}
              >
                <Save size={15} />
                Save Changes
              </button>
            </div>
          )}
        </div>

        <div style={{ padding: 22 }}>
          <div
            style={{
              display: "grid",
              gap: 16,
            }}
          >
            {questionsToRender.map((question, questionIndex) => (
              <div
                key={question.id}
                className="card"
                style={{
                  padding: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "#eaf2ff",
                        color: "#173b6d",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {questionIndex + 1}
                    </span>

                    <span className="eyebrow">QUESTION</span>
                  </div>

                  {isEditingQuiz && (
                    <button
                      type="button"
                      onClick={() => handleDeleteQuizQuestion(question.id)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#b42318",
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {isEditingQuiz ? (
                  <>
                    <textarea
                      value={question.question}
                      onChange={(event) =>
                        handleQuizQuestionChange(
                          question.id,
                          event.target.value,
                        )
                      }
                      style={{
                        marginTop: 16,
                        minHeight: 80,
                      }}
                    />

                    <div
                      style={{
                        display: "grid",
                        gap: 10,
                        marginTop: 16,
                      }}
                    >
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "32px 1fr",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <input
                            type="radio"
                            name={`correct-${question.id}`}
                            checked={question.correctAnswer === optionIndex}
                            onChange={() =>
                              handleCorrectAnswerChange(
                                question.id,
                                optionIndex,
                              )
                            }
                          />

                          <input
                            type="text"
                            value={option}
                            onChange={(event) =>
                              handleQuizOptionChange(
                                question.id,
                                optionIndex,
                                event.target.value,
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <h3
                      style={{
                        marginTop: 18,
                        fontSize: 16,
                        lineHeight: 1.5,
                      }}
                    >
                      {question.question}
                    </h3>

                    <div
                      style={{
                        display: "grid",
                        gap: 9,
                        marginTop: 16,
                      }}
                    >
                      {question.options.map((option, optionIndex) => {
                        const isCorrect =
                          optionIndex === question.correctAnswer;

                        return (
                          <div
                            key={optionIndex}
                            style={{
                              minHeight: 42,
                              padding: "10px 13px",
                              border: isCorrect
                                ? "1px solid #8ed0aa"
                                : "1px solid #e1e6ed",
                              borderRadius: 8,
                              background: isCorrect ? "#f0faf4" : "#ffffff",
                              color: isCorrect ? "#18794e" : "#475569",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              fontSize: 13,
                            }}
                          >
                            {isCorrect ? (
                              <CheckCircle2 size={16} />
                            ) : (
                              <span
                                style={{
                                  width: 16,
                                  height: 16,
                                  border: "1px solid #cbd5e1",
                                  borderRadius: "50%",
                                }}
                              />
                            )}

                            {option}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* =====================================================
     ANALYTICS
  ===================================================== */

  const renderAnalytics = () => (
    <div
      className="card"
      style={{
        marginTop: 18,
        padding: 24,
      }}
    >
      <p className="eyebrow">LECTURE ANALYTICS</p>

      <h2 style={{ marginTop: 6 }}>Analytics</h2>

      <p
        className="muted"
        style={{
          marginTop: 8,
          lineHeight: 1.7,
        }}
      >
        Speaking rate, speech clarity, filler words, quiz performance, and
        lecture metrics are available in the full analytics page.
      </p>

      <button
        type="button"
        className="primary-action-button"
        onClick={() => {
          const targetLecId = lectureId || lecture?.id;
          if (subjectId && lecturerId && targetLecId) {
            navigate(
              `/faculty/subjects/${subjectId}/lecturers/${lecturerId}/lectures/${targetLecId}/analytics`,
            );
            return;
          }
          if (targetLecId) {
            navigate(`/faculty/lectures/${targetLecId}/analytics`);
            return;
          }
          navigate("/faculty/subjects");
        }}
        style={{
          marginTop: 16,
        }}
      >
        Open Full Analytics
      </button>
    </div>
  );

  const renderTabContent = () => {
    if (activeTab === "transcript") {
      return renderTranscript();
    }

    if (activeTab === "notes") {
      return renderNotes();
    }

    if (activeTab === "flashcards") {
      return renderFlashcards();
    }

    if (activeTab === "quiz") {
      return renderQuiz();
    }

    if (activeTab === "analytics") {
      return renderAnalytics();
    }

    return null;
  };

  /* =====================================================
     NOT FOUND
  ===================================================== */

  if (!lecture) {
    return (
      <div className="page">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/faculty/subjects")}
        >
          <ArrowLeft size={16} />
          Back to Subjects
        </button>

        <div
          className="card"
          style={{
            marginTop: 20,
            padding: 30,
          }}
        >
          <h2>Lecture not found</h2>

          <p className="muted">The selected lecture could not be found.</p>
        </div>
      </div>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="page">
      <button type="button" className="back-button" onClick={handleBack}>
        <ArrowLeft size={16} />
        Back to {subject?.name || "Subject"}
      </button>

      {/* Header */}

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
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              flex: "1 1 500px",
            }}
          >
            <p className="eyebrow">
              {subject?.name || lecture.subject || "LECTURE"}
            </p>

            <h1
              style={{
                marginTop: 6,
                marginBottom: 8,
                fontSize: 31,
              }}
            >
              {lecture.title}
            </h1>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
                color: "#667085",
                fontSize: 13,
              }}
            >
              {lecture.lecturer && <span>{lecture.lecturer}</span>}

              {lecture.date && (
                <>
                  <span>•</span>

                  <span>{lecture.date}</span>
                </>
              )}

              {lecture.duration && (
                <>
                  <span>•</span>

                  <span>{lecture.duration}</span>
                </>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {transcriptStatus === "completed" && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "#e9f7ef",
                  color: "#18794e",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <CheckCircle2 size={14} />
                Processed
              </span>
            )}

            {transcriptStatus === "processing" && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "#eaf2ff",
                  color: "#1d63c6",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <RefreshCw size={14} style={{ animation: "spin 1.5s linear infinite" }} />
                Processing...
              </span>
            )}

            {transcriptStatus === "uploaded" && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "#f1f3f6",
                  color: "#667085",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <FileText size={14} />
                Uploaded
              </span>
            )}

            {transcriptStatus === "failed" && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "#fef3f2",
                  color: "#b42318",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <X size={14} />
                Failed
              </span>
            )}

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 10px",
                borderRadius: 999,
                background:
                  publicationStatus === "Broadcast" ? "#e9f2ff" : "#f1f3f6",
                color:
                  publicationStatus === "Broadcast" ? "#2168d5" : "#667085",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <Radio size={14} />

              {publicationStatus}
            </span>
          </div>
        </div>
      </section>

      {/* Publish controls */}

      <section
        style={{
          marginTop: 20,
          display: "flex",
          justifyContent: "flex-end",
          gap: 9,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          className="primary-action-button"
          onClick={handleBroadcastLecture}
          disabled={isPublishing || rawLectureStatus === "broadcast" || rawLectureStatus !== "draft"}
          style={{ display: "inline-flex", alignItems: "center", gap: 7 }}
        >
          {isPublishing ? (
            <>
              <RefreshCw size={15} style={{ animation: "spin 1.5s linear infinite" }} />
              Broadcasting...
            </>
          ) : (
            <>
              <Radio size={15} />
              {rawLectureStatus === "broadcast"
                ? "Already Broadcasted"
                : "Publish / Broadcast Lecture"}
            </>
          )}
        </button>

        <button
          type="button"
          className="secondary-action-button"
          onClick={handleWithdrawBroadcast}
          disabled={rawLectureStatus !== "broadcast"}
        >
          Withdraw broadcast
        </button>
      </section>

      {/* Status message */}

      {publishMessage && (
        <div
          style={{
            marginTop: 12,
            padding: "11px 14px",
            border: "1px solid #d9e5f2",
            borderRadius: 8,
            background: "#f7faff",
            color: "#52647b",
            fontSize: 12,
          }}
        >
          {publishMessage}
        </div>
      )}

      {/* Tabs */}

      <section
        style={{
          marginTop: 18,
          borderBottom: "1px solid #dfe5ec",
          display: "flex",
          alignItems: "center",
          gap: 4,
          overflowX: "auto",
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;

          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                minHeight: 44,
                border: "none",
                borderBottom: isActive
                  ? "2px solid #1f6feb"
                  : "2px solid transparent",
                background: "transparent",
                color: isActive ? "#1f6feb" : "#667085",
                padding: "0 14px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                fontSize: 13,
                fontWeight: isActive ? 700 : 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                borderRadius: 0,
              }}
            >
              <Icon size={16} />

              {tab.label}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => {
            const targetLecId = lectureId || lecture?.id;
            if (subjectId && lecturerId && targetLecId) {
              navigate(
                `/faculty/subjects/${subjectId}/lecturers/${lecturerId}/lectures/${targetLecId}/quiz-performance`
              );
              return;
            }
            if (targetLecId) {
              navigate(`/faculty/lectures/${targetLecId}/quiz-performance`);
              return;
            }
          }}
          style={{
            minHeight: 44,
            border: "none",
            borderBottom: "2px solid transparent",
            background: "transparent",
            color: "#667085",
            padding: "0 14px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            borderRadius: 0,
          }}
        >
          <BarChart3 size={16} />
          Quiz Performance
        </button>

        <button
          type="button"
          onClick={() => navigate(`/faculty/lectures/${lecture.id}/doubts`)}
          style={{
            minHeight: 44,
            border: "none",
            borderBottom: "2px solid transparent",
            background: "transparent",
            color: "#667085",
            padding: "0 14px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            borderRadius: 0,
          }}
        >
          <MessageCircleQuestion size={16} />
          Doubt Session
        </button>
      </section>

      {renderTabContent()}
    </div>
  );
}

export default FacultyLectureDetails;
