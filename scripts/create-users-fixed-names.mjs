// ESM version of the script with fixed Kazakh names
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
const authInstance = auth.getAuth(app);

// Fixed list of 24 authentic Kazakh names (12 male, 12 female)
const kazakhUsers = [
  // Male students
  { name: "Aidar Zhumadilov", gender: "male", grade: "9" },
  { name: "Nursultan Akhmetov", gender: "male", grade: "10" },
  { name: "Yerbol Satbayev", gender: "male", grade: "11" },
  { name: "Dias Tulegenov", gender: "male", grade: "9" },
  { name: "Arman Utemuratov", gender: "male", grade: "10" },
  { name: "Nurlan Kozhabekov", gender: "male", grade: "11" },
  { name: "Daniyar Bekturov", gender: "male", grade: "12" },
  { name: "Timur Auezov", gender: "male", grade: "9" },
  { name: "Azamat Sultanbekov", gender: "male", grade: "10" },
  { name: "Samat Temirgaliyev", gender: "male", grade: "11" },
  { name: "Yerlan Nurpeisov", gender: "male", grade: "12" },
  { name: "Bolat Nurmukhanov", gender: "male", grade: "10" },
  
  // Female students
  { name: "Aizhan Mukhamejanova", gender: "female", grade: "9" },
  { name: "Madina Esenova", gender: "female", grade: "10" },
  { name: "Aliya Nurpeisova", gender: "female", grade: "11" },
  { name: "Dinara Smagulova", gender: "female", grade: "12" },
  { name: "Assel Bektursynova", gender: "female", grade: "9" },
  { name: "Gulmira Nurbekova", gender: "female", grade: "10" },
  { name: "Ainur Dauletova", gender: "female", grade: "11" },
  { name: "Zarina Kaliyeva", gender: "female", grade: "12" },
  { name: "Saule Zhanseitova", gender: "female", grade: "9" },
  { name: "Aigerim Baitasova", gender: "female", grade: "10" },
  { name: "Gulnaz Orazova", gender: "female", grade: "11" },
  { name: "Akmaral Tulegenova", gender: "female", grade: "12" }
];

// Main function to create users
const createSyntheticUsers = async () => {
  console.log("Starting to create 24 synthetic users with authentic Kazakh names...");
  
  for (let i = 0; i < kazakhUsers.length; i++) {
    try {
      const user = kazakhUsers[i];
      const email = `student${i+1}@sleepystudy.kz`;
      const password = "password123"; // Default password
      const role = "student";
      
      console.log(`Creating user ${i+1}/24: ${user.name} (${email})`);
      
      try {
        // Create user in Firebase Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(
          authInstance, 
          email, 
          password
        );
        
        // Add user data to Firestore
        await firestore.setDoc(firestore.doc(db, "users", userCredential.user.uid), {
          name: user.name,
          email: email,
          role: role,
          grade: user.grade,
          gender: user.gender,
          createdAt: new Date()
        });
        
        console.log(`✅ Successfully created user: ${user.name}`);
      } catch (authError) {
        if (authError.code === 'auth/email-already-in-use') {
          console.log(`⚠️ User with email ${email} already exists, skipping...`);
        } else {
          throw authError;
        }
      }
      
      // Add a small delay to avoid hitting Firebase rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Error creating user ${i+1}:`, error);
      console.error(error.message);
    }
  }
  
  console.log("Completed user generation process.");
};

// Run the function
try {
  await createSyntheticUsers();
  process.exit(0);
} catch (error) {
  console.error("Fatal error:", error);
  process.exit(1);
} 