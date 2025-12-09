import { 
    signInWithPopup, 
    GoogleAuthProvider, 
    signOut as firebaseSignOut,
    User as FirebaseUser
  } from "firebase/auth";
  import { doc, getDoc, setDoc } from "firebase/firestore";
  import { auth, db } from "./firebase";
  import { User, UserRole } from "../types";
  
  const googleProvider = new GoogleAuthProvider();
  
  // ------------------------------------------------------------------
  // ADMIN CONFIGURATION
  // Add or remove emails here to control who gets Admin access.
  // ------------------------------------------------------------------
  const ADMIN_EMAILS = [
    "hearfromfaisal@gmail.com",
    // "your.new.email@example.com" 
  ];
  
  /**
   * Signs in with Google and ensures a User document exists in Firestore.
   */
  export const signInWithGoogle = async (): Promise<User | null> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      
      // Check if user exists in Firestore
      const userRef = doc(db, "users", fbUser.uid);
      const userSnap = await getDoc(userRef);
  
      let userData: User;
      
      // LOGIC: Check if this email is in our admin list
      const isAdminEmail = ADMIN_EMAILS.includes(fbUser.email || "");
  
      if (userSnap.exists()) {
        userData = userSnap.data() as User;
        
        // Auto-fix: If this user is listed as admin in code but not in DB, update them.
        if (isAdminEmail && userData.role !== UserRole.ADMIN) {
            userData.role = UserRole.ADMIN;
            await setDoc(userRef, { role: UserRole.ADMIN }, { merge: true });
        }
      } else {
        // Create new user document
        userData = {
          uid: fbUser.uid,
          email: fbUser.email || "",
          name: fbUser.displayName || "Unknown User",
          role: isAdminEmail ? UserRole.ADMIN : UserRole.STUDENT, 
        };
        await setDoc(userRef, userData);
      }
  
      return userData;
    } catch (error) {
      console.error("Error signing in", error);
      return null;
    }
  };
  
  export const logOut = async () => {
    await firebaseSignOut(auth);
  };
  
  /**
   * Helper to get custom user data from Firestore based on Auth UID
   */
  export const getUserProfile = async (uid: string): Promise<User | null> => {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data() as User;
    }
    return null;
  };