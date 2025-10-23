// components/Layout/MainLayout.jsx
import React from 'react';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-light text-gray-900 font-poppins">
      <main>{children}</main>
    </div>
  );
};

export default MainLayout;