const readline = require('readline');
const axios = require('axios');
const { getLevenshteinDistance } = require('fast-levenshtein');

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
  // Add more exams here
];

// Function to find the closest match
const findClosestMatch = (input, exams) => {
  let closestMatch = null;
  let minDistance = Infinity;

  exams.forEach(exam => {
    const distance = getLevenshteinDistance(input.toLowerCase(), exam.exam_name.toLowerCase());
    if (distance < minDistance) {
      minDistance = distance;
      closestMatch = exam;
    }
  });

  return closestMatch;
};

// Function to generate questions using OpenAI
const generateQuestions = async (exam) => {
  const prompt = `Generate 10 questions for the ${exam.vendor} ${exam.exam_name} (${exam.exam_number}) exam with the following objectives: ${exam.objectives.join(', ')}`;
  
  const response = await axios.post('https://api.openai.com/v1/engines/davinci/completions', {
    prompt,
    max_tokens: 150,
    n: 10
  }, {
    headers: {
      'Authorization': "sk-proj-PVleRNqc9M9J33MGLZFtT3BlbkFJQrMRKmvT8wuFuekRgesm"
    }
  });

  return response.data.choices.map(choice => choice.text.trim());
};

// Set up readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Start the CLI process
const startCLI = () => {
  rl.question('Enter the exam you want to take: ', async (input) => {
    const closestMatch = findClosestMatch(input, exams);

    if (closestMatch) {
      console.log(`Found a match: ${closestMatch.vendor} ${closestMatch.exam_name} (${closestMatch.exam_number})`);
      
      const initialQuestions = await generateQuestions(closestMatch);
      console.log('Here are your first 10 questions:');
      initialQuestions.forEach((question, index) => {
        console.log(`${index + 1}. ${question}`);
      });

      // Simulate fetching more questions in the background
      setTimeout(async () => {
        const moreQuestions = await generateQuestions(closestMatch);
        console.log('\nHere are the next set of questions:');
        moreQuestions.forEach((question, index) => {
          console.log(`${index + 11}. ${question}`);
        });
        
        rl.close();
      }, 5000); // Simulate delay for fetching more questions
    } else {
      console.log('No matching exam found.');
      rl.close();
    }
  });
};

// Start the CLI
startCLI();
