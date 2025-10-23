import React, { useState, useEffect } from 'react';
import { Lock, Star, CheckCircle, Trophy, Zap, Target, BookOpen } from 'lucide-react';

export default function StudentLBLM() {
  // Student progress state
  const [studentData, setStudentData] = useState({
    totalExp: 150, // From pre-test
    currentLevel: 1,
    completedLevels: [],
    currentLevelProgress: 0,
    skillLevel: 'beginner', // From pre-test: beginner, intermediate, advanced
    weakAreas: ['vowels', 'consonant blends'] // From pre-test
  });

  // Level configuration
  const levelConfig = [
    { level: 1, expRequired: 0, expReward: 50, theme: 'Short Vowels', icon: '🔤', color: 'from-blue-400 to-cyan-400' },
    { level: 2, expRequired: 50, expReward: 75, theme: 'Long Vowels', icon: '📝', color: 'from-green-400 to-emerald-400' },
    { level: 3, expRequired: 125, expReward: 100, theme: 'Consonant Blends', icon: '🎯', color: 'from-purple-400 to-pink-400' },
    { level: 4, expRequired: 225, expReward: 125, theme: 'Sight Words', icon: '👀', color: 'from-orange-400 to-red-400' },
    { level: 5, expRequired: 350, expReward: 150, theme: 'Rhyming Words', icon: '🎵', color: 'from-yellow-400 to-amber-400' },
    { level: 6, expRequired: 500, expReward: 175, theme: 'Word Families', icon: '👨‍👩‍👧', color: 'from-rose-400 to-pink-400' },
    { level: 7, expRequired: 675, expReward: 200, theme: 'Challenge Words', icon: '🏆', color: 'from-violet-400 to-purple-400' }
  ];

  const [levels, setLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const frameHeight = window.innerHeight;
  const levelSpacing = 200;

  const generateLevels = () => {
    const newLevels = [];
    const padding = 180; // Increased to account for header
    const screenWidth = window.innerWidth - padding * 2;
    const centerX = screenWidth / 2 + padding; // Center of the visible area
    
    for (let i = 0; i < levelConfig.length; i++) {
      const y = padding + (i * levelSpacing);
      const xVariation = screenWidth * 0.4; // Zigzag width
      const zigzagOffset = (Math.random() - 0.5) * xVariation;
      const x = centerX + zigzagOffset;
      
      newLevels.push({
        x,
        y,
        ...levelConfig[i]
      });
    }
    
    setLevels(newLevels);
  };

  // Generate level positions on mount
  useEffect(() => {
    generateLevels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate level state
  const getLevelState = (level) => {
    if (studentData.completedLevels.includes(level.level)) {
      return 'completed';
    }
    if (studentData.totalExp >= level.expRequired) {
      return 'unlocked';
    }
    return 'locked';
  };

  const drawPath = (start, end) => {
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const offsetX = (end.y - start.y) * 0.15;
    const offsetY = -(end.x - start.x) * 0.15;
    
    return `M ${start.x} ${start.y} Q ${midX + offsetX} ${midY + offsetY} ${end.x} ${end.y}`;
  };

  // Handle level click
  const handleLevelClick = (level) => {
    const state = getLevelState(level);
    if (state === 'locked') {
      // Show "not enough exp" message
      return;
    }
    setSelectedLevel(level);
  };

  // Start quiz (would connect to AI generation)
  const startQuiz = async (level) => {
    console.log('Starting quiz for level:', level.level);
    console.log('Student weak areas:', studentData.weakAreas);
    console.log('Skill level:', studentData.skillLevel);
    
    // TODO: Call AI API here to generate personalized quiz
    // const quiz = await generateQuiz({
    //   theme: level.theme,
    //   skillLevel: studentData.skillLevel,
    //   weakAreas: studentData.weakAreas,
    //   previousPerformance: studentData.completedLevels
    // });
    
    alert(`Starting ${level.theme} quiz! (Connect to AI API here)`);
  };

  // Simulate completing a level (for demo)
  const completeLevel = (level) => {
    setStudentData(prev => ({
      ...prev,
      totalExp: prev.totalExp + level.expReward,
      completedLevels: [...prev.completedLevels, level.level]
    }));
    setSelectedLevel(null);
  };

  const contentHeight = Math.max((levelConfig.length - 1) * levelSpacing + 200, frameHeight);
  const nextLevelExp = levelConfig.find(l => l.expRequired > studentData.totalExp)?.expRequired || levelConfig[levelConfig.length - 1].expRequired;
  const progressPercent = ((studentData.totalExp - levelConfig[studentData.completedLevels.length]?.expRequired || 0) / 
    ((nextLevelExp - (levelConfig[studentData.completedLevels.length]?.expRequired || 0)) || 1)) * 100;

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-16 rounded-3xl overflow-hidden mt-20 shadow-sm">
      {/* Sticky header with EXP bar */}
      <div className="sticky top-0 left-0 right-0 bg-white shadow-lg z-30 border-b-4 border-purple-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Spelling Adventure</h1>
                <p className="text-sm text-gray-600">Level {studentData.completedLevels.length + 1}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2 text-2xl font-bold text-purple-600">
                  <Zap className="w-6 h-6" />
                  {studentData.totalExp} EXP
                </div>
                <p className="text-xs text-gray-500">{nextLevelExp - studentData.totalExp} to next level</p>
              </div>
            </div>
          </div>
          
          {/* EXP Progress Bar */}
          <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable level map */}
      <div className="relative w-full" style={{ height: `${contentHeight}px` }}>
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-40 left-20 w-96 h-96 bg-purple-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-40 right-20 w-96 h-96 bg-pink-300 rounded-full blur-3xl"></div>
        </div>

        {/* SVG for paths */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ height: `${contentHeight}px` }}>
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#EC4899" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          {levels.map((level, index) => {
            if (index < levels.length - 1) {
              const currentState = getLevelState(level);
              const isUnlocked = currentState === 'completed' || currentState === 'unlocked';
              
              return (
                <path
                  key={`path-${index}`}
                  d={drawPath(level, levels[index + 1])}
                  stroke={isUnlocked ? "url(#pathGradient)" : "#E5E7EB"}
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={isUnlocked ? "none" : "12 12"}
                  strokeLinecap="round"
                />
              );
            }
            return null;
          })}
        </svg>

        {/* Level nodes */}
        {levels.map((level, index) => {
          const state = getLevelState(level);
          const isLocked = state === 'locked';
          const isCompleted = state === 'completed';
          const isUnlocked = state === 'unlocked';

          return (
            <div
              key={`level-${index}`}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'
              }`}
              style={{ left: `${level.x}px`, top: `${level.y}px` }}
              onClick={() => handleLevelClick(level)}
            >
              {/* Glow effect for unlocked/completed */}
              {!isLocked && (
                <div className={`absolute inset-0 bg-gradient-to-br ${level.color} rounded-full blur-xl opacity-60 scale-125 animate-pulse`}></div>
              )}
              
              {/* Main level circle */}
              <div className={`relative w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all border-4 ${
                isLocked 
                  ? 'bg-gray-300 border-gray-400' 
                  : `bg-gradient-to-br ${level.color} border-white`
              }`}>
                {isLocked && (
                  <Lock className="w-10 h-10 text-gray-600" />
                )}
                
                {isCompleted && (
                  <CheckCircle className="w-10 h-10 text-white" />
                )}
                
                {isUnlocked && (
                  <div className="text-4xl">{level.icon}</div>
                )}
                
                <span className={`text-sm font-bold mt-1 ${isLocked ? 'text-gray-600' : 'text-white'}`}>
                  {level.level}
                </span>
              </div>

              {/* Level name below */}
              <div className="absolute top-28 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <div className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
                  isLocked 
                    ? 'bg-gray-300 text-gray-600' 
                    : 'bg-white text-gray-800'
                }`}>
                  {level.theme}
                </div>
              </div>

              {/* EXP required badge for locked levels */}
              {isLocked && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                  {level.expRequired} EXP
                </div>
              )}

              {/* Stars for completed levels */}
              {isCompleted && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 flex gap-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                </div>
              )}
            </div>
          );
        })}

        {/* Level details panel */}
        {selectedLevel && (
          <div
            className="fixed bg-white rounded-3xl shadow-2xl border-4 border-purple-300 p-8 w-96 z-40 animate-in fade-in slide-in-from-bottom duration-300"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <button
              onClick={() => setSelectedLevel(null)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 transition-colors text-xl font-bold"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <div className={`w-20 h-20 mx-auto mb-4 bg-gradient-to-br ${selectedLevel.color} rounded-2xl flex items-center justify-center text-5xl shadow-xl`}>
                {selectedLevel.icon}
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedLevel.theme}</h2>
              <p className="text-lg text-gray-600">Level {selectedLevel.level}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-700 font-bold text-lg">Reward:</span>
                <div className="flex items-center gap-2 text-2xl font-bold text-purple-600">
                  <Zap className="w-6 h-6" />
                  +{selectedLevel.expReward} EXP
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-bold text-lg">Words:</span>
                <span className="text-gray-800 font-bold text-xl">10 questions</span>
              </div>
            </div>

            {getLevelState(selectedLevel) === 'completed' ? (
              <div className="space-y-3">
                <div className="bg-green-100 border-2 border-green-300 rounded-2xl p-4 text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <p className="text-green-800 font-bold text-lg">Completed!</p>
                </div>
                <button
                  onClick={() => startQuiz(selectedLevel)}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-xl rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                >
                  Practice Again
                </button>
              </div>
            ) : (
              <button
                onClick={() => startQuiz(selectedLevel)}
                className="w-full py-5 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white font-bold text-2xl rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
              >
                Start Quiz! 🚀
              </button>
            )}

            {/* Demo button to simulate completion */}
            {getLevelState(selectedLevel) !== 'completed' && (
              <button
                onClick={() => completeLevel(selectedLevel)}
                className="w-full mt-3 py-2 bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-300 transition-all"
              >
                (Demo: Complete Level)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Fixed legend at bottom */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-xl border-2 border-gray-200 px-6 py-3 flex items-center gap-6 z-20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
            <Lock className="w-4 h-4 text-gray-600" />
          </div>
          <span className="text-sm font-semibold text-gray-700">Locked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full"></div>
          <span className="text-sm font-semibold text-gray-700">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-700">Completed</span>
        </div>
      </div>
    </div>
  );
}