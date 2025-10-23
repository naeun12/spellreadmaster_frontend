import React from 'react';

const StudentsTable = () => {
  // Sample student data (exclusive list of students)
  const students = [
    { id: 1, name: "Angelina Jolie", email: "jolie@example.com", date: "2025-04-02", progress: 75 },
    { id: 2, name: "Baron Roberts", email: "roberts@example.com", date: "2025-04-01", progress: 40 },
    { id: 3, name: "Jude Adams", email: "adams@example.com", date: "2025-03-30", progress: 60 },
    { id: 4, name: "Jackie Taylor", email: "taylor@example.com", date: "2025-03-30", progress: 90 },
    { id: 5, name: "Peter Parker", email: "parker@example.com", date: "2025-03-30", progress: 60 },
  ];

  return (
    <div className="relative flex flex-col min-w-0 mb-4 lg:mb-0 break-words bg-[#FCB436] w-full shadow-lg rounded">
      <div className="rounded-t mb-0 px-0 border-0">
        <div className="flex flex-wrap items-center px-4 py-2">
          <div className="relative w-full max-w-full flex-grow flex-1">
            <h3 className="font-semibold text-base text-gray-900 dark:text-gray-50">Students</h3>
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

        <div className="block w-full overflow-x-auto">
          <table className="items-center w-full bg-transparent border-collapse">
            <thead className="thead-light">
              <tr>
                <th className="px-4 bg-[#C28A29] text-gray-500 dark:text-gray-100 align-middle border border-solid border-[#C28A29] py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                  Student
                </th>
                <th className="px-4 bg-[#C28A29] text-gray-500 dark:text-gray-100 align-middle border border-solid border-[#C28A29] py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                  Parents Email
                </th>
                <th className="px-4 bg-[#C28A29] text-gray-500 dark:text-gray-100 align-middle border border-solid border-[#C28A29] py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                  Joined
                </th>
                <th className="px-4 bg-[#C28A29] text-gray-500 dark:text-gray-100 align-middle border border-solid border-[#C28A29] py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="text-gray-700 dark:text-gray-100">
                  <td className="border-t-0 px-4 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-left flex items-center">
                    <img
                      src={`https://api.dicebear.com/9.x/bottts/svg?randomizeIds=false&seed=${student.id}`}
                      alt={`${student.name}'s avatar`}
                      className="w-8 h-8 rounded-full object-cover mr-2"
                    />
                    <span>{student.name}</span>
                  </td>
                  <td className="border-t-0 px-4 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                    {student.email}
                  </td>
                  <td className="border-t-0 px-4 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                    {new Date(student.date).toLocaleDateString()}
                  </td>
                  <td className="border-t-0 px-4 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                    <div className="flex items-center">
                      <div className="w-full bg-white rounded-full h-2.5">
                        <div
                          className="bg-green-500 h-2.5 rounded-full"
                          style={{ width: `${student.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm pl-1">{student.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentsTable;