// ESM version of the script to generate test results for March 27th
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

// Try to import Firestore and Auth dynamically
let firestore, auth;
try {
  firestore = await import('firebase/firestore');
  auth = await import('firebase/auth');
} catch (error) {
  console.error("❌ Error importing firebase modules:", error.message);
  process.exit(1);
}

// Initialize Firebase
console.log("Initializing Firebase with config:", firebaseConfig);
const app = firebase.initializeApp(firebaseConfig);
const db = firestore.getFirestore(app);

// List of fixed Kazakh users - this should be the same as in create-users-fixed-names.mjs
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

// Helper to get random int between min and max (inclusive)
const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Sample critical thinking questions for mock data
const sampleQuestions = [
  {
    question: "Which of the following best represents a logical fallacy?",
    options: [
      "Using evidence to support a claim",
      "Attacking a person's character instead of their argument",
      "Making a conclusion based on multiple premises",
      "Examining both sides of an issue"
    ],
    correctAnswer: "Attacking a person's character instead of their argument",
    explanation: "An ad hominem argument attacks the person making the argument rather than the argument itself. This is a logical fallacy because a person's character doesn't determine whether their argument is valid."
  },
  {
    question: "What is the main purpose of a control group in a scientific experiment?",
    options: [
      "To increase the sample size",
      "To provide a basis for comparison",
      "To ensure the experiment is reproducible",
      "To make the results more interesting"
    ],
    correctAnswer: "To provide a basis for comparison",
    explanation: "A control group allows researchers to compare results with the experimental group, helping to determine if observed effects are due to the experimental treatment or other factors."
  },
  {
    question: "If all mammals are animals, and all dogs are mammals, what can be logically concluded?",
    options: [
      "All animals are mammals",
      "All animals are dogs",
      "All dogs are animals",
      "No valid conclusion can be drawn"
    ],
    correctAnswer: "All dogs are animals",
    explanation: "This is a classic syllogism. If A (mammals) is a subset of B (animals), and C (dogs) is a subset of A, then C must also be a subset of B."
  },
  {
    question: "What is the primary flaw in the following argument: 'Most scientists agree that climate change is real, so it must be true.'?",
    options: [
      "It relies on appeal to authority",
      "It uses circular reasoning",
      "It commits the straw man fallacy",
      "It employs false dichotomy"
    ],
    correctAnswer: "It relies on appeal to authority",
    explanation: "This is an appeal to authority fallacy. While expert consensus is useful, the argument doesn't reference the evidence that led to this consensus, which is what actually supports the claim."
  },
  {
    question: "Which statement best exemplifies critical thinking?",
    options: [
      "Accepting information from trusted sources without question",
      "Dismissing evidence that contradicts your beliefs",
      "Evaluating evidence and considering alternative explanations",
      "Finding sources that support your pre-existing views"
    ],
    correctAnswer: "Evaluating evidence and considering alternative explanations",
    explanation: "Critical thinking involves objectively analyzing information, considering multiple perspectives, and drawing conclusions based on evidence rather than assumptions or biases."
  },
  {
    question: "What is the issue with correlation in establishing causation?",
    options: [
      "Correlations are never related to causation",
      "Correlations are always random coincidences",
      "Correlation alone cannot prove causation",
      "Causation always precedes correlation"
    ],
    correctAnswer: "Correlation alone cannot prove causation",
    explanation: "While correlation (two factors changing together) can suggest a relationship, it cannot by itself prove that one factor causes the other. Other explanations could include reverse causation, a third factor causing both, or coincidence."
  },
  {
    question: "In a deductive argument, if the premises are true and the argument is valid, then the conclusion is:",
    options: [
      "Possibly true",
      "Necessarily true",
      "Likely to be false",
      "Unrelated to the premises"
    ],
    correctAnswer: "Necessarily true",
    explanation: "In a valid deductive argument, if all premises are true, the conclusion must be true. This is different from inductive arguments, where true premises only make the conclusion probable."
  },
  {
    question: "What is the main problem with confirmation bias?",
    options: [
      "It makes people too skeptical of new information",
      "It leads people to ignore evidence that supports their views",
      "It causes people to seek out and favor information that confirms existing beliefs",
      "It forces people to change their opinions too frequently"
    ],
    correctAnswer: "It causes people to seek out and favor information that confirms existing beliefs",
    explanation: "Confirmation bias is the tendency to search for, interpret, and recall information in a way that confirms one's preexisting beliefs, while giving less consideration to alternative possibilities."
  },
  {
    question: "Why is sample size important in research?",
    options: [
      "Larger samples are always more expensive to study",
      "Smaller samples provide more detailed information",
      "Larger samples typically provide more reliable results",
      "Sample size has no effect on research validity"
    ],
    correctAnswer: "Larger samples typically provide more reliable results",
    explanation: "Larger sample sizes generally reduce the impact of random variation and outliers, providing more reliable and representative results that are more likely to reflect the true population."
  },
  {
    question: "What does it mean to evaluate the credibility of a source?",
    options: [
      "Checking if the source agrees with your viewpoint",
      "Assessing the author's expertise, potential biases, and evidence quality",
      "Determining how popular the source is",
      "Verifying that the source is recent"
    ],
    correctAnswer: "Assessing the author's expertise, potential biases, and evidence quality",
    explanation: "Evaluating credibility involves examining the author's qualifications, checking for potential conflicts of interest or biases, verifying the quality of evidence presented, and determining if the claims are supported by other reliable sources."
  }
];

