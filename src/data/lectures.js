export const lectureData = {
  "lecture-04": {
    code: "CS301",
    week: "WEEK 3",
    title: "Introduction to Machine Learning Models",
    shortTitle: "Lecture 04: Neural Networks",
    lecturer: "Prof. Alan Turing",
    date: "Oct 12, 2023",
    duration: "1h 15m",

    transcript: [
      {
        time: "00:00",
        text: "Alright, let's get started. Welcome back, everyone. Today we are transitioning from traditional statistical methods into the core concepts of machine learning models.",
      },
      {
        time: "02:15",
        text: "Before we dive into the mathematics, I want to conceptualize what we are actually trying to achieve. At its simplest, a machine learning model is just a function.",
      },
      {
        time: "14:32",
        text: "This brings us to the concept of gradient descent. This is arguably the most important optimization algorithm you will learn in this course.",
      },
      {
        time: "18:45",
        text: "Now, there are challenges here. What if you hit a small dip that isn't the absolute bottom? We call that a local minimum.",
      },
      {
        time: "22:10",
        text: "Let's look at the mathematical notation for a moment. The cost function, usually denoted as J of theta, represents how wrong our current model is.",
      },
    ],

    summary: [
      "Transition from basic statistics to machine learning concepts.",
      "Definition of machine learning models as mapping functions.",
      "Introduction to Gradient Descent optimization.",
      "Understanding local and global minimum problems.",
      "Cost functions measure how wrong the current model is.",
    ],

    concepts: [
      {
        title: "Gradient Descent",
        description:
          "An optimization algorithm used for minimizing the cost function.",
      },
      {
        title: "Machine Learning Model",
        description:
          "A mathematical function that learns patterns from historical data.",
      },
      {
        title: "Local Minimum",
        description:
          "A point where the function has a lower value than nearby points.",
      },
      {
        title: "Cost Function",
        description:
          "A function that measures the error produced by a machine learning model.",
      },
    ],

    flashcards: [
      {
        question: "What is Gradient Descent?",
        answer:
          "Gradient Descent is an optimization algorithm used to minimize a cost or loss function.",
      },
      {
        question: "What is a Cost Function?",
        answer:
          "A cost function measures how far the model's predictions are from the expected results.",
      },
      {
        question: "What is a Local Minimum?",
        answer:
          "A local minimum is a point where the function value is lower than surrounding points.",
      },
      {
        question: "Why is Gradient Descent used?",
        answer:
          "It is used to iteratively update model parameters in order to reduce prediction error.",
      },
    ],

    quiz: [
      {
        question:
          "Which optimization algorithm is commonly used to minimize the cost function?",
        options: [
          "Binary Search",
          "Gradient Descent",
          "Breadth First Search",
          "K-Means",
        ],
        answer: 1,
      },
      {
        question: "What does a cost function measure?",
        options: [
          "Model size",
          "Training time",
          "Prediction error",
          "Number of features",
        ],
        answer: 2,
      },
      {
        question: "What is a local minimum?",
        options: [
          "The highest point",
          "A nearby lowest point",
          "The starting point",
          "The global maximum",
        ],
        answer: 1,
      },
      {
        question: "Machine learning models learn patterns from:",
        options: [
          "Historical data",
          "Only images",
          "Only text",
          "Random values",
        ],
        answer: 0,
      },
      {
        question: "What is the purpose of optimization?",
        options: [
          "Increase error",
          "Minimize the cost function",
          "Delete data",
          "Increase file size",
        ],
        answer: 1,
      },
    ],
  },
};

export const lectures = [
  {
    id: 1,
    subjectId: "1",
    subject: "Software Engineering",
    title: "Lecture 01: Requirements Engineering",
    shortTitle: "Requirements Engineering",
    lecturer: "Prof. Ada Lovelace",
    lecturerId: "ada-lovelace",
    date: "Aug 10, 2023",
    duration: "38:00",
    status: "Processed",
  },
  {
    id: 2,
    subjectId: "1",
    subject: "Software Engineering",
    title: "Lecture 02: Software Design Patterns",
    shortTitle: "Design Patterns",
    lecturer: "Prof. Ada Lovelace",
    lecturerId: "ada-lovelace",
    date: "Aug 17, 2023",
    duration: "42:10",
    status: "Processed",
  },
  {
    id: 3,
    subjectId: "2",
    subject: "Data Structures",
    title: "Data Structures - Trees",
    shortTitle: "Trees",
    lecturer: "Dr. Grace Hopper",
    lecturerId: "grace-hopper",
    date: "Sep 21, 2023",
    duration: "35:00",
    status: "Processed",
  },
  {
    id: 4,
    subjectId: "2",
    subject: "Data Structures",
    title: "Data Structures - Graphs",
    shortTitle: "Graphs",
    lecturer: "Dr. Grace Hopper",
    lecturerId: "grace-hopper",
    date: "Sep 28, 2023",
    duration: "36:20",
    status: "Processed",
  },
  {
    id: 5,
    subjectId: "3",
    subject: "Database Management",
    title: "DBMS - Relational Models",
    shortTitle: "Relational Models",
    lecturer: "Dr. Edgar Codd",
    lecturerId: "edgar-codd",
    date: "Oct 01, 2023",
    duration: "40:00",
    status: "Processed",
  },
  {
    id: 6,
    subjectId: "3",
    subject: "Database Management",
    title: "DBMS - Normalization",
    shortTitle: "Normalization",
    lecturer: "Dr. Edgar Codd",
    lecturerId: "edgar-codd",
    date: "Oct 08, 2023",
    duration: "38:15",
    status: "Processed",
  },
  {
    id: 7,
    subjectId: "4",
    subject: "Data Mining",
    title: "Data Mining - Association Rules",
    shortTitle: "Association Rules",
    lecturer: "Dr. Marie Curie",
    lecturerId: "marie-curie",
    date: "Oct 10, 2023",
    duration: "33:00",
    status: "Processed",
  },
  {
    id: 8,
    subjectId: "4",
    subject: "Data Mining",
    title: "Data Mining - Clustering",
    shortTitle: "Clustering",
    lecturer: "Dr. Marie Curie",
    lecturerId: "marie-curie",
    date: "Oct 17, 2023",
    duration: "37:20",
    status: "Processed",
  },
  {
    id: 9,
    subjectId: "5",
    subject: "Computer Science 301",
    title: "Lecture 03: Perceptrons",
    shortTitle: "Perceptrons",
    lecturer: "Prof. Alan Turing",
    lecturerId: "alan-turing",
    date: "Oct 05, 2023",
    duration: "40:10",
    status: "Processed",
  },
  {
    id: 10,
    subjectId: "5",
    subject: "Computer Science 301",
    title: "Lecture 04: Neural Networks",
    shortTitle: "Lecture 04: Neural Networks",
    lecturer: "Prof. Alan Turing",
    lecturerId: "alan-turing",
    date: "Oct 12, 2023",
    duration: "45:32",
    status: "Processed",
  },
];
