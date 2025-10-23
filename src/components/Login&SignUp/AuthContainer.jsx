// AuthContainer.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import Form from '../../assets/Form.png';
import { useNavigate } from 'react-router-dom'; // Import navigate

const AuthContainer = ({ mode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const navigate = useNavigate(); // Hook for navigation

  const handleSwitchToLogin = () => setIsLogin(true);
  const handleSwitchToSignup = () => setIsLogin(false);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen flex items-center justify-center bg-light p-4 relative"
    >
      {/* Back Button - Now uses React Router */}
      <button
        onClick={() => navigate(-1)} // Go back in history
        className="absolute top-4 left-4 z-10 px-4 py-2 bg-[#fcb436] text-white rounded-full 
                  shadow-md hover:bg-gradient-to-br hover:from-[#fcb436] hover:to-[#fcb436]/50 
                  hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#fcb436]/50 focus:ring-offset-2 
                  transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
      >
        ← Back
      </button>

      {/* Main Container */}
      <div className="relative w-full max-w-6xl h-[600px] bg-white rounded-2xl shadow-[0px_40px_80px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row">
        {/* Left Panel - Form */}
        <div className="w-full md:w-1/2 p-8 bg-white flex items-center justify-center">
          <div className="w-full max-w-md h-[500px] flex items-center justify-center">
            <motion.div
              key={isLogin ? 'login' : 'signup'}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {isLogin ? (
                <LoginForm onSwitchToSignup={handleSwitchToSignup} />
              ) : (
                <SignupForm onSwitchToLogin={handleSwitchToLogin} />
              )}
            </motion.div>
          </div>
        </div>

        {/* Right Panel - Image/Illustration */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-500 to-blue-700">
          <img
            src={Form}
            alt="Auth Illustration"
            className="object-cover w-full h-full rounded-r-2xl"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default AuthContainer;