import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "Enter your Google_API_KEY",
  authDomain: "genai-diet-app.firebaseapp.com",
  projectId: "genai-diet-app",
  storageBucket: "genai-diet-app.appspot.com",
  messagingSenderId: "589970417601",
  appId: "1:589970417601:web:54c1b55d05049ca8d07140",
  measurementId: "G-E17TJ3TXMQ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);
const provider = new GoogleAuthProvider();

provider.addScope("profile");
provider.addScope("email");

// Utility: Check if email already exists
const checkEmailExists = async (email) => {
  try {
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking email existence:", error);
    throw error;
  }
};

// Utility: Create or update user profile
const createUserProfile = async (user, additionalData = {}) => {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);

  try {
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        // Create main user document
        transaction.set(userRef, {
          email: user.email,
          firstName: additionalData.firstName || "",
          lastName: additionalData.lastName || "",
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          provider: additionalData.provider || "email",
        });
        if (additionalData.dietPlanData) {
          const dietPlansRef = collection(userRef, "dietPlansUsers");
          transaction.set(doc(dietPlansRef), {
            ...additionalData.dietPlanData,
            createdAt: serverTimestamp(),
          });
        }
      } else {
        // Update last login
        transaction.update(userRef, { 
          lastLogin: serverTimestamp() 
        });
      }
    });

    console.log("User profile created/updated successfully");
  } catch (error) {
    console.error("Error creating/updating user profile:", error);
    throw error;
  }
};

// Auth Service
const authService = {
  signUp: async (email, password, userData) => {
    try {
      const emailExists = await checkEmailExists(email);
      if (emailExists) {
        throw new Error("Email already in use");
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Separate diet plan data from user profile data
      const { dietPlanData, ...profileData } = userData;

      await createUserProfile(user, {
        ...profileData,
        dietPlanData: dietPlanData || null
      });

      return user;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  },

  signIn: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(
        doc(db, "users", user.uid),
        { lastLogin: serverTimestamp() },
        { merge: true }
      );

      return user;
    } catch (error) {
      console.error("Signin error:", error);
      throw error;
    }
  },

  signInWithGoogle: async (userData) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await createUserProfile(user, {
        ...userData,
        provider: "Google",
      });

      return user;
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      throw error;
    }
  },

  linkProviders: async (email, password) => {
    try {
      const credential = EmailAuthProvider.credential(email, password);
      const userCredential = await linkWithCredential(auth.currentUser, credential);
      return userCredential.user;
    } catch (error) {
      console.error("Provider linking error:", error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      console.log("User signed out successfully");
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  },
};

// Create or update diet plan function
export const saveDietPlan = async (userId, dietPlanData) => {
  try {
    // Reference to the user's document
    const userRef = doc(db, "users", userId);

    // Reference to the DietPlansUsers subcollection
    const dietPlansRef = collection(userRef, "DietPlansUsers");

    // Create a new diet plan document in the subcollection
    const dietPlanDoc = await addDoc(dietPlansRef, {
      // User inputs
      userInputs: {
        gender: dietPlanData.gender,
        femaleCondition: dietPlanData.femaleCondition,
        height: Number(dietPlanData.height),
        weight: Number(dietPlanData.weight),
        age: Number(dietPlanData.age),
        goal: dietPlanData.goal,
        specificDiet: dietPlanData.specificDiet,
        dietType: dietPlanData.dietType,
        illness: dietPlanData.illness,
        illnessType: dietPlanData.illnessType,
        cuisine: Array.isArray(dietPlanData.cuisine) ? dietPlanData.cuisine : [],
        allergy: dietPlanData.allergy,
        allergyType: dietPlanData.allergyType,
        tastePreferences: Array.isArray(dietPlanData.tastePreferences) 
          ? dietPlanData.tastePreferences 
          : []
      },
      // Diet plan content
      dietPlan: dietPlanData.dietPlan,
      personalizedTips: dietPlanData.personalizedTips,
      // Metadata
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active'
    });

    console.log("Diet plan created successfully with ID:", dietPlanDoc.id);
    return dietPlanDoc.id;

  } catch (error) {
    console.error("Error saving diet plan:", error);
    throw error;
  }
};

// Function to fetch user's diet plans
export const getUserDietPlans = async (userId) => {
  try {
    const dietPlansRef = collection(doc(db, "users", userId), "DietPlansUsers");
    const querySnapshot = await getDocs(dietPlansRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

  } catch (error) {
    console.error("Error fetching diet plans:", error);
    throw error;
  }
};

export {
  app,
  auth,
  db,
  analytics,
  provider,
  authService,
  createUserProfile
};
