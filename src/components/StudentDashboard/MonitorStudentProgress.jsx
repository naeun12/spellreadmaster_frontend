import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, Target, AlertCircle, Book, Zap, BarChart3, CheckCircle, XCircle, ArrowLeft, Home } from 'lucide-react';
import { db, auth } from '../../firebase';
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export default function MonitorStudentProgress() {
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [activityData, setActivityData] = useState([]);
  const [stats, setStats] = useState({
    averageScore: 0,
    highestScore: 0,
    totalQuizzes: 0,
    passedQuizzes: 0,
    failedQuizzes: 0,
    weakAreas: []
  });

  useEffect(() => {
    loadStudentProgress();
  }, []);

  const loadStudentProgress = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      // Load student profile data
      const studentDoc = await getDoc(doc(db, 'students', user.uid));
      if (studentDoc.exists()) {
        setStudentData(studentDoc.data());
      }

      // Load activity history
      const activityQuery = query(
        collection(db, 'students', user.uid, 'activity'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      const activitySnapshot = await getDocs(activityQuery);
      const activities = activitySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));

      setActivityData(activities);
      calculateStats(activities);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (activities) => {
    if (activities.length === 0) {
      setStats({
        averageScore: 0,
        highestScore: 0,
        totalQuizzes: 0,
        passedQuizzes: 0,
        failedQuizzes: 0,
        weakAreas: []
      });
      return;
    }

    const totalScore = activities.reduce((sum, act) => sum + (act.percentage || 0), 0);
    const averageScore = Math.round(totalScore / activities.length);
    const highestScore = Math.max(...activities.map(act => act.percentage || 0));
    const passedQuizzes = activities.filter(act => (act.percentage || 0) >= 60).length;
    const failedQuizzes = activities.filter(act => (act.percentage || 0) < 60).length;

    // Analyze weak areas based on incorrect answers
    const weakAreaMap = {};
    activities.forEach(activity => {
      if (activity.answers && Array.isArray(activity.answers)) {
        activity.answers.forEach(answer => {
          if (!answer.correct) {
            const area = activity.mode || 'General';
            weakAreaMap[area] = (weakAreaMap[area] || 0) + 1;
          }
        });
      }
    });

    const weakAreas = Object.entries(weakAreaMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([area, count]) => ({ area, count }));

    setStats({
      averageScore,
      highestScore,
      totalQuizzes: activities.length,
      passedQuizzes,
      failedQuizzes,
      weakAreas
    });
  };

  const calculateExpRequired = (level) => {
    if (level === 1) return 0;
    return 50 + (level - 2) * 75 + (level - 2) * (level - 1) * 25;
  };

  const getNextLevelExp = () => {
    if (!studentData) return 0;
    const currentLevel = studentData.currentLevel || 1;
    return calculateExpRequired(currentLevel + 1);
  };

  const getProgressPercent = () => {
    if (!studentData) return 0;
    const currentLevel = studentData.currentLevel || 1;
    const totalExp = studentData.totalExp || 0;
    const currentLevelExp = calculateExpRequired(currentLevel);
    const nextLevelExp = getNextLevelExp();
    
    if (nextLevelExp <= currentLevelExp) return 100;
    
    return Math.min(
      ((totalExp - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100,
      100
    );
  };

  const getModeIcon = (mode) => {
    switch (mode) {
      case 'LBLM': return '🌟';
      case 'TLM': return '📚';
      case 'story': return '📖';
      default: return '✨';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-800 text-xl">Loading your progress...</p>
        </div>
      </div>
    );
  }

  const currentLevel = studentData?.currentLevel || 1;
  const totalExp = studentData?.totalExp || 0;
  const nextLevelExp = getNextLevelExp();
  const expToNext = nextLevelExp - totalExp;
  const progressPercent = getProgressPercent();

  return (
    <div className="min-h-screen text-black p-16 bg-[#FDFBF7] rounded-3xl overflow-hidden mt-14 shadow-sm">
      {/* Back Button */}
      <button
        onClick={() => window.location.href = '/StudentPage'}
        className="mb-6 flex items-center gap-2 bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-md px-6 py-3 transition-all shadow-md"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Dashboard
      </button>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">My Progress</h1>
          </div>
          <p className="text-gray-600">Track your spelling journey!</p>
        </div>

        {/* Compact Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Level */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-purple-600" />
              <p className="text-gray-600 text-sm">Level</p>
            </div>
            <p className="text-3xl font-bold text-purple-600">{currentLevel} ⭐</p>
          </div>

          {/* Total EXP */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-cyan-600" />
              <p className="text-gray-600 text-sm">Total EXP</p>
            </div>
            <p className="text-3xl font-bold text-cyan-600">{totalExp}</p>
          </div>

          {/* To Next Level */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-green-600" />
              <p className="text-gray-600 text-sm">To Next</p>
            </div>
            <p className="text-3xl font-bold text-green-600">{expToNext}</p>
          </div>

          {/* Average */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <p className="text-gray-600 text-sm">Avg Score</p>
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.averageScore}%</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
          <div className="flex justify-between text-sm text-gray-600 mb-3">
            <span className="font-medium">Level {currentLevel}</span>
            <span className="font-bold text-gray-900">{Math.round(progressPercent)}%</span>
            <span className="font-medium">Level {currentLevel + 1}</span>
          </div>
          <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 transition-all duration-1000 rounded-full"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Performance & Weak Areas Row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Quiz Stats */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h3 className="font-bold text-gray-900 text-lg">Performance</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Award className="w-5 h-5 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-600">{stats.highestScore}%</p>
                <p className="text-xs text-gray-600 mt-1">Best</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{stats.passedQuizzes}</p>
                <p className="text-xs text-gray-600 mt-1">Passed</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <XCircle className="w-5 h-5 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600">{stats.failedQuizzes}</p>
                <p className="text-xs text-gray-600 mt-1">Retry</p>
              </div>
            </div>
            
            <div className="text-center text-sm text-gray-600 pt-3 border-t border-gray-200">
              Total: <span className="font-bold text-gray-900">{stats.totalQuizzes}</span> quizzes
            </div>
          </div>

          {/* Weak Areas */}
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-6 h-6 text-orange-600" />
              <h3 className="font-bold text-gray-900 text-lg">Focus On</h3>
            </div>
            
            {stats.weakAreas.length > 0 ? (
              <div className="space-y-3">
                {stats.weakAreas.slice(0, 3).map((area, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-900 text-sm font-medium">{area.area}</span>
                      <span className="text-orange-600 text-sm font-bold">{area.count} errors</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                        style={{ width: `${Math.min((area.count / Math.max(...stats.weakAreas.map(a => a.count))) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <p className="text-gray-900 text-base font-bold">All Good! 🎉</p>
                <p className="text-gray-600 text-sm mt-1">Keep up the great work!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-4">
            <Book className="w-6 h-6 text-pink-600" />
            <h3 className="font-bold text-gray-900 text-lg">Recent Activity</h3>
          </div>

          {activityData.length > 0 ? (
            <div className="space-y-3">
              {activityData.slice(0, 5).map((activity, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-all border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getModeIcon(activity.mode)}</span>
                      <div>
                        <h4 className="text-gray-900 text-base font-bold truncate max-w-[200px]">
                          {activity.themeTitle || activity.storyTitle || 'Quiz'}
                        </h4>
                        <p className="text-gray-600 text-sm">{activity.mode}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${activity.percentage >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                        {activity.percentage}%
                      </div>
                      <p className="text-gray-600 text-sm">{activity.score}/{activity.maxScore}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Book className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-900 text-base font-medium">No activity yet</p>
              <p className="text-gray-600 text-sm mt-1">Start practicing to see your progress here!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}