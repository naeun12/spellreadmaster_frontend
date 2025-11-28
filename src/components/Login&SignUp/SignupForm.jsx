import React, { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';
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
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters");
      return;
    }

    try {
      // Step 1: Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Step 2: Send verification email
      await sendEmailVerification(user);

      // Step 3: Generate teacher ID
      const teacherId = 'T' + Date.now().toString().slice(-8);

      // Step 4: Save teacher info to Firestore (NO status field)
      await setDoc(doc(db, 'teachers', user.uid), {
        fullName,
        email,
        teacherId,
        role: 'teacher',
        emailVerified: false,
        createdAt: new Date()
      });

      // Show success popup
      setShowSuccess(true);

    } catch (err) {
      console.error("Error during signup:", err);

      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Invalid email address.");
      } else {
        setError(err.message || "An error occurred during signup.");
      }
    }
  };

  const handleContinue = () => {
    setShowSuccess(false);
    onSwitchToLogin(); // Switch back to login form
  };

  return (
    <div className="w-full h-[420px] flex flex-col justify-center px-8 py-6 relative">
      {/* Success Popup Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h3 className="text-xl font-semibold text-green-600 mb-3">Account Created!</h3>
              
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-semibold mb-2">
                  📧 Verification Email Sent
                </p>
                <p className="text-xs text-blue-700 mb-2">
                  We've sent a verification link to <strong>{email}</strong>
                </p>
                <p className="text-xs text-blue-600">
                  Please check your inbox and click the link to verify your email.
                </p>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Once verified, you can log in and access your account immediately!
              </p>
              
              <button
                onClick={handleContinue}
                className="w-full px-4 py-2 bg-[#fcb436] text-white rounded-md hover:bg-[#e0a230] transition"
              >
                Go to Login
              </button>
            </div>
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

        <button
          type="submit"
          className="w-full bg-[#fcb436] text-white font-semibold py-2 rounded-md hover:bg-[#e0a230] transition"
        >
          Sign Up
        </button>
      </form>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-xs text-blue-800">
          ℹ️ Please verify your email after signup before logging in.
        </p>
      </div>

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