// StudentsTable.jsx
import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Users, TrendingUp, Calendar, Mail, Award } from 'lucide-react';

const StudentsTable = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const teacherStudents = studentsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(student => student.teacherId === user.uid)
        .map(student => {
          let progress = 0;
          if (student.totalQuizzes > 0 && student.totalScore !== undefined) {
            progress = Math.min(100, Math.round((student.totalScore / student.totalQuizzes)));
          } else if (student.currentLevel) {
            progress = Math.min(100, student.currentLevel * 20);
          }

          return {
            id: student.id,
            name: student.name || 'Unnamed Student',
            email: student.parentEmail || '—',
            date: student.createdAt?.toDate() || new Date(),
            progress,
            section: student.section || '—',
            avatar: student.avatar,
          };
        });

      teacherStudents.sort((a, b) => b.progress - a.progress);
      setStudents(teacherStudents);
    } catch (error) {
      console.error('Error loading students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const renderAvatar = (avatar, name) => {
    const cleanName = (name || 'Student').replace(/\s+/g, '');
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
      const fallbackUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`;
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

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'from-green-400 to-green-600';
    if (progress >= 60) return 'from-blue-400 to-blue-600';
    if (progress >= 40) return 'from-yellow-400 to-yellow-600';
    return 'from-orange-400 to-orange-600';
  };

  const getMedalIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">Students</h3>
              <p className="text-xs text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-4 rounded-lg bg-gray-50">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">Students</h3>
              <p className="text-xs text-gray-600">{students.length} total students</p>
            </div>
          </div>
          {students.length > 0 && (
            <button
              onClick={() => window.location.href = '/TeacherPage/upload-students'}
              className="text-sm font-medium bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
            >
              View All
            </button>
          )}
        </div>
      </div>

      <div className="p-2">
        {students.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No students assigned</p>
            <p className="text-sm text-gray-400 mt-1">Students will appear here once assigned</p>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[300px] -mr-2 pr-2">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-left text-gray-600 border-b-2 border-gray-200">
                  <th className="py-3 px-2 font-semibold text-sm w-16">
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                    </div>
                  </th>
                  <th className="py-3 px-2 font-semibold text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Student
                    </div>
                  </th>
                  <th className="py-3 px-2 font-semibold text-sm hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </div>
                  </th>
                  <th className="py-3 px-2 font-semibold text-sm hidden lg:table-cell w-28">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined
                    </div>
                  </th>
                  <th className="py-3 px-2 font-semibold text-sm">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Progress
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => {
                  const rank = index + 1;
                  const medal = getMedalIcon(rank);
                  return (
                    <tr
                      key={student.id}
                      className="border-b border-gray-100 hover:bg-gradient-to-r hover:bg-gray-50 hover:border-gray-200 cursor-pointe transition-all duration-200 group"
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-center gap-1">
                          {medal && <span className="text-base">{medal}</span>}
                          {!medal && (
                            <span className="font-bold text-sm text-gray-700">
                              {rank}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 min-w-0">
                        <div className="flex items-center gap-2">
                          {renderAvatar(student.avatar, student.name)}
                          <span className="font-semibold text-sm text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {student.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-gray-600 text-xs truncate hidden md:table-cell">
                        {student.email}
                      </td>
                      <td className="py-3 px-2 text-gray-600 text-xs whitespace-nowrap hidden lg:table-cell">
                        {student.date instanceof Date
                          ? student.date.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric'
                            })
                          : '—'}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-[60px]">
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`bg-gradient-to-r ${getProgressColor(student.progress)} h-2 rounded-full transition-all duration-500`}
                                style={{ width: `${student.progress}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-gray-700 w-9 text-right">
                            {student.progress}%
                          </span>
                        </div>
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

export default StudentsTable;