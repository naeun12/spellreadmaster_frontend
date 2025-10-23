// components/Layout/HomeLayout.jsx
import React from 'react';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';

const HomeLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-light text-gray-900 font-poppins">
      
      <main>{children}</main>
      <Footer />
    </div>
  );
};

export default HomeLayout;