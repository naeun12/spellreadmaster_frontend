import React, { useState, useEffect } from 'react';
import { Star, Play, Lock, CheckCircle } from 'lucide-react';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const StudentDashboard = () => {
  const [selectedMode, setSelectedMode] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch student data from Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const studentDoc = await getDoc(doc(db, 'students', user.uid));
          if (studentDoc.exists()) {
            const data = studentDoc.data();
            setStudentData({
              name: data.fullName || data.name || "Student",
              grade: data.grade || "Grade 2",
              avatar: data.avatar || "👧",
              totalPoints: data.totalPoints || 0,
              streak: data.streak || 0,
              level: data.level || 1,
              completedLessons: data.completedLessons || 0,
              badges: data.badges || [],
              recentAchievements: data.recentAchievements || []
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
      progress: 75,
      currentChapter: 'Chapter 3: The Magic Forest',
      totalChapters: 8,
      unlocked: true
    },
    {
      id: 'levels',
      title: 'Level Challenge',
      description: 'Climb the learning ladder step by step!',
      icon: '🎯',
      color: 'from-blue-400 to-blue-600',
      progress: 60,
      currentLevel: 12,
      totalLevels: 20,
      unlocked: true
    },
    {
      id: 'themes',
      title: 'Theme Explorer',
      description: 'Discover words about animals, food, and more!',
      icon: '🌍',
      color: 'from-green-400 to-green-600',
      progress: 40,
      currentTheme: 'Ocean Animals',
      themes: ['Animals', 'Food', 'Nature', 'Space'],
      unlocked: true
    }
  ];

  const weeklyProgress = [
    { day: 'Mon', score: 85, completed: true },
    { day: 'Tue', score: 92, completed: true },
    { day: 'Wed', score: 78, completed: true },
    { day: 'Thu', score: 95, completed: true },
    { day: 'Fri', score: 88, completed: true },
    { day: 'Sat', score: 0, completed: false },
    { day: 'Sun', score: 0, completed: false }
  ];

  const upcomingLessons = [
    { title: 'Magic Words with Silent Letters', difficulty: 'Easy', time: '15 min', icon: '🪄' },
    { title: 'Rhyming Adventure', difficulty: 'Medium', time: '20 min', icon: '🎵' },
    { title: 'Compound Word Factory', difficulty: 'Easy', time: '12 min', icon: '🏭' }
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

  const GameModeCard = ({ mode, onClick }) => (
    <div 
      className={`bg-gradient-to-br ${mode.color} text-white rounded-2xl p-6 shadow-lg cursor-pointer transform hover:scale-105 transition-all duration-300 relative overflow-hidden`}
      onClick={() => onClick(mode)}
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="text-5xl">{mode.icon}</div>
          <div className="bg-white bg-opacity-20 rounded-full p-2">
            <Play className="w-6 h-6" />
          </div>
        </div>
        
        <h3 className="text-2xl font-bold mb-2">{mode.title}</h3>
        <p className="text-sm opacity-90 mb-4">{mode.description}</p>
        
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{mode.progress}%</span>
          </div>
          <div className="bg-white bg-opacity-20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${mode.progress}%` }}
            ></div>
          </div>
        </div>
        
        <div className="text-sm">
          {mode.id === 'story' && <span>📖 {mode.currentChapter}</span>}
          {mode.id === 'levels' && <span>🎯 Level {mode.currentLevel}/{mode.totalLevels}</span>}
          {mode.id === 'themes' && <span>🌊 {mode.currentTheme}</span>}
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="min-h-screen bg-[#FDFBF7] p-16 rounded-3xl overflow-hidden mt-14 shadow-sm space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-5xl mb-2">{studentData.avatar}</div>
            <h1 className="text-4xl font-bold mb-2">Welcome back, {studentData.name.split(' ')[0]}! 🎉</h1>
            <p className="text-lg opacity-90">Ready for another awesome learning adventure?</p>
          </div>
          <div className="text-right">
            <div className="bg-white bg-opacity-20 rounded-xl p-4">
              <div className="text-2xl font-bold text-black">{studentData.streak}</div>
              <div className="text-sm text-black">Day Streak! 🔥</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon="⭐" 
          value={studentData.totalPoints} 
          label="Total Stars"
          color="bg-gradient-to-r from-yellow-400 to-orange-500"
        />
        <StatCard 
          icon="🏆" 
          value={studentData.level} 
          label="Current Level"
          color="bg-gradient-to-r from-blue-400 to-purple-500"
        />
        <StatCard 
          icon="📚" 
          value={studentData.completedLessons} 
          label="Lessons Done"
          color="bg-gradient-to-r from-green-400 to-teal-500"
        />
        <StatCard 
          icon="🎖️" 
          value={studentData.badges.length} 
          label="Badges Earned"
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
            <GameModeCard key={mode.id} mode={mode} onClick={setSelectedMode} />
          ))}
        </div>
      </div>

      {/* Weekly Progress & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Progress */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            📊 This Weeks Journey
          </h3>
          <div className="flex justify-between items-end space-x-2 h-32">
            {weeklyProgress.map((day) => (
              <div key={day.day} className="flex-1 flex flex-col items-center">
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

        {/* Recent Achievements */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
            🏆 Recent Wins
          </h3>
          <div className="space-y-3">
            {studentData.recentAchievements.length > 0 ? (
              studentData.recentAchievements.map((achievement, idx) => (
                <div key={idx} className="flex items-center space-x-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{achievement.title}</div>
                    <div className="text-sm text-gray-600">{achievement.date}</div>
                  </div>
                  <div className="text-yellow-500">
                    <Star className="w-5 h-5 fill-current" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No achievements yet. Keep learning!</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Start Lessons */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          🚀 Quick Start Lessons
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upcomingLessons.map((lesson, idx) => (
            <div key={idx} className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-orange-300 hover:bg-orange-50 transition-all cursor-pointer group">
              <div className="text-3xl mb-2">{lesson.icon}</div>
              <h4 className="font-semibold text-gray-800 mb-2 group-hover:text-orange-600">{lesson.title}</h4>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  lesson.difficulty === 'Easy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {lesson.difficulty}
                </span>
                <span>{lesson.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGameMode = (mode) => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <button 
          onClick={() => setSelectedMode(null)}
          className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-800">
          {mode.icon} {mode.title}
        </h1>
      </div>

      {mode.id === 'story' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({length: 8}, (_, i) => (
            <div key={i} className={`relative rounded-xl p-6 shadow-lg cursor-pointer transform hover:scale-105 transition-all ${
              i < 3 ? 'bg-gradient-to-br from-green-400 to-green-600 text-white' :
              i === 3 ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white border-4 border-yellow-400' :
              'bg-gray-200 text-gray-500'
            }`}>
              <div className="text-center">
                {i < 3 && <CheckCircle className="w-8 h-8 mx-auto mb-2" />}
                {i === 3 && <Play className="w-8 h-8 mx-auto mb-2" />}
                {i > 3 && <Lock className="w-8 h-8 mx-auto mb-2" />}
                <div className="font-bold">Chapter {i + 1}</div>
                <div className="text-sm opacity-80">
                  {i === 0 && "The Beginning"}
                  {i === 1 && "First Steps"}
                  {i === 2 && "Growing Strong"}
                  {i === 3 && "Magic Forest"}
                  {i > 3 && "Coming Soon"}
                </div>
              </div>
              {i === 3 && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  !
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {mode.id === 'levels' && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({length: 20}, (_, i) => (
            <div key={i} className={`aspect-square rounded-xl p-4 shadow-lg cursor-pointer transform hover:scale-105 transition-all flex items-center justify-center ${
              i < 12 ? 'bg-gradient-to-br from-green-400 to-green-600 text-white' :
              i === 12 ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white border-4 border-yellow-400' :
              'bg-gray-200 text-gray-500'
            }`}>
              <div className="text-center">
                {i < 12 && <div className="text-2xl mb-1">⭐</div>}
                {i === 12 && <div className="text-2xl mb-1">🎯</div>}
                {i > 12 && <div className="text-2xl mb-1">🔒</div>}
                <div className="font-bold text-lg">{i + 1}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {mode.id === 'themes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: 'Ocean Animals', icon: '🐠', progress: 80, unlocked: true },
            { name: 'Farm Animals', icon: '🐄', progress: 100, unlocked: true },
            { name: 'Food & Kitchen', icon: '🍎', progress: 60, unlocked: true },
            { name: 'Space Adventure', icon: '🚀', progress: 0, unlocked: false },
            { name: 'Fairy Tales', icon: '🏰', progress: 0, unlocked: false },
            { name: 'Sports & Games', icon: '⚽', progress: 0, unlocked: false }
          ].map((theme, idx) => (
            <div key={idx} className={`rounded-2xl p-6 shadow-lg cursor-pointer transform hover:scale-105 transition-all ${
              theme.unlocked 
                ? 'bg-gradient-to-br from-purple-400 to-pink-500 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}>
              <div className="text-4xl mb-3">{theme.unlocked ? theme.icon : '🔒'}</div>
              <h3 className="text-xl font-bold mb-2">{theme.name}</h3>
              {theme.unlocked && (
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{theme.progress}%</span>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-full h-2">
                    <div 
                      className="bg-white rounded-full h-2 transition-all duration-300"
                      style={{ width: `${theme.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              {!theme.unlocked && (
                <p className="text-sm opacity-75">Complete more lessons to unlock!</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

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
        {selectedMode ? renderGameMode(selectedMode) : renderDashboard()}
      </div>

      {/* Badge Collection (Floating) */}
      {studentData.badges.length > 0 && (
        <div className="fixed bottom-4 right-4">
          <div className="bg-white rounded-full p-3 shadow-lg flex items-center space-x-2">
            <span className="text-sm font-semibold text-gray-700">Badges:</span>
            {studentData.badges.map((badge, idx) => (
              <span key={idx} className="text-lg">{badge}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;