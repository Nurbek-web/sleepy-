// Script to generate continuous test results starting from March 27th
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Load Firebase config from our custom file
const firebaseConfig = require('./firebase-config.js');

// Try to import Firebase dynamically
let firebase;
try {
  firebase = await import('firebase/app');
} catch (error) {
  console.error("❌ Error importing firebase/app:", error.message);
  console.error("Please install the Firebase SDK by running: yarn add firebase");
  process.exit(1);
}

// Try to import Firestore dynamically
let firestore;
try {
  firestore = await import('firebase/firestore');
} catch (error) {
  console.error("❌ Error importing firebase/firestore:", error.message);
  process.exit(1);
}

// Initialize Firebase
console.log("Initializing Firebase with config:", firebaseConfig);
const app = firebase.initializeApp(firebaseConfig);
const db = firestore.getFirestore(app);

// List of fixed Kazakh users
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

// Helper to get user ID by email
const getUserIdByEmail = async (email) => {
  try {
    const usersQuery = firestore.query(
      firestore.collection(db, "users"),
      firestore.where("email", "==", email)
    );
    
    const usersSnapshot = await firestore.getDocs(usersQuery);
    
    if (usersSnapshot.empty) {
      return null;
    }
    
    return usersSnapshot.docs[0].id;
  } catch (error) {
    console.error(`Error fetching user ID for email ${email}:`, error);
    return null;
  }
};

