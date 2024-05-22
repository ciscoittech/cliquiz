import standardizeAnswer from '../utils/standardizeAnswer';
import { storeResults } from '../services/examService';

const displayQuestion = (rl, question, index, callback) => {
  console.log(`\nQuestion ${index + 1}: ${question.question}`);
  console.log(`A. ${question.options.A}`);
  console.log(`B. ${question.options.B}`);
  console.log(`C. ${question.options.C}`);
  console.log(`D. ${question.options.D}`);
  console.log(`E. ${question.options.E}`);
  
  rl.question('Your answer (A, B, C, D, E): ', (answer) => {
    const standardizedAnswer = standardizeAnswer(answer);
    callback(standardizedAnswer === question.answer, question);
  });
};

const startExam = async (rl, examDetails, questions) => {
  console.log(`Starting exam: ${examDetails.exam_name}`);

  const storedExam = await storeExamDetails(examDetails);
  await storeQuestions(storedExam.id, questions);

  let correctAnswers = 0;
  let currentIndex = 0;
  let answerResults = [];

  const askNextQuestion = () => {
    if (currentIndex < questions.length) {
      displayQuestion(rl, questions[currentIndex], currentIndex, (isCorrect, question) => {
        answerResults.push({
          userAnswer: isCorrect ? question.answer : '',
          isCorrect,
          questionId: question.id,
        });
        if (isCorrect) correctAnswers++;
        currentIndex++;
        askNextQuestion();
      });
    } else {
      storeResults(storedExam.id, answerResults);
      displayResults(correctAnswers, questions.length, answerResults);
      rl.close();
    }
  };

  const displayResults = (correctAnswers, totalQuestions, answerResults) => {
    console.log(`\nYou got ${correctAnswers} out of ${totalQuestions} questions correct.`);
    console.log('Detailed Results:');
    answerResults.forEach((result, index) => {
      console.log(`\nQuestion ${index + 1}: ${result.question}`);
      console.log(`Your Answer: ${result.userAnswer}`);
      console.log(`Correct Answer: ${result.correctAnswer}`);
      console.log(`Objective: ${result.objective}`);
      console.log(`Result: ${result.isCorrect ? 'Correct' : 'Incorrect'}`);
    });
  };

  askNextQuestion();
};

export default { startExam };
