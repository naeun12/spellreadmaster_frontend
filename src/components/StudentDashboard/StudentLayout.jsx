import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

function StudentLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen flex flex-col flex-auto flex-shrink-0 antialiased bg-amber-100 text-black dark:text-white">
      {/* Header */} 
      <Header />

      {/* Sidebar + Main Content */}
      <div className="flex">
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className={`flex-grow p-6 transition-all ${isSidebarOpen ? 'ml-64' : 'ml-14'} md:ml-64`}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default StudentLayout;