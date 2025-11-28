// RecentAccountsTable.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import {
  collection,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { Users, Mail, Calendar, User } from 'lucide-react';

const RecentAccountsTable = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      // Fetch students
      const studentsQuery = query(collection(db, 'students'), orderBy('createdAt', 'desc'));
      const studentsSnapshot = await getDocs(studentsQuery);
      const students = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        userType: 'Student',
      }));

      // Fetch teachers
      const teachersQuery = query(collection(db, 'teachers'), orderBy('createdAt', 'desc'));
      const teachersSnapshot = await getDocs(teachersQuery);
      const teachers = teachersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        userType: 'Teacher',
      }));

      // Combine and sort by createdAt (most recent first)
      const allAccounts = [...students, ...teachers]
        .filter(acc => acc.createdAt) // ensure createdAt exists
        .sort((a, b) => {
          const dateA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB - dateA;
        })
        .slice(0, 10); // Optional: limit to top 10 recent accounts

      setAccounts(allAccounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const renderAvatar = (avatar, name, userType) => {
    const cleanName = (name || (userType === 'Student' ? 'Student' : 'Teacher')).replace(/\s+/g, '');
    if (typeof avatar === 'string' && avatar.trim().startsWith('<svg')) {
      const sanitizedSvg = avatar.replace(/<svg[^>]*>/, '<svg>');
      return (
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
          <svg
            dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
            width="40"
            height="40"
            viewBox="0 0 200 200"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-full"
          />
        </div>
      );
    } else {
      const style = userType === 'Teacher' ? 'admin_profile_preset' : 'bottts';
      const fallbackUrl = `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(cleanName)}`;
      return (
        <img
          src={fallbackUrl}
          alt={`${name}'s avatar`}
          className="w-10 h-10 rounded-full border-2 border-gray-200 object-cover flex-shrink-0"
          onError={(e) => {
            e.target.src = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(cleanName)}`;
          }}
        />
      );
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">Recent Accounts</h3>
              <p className="text-xs text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-4 rounded-lg bg-gray-50">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-20 h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">Recent Accounts</h3>
              <p className="text-xs text-gray-600">{accounts.length} recent users</p>
            </div>
          </div>
          {accounts.length > 0 && (
            <button
              onClick={() => window.location.href = '/AdminPage/manage-users'}
              className="text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
            >
              View All
            </button>
          )}
        </div>
      </div>

      <div className="p-2">
        {accounts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No accounts found</p>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[400px] -mr-2 pr-2">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-left text-gray-600 border-b-2 border-gray-200">
                  <th className="py-3 px-2 font-semibold text-sm">User</th>
                  <th className="py-3 px-2 font-semibold text-sm hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </div>
                  </th>
                  <th className="py-3 px-2 font-semibold text-sm hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Joined
                    </div>
                  </th>
                  <th className="py-3 px-2 font-semibold text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Type
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account, index) => {
                  const name = account.name || account.fullName || 'Unnamed';
                  const email = account.parentEmail || account.email;
                  const date = account.createdAt?.toDate
                    ? account.createdAt.toDate().toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—';

                  return (
                    <tr
                      key={`${account.userType}-${account.id || index}`}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="py-3 px-2 min-w-0">
                        <div className="flex items-center gap-3">
                          {renderAvatar(account.avatar, name, account.userType)}
                          <span className="font-semibold text-sm text-gray-900 truncate">
                            {name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-gray-600 text-sm truncate hidden md:table-cell">
                        {email}
                      </td>
                      <td className="py-3 px-2 text-gray-600 text-sm whitespace-nowrap hidden lg:table-cell">
                        {date}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            account.userType === 'Teacher'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                              : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                          }`}
                        >
                          {account.userType}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentAccountsTable;