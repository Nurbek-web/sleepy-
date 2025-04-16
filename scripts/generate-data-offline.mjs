// Script to generate offline data for Kazakh users
import fs from 'fs';
import path from 'path';

// Fixed list of 24 authentic Kazakh names (12 male, 12 female)
const kazakhUsers = [
  // Male students
  { name: "Aidar Zhumadilov", gender: "male", grade: "9", email: "student1@sleepystudy.kz" },
  { name: "Nursultan Akhmetov", gender: "male", grade: "10", email: "student2@sleepystudy.kz" },
  { name: "Yerbol Satbayev", gender: "male", grade: "11", email: "student3@sleepystudy.kz" },
  { name: "Dias Tulegenov", gender: "male", grade: "9", email: "student4@sleepystudy.kz" },
  { name: "Arman Utemuratov", gender: "male", grade: "10", email: "student5@sleepystudy.kz" },
  { name: "Nurlan Kozhabekov", gender: "male", grade: "11", email: "student6@sleepystudy.kz" },
  { name: "Daniyar Bekturov", gender: "male", grade: "12", email: "student7@sleepystudy.kz" },
  { name: "Timur Auezov", gender: "male", grade: "9", email: "student8@sleepystudy.kz" },
  { name: "Azamat Sultanbekov", gender: "male", grade: "10", email: "student9@sleepystudy.kz" },
  { name: "Samat Temirgaliyev", gender: "male", grade: "11", email: "student10@sleepystudy.kz" },
  { name: "Yerlan Nurpeisov", gender: "male", grade: "12", email: "student11@sleepystudy.kz" },
  { name: "Bolat Nurmukhanov", gender: "male", grade: "10", email: "student12@sleepystudy.kz" },
  
  // Female students
  { name: "Aizhan Mukhamejanova", gender: "female", grade: "9", email: "student13@sleepystudy.kz" },
  { name: "Madina Esenova", gender: "female", grade: "10", email: "student14@sleepystudy.kz" },
  { name: "Aliya Nurpeisova", gender: "female", grade: "11", email: "student15@sleepystudy.kz" },
  { name: "Dinara Smagulova", gender: "female", grade: "12", email: "student16@sleepystudy.kz" },
  { name: "Assel Bektursynova", gender: "female", grade: "9", email: "student17@sleepystudy.kz" },
  { name: "Gulmira Nurbekova", gender: "female", grade: "10", email: "student18@sleepystudy.kz" },
  { name: "Ainur Dauletova", gender: "female", grade: "11", email: "student19@sleepystudy.kz" },
  { name: "Zarina Kaliyeva", gender: "female", grade: "12", email: "student20@sleepystudy.kz" },
  { name: "Saule Zhanseitova", gender: "female", grade: "9", email: "student21@sleepystudy.kz" },
  { name: "Aigerim Baitasova", gender: "female", grade: "10", email: "student22@sleepystudy.kz" },
  { name: "Gulnaz Orazova", gender: "female", grade: "11", email: "student23@sleepystudy.kz" },
  { name: "Akmaral Tulegenova", gender: "female", grade: "12", email: "student24@sleepystudy.kz" }
];

// Helper functions
const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomFloat = (min, max, decimals = 1) => {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimals));
};

// Date Helper functions
const getWeekdaysBetweenDates = (startDate, endDate) => {
  const weekdays = [];
  const currentDate = new Date(startDate);
  
  // Iterate through each day
  while (currentDate <= endDate) {
    // Check if it's a weekday (1-5 are Monday to Friday)
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      weekdays.push(new Date(currentDate));
    }
    
    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return weekdays;
};

