export const lectureData = {
  "lecture-04": {
    code: "CS301",
    week: "WEEK 3",
    title: "Lecture 04: Neural Networks",
    shortTitle: "Lecture 04: Neural Networks",
    lecturer: "Prof. Alan Turing",
    date: "Oct 12, 2023",
    duration: "45:32",

    transcript: [
      {
        time: "00:00",
        text: "Welcome to today's lecture on neural networks. We'll cover basic ideas and examples.",
      },
      {
        time: "00:32",
        text: "A neural network is a computational model inspired by biological neurons.",
      },
      {
        time: "01:15",
        text: "The basic unit of a neural network is called a neuron which computes a weighted sum.",
      },
      {
        time: "02:05",
        text: "Activation functions are used to introduce non-linearity into the model.",
      },
    ],

    summary: [
      "Neural networks are inspired by biological neurons.",
      "Neurons receive inputs, apply weights and biases, and produce outputs.",
      "Activation functions introduce non-linearity.",
      "Forward propagation computes outputs while backpropagation updates weights.",
    ],

    concepts: [
      {
        title: "Neural Network",
        description:
          "A system of interconnected neurons that process information.",
      },
      {
        title: "Neuron",
        description:
          "The basic computational unit that applies weights and an activation.",
      },
      {
        title: "Weights",
        description: "Parameters that scale inputs to neurons.",
      },
      {
        title: "Bias",
        description: "An extra parameter added to a neuron's input.",
      },
      {
        title: "Activation Function",
        description: "Function introducing non-linearity, e.g., ReLU, sigmoid.",
      },
      {
        title: "Forward Propagation",
        description: "Passing inputs forward to compute outputs.",
      },
      {
        title: "Backpropagation",
        description: "An algorithm to update weights using gradients.",
      },
    ],

    flashcards: Array.from({ length: 24 }).map((_, i) => ({
      question: `Flashcard ${i + 1}: What is an important concept?`,
      answer: `Answer ${i + 1}: Concept explanation.`,
    })),

    quiz: [
      {
        question: "Which algorithm updates weights in neural networks?",
        options: [
          "Forward Propagation",
          "Backpropagation",
          "Clustering",
          "Sorting",
        ],
        answer: 1,
      },
      {
        question: "What introduces non-linearity into a neuron?",
        options: ["Weights", "Bias", "Activation Function", "Input Layer"],
        answer: 2,
      },
      {
        question: "What is the basic unit of a neural network?",
        options: ["Layer", "Neuron", "Weight", "Function"],
        answer: 1,
      },
      {
        question: "Forward propagation performs:",
        options: [
          "Weight update",
          "Compute outputs",
          "Normalize data",
          "Shuffle batches",
        ],
        answer: 1,
      },
      {
        question: "Bias in a neuron is:",
        options: ["A weight", "A constant added", "An activation", "A dataset"],
        answer: 1,
      },
      {
        question: "Which term describes the input layer?",
        options: ["Output Layer", "Hidden Layer", "Input Layer", "Activation"],
        answer: 2,
      },
      {
        question: "Which function is often used for non-linearity?",
        options: ["ReLU", "Sum", "Multiply", "Divide"],
        answer: 0,
      },
      {
        question: "Backpropagation uses which method?",
        options: [
          "Gradient Descent",
          "Breadth First Search",
          "Binary Search",
          "K-Means",
        ],
        answer: 0,
      },
      {
        question: "Weights are adjusted to minimize:",
        options: ["Loss", "Accuracy", "Size", "Time"],
        answer: 0,
      },
      {
        question: "What is a common activation?",
        options: ["Sigmoid", "JSON", "CSV", "HTML"],
        answer: 0,
      },
    ],
  },
  4: null,
};

// mirror id '4' to lecture-04 for easy lookup by id
lectureData["4"] = lectureData["lecture-04"];
