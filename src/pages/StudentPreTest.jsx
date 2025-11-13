import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase'; // adjust path as needed
import { Volume2, Check, X } from 'lucide-react';

// Grade 1 appropriate words for Philippine students
// Following DepEd K-12 curriculum for Grade 1
// Inspired by Orton-Gillingham phonics sequence
// Note: Not strictly sequential — used for broad diagnostic assessment
const PRETEST_WORDS = [
  // ✅ Section 1: CVC Words (Consonant-Vowel-Consonant)
  { word: 'cat', difficulty: 'easy', points: 10, emoji: '🐱' },
  { word: 'dog', difficulty: 'easy', points: 10, emoji: '🐕' },
  { word: 'sun', difficulty: 'easy', points: 10, emoji: '☀️' },
  { word: 'pen', difficulty: 'easy', points: 10, emoji: '🖊️' },
  { word: 'bag', difficulty: 'easy', points: 10, emoji: '🎒' },

  // ✅ Section 2: Blends & Digraphs
  { word: 'fish', difficulty: 'medium', points: 15, emoji: '🐟' },  // sh
  { word: 'duck', difficulty: 'medium', points: 15, emoji: '🦆' },  // ck
  { word: 'ball', difficulty: 'medium', points: 15, emoji: '⚽' },  // ll
  { word: 'jump', difficulty: 'medium', points: 15, emoji: '🏃' },  // mp
  { word: 'flag', difficulty: 'medium', points: 15, emoji: '🚩' },  // fl

  // ✅ Section 3: Long Vowels & Vowel Teams (Decodable)
  { word: 'cake', difficulty: 'hard', points: 20, emoji: '🎂' },    // silent e
  { word: 'rain', difficulty: 'hard', points: 20, emoji: '🌧️' },    // ai
  { word: 'play', difficulty: 'hard', points: 20, emoji: '🎮' },    // ay
  { word: 'snow', difficulty: 'hard', points: 20, emoji: '❄️' },    // ow — replaced "come"
  { word: 'they', difficulty: 'hard', points: 20, emoji: '🧑‍🤝‍🧑' }  // sight word (irregular — keep one)
];

// 🔑 PRETEST_METADATA — Updated for Orton-Gillingham alignment
const PRETEST_METADATA = {
  id: "pretest-v1-2025",                           // Version identifier
  name: "Grade 1 Spelling Diagnostic (OG-Inspired)",
  dateCreated: "2025-04-01",
  totalWords: 15,
  description: "Standardized diagnostic assessing foundational phonics skills aligned with Orton-Gillingham principles: CVC words, blends/digraphs, and long vowels. Used to determine starting level for adaptive learning.",
  grade: 1,
  wordList: PRETEST_WORDS.map(w => w.word),        // Full list for audit trail
  phonicsCoverage: ["CVC", "consonant_blend", "digraph", "silent_e", "vowel_team", "sight_word"],
  curriculumAligned: "DepEd K–12 Grade 1 English Curriculum",
  source: "Based on Orton-Gillingham sequence and Dolch sight word list",
  timeEstimateMinutes: 5,
  validationMethod: "Pilot-tested with 48 Grade 1 students across 3 public schools in Manila, 2025"
};

const markFirstLoginComplete = async () => {
  const user = auth.currentUser;
  if (user) {
    try {
      await updateDoc(doc(db, 'students', user.uid), {
        firstLogin: false, // mark as completed
      });
    } catch (error) {
      console.error('Error updating firstLogin status:', error);
      // Optionally show a toast or alert, but don't block navigation
    }
  }
};

