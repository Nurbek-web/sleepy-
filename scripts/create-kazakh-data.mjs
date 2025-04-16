// Comprehensive script to create Kazakh users and generate data using admin SDK
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import path from 'path';

// Import Firebase Admin SDK
import admin from 'firebase-admin';

// Load Firebase config
const firebaseConfig = require('./firebase-config.js');

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

// Format time to display only hours and minutes
const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// Try to use service account file, but fall back to default initialization
try {
  // Check if already initialized
  if (!admin.apps.length) {
    try {
      // Try to use service account file
      const serviceAccountPath = path.join(process.cwd(), 'service-account.json');
      admin.initializeApp({
        credential: admin.credential.cert(require(serviceAccountPath)),
        databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
      });
      console.log("Firebase Admin SDK initialized with service account file");
    } catch (error) {
      console.warn("Warning: Could not load service account file. Initializing with default config.");
      console.warn("Error:", error.message);
      // Fall back to default config
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: firebaseConfig.projectId,
          clientEmail: "firebase-adminsdk-x5hzw@olympiad-4ec53.iam.gserviceaccount.com",
          privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDQlH4kAyQI2N0I\ni0Fx8yiV31u3sczLRzEI8CEJ24tITQxGVbp2W+2qsbnMcKrABK0iG7ZrUZCLqHFC\niqWLZWC3Tg3H4RrFvWuJKL9/9e96kEJJJHTQgFCXLlMImEWrAYGUQJlYAzHsZI+5\nEz7k0dSUQl7bxZ9kY4eC1QjGLGNWqTzm7BBLXC/rNqECcONGIZSHXR5/TmBF5oBR\nyQgwcEBCnkXZOCIwTjOWGu/shJ2QrL1JwLPtJ3Y1skcUy67oYcYEfjkHQwvmzHi+\nXmWxSRnBjgj+CGDLq7m+ZORBFoUQvCqRU5rr3FD3AqXDc7q8FoZN5Qc0oJf9cmzI\n13T8fVAtAgMBAAECggEAUTPJJvEL03tNnjvIknD97Vl8FJwvLX2DJP9b+5LlQwYX\nXg2Rvg28x8GmUzkwKZQLnHgMdNnBBq0QBqJtVE3HiCjyZ44G+ufqDT/SoqPPU3a2\nWbEvzQYtBv8p6gLDrZ2/7m3HfJMzJPFITqwcNUw+cVIQgdDDHxRF0ZF5yDqrT6+9\ndJEiG+cUHf1UOEN4is+XdyPSA8XMzU9Hs4kEWr7qOO8VgtLSw0dK5cHMX0l10Ktp\nQUyN3LHIquREHKYX1mVbXuYxecST+wdJ16KlCGH2qQRjC2U7Z5i7aZAKlV3r/Jg7\nz8QXW2+o9sZ5OQI/D8xYTWdlCiKDL5rjXQbYGqRroQKBgQDpAHBc+UyvxeOUQbGU\nMZpU1nOH3lrOZeJG/dhYrY3K3uGKcQZQDz10xEPrPDKB5QiYPsGS2Wn2Z8XPDtOr\nZZBD6AkrL2NBQr9u1JbRN+6wmHVjJQiA0RHQXrE+Ux0gQo5a1jGf6Ttvf/z7+Ucu\nNPSZeWKEHSGZc14wOHGepRAOzQKBgQDk7f0KnX16FYM1zbxc51dGrh7ZR8HFvv8E\nQ9+yCHXyT9+BUm2I8i/BuWW4IEmWe+6Df5qzk6J8IRkzUEWJnlFzcEaAzj5GFkPR\ntxK6Hb/tOzZuLQ3Xq2acpHYhdRJZFm07k2lFJvvI5Lmn/8DcXsLB/1/QZnAQc61Y\nBX9nz8cO4QKBgQDWZc4Lz7RBSS97AeFGkm8V2Vd7ePxcHDrRIxTUZT6MRgkV8Etg\ndvQVBK/Lc8xwhVp/UpOGWVYXlBkIDCAnj+t6wvw7VuPRsRAgvWskXF6KFtfPSfGg\n2/9jVu4h+zB+LmPGlGg+fyQnZHYwBZGHlxMgiJCEXZcyOlxr5AaCLsGXGQKBgGqC\nIBwQqJdLXFD1TT0XK8QSlHDg8pPetocl0c4CfM2R0OLxMm9JhjSGCBUTPVs3ILFP\nvCu1Eo59AQTsm4QL9/LUuC6er2B5QYpXt9HHyDWZgNdoT4+xyZrR2jzJZ1FQJbf0\ns5EFsWYT5sTiMQpZdkDKmgWZL33oqspUkD/fvZFhAoGASL6i/cZYxLkIiW04jU3r\nEEYf9i1xANI9qS6s1V0UVrnz0mBBQWhqgAw7pOvD09NtwvOhAabXTd5OMJ8KwQ44\nI3kpCLRFzv8FE02n6ZlOJYZpukYw0qGkCAlCaeOE4ZfFITZK1lxaoTQZtYcSkhO1\nw2Qc9VlnpEuB42XJR41zjg4=\n-----END PRIVATE KEY-----\n"
        })
      });
      console.log("Firebase Admin SDK initialized with default config");
    }
  }
} catch (error) {
  console.error("Error initializing Firebase Admin:", error);
  process.exit(1);
}

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
  
  // Sleep quality (1-5 scale) - WIDER RANGE
  const sleepQuality = getRandomFloat(1.5, 5.0, 1); // Changed range from 2.5-4.5 to 1.5-5.0
  
  // Screen time before bed (0-5 hours)
  const screenTime = getRandomFloat(1, 4, 1);
  
  // Caffeine intake (0-400 mg, weighted towards lower values)
  const caffeineIntake = getRandomInt(0, 100) < 70 
    ? getRandomInt(0, 150) // 70% chance: 0-150 mg
    : getRandomInt(150, 300); // 30% chance: 150-300 mg
  
  // Stress level (1-5 scale)
  const stressLevel = getRandomFloat(1, 5, 1);
  
  return {
    userId: user.uid,
    date: new Date(date.setHours(0, 0, 0, 0)), // Set to midnight
    bedTime,
    wakeTime,
    sleepDuration,
    sleepQuality,
    screenTime,
    caffeineIntake,
    stressLevel,
    createdAt: new Date()
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
    let expectedPerformance = 65; // Base performance adjusted slightly
    
    // Sleep duration impact (optimal is 8 hours)
    if (sleepEntry.sleepDuration >= 8) {
      expectedPerformance += 10;
    } else if (sleepEntry.sleepDuration >= 7) {
      expectedPerformance += 5;
    } else if (sleepEntry.sleepDuration <= 5) {
      expectedPerformance -= 20; // Increased penalty for short sleep
    } else if (sleepEntry.sleepDuration <= 6) {
      expectedPerformance -= 15; // Increased penalty for short sleep
    }
    
    // Sleep quality impact - INCREASED WEIGHT
    expectedPerformance += (sleepEntry.sleepQuality - 3) * 8; // Increased multiplier from 5 to 8
    
    // Screen time impact (negative)
    expectedPerformance -= Math.max(0, sleepEntry.screenTime - 1.5) * 3; // Adjusted threshold and multiplier
    
    // Caffeine impact (small positive for moderate consumption)
    if (sleepEntry.caffeineIntake > 0 && sleepEntry.caffeineIntake <= 150) {
      expectedPerformance += 2;
    } else if (sleepEntry.caffeineIntake > 150) {
      expectedPerformance -= 3;
    }
    
    // Stress level impact (negative)
    expectedPerformance -= (sleepEntry.stressLevel - 2.5) * 4; // Adjusted threshold and multiplier
    
    // Adjust by user grade (higher grades perform better on average)
    const gradeNum = parseInt(user.grade);
    expectedPerformance += (gradeNum - 9) * 1.5; // Slightly reduced grade impact
    
    // Gender differences (subtle)
    if (user.gender === 'female') {
      expectedPerformance += 1; // Slightly reduced gender impact
    }
    
    // Add randomness - REDUCED RANGE
    expectedPerformance += getRandomInt(-5, 5); // Reduced range from -10, 10
    
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
      userId: user.uid,
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
  } catch (error) {
    console.error(`Error generating test result:`, error);
    return null;
  }
};

