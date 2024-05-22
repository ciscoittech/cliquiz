import prisma from '../../prisma';

// Function to find the closest matching exam based on user input
const findClosestMatch = (input, exams) => {
  let closestMatch = null;
  let minDistance = Infinity;

  exams.forEach(exam => {
    const distance = input.toLowerCase() === exam.exam_name.toLowerCase() ? 0 : Infinity;
    if (distance < minDistance) {
      minDistance = distance;
      closestMatch = exam;
    }
  });

  return closestMatch;
};

// Function to store exam details in the database
const storeExamDetails = async (examDetails) => {
  return await prisma.exam.create({
    data: {
      vendor: examDetails.vendor,
      examName: examDetails.exam_name,
      examNumber: examDetails.exam_number,
      objectives: examDetails.objectives,
    },
  });
};

// Function to store questions in the database
const storeQuestions = async (examId, questions) => {
  const questionData = questions.map((q) => ({
    question: q.question,
    options: q.options,
    answer: q.answer,
    objective: q.objective,
    examId,
  }));
  return await prisma.question.createMany({
    data: questionData,
  });
};

// Function to store exam results in the database
const storeResults = async (examId, results) => {
  const resultData = results.map((r) => ({
    userAnswer: r.userAnswer,
    isCorrect: r.isCorrect,
    questionId: r.questionId,
    examId,
  }));
  return await prisma.result.createMany({
    data: resultData,
  });
};

export { findClosestMatch, storeExamDetails, storeQuestions, storeResults };
