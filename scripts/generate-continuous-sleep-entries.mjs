// Script to generate continuous sleep entries starting from March 27th
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
const formatTime = (hours, minutes) => {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomFloat = (min, max, decimals = 1) => {
  const value = Math.random() * (max - min) + min;
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
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

// Generate sleep entry for a specific user and date
const generateSleepEntry = (user, date) => {
  const { gender, grade } = user;
  const gradeNum = parseInt(grade);
  
  // Base sleep patterns by age/grade
  // Younger students tend to sleep earlier and longer
  let baseBedHour, baseSleepDuration;
  
  if (gradeNum <= 9) {
    baseBedHour = getRandomInt(20, 22); // 8-10 PM
    baseSleepDuration = getRandomFloat(7.5, 9.0);
  } else if (gradeNum <= 10) {
    baseBedHour = getRandomInt(21, 23); // 9-11 PM
    baseSleepDuration = getRandomFloat(7.0, 8.5);
  } else {
    baseBedHour = getRandomInt(22, 24); // 10-12 PM
    baseSleepDuration = getRandomFloat(6.5, 8.0);
  }
  
  // Adjust for weekends
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  if (isWeekend) {
    baseBedHour = Math.min(24, baseBedHour + 1); // Stay up 1 hour later
    baseSleepDuration += 0.5; // Sleep 30 min longer
  }
  
  // Gender differences (subtle)
  if (gender === 'female') {
    baseBedHour = Math.max(20, baseBedHour - 0.5); // Go to bed slightly earlier
    baseSleepDuration += 0.2; // Sleep slightly longer
  }
  
  // Add some randomness to sleep patterns
  const actualBedHour = Math.min(24, Math.max(19, baseBedHour + getRandomInt(-1, 1)));
  const bedMinute = getRandomInt(0, 59);
  
  // Calculate wake time based on sleep duration
  let actualSleepDuration = Math.max(5, Math.min(10, baseSleepDuration + getRandomFloat(-0.5, 0.5)));
  
  const bedTimeHours = actualBedHour >= 24 ? actualBedHour - 24 : actualBedHour;
  const bedTime = formatTime(bedTimeHours, bedMinute);
  
  // Calculate wake time
  let wakeTimeHours = (actualBedHour + Math.floor(actualSleepDuration)) % 24;
  let wakeTimeMinutes = bedMinute + Math.round((actualSleepDuration % 1) * 60);
  
  if (wakeTimeMinutes >= 60) {
    wakeTimeHours = (wakeTimeHours + 1) % 24;
    wakeTimeMinutes -= 60;
  }
  
  const wakeTime = formatTime(wakeTimeHours, wakeTimeMinutes);
  
  // Generate other sleep metrics
  const sleepQuality = getRandomFloat(2.5, 4.5); // Scale of 1-5
  
  // Screen time is higher for older students and on weekends
  let screenTime = getRandomInt(1, 5);
  if (gradeNum >= 11) screenTime += 1;
  if (isWeekend) screenTime += 1;
  screenTime = Math.min(8, screenTime);
  
  // Caffeine intake higher for older students
  let caffeineIntake = getRandomInt(0, 150);
  if (gradeNum >= 11) caffeineIntake += getRandomInt(0, 100);
  
  // Stress level higher for older students and during weekdays
  let stressLevel = getRandomFloat(1, 4);
  if (gradeNum >= 11) stressLevel += 0.5;
  if (!isWeekend) stressLevel += 0.5;
  stressLevel = Math.min(5, stressLevel);
  
  return {
    userId: '', // Will be filled later
    date: date,
    bedTime,
    wakeTime,
    sleepDuration: actualSleepDuration,
    sleepQuality,
    screenTime,
    caffeineIntake,
    stressLevel,
    notes: '',
    createdAt: new Date()
  };
};

// Check if sleep entry already exists
const sleepEntryExists = async (userId, date) => {
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
    
    return !sleepSnapshot.empty;
  } catch (error) {
    console.error(`Error checking sleep entry existence:`, error);
    return false;
  }
};

// Create sleep entries for a date range
const createSleepEntriesForDateRange = async (startDate, endDate) => {
  try {
    console.log(`Generating sleep entries from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
    
    let totalEntries = 0;
    let skippedEntries = 0;
    
    // Loop through each day
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      console.log(`Generating entries for ${currentDate.toLocaleDateString()}`);
      
      // Loop through each user
      for (const user of kazakhUsers) {
        // Get user ID
        const userId = await getUserIdByEmail(user.email);
        
        if (!userId) {
          console.log(`⚠️ Could not find user ID for ${user.name} (${user.email}), skipping`);
          continue;
        }
        
        // Check if entry already exists
        const entryExists = await sleepEntryExists(userId, currentDate);
        
        if (entryExists) {
          console.log(`⚠️ Sleep entry already exists for ${user.name} on ${currentDate.toLocaleDateString()}, skipping`);
          skippedEntries++;
          continue;
        }
        
        try {
          // Generate the sleep entry
          const sleepEntry = generateSleepEntry(user, new Date(currentDate));
          sleepEntry.userId = userId;
          
          // Add the entry to Firestore
          await firestore.addDoc(firestore.collection(db, "sleepEntries"), sleepEntry);
          console.log(`✅ Added sleep entry for ${user.name} on ${currentDate.toLocaleDateString()}`);
          totalEntries++;
        } catch (error) {
          console.error(`❌ Error adding sleep entry for ${user.name}:`, error);
        }
        
        // Add a small delay to avoid hitting Firebase rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log(`✅ Successfully generated ${totalEntries} sleep entries (skipped ${skippedEntries} existing entries)`);
  } catch (error) {
    console.error("Error generating sleep entries:", error);
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
  
  console.log(`Starting sleep entry generation from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
  await createSleepEntriesForDateRange(startDate, endDate);
  
  console.log("Sleep entry generation complete!");
  process.exit(0);
} catch (error) {
  console.error("Fatal error:", error);
  process.exit(1);
} 