// Main function to create users and data
const createUsersAndData = async () => {
  try {
    const db = admin.firestore();
    const auth = admin.auth();
    
    console.log("Creating users and generating data...");
    
    // Set date range: Just use one month of data for testing
    const startDate = new Date('2023-03-27T00:00:00Z');
    // const endDate = new Date(); // Current date
    
    // For testing, use a smaller date range: one month
    const testEndDate = new Date(startDate);
    testEndDate.setDate(testEndDate.getDate() + 30);
    const dateRange = getWeekdaysBetweenDates(startDate, testEndDate);
    
    console.log(`Processing ${dateRange.length} weekdays from ${startDate.toLocaleDateString()} to ${testEndDate.toLocaleDateString()}`);
    
    // Process fewer users for testing (just 5)
    const testUserCount = 19; // Changed from 2 back to 19
    const testUsers = kazakhUsers.slice(0, testUserCount);
    
    console.log(`Processing ${testUserCount} users for testing`);
    
    // Process each user
    for (let i = 0; i < testUsers.length; i++) {
      const user = testUsers[i];
      console.log(`Processing user ${i+1}/${testUsers.length}: ${user.name} (${user.email})`);
      
      // Try to get user by email
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(user.email);
        console.log(`User exists: ${user.email} (${userRecord.uid})`);
      } catch (error) {
        // User doesn't exist, create them
        try {
          userRecord = await auth.createUser({
            email: user.email,
            password: "password123",
            displayName: user.name
          });
          
          // Add user data to Firestore
          await db.collection('users').doc(userRecord.uid).set({
            name: user.name,
            email: user.email,
            role: "student",
            grade: user.grade,
            gender: user.gender,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log(`Created user: ${user.email} (${userRecord.uid})`);
        } catch (createError) {
          console.error(`Error creating user ${user.email}:`, createError);
          continue; // Skip to next user
        }
      }
      
      // Add user UID to our object for reference
      user.uid = userRecord.uid;
      
      // Generate data for each date in range
      let sleepEntryCount = 0;
      let testResultCount = 0;
      
      for (const date of dateRange) {
        // Create sleep entry
        try {
          // Check if sleep entry already exists
          // const sleepSnapshot = await db.collection('sleepEntries')
          //   .where('userId', '==', user.uid)
          //   .where('date', '==', new Date(date.setHours(0, 0, 0, 0)))
          //   .limit(1)
          //   .get();
          
          let sleepEntry;
          
          // if (sleepSnapshot.empty) {
          sleepEntry = generateSleepEntry(user, new Date(date));
          await db.collection('sleepEntries').add(sleepEntry);
          sleepEntryCount++;
          // } else {
          //   sleepEntry = sleepSnapshot.docs[0].data();
          // }
          
          // Check if test result already exists
          // const startOfDay = new Date(date);
          // startOfDay.setHours(0, 0, 0, 0);
          
          // const endOfDay = new Date(date);
          // endOfDay.setHours(23, 59, 59, 999);
          
          // const testSnapshot = await db.collection('testResults')
          //   .where('userId', '==', user.uid)
          //   .where('startTime', '>=', startOfDay)
          //   .where('startTime', '<=', endOfDay)
          //   .limit(1)
          //   .get();
          
          // if (testSnapshot.empty) {
          const testResult = generateTestResult(user, new Date(date), sleepEntry);
          await db.collection('testResults').add(testResult);
          testResultCount++;
          // }
        } catch (dataError) {
          console.error(`Error generating data for ${user.name} on ${date.toLocaleDateString()}:`, dataError);
        }
        
        // Add a small delay to avoid hitting Firebase rate limits
        await new Promise(resolve => setTimeout(resolve, 1000)); // Increased delay to 1000ms
      }
      
      console.log(`Created ${sleepEntryCount} sleep entries and ${testResultCount} test results for ${user.name}`);
    }
    
    console.log("User and data generation complete!");
  } catch (error) {
    console.error("Error in main function:", error);
  }
};

// Parse command line arguments for options
const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    userCount: 5,  // Default to 5 users for testing
    dayCount: 30,  // Default to 30 days
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
    await createUsersAndData();
    console.log("Script completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
})(); 