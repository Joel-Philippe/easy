'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { deleteUser, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, updateProfile, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth, storage, db } from '../components/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user ? user : null);
    });
    return () => unsubscribe();
  }, []);

  const signup = async (email, password, displayName, photoFile) => {
    try {
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

      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;

      setUser({
        ...updatedUser,
        displayName: updatedUser.displayName,
        photoURL: updatedUser.photoURL,
      });
    } catch (error) {
      console.error('Error signing up:', error);
      throw new Error('Erreur lors de la création du compte.');
    }
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth).then(() => {
      setUser(null);
      router.push('/login');
    });
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const updateDisplayName = async (displayName) => {
    try {
      await updateProfile(auth.currentUser, { displayName });
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser });
    } catch (error) {
      console.error('Error updating display name:', error);
      throw new Error('Erreur lors de la mise à jour du pseudo.');
    }
  };

  const updateProfilePhoto = async (photoFile) => {
    try {
      const storageRef = ref(storage, `profileImages/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, photoFile);
      const photoURL = await getDownloadURL(storageRef);
      await updateProfile(auth.currentUser, { photoURL });
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser });
    } catch (error) {
      console.error('Error updating profile photo:', error);
      throw new Error('Erreur lors de la mise à jour de la photo de profil.');
    }
  };

  const reauthenticateUser = async (password) => {
    if (!auth.currentUser || !auth.currentUser.email) throw new Error("Utilisateur non connecté");
    const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
    await reauthenticateWithCredential(auth.currentUser, credential);
  };

  const acceptRequest = async (request) => {
    try {
      const requestRef = doc(db, 'requests', request.id);
      await updateDoc(requestRef, { status: 'accepted' });
    } catch (error) {
      console.error('Error accepting request:', error);
      throw new Error('Erreur lors de l\'acceptation de la demande.');
    }
  };

  const deleteUserAccount = async () => {
    if (!auth.currentUser) throw new Error("Aucun utilisateur connecté");

    const uid = auth.currentUser.uid;

    try {
      // 🔸 Supprimer le document utilisateur
      await deleteDoc(doc(db, 'users', uid));

      // 🔸 Supprimer les commandes liées
      const ordersSnapshot = await getDocs(query(collection(db, 'orders'), where('userId', '==', uid)));
      for (const docSnap of ordersSnapshot.docs) {
        await deleteDoc(doc(db, 'orders', docSnap.id));
      }

      // 🔸 Supprimer les messages liés
      const messagesSnapshot = await getDocs(query(collection(db, 'messages'), where('userId', '==', uid)));
      for (const docSnap of messagesSnapshot.docs) {
        await deleteDoc(doc(db, 'messages', docSnap.id));
      }

      // 🔸 Supprimer les commentaires liés
      const commentsSnapshot = await getDocs(query(collection(db, 'comments'), where('userId', '==', uid)));
      for (const docSnap of commentsSnapshot.docs) {
        await deleteDoc(doc(db, 'comments', docSnap.id));
      }

      // 🔸 Supprimer les évaluations liées
      const ratingsSnapshot = await getDocs(query(collection(db, 'ratings'), where('userId', '==', uid)));
      for (const docSnap of ratingsSnapshot.docs) {
        await deleteDoc(doc(db, 'ratings', docSnap.id));
      }

      // ✅ Supprimer le compte utilisateur Firebase
      await deleteUser(auth.currentUser);
    } catch (error) {
      console.error("Erreur lors de la suppression du compte : ", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      signup,
      login,
      logout,
      resetPassword,
      updateDisplayName,
      updateProfilePhoto,
      reauthenticateUser,
      acceptRequest,
      deleteUserAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
