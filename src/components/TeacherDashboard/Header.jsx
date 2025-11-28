// src/components/Header.jsx (Teacher)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import ConfirmLogoutModal from '../ConfirmLogoutModal';

const Header = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  // ✅ Initialize from Firebase Auth to prevent flicker
  const [displayName, setDisplayName] = useState(() => {
    const user = auth.currentUser;
    return user?.displayName || user?.email?.split('@')[0] || 'Teacher';
  });

  const [photoURL, setPhotoURL] = useState(() => {
    const user = auth.currentUser;
    return user?.photoURL || 'https://i.pravatar.cc/150?img=13';
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setDisplayName('Guest');
      setPhotoURL('https://i.pravatar.cc/150?img=13');
      return;
    }

    const fetchTeacherData = async () => {
      try {
        const teacherDoc = await getDoc(doc(db, 'teachers', user.uid));
        if (teacherDoc.exists()) {
          const data = teacherDoc.data();
          // ✅ Use 'fullName' — as you confirmed for teachers
          setDisplayName(data.fullName || user.displayName || user.email?.split('@')[0] || 'Teacher');
          // Sync photo if Firestore has it (should match Auth)
          if (data.photoURL) {
            setPhotoURL(data.photoURL);
          }
        }
        // If no doc, keep initial values from Auth → no flicker!
      } catch (error) {
        console.error('Error fetching teacher ', error);
        // Don't reset state — keep current (smooth fallback)
      }
    };

    fetchTeacherData();
  }, []);

  const handleLogout = () => {
    setShowModal(true);
  };

  const confirmLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="fixed w-full flex items-center justify-between h-14 text-white z-10 bg-[#FCC636]">
      {/* Left Section */}
      <div className="flex items-center justify-start md:justify-center pl-3 w-14 md:w-64 h-14">
        <img
          src={photoURL}
          alt="Profile"
          className="w-7 h-7 md:w-10 md:h-10 mr-2 rounded-md object-cover"
          onError={() => setPhotoURL('https://i.pravatar.cc/150?img=13')}
        />
        {/* Name and Role */}
        <div className="hidden md:block">
          <div className="font-medium">{displayName}</div>
          <div className="text-xs opacity-90">Teacher</div> {/* ← Role added here */}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex-1 flex justify-between items-center h-14 px-4">
        <ul className="flex items-center space-x-4 ml-auto">
          <li>
            <div className="block w-px h-6 mx-3 bg-white"></div>
          </li>
          <li>
            <button
              onClick={handleLogout}
              className="flex items-center hover:text-black focus:outline-none"
              type="button"
            >
              <span className="inline-flex mr-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </span>
              Logout
            </button>
            {showModal && (
              <ConfirmLogoutModal
                onConfirm={confirmLogout}
                onCancel={() => setShowModal(false)}
              />
            )}
          </li>
        </ul>
      </div>
    </header>
  );
};

export default Header;