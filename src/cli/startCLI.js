import readline from 'readline';
import { findClosestMatch, storeExamDetails, storeQuestions, storeResults } from '../services/examService';
import { generateQuestions, generateExamDetails } from '../utils/openai';
import standardizeAnswer from '../utils/standardizeAnswer';
import examCLI from './examCLI';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const startCLI = () => {
  rl.question('Enter the exam you want to take: ', async (input) => {
    const exams = await prisma.exam.findMany();
    let closestMatch = findClosestMatch(input, exams);

    if (!closestMatch) {
      const generatedExamDetails = await generateExamDetails(input);
      rl.question(`Do you want to take the generated exam for "${generatedExamDetails.exam_name}" by ${generatedExamDetails.vendor} (version ${generatedExamDetails.exam_number}) ? (yes/no): `, async (confirm) => {
        if (confirm.trim().toLowerCase() === 'yes') {
          const generatedQuestions = await generateQuestions(generatedExamDetails);
          examCLI.startExam(rl, generatedExamDetails, generatedQuestions.questions);
        } else {
          startCLI();
        }
      });
    } else {
      rl.question(`Found a match: ${closestMatch.vendor} ${closestMatch.exam_name} (${closestMatch.exam_number}). Do you want to take this exam? (yes/no): `, async (confirm) => {
        if (confirm.trim().toLowerCase() === 'yes') {
          const questions = await generateQuestions(closestMatch);
          examCLI.startExam(rl, closestMatch, questions.questions);
        } else {
          startCLI();
        }
      });
    }
  });
};

export default startCLI;
