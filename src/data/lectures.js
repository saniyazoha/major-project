export const lectureData = {
  "lecture-1": {
    code: "CS-301",
    week: "WEEK 1",
    title: "Intro to Operating Systems",
    shortTitle: "Intro to Operating Systems",
    lecturer: "Dr. Ananya Sharma",
    date: "Jan 15, 2026",
    duration: "45:00",

    transcript: [
      {
        time: "00:00",
        text: "Welcome to today's lecture on operating systems. We will begin by understanding what an operating system is and why it is essential in a computer system.",
      },
      {
        time: "00:42",
        text: "An operating system acts as an interface between the user, application software, and the computer hardware.",
      },
      {
        time: "01:30",
        text: "The major responsibilities of an operating system include process management, memory management, file management, device management, and security.",
      },
      {
        time: "02:25",
        text: "Process management allows the operating system to create, schedule, coordinate, and terminate processes.",
      },
      {
        time: "03:20",
        text: "Memory management tracks the use of main memory and allocates memory to programs when required.",
      },
    ],

    summary: [
      "Introduction to operating systems.",
      "Operating system as an interface between users, applications, and hardware.",
      "Major responsibilities of an operating system.",
      "Introduction to process management.",
      "Introduction to memory management.",
    ],

    concepts: [
      {
        title: "Operating System",
        description:
          "System software that manages hardware and software resources.",
      },
      {
        title: "Process Management",
        description:
          "The operating system function responsible for managing running processes.",
      },
      {
        title: "Memory Management",
        description:
          "The operating system function responsible for allocating and tracking memory.",
      },
      {
        title: "Resource Management",
        description: "The coordination and allocation of computer resources.",
      },
    ],

    flashcards: [
      {
        question: "What is an operating system?",
        answer:
          "An operating system is system software that manages hardware and software resources and provides services to programs.",
      },
      {
        question: "What is process management?",
        answer:
          "Process management controls the creation, scheduling, execution, and termination of processes.",
      },
      {
        question: "What is memory management?",
        answer:
          "Memory management tracks, allocates, and releases main memory for programs.",
      },
      {
        question: "Why is an operating system required?",
        answer:
          "It coordinates hardware and software resources and provides an interface for users and applications.",
      },
    ],

    quiz: [
      {
        question: "What is the primary role of an operating system?",
        options: [
          "Manage hardware and software resources",
          "Design computer hardware",
          "Create programming languages",
          "Replace application software",
        ],
        answer: 0,
      },
      {
        question: "Which function manages running programs?",
        options: [
          "File management",
          "Process management",
          "Device management",
          "Network management",
        ],
        answer: 1,
      },
      {
        question: "What does memory management control?",
        options: [
          "Internet access",
          "Memory allocation and release",
          "Keyboard layout",
          "User interface themes",
        ],
        answer: 1,
      },
      {
        question: "An operating system acts as an interface between:",
        options: [
          "User and hardware",
          "Only software applications",
          "Only network devices",
          "Only storage devices",
        ],
        answer: 0,
      },
    ],
  },

  "lecture-2": {
    code: "CS-205",
    week: "WEEK 2",
    title: "Memory Management Strategies",
    shortTitle: "Memory Management Strategies",
    lecturer: "Dr. Grace Hopper",
    date: "Jan 22, 2026",
    duration: "42:00",

    transcript: [
      {
        time: "00:00",
        text: "Today we will study memory management strategies used by operating systems.",
      },
      {
        time: "00:50",
        text: "Memory management determines how main memory is allocated to different processes.",
      },
      {
        time: "01:40",
        text: "Important concepts include paging, segmentation, virtual memory, and memory allocation.",
      },
      {
        time: "02:35",
        text: "Paging divides memory into fixed-size blocks called pages and frames.",
      },
      {
        time: "03:30",
        text: "Virtual memory allows programs to use more memory than is physically available by using secondary storage.",
      },
    ],

    summary: [
      "Introduction to memory management.",
      "Memory allocation strategies.",
      "Paging and frames.",
      "Segmentation concepts.",
      "Virtual memory.",
    ],

    concepts: [
      {
        title: "Paging",
        description:
          "A memory-management technique that divides memory into fixed-size blocks.",
      },
      {
        title: "Virtual Memory",
        description:
          "A technique that allows secondary storage to extend available memory.",
      },
      {
        title: "Segmentation",
        description:
          "A memory-management method that divides memory into logical segments.",
      },
      {
        title: "Memory Allocation",
        description: "The process of assigning memory space to processes.",
      },
    ],

    flashcards: [
      {
        question: "What is paging?",
        answer:
          "Paging divides memory into fixed-size pages and physical memory into frames.",
      },
      {
        question: "What is virtual memory?",
        answer:
          "Virtual memory uses secondary storage to extend the apparent amount of available main memory.",
      },
      {
        question: "What is segmentation?",
        answer:
          "Segmentation divides memory according to logical program sections.",
      },
      {
        question: "Why is memory allocation important?",
        answer:
          "It ensures that processes receive the memory they require while using system memory efficiently.",
      },
    ],

    quiz: [
      {
        question: "Paging divides memory into:",
        options: ["Files", "Pages and frames", "Networks", "Registers only"],
        answer: 1,
      },
      {
        question: "Virtual memory mainly uses:",
        options: [
          "Secondary storage",
          "Keyboard memory",
          "CPU registers only",
          "Network bandwidth",
        ],
        answer: 0,
      },
      {
        question: "Segmentation divides memory according to:",
        options: [
          "Logical program sections",
          "Random values",
          "Only fixed blocks",
          "Network addresses",
        ],
        answer: 0,
      },
    ],
  },

  "lecture-3": {
    code: "CS-410",
    week: "WEEK 3",
    title: "Advanced Network Architecture",
    shortTitle: "Advanced Network Architecture",
    lecturer: "Dr. Edgar Codd",
    date: "Jan 29, 2026",
    duration: "48:00",

    transcript: [
      {
        time: "00:00",
        text: "In this lecture we will study advanced concepts in network architecture.",
      },
      {
        time: "00:45",
        text: "A network architecture defines how devices, protocols, and communication services are organized.",
      },
      {
        time: "01:35",
        text: "Modern network architectures often use layered models to separate responsibilities.",
      },
      {
        time: "02:25",
        text: "Routing determines how packets move between networks.",
      },
      {
        time: "03:10",
        text: "Scalability, reliability, security, and performance are major design considerations.",
      },
    ],

    summary: [
      "Introduction to network architecture.",
      "Layered communication models.",
      "Routing concepts.",
      "Network scalability.",
      "Reliability and security considerations.",
    ],

    concepts: [
      {
        title: "Network Architecture",
        description:
          "The structural design of network devices, protocols, and communication services.",
      },
      {
        title: "Routing",
        description:
          "The process of selecting paths for packets across networks.",
      },
      {
        title: "Scalability",
        description: "The ability of a network to handle growth efficiently.",
      },
      {
        title: "Reliability",
        description:
          "The ability of a network to continue operating correctly under failures.",
      },
    ],

    flashcards: [
      {
        question: "What is network architecture?",
        answer:
          "Network architecture describes how network devices, protocols, and services are structured and connected.",
      },
      {
        question: "What is routing?",
        answer:
          "Routing is the process of selecting the path used to forward packets between networks.",
      },
      {
        question: "What is scalability in networking?",
        answer:
          "Scalability is the ability of a network to support increasing numbers of users, devices, and traffic.",
      },
      {
        question: "Why is reliability important?",
        answer:
          "Reliability ensures that communication continues correctly even when failures occur.",
      },
    ],

    quiz: [
      {
        question: "What does network architecture define?",
        options: [
          "Organization of devices and protocols",
          "Only file names",
          "Only CPU instructions",
          "Only database tables",
        ],
        answer: 0,
      },
      {
        question: "What is the purpose of routing?",
        options: [
          "Choose packet paths",
          "Allocate memory",
          "Create files",
          "Compile programs",
        ],
        answer: 0,
      },
      {
        question: "Which is an important network design consideration?",
        options: [
          "Scalability",
          "Font size",
          "Keyboard layout",
          "Screen brightness",
        ],
        answer: 0,
      },
    ],
  },
};

