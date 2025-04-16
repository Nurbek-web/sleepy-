const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');

// IMPORTANT: Replace these placeholder values with your actual Firebase configuration
// You can find these values in your Firebase console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Check if configuration has been updated
if (firebaseConfig.apiKey === "YOUR_API_KEY") {
  console.error("⚠️ Firebase configuration not updated!");
  console.error("Please edit the script and add your Firebase configuration values.");
  console.error("You can find these in your Firebase project settings.");
  process.exit(1);
}

// Initialize Firebase
console.log("Initializing Firebase...");
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

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
      
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      // Add user data to Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        grade: userData.grade,
        createdAt: new Date()
      });
      
      console.log(`✅ Successfully created user: ${userData.name}`);
      
      // Add a small delay to avoid hitting Firebase rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Error creating user ${i+1}:`, error);
      console.error(error.message);
    }
  }
  
  console.log("Completed user generation process.");
  process.exit(0);
};

// Run the function
createSyntheticUsers(); 