// Fetch user's sleep data for the previous day
const getSleepDataForPreviousDay = async (userId, date) => {
  try {
    // Previous day date
    const prevDate = new Date(date);
    prevDate.setDate(prevDate.getDate() - 1);
    
    const startOfDay = new Date(prevDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(prevDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const sleepQuery = firestore.query(
      firestore.collection(db, "sleepEntries"),
      firestore.where("userId", "==", userId),
      firestore.where("date", ">=", startOfDay),
      firestore.where("date", "<=", endOfDay)
    );
    
    const sleepSnapshot = await firestore.getDocs(sleepQuery);
    
    if (sleepSnapshot.empty) {
      // Return default sleep data
      return {
        sleepDuration: 7.5,
        sleepQuality: 3.5,
        screenTime: 3,
        caffeineIntake: 100,
        stressLevel: 3
      };
    }
    
    return sleepSnapshot.docs[0].data();
  } catch (error) {
    console.error(`Error fetching sleep data for user ${userId}:`, error);
    // Return default sleep data
    return {
      sleepDuration: 7.5,
      sleepQuality: 3.5,
      screenTime: 3,
      caffeineIntake: 100,
      stressLevel: 3
    };
  }
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
const generateTestResult = async (user, date, targetDifficulty = null) => {
  try {
    const userId = await getUserIdByEmail(user.email);
    
    if (!userId) {
      console.log(`⚠️ Could not find user ID for ${user.name} (${user.email}), skipping`);
      return null;
    }
    
    // Get sleep data from the previous day to affect performance
    const sleepData = await getSleepDataForPreviousDay(userId, date);
    
    // Calculate expected performance based on sleep data (0-100 scale)
    let expectedPerformance = 70; // Base performance
    
    // Sleep duration impact (optimal is 8 hours)
    if (sleepData.sleepDuration >= 8) {
      expectedPerformance += 10;
    } else if (sleepData.sleepDuration >= 7) {
      expectedPerformance += 5;
    } else if (sleepData.sleepDuration <= 5) {
      expectedPerformance -= 15;
    } else if (sleepData.sleepDuration <= 6) {
      expectedPerformance -= 10;
    }
    
    // Sleep quality impact
    expectedPerformance += (sleepData.sleepQuality - 3) * 5;
    
    // Screen time impact (negative)
    expectedPerformance -= Math.max(0, sleepData.screenTime - 2) * 2;
    
    // Caffeine impact (small positive for moderate consumption)
    if (sleepData.caffeineIntake > 0 && sleepData.caffeineIntake <= 150) {
      expectedPerformance += 3;
    } else if (sleepData.caffeineIntake > 150) {
      expectedPerformance -= 2;
    }
    
    // Stress level impact (negative)
    expectedPerformance -= (sleepData.stressLevel - 3) * 3;
    
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
    if (targetDifficulty) {
      difficulty = targetDifficulty;
    } else {
      if (expectedPerformance >= 85) {
        difficulty = 'hard';
      } else if (expectedPerformance >= 60) {
        difficulty = 'medium';
      } else {
        difficulty = 'easy';
      }
    }
    
    // Generate test questions
    const questions = generateTestQuestions(difficulty);
    
    // Generate random answers based on expected performance
    const answers = [];
    let score = 0;
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      let answeredCorrectly = false;
      
      // Higher expected performance means higher chance of correct answer
      const correctProbability = expectedPerformance / 100;
      
      if (Math.random() <= correctProbability) {
        // Correct answer
        answers.push(question.correctAnswer);
        answeredCorrectly = true;
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
    const testResult = {
      userId,
      startTime,
      endTime,
      score,
      alertnessRating,
      questions: questions.map((q, i) => ({
        question: q.question,
        options: q.options,
        userAnswer: answers[i],
        correctAnswer: q.correctAnswer
      })),
      difficulty,
      createdAt: new Date()
    };
    
    return testResult;
  } catch (error) {
    console.error(`Error generating test result for ${user.name}:`, error);
    return null;
  }
};

// Check if test result already exists for a user on a date
const testResultExists = async (userId, date) => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const testResultQuery = firestore.query(
      firestore.collection(db, "testResults"),
      firestore.where("userId", "==", userId),
      firestore.where("startTime", ">=", startOfDay),
      firestore.where("startTime", "<=", endOfDay)
    );
    
    const testResultSnapshot = await firestore.getDocs(testResultQuery);
    
    return !testResultSnapshot.empty;
  } catch (error) {
    console.error(`Error checking test result existence:`, error);
    return false;
  }
};

// Create test results for date range
const createTestResultsForDateRange = async (startDate, endDate) => {
  try {
    console.log(`Generating test results from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
    
    let totalResults = 0;
    let skippedResults = 0;
    
    // Loop through each day (weekdays only)
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Skip weekends (0 = Sunday, 6 = Saturday)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        console.log(`Skipping weekend day: ${currentDate.toLocaleDateString()}`);
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }
      
      console.log(`Generating test results for ${currentDate.toLocaleDateString()}`);
      
      // Loop through each user
      for (const user of kazakhUsers) {
        // Get user ID
        const userId = await getUserIdByEmail(user.email);
        
        if (!userId) {
          console.log(`⚠️ Could not find user ID for ${user.name} (${user.email}), skipping`);
          continue;
        }
        
        // Check if a test result already exists
        const resultExists = await testResultExists(userId, currentDate);
        
        if (resultExists) {
          console.log(`⚠️ Test result already exists for ${user.name} on ${currentDate.toLocaleDateString()}, skipping`);
          skippedResults++;
          continue;
        }
        
        try {
          // Generate test result
          const testResult = await generateTestResult(user, new Date(currentDate));
          
          if (!testResult) {
            console.log(`⚠️ Could not generate test result for ${user.name}, skipping`);
            continue;
          }
          
          // Add to Firestore
          await firestore.addDoc(firestore.collection(db, "testResults"), testResult);
          console.log(`✅ Added test result for ${user.name} on ${currentDate.toLocaleDateString()} - Score: ${testResult.score}`);
          totalResults++;
        } catch (error) {
          console.error(`❌ Error adding test result for ${user.name}:`, error);
        }
        
        // Add a small delay to avoid hitting Firebase rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log(`✅ Successfully generated ${totalResults} test results (skipped ${skippedResults} existing results)`);
  } catch (error) {
    console.error("Error generating test results:", error);
  }
};

// Parse command line args
const getDateRange = () => {
  const args = process.argv.slice(2);
  
  // Default: From March 27th to current date
  const defaultStartDate = new Date('2023-03-27T00:00:00Z');
  const defaultEndDate = new Date();
  
  let startDate = defaultStartDate;
  let endDate = defaultEndDate;
  
  // Check for custom dates
  if (args.length >= 1) {
    try {
      startDate = new Date(args[0]);
    } catch (e) {
      console.error(`Invalid start date format: ${args[0]}, using default ${defaultStartDate.toLocaleDateString()}`);
    }
  }
  
  if (args.length >= 2) {
    try {
      endDate = new Date(args[1]);
    } catch (e) {
      console.error(`Invalid end date format: ${args[1]}, using default ${defaultEndDate.toLocaleDateString()}`);
    }
  }
  
  return { startDate, endDate };
};

// Run the script
try {
  const { startDate, endDate } = getDateRange();
  
  console.log(`Starting test result generation from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
  await createTestResultsForDateRange(startDate, endDate);
  
  console.log("Test result generation complete!");
  process.exit(0);
} catch (error) {
  console.error("Fatal error:", error);
  process.exit(1);
} 