export const lectures = [
  {
    id: 1,
    dataId: "lecture-1",
    subjectId: "1",
    subject: "Operating Systems",
    subjectCode: "CS-301",
    batch: "Batch 2024-A",
    title: "Intro to Operating Systems",
    shortTitle: "Intro to Operating Systems",
    lecturer: "Dr. Ananya Sharma",
    lecturerId: "ananya-sharma",
    date: "Jan 15, 2026",
    duration: "45:00",
    status: "Processed",
    broadcastStatus: "Broadcast",
  },

  {
    id: 2,
    dataId: "lecture-2",
    subjectId: "2",
    subject: "Memory Management",
    subjectCode: "CS-205",
    batch: "Batch 2023-B",
    title: "Memory Management Strategies",
    shortTitle: "Memory Management Strategies",
    lecturer: "Dr. Grace Hopper",
    lecturerId: "grace-hopper",
    date: "Jan 22, 2026",
    duration: "42:00",
    status: "Processed",
    broadcastStatus: "Processing",
  },

  {
    id: 3,
    dataId: "lecture-3",
    subjectId: "3",
    subject: "Advanced Network Architecture",
    subjectCode: "CS-410",
    batch: "Batch 2024-A",
    title: "Advanced Network Architecture",
    shortTitle: "Advanced Network Architecture",
    lecturer: "Dr. Edgar Codd",
    lecturerId: "edgar-codd",
    date: "Jan 29, 2026",
    duration: "48:00",
    status: "Processed",
    broadcastStatus: "Draft",
  },
];
