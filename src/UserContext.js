import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userDietPlans, setUserDietPlans] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Fetch user profile
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data());
        }

        // Fetch diet plans subcollection
        const dietPlansRef = collection(userDocRef, 'dietPlansUsers');
        const dietPlansSnap = await getDocs(dietPlansRef);
        const dietPlans = dietPlansSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUserDietPlans(dietPlans);
      } else {
        setUser(null);
        setUserProfile(null);
        setUserDietPlans([]);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ 
      user, 
      userProfile, 
      userDietPlans 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);