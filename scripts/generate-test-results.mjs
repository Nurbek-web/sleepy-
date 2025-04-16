// ESM version of the script to generate test results
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

// Get all users from the database
const getUsers = async () => {
  try {
    const usersQuery = firestore.query(
      firestore.collection(db, "users"),
      firestore.where("role", "==", "student")
    );
    
    const usersSnapshot = await firestore.getDocs(usersQuery);
    return usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

// Get sleep entries for a specific user and date
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
    
    return {
      id: sleepSnapshot.docs[0].id,
      ...sleepSnapshot.docs[0].data()
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

// Create test results for all users starting from March 27th
const createTestResults = async () => {
  try {
    // Get all student users
    const users = await getUsers();
    console.log(`Found ${users.length} student users`);
    
    if (users.length === 0) {
      console.error("No users found. Please run create-users-fixed-names.mjs first.");
      process.exit(1);
    }
    
    // Start date: March 27th, 2023
    const startDate = new Date('2023-03-27T00:00:00Z');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate number of days to generate data for
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    console.log(`Generating test results for ${daysDiff} days (${startDate.toLocaleDateString()} to ${today.toLocaleDateString()})`);
    
    let totalEntries = 0;
    
    // Loop through each user
    for (const user of users) {
      console.log(`Generating test results for ${user.name} (${user.id})`);
      
      // Create entries for each day (with some probability)
      for (let i = 0; i < daysDiff; i++) {
        const entryDate = new Date(startDate);
        entryDate.setDate(startDate.getDate() + i);
        
        // Only generate test results for weekdays (0 = Sunday, 6 = Saturday)
        const day = entryDate.getDay();
        if (day === 0 || day === 6) {
          console.log(`  Skipping ${entryDate.toLocaleDateString()} (weekend)`);
          continue;
        }
        
        // Add some randomness - not every weekday will have a test (60% chance)
        if (Math.random() > 0.6) {
          console.log(`  Skipping ${entryDate.toLocaleDateString()} (random skip)`);
          continue;
        }
        
        try {
          // Check if a test result already exists for this user and date
          const startOfDay = new Date(entryDate);
          startOfDay.setHours(0, 0, 0, 0);
          
          const endOfDay = new Date(entryDate);
          endOfDay.setHours(23, 59, 59, 999);
          
          const existingQuery = firestore.query(
            firestore.collection(db, "testResults"),
            firestore.where("userId", "==", user.id),
            firestore.where("startTime", ">=", startOfDay),
            firestore.where("startTime", "<=", endOfDay)
          );
          
          const existingSnapshot = await firestore.getDocs(existingQuery);
          
          if (!existingSnapshot.empty) {
            console.log(`  Test result for ${entryDate.toLocaleDateString()} already exists, skipping`);
            continue;
          }
          
          // Generate the test result
          const testResult = await generateTestResult(user.id, entryDate, user.gender, user.grade);
          
          // Add the entry to Firestore
          await firestore.addDoc(firestore.collection(db, "testResults"), testResult);
          console.log(`  ✅ Added test result for ${entryDate.toLocaleDateString()} - Score: ${testResult.score}/10 (Alertness: ${testResult.alertnessRating}/10)`);
          totalEntries++;
          
          // Add a small delay to avoid hitting Firebase rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`  ❌ Error adding test result for ${entryDate.toLocaleDateString()}:`, error);
        }
      }
    }
    
    console.log(`✅ Successfully generated ${totalEntries} test results for ${users.length} users`);
  } catch (error) {
    console.error("Error generating test results:", error);
  }
};

// Run the function
try {
  await createTestResults();
  process.exit(0);
} catch (error) {
  console.error("Fatal error:", error);
  process.exit(1);
} 