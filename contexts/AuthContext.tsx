'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  deleteUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  User as FirebaseUser,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth, storage, db } from '../components/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  doc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

interface AuthContextType {
  user: FirebaseUser | null;
  signup: (
    email: string,
    password: string,
    displayName: string,
    photoFile?: File
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
  updateProfilePhoto: (photoFile: File) => Promise<void>;
  reauthenticateUser: (password: string) => Promise<void>;
  acceptRequest: (request: any) => Promise<void>;
  deleteUserAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user ?? null);
    });
    return () => unsubscribe();
  }, []);

  const signup = async (
    email: string,
    password: string,
    displayName: string,
    photoFile?: File
  ) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    let photoURL = '';

    if (photoFile) {
      const storageRef = ref(storage, `profileImages/${userCredential.user.uid}`);
      await uploadBytes(storageRef, photoFile);
      photoURL = await getDownloadURL(storageRef);
    }

    await updateProfile(userCredential.user, {
      displayName,
      photoURL,
    });

    await auth.currentUser?.reload();
    setUser(auth.currentUser);
  };

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth).then(() => {
      setUser(null);
      router.push('/login');
    });
  };

  const resetPassword = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  const updateDisplayName = async (displayName: string) => {
    if (!auth.currentUser) return;
    await updateProfile(auth.currentUser, { displayName });
    await auth.currentUser.reload();
    setUser({ ...auth.currentUser });
  };

  const updateProfilePhoto = async (photoFile: File) => {
    if (!auth.currentUser) return;
    const storageRef = ref(storage, `profileImages/${auth.currentUser.uid}`);
    await uploadBytes(storageRef, photoFile);
    const photoURL = await getDownloadURL(storageRef);
    await updateProfile(auth.currentUser, { photoURL });
    await auth.currentUser.reload();
    setUser({ ...auth.currentUser });
  };

  const reauthenticateUser = async (password: string) => {
    if (!auth.currentUser || !auth.currentUser.email) throw new Error('Utilisateur non connecté');
    const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
    await reauthenticateWithCredential(auth.currentUser, credential);
  };

  const acceptRequest = async (request: any) => {
    const requestRef = doc(db, 'requests', request.id);
    await updateDoc(requestRef, { status: 'accepted' });
  };

  const deleteUserAccount = async () => {
    if (!auth.currentUser) throw new Error('Aucun utilisateur connecté');
    const uid = auth.currentUser.uid;

    // 🔸 Suppressions liées
    const deleteCollectionDocs = async (collectionName: string) => {
      const snapshot = await getDocs(query(collection(db, collectionName), where('userId', '==', uid)));
      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, collectionName, docSnap.id));
      }
    };

    await Promise.all([
      deleteDoc(doc(db, 'users', uid)),
      deleteCollectionDocs('orders'),
      deleteCollectionDocs('messages'),
      deleteCollectionDocs('comments'),
      deleteCollectionDocs('ratings'),
    ]);

    await deleteUser(auth.currentUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signup,
        login,
        logout,
        resetPassword,
        updateDisplayName,
        updateProfilePhoto,
        reauthenticateUser,
        acceptRequest,
        deleteUserAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
