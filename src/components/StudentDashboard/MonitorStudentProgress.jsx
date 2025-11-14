import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, Target, AlertCircle, Book, Zap, BarChart3, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading your progress...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-blue-950 p-6">
      {/* Back Button */}
      <button
        onClick={() => window.location.href = '/StudentPage'}
        className="mb-6 flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-full px-6 py-3 transition-all backdrop-blur-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Dashboard
      </button>

      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
            📊 My Progress
          </h1>
          <p className="text-purple-200">Track your spelling journey!</p>
        </div>

        {/* Compact Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Level */}
          <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-md rounded-xl border border-purple-500/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <p className="text-purple-200 text-xs">Level</p>
            </div>
            <p className="text-3xl font-bold text-yellow-400">{currentLevel} ⭐</p>
          </div>

          {/* Total EXP */}
          <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 backdrop-blur-md rounded-xl border border-cyan-500/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              <p className="text-cyan-200 text-xs">Total EXP</p>
            </div>
            <p className="text-3xl font-bold text-cyan-400">{totalExp}</p>
          </div>

          {/* To Next Level */}
          <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 backdrop-blur-md rounded-xl border border-green-500/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-green-400" />
              <p className="text-green-200 text-xs">To Next</p>
            </div>
            <p className="text-3xl font-bold text-green-400">{expToNext}</p>
          </div>

          {/* Average */}
          <div className="bg-gradient-to-br from-blue-900/50 to-indigo-900/50 backdrop-blur-md rounded-xl border border-blue-500/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <p className="text-blue-200 text-xs">Avg Score</p>
            </div>
            <p className="text-3xl font-bold text-blue-400">{stats.averageScore}%</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-md rounded-xl border border-purple-500/30 p-4">
          <div className="flex justify-between text-xs text-purple-200 mb-2">
            <span>Lvl {currentLevel}</span>
            <span>{Math.round(progressPercent)}%</span>
            <span>Lvl {currentLevel + 1}</span>
          </div>
          <div className="relative w-full h-4 bg-indigo-950/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 transition-all duration-1000 rounded-full"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Performance & Weak Areas Row */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Quiz Stats */}
          <div className="bg-gradient-to-br from-blue-900/50 to-indigo-900/50 backdrop-blur-md rounded-xl border border-blue-500/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-white">Performance</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center p-2 bg-white/10 rounded-lg">
                <Award className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                <p className="text-xl font-bold text-yellow-400">{stats.highestScore}%</p>
                <p className="text-xs text-gray-300">Best</p>
              </div>
              <div className="text-center p-2 bg-white/10 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-400 mx-auto mb-1" />
                <p className="text-xl font-bold text-green-400">{stats.passedQuizzes}</p>
                <p className="text-xs text-gray-300">Passed</p>
              </div>
              <div className="text-center p-2 bg-white/10 rounded-lg">
                <XCircle className="w-4 h-4 text-red-400 mx-auto mb-1" />
                <p className="text-xl font-bold text-red-400">{stats.failedQuizzes}</p>
                <p className="text-xs text-gray-300">Retry</p>
              </div>
            </div>
            
            <div className="text-center text-xs text-purple-200">
              Total: {stats.totalQuizzes} quizzes
            </div>
          </div>

          {/* Weak Areas */}
          <div className="bg-gradient-to-br from-orange-900/50 to-red-900/50 backdrop-blur-md rounded-xl border border-orange-500/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-orange-400" />
              <h3 className="font-bold text-white">Focus On</h3>
            </div>
            
            {stats.weakAreas.length > 0 ? (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {stats.weakAreas.slice(0, 3).map((area, i) => (
                  <div key={i} className="bg-white/10 rounded-lg p-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white text-sm font-medium">{area.area}</span>
                      <span className="text-orange-400 text-xs font-bold">{area.count}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                        style={{ width: `${Math.min((area.count / Math.max(...stats.weakAreas.map(a => a.count))) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-1" />
                <p className="text-white text-sm font-bold">All Good! 🎉</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gradient-to-br from-pink-900/50 to-purple-900/50 backdrop-blur-md rounded-xl border border-pink-500/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Book className="w-5 h-5 text-pink-400" />
            <h3 className="font-bold text-white">Recent Activity</h3>
          </div>

          {activityData.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {activityData.slice(0, 5).map((activity, i) => (
                <div key={i} className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getModeIcon(activity.mode)}</span>
                      <div>
                        <h4 className="text-white text-sm font-bold truncate max-w-[150px]">
                          {activity.themeTitle || activity.storyTitle || 'Quiz'}
                        </h4>
                        <p className="text-purple-200 text-xs">{activity.mode}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${activity.percentage >= 60 ? 'text-green-400' : 'text-red-400'}`}>
                        {activity.percentage}%
                      </div>
                      <p className="text-purple-200 text-xs">{activity.score}/{activity.maxScore}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Book className="w-12 h-12 text-purple-400 mx-auto mb-2 opacity-50" />
              <p className="text-white text-sm">No activity yet</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}