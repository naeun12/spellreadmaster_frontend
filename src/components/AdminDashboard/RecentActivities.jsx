// src/components/AdminRecentActivities.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import {
  collection,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Award,
  BookOpen,
  Target,
  Zap,
  Calendar,
  User,
  GraduationCap,
  BarChart3,
  Users,
  FilePlus,
  Puzzle,
  Play,
} from 'lucide-react';

const RecentActivities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);

  useEffect(() => {
    loadAdminActivities();
  }, []);

  const formatDate = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isYesterday = (date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.getDate() === yesterday.getDate() &&
           date.getMonth() === yesterday.getMonth() &&
           date.getFullYear() === yesterday.getFullYear();
  };

  const loadAdminActivities = async () => {
    try {
      let allActivities = [];

      // Fetch student activities
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      for (const studentDoc of studentsSnapshot.docs) {
        const student = studentDoc.data();
        const q = query(
          collection(db, 'students', studentDoc.id, 'activity'),
          orderBy('timestamp', 'desc')
        );
        const activitySnap = await getDocs(q);
        activitySnap.docs.forEach((doc) => {
          const data = doc.data();
          allActivities.push({
            id: doc.id,
            userId: studentDoc.id,
            userName: student.name || 'Student',
            userType: 'Student',
            ...data,
            timestamp: data.timestamp?.toDate(),
          });
        });
      }

      // Fetch teacher activities
      const teachersSnapshot = await getDocs(collection(db, 'teachers'));
      for (const teacherDoc of teachersSnapshot.docs) {
        const teacher = teacherDoc.data();
        const q = query(
          collection(db, 'teachers', teacherDoc.id, 'activity'),
          orderBy('timestamp', 'desc')
        );
        const activitySnap = await getDocs(q);
        activitySnap.docs.forEach((doc) => {
          const data = doc.data();
          allActivities.push({
            id: doc.id,
            userId: teacherDoc.id,
            userName: teacher.fullName || 'Teacher',
            userType: 'Teacher',
            ...data,
            timestamp: data.timestamp?.toDate(),
          });
        });
      }

      allActivities.sort((a, b) => (b.timestamp || new Date(0)) - (a.timestamp || new Date(0)));
      setActivities(allActivities.slice(0, 20));
    } catch (error) {
      console.error('Error loading admin activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const getActivityMetric = (act) => {
    if (act.mode === 'pretest') {
      return act.accuracyRate !== undefined ? Math.round(act.accuracyRate) : null;
    }
    if (act.mode === 'LBLM') {
      return act.totalExp !== undefined ? Math.min(100, act.totalExp) : null;
    }
    return act.percentage !== undefined ? Math.round(act.percentage) : null;
  };

  const getActivityIcon = (act) => {
    if (act.userType === 'Teacher') {
      if (act.action?.includes('enroll')) return <Users className="w-5 h-5 text-white" />;
      if (act.action?.includes('quiz') || act.action?.includes('test')) return <FilePlus className="w-5 h-5 text-white" />;
      if (act.action?.includes('theme')) return <Puzzle className="w-5 h-5 text-white" />;
      if (act.action?.includes('assign')) return <Play className="w-5 h-5 text-white" />;
    }
    if (act.currentLevel > (act.previousLevel || 0)) return <Award className="w-5 h-5 text-yellow-500" />;
    if (act.mode === 'LBLM') return <Target className="w-5 h-5 text-white" />;
    if (act.mode === 'TLM') return <Zap className="w-5 h-5 text-white" />;
    if (act.mode === 'story') return <BookOpen className="w-5 h-5 text-white" />;
    if (act.mode === 'pretest') return <BarChart3 className="w-5 h-5 text-white" />;
    return <TrendingUp className="w-5 h-5 text-white" />;
  };

  const getActivityColor = (act) => {
    if (act.userType === 'Teacher') {
      if (act.action?.includes('enroll')) return 'bg-gradient-to-br from-green-400 to-green-600';
      if (act.action?.includes('quiz') || act.action?.includes('test')) return 'bg-gradient-to-br from-purple-400 to-purple-600';
      if (act.action?.includes('theme')) return 'bg-gradient-to-br from-amber-400 to-amber-600';
      if (act.action?.includes('assign')) return 'bg-gradient-to-br from-blue-400 to-blue-600';
      return 'bg-gradient-to-br from-gray-400 to-gray-600';
    }
    if (act.currentLevel > (act.previousLevel || 0)) return 'bg-gradient-to-br from-yellow-400 to-orange-500';
    if (act.mode === 'LBLM') return 'bg-gradient-to-br from-blue-400 to-blue-600';
    if (act.mode === 'TLM') return 'bg-gradient-to-br from-purple-400 to-purple-600';
    if (act.mode === 'story') return 'bg-gradient-to-br from-indigo-400 to-indigo-600';
    if (act.mode === 'pretest') return 'bg-gradient-to-br from-teal-400 to-teal-600';
    return 'bg-gradient-to-br from-green-400 to-green-600';
  };

  const getActionText = (act) => {
    const get = (obj, path, fallback = '') =>
      path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : fallback), obj);

    if (act.userType === 'Teacher') {
      if (act.action?.includes('enroll')) {
        const count = get(act, 'details.count', 1);
        return `enrolled <strong class="text-green-600">${count} student${count !== 1 ? 's' : ''}</strong>`;
      }
      if (act.action?.includes('quiz') || act.action?.includes('test')) {
        const theme = get(act, 'details.themeName', 'a new quiz');
        return `created a quiz in <strong class="text-purple-600">${theme}</strong>`;
      }
      if (act.action?.includes('theme')) {
        const name = get(act, 'details.name', 'a theme');
        return `uploaded <strong class="text-amber-600">${name}</strong>`;
      }
      if (act.action?.includes('assign')) {
        const mode = get(act, 'details.mode');
        const modeName = mode === 'TLM' ? 'Thematic Learning' : mode === 'LBLM' ? 'Level-Based Learning' : 'Story Mode';
        const count = get(act, 'details.studentCount', 1);
        return `assigned <strong class="text-blue-600">${modeName}</strong> to <strong>${count} student${count !== 1 ? 's' : ''}</strong>`;
      }
      return `performed an action`;
    }

    if (act.currentLevel > (act.previousLevel || 0)) {
      return `leveled up to <strong class="text-yellow-600">Level ${act.currentLevel}</strong>`;
    }

    let modeName = 'a quiz';
    if (act.mode === 'pretest') modeName = 'Pretest';
    else if (act.mode === 'LBLM') modeName = 'Level-Based Learning Quiz';
    else if (act.mode === 'TLM') modeName = 'Thematic Learning Quiz';
    else if (act.mode === 'story') modeName = 'Story Mode Quiz';

    const metric = getActivityMetric(act);
    let scoreColor = 'text-gray-600';
    if (metric !== null) {
      if (metric >= 80) scoreColor = 'text-green-600';
      else if (metric >= 60) scoreColor = 'text-blue-600';
      else scoreColor = 'text-orange-600';
    }

    if (metric !== null) {
      return `completed ${modeName} with <strong class="${scoreColor}">${metric}% score</strong>`;
    } else {
      return `completed ${modeName}`;
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (percentage >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  const closeModal = () => setSelectedActivity(null);

  const grouped = {};
  activities.forEach(act => {
    if (!act.timestamp) return;
    let label = formatDate(act.timestamp);
    if (isToday(act.timestamp)) label = 'Today';
    else if (isYesterday(act.timestamp)) label = 'Yesterday';
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(act);
  });

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 min-h-[200px]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-bold text-lg text-gray-900">Recent Activities</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">Recent Activities</h3>
              <p className="text-xs text-gray-600">{activities.length} recent events</p>
            </div>
          </div>
          {activities.length > 0 && (
            <button
              className="text-sm font-medium bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-4 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
              onClick={() => window.location.href = '/AdminPage/activity-log'}
            >
              View All
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No recent activity</p>
            <p className="text-sm text-gray-400 mt-1">Activities will appear here</p>
          </div>
        ) : (
          <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2">
            {Object.entries(grouped).map(([date, acts]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{date}</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
                <div className="space-y-3">
                  {acts.map(act => (
                    <div 
                      key={act.id} 
                      className="group flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200 cursor-pointer"
                      onClick={() => setSelectedActivity(act)}
                    >
                      <div className={`w-10 h-10 rounded-full ${getActivityColor(act)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        {getActivityIcon(act)}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm leading-relaxed">
                            <span className="font-semibold text-gray-900">{act.userName}</span>{' '}
                            <span className="text-gray-600" dangerouslySetInnerHTML={{ __html: getActionText(act) }} />
                          </p>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {act.timestamp ? formatTime(act.timestamp) : ''}
                          </span>
                        </div>
                        <button className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          View details →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedActivity && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">Activity Details</h3>
                    <p className="text-sm text-blue-100">Complete performance breakdown</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <span className="text-2xl leading-none">×</span>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedActivity.userType === 'Teacher' ? (
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                    ) : (
                      <User className="w-4 h-4 text-blue-600" />
                    )}
                    <p className="text-sm font-medium text-blue-900">User</p>
                  </div>
                  <p className="font-bold text-lg text-blue-900">{selectedActivity.userName}</p>
                  <p className="text-xs text-blue-700 mt-1">{selectedActivity.userType}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <p className="text-sm font-medium text-purple-900">Date & Time</p>
                  </div>
                  <p className="font-bold text-sm text-purple-900">
                    {selectedActivity.timestamp
                      ? formatDate(selectedActivity.timestamp)
                      : 'Not available'}
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    {selectedActivity.timestamp
                      ? formatTime(selectedActivity.timestamp)
                      : ''}
                  </p>
                </div>
              </div>

              {(selectedActivity.mode === 'pretest' || selectedActivity.mode === 'LBLM' || selectedActivity.percentage !== undefined) && (
                <div className={`rounded-xl p-5 border-2 ${getScoreColor(getActivityMetric(selectedActivity) ?? 0)}`}>
                  <p className="text-sm font-medium mb-2 opacity-80">
                    {selectedActivity.mode === 'pretest'
                      ? 'Pretest Accuracy'
                      : selectedActivity.mode === 'LBLM'
                        ? 'Quiz Experience Points'
                        : 'Performance Score'}
                  </p>
                  <div className="flex items-baseline gap-3">
                    <p className="text-4xl font-bold">
                      {getActivityMetric(selectedActivity) !== null
                        ? `${getActivityMetric(selectedActivity)}%`
                        : '—'}
                    </p>
                    {selectedActivity.mode === 'pretest' && selectedActivity.score !== undefined && (
                      <span className="text-lg font-medium opacity-70">
                        {selectedActivity.score}/{selectedActivity.totalQuestions || '?'} correct
                      </span>
                    )}
                    {selectedActivity.mode === 'LBLM' && selectedActivity.totalExp !== undefined && (
                      <span className="text-lg font-medium opacity-70">
                        {selectedActivity.totalExp} EXP earned
                      </span>
                    )}
                    {selectedActivity.percentage !== undefined && 
                     selectedActivity.mode !== 'pretest' && 
                     selectedActivity.mode !== 'LBLM' && (
                      <span className="text-lg font-medium opacity-70">
                        {selectedActivity.score}/{selectedActivity.totalQuestions || '?'} correct
                      </span>
                    )}
                  </div>
                  {getActivityMetric(selectedActivity) !== null && (
                    <div className="mt-3 w-full bg-white/50 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-current transition-all duration-500"
                        style={{ width: `${getActivityMetric(selectedActivity)}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              )}

              {selectedActivity.currentLevel && (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-yellow-600" />
                    <p className="text-sm font-medium text-yellow-900">Achievement Level</p>
                  </div>
                  <p className="font-bold text-2xl text-yellow-900">Level {selectedActivity.currentLevel}</p>
                  {selectedActivity.currentLevel > (selectedActivity.previousLevel || 0) && (
                    <p className="text-sm text-yellow-700 mt-1">
                      🎉 Leveled up from Level {selectedActivity.previousLevel || 0}!
                    </p>
                  )}
                </div>
              )}

              {selectedActivity.userType === 'Teacher' && selectedActivity.details && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FilePlus className="w-5 h-5 text-gray-600" />
                    <p className="font-semibold text-gray-900">Action Details</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                      {JSON.stringify(selectedActivity.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedActivity.answers && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-gray-600" />
                    <p className="font-semibold text-gray-900">Question Breakdown</p>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {selectedActivity.answers.map((ans, i) => (
                      <div
                        key={i}
                        className={`rounded-lg p-4 border-2 ${
                          ans.correct
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {ans.correct ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm mb-2 text-gray-900">
                              {ans.question || `Question ${i + 1}`}
                            </p>
                            <div className="space-y-1.5">
                              <div className="text-sm">
                                <span className="font-medium text-gray-700">Student answer:</span>{' '}
                                <span className={ans.correct ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                                  {ans.userAnswer || 
                                   (ans.selectedOption !== undefined && ans.options?.[ans.selectedOption]) || 
                                   'No answer provided'}
                                </span>
                              </div>
                              {!ans.correct && ans.correctAnswer && (
                                <div className="text-sm">
                                  <span className="font-medium text-gray-700">Correct answer:</span>{' '}
                                  <span className="text-green-700 font-medium">{ans.correctAnswer}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeModal}
                className="px-6 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg font-medium shadow-sm transition-all duration-200 hover:shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentActivities;