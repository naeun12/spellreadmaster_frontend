// ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/');
        return;
      }

      try {
        // Get user role and data
        //const studentDoc = await getDoc(doc(db, 'students', user.uid));
        const teacherDoc = await getDoc(doc(db, 'teachers', user.uid));
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));

        let userRole = 'student';
        let teacherData = null;

        if (teacherDoc.exists()) {
          userRole = 'teacher';
          teacherData = teacherDoc.data();
        }
        if (adminDoc.exists()) {
          userRole = 'admin';
        }

        // Check teacher status - only "Approved" teachers can access
        if (userRole === 'teacher' && teacherData) {
          const status = teacherData.status || 'Unverified';
          
          if (status !== 'Approved') {
            // Redirect to a "waiting for approval" page or show message
            navigate('/teacher-pending', { 
              state: { 
                status: status,
                message: status === 'Pending' 
                  ? 'Your account is pending approval. Please wait for admin verification.'
                  : 'Your account is not yet verified. Please contact the administrator.'
              }
            });
            return;
          }
        }

        // Check if user has permission for this route
        if (!allowedRoles.includes(userRole)) {
          switch (userRole) {
            case 'student':
              navigate('/StudentPage');
              break;
            case 'teacher':
              navigate('/TeacherPage');
              break;
            case 'admin':
              navigate('/AdminDashboard');
              break;
            default:
              navigate('/');
          }
          return;
        }

        setChecking(false);
      } catch (error) {
        console.error('Error checking user permissions:', error);
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate, allowedRoles]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;