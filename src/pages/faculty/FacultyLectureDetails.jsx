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
} from "lucide-react";

import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { lectures } from "../../data/lectures";
import { subjects } from "../../data/subjects";

function FacultyLectureDetails() {
  const navigate = useNavigate();

  const { subjectId, lecturerId, lectureId } = useParams();

  const [activeTab, setActiveTab] = useState("transcript");

  /* =====================================================
     RESOLVE LECTURE
  ===================================================== */

  const lecture = useMemo(() => {
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
  }, [lectureId, lecturerId, subjectId]);

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
     PUBLICATION STATE
  ===================================================== */

  const publicationStorageKey = `faculty-lecture-publication-${
    lectureId || lecture?.id || "default"
  }`;

  const getInitialPublicationStatus = () => {
    const saved = localStorage.getItem(publicationStorageKey);

    if (saved) {
      return saved;
    }

    return "Broadcast";
  };

  const [publicationStatus, setPublicationStatus] = useState(
    getInitialPublicationStatus,
  );

  const [publishMessage, setPublishMessage] = useState("");

  const handleRepublish = () => {
    setPublicationStatus("Broadcast");

    localStorage.setItem(publicationStorageKey, "Broadcast");

    setPublishMessage(
      "Latest lecture updates have been published to students.",
    );
  };

  const handleWithdrawBroadcast = () => {
    setPublicationStatus("Withdrawn");

    localStorage.setItem(publicationStorageKey, "Withdrawn");

    setPublishMessage("Lecture broadcast has been withdrawn from students.");
  };

  /* =====================================================
     TRANSCRIPT STATE
  ===================================================== */

  const initialTranscriptSegments = [
    {
      id: 1,
      time: "00:00",
      text: "Welcome to today's lecture on operating systems. In this lecture, we will understand the basic purpose of an operating system and the major responsibilities it performs in a computer system.",
      highlighted: false,
    },
    {
      id: 2,
      time: "00:38",
      text: "An operating system is system software that manages computer hardware, software resources, and provides common services for computer programs. It acts as an interface between the user and the computer hardware.",
      highlighted: false,
    },
    {
      id: 3,
      time: "01:12",
      text: "One important responsibility of an operating system is process management. A process is a program that is currently being executed. The operating system creates processes, schedules them, allocates CPU time, and terminates them when execution is complete.",
      highlighted: true,
    },
    {
      id: 4,
      time: "01:58",
      text: "Another major responsibility is memory management. The operating system keeps track of which parts of memory are being used, allocates memory to programs, and releases memory when it is no longer required.",
      highlighted: false,
    },
    {
      id: 5,
      time: "02:46",
      text: "File management allows the operating system to create, organize, store, retrieve, and delete files. It also manages directories, file permissions, and access to stored information.",
      highlighted: false,
    },
    {
      id: 6,
      time: "03:25",
      text: "Device management allows the operating system to communicate with hardware devices such as keyboards, printers, storage devices, displays, and network adapters using device drivers.",
      highlighted: false,
    },
    {
      id: 7,
      time: "04:10",
      text: "The operating system also provides security and access control. It protects system resources from unauthorized access using authentication, permissions, user mode, kernel mode, and other protection mechanisms.",
      highlighted: false,
    },
    {
      id: 8,
      time: "04:55",
      text: "To summarize, the operating system coordinates hardware, software, processes, memory, files, devices, and security so that applications can execute efficiently and users can interact with the computer system.",
      highlighted: false,
    },
  ];

  const [transcriptSegments, setTranscriptSegments] = useState(
    initialTranscriptSegments,
  );

  const [draftTranscriptSegments, setDraftTranscriptSegments] = useState(
    initialTranscriptSegments,
  );

  const [isEditingTranscript, setIsEditingTranscript] = useState(false);

  /* =====================================================
     NOTES STATE
  ===================================================== */

  const defaultNotes = `Operating System – Lecture Notes

1. Introduction to Operating Systems

An Operating System is system software that manages computer hardware and software resources.

It acts as an interface between:
• Users
• Application software
• Computer hardware

2. Major Responsibilities of an Operating System

The operating system is responsible for:

• Process management
• Memory management
• File management
• Device management
• Security and access control
• Input and output management

3. Process Management

A process is a program that is currently being executed.

The Operating System is responsible for:
• Creating processes
• Scheduling processes
• Allocating CPU time
• Terminating processes
• Managing communication between processes

4. Memory Management

Memory management controls how the computer's main memory is used.

The operating system:
• Tracks memory usage
• Allocates memory to programs
• Releases unused memory
• Prevents programs from incorrectly accessing each other's memory

5. File Management

The Operating System manages files and directories.

Its responsibilities include:
• Creating files
• Deleting files
• Organizing folders
• Controlling file access
• Managing file permissions

6. Device Management

The Operating System communicates with hardware devices through device drivers.

Examples include:
• Keyboard
• Mouse
• Printer
• Hard disk
• Display
• Network devices

7. Security and Access Control

The Operating System protects system resources from unauthorized access.

Security mechanisms include:
• User authentication
• Password protection
• Access permissions
• User and kernel modes

8. Key Takeaway

The Operating System acts as the main controller of a computer system. It coordinates hardware, software, memory, processes, devices, files, and security so that applications can run efficiently.`;

  const [notes, setNotes] = useState(defaultNotes);

  const [draftNotes, setDraftNotes] = useState(defaultNotes);

  const [isEditingNotes, setIsEditingNotes] = useState(false);

  /* =====================================================
     FLASHCARDS STATE
  ===================================================== */

  const initialFlashcards = [
    {
      id: 1,
      question: "What is an Operating System?",
      answer:
        "An Operating System is system software that manages hardware, software resources, and provides services for computer programs.",
    },
    {
      id: 2,
      question: "What is process management?",
      answer:
        "Process management is the operating system function responsible for creating, scheduling, coordinating, and terminating processes.",
    },
    {
      id: 3,
      question: "What is memory management?",
      answer:
        "Memory management is the process of tracking, allocating, and releasing main memory for programs and processes.",
    },
    {
      id: 4,
      question: "What does file management do?",
      answer:
        "File management organizes, stores, retrieves, creates, deletes, and controls access to files and directories.",
    },
    {
      id: 5,
      question: "Why are device drivers required?",
      answer:
        "Device drivers allow the operating system to communicate with and control hardware devices.",
    },
    {
      id: 6,
      question: "What is the purpose of access control?",
      answer:
        "Access control prevents unauthorized users or programs from accessing protected system resources.",
    },
  ];

  const [flashcards, setFlashcards] = useState(initialFlashcards);

  const [draftFlashcards, setDraftFlashcards] = useState(initialFlashcards);

  const [isEditingFlashcards, setIsEditingFlashcards] = useState(false);

  /* =====================================================
     QUIZ STATE
  ===================================================== */

  const initialQuizQuestions = [
    {
      id: 1,
      question: "What is the primary purpose of an operating system?",
      options: [
        "To manage hardware and software resources",
        "To design computer hardware",
        "To create programming languages",
        "To replace application software",
      ],
      correctAnswer: 0,
    },
    {
      id: 2,
      question: "Which operating system function manages running programs?",
      options: [
        "File management",
        "Process management",
        "Device management",
        "Network management",
      ],
      correctAnswer: 1,
    },
    {
      id: 3,
      question: "What does memory management mainly control?",
      options: [
        "Internet access",
        "User passwords",
        "Allocation and release of main memory",
        "Keyboard input",
      ],
      correctAnswer: 2,
    },
    {
      id: 4,
      question:
        "What allows the operating system to communicate with hardware?",
      options: ["Text editors", "Device drivers", "Web browsers", "Compilers"],
      correctAnswer: 1,
    },
  ];

  const [quizQuestions, setQuizQuestions] = useState(initialQuizQuestions);

  const [draftQuizQuestions, setDraftQuizQuestions] =
    useState(initialQuizQuestions);

  const [isEditingQuiz, setIsEditingQuiz] = useState(false);

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

  const handleStudentProgress = () => {
    navigate("/faculty/student-progress");
  };

  /* =====================================================
     TRANSCRIPT ACTIONS
  ===================================================== */

  const handleEditTranscript = () => {
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

  const handleSaveTranscript = () => {
    setTranscriptSegments(
      draftTranscriptSegments.map((segment) => ({
        ...segment,
      })),
    );

    setIsEditingTranscript(false);

    setPublishMessage(
      "Transcript updated. Re-publish the lecture to make this version available to students.",
    );
  };

  const handleCancelTranscript = () => {
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
     TRANSCRIPT
  ===================================================== */

  const renderTranscript = () => {
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
              >
                <X size={15} />
                Cancel
              </button>

              <button
                type="button"
                className="primary-action-button"
                onClick={handleSaveTranscript}
              >
                <Save size={15} />
                Save Changes
              </button>
            </div>
          )}
        </div>

        <div
          style={{
            padding: "8px 14px 14px",
          }}
        >
          {segmentsToRender.map((segment) => (
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
          ))}
        </div>
      </div>
    );
  };

  /* =====================================================
     NOTES
  ===================================================== */

  const renderNotes = () => (
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
              {notes}
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
          <p className="eyebrow">KEY TOPICS</p>

          <div
            style={{
              display: "grid",
              gap: 8,
              marginTop: 14,
            }}
          >
            {[
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

  /* =====================================================
     FLASHCARDS
  ===================================================== */

  const renderFlashcards = () => {
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
          if (subjectId && lecturerId && lectureId) {
            navigate(
              `/faculty/subjects/${subjectId}/lecturers/${lecturerId}/lectures/${lectureId}/analytics`,
            );

            return;
          }

          navigate(
            `/faculty/analytics/${subject?.id || "subject"}/${lecturerId || "lecturer"}/${lecture?.id}`,
          );
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
          onClick={handleRepublish}
        >
          <RefreshCw size={15} />

          {publicationStatus === "Withdrawn"
            ? "Publish lecture"
            : "Re-publish updates"}
        </button>

        <button
          type="button"
          className="secondary-action-button"
          onClick={handleWithdrawBroadcast}
          disabled={publicationStatus === "Withdrawn"}
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
          onClick={handleStudentProgress}
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
          <Users size={16} />
          Student Progress
        </button>
      </section>

      {renderTabContent()}
    </div>
  );
}

export default FacultyLectureDetails;
