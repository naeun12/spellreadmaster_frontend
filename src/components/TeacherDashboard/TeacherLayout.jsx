import React from 'react'
import Header from './Header';
import Sidebar from './Sidebar';

const TeacherLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col flex-auto flex-shrink-0 antialiased bg-amber-100 text-black dark:text-white">
      {/* Header */}
      <Header />

      {/* Sidebar + Main Content */}
      <div className="flex">
        <Sidebar/>
        <div className="flex-1 ml-14 mt-14 mb-10 md:ml-64 p-4">
          {children}
        </div>
      </div>
    </div>
  )
}

export default TeacherLayout