// Helper to get user ID by email
const getUserIdByEmail = async (email) => {
  try {
    // Get all users with same email
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

// Get sleep entry for a specific user and date
const getSleepEntry = async (userId, date) => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const sleepQuery = firestore.query(
      firestore.collection(db, "sleepEntries"),
      firestore.where("userId", "==", userId),
      firestore.where("date", ">=", startOfDay),
      firestore.where("date", "<=", endOfDay)
    );
    
    const sleepSnapshot = await firestore.getDocs(sleepQuery);
    
    if (sleepSnapshot.empty) {
      return null;
    }
    
    // Convert Firestore timestamp to JS Date
    const data = sleepSnapshot.docs[0].data();
    if (data.date && typeof data.date.toDate === 'function') {
      data.date = data.date.toDate();
    }
    
    return {
      id: sleepSnapshot.docs[0].id,
      ...data
    };
  } catch (error) {
    console.error(`Error fetching sleep entry for user ${userId} on ${date.toLocaleDateString()}:`, error);
    return null;
  }
};

// Generate a random test result
const generateTestResult = async (userId, date, gender, grade) => {
  // Get the user's sleep entry for this date to correlate test performance
  const sleepEntry = await getSleepEntry(userId, date);
  
  // Variables to affect test performance
  const gradeNum = parseInt(grade);
  const basePerformance = Math.max(0.5, 1 - (gradeNum - 9) * 0.05); // Base performance decreases slightly with higher grades
  
  // Sleep affects performance
  let sleepMultiplier = 1.0;
  if (sleepEntry) {
    // Sleep duration affects performance (optimal around 8 hours)
    const durationFactor = 1 - Math.abs(sleepEntry.sleepDuration - 8) * 0.05;
    
    // Sleep quality directly affects performance
    const qualityFactor = sleepEntry.sleepQuality / 5;
    
    // High screen time negatively affects performance
    const screenFactor = 1 - sleepEntry.screenTime * 0.05;
    
    // High caffeine intake can improve performance slightly but too much is negative
    const caffeineFactor = sleepEntry.caffeineIntake < 200 
      ? 1 + sleepEntry.caffeineIntake * 0.0005 
      : 1 + (400 - sleepEntry.caffeineIntake) * 0.0005;
    
    // High stress negatively affects performance
    const stressFactor = 1 - (sleepEntry.stressLevel - 1) * 0.05;
    
    // Combine all factors
    sleepMultiplier = (durationFactor + qualityFactor + screenFactor + caffeineFactor + stressFactor) / 5;
  }
  
  // Random daily factor (some days are just better than others)
  const dailyFactor = getRandomInt(85, 115) / 100;
  
  // Calculate the expected performance (as a percentage)
  const expectedPerformance = basePerformance * sleepMultiplier * dailyFactor;
  
  // Determine how many questions will be correct (out of 10)
  const numCorrect = Math.min(10, Math.max(0, Math.round(expectedPerformance * 10)));
  
  // Generate array of 10 questions
  const testQuestions = [];
  const answers = [];
  
  // Randomly select 10 questions from our pool (with replacement)
  for (let i = 0; i < 10; i++) {
    const questionIndex = getRandomInt(0, sampleQuestions.length - 1);
    const question = sampleQuestions[questionIndex];
    testQuestions.push({
      question: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation
    });
    
    // Determine if this answer will be correct based on our calculated performance
    if (i < numCorrect) {
      answers.push(question.correctAnswer);
    } else {
      // Pick a random wrong answer
      const wrongOptions = question.options.filter(opt => opt !== question.correctAnswer);
      const wrongAnswer = wrongOptions[getRandomInt(0, wrongOptions.length - 1)];
      answers.push(wrongAnswer);
    }
  }
  
  // Shuffle the answers array to make the distribution random
  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [answers[i], answers[j]] = [answers[j], answers[i]];
    // Also shuffle the corresponding questions
    [testQuestions[i], testQuestions[j]] = [testQuestions[j], testQuestions[i]];
  }
  
  // Calculate final score
  const score = answers.filter((answer, index) => 
    answer === testQuestions[index].correctAnswer
  ).length;
  
  // Determine alertness rating based on sleep factors or random if no sleep data
  let alertnessRating;
  if (sleepEntry) {
    // Base alertness on sleep quality and duration
    const sleepFactor = (sleepEntry.sleepQuality / 5 + 
                         Math.min(1, sleepEntry.sleepDuration / 9)) / 2;
    alertnessRating = Math.max(1, Math.min(10, Math.round(sleepFactor * 10)));
  } else {
    alertnessRating = getRandomInt(3, 8);
  }
  
  // Calculate test start and end times
  const startTime = new Date(date);
  startTime.setHours(getRandomInt(9, 15), getRandomInt(0, 59), 0, 0); // Between 9 AM and 3 PM
  
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + getRandomInt(8, 15)); // 8-15 minutes to complete
  
  // Determine difficulty levels
  const difficulties = ["easy", "medium", "hard"];
  const difficulty = difficulties[getRandomInt(0, 2)];
  
  // Apply difficulty multipliers
  let adjustedScore;
  let baseScore = score;
  
  switch (difficulty) {
    case "easy":
      adjustedScore = Math.round(score * 0.8); // Lower score for easy tests
      break;
    case "medium":
      adjustedScore = score; // No adjustment for medium
      break;
    case "hard":
      adjustedScore = Math.min(10, Math.round(score * 1.2)); // Higher score for hard tests
      break;
    default:
      adjustedScore = score;
  }
  
  // Create the test result
  return {
    userId,
    startTime,
    endTime,
    score,
    version: "1.0",
    alertnessRating,
    questions: testQuestions,
    answers,
    difficulty,
    baseScore,
    adjustedScore,
    createdAt: new Date()
  };
};

