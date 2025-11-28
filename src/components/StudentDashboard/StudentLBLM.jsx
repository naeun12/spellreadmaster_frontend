import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lock, CheckCircle, Zap, Volume2, X, Check } from 'lucide-react';
import { auth, db } from '../../firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  increment,
  arrayUnion
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const styles = `
  @keyframes shoot {
    0% { transform: translateX(-100px) translateY(0); opacity: 1; }
    100% { transform: translateX(100vw) translateY(50vh); opacity: 0; }
  }
  @keyframes spaceshipFly {
    0% { transform: translateX(-100px) translateY(0); }
    25% { transform: translateX(25vw) translateY(120px); }
    50% { transform: translateX(50vw) translateY(0px); }
    75% { transform: translateX(75vw) translateY(-80px); }
    100% { transform: translateX(100vw) translateY(0px); }
  }
  .animate-spaceship-fly { animation: spaceshipFly 12s linear infinite; }
  @keyframes orbit { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @keyframes float { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(5deg); } }
  @keyframes wave { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(15deg); } 75% { transform: rotate(-15deg); } }
  @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

// ✅ Badge Definitions
const BADGES = [
  { id: 'novice', name: 'Novice Speller', exp: 0, icon: '🌱' },
  { id: 'explorer', name: 'Word Explorer', exp: 100, icon: '🔍' },
  { id: 'ace', name: 'Spelling Ace', exp: 250, icon: '🧠' },
  { id: 'hero', name: 'Vocabulary Hero', exp: 500, icon: '🦸' },
  { id: 'master', name: 'Phonics Master', exp: 800, icon: '🎯' },
  { id: 'galactic', name: 'Galactic Speller', exp: 1200, icon: '🌌' }
];

export default function StudentLBLM() {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState({
    totalExp: 0,
    currentLevel: 1,
    completedLevels: [],
    skillLevel: 'beginner',
    weakAreas: {},
    badges: [] // ✅ Will store ALL earned badges
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState(null);
  const [wordBank, setWordBank] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isRemedial, setIsRemedial] = useState(false);
  const [allExcludedWords, setAllExcludedWords] = useState(new Set());
  const verticalOffset = -100;
  const [levelConfig, setLevelConfig] = useState([
    { level: 1, expRequired: 0, expReward: 50, color: 'from-blue-400 to-cyan-400' },
    { level: 2, expRequired: 100, expReward: 75, color: 'from-green-400 to-emerald-400' },
    { level: 3, expRequired: 200, expReward: 100, color: 'from-purple-400 to-pink-400' },
    { level: 4, expRequired: 300, expReward: 125, color: 'from-orange-400 to-red-400' },
    { level: 5, expRequired: 400, expReward: 150, color: 'from-yellow-400 to-amber-400' },
    { level: 6, expRequired: 500, expReward: 175, color: 'from-rose-400 to-pink-400' },
    { level: 7, expRequired: 600, expReward: 200, color: 'from-violet-400 to-purple-400' }
  ]);
  const [levels, setLevels] = useState([]);
  const levelSpacing = 250;

  const speakWord = (word) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.8;
      utterance.pitch = 1.1;
      utterance.lang = 'en-US';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const studentDoc = await getDoc(doc(db, 'students', user.uid));
        if (studentDoc.exists()) {
          const data = studentDoc.data();
          setStudentData({
            totalExp: data.totalExp || 0,
            currentLevel: data.currentLevel || 1,
            completedLevels: data.completedLevels || [],
            skillLevel: data.skillLevel || 'beginner',
            weakAreas: data.weakAreas || {},
            badges: data.badges || [] // ✅ Load ALL saved badges
          });
        }
        const wordBankSnapshot = await getDocs(collection(db, 'wordBank'));
        const words = [];
        wordBankSnapshot.forEach(doc => words.push({ id: doc.id, ...doc.data() }));
        setWordBank(words);
        const updatedConfig = [];
        for (let i = 1; i <= 20; i++) {
          updatedConfig.push({
            level: i,
            expRequired: 100 * (i - 1),
            expReward: 50 + i * 10,
            color: getLevelColor(i)
          });
        }
        setLevelConfig(updatedConfig);
      } catch (_error) {
        console.error("💥 Load error:", _error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStudentData();
  }, []);

  const generateLevels = useCallback(() => {
    const newLevels = [];
    const screenHeight = window.innerHeight - 200;
    const centerY = screenHeight / 2;
    for (let i = 0; i < levelConfig.length; i++) {
      const x = i * levelSpacing;
      const yVariation = screenHeight * 0.3;
      const zigzagOffset = Math.sin(i * 0.8) * yVariation;
      const y = centerY + zigzagOffset + verticalOffset;
      newLevels.push({
        x, y, visualOffset: { x: 0, y: 0 }, ...levelConfig[i]
      });
    }
    setLevels(newLevels);
  }, [levelConfig, verticalOffset]);

  useEffect(() => {
    if (!isLoading) {
      generateLevels();
      setTimeout(() => centerOnLevel(levelConfig[0]), 100);
    }
  }, [levelConfig, isLoading, generateLevels]);

  const centerOnLevel = (level) => {
    if (!containerRef.current) return;
    const levelIndex = level.level - 1;
    const targetX = levelIndex * levelSpacing;
    const containerWidth = window.innerWidth;
    const scrollX = targetX - containerWidth / 2 + 100;
    containerRef.current.scrollTo({ left: scrollX, behavior: 'smooth' });
  };

  // ✅ Level progression based on completedLevels
  const getLevelState = (level) => {
    if (studentData.completedLevels.includes(level.level)) return 'completed';
    if (studentData.completedLevels.includes(level.level - 1)) return 'unlocked';
    return 'locked';
  };

  const handleLevelClick = (level) => {
    const state = getLevelState(level);
    if (state === 'locked') return;
    setSelectedLevel(level);
  };

  const generateQuiz = async (level, excludeWords = new Set()) => {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user");
    const studentDoc = await getDoc(doc(db, 'students', user.uid));
    const studentData = studentDoc.data();
    const weakAreas = studentData.weakAreas || {};
    const levelType = `phonics_level_${level.level}`;
    let candidates = wordBank.filter(w =>
      w.type === levelType &&
      w.phonicsPattern &&
      Array.isArray(weakAreas[levelType]) &&
      weakAreas[levelType].includes(w.phonicsPattern) &&
      !excludeWords.has(w.word)
    );
    if (candidates.length === 0) {
      candidates = wordBank.filter(w => w.type === levelType && !excludeWords.has(w.word));
    }
    if (candidates.length === 0) {
      candidates = wordBank.filter(w => !excludeWords.has(w.word));
    }
    if (candidates.length === 0) {
      console.warn("⚠️ No new words available. Reusing words.");
      candidates = [...wordBank];
    }
    candidates.sort((a, b) => (b.expValue || 10) - (a.expValue || 10));
    const selected = [];
    let totalExp = 0;
    for (const word of candidates) {
      if (totalExp + (word.expValue || 10) <= 100) {
        selected.push(word);
        totalExp += word.expValue || 10;
      }
      if (totalExp === 100) break;
    }
    if (totalExp < 100) {
      const easy = wordBank.filter(w => w.expValue === 10 && !excludeWords.has(w.word));
      while (totalExp < 100 && easy.length > 0) {
        const w = easy.pop();
        if (w) {
          selected.push(w);
          totalExp += 10;
        }
      }
    }
    if (selected.length === 0) throw new Error("No words available");
    return selected.map(w => ({
      word: w.word,
      answer: w.word,
      emoji: w.emoji || '🔤',
      expValue: w.expValue || 10,
      phonicsPattern: w.phonicsPattern || 'N/A',
      type: w.type || 'N/A',
      hint: w.hint || `Starts with "${w.word[0]}", ${w.word.length} letters`
    }));
  };

  const startQuiz = async (level) => {
    console.log('Starting quiz for level:', level.level);
    setQuizFeedback(null);
    setCurrentQuiz(null);
    setCurrentAnswer('');
    setShowFeedback(false);
    setIsCorrect(false);
    setIsRemedial(false);
    setAllExcludedWords(new Set());
    try {
      setStudentData(prev => ({
        ...prev,
        _preQuizTotalExp: prev.totalExp
      }));
      const questions = await generateQuiz(level);
      const newWords = new Set(questions.map(q => q.word));
      setAllExcludedWords(newWords);
      setCurrentQuiz({
        level: level.level,
        questions,
        currentQuestionIndex: 0,
        results: [],
        totalExp: 0,
        score: 0
      });
      setTimeout(() => speakWord(questions[0]?.word), 500);
    } catch (_error) {
      console.error("💥 Quiz gen failed:", _error);
      alert(`Quiz error: ${_error.message}`);
    }
  };

  const handleQuizSubmit = () => {
    if (!currentQuiz) return;
    const q = currentQuiz.questions[currentQuiz.currentQuestionIndex];
    const correct = currentAnswer.toLowerCase().trim() === q.answer.toLowerCase().trim();
    setIsCorrect(correct);
    setShowFeedback(true);
    const newResult = {
      word: q.word,
      userAnswer: currentAnswer,
      correct,
      expValue: q.expValue,
      emoji: q.emoji
    };
    const newResults = [...(currentQuiz.results || []), newResult];
    const newTotalExp = currentQuiz.totalExp + (correct ? q.expValue : 0);
    const newScore = currentQuiz.score + (correct ? 1 : 0);
    setCurrentQuiz(prev => ({
      ...prev,
      results: newResults,
      totalExp: newTotalExp,
      score: newScore
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuiz.currentQuestionIndex === currentQuiz.questions.length - 1) {
      const totalCount = currentQuiz.questions.length;
      const correctCount = currentQuiz.results.filter(r => r.correct).length;
      const scorePercent = (correctCount / totalCount) * 100;
      const isPassing = scorePercent >= 80;

      if (isPassing) {
        setQuizFeedback({ 
          earnedExp: currentQuiz.totalExp, 
          correctCount, 
          totalCount, 
          passed: true, 
          scorePercent 
        });
        setStudentData(prev => ({
          ...prev,
          completedLevels: [...new Set([...prev.completedLevels, currentQuiz.level])]
        }));
      } else {
        setStudentData(prev => ({
          ...prev,
          totalExp: prev._preQuizTotalExp || 0,
        }));
        const currentWords = new Set(currentQuiz.questions.map(q => q.word));
        setAllExcludedWords(prev => new Set([...prev, ...currentWords]));
        setIsRemedial(true);
        setQuizFeedback({ 
          earnedExp: 0, 
          correctCount, 
          totalCount, 
          passed: false, 
          scorePercent 
        });
      }
    } else {
      setCurrentQuiz(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      }));
      setCurrentAnswer('');
      setShowFeedback(false);
      setIsCorrect(false);
      setTimeout(() => {
        const nextQ = currentQuiz.questions[currentQuiz.currentQuestionIndex + 1];
        if (nextQ) speakWord(nextQ.word);
      }, 300);
    }
  };

  const startRemedialQuiz = async () => {
    try {
      const questions = await generateQuiz(
        { level: currentQuiz.level },
        allExcludedWords
      );
      const newWords = new Set(questions.map(q => q.word));
      setAllExcludedWords(prev => new Set([...prev, ...newWords]));
      setCurrentQuiz({
        level: currentQuiz.level,
        questions,
        currentQuestionIndex: 0,
        results: [],
        totalExp: 0,
        score: 0
      });
      setCurrentAnswer('');
      setShowFeedback(false);
      setIsCorrect(false);
      setQuizFeedback(null);
    } catch (_error) {
      alert("Could not generate remedial quiz: " + _error.message);
    }
  };

  // ✅ Helper: get ALL newly earned badges
  const getNewlyEarnedBadges = (oldExp, newExp) => {
    const previouslyEarned = BADGES.filter(b => oldExp >= b.exp);
    const nowEarned = BADGES.filter(b => newExp >= b.exp);
    return nowEarned.filter(b => !previouslyEarned.some(p => p.id === b.id));
  };

  const submitQuiz = async () => {
    if (isSubmitting || !currentQuiz) return;
    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user");

      const missedPatterns = {};
      currentQuiz.results.forEach(r => {
        if (!r.correct) {
          const word = currentQuiz.questions.find(q => q.word === r.word);
          if (word && word.type && word.phonicsPattern) {
            if (!missedPatterns[word.type]) missedPatterns[word.type] = [];
            if (!missedPatterns[word.type].includes(word.phonicsPattern)) {
              missedPatterns[word.type].push(word.phonicsPattern);
            }
          }
        }
      });

      const currentWeakAreas = studentData.weakAreas || {};
      const newWeakAreas = { ...currentWeakAreas };
      Object.keys(missedPatterns).forEach(type => {
        newWeakAreas[type] = [
          ...new Set([
            ...(newWeakAreas[type] || []),
            ...missedPatterns[type]
          ])
        ];
      });

      const oldExp = studentData.totalExp;
      const newExp = oldExp + currentQuiz.totalExp;
      const newlyEarnedBadges = getNewlyEarnedBadges(oldExp, newExp);

      // ✅ Save ALL data, including new badges
      const updates = {
        totalExp: increment(currentQuiz.totalExp),
        completedLevels: arrayUnion(currentQuiz.level),
        weakAreas: newWeakAreas
      };

      if (newlyEarnedBadges.length > 0) {
        const badgeUpdates = newlyEarnedBadges.map(b => ({
          id: b.id,
          unlockedAt: serverTimestamp()
        }));
        // ✅ arrayUnion ensures no duplicates; adds all new badges
        updates.badges = arrayUnion(...badgeUpdates);
      }

      await updateDoc(doc(db, 'students', user.uid), updates);

      // ✅ Activity log
      await addDoc(collection(db, 'students', user.uid, 'activity'), {
        mode: 'quiz',
        level: currentQuiz.level,
        timestamp: serverTimestamp(),
        completed: true,
        score: currentQuiz.results.filter(r => r.correct).length,
        totalQuestions: currentQuiz.questions.length,
        totalExp: currentQuiz.totalExp,
        answers: currentQuiz.results.map(r => ({
          word: r.word,
          userAnswer: r.userAnswer,
          correct: r.correct,
          expValue: r.expValue
        })),
        weakAreasBefore: currentWeakAreas,
        weakAreasAfter: newWeakAreas,
        missedPatterns
      });

      // ✅ Update local state with ALL badges
      setStudentData(prev => {
        const newBadges = [...(prev.badges || [])];
        newlyEarnedBadges.forEach(b => {
          newBadges.push({ id: b.id, unlockedAt: new Date().toISOString() });
        });
        return {
          ...prev,
          totalExp: newExp,
          completedLevels: [...new Set([...prev.completedLevels, currentQuiz.level])],
          weakAreas: newWeakAreas,
          badges: newBadges,
          _preQuizTotalExp: undefined
        };
      });
    } catch (_error) {
      console.error("💥 Save failed:", _error);
      alert("Failed to save progress. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLevelColor = (levelNum) => {
    const colors = [
      'from-blue-400 to-cyan-400',
      'from-green-400 to-emerald-400',
      'from-purple-400 to-pink-400',
      'from-orange-400 to-red-400',
      'from-yellow-400 to-amber-400',
      'from-rose-400 to-pink-400',
      'from-violet-400 to-purple-400'
    ];
    return colors[(levelNum - 1) % colors.length];
  };

  // ✅ Get ALL earned badges (for display)
  const getEarnedBadges = (totalExp) => {
    return BADGES.filter(badge => totalExp >= badge.exp);
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
          <p className="text-white text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-blue-950 overflow-hidden relative">
      <style>{`
        ${styles}
        .animate-spin-slow { animation: spin-slow 16s linear infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>

      <div className={`absolute top-4 left-4 ${selectedLevel || currentQuiz ? 'backdrop-blur-md' : ''} z-40`}>
        <button onClick={() => navigate('/StudentPage')} className={`bg-yellow-400 ${selectedLevel || currentQuiz ? 'bg-opacity-10 hover:bg-opacity-15' : 'bg-opacity-20 hover:bg-opacity-30'} text-white rounded-full p-3 transition-colors shadow-lg`} title="Back to Dashboard">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
      </div>

      {/* Background elements — unchanged */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(150)].map((_, i) => (
          <div key={`star-${i}`} className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s`, animationDuration: `${2 + Math.random() * 3}s`, opacity: 0.3 + Math.random() * 0.7 }} />
        ))}
      </div>
      <div className="absolute top-20 left-0 w-full h-1 pointer-events-none z-10 overflow-hidden">
        <div className="absolute w-2 h-2 bg-white rounded-full blur-sm shadow-lg shadow-white/50 animate-[shoot_4s_ease-in-out_infinite]" style={{ left: '-100px', top: '0' }} />
      </div>
      <div className="absolute animate-[float_6s_ease-in-out_infinite] z-0" style={{ right: '10%', top: '20%' }}>
        <div className="relative">
          <div className="absolute top-12 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[30px] border-r-[30px] border-t-[60px] border-l-transparent border-r-transparent border-t-yellow-400/20 blur-sm" />
          <div className="relative">
            <div className="w-16 h-6 bg-gradient-to-b from-gray-300 to-gray-500 rounded-full shadow-xl" />
            <div className="absolute top-1 left-1/2 -translate-x-1/2 -translate-y-3 w-8 h-6 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-t-full" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 text-xl animate-[wave_0.5s_ease-in-out_infinite]">👽</div>
            <div className="absolute bottom-0 left-1/4 w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
            <div className="absolute bottom-0 right-1/4 w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
          </div>
        </div>
      </div>
      <div className="absolute animate-[float_8s_ease-in-out_infinite] z-0" style={{ left: '8%', bottom: '15%' }}>
        <div className="w-28 h-28 bg-gradient-to-br from-purple-400 via-pink-400 to-purple-600 rounded-full shadow-2xl shadow-purple-500/50 relative overflow-hidden">
          <div className="absolute top-2 left-2 w-6 h-3 bg-white/30 rounded-full transform rotate-45 animate-pulse" style={{ animationDelay: '0s' }}></div>
          <div className="absolute top-6 right-4 w-4 h-2 bg-yellow-200/40 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-8 right-6 w-5 h-2 bg-blue-200/30 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-4 left-4 w-7 h-3 bg-pink-200/35 rounded-full animate-pulse" style={{ animationDelay: '3s' }}></div>
          <div className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-transparent via-white/10 to-transparent" />
        </div>
      </div>
      <div className="absolute z-0" style={{ right: '12%', bottom: '12%' }}>
        <div className="relative animate-[orbit_30s_linear_infinite]">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-600 rounded-full shadow-2xl shadow-gray-500/50 relative overflow-hidden">
            <div className="absolute top-3 left-3 w-3 h-3 bg-gray-600 rounded-full"></div>
            <div className="absolute top-6 right-4 w-2 h-2 bg-gray-700 rounded-full"></div>
            <div className="absolute bottom-6 right-6 w-4 h-4 bg-gray-500 rounded-full"></div>
            <div className="absolute bottom-4 left-4 w-3 h-3 bg-gray-600 rounded-full"></div>
            <div className="absolute top-8 left-6 w-2 h-2 bg-gray-700 rounded-full"></div>
            <div className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-transparent via-white/5 to-transparent" />
          </div>
        </div>
      </div>
      <div className="absolute z-0 animate-spaceship-fly" style={{ left: '-100px', top: '45%' }}>
        <div className="relative">
          <div className="w-16 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full shadow-lg shadow-blue-400/50" />
          <div className="absolute top-1 right-2 w-6 h-4 bg-gradient-to-r from-cyan-300 to-blue-400 rounded-full" />
          <div className="absolute -bottom-1 left-2 w-4 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-t-full" />
          <div className="absolute -bottom-1 right-2 w-4 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-t-full" />
          <div className="absolute -left-2 top-1 w-3 h-4 bg-yellow-300 rounded-full blur-sm animate-pulse" />
        </div>
      </div>

      {/* Header with ALL badges */}
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
            <div className="text-right">
              <div className="flex items-center gap-2 text-2xl font-bold text-yellow-400">
                <Zap className="w-6 h-6 drop-shadow-lg" />
                {studentData.totalExp} EXP
              </div>
              <div className="flex flex-wrap gap-1 mt-1 justify-end">
                {getEarnedBadges(studentData.totalExp).map(badge => (
                  <span 
                    key={badge.id} 
                    className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${
                      badge.id === 'novice' ? 'bg-white text-gray-800 border-gray-300' :
                      badge.id === 'explorer' ? 'bg-[#CD7F32] text-white border-[#A66525]' :
                      badge.id === 'ace' ? 'bg-[#C0C0C0] text-gray-900 border-gray-700' :
                      badge.id === 'hero' ? 'bg-[#FFD700] text-gray-900 border-yellow-600' :
                      badge.id === 'master' ? 'bg-[#9370DB] text-white border-purple-700' :
                      'bg-gradient-to-r from-indigo-600 to-purple-800 text-white border-indigo-500'
                    } shadow-sm`}
                  >
                    {badge.icon} {badge.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="relative w-full h-4 bg-indigo-950/50 rounded-full overflow-hidden border border-purple-500/30">
            <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 transition-all duration-500 rounded-full shadow-lg shadow-yellow-500/50"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}>
              <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Level Map — with centered SVG number */}
      <div ref={containerRef} className="relative overflow-x-auto overflow-y-hidden scrollbar-hide" style={{ marginLeft: '56px', height: 'calc(100vh - 120px)' }}>
        <div className="relative h-full" style={{ width: `${contentWidth}px`, minHeight: 'calc(100vh - 120px)' }}>
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full blur-[120px]"></div>
            <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-blue-500 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-pink-500 rounded-full blur-[120px]"></div>
          </div>
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ height: 'calc(100vh - 120px)' }}>
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
                const state = getLevelState(level);
                const isUnlocked = state === 'completed' || state === 'unlocked';
                const start = { x: level.x + 400 + level.visualOffset.x, y: level.y + 100 + level.visualOffset.y };
                const end = { x: levels[index + 1].x + 400 + levels[index + 1].visualOffset.x, y: levels[index + 1].y + 100 + levels[index + 1].visualOffset.y };
                const midX = (start.x + end.x) / 2;
                const midY = (start.y + end.y) / 2;
                const controlY = midY - 30;
                return (
                  <path key={`path-${index}`} d={`M ${start.x} ${start.y} Q ${midX} ${controlY} ${end.x} ${end.y}`}
                    stroke={isUnlocked ? "url(#pathGradient)" : "#1E3A8A"}
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={isUnlocked ? "none" : "8 8"}
                    strokeLinecap="round"
                    filter={isUnlocked ? "url(#glow)" : "none"} />
                );
              }
              return null;
            })}
          </svg>
          {levels.map((level, index) => {
            const state = getLevelState(level);
            const isLocked = state === 'locked';
            const isCompleted = state === 'completed';
            return (
              <div key={`level-${index}`} className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-125'}`}
                style={{ left: `${level.x + 400}px`, top: `${level.y + 100}px` }} onClick={() => handleLevelClick(level)}>
                {!isLocked && <div className={`absolute inset-0 bg-gradient-to-br ${level.color} rounded-full blur-2xl opacity-70 scale-150 animate-pulse`}></div>}
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <polygon points="50,5 61,35 92,35 67,55 78,85 50,65 22,85 33,55 8,35 39,35"
                      className={`${isLocked ? 'fill-gray-600 stroke-gray-700' : 'fill-yellow-400 stroke-yellow-300'}`} strokeWidth="2"
                      style={{ filter: !isLocked ? 'drop-shadow(0 0 10px rgba(250, 204, 21, 0.8))' : 'none' }} />
                    <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fontSize="30" fontWeight="bold" fill={isLocked ? "#9CA3AF" : "#000"}>{level.level}</text>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {isLocked && <Lock className="w-8 h-8 text-gray-300" />}
                    {isCompleted && <CheckCircle className="w-8 h-8 text-white drop-shadow-lg" />}
                  </div>
                </div>
                {isLocked && <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-red-400">{level.expRequired} EXP</div>}
                {isCompleted && <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 flex gap-1">
                  {[...Array(3)].map((_, i) => <span key={i} className="text-2xl animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>✨</span>)}
                </div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Level Details Modal */}
      {selectedLevel && !currentQuiz && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setSelectedLevel(null)} />
          <div className="fixed bg-gradient-to-br from-indigo-900 to-purple-950 rounded-3xl shadow-2xl border-4 border-yellow-400/50 p-8 w-96 z-50 animate-in fade-in zoom-in duration-300" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <button onClick={() => setSelectedLevel(null)} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-indigo-800 hover:bg-indigo-700 transition-colors text-xl font-bold text-white border-2 border-purple-400">✕</button>
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <polygon points="50,5 61,35 92,35 67,55 78,85 50,65 22,85 33,55 8,35 39,35" className="fill-yellow-400 stroke-yellow-300" strokeWidth="2" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Level {selectedLevel.level}</h2>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {getEarnedBadges(studentData.totalExp).length > 0 ? (
                  <span className={`text-xs px-3 py-1 rounded-full border ${
                    getEarnedBadges(studentData.totalExp)[getEarnedBadges(studentData.totalExp).length - 1].id === 'novice' ? 'bg-white text-gray-800 border-gray-300' :
                    getEarnedBadges(studentData.totalExp)[getEarnedBadges(studentData.totalExp).length - 1].id === 'explorer' ? 'bg-[#CD7F32] text-white border-[#A66525]' :
                    getEarnedBadges(studentData.totalExp)[getEarnedBadges(studentData.totalExp).length - 1].id === 'ace' ? 'bg-[#C0C0C0] text-gray-900 border-gray-700' :
                    getEarnedBadges(studentData.totalExp)[getEarnedBadges(studentData.totalExp).length - 1].id === 'hero' ? 'bg-[#FFD700] text-gray-900 border-yellow-600' :
                    getEarnedBadges(studentData.totalExp)[getEarnedBadges(studentData.totalExp).length - 1].id === 'master' ? 'bg-[#9370DB] text-white border-purple-700' :
                    'bg-gradient-to-r from-indigo-600 to-purple-800 text-white border-indigo-500'
                  } shadow-sm`}>
                    🏆 {getEarnedBadges(studentData.totalExp)[getEarnedBadges(studentData.totalExp).length - 1].name}
                  </span>
                ) : (
                  <span className="text-xs px-3 py-1 rounded-full bg-gray-200 text-gray-800 border border-gray-300">🌱 Novice Speller</span>
                )}
                <span className="text-xs px-3 py-1 rounded-full bg-indigo-800/50 text-yellow-300 border border-indigo-600">
                  <Zap className="w-3 h-3 inline mr-1" /> {studentData.totalExp} EXP
                </span>
              </div>
            </div>
            {getLevelState(selectedLevel) === 'completed' ? (
              <div className="space-y-3">
                <div className="bg-green-600/30 border-2 border-green-400 rounded-2xl p-4 text-center backdrop-blur-sm">
                  <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-2" />
                  <p className="text-green-200 font-bold text-lg">Completed!</p>
                </div>
                <button onClick={() => startQuiz(selectedLevel)} className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-xl rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all border-2 border-cyan-300">Practice Again</button>
              </div>
            ) : (
              <button onClick={() => startQuiz(selectedLevel)} className="w-full py-5 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 text-indigo-900 font-bold text-2xl rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all border-2 border-yellow-300">Start Quest! 🚀</button>
            )}
          </div>
        </>
      )}

      {/* Quiz Modal */}
      {currentQuiz && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => {
            setCurrentQuiz(null);
            setSelectedLevel(null);
            setQuizFeedback(null);
            setCurrentAnswer('');
            setShowFeedback(false);
          }} />
          <div className="fixed bg-gradient-to-br from-indigo-900 to-purple-950 rounded-3xl shadow-2xl border-4 border-yellow-400/50 p-6 sm:p-8 w-11/12 max-w-md md:max-w-lg z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <button onClick={() => {
              setCurrentQuiz(null);
              setSelectedLevel(null);
              setQuizFeedback(null);
              setCurrentAnswer('');
              setShowFeedback(false);
            }} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-indigo-800 hover:bg-indigo-700 transition-colors text-xl font-bold text-white border-2 border-purple-400">✕</button>

            {!showFeedback && !quizFeedback ? (
              <div className="text-center">
                <div className="mb-6">
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    currentQuiz.questions[currentQuiz.currentQuestionIndex].expValue === 10 ? 'bg-green-500/20 text-green-300' :
                    currentQuiz.questions[currentQuiz.currentQuestionIndex].expValue === 15 ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {currentQuiz.questions[currentQuiz.currentQuestionIndex].expValue === 10 ? 'Easy' :
                     currentQuiz.questions[currentQuiz.currentQuestionIndex].expValue === 15 ? 'Medium' : 'Hard'} • {currentQuiz.questions[currentQuiz.currentQuestionIndex].expValue} EXP
                  </div>
                </div>
                <h2 className="text-xl text-purple-200 mb-2">
                  {isRemedial ? 'Remedial Quiz: Level' : 'Level'} {currentQuiz.level}
                </h2>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Question {currentQuiz.currentQuestionIndex + 1} of {currentQuiz.questions.length}
                </h3>
                <div className="bg-indigo-800/30 rounded-3xl p-6 mb-6">
                  <div className="text-7xl mb-4">{currentQuiz.questions[currentQuiz.currentQuestionIndex].emoji}</div>
                </div>
                <button onClick={() => speakWord(currentQuiz.questions[currentQuiz.currentQuestionIndex].word)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all shadow-lg mb-4">
                  <Volume2 className="w-8 h-8 mx-auto" />
                  <span className="text-sm mt-1 block">Listen</span>
                </button>
                <input type="text" value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)}
                  onKeyPress={(e) => { if (e.key === 'Enter' && currentAnswer.trim()) handleQuizSubmit(); }}
                  placeholder="Type your answer..."
                  className="w-full px-4 py-3 text-lg text-center bg-indigo-900/80 border border-purple-500 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  autoFocus autoComplete="off" />
                <button onClick={handleQuizSubmit} disabled={!currentAnswer.trim()}
                  className="mt-4 w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-indigo-900 font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50">
                  Submit
                </button>
              </div>
            ) : showFeedback && !quizFeedback ? (
              <div className="text-center">
                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  {isCorrect ? <Check className="w-16 h-16 text-green-300" /> : <X className="w-16 h-16 text-red-300" />}
                </div>
                <h2 className={`text-2xl font-bold mb-2 ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
                  {isCorrect ? 'Correct! 🎉' : 'Try again! 💪'}
                </h2>
                <div className="bg-indigo-800/30 rounded-2xl p-4 mb-4">
                  <div className="text-6xl mb-2">{currentQuiz.questions[currentQuiz.currentQuestionIndex].emoji}</div>
                  <p className="text-purple-300 mb-1">The word is:</p>
                  <p className="text-3xl font-bold text-white">{currentQuiz.questions[currentQuiz.currentQuestionIndex].word}</p>
                  {!isCorrect && <p className="text-sm text-purple-300 mt-2">You wrote: <span className="text-yellow-300">{currentAnswer}</span></p>}
                  {isCorrect && <p className="text-sm text-green-300 mt-2">+{currentQuiz.questions[currentQuiz.currentQuestionIndex].expValue} EXP</p>}
                </div>
                <button onClick={handleNextQuestion}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                  {currentQuiz.currentQuestionIndex === currentQuiz.questions.length - 1 
                    ? (isRemedial ? 'Finish Remedial 🎯' : 'See Results 🎯') 
                    : 'Next ➔'}
                </button>
              </div>
            ) : quizFeedback ? (
              <div className="text-center">
                {!quizFeedback.passed && (
                  <div className="bg-orange-500/20 border-2 border-orange-400 rounded-2xl p-3 mb-4">
                    <p className="text-orange-200">
                      🌟 You scored {quizFeedback.scorePercent.toFixed(0)}% — let’s try the remedial quiz!
                    </p>
                  </div>
                )}
                <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto flex items-center justify-center mb-6">
                  <span className="text-6xl">{quizFeedback.passed ? '🎉' : '💡'}</span>
                </div>
                <h1 className="text-4xl font-bold mb-2 text-white">
                  {quizFeedback.passed ? 'Great Job!' : 'Almost There!'}
                </h1>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-blue-50/10 rounded-2xl p-6 text-center">
                    <p className="text-purple-300 text-sm mb-2">Score</p>
                    <p className="text-3xl font-bold text-blue-400">{quizFeedback.correctCount}/{quizFeedback.totalCount}</p>
                  </div>
                  <div className="bg-purple-50/10 rounded-2xl p-6 text-center">
                    <p className="text-purple-300 text-sm mb-2">Total Exp</p>
                    <p className="text-3xl font-bold text-purple-400">{quizFeedback.earnedExp}</p>
                  </div>
                  <div className="bg-green-50/10 rounded-2xl p-6 text-center">
                    <p className="text-purple-300 text-sm mb-2">Level</p>
                    <p className="text-3xl font-bold text-green-400">{currentQuiz.level}</p>
                  </div>
                </div>
                {quizFeedback.passed ? (
                  <button onClick={() => {
                    submitQuiz();
                    setCurrentQuiz(null);
                    setSelectedLevel(null);
                    setQuizFeedback(null);
                  }} className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl text-xl font-bold hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all shadow-lg">
                    Continue Learning! 🚀
                  </button>
                ) : (
                  <button onClick={startRemedialQuiz}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-2xl text-xl font-bold hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all shadow-lg">
                    Try Remedial Quiz! 💪
                  </button>
                )}
              </div>
            ) : null}

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className={`h-2 rounded-full ${
                  isRemedial ? 'bg-gradient-to-r from-orange-400 to-red-500' : 'bg-gradient-to-r from-yellow-400 to-orange-500'
                }`} style={{ 
                  width: `${Math.min(
                    ((currentQuiz.currentQuestionIndex + (showFeedback ? 1 : 0)) / currentQuiz.questions.length) * 100,
                    100
                  )}%` 
                }} />
              </div>
              <div className="flex justify-between text-xs text-purple-300 mt-1">
                <span>
                  {currentQuiz.currentQuestionIndex + (showFeedback ? 1 : 0)} / {currentQuiz.questions.length}
                </span>
                <span>Total EXP: {currentQuiz.totalExp}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Legend */}
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
            <CheckCircle className="w-5 h-5 text-white absolute" />
          </div>
          <span className="text-sm font-semibold text-green-300">Completed</span>
        </div>
      </div>
    </div>
  );
}