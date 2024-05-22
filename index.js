import readline from 'readline';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Sample exams data
const exams = [
  {
    vendor: 'Cisco',
    exam_name: 'CCNA',
    exam_number: '200-301',
    objectives: ['Networking Fundamentals', 'Security Fundamentals']
  },
  {
    vendor: 'CompTIA',
    exam_name: 'A+',
    exam_number: '220-1001',
    objectives: ['Hardware', 'Networking', 'Mobile Devices']
  }
  // Additional exams can be added here
];

// Function to find the closest matching exam based on user input
const findClosestMatch = (input, exams) => {
  let closestMatch = null;
  let minDistance = Infinity;

  // Iterate over all exams to find the one with the minimum Levenshtein distance to the input
  exams.forEach(exam => {
    const distance = input.toLowerCase() === exam.exam_name.toLowerCase() ? 0 : Infinity;
    if (distance < minDistance) {
      minDistance = distance;
      closestMatch = exam;
    }
  });

  return closestMatch;
};

// Function to generate multiple-choice questions using OpenAI
const generateQuestions = async (examDetails, count = 5) => {
  // Construct the prompt for OpenAI
  const prompt = `Generate ${count} multiple-choice questions for the ${examDetails.vendor} ${examDetails.exam_name} (${examDetails.exam_number}) exam with the following objectives: ${examDetails.objectives.join(', ')}. Each question should have 5 options (A, B, C, D, E) and the correct answer should be indicated. Return the questions in the following JSON format:

{
  "questions": [
    {
      "question": "Question text?",
      "options": {
        "A": "Option 1",
        "B": "Option 2",
        "C": "Option 3",
        "D": "Option 4",
        "E": "Option 5"
      },
      "answer": "C",
      "objective": "Objective text"
    },
    ...
  ]
}`;

  // Request to OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: prompt }],
    model: "gpt-3.5-turbo",
  });

  // Parse and return the JSON response
  return JSON.parse(completion.choices[0].message.content.trim());
};

// Function to generate exam details using OpenAI
const generateExamDetails = async (input) => {
  const prompt = `Generate the vendor, exam name, exam version, and objectives for an IT certification exam named "${input}". Return the details in the following JSON format:

{
  "vendor": "Vendor name",
  "exam_name": "Exam name",
  "exam_number": "Exam version",
  "objectives": [
    "Objective 1",
    "Objective 2",
    ...
  ]
}`;

  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: prompt }],
    model: "gpt-3.5-turbo",
  });

  return JSON.parse(completion.choices[0].message.content.trim());
};

// Function to standardize user input to upper case
const standardizeAnswer = (answer) => {
  return answer.trim().toUpperCase();
};

// Function to display a single question and record the user's answer
const displayQuestion = (question, index, callback) => {
  console.log(`\nQuestion ${index + 1}: ${question.question}`);
  console.log(`A. ${question.options.A}`);
  console.log(`B. ${question.options.B}`);
  console.log(`C. ${question.options.C}`);
  console.log(`D. ${question.options.D}`);
  console.log(`E. ${question.options.E}`);
  
  // Prompt user for their answer
  rl.question('Your answer (A, B, C, D, E): ', (answer) => {
    // Standardize the user's answer to upper case
    const standardizedAnswer = standardizeAnswer(answer);
    // Callback function to handle the answer
    callback(standardizedAnswer === question.answer, question);
  });
};

// Set up readline interface for CLI input/output
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to start the CLI process
const startCLI = () => {
  const getUserExamChoice = async (input) => {
    let closestMatch = findClosestMatch(input, exams);

    if (!closestMatch) {
      // If no predefined exam is found, use OpenAI to generate exam details
      const generatedExamDetails = await generateExamDetails(input);

      rl.question(`Do you want to take the generated exam for "${generatedExamDetails.exam_name}" by ${generatedExamDetails.vendor} (version ${generatedExamDetails.exam_number}) ? (yes/no): `, async (confirm) => {
        if (confirm.trim().toLowerCase() === 'yes') {
          const generatedQuestions = await generateQuestions(generatedExamDetails);
          startExam(generatedExamDetails, generatedQuestions.questions);
        } else {
          rl.question('Enter the exam you want to take: ', getUserExamChoice);
        }
      });
    } else {
      rl.question(`Found a match: ${closestMatch.vendor} ${closestMatch.exam_name} (${closestMatch.exam_number}). Do you want to take this exam? (yes/no): `, async (confirm) => {
        if (confirm.trim().toLowerCase() === 'yes') {
          const questions = await generateQuestions(closestMatch);
          startExam(closestMatch, questions.questions);
        } else {
          rl.question('Enter the exam you want to take: ', getUserExamChoice);
        }
      });
    }
  };

  rl.question('Enter the exam you want to take: ', getUserExamChoice);
};

// Function to start the exam
const startExam = async (examDetails, questions) => {
  console.log(`Starting exam: ${examDetails.exam_name}`);

  let correctAnswers = 0;
  let currentIndex = 0;
  let answerResults = [];

  const askNextQuestion = () => {
    if (currentIndex < questions.length) {
      // Display the current question and record the user's answer
      displayQuestion(questions[currentIndex], currentIndex, (isCorrect, question) => {
        answerResults.push({
          question: question.question,
          userAnswer: isCorrect ? question.answer : '',
          correctAnswer: question.answer,
          objective: question.objective,
          isCorrect
        });
        if (isCorrect) correctAnswers++;
        currentIndex++;
        // Ask the next question if available
        askNextQuestion();
      });
    } else {
      // All questions have been answered, display results
      displayResults(correctAnswers, questions.length, answerResults);
    }
  };

  // Function to display the results
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
    rl.close();
  };

  // Start asking questions
  askNextQuestion();
};

// Start the CLI
startCLI();
