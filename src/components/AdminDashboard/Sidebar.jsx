import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
  const [isContentOpen, setIsContentOpen] = React.useState(false);

  return (
    <>
      {/* Hamburger Button for Mobile */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="md:hidden fixed top-16 left-4 z-20 p-2 bg-[#FCB436] text-white rounded-md"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
          />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed flex flex-col top-14 left-0 w-14 md:w-64 bg-amber-50 h-full text-white transition-all duration-300 border-none z-10 sidebar overflow-y-auto
          ${isSidebarOpen ? 'w-64' : 'w-14'} md:w-64`}
      >
        <div className="flex flex-col justify-between flex-grow py-4">
          <ul className="space-y-1">
            {/* Main Section Title */}
            <li className="px-5 hidden md:block">
              <div className="flex flex-row items-center h-8">
                <div className="text-sm font-light tracking-wide text-[#FCB436] uppercase">
                  Main
                </div>
              </div>
            </li>

            {/* Dashboard */}
            <li>
              <Link
                to="/AdminPage"
                className="relative flex flex-row items-center h-11 focus:outline-none hover:bg-[#FCC636] text-black hover:text-white border-l-4 border-transparent hover:border-[#FCC636] pr-6"
              >
                <span className="inline-flex justify-center items-center ml-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    ></path>
                  </svg>
                </span>
                <span className="ml-2 text-sm tracking-wide truncate">Dashboard</span>
              </Link>
            </li>

            {/* Manage Accounts */}
            <li>
              <Link
                to="/AdminPage/manage-accounts"
                className="relative flex flex-row items-center h-11 focus:outline-none hover:bg-[#FCC636] text-black hover:text-white border-l-4 border-transparent hover:border-[#FCC636] pr-6"
              >
                <span className="inline-flex justify-center items-center ml-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    ></path>
                  </svg>
                </span>
                <span className="ml-2 text-sm tracking-wide truncate">Manage Acounts</span>
              </Link>
            </li>

            {/* Monitor Student Progress */}
            <li>
              <Link
                to="/AdminPage/monitor-student-progress"
                className="relative flex flex-row items-center h-11 focus:outline-none hover:bg-[#FCC636] text-black hover:text-white border-l-4 border-transparent hover:border-[#FCC636] pr-6"
              >
                <span className="inline-flex justify-center items-center ml-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    ></path>
                  </svg>
                </span>
                <span className="ml-2 text-sm tracking-wide truncate">Monitor Student Progress</span>
              </Link>
            </li>

            {/* Manage Content (Toggleable Submenu) */}
            <li>
              <button
                onClick={() => setIsContentOpen(!isContentOpen)}
                className="w-full text-left relative flex flex-row items-center h-11 focus:outline-none hover:bg-[#FCC636] text-black hover:text-white border-l-4 border-transparent hover:border-[#FCC636] pr-6"
                type="button"
              >
                <span className="inline-flex justify-center items-center ml-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                  </svg>
                </span>
                <span className="ml-2 text-sm tracking-wide truncate">Manage Content</span>
              </button>

              {/* Submenu Items */}
              {isContentOpen && (
                <ul className="mt-1 space-y-1 pl-6 border-l-2 border-[#FCC636]">
                  <li>
                    <Link
                      to="/AdminPage/manage-thematic-learning-mode"
                      className="block py-2 text-black px-4 hover:bg-[#FCC636] hover:text-white rounded-md text-sm"
                    >
                      Thematic Learning Mode
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/AdminPage/manage-story-mode"
                      className="block py-2 px-4 text-black hover:bg-[#FCC636] hover:text-white rounded-md text-sm"
                    >
                      Story Mode
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/AdminPage/manage-level-based-learning-mode"
                      className="block py-2 px-4 text-black hover:bg-[#FCC636] hover:text-white rounded-md text-sm"
                    >
                      Level-Based Learning Mode
                    </Link>
                  </li>
                </ul>
              )}
            </li>

            {/* Settings Section Title */}
            <li className="px-5 hidden md:block mt-5">
              <div className="flex flex-row items-center h-8">
                <div className="text-sm font-light tracking-wide text-[#FCB436] uppercase">
                  Settings
                </div>
              </div>
            </li>

            {/* Profile */}
            <li>
              <a
                href="#"
                className="relative flex flex-row items-center h-11 focus:outline-none hover:bg-[#FCC636] text-black hover:text-white border-l-4 border-transparent hover:border-[#FCC636] pr-6"
              >
                <span className="inline-flex justify-center items-center ml-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    ></path>
                  </svg>
                </span>
                <span className="ml-2 text-sm tracking-wide truncate">Profile</span>
              </a>
            </li>

            {/* Settings */}
            <li>
              <a
                href="#"
                className="relative flex flex-row items-center h-11 focus:outline-none hover:bg-[#FCC636] text-black hover:text-white border-l-4 border-transparent hover:border-[#FCC636] pr-6"
              >
                <span className="inline-flex justify-center items-center ml-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    ></path>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    ></path>
                  </svg>
                </span>
                <span className="ml-2 text-sm tracking-wide truncate">Settings</span>
              </a>
            </li>
          </ul>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-9 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
};

export default Sidebar;