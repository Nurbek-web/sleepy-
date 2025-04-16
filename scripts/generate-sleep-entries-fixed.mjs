// ESM version of the script to generate sleep entries with fixed user list
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

// Helper function to format time as HH:MM
const formatTime = (hours, minutes) => {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Helper to get random int between min and max (inclusive)
const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Helper to get random float between min and max with specific decimal places
const getRandomFloat = (min, max, decimals = 1) => {
  const random = Math.random() * (max - min) + min;
  return Number(random.toFixed(decimals));
};

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

// Generate a random sleep entry
const generateSleepEntry = (userId, date, gender, grade) => {
  // Bedtime: between 21:00 and 01:00
  const bedHour = getRandomInt(21, 25) % 24;
  const bedMinute = getRandomInt(0, 59);
  const bedTime = formatTime(bedHour, bedMinute);
  
  // Wake time: between 5:00 and 9:00
  const wakeHour = getRandomInt(5, 9);
  const wakeMinute = getRandomInt(0, 59);
  const wakeTime = formatTime(wakeHour, wakeMinute);
  
  // Calculate sleep duration (in hours)
  let sleepDuration;
  if (bedHour < 12) { // If bedtime is after midnight
    sleepDuration = (wakeHour - bedHour) + (wakeMinute - bedMinute) / 60;
  } else { // If bedtime is before midnight
    sleepDuration = (wakeHour + 24 - bedHour) + (wakeMinute - bedMinute) / 60;
  }
  sleepDuration = Number(sleepDuration.toFixed(1));
  
  // Younger students tend to have better sleep quality
  const gradeNum = parseInt(grade);
  const baseQuality = 11 - gradeNum; // So grade 9 = base quality 2, grade 12 = base quality -1
  
  // Create sleep entry
  return {
    userId,
    date,
    bedTime,
    wakeTime,
    sleepDuration,
    sleepQuality: Math.max(1, Math.min(5, getRandomInt(baseQuality, baseQuality + 3))), // 1-5 scale
    screenTime: getRandomFloat(0.5, 4, 1), // Hours before bed, higher for older students
    caffeineIntake: getRandomInt(0, 200 + (gradeNum - 9) * 50), // mg, increases with grade
    stressLevel: getRandomInt(Math.max(1, gradeNum - 8), Math.min(5, gradeNum - 4)), // 1-5 scale, increases with grade
    createdAt: new Date()
  };
};

// Create sleep entries for March 27th
const createSleepEntriesForMarch27 = async () => {
  try {
    // March 27th date
    const targetDate = new Date('2023-03-27T00:00:00Z');
    console.log(`Generating sleep entries for ${targetDate.toLocaleDateString()}`);
    
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
      
      // Generate the sleep entry
      const sleepEntry = generateSleepEntry(userId, targetDate, user.gender, user.grade);
      
      try {
        // Add the entry to Firestore
        await firestore.addDoc(firestore.collection(db, "sleepEntries"), sleepEntry);
        console.log(`✅ Added sleep entry for ${user.name}`);
        totalEntries++;
      } catch (error) {
        console.error(`❌ Error adding sleep entry for ${user.name}:`, error);
      }
      
      // Add a small delay to avoid hitting Firebase rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`✅ Successfully generated ${totalEntries} sleep entries for March 27th`);
  } catch (error) {
    console.error("Error generating sleep entries:", error);
  }
};

// Run the function
try {
  await createSleepEntriesForMarch27();
  process.exit(0);
} catch (error) {
  console.error("Fatal error:", error);
  process.exit(1);
} 