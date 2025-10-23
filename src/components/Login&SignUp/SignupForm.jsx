import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db, doc, setDoc } from '../../firebase';
import { useNavigate } from 'react-router-dom';

const SignupForm = ({ onSwitchToLogin }) => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Generate teacher ID
      const teacherId = 'T' + Date.now().toString().slice(-8);

      // Save teacher info to Firestore with "Pending" status
      await setDoc(doc(db, 'teachers', user.uid), {
        fullName,
        email,
        teacherId,
        role: 'teacher',
        status: 'Pending', // ← New teachers start as "Pending"
        createdAt: new Date()
      });

      // Show success popup
      setShowSuccess(true);

      // Redirect to pending page after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/teacher-pending', {
          state: {
            status: 'Pending',
            message: 'Your account has been created successfully! Please wait for admin approval before you can access the system.'
          }
        });
      }, 2000);
    } catch (err) {
      console.error("Error during signup:", err);

      if (err.code === 'permission-denied') {
        setError("Permission denied. Please check Firestore rules.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="w-full h-[420px] flex flex-col justify-center px-8 py-6 relative">
      {/* Success Popup Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg max-w-sm w-full text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">✓</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-green-600">Account Created!</h3>
            <p className="mt-2 text-gray-700">
              Your registration is pending admin approval.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              You will be notified once your account is approved.
            </p>
            <button
              onClick={() => {
                setShowSuccess(false);
                navigate('/teacher-pending', {
                  state: {
                    status: 'Pending',
                    message: 'Your account has been created successfully! Please wait for admin approval.'
                  }
                });
              }}
              className="mt-4 px-4 py-2 bg-[#fcb436] text-white rounded-md hover:bg-[#e0a230] transition"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6">Create Account</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      <form onSubmit={handleSignup} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#fcb436]"
          />
        </div>

        {/* Email (used as username here) */}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
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
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#fcb436]"
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <input
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#fcb436]"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-[#fcb436] text-white font-semibold py-2 rounded-md hover:bg-[#e0a230] transition"
        >
          Sign Up
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-xs text-blue-800">
          ℹ️ Your account will be reviewed by an administrator before you can access the system.
        </p>
      </div>

      {/* Switch to Login Link */}
      <div className="mt-4 text-center">
        <p>
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="font-semibold text-[#fcb436] underline">
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignupForm;