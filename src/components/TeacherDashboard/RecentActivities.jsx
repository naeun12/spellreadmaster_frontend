import React from 'react';

const RecentActivities = () => {
  return (
    <div className="relative flex flex-col min-w-0 break-words bg-[#FCB436] w-full shadow-lg rounded">
      <div className="rounded-t mb-0 px-0 border-0">
        <div className="flex flex-wrap items-center px-4 py-2">
          <div className="relative w-full max-w-full flex-grow flex-1">
            <h3 className="font-semibold text-base text-gray-900 dark:text-gray-50">Recent Activities</h3>
          </div>
          <div className="relative w-full max-w-full flex-grow flex-1 text-right">
            <button
              className="bg-blue-500 dark:bg-gray-100 text-white active:bg-blue-600 dark:text-gray-800 dark:active:text-gray-700 text-xs font-bold uppercase px-3 py-1 rounded outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
              type="button"
            >
              See all
            </button>
          </div>
        </div>

        {/* Today Section */}
        <div className="px-4 bg-[#C28A29] text-gray-500 dark:text-gray-100 align-middle border border-solid border-[#C28A29] py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
          Today
        </div>
        <ul className="my-1">
          {/* Activity 1 */}
          <li className="flex px-4">
            <div className="w-9 h-9 rounded-full flex-shrink-0 bg-green-500 my-2 mr-3 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4.354a4 4 0 110 7.292M12 21a9 9 0 100-18 9 9 0 000 18z"
                ></path>
              </svg>
            </div>
            <div className="flex-grow flex items-center border-b py-2">
              <div className="flex-grow flex justify-between items-center">
                <div className="self-center">
                  <span className="font-bold text-gray-800 hover:text-gray-900 dark:text-gray-50 dark:hover:text-gray-100">
                    Jackie Taylor
                  </span>{' '}
                  has leveled up and advanced to <strong>level 19!</strong>
                </div>
                <div className="flex-shrink-0 ml-2">
                  <a
                    className="flex items-center font-medium text-white hover:text-black"
                    href="#0"
                  >
                    View
                    <span>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="transform transition-transform duration-500 ease-in-out"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </li>

          {/* Activity 2 - Enrolled 27 new students */}
          <li className="flex px-4">
            <div className="w-9 h-9 rounded-full flex-shrink-0 bg-green-500 my-2 mr-3 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4.354a4 4 0 110 7.292M12 21a9 9 0 100-18 9 9 0 000 18z"
                ></path>
              </svg>
            </div>
            <div className="flex-grow flex items-center border-b py-2">
              <div className="flex-grow flex justify-between items-center">
                <div className="self-center">
                  <span className="font-bold text-gray-800 hover:text-gray-900 dark:text-gray-50 dark:hover:text-gray-100">
                    Jude Adams
                  </span>{' '}
                  completed <strong>Quiz #5</strong>
                </div>
                <div className="flex-shrink-0 ml-2">
                  <a
                    className="flex items-center font-medium text-white hover:text-black"
                    href="#0"
                  >
                    View
                    <span>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="transform transition-transform duration-500 ease-in-out"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </li>
        </ul>

        {/* Yesterday Section */}
        <div className="px-4 bg-[#C28A29] text-gray-500 dark:text-gray-100 align-middle border border-solid border-[#C28A29] py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
          Yesterday
        </div>
        <ul className="my-1">
          {/* Activity - Admin added test in Thematic Learning Mode */}
          <li className="flex px-4">
            <div className="w-9 h-9 rounded-full flex-shrink-0 bg-purple-500 my-2 mr-3 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
            </div>
            <div className="flex-grow flex items-center border-gray-100 dark:border-gray-400 text-sm text-gray-600 dark:text-gray-100 py-2">
              <div className="flex-grow flex justify-between items-center">
                <div className="self-center">
                  <span className="font-bold text-gray-800 hover:text-gray-900 dark:text-gray-50 dark:hover:text-gray-100">
                    Admin2
                  </span>{' '}
                  added a new test in <strong>Thematic Learning Mode</strong>
                </div>
                <div className="flex-shrink-0 ml-2">
                  <a
                    className="flex items-center font-medium text-white hover:text-black"
                    href="#0"
                  >
                    View
                    <span>
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="transform transition-transform duration-500 ease-in-out"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default RecentActivities;