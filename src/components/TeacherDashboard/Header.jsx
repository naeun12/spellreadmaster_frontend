import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import ConfirmLogoutModal from '../ConfirmLogoutModal';

const Header = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [displayName, setDisplayName] = useState('Loading...');

  // Fetch teacher name from 'teachers' collection
  useEffect(() => {
    const fetchTeacherName = async () => {
      const user = auth.currentUser;
      if (!user) {
        setDisplayName('Guest');
        return;
      }

      try {
        const teacherDoc = await getDoc(doc(db, 'teachers', user.uid));
        if (teacherDoc.exists()) {
          const name = teacherDoc.data().fullName;
          setDisplayName(name || 'Teacher');
        } else {
          // Fallback if doc doesn't exist
          setDisplayName(user.email?.split('@')[0] || 'Teacher');
        }
      } catch (error) {
        console.error('Error fetching teacher name:', error);
        setDisplayName('Teacher');
      }
    };

    fetchTeacherName();
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
          src="https://i.pravatar.cc/150?img=13"
          alt=""
          className="w-7 h-7 md:w-10 md:h-10 mr-2 rounded-md overflow-hidden"
        />
        <span className="hidden md:block ml-2">{displayName}</span>
      </div>

      {/* Right Section */}
      <div className="flex-1 flex justify-between items-center h-14 px-4">
        {/* Logout */}
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