// Generate sleep entry for a user
const generateSleepEntry = (user, date) => {
  // Base parameters with some randomness
  const isMale = user.gender === "male";
  const gradeNum = parseInt(user.grade);
  
  // Generate bed time (between 9:00 PM and 12:30 AM)
  const bedHour = getRandomInt(21, 24);
  const bedMinute = getRandomInt(0, 59);
  
  const bedTime = new Date(date);
  bedTime.setHours(bedHour, bedMinute, 0, 0);
  
  // If bed time is after midnight, adjust the date to previous day
  if (bedHour === 24) {
    bedTime.setHours(0);
    bedTime.setDate(bedTime.getDate() + 1);
  }
  
  // Generate sleep duration (6-9 hours with weighted distribution)
  // Teenagers need more sleep, but often don't get enough
  let sleepDuration;
  
  // Grade-based adjustments (higher grades tend to sleep less)
  const gradeFactor = Math.max(0, (12 - gradeNum) / 10); // 0.3 for grade 9, 0 for grade 12
  
  // Gender-based slight adjustments (studies show females tend to need slightly more sleep on average)
  const genderFactor = isMale ? 0 : 0.2;
  
  // Random factor for natural variation
  const randomFactor = Math.random() * 0.8 - 0.4; // -0.4 to 0.4
  
  // Calculate base sleep duration
  const baseDuration = 7.5;
  
  // Apply factors
  sleepDuration = baseDuration + gradeFactor + genderFactor + randomFactor;
  
  // Ensure it's within realistic bounds
  sleepDuration = Math.max(5, Math.min(10, sleepDuration));
  
  // Round to 1 decimal place
  sleepDuration = Math.round(sleepDuration * 10) / 10;
  
  // Calculate wake time based on bed time and sleep duration
  const wakeTime = new Date(bedTime);
  wakeTime.setMinutes(wakeTime.getMinutes() + Math.round(sleepDuration * 60));
  
  // Sleep quality (1-5 scale)
  const sleepQuality = getRandomFloat(2.5, 4.5, 1);
  
  // Screen time before bed (0-5 hours)
  const screenTime = getRandomFloat(1, 4, 1);
  
  // Caffeine intake (0-400 mg, weighted towards lower values)
  const caffeineIntake = getRandomInt(0, 100) < 70 
    ? getRandomInt(0, 150) // 70% chance: 0-150 mg
    : getRandomInt(150, 300); // 30% chance: 150-300 mg
  
  // Stress level (1-5 scale)
  const stressLevel = getRandomFloat(1, 5, 1);
  
  return {
    userId: user.id, // Will be a generated ID
    date: date.toISOString(),
    bedTime: bedTime.toISOString(),
    wakeTime: wakeTime.toISOString(),
    sleepDuration,
    sleepQuality,
    screenTime,
    caffeineIntake,
    stressLevel,
    createdAt: new Date().toISOString()
  };
};

// Generate test questions and answers
const generateTestQuestions = (difficulty = 'medium') => {
  // Define possible test questions by difficulty
  const questionsByDifficulty = {
    easy: [
      { question: "2 + 2 = ?", options: ["3", "4", "5", "6"], correctAnswer: 1 },
      { question: "7 - 3 = ?", options: ["2", "3", "4", "5"], correctAnswer: 2 },
      { question: "8 × 2 = ?", options: ["14", "16", "18", "20"], correctAnswer: 1 },
      { question: "10 ÷ 5 = ?", options: ["1", "2", "3", "5"], correctAnswer: 1 },
      { question: "What comes next: 2, 4, 6, 8, ?", options: ["9", "10", "12", "14"], correctAnswer: 1 },
      { question: "If a car travels at 60 km/h, how far will it go in 1 hour?", options: ["30 km", "60 km", "90 km", "120 km"], correctAnswer: 1 },
      { question: "Complete the pattern: A, C, E, G, ?", options: ["H", "I", "J", "K"], correctAnswer: 1 },
      { question: "Which of these is a primary color?", options: ["Green", "Orange", "Red", "Purple"], correctAnswer: 2 }
    ],
    medium: [
      { question: "If 3x - 7 = 14, what is x?", options: ["5", "7", "8", "10"], correctAnswer: 1 },
      { question: "25% of 80 is equal to?", options: ["15", "20", "25", "40"], correctAnswer: 1 },
      { question: "Complete the sequence: 3, 6, 12, 24, ?", options: ["36", "48", "52", "60"], correctAnswer: 0 },
      { question: "If a train travels at 80 km/h, how long will it take to cover 200 km?", options: ["2 hours", "2.5 hours", "3 hours", "4 hours"], correctAnswer: 0 },
      { question: "The average of 5, 10, 15 and 20 is?", options: ["10", "12.5", "15", "50"], correctAnswer: 1 },
      { question: "If a shirt costs $25 with a 20% discount, what was the original price?", options: ["$20", "$28", "$30", "$31.25"], correctAnswer: 3 },
      { question: "What is the next letter pattern: WXY, UVW, STU, ?", options: ["QRS", "PQR", "RST", "TUV"], correctAnswer: 1 },
      { question: "If all cats have tails, and Fluffy is a cat, then...", options: ["All animals have tails", "Fluffy has a tail", "Fluffy is an animal", "All tails belong to cats"], correctAnswer: 1 }
    ],
    hard: [
      { question: "If log(x) = 2, what is x?", options: ["10", "20", "100", "1000"], correctAnswer: 2 },
      { question: "Find the derivative of f(x) = 3x² + 2x - 1", options: ["6x + 2", "6x - 2", "3x² + 2", "6x² + 2x"], correctAnswer: 0 },
      { question: "A factory produces 1000 items, of which 5% are defective. If 3 items are selected at random, what is the probability all are non-defective?", options: ["0.857", "0.875", "0.900", "0.950"], correctAnswer: 0 },
      { question: "In a right triangle, if one leg is 5 and the hypotenuse is 13, what is the length of the other leg?", options: ["8", "12", "11", "√144"], correctAnswer: 2 },
      { question: "What is the value of x in the equation 2^(x+1) = 32?", options: ["3", "4", "5", "16"], correctAnswer: 1 },
      { question: "If A implies B, and B implies C, then...", options: ["A implies C", "C implies A", "A and C are equivalent", "None of the above"], correctAnswer: 0 },
      { question: "Solve for x: 3x - log(x) = 10", options: ["3", "3.5", "4", "4.5"], correctAnswer: 1 },
      { question: "In a study, 70% of participants were female. If there were 210 females, how many participants were there in total?", options: ["280", "300", "350", "420"], correctAnswer: 0 }
    ]
  };
  
  // Choose difficulty
  const questions = questionsByDifficulty[difficulty];
  
  // Randomly select 5 questions
  const selectedQuestions = [];
  const questionIndices = new Set();
  
  while (questionIndices.size < 5) {
    const index = getRandomInt(0, questions.length - 1);
    if (!questionIndices.has(index)) {
      questionIndices.add(index);
      selectedQuestions.push(questions[index]);
    }
  }
  
  return selectedQuestions;
};

