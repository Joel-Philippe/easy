import React, { useState, useEffect } from 'react';
import { db } from '@/components/firebaseConfig';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react'; // ou une autre icône
import '../app/CommentSection.css';

interface Comment {
  id: string;
  username: string;
  content: string;
  photoURL: string;
  userId: string;
  parentId: string | null;
  createdAt: Timestamp;
}

interface CommentSectionProps {
  productId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ productId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);

  const fetchComments = async () => {
    const q = query(
      collection(db, 'comments'),
      where('productId', '==', productId),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    const data: Comment[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Comment[];

    setComments(data);
  };

  useEffect(() => {
    fetchComments();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    const commentData = {
      productId,
      username: user.displayName || 'Utilisateur',
      content: newComment,
      photoURL: user.photoURL || '',
      userId: user.uid,
      parentId: replyTo,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'comments'), commentData);
    setComments([...comments, { ...commentData, id: docRef.id }]);
    setNewComment('');
    setReplyTo(null);
  };

  const handleDelete = async (commentId: string) => {
    await deleteDoc(doc(db, 'comments', commentId));
    setComments(comments.filter(c => c.id !== commentId && c.parentId !== commentId));
  };

  const renderComments = (parentId: string | null = null, level = 0) => {
    return comments
      .filter(comment => comment.parentId === parentId)
      .map(comment => (
        <div key={comment.id} style={{ marginLeft: level * 20, marginBottom: 12 }}>
          <div className="comment-container">
            <img src={comment.photoURL} alt="profil" className="comment-avatar" />
            <div>
              <strong className='pseudo-comment'>{comment.username}</strong>
              <p>{comment.content}</p>
              <div className="comment-actions">
                {user && (
                  <button
                    className="comment-btn reply"
                    onClick={() => setReplyTo(comment.id)}
                  >
                    Répondre
                  </button>
                )}
                {user?.uid === comment.userId && (
                  <button
                    className="comment-btn delete"
                    onClick={() => handleDelete(comment.id)}
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          </div>
          {renderComments(comment.id, level + 1)}
        </div>
      ));
  };

  const totalComments = comments.filter(c => !c.parentId).length;

  return (
    <div className="comment-section">
      <button
        onClick={() => setShowComments(prev => !prev)}
        className="flex items-center gap-2 px-4 py-2 mb-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all"
      >
        <motion.div
          animate={{ rotate: showComments ? 45 : 0 }}
          transition={{ duration: 0.3 }}
        >
        </motion.div>
        <div className="comment_button">
        {showComments ? 'Cacher les commentaires' : 'Afficher les commentaires'}
        </div>
      </button>

      <AnimatePresence>
        {showComments && (
          <motion.div
            key="comments"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden"
          >
            <h3 className="mb-2">
              {totalComments} Commentaire{totalComments > 1 ? 's' : ''}
            </h3>
            {renderComments()}
            {user ? (
              <form onSubmit={handleSubmit} className="comment-form">
                {replyTo && (
                  <div className="replying-to">
                    Réponse à un commentaire —
                    <button type="button" onClick={() => setReplyTo(null)}>
                      Annuler
                    </button>
                  </div>
                )}
                <textarea
                  placeholder="Votre commentaire"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button type="submit">Envoyer</button>
              </form>
            ) : (
              <p>Connectez-vous pour commenter.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommentSection;
