import React, { useState, useEffect, useRef } from 'react';
import { Lock, CheckCircle, Zap } from 'lucide-react';
import { auth, db } from '../../firebase'; // adjust path as needed - FIXED
import { doc, getDoc } from 'firebase/firestore';

// Add custom animations
const styles = `
  @keyframes shoot {
    0% { 
      transform: translateX(-100px) translateY(0); 
      opacity: 1; 
    }
    100% { 
      transform: translateX(100vw) translateY(50vh); 
      opacity: 0; 
    }
  }

  @keyframes spaceshipFly {
  0% {
    transform: translateX(-100px) translateY(0);
  }
  25% {
    transform: translateX(25vw) translateY(120px);
  }
  50% {
    transform: translateX(50vw) translateY(0px);
  }
  75% {
    transform: translateX(75vw) translateY(-80px);
  }
  100% {
    transform: translateX(100vw) translateY(0px);
  }
}

.animate-spaceship-fly {
  animation: spaceshipFly 12s linear infinite;
}
  
  @keyframes orbit {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(5deg); }
  }
  
  @keyframes wave {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(15deg); }
    75% { transform: rotate(-15deg); }
  }
  
  @keyframes speedEffect {
    0% { 
      transform: scaleX(1) translateX(0);
      opacity: 0.3;
    }
    50% { 
      transform: scaleX(2) translateX(-50px);
      opacity: 0.6;
    }
    100% { 
      transform: scaleX(1) translateX(0);
      opacity: 0.3;
    }
  }
  
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

export default function StudentLBLM() {
  const containerRef = useRef(null);
  //const [isAnimating, setIsAnimating] = useState(false);
  
  // Student progress state - now loaded from Firestore
  const [studentData, setStudentData] = useState({
    totalExp: 0, // Will be loaded from Firestore
    currentLevel: 1,
    completedLevels: [],
    currentLevelProgress: 0,
    skillLevel: 'beginner',
    weakAreas: ['vowels', 'consonant blends']
  });

  const [isLoading, setIsLoading] = useState(true);

  const verticalOffset = -100;

  // Level configuration - now dynamic
  const [levelConfig, setLevelConfig] = useState([
    { level: 1, expRequired: 0, expReward: 50, theme: 'Short Vowels', icon: '🔤', color: 'from-blue-400 to-cyan-400' },
    { level: 2, expRequired: 50, expReward: 75, theme: 'Long Vowels', icon: '📝', color: 'from-green-400 to-emerald-400' },
    { level: 3, expRequired: 125, expReward: 100, theme: 'Consonant Blends', icon: '🎯', color: 'from-purple-400 to-pink-400' },
    { level: 4, expRequired: 225, expReward: 125, theme: 'Sight Words', icon: '👀', color: 'from-orange-400 to-red-400' },
    { level: 5, expRequired: 350, expReward: 150, theme: 'Rhyming Words', icon: '🎵', color: 'from-yellow-400 to-amber-400' },
    { level: 6, expRequired: 500, expReward: 175, theme: 'Word Families', icon: '👨‍👩‍👧', color: 'from-rose-400 to-pink-400' },
    { level: 7, expRequired: 675, expReward: 200, theme: 'Challenge Words', icon: '🏆', color: 'from-violet-400 to-purple-400' }
  ]);

  const [levels, setLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const levelSpacing = 250;

  // Load student data from Firestore
  useEffect(() => {
    const loadStudentData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error("❌ No authenticated user");
          return;
        }

        const studentDoc = await getDoc(doc(db, 'students', user.uid));
        if (studentDoc.exists()) {
          const data = studentDoc.data();
          setStudentData({
            totalExp: data.totalExp || 0,
            currentLevel: data.currentLevel || 1,
            completedLevels: data.completedLevels || [],
            skillLevel: data.skillLevel || 'beginner',
            weakAreas: data.weakAreas || []
          });
        }

        // Load AI-generated levels metadata if available
        const quizDoc = await getDoc(doc(db, 'studentLevelQuizzes', user.uid));
        if (quizDoc.exists()) {
          const quizData = quizDoc.data();
          const existingLevels = quizData.quizzes || {};
          
          // Update level config based on available AI-generated quizzes
          const updatedConfig = [];
          for (let i = 1; i <= 20; i++) { // Support up to 20 levels dynamically
            const levelKey = `level_${i}`;
            const quiz = existingLevels[levelKey];
            
            if (quiz) {
              updatedConfig.push({
                level: i,
                expRequired: calculateExpRequired(i),
                expReward: 50 + i * 10,
                theme: quiz.theme || `Level ${i}`,
                icon: getLevelIcon(i),
                color: getLevelColor(i)
              });
            } else {
              // Use default theme for future levels
              updatedConfig.push({
                level: i,
                expRequired: calculateExpRequired(i),
                expReward: 50 + i * 10,
                theme: getLevelTheme(i),
                icon: getLevelIcon(i),
                color: getLevelColor(i)
              });
            }
          }
          setLevelConfig(updatedConfig);
        }
      } catch (error) {
        console.error("💥 Failed to load student data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStudentData();
  }, []);

  // Generate levels based on current config
  const generateLevels = () => {
    const newLevels = [];
    const screenHeight = window.innerHeight - 200;
    const centerY = screenHeight / 2;
    
    for (let i = 0; i < levelConfig.length; i++) {
      const x = i * levelSpacing;
      const yVariation = screenHeight * 0.3;
      const zigzagOffset = Math.sin(i * 0.8) * yVariation;
      const y = centerY + zigzagOffset + verticalOffset;
      
      newLevels.push({
        x,
        y,
        visualOffset: { x: 0, y: 0 }, // Adjust these values as needed
        ...levelConfig[i]
      });
    }
    
    setLevels(newLevels);
  };

  useEffect(() => {
    if (!isLoading) {
      generateLevels();
      // Center on first level initially
      setTimeout(() => {
        centerOnLevel(levelConfig[0]);
      }, 100);
    }
  }, [levelConfig, isLoading]);

  const centerOnLevel = (level) => {
    if (!containerRef.current) return;
    
    const levelIndex = level.level - 1;
    const targetX = levelIndex * levelSpacing;
    const containerWidth = window.innerWidth;
    const scrollX = targetX - containerWidth / 2 + 100;
    
    //setIsAnimating(true);
    containerRef.current.scrollTo({
      left: scrollX,
      behavior: 'smooth'
    });
    
   // setTimeout(() => setIsAnimating(false), 800);
  };

  const getLevelState = (level) => {
    if (studentData.completedLevels.includes(level.level)) {
      return 'completed';
    }
    if (studentData.totalExp >= level.expRequired) {
      return 'unlocked';
    }
    return 'locked';
  };

  const handleLevelClick = (level) => {
    const state = getLevelState(level);
    if (state === 'locked') {
      return;
    }
    // Don't call centerOnLevel() - just set the selected level immediately
    setSelectedLevel(level);
  };

  // 🔧 Updated startQuiz to connect to AI backend
const startQuiz = async (level) => {
  console.log('Starting quiz for level:', level.level);
  
  try {
    const user = auth.currentUser;
    if (!user) {
      alert("❌ Please log in first!");
      return;
    }
    
    const idToken = await user.getIdToken();
    
    // ✅ CORRECT ENDPOINT NAME: /get-quiz/:level
    const response = await fetch(`http://localhost:5000/get-quiz/${level.level}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`, // ✅ Required for authentication
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const quizData = await response.json();
      console.log('Loaded quiz for level:', level.level, quizData);
      alert(`Starting ${level.theme} quiz! Questions loaded from AI backend.`);
    } else {
      // ✅ CORRECT FALLBACK: /generate-single-quiz (POST)
      const generateResponse = await fetch('http://localhost:5000/generate-single-quiz', {
        method: 'POST', // ✅ Must be POST
        headers: {
          'Authorization': `Bearer ${idToken}`, // ✅ Required for authentication
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          level: level.level,
          grade: 1,
          weakAreas: studentData.weakAreas,
          skillLevel: studentData.skillLevel
        })
      });

      if (generateResponse.ok) {
        console.log('Generated new quiz for level:', level.level);
        // Try to get the quiz again after generation
        const retryResponse = await fetch(`http://localhost:5000/get-quiz/${level.level}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (retryResponse.ok) {
          const quizData = await retryResponse.json();
          console.log('Loaded generated quiz for level:', level.level, quizData);
          alert(`Starting ${level.theme} quiz! AI generated new questions.`);
        }
      } else {
        alert(`Failed to generate quiz for level ${level.level}. Using demo mode.`);
      }
    }
  } catch (error) {
    console.error("💥 Error starting quiz:", error);
    alert("Failed to load quiz. Please try again.");
  }
};

  // 🔧 Updated completeLevel to connect to backend
  const completeLevel = async (level) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const idToken = await user.getIdToken();
      
      // Submit quiz results to backend (even if it's just a demo completion)
      const response = await fetch(`http://localhost:5000/submit-quiz/${level.level}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userAnswers: [], // In demo mode, no actual answers
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Quiz submitted successfully:', result);
        
        // Update local state
        setStudentData(prev => ({
          ...prev,
          totalExp: prev.totalExp + level.expReward,
          completedLevels: [...new Set([...prev.completedLevels, level.level])]
        }));
      } else {
        // If backend call fails, still update local state for demo
        setStudentData(prev => ({
          ...prev,
          totalExp: prev.totalExp + level.expReward,
          completedLevels: [...new Set([...prev.completedLevels, level.level])]
        }));
      }
    } catch (error) {
      console.error("💥 Error completing level:", error);
      // Still update local state
      setStudentData(prev => ({
        ...prev,
        totalExp: prev.totalExp + level.expReward,
        completedLevels: [...new Set([...prev.completedLevels, level.level])]
      }));
    }

    setSelectedLevel(null);
  };

  // Helper functions for dynamic level generation
  const calculateExpRequired = (levelNum) => {
    if (levelNum === 1) return 0;
    return 50 * (levelNum - 1) + 50; // Simple formula: 50, 100, 150, etc.
  };

  const getLevelTheme = (levelNum) => {
    const themes = [
      'Short Vowels', 'Long Vowels', 'Consonant Blends', 'Sight Words',
      'Rhyming Words', 'Word Families', 'Challenge Words', 'Silent Letters',
      'Prefixes & Suffixes', 'Context Clues', 'Advanced Vocabulary'
    ];
    return themes[(levelNum - 1) % themes.length];
  };

  const getLevelIcon = (levelNum) => {
    const icons = ['🔤', '📝', '🎯', '👀', '🎵', '👨‍👩‍👧', '🏆', '🤫', '⚡', '🧠', '📖'];
    return icons[(levelNum - 1) % icons.length];
  };

  const getLevelColor = (levelNum) => {
    const colors = [
      'from-blue-400 to-cyan-400',
      'from-green-400 to-emerald-400',
      'from-purple-400 to-pink-400',
      'from-orange-400 to-red-400',
      'from-yellow-400 to-amber-400',
      'from-rose-400 to-pink-400',
      'from-violet-400 to-purple-400',
      'from-red-400 to-pink-400',
      'from-teal-400 to-cyan-400',
      'from-indigo-400 to-violet-400'
    ];
    return colors[(levelNum - 1) % colors.length];
  };

  const contentWidth = (levelConfig.length - 1) * levelSpacing + 800;
  const nextLevelExp = levelConfig.find(l => l.expRequired > studentData.totalExp)?.expRequired || levelConfig[levelConfig.length - 1].expRequired;
  const progressPercent = ((studentData.totalExp - (levelConfig[studentData.completedLevels.length]?.expRequired || 0)) / 
    ((nextLevelExp - (levelConfig[studentData.completedLevels.length]?.expRequired || 0)) || 1)) * 100;

  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading your learning journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-blue-950 overflow-hidden relative">
      <style>{`
        ${styles}
        .animate-spin-slow {
          animation: spin-slow 16s linear infinite;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      {/* Back to Dashboard Button */}
      <div className={`absolute top-4 left-4 ${selectedLevel ? 'backdrop-blur-md' : ''} z-40`}>
        <button
          onClick={() => window.location.href = '/StudentPage'}
          className={`bg-yellow-400 ${selectedLevel ? 'bg-opacity-10 hover:bg-opacity-15' : 'bg-opacity-20 hover:bg-opacity-30'} text-white rounded-full p-3 transition-colors shadow-lg`}
          title="Back to Dashboard"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
      </div>

      {/* Twinkling stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(150)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              opacity: 0.3 + Math.random() * 0.7
            }}
          />
        ))}
      </div>

      {/* Shooting star - FIXED: No layout shift */}
      <div className="absolute top-20 left-0 w-full h-1 pointer-events-none z-10 overflow-hidden">
        <div 
          className="absolute w-2 h-2 bg-white rounded-full blur-sm shadow-lg shadow-white/50 animate-[shoot_4s_ease-in-out_infinite]"
          style={{
            left: '-100px',
            top: '0',
            willChange: 'transform'
          }}
        />
      </div>

      {/* UFO with alien */}
      <div className="absolute animate-[float_6s_ease-in-out_infinite] z-0"
           style={{ 
             right: '10%',
             top: '20%',
           }}>
        <div className="relative">
          <div className="absolute top-12 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[30px] border-r-[30px] border-t-[60px] border-l-transparent border-r-transparent border-t-yellow-400/20 blur-sm" />
          
          <div className="relative">
            <div className="w-16 h-6 bg-gradient-to-b from-gray-300 to-gray-500 rounded-full shadow-xl" />
            <div className="absolute top-1 left-1/2 -translate-x-1/2 -translate-y-3 w-8 h-6 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-t-full" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 text-xl animate-[wave_0.5s_ease-in-out_infinite]">
              👽
            </div>
            <div className="absolute bottom-0 left-1/4 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
            <div className="absolute bottom-0 right-1/4 w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
          </div>
        </div>
      </div>

      {/* Planet - Clean version with gentle float and glimmer */}
      <div className="absolute animate-[float_8s_ease-in-out_infinite] z-0"
           style={{ 
             left: '8%',
             bottom: '15%',
           }}>
        <div className="w-28 h-28 bg-gradient-to-br from-purple-400 via-pink-400 to-purple-600 rounded-full shadow-2xl shadow-purple-500/50 relative overflow-hidden">
          {/* Glimmer effects */}
          <div className="absolute top-2 left-2 w-6 h-3 bg-white/30 rounded-full transform rotate-45 animate-pulse" 
               style={{ animationDelay: '0s' }}></div>
          <div className="absolute top-6 right-4 w-4 h-2 bg-yellow-200/40 rounded-full animate-pulse" 
               style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-8 right-6 w-5 h-2 bg-blue-200/30 rounded-full animate-pulse" 
               style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-4 left-4 w-7 h-3 bg-pink-200/35 rounded-full animate-pulse" 
               style={{ animationDelay: '3s' }}></div>
          
          {/* Inner glow */}
          <div className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-transparent via-white/10 to-transparent" />
        </div>
      </div>

      {/* Moon - Subtle micro-orbit in lower right, anchored to avoid header interference */}
      <div className="absolute z-0"
          style={{ 
            right: '12%',
            bottom: '12%', // Fixed position, stays safely below header
          }}>
        <div className="relative animate-[orbit_30s_linear_infinite]">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-600 rounded-full shadow-2xl shadow-gray-500/50 relative overflow-hidden">
            {/* Craters */}
            <div className="absolute top-3 left-3 w-3 h-3 bg-gray-600 rounded-full"></div>
            <div className="absolute top-6 right-4 w-2 h-2 bg-gray-700 rounded-full"></div>
            <div className="absolute bottom-6 right-6 w-4 h-4 bg-gray-500 rounded-full"></div>
            <div className="absolute bottom-4 left-4 w-3 h-3 bg-gray-600 rounded-full"></div>
            <div className="absolute top-8 left-6 w-2 h-2 bg-gray-700 rounded-full"></div>
            
            {/* Subtle glow for depth */}
            <div className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-transparent via-white/5 to-transparent" />
          </div>
        </div>
      </div>

       {/* Spaceship - Continuous wave motion from left to right */}
      <div 
        className="absolute z-0 animate-spaceship-fly"
        style={{ 
          left: '-100px', // Start off-screen to the left
          top: '45%',
        }}
      >
        <div className="relative">
          {/* Spaceship body */}
          <div className="w-16 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full shadow-lg shadow-blue-400/50" />
          
          {/* Cockpit */}
          <div className="absolute top-1 right-2 w-6 h-4 bg-gradient-to-r from-cyan-300 to-blue-400 rounded-full" />
          
          {/* Wings */}
          <div className="absolute -bottom-1 left-2 w-4 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-t-full" />
          <div className="absolute -bottom-1 right-2 w-4 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-t-full" />
          
          {/* Engine glow */}
          <div className="absolute -left-2 top-1 w-3 h-4 bg-yellow-300 rounded-full blur-sm animate-pulse" />
        </div>

        {/* Faint trail behind spaceship — only visible during motion */}
        <div className="absolute z-0 animate-trail opacity-30 pointer-events-none"
            style={{
              left: '-100px',
              top: '15%',
              width: '120px',
              height: '2px',
              background: 'linear-gradient(to right, transparent, rgba(236, 255, 255, 0.4), transparent)',
              borderRadius: '50%',
              transform: 'translateX(50px)',
              animation: 'trailFade 12s linear infinite',
            }}
        />
      </div>

      {/* Sticky header with EXP bar */}
      <div className="relative bg-indigo-900/90 backdrop-blur-md shadow-lg z-30 border-b-4 border-purple-500/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/50 animate-pulse">
                <span className="text-3xl">⭐</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Spelling Galaxy</h1>
                <p className="text-sm text-purple-300">Level {studentData.completedLevels.length + 1}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2 text-2xl font-bold text-yellow-400">
                  <Zap className="w-6 h-6 drop-shadow-lg" />
                  {studentData.totalExp} EXP
                </div>
                <p className="text-xs text-purple-300">{nextLevelExp - studentData.totalExp} to next level</p>
              </div>
            </div>
          </div>
          
          <div className="relative w-full h-4 bg-indigo-950/50 rounded-full overflow-hidden border border-purple-500/30">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 transition-all duration-500 rounded-full shadow-lg shadow-yellow-500/50"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable horizontal level map */}
      <div 
        ref={containerRef}
        className="relative overflow-x-auto overflow-y-hidden scrollbar-hide"
        style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          marginLeft: '56px', /* Account for sidebar width when collapsed */
          marginRight: '0',
          height: 'calc(100vh - 120px)', /* Subtract header height */
          marginTop: '0'
        }}
      >
        <div className="relative h-full" style={{ width: `${contentWidth}px`, minHeight: 'calc(100vh - 120px)' }}>
          {/* Background nebula clouds */}
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full blur-[120px]"></div>
            <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-blue-500 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-pink-500 rounded-full blur-[120px]"></div>
          </div>

          {/* SVG for paths - FIXED: Uses same coordinate system as stars */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              //marginLeft: '56px', // Same as your map container
              marginRight: '0',
              height: 'calc(100vh - 120px)',
              marginTop: '0'
            }}
          >
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#FCD34D" stopOpacity="0.6" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {levels.map((level, index) => {
              if (index < levels.length - 1) {
                const currentState = getLevelState(level);
                const isUnlocked = currentState === 'completed' || currentState === 'unlocked';
                
                // FIXED: Use same coordinate system as stars (add 400, 100 offsets)
                const startLevel = {
                  x: level.x + 400 + level.visualOffset.x,
                  y: level.y + 100 + level.visualOffset.y
                };
                const endLevel = {
                  x: levels[index + 1].x + 400 + levels[index + 1].visualOffset.x,
                  y: levels[index + 1].y + 100 + levels[index + 1].visualOffset.y
                };

                // Calculate path with corrected coordinates
                const midX = (startLevel.x + endLevel.x) / 2;
                const midY = (startLevel.y + endLevel.y) / 2;
                const controlY = midY - 30; // Fixed curve height
                
                return (
                  <path
                    key={`path-${index}`}
                    d={`M ${startLevel.x} ${startLevel.y} Q ${midX} ${controlY} ${endLevel.x} ${endLevel.y}`}
                    stroke={isUnlocked ? "url(#pathGradient)" : "#1E3A8A"}
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={isUnlocked ? "none" : "8 8"}
                    strokeLinecap="round"
                    filter={isUnlocked ? "url(#glow)" : "none"}
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
                  isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-125'
                }`}
                style={{ 
                  left: `${level.x + 400}px`, 
                  top: `${level.y + 100}px` 
                }}
                onClick={() => handleLevelClick(level)}
              >
                {!isLocked && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${level.color} rounded-full blur-2xl opacity-70 scale-150 animate-pulse`}></div>
                )}
                
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="absolute w-full h-full">
                    <defs>
                      <filter id={`starGlow-${index}`}>
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <polygon
                      points="50,5 61,35 92,35 67,55 78,85 50,65 22,85 33,55 8,35 39,35"
                      className={`${
                        isLocked 
                          ? 'fill-gray-600 stroke-gray-700' 
                          : `fill-yellow-400 stroke-yellow-300`
                      } transition-all`}
                      strokeWidth="2"
                      filter={!isLocked ? `url(#starGlow-${index})` : 'none'}
                      style={{
                        filter: !isLocked ? 'drop-shadow(0 0 10px rgba(250, 204, 21, 0.8))' : 'none'
                      }}
                    />
                  </svg>

                  {/* DEBUG: Show container center (red) and visual center (blue) */}
                  {/*
                  <div
                    className="absolute w-2 h-2 bg-red-500 rounded-full z-50"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                  
                  <div
                    className="absolute w-2 h-2 bg-blue-500 rounded-full z-50"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      marginLeft: '0px', // Adjust these values as needed
                      marginTop: '0px'     // Based on your observation
                    }}
                  /> */}

                  <div className={`relative z-10 flex flex-col items-center justify-center transition-all`}>
                    {isLocked && (
                      <Lock className="w-10 h-10 text-gray-300" />
                    )}
                    
                    {isCompleted && (
                      <CheckCircle className="w-10 h-10 text-white drop-shadow-lg" />
                    )}
                    
                    {isUnlocked && !isCompleted && (
                      <div className="text-4xl drop-shadow-lg">{level.icon}</div>
                    )}
                    
                    <span className={`text-sm font-bold mt-1 ${isLocked ? 'text-gray-300' : 'text-white drop-shadow-lg'}`}>
                      {level.level}
                    </span>
                  </div>
                </div>

                <div className="absolute top-24 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <div className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm ${
                    isLocked 
                      ? 'bg-gray-800/60 text-gray-300 border border-gray-600' 
                      : 'bg-indigo-900/70 text-yellow-300 border border-yellow-400/50'
                  }`}>
                    {level.theme}
                  </div>
                </div>

                {isLocked && (
                  <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-red-400">
                    {level.expRequired} EXP
                  </div>
                )}

                {isCompleted && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 flex gap-1">
                    {[...Array(3)].map((_, i) => (
                      <span key={i} className="text-2xl animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
                        ✨
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Level details panel */}
      {selectedLevel && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setSelectedLevel(null)}
          />
          <div
            className="fixed bg-gradient-to-br from-indigo-900 to-purple-950 rounded-3xl shadow-2xl border-4 border-yellow-400/50 p-8 w-96 z-50 animate-in fade-in zoom-in duration-300"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <button
              onClick={() => setSelectedLevel(null)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-indigo-800 hover:bg-indigo-700 transition-colors text-xl font-bold text-white border-2 border-purple-400"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <polygon
                    points="50,5 61,35 92,35 67,55 78,85 50,65 22,85 33,55 8,35 39,35"
                    className="fill-yellow-400 stroke-yellow-300"
                    strokeWidth="2"
                    style={{ filter: 'drop-shadow(0 0 15px rgba(250, 204, 21, 1))' }}
                  />
                </svg>
                <span className="absolute text-5xl">{selectedLevel.icon}</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">{selectedLevel.theme}</h2>
              <p className="text-lg text-yellow-300">Level {selectedLevel.level}</p>
            </div>

            <div className="bg-indigo-950/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-purple-500/30">
              <div className="flex items-center justify-between mb-4">
                <span className="text-purple-200 font-bold text-lg">Reward:</span>
                <div className="flex items-center gap-2 text-2xl font-bold text-yellow-400">
                  <Zap className="w-6 h-6 drop-shadow-lg" />
                  +{selectedLevel.expReward} EXP
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-purple-200 font-bold text-lg">Words:</span>
                <span className="text-white font-bold text-xl">10 questions</span>
              </div>
            </div>

            {getLevelState(selectedLevel) === 'completed' ? (
              <div className="space-y-3">
                <div className="bg-green-600/30 border-2 border-green-400 rounded-2xl p-4 text-center backdrop-blur-sm">
                  <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-2" />
                  <p className="text-green-200 font-bold text-lg">Completed!</p>
                </div>
                <button
                  onClick={() => startQuiz(selectedLevel)}
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-xl rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all border-2 border-cyan-300"
                >
                  Practice Again
                </button>
              </div>
            ) : (
              <button
                onClick={() => startQuiz(selectedLevel)}
                className="w-full py-5 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 text-indigo-900 font-bold text-2xl rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all border-2 border-yellow-300"
              >
                Start Quest! 🚀
              </button>
            )}

            {getLevelState(selectedLevel) !== 'completed' && (
              <button
                onClick={() => completeLevel(selectedLevel)}
                className="w-full mt-3 py-2 bg-indigo-800/50 text-purple-200 font-semibold text-sm rounded-xl hover:bg-indigo-700/50 transition-all border border-purple-500/30"
              >
                (Demo: Complete Level)
              </button>
            )}
          </div>
        </>
      )}

      {/* Fixed legend at bottom */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-indigo-900/90 backdrop-blur-md rounded-2xl shadow-xl border-2 border-purple-500/50 px-6 py-3 flex items-center gap-6 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <polygon points="50,5 61,35 92,35 67,55 78,85 50,65 22,85 33,55 8,35 39,35" className="fill-gray-600 stroke-gray-700" strokeWidth="2" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-300">Locked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <polygon points="50,5 61,35 92,35 67,55 78,85 50,65 22,85 33,55 8,35 39,35" className="fill-yellow-400 stroke-yellow-300" strokeWidth="2" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-yellow-300">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center relative">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <polygon points="50,5 61,35 92,35 67,55 78,85 50,65 22,85 33,55 8,35 39,35" className="fill-yellow-400 stroke-yellow-300" strokeWidth="2" />
            </svg>
            <CheckCircle className="w-5 h-5 text-white absolute" style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.5))' }} />
          </div>
          <span className="text-sm font-semibold text-green-300">Completed</span>
        </div>
      </div>
    </div>
  );
}