// Create test results for March 27th
const createTestResultsForMarch27 = async () => {
  try {
    // March 27th date
    const targetDate = new Date('2023-03-27T00:00:00Z');
    console.log(`Generating test results for ${targetDate.toLocaleDateString()}`);
    
    let totalEntries = 0;
    
    // Loop through each user
    for (const user of kazakhUsers) {
      console.log(`Processing user ${user.name} (${user.email})`);
      
      // Get user ID
      const userId = await getUserIdByEmail(user.email);
      
      if (!userId) {
        console.log(`⚠️ Could not find user ID for ${user.name} (${user.email}), skipping`);
        continue;
      }
      
      try {
        // Generate the test result
        const testResult = await generateTestResult(userId, targetDate, user.gender, user.grade);
        
        // Add the entry to Firestore
        await firestore.addDoc(firestore.collection(db, "testResults"), testResult);
        console.log(`✅ Added test result for ${user.name} - Score: ${testResult.score}/10 (Alertness: ${testResult.alertnessRating}/10)`);
        totalEntries++;
      } catch (error) {
        console.error(`❌ Error adding test result for ${user.name}:`, error);
      }
      
      // Add a small delay to avoid hitting Firebase rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`✅ Successfully generated ${totalEntries} test results for March 27th`);
  } catch (error) {
    console.error("Error generating test results:", error);
  }
};

// Run the function
try {
  await createTestResultsForMarch27();
  process.exit(0);
} catch (error) {
  console.error("Fatal error:", error);
  process.exit(1);
} 