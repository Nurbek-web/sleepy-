// ESM version of the script to generate sleep entries
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

// Create sleep entries for all users starting from March 27th
const createSleepEntries = async () => {
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
    console.log(`Generating sleep entries for ${daysDiff} days (${startDate.toLocaleDateString()} to ${today.toLocaleDateString()})`);
    
    let totalEntries = 0;
    
    // Loop through each user
    for (const user of users) {
      console.log(`Generating sleep entries for ${user.name} (${user.id})`);
      
      // Create entries for each day
      for (let i = 0; i < daysDiff; i++) {
        const entryDate = new Date(startDate);
        entryDate.setDate(startDate.getDate() + i);
        
        // Add some randomness - some days might not have entries (10% chance)
        if (Math.random() < 0.1) {
          console.log(`  Skipping ${entryDate.toLocaleDateString()} (random skip)`);
          continue;
        }
        
        // Generate the sleep entry
        const sleepEntry = generateSleepEntry(user.id, entryDate, user.gender, user.grade);
        
        try {
          // Check if an entry already exists for this user and date
          const startOfDay = new Date(entryDate);
          const endOfDay = new Date(entryDate);
          endOfDay.setHours(23, 59, 59, 999);
          
          const existingQuery = firestore.query(
            firestore.collection(db, "sleepEntries"),
            firestore.where("userId", "==", user.id),
            firestore.where("date", ">=", startOfDay),
            firestore.where("date", "<=", endOfDay)
          );
          
          const existingSnapshot = await firestore.getDocs(existingQuery);
          
          if (!existingSnapshot.empty) {
            console.log(`  Sleep entry for ${entryDate.toLocaleDateString()} already exists, skipping`);
            continue;
          }
          
          // Add the entry to Firestore
          await firestore.addDoc(firestore.collection(db, "sleepEntries"), sleepEntry);
          console.log(`  ✅ Added sleep entry for ${entryDate.toLocaleDateString()}`);
          totalEntries++;
          
          // Add a small delay to avoid hitting Firebase rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`  ❌ Error adding sleep entry for ${entryDate.toLocaleDateString()}:`, error);
        }
      }
    }
    
    console.log(`✅ Successfully generated ${totalEntries} sleep entries for ${users.length} users`);
  } catch (error) {
    console.error("Error generating sleep entries:", error);
  }
};

// Run the function
try {
  await createSleepEntries();
  process.exit(0);
} catch (error) {
  console.error("Fatal error:", error);
  process.exit(1);
} 