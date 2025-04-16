// ESM version of the script
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

// Kazakh first names
const kazakhFirstNames = [
  "Aisulu", "Zarina", "Madina", "Aizhan", "Aruzhan", 
  "Ainur", "Kamila", "Aliya", "Asel", "Gulnaz",
  "Nursultan", "Aidar", "Alikhan", "Yerlan", "Daulet", 
  "Temirlan", "Kanat", "Daniyar", "Ruslan", "Arman",
  "Nurzhan", "Serik", "Almas", "Miras", "Nurbek",
  "Zhanar", "Saule", "Dinara", "Gulmira", "Aigul"
];

// Kazakh last names
const kazakhLastNames = [
  "Bektursynov", "Alimzhanov", "Satpayev", "Nazarbayev", "Dauletov", 
  "Altynbek", "Mukhamedzhan", "Baimenov", "Suleimenov", "Kadyrov",
  "Bektursynova", "Alimzhanova", "Satpayeva", "Nazarbayeva", "Dauletova", 
  "Altynbek", "Mukhamedzhanova", "Baimenova", "Suleimenova", "Kadyrova",
  "Zhunisbek", "Kurmanbek", "Orazbek", "Kalibek", "Beisenbek"
];

// Function to generate a random user
const generateRandomUser = (index) => {
  const gender = Math.random() > 0.5 ? "male" : "female";
  const firstName = kazakhFirstNames[Math.floor(Math.random() * kazakhFirstNames.length)];
  let lastName = kazakhLastNames[Math.floor(Math.random() * kazakhLastNames.length)];
  
  // Adjust last name ending for gender in Kazakh tradition
  if (gender === "female" && !lastName.endsWith("a") && !lastName.endsWith("ova")) {
    if (lastName.endsWith("ov")) {
      lastName = lastName.substring(0, lastName.length - 2) + "ova";
    } else if (lastName.endsWith("ev")) {
      lastName = lastName.substring(0, lastName.length - 2) + "eva";
    } else {
      lastName = lastName + "a";
    }
  }
  
  const name = `${firstName} ${lastName}`;
  const email = `student${index+1}@sleepystudy.kz`.toLowerCase();
  const password = "password123"; // Default password
  const role = "student"; // All generated users are students
  const grade = `${Math.floor(Math.random() * 4) + 9}`; // Grades 9-12
  
  return { name, email, password, role, grade };
};

// Main function to create users
const createSyntheticUsers = async () => {
  console.log("Starting to create 24 synthetic users...");
  
  for (let i = 0; i < 24; i++) {
    try {
      const userData = generateRandomUser(i);
      console.log(`Creating user ${i+1}/24: ${userData.name} (${userData.email})`);
      
      try {
        // Create user in Firebase Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(
          authInstance, 
          userData.email, 
          userData.password
        );
        
        // Add user data to Firestore
        await firestore.setDoc(firestore.doc(db, "users", userCredential.user.uid), {
          name: userData.name,
          email: userData.email,
          role: userData.role,
          grade: userData.grade,
          createdAt: new Date()
        });
        
        console.log(`✅ Successfully created user: ${userData.name}`);
      } catch (authError) {
        if (authError.code === 'auth/email-already-in-use') {
          console.log(`⚠️ User with email ${userData.email} already exists, skipping...`);
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