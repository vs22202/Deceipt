// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithRedirect,
  getRedirectResult
} from "firebase/auth";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { collection, getFirestore } from "firebase/firestore";
import { writeBatch, doc,getDoc } from "firebase/firestore"; 

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyASFbrAoIVTyAxBlRGVCFcmRKD-V96WDpI",
  authDomain: "deceipt-f33bd.firebaseapp.com",
  projectId: "deceipt-f33bd",
  storageBucket: "deceipt-f33bd.appspot.com",
  messagingSenderId: "672628649707",
  appId: "1:672628649707:web:df011c4d374e7c431318ae",
  measurementId: "G-TC5253TRZM",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
export const auth = getAuth();
export const signUpUser = async (email, password) => {
  const res = await createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      return { user };
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      return { errorMessage };
    });
  return res;
};
export const loginUser = async (email, password) => {
  const res = await signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in
      const user = userCredential.user;
      return { user, errorCode: "logged-in" };
      // ...
    })
    .catch((error) => {
      const errorCode = error.code;
      return { errorCode };
    });
  return res;
};
export const signupUser = async (email, password) => {
  const res = await createUserWithEmailAndPassword(auth, email, password)
    .catch((error) => {
      const errorCode = error.code;
      return { errorCode };
    });
  return res;
};
export const signOutUser = async () => {
  const res = await signOut(auth)
    .then(() => {
      return true;
    })
    .catch((error) => {
      return false;
    });
  return res;
};
export const googleLoginUser = async () => {
  signInWithRedirect(auth, provider)
};
export const redirectResult = async () => {
  const res = getRedirectResult(auth)
  .then((result) => {
    // This gives you a Google Access Token. You can use it to access Google APIs.
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;

    // The signed-in user info.
    const user = result.user;
    // IdP data available using getAdditionalUserInfo(result)
    // ...
    return ({user , errorCode: "logged-in"})
  }).catch((error) => {
    // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;
    // The email of the user's account used.
    const email = error.customData?.email;
    // The AuthCredential type that was used.
    const credential = GoogleAuthProvider.credentialFromError(error);
    // ...
    return ({errorCode})
  });
  return res;
}
export const batchUploadResults = async (results,uid) => {

  const batch = writeBatch(db);
  const ref = doc(db,"userResults",uid)
  
  Object.entries(results).forEach((result) => {
    const [key, value] = result;
    const obj = {}
    obj[key] = value;
    batch.set(ref, obj,{ merge: true });  
  })

  await batch.commit();
}
export const getUserTransaction = async (uid)=>{

  const docSnap = await getDoc(doc(db, "userResults", uid));
  if (docSnap.exists()) {
    return docSnap.data();
  }

}
export const currentUser = auth.currentUser;
