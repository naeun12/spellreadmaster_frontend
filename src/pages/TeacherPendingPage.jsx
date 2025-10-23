// TeacherPendingPage.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const TeacherPendingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { status = 'Unverified', message = 'Your account is awaiting approval.' } = location.state || {};

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Icon based on status */}
        <div className="mb-6">
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${
            status === 'Pending' 
              ? 'bg-yellow-100' 
              : 'bg-gray-100'
          }`}>
            <span className="text-5xl">
              {status === 'Pending' ? '⏳' : '🔒'}
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          {status === 'Pending' ? 'Account Pending Approval' : 'Account Not Verified'}
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Status Badge */}
        <div className="mb-8">
          <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
            status === 'Pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            Status: {status}
          </span>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm text-blue-800 mb-2">
            <strong>What happens next?</strong>
          </p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• An administrator will review your account</li>
            <li>• You will receive an email notification once approved</li>
            <li>• This usually takes 1-2 business days</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Check Status Again
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Contact */}
        <p className="text-sm text-gray-500 mt-6">
          Need help? Contact us at{' '}
          <a href="mailto:admin@example.com" className="text-blue-600 hover:underline">
            admin@example.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default TeacherPendingPage;