import React from 'react';

const RecentAccountsTable = () => {
  // Sample user data
  const users = [
    { id: 1, name: "Hans Burger", email: "hans@example.com", date: "2025-04-03", userType: "Teacher" },
    { id: 2, name: "Angelina Jolie", email: "jolina@example.com", date: "2025-04-02", userType: "Student" },
    { id: 3, name: "Dave Li", email: "dave@example.com", date: "2025-04-02", userType: "Teacher" },
    { id: 4, name: "Julia Roberts", email: "rulia@example.com", date: "2025-04-01", userType: "Student" },
    { id: 5, name: "Whitney Houston", email: "hitney@example.com", date: "2025-03-31", userType: "Teacher" },
  ];

  return (
    <div className="relative flex flex-col min-w-0 mb-4 lg:mb-0 break-words bg-[#FCB436] w-full shadow-lg rounded">
      <div className="rounded-t mb-0 px-0 border-0">
        <div className="flex flex-wrap items-center px-4 py-2">
          <div className="relative w-full max-w-full flex-grow flex-1">
            <h3 className="font-semibold text-base text-gray-900 dark:text-gray-50">Users</h3>
          </div>
          <div className="relative w-full max-w-full flex-grow flex-1 text-right">
            <button className="bg-blue-500 dark:bg-gray-100 text-white active:bg-blue-600 dark:text-gray-800 dark:active:text-gray-700 text-xs font-bold uppercase px-3 py-1 rounded outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150" type="button">
              See all
            </button>
          </div>
        </div>

        <div className="block w-full overflow-x-auto">
          <table className="items-center w-full bg-transparent border-collapse">
            <thead className="thead-light">
              <tr>
                <th className="px-4 bg-[#C28A29] text-gray-500 dark:text-gray-100 align-middle border border-solid border-[#C28A29] py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                  User
                </th>
                <th className="px-4 bg-[#C28A29] text-gray-500 dark:text-gray-100 align-middle border border-solid border-[#C28A29] py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                  Email
                </th>
                <th className="px-4 bg-[#C28A29] text-gray-500 dark:text-gray-100 align-middle border border-solid border-[#C28A29] py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                  Joined
                </th>
                <th className="px-4 bg-[#C28A29] text-gray-500 dark:text-gray-100 align-middle border border-solid border-[#C28A29] py-3 text-xs uppercase border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                  Type
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="text-gray-700 dark:text-gray-100">
                  <td className="border-t-0 px-4 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4 text-left flex items-center">
                    <img
                      src={`https://i.pravatar.cc/150?u=${user.id}`}
                      alt={`${user.name}'s avatar`}
                      className="w-8 h-8 rounded-full object-cover mr-2"
                    />
                    <span>{user.name}</span>
                  </td>
                  <td className="border-t-0 px-4 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                    {user.email}
                  </td>
                  <td className="border-t-0 px-4 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                    {new Date(user.date).toLocaleDateString()}
                  </td>
                  <td className="border-t-0 px-4 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
                    <span
                      className={`px-2 py-1 font-semibold leading-tight rounded-full ${
                        user.userType === 'Teacher'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100'
                          : 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100'
                      }`}
                    >
                      {user.userType}
                    </span>
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

export default RecentAccountsTable;