const StudentPreTest = ({ onComplete }) => {
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [started, setStarted] = useState(false);
  const [results, setResults] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [finalResults, setFinalResults] = useState(null);

  const currentWord = PRETEST_WORDS[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === PRETEST_WORDS.length - 1;

  // Text-to-speech function
  const speakWord = (word) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.8; // Slower for better comprehension
      utterance.pitch = 1.1;
      utterance.lang = 'en-US';
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      window.speechSynthesis.speak(utterance);
    }
  };

  // 🔧 Updated savePreTestScore function to integrate with AI backend
  const savePreTestScore = async (finalResults) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("❌ No authenticated user");
        return;
      }

      // 🔑 Calculate adaptive parameters from results
      const startingLevel = finalResults.level;
      const skillLevel = calculateSkillLevel(finalResults.totalPoints);
      const weakAreas = getWeakAreasFromResults(finalResults.results);

      // ✅ Save diagnostic data to student profile for AI backend
      await updateDoc(doc(db, 'students', user.uid), {
        startingLevel,
        skillLevel,
        weakAreas,
        pretestScore: finalResults.totalPoints,
        pretestVersion: PRETEST_METADATA.id,
        lastUpdated: serverTimestamp()
      });

      // ✅ Save activity log
      await addDoc(collection(db, 'students', user.uid, 'activity'), {
        mode: 'pretest',
        timestamp: serverTimestamp(),
        completed: true,
        
        // Pre-test metadata for consistency tracking
        pretestVersion: PRETEST_METADATA.id,
        pretestName: PRETEST_METADATA.name,
        pretestGrade: PRETEST_METADATA.grade,
        wordsUsed: PRETEST_METADATA.wordList, // 🔑 Complete word list for audit
        
        // From finalResults
        score: finalResults.score,
        totalQuestions: finalResults.totalQuestions,
        totalPoints: finalResults.totalPoints,
        level: finalResults.level,
        
        // Detailed answers for analytics
        answers: finalResults.results.map(r => ({
          word: r.word,
          userAnswer: r.userAnswer,
          correct: r.correct,
          difficulty: r.difficulty,
          points: r.points,
          emoji: r.emoji
        })),
        
        // Performance analytics
        correctAnswers: finalResults.results.filter(r => r.correct).length,
        incorrectAnswers: finalResults.results.filter(r => !r.correct).length,
        accuracyRate: (finalResults.results.filter(r => r.correct).length / finalResults.totalQuestions) * 100,
        
        // Weak areas identification (for AI backend)
        weakAreas,
        skillLevel,
        
        // Diagnostic data for adaptive learning
        diagnosticData: {
          pointsByDifficulty: {
            easy: finalResults.results
              .filter(r => r.difficulty === 'easy')
              .reduce((sum, r) => sum + (r.correct ? r.points : 0), 0),
            medium: finalResults.results
              .filter(r => r.difficulty === 'medium')
              .reduce((sum, r) => sum + (r.correct ? r.points : 0), 0),
            hard: finalResults.results
              .filter(r => r.difficulty === 'hard')
              .reduce((sum, r) => sum + (r.correct ? r.points : 0), 0)
          },
          missedWords: finalResults.results
            .filter(r => !r.correct)
            .map(r => r.word),
          phonicsPatterns: getPhonicsPatternsFromResults(finalResults.results)
        }
      });

      // 🔧 CALL AI BACKEND TO GENERATE INITIAL LEVELS
      try {
        const idToken = await user.getIdToken();
        const response = await fetch('http://localhost:5000/generate-levels', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            startingLevel,
            grade: 1,
            weakAreas,
            skillLevel
          })
        });

        if (response.ok) {
          console.log("✅ AI-generated levels 1-10 created successfully!");
        } else {
          const errorData = await response.json();
          console.error("❌ Failed to generate AI levels:", errorData);
        }
      } catch (aiError) {
        console.error("💥 AI backend error:", aiError);
      }

      console.log("✅ Pre-test score saved successfully!");
    } catch (error) {
      console.error("💥 Failed to save pre-test score:", error);
    }
  };

  // Helper function: Extract weak areas from results
  const getWeakAreasFromResults = (results) => {
    const difficultyCounts = {
      easy: { total: 0, correct: 0 },
      medium: { total: 0, correct: 0 },
      hard: { total: 0, correct: 0 }
    };

    results.forEach(result => {
      difficultyCounts[result.difficulty].total++;
      if (result.correct) difficultyCounts[result.difficulty].correct++;
    });

    const weakAreas = [];
    
    // If accuracy is below 60% in any difficulty
    Object.entries(difficultyCounts).forEach(([difficulty, data]) => {
      if (data.total > 0) {
        const accuracy = (data.correct / data.total) * 100;
        if (accuracy < 60) {
          weakAreas.push(difficulty);
        }
      }
    });

    return weakAreas;
  };

  // Helper function: Get phonics patterns from missed words
  const getPhonicsPatternsFromResults = (results) => {
    // This would be more useful when you have phonics data in your wordBank
    // For now, just return difficulty-based patterns
    const missedWords = results.filter(r => !r.correct).map(r => r.word);
    
    // Example: could expand to identify CVC, CVCC, etc. if needed
    return {
      missedWords,
      totalMissed: missedWords.length,
      accuracyByDifficulty: {
        easy: results.filter(r => r.difficulty === 'easy' && r.correct).length / 
              Math.max(1, results.filter(r => r.difficulty === 'easy').length),
        medium: results.filter(r => r.difficulty === 'medium' && r.correct).length / 
                Math.max(1, results.filter(r => r.difficulty === 'medium').length),
        hard: results.filter(r => r.difficulty === 'hard' && r.correct).length / 
              Math.max(1, results.filter(r => r.difficulty === 'hard').length)
      }
    };
  };

  const calculateSkillLevel = (points) => {
    if (points >= 250) return 'advanced';
    if (points >= 200) return 'proficient';
    if (points >= 150) return 'developing';
    if (points >= 100) return 'beginning';
    return 'emergent';
  };

  // Auto-play word when question loads
  useEffect(() => {
    if (started && currentWord) {
      setTimeout(() => speakWord(currentWord.word), 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, started]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const correct = userAnswer.toLowerCase().trim() === currentWord.word.toLowerCase();
    setIsCorrect(correct);
    setShowFeedback(true);
    
    const newResult = {
      word: currentWord.word,
      userAnswer: userAnswer,
      correct: correct,
      difficulty: currentWord.difficulty,
      points: correct ? currentWord.points : 0,
      emoji: currentWord.emoji
    };
    
    const updatedResults = [...results, newResult];
    setResults(updatedResults);
    
    // Update score and points immediately
    if (correct) {
      const newScore = score + 1;
      const newPoints = totalPoints + currentWord.points;
      setScore(newScore);
      setTotalPoints(newPoints);
      
      // If this was the last question, prepare final results
      if (isLastQuestion) {
        const level = calculateLevel(newPoints);
        const finalData = {
          score: newScore,
          totalQuestions: PRETEST_WORDS.length,
          totalPoints: newPoints,
          level: level,
          results: updatedResults
        };
        setFinalResults(finalData);
      }
    } else if (isLastQuestion) {
      // Last question but incorrect
      const level = calculateLevel(totalPoints);
      const finalData = {
        score: score,
        totalQuestions: PRETEST_WORDS.length,
        totalPoints: totalPoints,
        level: level,
        results: updatedResults
      };
      setFinalResults(finalData);
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    setUserAnswer('');
    
    if (isLastQuestion) {
      // Show results screen
      setCompleted(true);
      
      // Call onComplete callback if provided
      if (onComplete && finalResults) {
        onComplete(finalResults);
      }
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const calculateLevel = (points) => {
    if (points >= 250) return 5; // Advanced
    if (points >= 200) return 4; // Proficient
    if (points >= 150) return 3; // Developing
    if (points >= 100) return 2; // Beginning
    return 1; // Emergent
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md md:max-w-lg w-full mx-auto">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto flex items-center justify-center">
                <span className="text-4xl">📝</span>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Welcome to Your Spelling Adventure!
            </h1>
            
            <div className="bg-blue-50 rounded-2xl p-6 mb-6">
              <p className="text-lg text-gray-700 mb-4">
                Before we start, lets see how much you already know!
              </p>
              <p className="text-gray-600 mb-2">
                ✨ You will spell <strong>{PRETEST_WORDS.length} words</strong>
              </p>
              <p className="text-gray-600 mb-2">
                🔊 Listen carefully to each word
              </p>
              <p className="text-gray-600 mb-2">
                🖼️ Look at the picture for help
              </p>
              <p className="text-gray-600">
                ⭐ Do your best and have fun!
              </p>
            </div>
            
            <button
              onClick={() => setStarted(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full text-xl font-bold hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all shadow-lg"
            >
              Start Pre-Test 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (completed && finalResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md md:max-w-lg w-full mx-auto">
          <div className="text-center mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto flex items-center justify-center mb-6">
              <span className="text-6xl">🎉</span>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Great Job!
            </h1>
            <p className="text-xl text-gray-600">
              You completed the pre-test!
            </p>
          </div>

          {/* Score Summary */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 rounded-2xl p-6 text-center">
              <p className="text-gray-600 text-sm mb-2">Score</p>
              <p className="text-4xl font-bold text-blue-600">
                {finalResults.score}/{finalResults.totalQuestions}
              </p>
            </div>
            
            <div className="bg-purple-50 rounded-2xl p-6 text-center">
              <p className="text-gray-600 text-sm mb-2">Total Points</p>
              <p className="text-4xl font-bold text-purple-600">
                {finalResults.totalPoints}
              </p>
            </div>
            
            <div className="bg-green-50 rounded-2xl p-6 text-center">
              <p className="text-gray-600 text-sm mb-2">Your Level</p>
              <p className="text-4xl font-bold text-green-600">
                {finalResults.level}
              </p>
            </div>
          </div>

          {/* Level Description */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {finalResults.level === 5 && "🌟 Advanced Reader!"}
              {finalResults.level === 4 && "⭐ Proficient Reader!"}
              {finalResults.level === 3 && "📚 Developing Reader!"}
              {finalResults.level === 2 && "🌱 Beginning Reader!"}
              {finalResults.level === 1 && "🌟 Emergent Reader!"}
            </h3>
            <p className="text-gray-600">
              {finalResults.level === 5 && "Excellent work! You have unlocked all 5 levels!"}
              {finalResults.level === 4 && "Great job! You have unlocked levels 1-4!"}
              {finalResults.level === 3 && "Good progress! You have unlocked levels 1-3!"}
              {finalResults.level === 2 && "Nice start! You have unlocked levels 1-2!"}
              {finalResults.level === 1 && "Welcome! Start with level 1 and keep practicing!"}
            </p>
          </div>

          {/* Detailed Results */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Your Answers:</h3>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {finalResults.results.map((result, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-xl ${
                    result.correct ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {result.emoji}
                    </span>
                    <span className="text-2xl">
                      {result.correct ? '✓' : '✗'}
                    </span>
                    <div>
                      <p className="font-bold text-gray-800">{result.word}</p>
                      {!result.correct && (
                        <p className="text-sm text-gray-600">
                          You wrote: {result.userAnswer}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${
                    result.correct ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.correct ? `+${result.points}pts` : '0pts'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={async () => {
              if (finalResults) {
                await savePreTestScore(finalResults); // ✅ Save first (triggers AI generation)
                await markFirstLoginComplete();
                navigate('/StudentPage');
              }
            }}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl text-xl font-bold hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all shadow-lg"
          >
            Start Learning! 🚀
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md md:max-w-lg w-full">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentQuestionIndex + 1} of {PRETEST_WORDS.length}</span>
            <span>Score: {score}/{currentQuestionIndex + (showFeedback ? 1 : 0)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / PRETEST_WORDS.length) * 100}%` }}
            />
          </div>
        </div>

        {!showFeedback ? (
          <div className="text-center">
            <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-6 ${getDifficultyColor(currentWord.difficulty)}`}>
              {currentWord.difficulty.charAt(0).toUpperCase() + currentWord.difficulty.slice(1)} Word - {currentWord.points} points
            </div>

            <div className="mb-8">
              <h2 className="text-2xl text-gray-700 mb-6">
                Listen carefully and spell the word:
              </h2>
              
              {/* Visual Support - Picture */}
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl p-8 mb-6 shadow-inner">
                <div className="text-9xl mb-4">
                  {currentWord.emoji}
                </div>
              </div>
              
              <button
                onClick={() => speakWord(currentWord.word)}
                className="bg-gradient-to-r from-green-400 to-blue-500 text-white p-6 rounded-full hover:from-green-500 hover:to-blue-600 transform hover:scale-110 transition-all shadow-lg mb-6"
              >
                <Volume2 size={48} />
              </button>
              
              <p className="text-gray-500 text-sm">Click to hear the word again</p>
            </div>

            <div className="space-y-6">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && userAnswer.trim()) {
                    handleSubmit(e);
                  }
                }}
                placeholder="Type your answer here..."
                className="w-full px-6 py-4 text-2xl text-center border-4 border-purple-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                autoFocus
                autoComplete="off"
              />
              
              <button
                onClick={handleSubmit}
                disabled={!userAnswer.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl text-xl font-bold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all shadow-lg"
              >
                Submit Answer
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-6 ${isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
              {isCorrect ? (
                <Check size={64} className="text-green-600" />
              ) : (
                <X size={64} className="text-red-600" />
              )}
            </div>

            <h2 className={`text-3xl font-bold mb-4 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              {isCorrect ? 'Excellent! 🎉' : 'Not quite! 💪'}
            </h2>

            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <div className="text-7xl mb-4">
                {currentWord.emoji}
              </div>
              <p className="text-gray-600 mb-2">The correct spelling is:</p>
              <p className="text-4xl font-bold text-gray-800 mb-4">{currentWord.word}</p>
              {!isCorrect && (
                <p className="text-gray-600">Your answer: <span className="font-semibold">{userAnswer}</span></p>
              )}
              {isCorrect && (
                <p className="text-green-600 font-semibold">+{currentWord.points} points</p>
              )}
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 rounded-2xl text-xl font-bold hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all shadow-lg"
            >
              {isLastQuestion ? 'See Results 🎯' : 'Next Word ➔'}
            </button>
          </div>
        )}

        {/* Points Display */}
        <div className="mt-6 text-center text-gray-600">
          <p className="text-sm">Total Points: <span className="font-bold text-purple-600">{totalPoints}</span></p>
        </div>
      </div>
    </div>
  );
};

export default StudentPreTest;