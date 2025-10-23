import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const LoginForm = ({ onSwitchToSignup }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');      // For students: this will be their full name
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isStudent, setIsStudent] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsStudent(false);

    const emailToUse = email.trim();
    const passwordToUse = password;

    try {
      // Step 1: Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, emailToUse, passwordToUse);
      const user = userCredential.user;

      // Step 2: Check if it's an admin
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      if (adminDoc.exists()) {
        return navigate('/AdminPage');
      }

      // Step 3: Check if it's a teacher
      const teacherDoc = await getDoc(doc(db, 'teachers', user.uid));
      if (teacherDoc.exists()) {
        return navigate('/TeacherPage');
      }

      // Step 4: Check if it's a student
      const studentDoc = await getDoc(doc(db, 'students', user.uid));
      if (studentDoc.exists()) {
        const studentData = studentDoc.data();
        const isFirstLogin = studentData.firstLogin !== false; // default to true if field missing

        if (isFirstLogin) {
          // Optional: update Firestore to mark first login as done *after* they proceed
          // But usually better to update after pre-test is submitted or acknowledged
          navigate('/StudentPreTest');
        } else {
          navigate('/StudentPage');
        }
        return;
      }

      setError('User profile not found.');

    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid login credentials.');
    }
  };
  const handlePopupOk = () => {
    //setIsStudent(false);
    navigate('/StudentPreTest');
  };

  return (
    <div className="w-full h-[420px] flex flex-col justify-center px-8 py-6">
      <h2 className="text-2xl font-bold mb-6">Welcome Back</h2>
      {error && <p className="text-red-500">{error}</p>}

      <form onSubmit={handleLogin} className="space-y-4">
        {/* Username / Email */}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#fcb436]"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#fcb436]"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-[#fcb436] text-white font-semibold py-2 rounded-md hover:bg-[#fcb436] transition"
        >
          Sign In
        </button>
      </form>

      {/* Helper Text */}
      <p className="text-xs text-white mt-4 text-center">
        Teachers: use your email. Students: use parents email.
      </p>

      {/* Switch to Signup Link */}
      <div className="mt-6 text-center">
        <p>
          No account?{' '}
          <button onClick={onSwitchToSignup} className="font-semibold text-[#fcb436] underline">
            Create one
          </button>
        </p>
      </div>

      {/* Success Popup for Students */}
      {isStudent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md shadow-lg max-w-xs w-full text-center">
            <h3 className="text-lg font-bold mb-4">Login Successful!</h3>
            <button
              onClick={handlePopupOk}
              className="bg-[#fcb436] text-white px-4 py-2 rounded-md"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginForm;