import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Star, Trophy, Volume2 } from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [studentData, setStudentData] = useState({
    name: "Student",
    grade: "Grade 1",
    avatar: "",
    completedLevels: [], // ✅ Added
    currentLevel: 1,     // ✅ Matches LBLM
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const studentDoc = await getDoc(doc(db, 'students', user.uid));
          if (studentDoc.exists()) {
            const data = studentDoc.data();
            // ✅ Extract LBLM-relevant fields
            const completedLevels = data.completedLevels || [];
            const currentLevel = data.currentLevel || 1;
            setStudentData({
              name: data.fullName || data.name || "Student",
              grade: data.grade || "Grade 1",
              avatar: data.avatar || "👧",
              completedLevels, // ✅ Used for totalPoints
              currentLevel,    // ✅ Used for Level display
            });
          }
        } catch (error) {
          console.error("Error fetching student data:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ Compute adaptive totalPoints
  const totalPoints = studentData.completedLevels.length * 3;

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
    <>
      <header className="fixed w-full top-0 left-0 z-50 bg-gradient-to-r from-orange-400 to-red-400 shadow-lg transition-all duration-300 ease-in-out">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-3xl">
                {studentData.avatar.startsWith('<svg') ? (
                  <div className="inline-block w-12 h-12 rounded-xl shadow-md overflow-hidden border-2 border-white/20">
                    <svg
                      dangerouslySetInnerHTML={{ __html: studentData.avatar.replace(/<svg[^>]*>/, '<svg>') }}
                      width="48"
                      height="48"
                      viewBox="0 0 200 200"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md bg-white/20 border-2 border-white/20">
                    {studentData.avatar}
                  </div>
                )}
              </div>
              <div className="text-white">
                <div className="text-lg font-bold">{studentData.name}</div>
                <div className="text-sm opacity-90">{studentData.grade}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-white">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 fill-current text-yellow-200" />
                <span className="font-bold">{totalPoints}</span> {/* ✅ Adaptive */}
              </div>
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-200" />
                <span className="font-bold">Level {studentData.currentLevel}</span> {/* ✅ LBLM current level */}
              </div>
              <div className="w-px h-6 bg-white opacity-30"></div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 hover:bg-white hover:text-black hover:bg-opacity-20 rounded-full px-3 py-2 transition-colors"
                title="Exit"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="font-medium text-sm hidden sm:inline">Exit</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm mx-4 shadow-2xl transform transition-transform duration-300 ease-in-out scale-100">
            <div className="text-center">
              <div className="text-6xl mb-4">👋</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">See You Soon!</h3>
              <p className="text-gray-600 mb-6">Do you want to leave your learning adventure?</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  Stay Here
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 bg-gradient-to-r from-orange-400 to-red-400 hover:from-orange-500 hover:to-red-500 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  Exit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;