// Generate a test result for a user
const generateTestResult = (user, date, sleepEntry) => {
  try {
    // Calculate expected performance based on sleep data (0-100 scale)
    let expectedPerformance = 70; // Base performance
    
    // Sleep duration impact (optimal is 8 hours)
    if (sleepEntry.sleepDuration >= 8) {
      expectedPerformance += 10;
    } else if (sleepEntry.sleepDuration >= 7) {
      expectedPerformance += 5;
    } else if (sleepEntry.sleepDuration <= 5) {
      expectedPerformance -= 15;
    } else if (sleepEntry.sleepDuration <= 6) {
      expectedPerformance -= 10;
    }
    
    // Sleep quality impact
    expectedPerformance += (sleepEntry.sleepQuality - 3) * 5;
    
    // Screen time impact (negative)
    expectedPerformance -= Math.max(0, sleepEntry.screenTime - 2) * 2;
    
    // Caffeine impact (small positive for moderate consumption)
    if (sleepEntry.caffeineIntake > 0 && sleepEntry.caffeineIntake <= 150) {
      expectedPerformance += 3;
    } else if (sleepEntry.caffeineIntake > 150) {
      expectedPerformance -= 2;
    }
    
    // Stress level impact (negative)
    expectedPerformance -= (sleepEntry.stressLevel - 3) * 3;
    
    // Adjust by user grade (higher grades perform better on average)
    const gradeNum = parseInt(user.grade);
    expectedPerformance += (gradeNum - 9) * 2;
    
    // Gender differences (subtle)
    if (user.gender === 'female') {
      expectedPerformance += 2; // Slightly higher on average for cognitive tasks
    }
    
    // Add randomness
    expectedPerformance += getRandomInt(-10, 10);
    
    // Ensure performance is between 0 and 100
    expectedPerformance = Math.max(0, Math.min(100, expectedPerformance));
    
    // Determine difficulty level based on expected performance
    let difficulty;
    if (expectedPerformance >= 85) {
      difficulty = 'hard';
    } else if (expectedPerformance >= 60) {
      difficulty = 'medium';
    } else {
      difficulty = 'easy';
    }
    
    // Generate test questions
    const questions = generateTestQuestions(difficulty);
    
    // Generate random answers based on expected performance
    const answers = [];
    let score = 0;
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      // Higher expected performance means higher chance of correct answer
      const correctProbability = expectedPerformance / 100;
      
      if (Math.random() <= correctProbability) {
        // Correct answer
        answers.push(question.correctAnswer);
        score += 20; // Each question is worth 20 points (5 questions = 100 points max)
      } else {
        // Incorrect answer - choose randomly among wrong answers
        const wrongOptions = [0, 1, 2, 3].filter(opt => opt !== question.correctAnswer);
        const randomWrongAnswer = wrongOptions[getRandomInt(0, wrongOptions.length - 1)];
        answers.push(randomWrongAnswer);
      }
    }
    
    // Time to complete the test (between 5-15 minutes)
    // Faster completion for higher performance
    const baseMinutes = 15 - (expectedPerformance / 20);
    const completionMinutes = Math.max(5, Math.min(15, baseMinutes + getRandomInt(-2, 2)));
    
    // Generate start and end times
    // Tests typically taken during school hours (8 AM - 3 PM)
    const startHour = getRandomInt(8, 15);
    const startMinute = getRandomInt(0, 59);
    
    const startTime = new Date(date);
    startTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + completionMinutes);
    
    // Alertness rating (1-5)
    // Correlates with expected performance
    const alertnessRating = Math.min(5, Math.max(1, Math.round(expectedPerformance / 20)));
    
    // Create the test result object
    return {
      userId: user.id,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      score,
      alertnessRating,
      questions: questions.map((q, i) => ({
        question: q.question,
        options: q.options,
        userAnswer: answers[i],
        correctAnswer: q.correctAnswer
      })),
      difficulty,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error generating test result:`, error);
    return null;
  }
};

// Generate a simple ID
const generateId = () => {
  return 'user_' + Math.random().toString(36).substring(2, 15);
};

// Main function to create data
const generateOfflineData = async () => {
  try {
    console.log("Generating offline data for Kazakh users...");
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }
    
    // Assign IDs to users
    const usersWithIds = kazakhUsers.map(user => ({
      ...user,
      id: generateId(),
      role: "student",
      createdAt: new Date().toISOString()
    }));
    
    // Save users to file
    fs.writeFileSync(
      path.join(dataDir, 'users.json'),
      JSON.stringify(usersWithIds, null, 2)
    );
    
    console.log(`✅ Generated ${usersWithIds.length} users`);
    
    // Set date range: from March 27, 2023 to current date (or shorter period for testing)
    const startDate = new Date('2023-03-27T00:00:00Z');
    const endDate = new Date();
    
    // Get all weekdays in the range
    const dateRange = getWeekdaysBetweenDates(startDate, endDate);
    
    console.log(`Generating data for ${dateRange.length} weekdays from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
    
    // Create arrays to store all sleep entries and test results
    const allSleepEntries = [];
    const allTestResults = [];
    
    // Generate data for each user
    for (const user of usersWithIds) {
      console.log(`Processing user: ${user.name} (${user.email})`);
      
      let userSleepEntries = [];
      let userTestResults = [];
      
      // Generate data for each date
      for (const date of dateRange) {
        // Generate sleep entry
        const sleepEntry = generateSleepEntry(user, date);
        userSleepEntries.push(sleepEntry);
        allSleepEntries.push(sleepEntry);
        
        // Generate test result
        const testResult = generateTestResult(user, date, sleepEntry);
        if (testResult) {
          userTestResults.push(testResult);
          allTestResults.push(testResult);
        }
      }
      
      console.log(`✅ Generated ${userSleepEntries.length} sleep entries and ${userTestResults.length} test results for ${user.name}`);
    }
    
    // Save all data to files
    fs.writeFileSync(
      path.join(dataDir, 'sleep-entries.json'),
      JSON.stringify(allSleepEntries, null, 2)
    );
    
    fs.writeFileSync(
      path.join(dataDir, 'test-results.json'),
      JSON.stringify(allTestResults, null, 2)
    );
    
    console.log(`✅ Generated a total of ${allSleepEntries.length} sleep entries and ${allTestResults.length} test results`);
    console.log(`✅ Data files saved to the 'data' directory`);
    
  } catch (error) {
    console.error("Error generating data:", error);
  }
};

// Parse command line arguments for options
const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    userCount: 24,  // Default to all users
    dayCount: 0,    // Default to all days
    startDate: new Date('2023-03-27T00:00:00Z')  // Default start date
  };
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--users' && i + 1 < args.length) {
      options.userCount = parseInt(args[i + 1]);
    } else if (args[i] === '--days' && i + 1 < args.length) {
      options.dayCount = parseInt(args[i + 1]);
    } else if (args[i] === '--start' && i + 1 < args.length) {
      try {
        options.startDate = new Date(args[i + 1]);
      } catch (e) {
        console.warn(`Invalid start date: ${args[i + 1]}, using default`);
      }
    }
  }
  
  return options;
};

// Run the script
(async () => {
  try {
    await generateOfflineData();
    console.log("Script completed successfully!");
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
})(); 