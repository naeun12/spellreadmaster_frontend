import React, { useState, useEffect } from 'react';
import { Star, Play, Lock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const StudentDashboard = () => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const studentDoc = await getDoc(doc(db, 'students', user.uid));
          if (studentDoc.exists()) {
            const data = studentDoc.data();

            // ✅ Fetch activity logs to compute dynamic stats
            const activitySnapshot = await getDocs(collection(db, 'students', user.uid, 'activity'));
            const activities = activitySnapshot.docs.map(doc => doc.data());

            // ✅ Themes Done: unique themeId from activities with mode containing "tlm" or "theme"
            const tlmActivities = activities.filter(a => 
              a.mode && (
                a.mode.toLowerCase().includes('tlm') || 
                a.mode.toLowerCase().includes('theme')
              )
            );
            const uniqueThemes = [...new Set(tlmActivities.map(a => a.themeId))].filter(Boolean).length;

            // ✅ Story Quizzes Done: count of activities with mode containing "story"
            const storyQuizzes = activities.filter(a => 
              a.mode && a.mode.toLowerCase().includes('story')
            ).length;

            // ✅ Weekly progress (7 days)
            const today = new Date();
            const weekData = [];
            for (let i = 6; i >= 0; i--) {
              const date = new Date(today);
              date.setDate(date.getDate() - i);
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
              const dayActivities = activities.filter(a => {
                const activityDate = a.timestamp?.toDate?.() || new Date(0);
                return activityDate.toDateString() === date.toDateString();
              });
              weekData.push({
                day: dayName,
                score: dayActivities.length > 0 ? Math.min(100, dayActivities.length * 20) : 0,
                completed: dayActivities.length > 0
              });
            }
            setWeeklyData(weekData);

            setStudentData({
              name: data.fullName || data.name || "Student",
              nickname: data.nickname || "",
              grade: data.grade || "Grade 2",
              avatar: data.avatar || "👧",
              completedLevels: data.completedLevels || [],
              currentLevel: data.currentLevel || 1,
              themesDone: uniqueThemes,
              storyQuizzesDone: storyQuizzes,
              recentActivities: activities
                .sort((a, b) => (b.timestamp?.toDate?.() || 0) - (a.timestamp?.toDate?.() || 0))
                .slice(0, 3)
                .map(a => ({
                  title: a.mode === 'pretest' ? 'Pretest Completed' : 
                         a.mode === 'quiz' ? `Level ${a.level} Quiz` :
                         a.mode?.toLowerCase().includes('tlm') ? `TLM: ${a.themeId || 'Activity'}` :
                         a.mode?.toLowerCase().includes('story') ? `Story Quiz` : 'Activity',
                  date: a.timestamp?.toDate?.().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || 'Today',
                  icon: a.mode?.toLowerCase().includes('story') ? '📖' : 
                        a.mode?.toLowerCase().includes('tlm') ? '🌍' : 
                        a.mode === 'quiz' ? '🎯' : '⭐'
                }))
            });
          }
        } catch (error) {
          console.error("Error fetching student data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const gameModes = [
    { 
      id: 'story', 
      title: 'Story Adventure', 
      description: 'Join magical characters on learning quests!', 
      icon: '📚', 
      color: 'from-purple-400 to-purple-600',
      path: '/StudentPage/story-mode' 
    },
    { 
      id: 'levels', 
      title: 'Level Challenge', 
      description: 'Climb the learning ladder step by step!', 
      icon: '🎯', 
      color: 'from-blue-400 to-blue-600',
      path: '/StudentPage/level-based-learning-mode' 
    },
    { 
      id: 'themes', 
      title: 'Theme Explorer', 
      description: 'Discover words about animals, food, and more!', 
      icon: '🌍', 
      color: 'from-green-400 to-green-600',
      path: '/StudentPage/thematic-learning-mode' 
    }
  ];

  const StatCard = ({ icon, value, label, color = "bg-gradient-to-r from-orange-400 to-orange-500" }) => (
    <div className={`${color} text-white rounded-2xl p-6 shadow-lg transform hover:scale-105 transition-all duration-200`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold mb-1">{value}</div>
          <div className="text-sm opacity-90">{label}</div>
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    </div>
  );

  const GameModeCard = ({ mode }) => (
    <Link 
      to={mode.path}
      className={`bg-gradient-to-br ${mode.color} text-white rounded-2xl p-6 shadow-lg block transform hover:scale-105 transition-all duration-300 relative overflow-hidden`}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="text-5xl">{mode.icon}</div>
        </div>
        <h3 className="text-2xl font-bold mb-2">{mode.title}</h3>
        <p className="text-sm opacity-90 mb-4">{mode.description}</p>
        {/* Progress bar removed */}
      </div>
    </Link>
  );

  const renderDashboard = () => {
    const totalStars = studentData.completedLevels.length * 3;

    return (
      <div className="min-h-screen bg-[#FDFBF7] p-16 rounded-3xl overflow-hidden mt-14 shadow-sm space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 rounded-2xl p-8 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              {/* ✅ Enhanced avatar: rounded corners + soft shadow */}
              <div className="text-5xl mb-2">
                {studentData.avatar.startsWith('<svg') ? (
                  <div className="inline-block w-16 h-16 rounded-xl shadow-md overflow-hidden border-2 border-white/20">
                    <svg
                      dangerouslySetInnerHTML={{ __html: studentData.avatar.replace(/<svg[^>]*>/, '<svg>') }}
                      width="64"
                      height="64"
                      viewBox="0 0 200 200"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl shadow-md bg-white/20 border-2 border-white/20">
                    {studentData.avatar}
                  </div>
                )}
              </div>
              <h1 className="text-4xl font-bold mb-2">
                Welcome back, {" "}
                {studentData.nickname 
                  ? studentData.nickname 
                  : (studentData.name?.split(' ')[0] || 'Explorer')
                }! 🎉
              </h1>
              <p className="text-lg opacity-90">Ready for another awesome learning adventure?</p>
            </div>
            <div className="text-right">
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            icon="⭐" 
            value={totalStars} 
            label="Total Stars"
            color="bg-gradient-to-r from-yellow-400 to-orange-500"
          />
          <StatCard 
            icon="🏆" 
            value={studentData.currentLevel} 
            label="Current Level"
            color="bg-gradient-to-r from-blue-400 to-purple-500"
          />
          <StatCard 
            icon="🌍" 
            value={studentData.themesDone} 
            label="Themes Done"
            color="bg-gradient-to-r from-green-400 to-teal-500"
          />
          <StatCard 
            icon="📖" 
            value={studentData.storyQuizzesDone} 
            label="Story Quizzes Done"
            color="bg-gradient-to-r from-pink-400 to-red-500"
          />
        </div>

        {/* Game Modes */}
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
            🎮 Choose Your Adventure
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gameModes.map(mode => (
              <GameModeCard key={mode.id} mode={mode} />
            ))}
          </div>
        </div>

        {/* Weekly Progress & Recent Wins */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Progress */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              📊 This Week’s Journey
            </h3>
            <div className="flex justify-between items-end space-x-2 h-32">
              {weeklyData.map((day, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div 
                    className={`w-full rounded-t-lg ${day.completed ? 'bg-gradient-to-t from-green-400 to-green-500' : 'bg-gray-200'} transition-all duration-300`}
                    style={{ height: `${(day.score / 100) * 80 + 20}px` }}
                  ></div>
                  <div className="text-sm font-semibold text-gray-600 mt-2">{day.day}</div>
                  {day.completed && (
                    <div className="text-xs text-green-600 font-bold">{day.score}%</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Wins */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              🏆 Recent Wins
            </h3>
            <div className="space-y-3">
              {studentData.recentActivities.length > 0 ? (
                studentData.recentActivities.map((activity, idx) => (
                  <div key={idx} className="flex items-center space-x-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                    <div className="text-2xl">{activity.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{activity.title}</div>
                      <div className="text-sm text-gray-600">{activity.date}</div>
                    </div>
                    <div className="text-yellow-500">
                      <Star className="w-5 h-5 fill-current" />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No recent activities yet. Keep learning!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-xl font-semibold text-gray-700">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-700">Unable to load student data. Please log in again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {renderDashboard()}
      </div>
    </div>
  );
};

export default StudentDashboard;