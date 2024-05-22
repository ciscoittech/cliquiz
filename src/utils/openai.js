import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const generateQuestions = async (examDetails, count = 5) => {
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

  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: prompt }],
    model: "gpt-3.5-turbo",
  });

  return JSON.parse(completion.choices[0].message.content.trim());
};

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

export { generateQuestions, generateExamDetails };
